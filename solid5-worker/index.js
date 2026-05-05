

// ─── CORS helper ─────────────────────────────────────────────────────────────
function cors(env) {
  const origin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status = 200, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env) },
  });
}

function err(msg, status = 400, env) {
  return json({ error: msg }, status, env);
}

// ─── Firebase ID token verification ──────────────────────────────────────────
// Verifies the JWT issued by Firebase Auth using Google's public keys.
async function verifyFirebaseToken(idToken, projectId) {
  // 1. Fetch Google's public keys
  const keysRes = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  const keys = await keysRes.json();

  // 2. Decode header to find the key ID (kid)
  const [headerB64] = idToken.split(".");
  const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")));
  const certPem = keys[header.kid];
  if (!certPem) throw new Error("Unknown key ID");

  // 3. Import the public key
  const certDer = pemToDer(certPem);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    certDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // 4. Verify signature
  const [, payloadB64, sigB64] = idToken.split(".");
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(sigB64);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signingInput);
  if (!valid) throw new Error("Invalid token signature");

  // 5. Verify claims
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.aud !== projectId) throw new Error("Wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Wrong issuer");

  return payload; // { uid, email, ... }
}

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  return base64UrlDecode(b64, false);
}

function base64UrlDecode(str, urlSafe = true) {
  let b64 = urlSafe ? str.replace(/-/g, "+").replace(/_/g, "/") : str;
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) throw new Error("Missing Authorization header");
  const payload = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  return payload; // contains uid, email
}

// ─── Route: POST /api/analyze ─────────────────────────────────────────────────
async function handleAnalyze(request, env) {
  // 1. Verify caller is authenticated
  let caller;
  try {
    caller = await requireAuth(request, env);
  } catch (e) {
    return err(`Unauthorized: ${e.message}`, 401, env);
  }

  // 2. Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400, env);
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== "string") {
    return err("Missing prompt field", 400, env);
  }

const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
  messages: [
    { role: "system", content: "You are a phishing/fraud detection AI. Return only valid JSON." },
    { role: "user",   content: prompt },
  ],
  max_tokens: 1000,
});
const text = aiResponse.response ?? "";
let parsed;
try {
  parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  if (parsed.risk === "high") {
    dispatchWebhooks(parsed, body.emailMeta || {}, env).catch(() => {});
  }
} catch {
  parsed = { error: "parse_failed", raw: text };
}
return json(parsed, 200, env);
}

// ─── Webhook dispatcher ───────────────────────────────────────────────────────
async function dispatchWebhooks(result, emailMeta, env) {
  const promises = [];

  // Slack
  if (env.SLACK_WEBHOOK_URL) {
    const slackPayload = {
      text: `🚨 *Solid5Shield HIGH RISK Detection*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🚨 HIGH RISK — ${result.attack_type || "Suspicious Sender"}*\n*From:* \`${emailMeta.from || "unknown"}\`\n*Subject:* ${emailMeta.subject || "—"}\n*Verdict:* ${result.verdict}`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Confidence:*\n${result.confidence}%` },
            { type: "mrkdwn", text: `*Action:*\n${(result.recommended_action || "review").toUpperCase()}` },
            { type: "mrkdwn", text: `*Similarity:*\n${result.similarity_score}%` },
            { type: "mrkdwn", text: `*Time:*\n${new Date().toISOString()}` },
          ],
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Assessment:* ${result.explanation}` },
        },
      ],
    };
    promises.push(
      fetch(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload),
      })
    );
  }

  // Generic SIEM webhook (Splunk HEC, etc.)
  if (env.SIEM_WEBHOOK_URL) {
    const siemEvent = {
      time: Math.floor(Date.now() / 1000),
      event: {
        source: "solid5shield",
        severity: result.risk,
        from: emailMeta.from,
        subject: emailMeta.subject,
        attack_type: result.attack_type,
        confidence: result.confidence,
        verdict: result.verdict,
        recommended_action: result.recommended_action,
      },
    };
    promises.push(
      fetch(env.SIEM_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env.SIEM_TOKEN ? { Authorization: `Splunk ${env.SIEM_TOKEN}` } : {}),
        },
        body: JSON.stringify(siemEvent),
      })
    );
  }

  await Promise.allSettled(promises);
}

