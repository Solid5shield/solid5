// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// ── Firebase config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAl-C7k3-M-Zg4Pgr9fijRzxmNFq3dkfD0",
  authDomain: "solid5.firebaseapp.com",
  projectId: "solid5",
  storageBucket: "solid5.firebasestorage.app",
  messagingSenderId: "913140407310",
  appId: "1:913140407310:web:58787c967f27d25947b05f",
};

// Prevent re-initialising on hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // `undefined`  → still loading
  // `null`       → loaded, not logged in
  // `User`       → loaded, logged in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsub; // cleanup listener on unmount
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined, logout, auth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}