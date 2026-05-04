/**
 * Solid5 Shield — Cloudflare Worker
 *
 * Routes:
 *   POST /api/analyze          → Proxy to Claude API (requires Firebase ID token)
 *   GET  /api/oauth/ms/start   → Start Microsoft OAuth flow
 *   GET  /api/oauth/ms/callback→ Exchange MS auth code for access token
 *   GET  /api/oauth/google/start
 *   GET  /api/oauth/google/callback
 *   POST /api/webhook/dispatch → Fire events to Slack / SIEM endpoints
 *
 * Secrets (set via `wrangler secret put`):
 *   CLAUDE_API_KEY
 *   MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   SLACK_WEBHOOK_URL
 *   FIREBASE_PROJECT_ID          (used for token verification)
 *   ALLOWED_ORIGIN               (your frontend domain, e.g. https://shield.solid5.co.za)
 */

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

  // 3. Forward to Claude
  let claudeRes;
  try {
    claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    return err(`Claude API unreachable: ${e.message}`, 502, env);
  }

  if (!claudeRes.ok) {
    const errBody = await claudeRes.text();
    return err(`Claude API error: ${errBody}`, claudeRes.status, env);
  }

  const data = await claudeRes.json();

  // 4. Optionally fire Slack/SIEM webhook for high-risk detections (async, non-blocking)
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (parsed.risk === "high") {
      // Fire and forget — don't await
      dispatchWebhooks(parsed, body.emailMeta || {}, env).catch(() => {});
    }
  } catch {
    // JSON parse failed — still return result
  }

  return json(data, 200, env);
}

// ─── Webhook dispatcher ───────────────────────────────────────────────────────
async function dispatchWebhooks(result, emailMeta, env) {
  const promises = [];

  // Slack
  if (env.SLACK_WEBHOOK_URL) {
    const slackPayload = {
      text: `🚨 *FraudShield HIGH RISK Detection*`,
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
        source: "fraudshield",
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
  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/ms/callback`,
    response_mode: "query",
    scope: "Mail.Read Mail.ReadBasic offline_access User.Read",
    state: crypto.randomUUID(),
  });
  const url = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
  return Response.redirect(url, 302);
}

async function handleMsCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) return err(`OAuth error: ${error}`, 400, env);
  if (!code) return err("Missing authorization code", 400, env);

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

  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    return err(`Token exchange failed: ${e}`, 502, env);
  }

  const tokens = await tokenRes.json();
  // Return tokens to the frontend via postMessage-friendly redirect
  const redirectUrl = `${env.ALLOWED_ORIGIN}/oauth-success.html?provider=ms&access_token=${tokens.access_token}&expires_in=${tokens.expires_in}`;
  return Response.redirect(redirectUrl, 302);
}

// ─── OAuth: Google ────────────────────────────────────────────────────────────
function handleGoogleStart(request, env) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.WORKER_URL}/api/oauth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state: crypto.randomUUID(),
  });
  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302
  );
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) return err(`OAuth error: ${error}`, 400, env);
  if (!code) return err("Missing authorization code", 400, env);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${env.WORKER_URL}/api/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    return err(`Token exchange failed: ${e}`, 502, env);
  }

  const tokens = await tokenRes.json();
  const redirectUrl = `${env.ALLOWED_ORIGIN}/oauth-success.html?provider=google&access_token=${tokens.access_token}&expires_in=${tokens.expires_in}`;
  return Response.redirect(redirectUrl, 302);
}

// ─── Main fetch handler ───────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }

    // Router
    if (path === "/api/analyze" && method === "POST")
      return handleAnalyze(request, env);

    if (path === "/api/webhook/dispatch" && method === "POST")
      return handleWebhookDispatch(request, env);

    if (path === "/api/oauth/ms/start" && method === "GET")
      return handleMsStart(request, env);

    if (path === "/api/oauth/ms/callback" && method === "GET")
      return handleMsCallback(request, env);

    if (path === "/api/oauth/google/start" && method === "GET")
      return handleGoogleStart(request, env);

    if (path === "/api/oauth/google/callback" && method === "GET")
      return handleGoogleCallback(request, env);

    if (path === "/health" && method === "GET")
      return json({ status: "ok", ts: Date.now() }, 200, env);

    return json({ error: "Not found" }, 404, env);
  },
};