// ─── Route: POST /api/webhook/dispatch ───────────────────────────────────────
async function handleWebhookDispatch(request, env) {
  try {
    await requireAuth(request, env);
  } catch (e) {
    return err(`Unauthorized: ${e.message}`, 401, env);
  }

  const body = await request.json();
  await dispatchWebhooks(body.result || {}, body.emailMeta || {}, env);
  return json({ ok: true }, 200, env);
}



// ─── OAuth: Microsoft ─────────────────────────────────────────────────────────
function handleMsStart(request, env) {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  const state = btoa(JSON.stringify({ uid, provider: "ms365" }));

  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    response_type: "code",
   redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/ms/callback`,
    response_mode: "query",
    scope: "Mail.Read Mail.ReadBasic offline_access User.Read",
    state,
  });
  return Response.redirect(
    `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/authorize?${params}`,
    302
  );
}

async function handleMsCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (url.searchParams.get("error")) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=google_denied`, 302);
  }

  const { uid } = JSON.parse(atob(state));

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.MS_CLIENT_ID,
        client_secret: env.MS_CLIENT_SECRET,
        code,
        redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/ms/callback`,
        grant_type: "authorization_code",
      }),
    }
  );
  const tokens = await tokenRes.json();
  if (tokens.error) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=token_exchange`, 302);
  }
  await saveTokensToFirestore(uid, "ms365", tokens, env);
  return Response.redirect(`${env.ALLOWED_ORIGIN}?connected=ms365`, 302);
}

// ─── OAuth: Google ────────────────────────────────────────────────────────────
function handleGoogleStart(request, env) {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  const state = btoa(JSON.stringify({ uid, provider: "gmail" }));

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302
  );
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // Handle user denying permission
  if (url.searchParams.get("error")) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=google_denied`, 302);
  }

  const { uid } = JSON.parse(atob(state));

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/google/callback`,
      grant_type:   "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  // Check for token exchange error
  if (tokens.error) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=token_exchange`, 302);
  }

  await saveTokensToFirestore(uid, "gmail", tokens, env);
  return Response.redirect(`${env.ALLOWED_ORIGIN}?connected=gmail`, 302);
}
// ─── OAuth: Zoho ──────────────────────────────────────────────────────────────
function handleZohoStart(request, env) {
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid"); // Frontend passes Firebase UID
  const state = btoa(JSON.stringify({ uid, provider: "zoho" }));

  const params = new URLSearchParams({
    client_id: env.ZOHO_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/zoho/callback`,
    scope: "ZohoMail.messages.READ ZohoMail.accounts.READ",
    access_type: "offline",
    state,
  });
  return Response.redirect(`https://accounts.zoho.com/oauth/v2/auth?${params}`, 302);
}

async function handleZohoCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (url.searchParams.get("error")) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=google_denied`, 302);
  }

  const { uid } = JSON.parse(atob(state));

  const tokenRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.ZOHO_CLIENT_ID,
      client_secret: env.ZOHO_CLIENT_SECRET,
      code,
      redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/zoho/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
if (tokens.error) {
    return Response.redirect(`${env.ALLOWED_ORIGIN}?error=token_exchange`, 302);
  }
  
  await saveTokensToFirestore(uid, "zoho", tokens, env); // 👈 saved under client's UID

  return Response.redirect(`${env.ALLOWED_ORIGIN}?connected=zoho`, 302);
}

// ─── Firestore helpers ────────────────────────────────────────────────────────
async function getFirestoreToken(env) {
  // Use a service account key stored as a secret
  const res = await fetch(
    `https://oauth2.googleapis.com/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await makeServiceAccountJWT(env),
      }),
    }
  );
  const data = await res.json();
  return data.access_token;
}

