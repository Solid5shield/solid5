// src/App.jsx
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage"; // ← import your landing page

export default function App() {
  const [view, setView] = useState("landing"); // ← start at landing now

  return (
    <AuthProvider>
      {view === "landing" ? (
        <LandingPage
          onGetStarted={() => setView("login")}   // CTA → login
          onLogin={() => setView("login")}         // "Sign in" link → login
        />
      ) : view === "dashboard" ? (
        <ProtectedRoute onRedirect={() => setView("login")}>
          <FraudShield />
        </ProtectedRoute>
      ) : (
        <LoginPage
          onSuccess={() => setView("dashboard")}
          onBack={() => setView("landing")}        // optional back link
        />
      )}
    </AuthProvider>
  );
}