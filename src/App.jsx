// src/App.jsx
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const [view, setView] = useState("landing");

  useEffect(() => {
    if (window.location.hash === "#signup") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("signup");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <AuthProvider>
      {view === "dashboard" ? (
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