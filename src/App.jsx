// src/App.jsx
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FraudShield from "./pages/FraudShield";
import LoginPage from "./pages/LoginPage";   // ← see note below
import "./App.css";

/**
 * View switcher — no router needed.
 *
 * Views:
 *   "login"     → public login/signup page
 *   "dashboard" → protected FraudShield dashboard
 *
 * The AuthProvider wraps everything so any child can call useAuth().
 */
export default function App() {
  const [view, setView] = useState("dashboard"); // optimistically try dashboard first

  return (
    <AuthProvider>
      {view === "dashboard" ? (
        <ProtectedRoute
          // If Firebase says "not logged in", bounce back to login
          onRedirect={() => setView("login")}
        >
          {/* Your existing dashboard — receives logout via useAuth() */}
          <FraudShield />
        </ProtectedRoute>
      ) : (
        // Once the user signs in successfully, Firebase triggers onAuthStateChanged
        // inside AuthProvider which re-renders — ProtectedRoute will then pass through.
        // We just need to flip the view back to "dashboard" after a successful login.
        <LoginPage onSuccess={() => setView("dashboard")} />
      )}
    </AuthProvider>
  );
}