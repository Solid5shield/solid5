// src/components/ProtectedRoute.jsx
import { useAuth } from "../context/AuthContext";

/**
 * Wraps any component that requires authentication.
 *
 * States:
 *  • Loading  → shows a branded splash screen while Firebase resolves the session
 *  • Unauthed → calls onRedirect() so the parent can swap to the Login view
 *  • Authed   → renders children normally
 */
export default function ProtectedRoute({ children, onRedirect }) {
  const { user, loading } = useAuth();

  // ── 1. Firebase is still resolving the persisted session ──────────────────
  if (loading) {
    return <LoadingScreen />;
  }

  // ── 2. No user — trigger the redirect callback ────────────────────────────
  if (!user) {
    // Use a microtask so we don't call setState during render
    Promise.resolve().then(onRedirect);
    return null;
  }

  // ── 3. Authenticated — render the protected content ───────────────────────
  return children;
}

// ── Branded loading screen ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Shield icon */}
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={styles.icon}>
          <path
            d="M12 2L4 6v7c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6L12 2z"
            stroke="url(#lg)"
            strokeWidth="1.6"
          />
          <path d="M9 12l2 2 4-4" stroke="#0d9970" strokeWidth="1.8" strokeLinecap="round" />
          <defs>
            <linearGradient id="lg" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0a7c5c" />
              <stop offset="1" stopColor="#1d6fa4" />
            </linearGradient>
          </defs>
        </svg>

        <p style={styles.label}>Verifying session…</p>

        {/* Animated bar */}
        <div style={styles.track}>
          <div style={styles.bar} />
        </div>
      </div>

      <style>{`
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%);  }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fdf8f2",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    animation: "fadeIn 0.4s ease both",
  },
  icon: {
    filter: "drop-shadow(0 4px 12px rgba(10,124,92,0.25))",
  },
  label: {
    fontSize: "13px",
    color: "#9c8e7a",
    letterSpacing: "0.04em",
    fontFamily: "'JetBrains Mono', monospace",
    margin: 0,
  },
  track: {
    width: "120px",
    height: "3px",
    borderRadius: "2px",
    background: "#ede4d8",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    width: "40%",
    borderRadius: "2px",
    background: "linear-gradient(90deg, #0a7c5c, #1d6fa4)",
    animation: "slide 1.2s ease-in-out infinite",
  },
};