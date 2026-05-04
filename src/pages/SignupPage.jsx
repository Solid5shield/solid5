import { useEffect, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

// ── Firebase (reuse existing app if already initialised) ──────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAl-C7k3-M-Zg4Pgr9fijRzxmNFq3dkfD0",
  authDomain: "solid5.firebaseapp.com",
  projectId: "solid5",
  storageBucket: "solid5.firebasestorage.app",
  messagingSenderId: "913140407310",
  appId: "1:913140407310:web:58787c967f27d25947b05f",
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const msProvider = new OAuthProvider("microsoft.com");

// ── Minimal scoped CSS injected once ─────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .su-root *, .su-root *::before, .su-root *::after { box-sizing:border-box; margin:0; padding:0; }
  .su-root {
    --bg:#f8f9fc; --card:#ffffff; --teal:#0a7c5c; --teal2:#0d9970;
    --teal3:rgba(10,124,92,0.08); --blue:#1d6fa4; --navy:#0f1c3f;
    --text:#111827; --text2:#374151; --text3:#6b7280; --text4:#9ca3af;
    --bdr:#d1d5db; --bdr2:rgba(10,124,92,0.28);
    --font:'Syne',sans-serif; --body:'DM Sans',sans-serif; --mono:'JetBrains Mono',monospace;
    font-family:var(--body); background:var(--bg); color:var(--text);
    display:flex; height:100vh; overflow:hidden;
  }
  @media (max-width:900px) {
    .su-root { flex-direction:column; height:auto; overflow:auto; }
    .su-R { display:none !important; }
    .su-L { width:100% !important; }
    .su-L-inner { padding:28px 24px 20px !important; }
  }
  @keyframes su-spin { to { transform:rotate(360deg); } }
  @keyframes su-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }

  .su-fld input {
    width:100%; padding:9px 36px 9px 12px; border:1px solid var(--bdr);
    border-radius:8px; background:var(--card); font-size:13px;
    font-family:var(--body); color:var(--text); transition:all .2s; outline:none;
  }
  .su-fld input:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(10,124,92,.1); }
  .su-fld input::placeholder { color:var(--text4); }

  .su-sso-btn {
    display:flex; align-items:center; justify-content:center; gap:7px;
    padding:10px; border-radius:9px; font-size:12.5px; font-weight:600;
    cursor:pointer; font-family:var(--body); transition:all .2s;
    border:1px solid var(--bdr); background:var(--card); color:var(--text);
    white-space:nowrap; position:relative;
  }
  .su-sso-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.08); }
  .su-sso-btn.ms { background:#0078d4; color:#fff; border-color:#0078d4; }
  .su-sso-btn.ms:hover:not(:disabled) { box-shadow:0 4px 14px rgba(0,120,212,.3); }
  .su-sso-btn:disabled { opacity:.6; cursor:not-allowed; }
  .su-sso-btn.loading::after {
    content:''; position:absolute; width:13px; height:13px;
    border:2px solid rgba(0,0,0,.15); border-top-color:currentColor;
    border-radius:50%; animation:su-spin .7s linear infinite;
  }

  .su-submit-btn {
    width:100%; padding:12px; border:none; border-radius:10px;
    background:linear-gradient(135deg,var(--teal),var(--blue)); color:#fff;
    font-size:13.5px; font-weight:700; cursor:pointer; font-family:var(--body);
    transition:all .25s; display:flex; align-items:center; justify-content:center;
    gap:7px; position:relative; overflow:hidden; flex-shrink:0;
    box-shadow:0 4px 14px rgba(10,124,92,.22);
  }
  .su-submit-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(10,124,92,.3); }
  .su-submit-btn:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; }
  .su-submit-btn.loading .su-btn-lbl { opacity:0; }
  .su-submit-btn.loading::after {
    content:''; position:absolute; width:16px; height:16px;
    border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
    border-radius:50%; animation:su-spin .7s linear infinite;
  }

  .su-alert {
    display:none; align-items:center; gap:9px;
    border-radius:9px; padding:9px 12px; margin-bottom:8px; font-size:12px; flex-shrink:0;
  }
  .su-alert.visible { display:flex; }
  .su-alert.err { background:rgba(220,38,38,.06); border:1px solid rgba(220,38,38,.18); color:#b91c1c; }
  .su-alert.ok  { background:rgba(5,150,105,.06);  border:1px solid rgba(5,150,105,.2);  color:#047857; }

  .su-str-bar { flex:1; height:3px; border-radius:2px; background:#e2ddd6; transition:background .3s; }

  .su-slide-item { position:absolute; inset:16px 20px 14px; transition:opacity .5s, transform .5s; }
  .su-slide-item.on  { opacity:1; transform:translateY(0); }
  .su-slide-item.off { opacity:0; transform:translateY(8px); pointer-events:none; }
  .su-dot { height:6px; border-radius:3px; background:rgba(255,255,255,.22); cursor:pointer; transition:all .3s; border:none; }
  .su-dot.on { width:20px; background:#0d9970; }
  .su-dot:not(.on) { width:6px; }

  .su-text-btn {
    background:none; border:none; cursor:pointer; padding:0;
    font-family:inherit; font-size:inherit;
  }
`;

function injectStyles() {
  if (document.getElementById("su-styles")) return;
  const el = document.createElement("style");
  el.id = "su-styles";
  el.textContent = GLOBAL_CSS;
  document.head.appendChild(el);
}

// ── Password strength helper ──────────────────────────────────────────────────
function calcStrength(val) {
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  return s;
}
const STR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const STR_LABELS = ["Weak", "Fair", "Good", "Strong"];

function validatePw(p) {
  return /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
}

// ── Right panel canvas ────────────────────────────────────────────────────────
function useRightCanvas(ref) {
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let animId;
    let nodes = [];
    let W, H;

    function resize() {
      const r = cv.parentElement.getBoundingClientRect();
      W = cv.width = r.width;
      H = cv.height = r.height;
    }
    function mkNode() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2 + 1.2, threat: Math.random() > 0.78,
        pulse: Math.random() * Math.PI * 2,
      };
    }
    function init() { resize(); nodes = []; for (let i = 0; i < 30; i++) nodes.push(mkNode()); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++)
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            const a = (1 - d / 130) * 0.18;
            ctx.strokeStyle = nodes[i].threat || nodes[j].threat
              ? `rgba(239,68,68,${a})` : `rgba(13,153,112,${a})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      nodes.forEach((n) => {
        n.pulse += 0.025; n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        const g = Math.sin(n.pulse) * 0.3 + 0.55;
        if (n.threat) {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${g * 0.08})`; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239,68,68,${g})`; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(13,153,112,${g * 0.07})`; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(13,153,112,${g})`; ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    }
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", init); };
  }, [ref]);
}

// ── Eye SVG helper ────────────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

// ── Slides data ───────────────────────────────────────────────────────────────
const SLIDES = [
  { title: "AI stops threats instantly", body: "14 real-time checks on every sender domain the moment an email arrives." },
  { title: "Plain-English verdicts", body: "No security degree needed — Claude AI explains exactly what's suspicious." },
  { title: "Zero email storage", body: "Read-only access only. Your emails never touch our servers. POPIA compliant." },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function SignupPage({ onSuccess, onBack }) {
  const canvasRef = useRef(null);
  useRightCanvas(canvasRef);

  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [terms, setTerms]         = useState(false);
  const [showPw1, setShowPw1]     = useState(false);
  const [showPw2, setShowPw2]     = useState(false);
  const [strength, setStrength]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [ssoLoad, setSsoLoad]     = useState({ g: false, ms: false });
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [slide, setSlide]         = useState(0);

  useEffect(() => {
    injectStyles();
    const unsub = onAuthStateChanged(auth, (u) => { if (u) onSuccess(); });
    return unsub;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSlide((c) => (c + 1) % 3), 4200);
    return () => clearInterval(id);
  }, []);

  function showError(msg) { setError(msg); setTimeout(() => setError(""), 6000); }
  function showSuccessMsg(msg) { setSuccess(msg); }

  const authErrMap = {
    "auth/email-already-in-use": "Email already registered. Sign in instead.",
    "auth/invalid-email": "Invalid email address.",
    "auth/weak-password": "Password too weak.",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!terms)                  return showError("Please accept the Terms of Service.");
    if (password !== confirmPw)  return showError("Passwords don't match.");
    if (password.length < 8)     return showError("Password must be at least 8 characters.");
    if (!validatePw(password))   return showError("Need uppercase, lowercase, number & special char.");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      showSuccessMsg("Account created! Redirecting…");
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      showError(authErrMap[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setSsoLoad((s) => ({ ...s, g: true }));
    try { await signInWithPopup(auth, googleProvider); onSuccess(); }
    catch (e) { if (e.code !== "auth/popup-closed-by-user") showError(e.message); }
    finally { setSsoLoad((s) => ({ ...s, g: false })); }
  }

  async function handleMs() {
    setSsoLoad((s) => ({ ...s, ms: true }));
    try { await signInWithPopup(auth, msProvider); onSuccess(); }
    catch (e) { if (e.code !== "auth/popup-closed-by-user") showError(e.message); }
    finally { setSsoLoad((s) => ({ ...s, ms: false })); }
  }

  // ── inline style objects ──────────────────────────────────────────────────
  const s = {
    L: { width: "52%", display: "flex", paddingTop: "80px", flexDirection: "column", overflow: "hidden" },
    Linner: { flex: 1, display: "flex", flexDirection: "column", padding: "26px 44px 18px", maxWidth: "520px", margin: "0 auto", width: "100%", overflow: "hidden" },
    logo: { display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", marginBottom: "18px", flexShrink: 0 },
    hd: { flexShrink: 0, marginBottom: "3px" },
    hdH1: { fontFamily: "var(--font,Syne,sans-serif)", fontSize: "21px", fontWeight: 800, color: "#111827", letterSpacing: "-0.4px" },
    hdP: { fontSize: "12.5px", color: "#6b7280", marginTop: "3px" },
    link: { color: "#0a7c5c", fontWeight: 600, textDecoration: "none", background: "none", border: "none", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit", padding: 0 },
    badge: { display: "flex", alignItems: "center", gap: "9px", background: "rgba(10,124,92,0.08)", border: "1px solid rgba(10,124,92,0.28)", borderRadius: "10px", padding: "8px 12px", margin: "10px 0", fontSize: "12px", color: "#374151", flexShrink: 0 },
    badgeIco: { width: "24px", height: "24px", flexShrink: 0, background: "rgba(10,124,92,0.12)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" },
    ssoRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px", flexShrink: 0 },
    divRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexShrink: 0 },
    divLine: { flex: 1, height: "1px", background: "#d1d5db" },
    divText: { fontFamily: "var(--mono,monospace)", fontSize: "9.5px", color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" },
    form: { flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
    fld: { display: "flex", flexDirection: "column", gap: "4px" },
    fldLabel: { fontSize: "11.5px", fontWeight: 600, color: "#374151" },
    pwWrap: { position: "relative" },
    pwBtn: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "2px", display: "flex" },
    strBars: { display: "flex", gap: "3px", marginTop: "4px" },
    strLabel: { fontFamily: "var(--mono,monospace)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.04em", marginTop: "2px", display: "block", height: "12px" },
    terms: { display: "flex", alignItems: "flex-start", gap: "8px", flexShrink: 0 },
    termsTxt: { fontSize: "11.5px", color: "#6b7280", lineHeight: 1.5 },
    foot: { textAlign: "center", fontSize: "12px", color: "#6b7280", flexShrink: 0, borderTop: "1px solid #d1d5db", paddingTop: "10px", marginTop: "4px" },
    R: { width: "48%", background: "#0f1c3f", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" },
    blob: (top, right, bottom, left, w, h, c) => ({ position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", ...(top !== undefined && { top }), ...(right !== undefined && { right }), ...(bottom !== undefined && { bottom }), ...(left !== undefined && { left }), width: w, height: h, background: c }),
    Rinner: { position: "relative", zIndex: 2, width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "12px" },
    slideCard: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" },
    slideVis: { position: "relative", height: "190px", overflow: "hidden", background: "rgba(255,255,255,0.03)" },
    slideFade: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,28,63,0.7) 0%, transparent 55%)", pointerEvents: "none" },
    slideBody: { padding: "16px 20px 14px", minHeight: "100px", position: "relative" },
    slideH3: { fontFamily: "var(--font,Syne,sans-serif)", fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px", marginBottom: "5px" },
    slideP: { fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.55 },
    dots: { display: "flex", gap: "5px", position: "absolute", bottom: "12px", left: "20px" },
    stats: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" },
    stat: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 8px", textAlign: "center", backdropFilter: "blur(8px)" },
    statV: { fontFamily: "var(--font,Syne,sans-serif)", fontSize: "17px", fontWeight: 800, color: "#fff", lineHeight: 1 },
    statL: { fontSize: "10px", color: "rgba(255,255,255,0.42)", marginTop: "3px" },
    trust: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: "10px" },
    trustIco: { width: "30px", height: "30px", flexShrink: 0, background: "rgba(10,124,92,0.2)", border: "1px solid rgba(13,153,112,0.3)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" },
  };

  return (
    <div className="su-root">
      {/* ── LEFT ── */}
      <div className="su-L" style={s.L}>
        <div className="su-L-inner" style={s.Linner}>

          {/* Logo */}
          <a href="/" style={s.logo}>
            <img src="/solid-5.svg" style={{ width: "120px" }} alt="Solid5 Shield" />
          </a>

          {/* Heading */}
          <div style={s.hd}>
            <h1 style={s.hdH1}>Create your account</h1>
            <p style={s.hdP}>
              Get started — it&apos;s free. No credit card required. &nbsp;
              <button onClick={onBack} style={s.link}>Sign in →</button>
            </p>
          </div>

          {/* Plan badge */}
          <div style={s.badge}>
            <div style={s.badgeIco}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0a7c5c" strokeWidth="1.8" width="12" height="12">
                <path d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"/>
              </svg>
            </div>
            Starting on <strong style={{ color: "#0a7c5c" }}>Shield Basic — Free</strong>. Upgrade any time, cancel any time.
          </div>

          {/* SSO */}
          <div style={s.ssoRow}>
            <button className={`su-sso-btn${ssoLoad.g ? " loading" : ""}`} onClick={handleGoogle} disabled={ssoLoad.g || ssoLoad.ms}>
              {!ssoLoad.g && (
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {ssoLoad.g ? "Signing up…" : "Sign up with Google"}
            </button>
            <button className={`su-sso-btn ms${ssoLoad.ms ? " loading" : ""}`} onClick={handleMs} disabled={ssoLoad.g || ssoLoad.ms}>
              {!ssoLoad.ms && (
                <svg width="15" height="15" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
                  <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
                  <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
                  <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
                </svg>
              )}
              {ssoLoad.ms ? "Signing up…" : "Sign up with Microsoft"}
            </button>
          </div>

          {/* Divider */}
          <div style={s.divRow}>
            <div style={s.divLine}/>
            <span style={s.divText}>or create with email</span>
            <div style={s.divLine}/>
          </div>

          {/* Alerts */}
          <div className={`su-alert err${error ? " visible" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
          <div className={`su-alert ok${success ? " visible" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth="1.8"/>
            </svg>
            <span>{success}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={s.form}>

            <div className="su-fld" style={s.fld}>
              <label style={s.fldLabel} htmlFor="su-name">Full Name</label>
              <input type="text" id="su-name" placeholder="John Smith" required autoComplete="name"
                style={{ paddingRight: "12px" }}
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="su-fld" style={s.fld}>
              <label style={s.fldLabel} htmlFor="su-email">Email Address</label>
              <input type="email" id="su-email" placeholder="john@company.com" required autoComplete="email"
                style={{ paddingRight: "12px" }}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div style={s.row2}>
              <div className="su-fld" style={s.fld}>
                <label style={s.fldLabel} htmlFor="su-pw">Password</label>
                <div style={s.pwWrap}>
                  <input type={showPw1 ? "text" : "password"} id="su-pw"
                    placeholder="Min. 8 chars" required autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStrength(calcStrength(e.target.value)); }} />
                  <button type="button" style={s.pwBtn} onClick={() => setShowPw1((v) => !v)}>
                    <EyeIcon open={showPw1} />
                  </button>
                </div>
                <div style={s.strBars}>
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="su-str-bar"
                      style={{ background: i < strength ? STR_COLORS[strength - 1] : "#e2ddd6" }} />
                  ))}
                </div>
                <span style={{ ...s.strLabel, color: strength > 0 ? STR_COLORS[strength - 1] : "transparent" }}>
                  {strength > 0 ? STR_LABELS[strength - 1] : " "}
                </span>
              </div>

              <div className="su-fld" style={s.fld}>
                <label style={s.fldLabel} htmlFor="su-cpw">Confirm Password</label>
                <div style={s.pwWrap}>
                  <input type={showPw2 ? "text" : "password"} id="su-cpw"
                    placeholder="Repeat password" required autoComplete="new-password"
                    value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  <button type="button" style={s.pwBtn} onClick={() => setShowPw2((v) => !v)}>
                    <EyeIcon open={showPw2} />
                  </button>
                </div>
              </div>
            </div>

            <div style={s.terms}>
              <input type="checkbox" id="su-terms" checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "2px", accentColor: "#0a7c5c", cursor: "pointer" }} />
              <label style={s.termsTxt} htmlFor="su-terms">
                I agree to Solid5&apos;s{" "}
                <a href="/terms" style={{ color: "#0a7c5c", fontWeight: 600 }}>Terms of Service</a> and{" "}
                <a href="/privacy" style={{ color: "#0a7c5c", fontWeight: 600 }}>Privacy Policy</a>. Shield uses read-only access and never stores my emails.
              </label>
            </div>

            <button type="submit" className={`su-submit-btn${loading ? " loading" : ""}`} disabled={loading}>
              <span className="su-btn-lbl">
                Create Account &nbsp;
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "-2px" }}>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </span>
            </button>
          </form>

          <div style={s.foot}>
            Already have an account?{" "}
            <button onClick={onBack} style={s.link}>Sign in</button>
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="su-R" style={s.R}>
        <div style={s.blob("-120px", "-100px", undefined, undefined, "400px", "400px", "rgba(10,124,92,0.22)")} />
        <div style={s.blob(undefined, undefined, "-100px", "-80px", "340px", "340px", "rgba(29,111,164,0.16)")} />
        <div style={{ ...s.blob(undefined, undefined, undefined, undefined, "220px", "220px", "rgba(13,153,112,0.1)"), top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

        <div style={s.Rinner}>
          <div style={s.slideCard}>
            <div style={s.slideVis}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
              <div style={s.slideFade} />
            </div>
            <div style={s.slideBody}>
              {SLIDES.map((sl, i) => (
                <div key={i} className={`su-slide-item ${i === slide ? "on" : "off"}`}>
                  <h3 style={s.slideH3}>{sl.title}</h3>
                  <p style={s.slideP}>{sl.body}</p>
                </div>
              ))}
              <div style={s.dots}>
                {SLIDES.map((_, i) => (
                  <button key={i} className={`su-dot${i === slide ? " on" : ""}`} onClick={() => setSlide(i)} />
                ))}
              </div>
            </div>
          </div>

          <div style={s.stats}>
            {[["14","Checks"],["<2s","Scan time"],["98%","Accuracy"]].map(([v,l]) => (
              <div key={l} style={s.stat}>
                <div style={s.statV}>{v}</div>
                <div style={s.statL}>{l}</div>
              </div>
            ))}
          </div>

          <div style={s.trust}>
            <div style={s.trustIco}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0d9970" strokeWidth="1.8" width="14" height="14">
                <path d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <strong style={{ fontSize: "12px", fontWeight: 700, color: "#fff", display: "block" }}>Trusted by South Africans</strong>
              <span style={{ fontFamily: "var(--mono,monospace)", fontSize: "9.5px", color: "rgba(255,255,255,0.33)", letterSpacing: "0.04em" }}>
                POPIA &nbsp;·&nbsp; SOC 2 &nbsp;·&nbsp; SSL ENCRYPTED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}