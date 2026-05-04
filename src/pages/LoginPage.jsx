// src/pages/Logimport { useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

import { useEffect, useState, useNavigate, useRef } from "react";
// ── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAl-C7k3-M-Zg4Pgr9fijRzxmNFq3dkfD0",
  authDomain: "solid5.firebaseapp.com",
  projectId: "solid5",
  storageBucket: "solid5.firebasestorage.app",
  messagingSenderId: "913140407310",
  appId: "1:913140407310:web:58787c967f27d25947b05f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

// ── CSS injected once ─────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .shield-login-root *, .shield-login-root *::before, .shield-login-root *::after {
    box-sizing: border-box; margin: 0; padding: 0;
  }
  .shield-login-root {
    --bg: #fdf8f2; --bg2: #f7f0e6; --bg3: #ede4d8; --card: #faf5ee;
    --teal: #0a7c5c; --teal2: #0d9970; --teal3: rgba(10,124,92,0.09);
    --blue: #1d6fa4; --text: #1e1a14; --text2: #5a4f3f; --text3: #9c8e7a;
    --border: rgba(90,60,20,0.10); --border2: rgba(10,124,92,0.25);
    --font: 'Syne', sans-serif; --body: 'DM Sans', sans-serif;
    --mono: 'JetBrains Mono', monospace; --red: #dc2626;
    font-family: var(--body); background: var(--bg); color: var(--text);
    min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 768px) {
    .shield-login-root { grid-template-columns: 1fr; }
    .shield-panel-left { display: none !important; }
    .shield-panel-right { padding: 40px 24px !important; }
  }
  @keyframes shield-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:.4; transform:scale(.85); }
  }
  @keyframes shield-spin { to { transform:rotate(360deg); } }
  .shield-badge-dot {
    width:6px; height:6px; border-radius:50%; background:var(--teal);
    animation: shield-pulse 1.8s infinite;
  }
  .shield-sso-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    padding:11px 16px; border-radius:10px; font-size:13px; font-weight:600;
    cursor:pointer; font-family:var(--body); transition:all 0.2s;
    border:1px solid var(--border); background:#fff; color:var(--text);
    white-space:nowrap;
  }
  .shield-sso-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.08); }
  .shield-sso-btn.ms { background:#0078d4; color:#fff; border-color:#0078d4; }
  .shield-sso-btn.ms:hover:not(:disabled) { box-shadow:0 6px 20px rgba(0,120,212,0.3); }
  .shield-sso-btn:disabled { opacity:0.65; cursor:not-allowed; }
  .shield-form-input {
    width:100%; padding:12px 14px; border:1px solid var(--border);
    border-radius:10px; background:var(--card); font-size:14px;
    font-family:var(--body); color:var(--text); transition:all 0.2s; outline:none;
  }
  .shield-form-input:focus { border-color:var(--border2); box-shadow:0 0 0 3px var(--teal3); }
  .shield-form-input::placeholder { color:var(--text3); }
  .shield-btn-submit {
    width:100%; padding:14px; border:none; border-radius:10px;
    background:linear-gradient(135deg,var(--teal),var(--blue)); color:#fff;
    font-size:15px; font-weight:700; cursor:pointer; font-family:var(--body);
    transition:all 0.25s; display:flex; align-items:center; justify-content:center;
    gap:8px; position:relative; overflow:hidden;
  }
  .shield-btn-submit:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 32px rgba(10,124,92,0.28); }
  .shield-btn-submit:disabled { opacity:0.65; cursor:not-allowed; }
  .shield-btn-submit.loading .btn-label { opacity:0; }
  .shield-btn-submit.loading::after {
    content:''; position:absolute; width:18px; height:18px;
    border:2px solid rgba(255,255,255,0.3); border-top-color:#fff;
    border-radius:50%; animation:shield-spin 0.7s linear infinite;
  }
  .shield-error-msg {
    display:none; align-items:center; gap:10px;
    background:rgba(220,38,38,0.07); border:1px solid rgba(220,38,38,0.2);
    border-radius:10px; padding:12px 14px; margin-bottom:16px;
    font-size:13px; color:#b91c1c;
  }
  .shield-error-msg.visible { display:flex; }
  .trust-pill {
    display:inline-flex; align-items:center; gap:10px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.10);
    border-radius:10px; padding:10px 14px; width:fit-content;
  }
  .trust-pill-icon {
    width:28px; height:28px; background:rgba(10,124,92,0.2); border-radius:6px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
`;

function injectStyles() {
  if (document.getElementById("shield-login-styles")) return;
  const el = document.createElement("style");
  el.id = "shield-login-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ── Left panel canvas animation ───────────────────────────────────────────────
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let nodes = [];
    let W, H;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    function makeNode() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5, pulse: Math.random() * Math.PI * 2,
      };
    }
    function init() {
      resize();
      nodes = [];
      const c = Math.floor((W * H) / 18000);
      for (let i = 0; i < c; i++) nodes.push(makeNode());
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(10,180,120,${(1 - d / 120) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      nodes.forEach((n) => {
        n.pulse += 0.02; n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const g = Math.sin(n.pulse) * 0.3 + 0.4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13,153,112,${g})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", init); };
  }, [canvasRef]);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  useParticleCanvas(canvasRef);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState({ google: false, ms: false });
  const [error, setError] = useState("");

  useEffect(() => {
    injectStyles();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return unsub;
  }, [navigate]);

  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }

  const authErrorMap = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/invalid-credential": "Invalid email or password.",
  };

  async function handleEmailLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      showError(authErrorMap[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setSsoLoading((s) => ({ ...s, google: true }));
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") showError(err.message);
    } finally {
      setSsoLoading((s) => ({ ...s, google: false }));
    }
  }

  async function handleMicrosoft() {
    setSsoLoading((s) => ({ ...s, ms: true }));
    try {
      await signInWithPopup(auth, microsoftProvider);
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") showError(err.message);
    } finally {
      setSsoLoading((s) => ({ ...s, ms: false }));
    }
  }

  // ── styles ──────────────────────────────────────────────────────────────────
  const s = {
    panelLeft: {
      position: "relative",
      background: "linear-gradient(160deg, #0a2e22 0%, #0a1a2e 100%)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      padding: "48px", overflow: "hidden",
    },
    leftBefore: {
      position: "absolute", inset: 0,
      background: `radial-gradient(ellipse 80% 60% at 30% 40%, rgba(10,124,92,0.22) 0%, transparent 60%),
                   radial-gradient(ellipse 60% 50% at 70% 70%, rgba(29,111,164,0.18) 0%, transparent 55%)`,
    },
    canvas: { position: "absolute", inset: 0, zIndex: 1, width: "100%", height: "100%" },
    leftContent: { position: "relative", zIndex: 2 },
    leftLogo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "80px" },
    leftHeadline: {
      fontFamily: "var(--font,Syne,sans-serif)", fontSize: "clamp(28px,3vw,42px)", fontWeight: 800,
      color: "#fff", lineHeight: 1.1, letterSpacing: "-0.8px", marginBottom: "18px",
    },
    headlineSpan: {
      background: "linear-gradient(90deg,#0d9970,#5bc4a0)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    },
    leftSub: { fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: "340px", marginBottom: "48px" },
    leftStats: { display: "flex", gap: "32px", flexWrap: "wrap" },
    statVal: { fontFamily: "var(--font,Syne,sans-serif)", fontSize: "28px", fontWeight: 800, color: "#0d9970", lineHeight: 1, marginBottom: "4px" },
    statLabel: { fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--mono,monospace)", letterSpacing: "0.04em" },
    leftTrust: { display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 2 },
    trustPillText: { fontSize: "13px", color: "rgba(255,255,255,0.65)" },
    panelRight: {
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 40px", background: "var(--bg,#fdf8f2)",
    },
    authBox: { width: "100%", maxWidth: "420px" },
    authTag: {
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "rgba(10,124,92,0.09)", border: "1px solid rgba(10,124,92,0.25)",
      borderRadius: "20px", padding: "5px 12px", fontFamily: "var(--mono,monospace)",
      fontSize: "10px", fontWeight: 600, color: "#0a7c5c", letterSpacing: "0.08em",
      textTransform: "uppercase", marginBottom: "16px",
    },
    authTitle: {
      fontFamily: "var(--font,Syne,sans-serif)", fontSize: "clamp(24px,3vw,32px)",
      fontWeight: 800, color: "#1e1a14", letterSpacing: "-0.6px", marginBottom: "6px",
    },
    authSubtitle: { fontSize: "14px", color: "#5a4f3f", marginBottom: "32px", lineHeight: 1.6 },
    ssoRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" },
    divider: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
    dividerLine: { flex: 1, height: "1px", background: "rgba(90,60,20,0.10)" },
    dividerText: { fontFamily: "var(--mono,monospace)", fontSize: "10px", color: "#9c8e7a", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" },
    formGroup: { marginBottom: "16px" },
    formLabel: {
      display: "block", fontSize: "12px", fontWeight: 600, color: "#5a4f3f",
      marginBottom: "7px", fontFamily: "var(--mono,monospace)", letterSpacing: "0.04em", textTransform: "uppercase",
    },
    passwordWrap: { position: "relative" },
    passwordToggle: {
      position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: "#9c8e7a",
      padding: "4px", display: "flex", alignItems: "center",
    },
    formFooterRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" },
    rememberLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#5a4f3f", cursor: "pointer" },
    forgotLink: { fontSize: "13px", color: "#0a7c5c", textDecoration: "none", fontWeight: 600 },
    signupRow: { textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#5a4f3f" },
    link: { color: "#0a7c5c", fontWeight: 600, textDecoration: "none" },
  };

  return (
    <div className="shield-login-root">
      {/* ── LEFT PANEL ── */}
      <div className="shield-panel-left" style={s.panelLeft}>
        <div style={s.leftBefore} />
        <canvas ref={canvasRef} style={s.canvas} />

        <div style={s.leftContent}>
          <a href="/" style={s.leftLogo}>
            <img src="/solid-5-white.svg" style={{ width: "120px" }} alt="Solid5 Shield" />
          </a>

          <h2 style={s.leftHeadline}>
            Welcome<br />back to your<br />
            <span style={s.headlineSpan}>shield.</span>
          </h2>
          <p style={s.leftSub}>
            Your AI-powered inbox guardian is ready. Sign in to see your real-time threat dashboard.
          </p>

          <div style={s.leftStats}>
            {[["14", "checks per email"], ["<2s", "scan time"], ["98%", "accuracy"]].map(([val, label]) => (
              <div key={label}>
                <div style={s.statVal}>{val}</div>
                <div style={s.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.leftTrust}>
          {[
            {
              icon: <path d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z" />,
              text: <><strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Read-only access</strong> — we never touch your emails</>,
            },
            {
              icon: <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
              text: <><strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>POPIA compliant</strong> · Zero email storage</>,
            },
          ].map((pill, i) => (
            <div key={i} className="trust-pill">
              <div className="trust-pill-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#0d9970" strokeWidth="1.8" width="14" height="14">{pill.icon}</svg>
              </div>
              <div style={s.trustPillText}>{pill.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="shield-panel-right" style={s.panelRight}>
        <div style={s.authBox}>
          <div style={s.authTag}>
            <div className="shield-badge-dot" />
            Secure sign in
          </div>

          <h1 style={s.authTitle}>Sign in to Shield</h1>
          <p style={s.authSubtitle}>
            New to Solid5?{" "}
            <a href="/signup" style={s.link}>Create a free account →</a>
          </p>

          {/* SSO buttons */}
          <div style={s.ssoRow}>
            <button className="shield-sso-btn" onClick={handleGoogle} disabled={ssoLoading.google}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {ssoLoading.google ? "Signing in…" : "Continue with Google"}
            </button>
            <button className="shield-sso-btn ms" onClick={handleMicrosoft} disabled={ssoLoading.ms}>
              <svg width="16" height="16" viewBox="0 0 23 23">
                <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
              </svg>
              {ssoLoading.ms ? "Signing in…" : "Continue with Microsoft"}
            </button>
          </div>

          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or sign in with email</span>
            <div style={s.dividerLine} />
          </div>

          {/* Error */}
          <div className={`shield-error-msg${error ? " visible" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailLogin} noValidate>
            <div style={s.formGroup}>
              <label style={s.formLabel} htmlFor="email">Email address</label>
              <input
                className="shield-form-input"
                type="email" id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.formLabel} htmlFor="password">Password</label>
              <div style={s.passwordWrap}>
                <input
                  className="shield-form-input"
                  type={showPwd ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  style={{ paddingRight: "40px" }}
                />
                <button type="button" style={s.passwordToggle} onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={s.formFooterRow}>
              <label style={s.rememberLabel}>
                <input
                  type="checkbox" checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "#0a7c5c", cursor: "pointer" }}
                />
                Remember me
              </label>
              <a href="/forgot-password" style={s.forgotLink}>Forgot password?</a>
            </div>

            <button
              type="submit"
              className={`shield-btn-submit${loading ? " loading" : ""}`}
              disabled={loading}
            >
              <span className="btn-label">Sign in to Shield →</span>
            </button>
          </form>

          <div style={s.signupRow}>
            Don&apos;t have an account?{" "}
            <a href="/signup" style={s.link}>Sign up free</a>
          </div>
        </div>
      </div>
    </div>
  );
}