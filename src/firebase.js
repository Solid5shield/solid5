// src/firebase.js  ← single source of truth, used everywhere
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAl-C7k3-M-Zg4Pgr9fijRzxmNFq3dkfD0",
  authDomain: "solid5.firebaseapp.com",
  projectId: "solid5",
  storageBucket: "solid5.firebasestorage.app",
  messagingSenderId: "913140407310",
  appId: "1:913140407310:web:58787c967f27d25947b05f",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;