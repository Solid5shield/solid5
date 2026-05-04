// src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
const msProvider = new OAuthProvider("microsoft.com");

const ERROR_MESSAGES = {
  "auth/user-not-found":    "No account found with this email.",
  "auth/wrong-password":    "Incorrect password. Please try again.",
  "auth/invalid-email":     "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-credential":"Invalid email or password.",
};

/**
 * LoginPage — React port of your login.html.
 *
 * Props:
 *   onSuccess  called after any successful sign-in so App.jsx can swap the view
 */
export default function LoginPage({ onSuccess }) {
  const { auth } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(null); // "email" | "google" | "ms" | null

  function showError(msg) {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }

  async function handleEmail(e) {
    e.preventDefault();
    setLoading("email");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err) {
      showError(ERROR_MESSAGES[err.code] || err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading("google");
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") showError(err.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleMicrosoft() {
    setLoading("ms");
    try {
      await signInWithPopup(auth, msProvider);
      onSuccess();
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") showError(err.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.box}>

        {/* Badge */}
        <div style={s.badge}>
          <span style={s.dot} />
          Secure sign in
        </div>

        <h1 style={s.title}>Sign in to Shield</h1>
        <p style={s.sub}>
          New to Solid5?{" "}
          <a href="signup.html" style={s.link}>Create a free account →</a>
        </p>

        {/* SSO row */}
        <div style={s.ssoRow}>
          <button
            style={{ ...s.ssoBtn, opacity: loading === "google" ? 0.6 : 1 }}
            onClick={handleGoogle}
            disabled={!!loading}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            style={{ ...s.ssoBtn, ...s.msBtn, opacity: loading === "ms" ? 0.6 : 1 }}
            onClick={handleMicrosoft}
            disabled={!!loading}
          >
            <MsIcon />
            Continue with Microsoft
          </button>
        </div>

        {/* Divider */}
        <div style={s.divider}>
          <div style={s.divLine} />
          <span style={s.divText}>or sign in with email</span>
          <div style={s.divLine} />
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmail} style={s.form} noValidate>
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={s.input}
              autoComplete="email"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ ...s.input, paddingRight: "40px" }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={s.eyeBtn}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div style={s.footerRow}>
            <label style={s.remember}>
              <input type="checkbox" style={{ accentColor: "#0a7c5c" }} />
              Remember me
            </label>
            <a href="forgot-password.html" style={s.forgot}>Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={!!loading}
            style={{ ...s.submit, opacity: loading === "email" ? 0.65 : 1 }}
          >
            {loading === "email" ? "Signing in…" : "Sign in to Shield →"}
          </button>
        </form>

        <p style={s.signupRow}>
          Don't have an account?{" "}
          <a href="signup.html" style={s.link}>Sign up free</a>
        </p>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
function MsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 23 23">
      <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
      <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
      <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
      <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// ── Styles (matching your existing Solid5 design tokens) ──────────────────
const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fdf8f2",
    fontFamily: "'DM Sans', sans-serif",
    padding: "24px",
  },
  box: {
    width: "100%",
    maxWidth: "420px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(10,124,92,0.09)",
    border: "1px solid rgba(10,124,92,0.25)",
    borderRadius: "20px",
    padding: "5px 12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    fontWeight: 600,
    color: "#0a7c5c",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  dot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#0a7c5c",
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "clamp(24px, 3vw, 32px)",
    fontWeight: 800,
    color: "#1e1a14",
    letterSpacing: "-0.6px",
    marginBottom: "6px",
  },
  sub: {
    fontSize: "14px",
    color: "#5a4f3f",
    marginBottom: "32px",
    lineHeight: 1.6,
  },
  link: {
    color: "#0a7c5c",
    textDecoration: "none",
    fontWeight: 600,
  },
  ssoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "24px",
  },
  ssoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    border: "1px solid rgba(90,60,20,0.1)",
    background: "#fff",
    color: "#1e1a14",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
  },
  msBtn: {
    background: "#0078d4",
    color: "#fff",
    borderColor: "#0078d4",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  divLine: {
    flex: 1,
    height: "1px",
    background: "rgba(90,60,20,0.1)",
  },
  divText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#9c8e7a",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(220,38,38,0.07)",
    border: "1px solid rgba(220,38,38,0.2)",
    borderRadius: "10px",
    padding: "12px 14px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#b91c1c",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#5a4f3f",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid rgba(90,60,20,0.1)",
    borderRadius: "10px",
    background: "#faf5ee",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1e1a14",
    outline: "none",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9c8e7a",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#5a4f3f",
    cursor: "pointer",
  },
  forgot: {
    fontSize: "13px",
    color: "#0a7c5c",
    textDecoration: "none",
    fontWeight: 600,
  },
  submit: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0a7c5c, #1d6fa4)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.25s",
  },
  signupRow: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "13px",
    color: "#5a4f3f",
  },
};