async function saveTokensToFirestore(uid, provider, tokens, env) {
  const fsToken = await getFirestoreToken(env);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/clients/${uid}/providers/${provider}`;

  await fetch(docUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fsToken}`,
    },
    body: JSON.stringify({
      fields: {
        access_token:  { stringValue: tokens.access_token },
        refresh_token: { stringValue: tokens.refresh_token || "" },
        expires_in:    { integerValue: tokens.expires_in || 3600 },
        saved_at:      { integerValue: Math.floor(Date.now() / 1000) },
        provider:      { stringValue: provider },
      },
    }),
  });
}

async function getTokensFromFirestore(uid, provider, env) {
  const fsToken = await getFirestoreToken(env);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/clients/${uid}/providers/${provider}`;

  const res = await fetch(docUrl, {
    headers: { Authorization: `Bearer ${fsToken}` },
  });

  if (!res.ok) return null;
  const doc = await res.json();
  const f = doc.fields;
  return {
    access_token:  f.access_token?.stringValue,
    refresh_token: f.refresh_token?.stringValue,
    expires_in:    f.expires_in?.integerValue,
    saved_at:      f.saved_at?.integerValue,
  };
}
// ─── Route: GET /api/emails ───────────────────────────────────────────────────
// Fetches emails for the authenticated client from their connected provider
async function handleFetchEmails(request, env) {
  // 1. Verify Firebase auth
  let caller;
  try {
    caller = await requireAuth(request, env);
  } catch (e) {
    return err(`Unauthorized: ${e.message}`, 401, env);
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider"); // zoho | ms365 | gmail | imap
  if (!provider) return err("Missing provider param", 400, env);

  // 2. Load their stored tokens from Firestore
  const tokens = await getTokensFromFirestore(caller.uid, provider, env);
  if (!tokens?.access_token) {
    return err(`No token found for provider: ${provider}. Please reconnect.`, 401, env);
  }

  // 3. Refresh token if expired
  const freshTokens = await maybeRefreshToken(caller.uid, provider, tokens, env);

  // 4. Fetch emails from the right provider
  let emails = [];
  switch (provider) {
    case "zoho":  emails = await fetchZohoEmails(freshTokens.access_token, env);  break;
    case "ms365": emails = await fetchMsEmails(freshTokens.access_token, env);    break;
    case "gmail": emails = await fetchGmailEmails(freshTokens.access_token, env); break;
    case "imap":  emails = await fetchImapEmails(caller.uid, env);                break;
    default:      return err("Unknown provider", 400, env);
  }

  return json({ emails }, 200, env);
}

// ─── Token refresh ────────────────────────────────────────────────────────────
async function maybeRefreshToken(uid, provider, tokens, env) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = (tokens.saved_at || 0) + (tokens.expires_in || 3600);
  const isExpired = now > expiresAt - 300; // refresh 5 min early

  if (!isExpired) return tokens;
  if (!tokens.refresh_token) return tokens; // can't refresh, return as-is

  const refreshUrls = {
    zoho:  "https://accounts.zoho.com/oauth/v2/token",
    ms365: `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/token`,
    gmail: "https://oauth2.googleapis.com/token",
  };

  const clientIds = {
    zoho:  { id: env.ZOHO_CLIENT_ID,   secret: env.ZOHO_CLIENT_SECRET },
    ms365: { id: env.MS_CLIENT_ID,     secret: env.MS_CLIENT_SECRET },
    gmail: { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET },
  };

  const creds = clientIds[provider];
  if (!creds || !refreshUrls[provider]) return tokens;

  const res = await fetch(refreshUrls[provider], {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     creds.id,
      client_secret: creds.secret,
      refresh_token: tokens.refresh_token,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) return tokens; // refresh failed, return old token

  const newTokens = await res.json();
  const merged = {
    access_token:  newTokens.access_token,
    refresh_token: newTokens.refresh_token || tokens.refresh_token,
    expires_in:    newTokens.expires_in || 3600,
  };

  // Save refreshed token back to Firestore
  await saveTokensToFirestore(uid, provider, merged, env);
  return merged;
}
// ─── Service Account JWT (required for Firestore) ─────────────────────────────
async function makeServiceAccountJWT(env) {
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const now = Math.floor(Date.now() / 1000);

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = `${header}.${payload}`;

  // Import the private key
  const pemKey = sa.private_key.replace(/\\n/g, "\n");
  const keyDer = pemToDer(pemKey);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8", keyDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${signingInput}.${sigB64}`;
}
// ─── Zoho email fetcher ───────────────────────────────────────────────────────
async function fetchZohoEmails(accessToken,) {
  // First get the account ID
  const accountRes = await fetch(
    "https://mail.zoho.com/api/accounts",
    { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
  );
  const accountData = await accountRes.json();
  const accountId = accountData?.data?.[0]?.accountId;
  if (!accountId) return [];

  // Then fetch messages
  const msgsRes = await fetch(
    `https://mail.zoho.com/api/accounts/${accountId}/messages/view?limit=50&start=0`,
    { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
  );
  const msgsData = await msgsRes.json();

  return (msgsData?.data || []).map((m) => ({
    id:       m.messageId,
    from:     m.fromAddress,
    name:     m.sender,
    subject:  m.subject,
    time:     m.receivedTime,
    provider: "zoho",
  }));
}

// ─── Microsoft email fetcher ──────────────────────────────────────────────────
async function fetchMsEmails(accessToken, ) {
  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages?$select=from,subject,receivedDateTime&$top=50&$orderby=receivedDateTime desc",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  return (data?.value || []).map((m) => ({
    id:       m.id,
    from:     m.from?.emailAddress?.address,
    name:     m.from?.emailAddress?.name,
    subject:  m.subject,
    time:     m.receivedDateTime,
    provider: "ms365",
  }));
}

