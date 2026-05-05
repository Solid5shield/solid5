// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // ← shared instance, no duplicate init
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import ZohoCallback from "./pages/ZohoCallback";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [view, setView] = useState(() => {
    if (window.location.pathname === "/oauth/callback") return "zoho-callback";
    if (window.location.hash === "#signup") return "signup";
    return sessionStorage.getItem("appView") || "landing";
  });

  const navigate = (newView) => {
    if (["landing", "login", "signup"].includes(newView)) {
      sessionStorage.removeItem("appView");
    } else {
      sessionStorage.setItem("appView", newView);
    }
    setView(newView);
  };

  // Firebase auth state — single listener using shared auth instance
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        sessionStorage.setItem("appView", "dashboard");
        setView((prev) =>
          ["landing", "login", "signup"].includes(prev) ? "dashboard" : prev,
        );
      } else {
        sessionStorage.removeItem("appView");
        setView((prev) => (prev === "dashboard" ? "landing" : prev));
      }
    });
    return unsub;
  }, []);

  // Handle OAuth redirect back (?connected=gmail etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      window.history.replaceState(null, "", window.location.pathname);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      navigate("dashboard");
    }
  }, []);

  return (
    <AuthProvider>
      {view === "zoho-callback" ? (
        <ZohoCallback onDone={() => navigate("dashboard")} />
      ) : view === "dashboard" ? (
        <ProtectedRoute onRedirect={() => navigate("login")}>
          <FraudShield />
        </ProtectedRoute>
      ) : view === "signup" ? (
        <SignupPage
          onSuccess={() => navigate("login")}
          onBack={() => navigate("landing")}
        />
      ) : view === "login" ? (
        <LoginPage
          onSuccess={() => navigate("dashboard")}
          onSignup={() => navigate("signup")}
          onBack={() => navigate("landing")}
        />
      ) : (
        <LandingPage
          onLogin={() => navigate("login")}
          onSignup={() => navigate("signup")}
        />
      )}
    </AuthProvider>
  );
}
