// src/App.jsx
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import ZohoCallback from "./pages/ZohoCallback";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [view, setView] = useState(() => {
    // Check URL path first, before anything else
    if (window.location.pathname === "/oauth/callback") return "zoho-callback";
    if (window.location.hash === "#signup") return "signup";
    return "landing";
  });

  useEffect(() => {
    if (view === "signup") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Check for connected=zoho param after callback redirects back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "zoho") {
      window.history.replaceState(null, "", window.location.pathname);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("dashboard");
    }
  }, []);

  return (
    <AuthProvider>
      {view === "zoho-callback" ? (
        <ZohoCallback onDone={() => setView("dashboard")} />
      ) : view === "dashboard" ? (
        <ProtectedRoute onRedirect={() => setView("login")}>
          <FraudShield />
        </ProtectedRoute>
      ) : view === "signup" ? (
        <SignupPage
          onSuccess={() => setView("login")}
          onBack={() => setView("landing")}
        />
      ) : view === "login" ? (
        <LoginPage
          onSuccess={() => setView("dashboard")}
          onSignup={() => setView("signup")}
          onBack={() => setView("landing")}
        />
      ) : (
        <LandingPage
          onLogin={() => setView("login")}
          onSignup={() => setView("signup")}
        />
      )}
    </AuthProvider>
  );
}