// ─── Gmail fetcher ────────────────────────────────────────────────────────────
async function fetchGmailEmails(accessToken) {
  // Step 1: get message IDs
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const ids = (listData?.messages || []).map((m) => m.id);

  // Step 2: fetch each message header (parallel, max 10 at a time)
  const emails = await Promise.all(
    ids.slice(0, 20).map(async (id) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msg = await msgRes.json();
      const headers = msg?.payload?.headers || [];
      const get = (name) => headers.find((h) => h.name === name)?.value || "";
      return {
        id,
        from:     get("From").replace(/.*<(.+)>/, "$1"),
        name:     get("From").replace(/<.*>/, "").trim(),
        subject:  get("Subject"),
        time:     get("Date"),
        provider: "gmail",
      };
    })
  );

  return emails;
}

async function fetchImapEmails(uid, env) {
  const creds = await getTokensFromFirestore(uid, "imap", env);
  if (!creds) return [];
  // Return placeholder — real IMAP fetching needs a Node.js service
  return [{
    id: "imap-note",
    from: "system@fraudshield",
    name: "System",
    subject: "IMAP requires a Node.js microservice (Workers can't open TCP)",
    time: new Date().toISOString(),
    provider: "imap",
  }];
}
// ─── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env,) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    // Router
  // Router
if (path === "/api/analyze"              && method === "POST") return handleAnalyze(request, env);
if (path === "/api/webhook/dispatch"     && method === "POST") return handleWebhookDispatch(request, env);
if (path === "/api/emails"               && method === "GET")  return handleFetchEmails(request, env);

if (path === "/api/oauth/ms/start"       && method === "GET")  return handleMsStart(request, env);
if (path === "/api/oauth/ms/callback"    && method === "GET")  return handleMsCallback(request, env);
if (path === "/api/oauth/google/start"   && method === "GET")  return handleGoogleStart(request, env);
if (path === "/api/oauth/google/callback"&& method === "GET")  return handleGoogleCallback(request, env);
if (path === "/api/oauth/zoho/start"     && method === "GET")  return handleZohoStart(request, env);
if (path === "/api/oauth/zoho/callback"  && method === "GET")  return handleZohoCallback(request, env);

if (path === "/health"                   && method === "GET")  return json({ status: "ok", ts: Date.now() }, 200, env);

return json({ error: "Not found" }, 404, env);
  },
};