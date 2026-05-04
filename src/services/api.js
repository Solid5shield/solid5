/**
 * src/services/api.js
 *
 * All backend calls go through here.
 * The Worker URL is read from Vite's env (VITE_WORKER_URL in .env).
 *
 * Usage:
 *   import { analyzeEmail, dispatchWebhook, startOAuth } from './services/api';
 */

import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const BASE = import.meta.env.VITE_WORKER_URL || "http://localhost:8787";

// ─── Get a fresh Firebase ID token for every request ─────────────────────────
async function getIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated — please sign in.");
  // forceRefresh=false: uses cached token unless it expires in <5 min
  return user.getIdToken(false);
}

// ─── Base fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = await getIdToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  return res.json();
}

// ─── analyzeEmail ─────────────────────────────────────────────────────────────
/**
 * Sends an email through the Worker's /api/analyze endpoint.
 * The Worker verifies the Firebase token, then forwards the prompt to Claude.
 * High-risk results automatically trigger Slack/SIEM webhooks server-side.
 *
 * @param {object} email  - { from, name, subject, trusted, provider, id, ... }
 * @param {string} prompt - The full prompt string built in FraudShield.jsx
 * @returns {Promise<object>} - Parsed Claude response (same shape as before)
 */
export async function analyzeEmail(email, prompt) {
  const data = await apiFetch("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      // emailMeta is forwarded to webhook payloads — no sensitive content
      emailMeta: {
        from: email.from,
        subject: email.subject,
        provider: email.provider,
      },
    }),
  });

  // data is the raw Anthropic /v1/messages response
  const text = data.content?.find((b) => b.type === "text")?.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ─── dispatchWebhook ──────────────────────────────────────────────────────────
/**
 * Manually fire a webhook for a result (e.g. from the Settings → Test button).
 * The Worker sends to Slack + SIEM using its stored secrets.
 */
export async function dispatchWebhook(result, emailMeta) {
  return apiFetch("/api/webhook/dispatch", {
    method: "POST",
    body: JSON.stringify({ result, emailMeta }),
  });
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────
/**
 * Redirect the user to the Worker's OAuth start endpoint.
 * After the Worker exchanges the code, it redirects back to /oauth-success.html
 * where the frontend reads the token from the URL and stores it.
 *
 * @param {"ms"|"google"} provider
 */
export function startOAuth(provider) {
  const providerMap = { ms: "/api/oauth/ms/start", google: "/api/oauth/google/start" };
  const path = providerMap[provider];
  if (!path) throw new Error(`Unknown provider: ${provider}`);
  window.location.href = `${BASE}${path}`;
}

/**
 * Read the OAuth result posted back to the page after the Worker callback.
 * Call this from oauth-success.html or wherever you handle the redirect.
 *
 * Returns { provider, accessToken, expiresIn } or null.
 */
export function readOAuthResult() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const provider = params.get("provider");
  const expiresIn = parseInt(params.get("expires_in") || "3600", 10);
  if (!accessToken || !provider) return null;
  return { provider, accessToken, expiresIn };
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkWorkerHealth() {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}