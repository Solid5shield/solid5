// src/App.jsx
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import LoginPage from "./pages/LoginPage";

export default function App() {
  const [view, setView] = useState("login"); // app always starts at login/dashboard

  useEffect(() => {
    // If linked from landing page with a hash, respect it
    if (window.location.hash === "#signup") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView("login");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <AuthProvider>
      {view === "dashboard" ? (
        <ProtectedRoute onRedirect={() => setView("login")}>
          <FraudShield />
        </ProtectedRoute>
      ) : (
        <LoginPage
          onSuccess={() => setView("dashboard")}
          onBack={() => { window.location.href = "/landing.html"; }}
        />
      )}
    </AuthProvider>
  );
}