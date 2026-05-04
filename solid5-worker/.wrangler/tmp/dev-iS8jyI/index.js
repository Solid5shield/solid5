var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-d4uwxZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// index.js
function cors(env) {
  const origin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
__name(cors, "cors");
function json(data, status = 200, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env) }
  });
}
__name(json, "json");
function err(msg, status = 400, env) {
  return json({ error: msg }, status, env);
}
__name(err, "err");
async function verifyFirebaseToken(idToken, projectId) {
  const keysRes = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  const keys = await keysRes.json();
  const [headerB64] = idToken.split(".");
  const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")));
  const certPem = keys[header.kid];
  if (!certPem) throw new Error("Unknown key ID");
  const certDer = pemToDer(certPem);
  const publicKey = await crypto.subtle.importKey(
    "spki",
    certDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const [, payloadB64, sigB64] = idToken.split(".");
  const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(sigB64);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signingInput);
  if (!valid) throw new Error("Invalid token signature");
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  const now = Math.floor(Date.now() / 1e3);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.aud !== projectId) throw new Error("Wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Wrong issuer");
  return payload;
}
__name(verifyFirebaseToken, "verifyFirebaseToken");
function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  return base64UrlDecode(b64, false);
}
__name(pemToDer, "pemToDer");
function base64UrlDecode(str, urlSafe = true) {
  let b64 = urlSafe ? str.replace(/-/g, "+").replace(/_/g, "/") : str;
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
__name(base64UrlDecode, "base64UrlDecode");
async function requireAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) throw new Error("Missing Authorization header");
  const payload = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
  return payload;
}
__name(requireAuth, "requireAuth");
async function handleAnalyze(request, env) {
  let caller;
  try {
    caller = await requireAuth(request, env);
  } catch (e) {
    return err(`Unauthorized: ${e.message}`, 401, env);
  }
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
  let claudeRes;
  try {
    claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1e3,
        messages: [{ role: "user", content: prompt }]
      })
    });
  } catch (e) {
    return err(`Claude API unreachable: ${e.message}`, 502, env);
  }
  if (!claudeRes.ok) {
    const errBody = await claudeRes.text();
    return err(`Claude API error: ${errBody}`, claudeRes.status, env);
  }
  const data = await claudeRes.json();
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (parsed.risk === "high") {
      dispatchWebhooks(parsed, body.emailMeta || {}, env).catch(() => {
      });
    }
  } catch {
  }
  return json(data, 200, env);
}
__name(handleAnalyze, "handleAnalyze");
async function dispatchWebhooks(result, emailMeta, env) {
  const promises = [];
  if (env.SLACK_WEBHOOK_URL) {
    const slackPayload = {
      text: `\u{1F6A8} *FraudShield HIGH RISK Detection*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*\u{1F6A8} HIGH RISK \u2014 ${result.attack_type || "Suspicious Sender"}*
*From:* \`${emailMeta.from || "unknown"}\`
*Subject:* ${emailMeta.subject || "\u2014"}
*Verdict:* ${result.verdict}`
          }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Confidence:*
${result.confidence}%` },
            { type: "mrkdwn", text: `*Action:*
${(result.recommended_action || "review").toUpperCase()}` },
            { type: "mrkdwn", text: `*Similarity:*
${result.similarity_score}%` },
            { type: "mrkdwn", text: `*Time:*
${(/* @__PURE__ */ new Date()).toISOString()}` }
          ]
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: `*Assessment:* ${result.explanation}` }
        }
      ]
    };
    promises.push(
      fetch(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload)
      })
    );
  }
  if (env.SIEM_WEBHOOK_URL) {
    const siemEvent = {
      time: Math.floor(Date.now() / 1e3),
      event: {
        source: "fraudshield",
        severity: result.risk,
        from: emailMeta.from,
        subject: emailMeta.subject,
        attack_type: result.attack_type,
        confidence: result.confidence,
        verdict: result.verdict,
        recommended_action: result.recommended_action
      }
    };
    promises.push(
      fetch(env.SIEM_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...env.SIEM_TOKEN ? { Authorization: `Splunk ${env.SIEM_TOKEN}` } : {}
        },
        body: JSON.stringify(siemEvent)
      })
    );
  }
  await Promise.allSettled(promises);
}
__name(dispatchWebhooks, "dispatchWebhooks");
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
__name(handleWebhookDispatch, "handleWebhookDispatch");
function handleMsStart(request, env) {
  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${env.ALLOWED_ORIGIN}/api/oauth/ms/callback`,
    response_mode: "query",
    scope: "Mail.Read Mail.ReadBasic offline_access User.Read",
    state: crypto.randomUUID()
  });
  const url = `https://login.microsoftonline.com/${env.MS_TENANT_ID}/oauth2/v2.0/authorize?${params}`;
  return Response.redirect(url, 302);
}
__name(handleMsStart, "handleMsStart");
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
        grant_type: "authorization_code"
      })
    }
  );
  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    return err(`Token exchange failed: ${e}`, 502, env);
  }
  const tokens = await tokenRes.json();
  const redirectUrl = `${env.ALLOWED_ORIGIN}/oauth-success.html?provider=ms&access_token=${tokens.access_token}&expires_in=${tokens.expires_in}`;
  return Response.redirect(redirectUrl, 302);
}
__name(handleMsCallback, "handleMsCallback");
function handleGoogleStart(request, env) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.WORKER_URL}/api/oauth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    state: crypto.randomUUID()
  });
  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302
  );
}
__name(handleGoogleStart, "handleGoogleStart");
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
      grant_type: "authorization_code"
    })
  });
  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    return err(`Token exchange failed: ${e}`, 502, env);
  }
  const tokens = await tokenRes.json();
  const redirectUrl = `${env.ALLOWED_ORIGIN}/oauth-success.html?provider=google&access_token=${tokens.access_token}&expires_in=${tokens.expires_in}`;
  return Response.redirect(redirectUrl, 302);
}
__name(handleGoogleCallback, "handleGoogleCallback");
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env) });
    }
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
  }
};

// ../../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-d4uwxZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// ../../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-d4uwxZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
