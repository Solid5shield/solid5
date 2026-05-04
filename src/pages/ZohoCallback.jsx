import { useEffect } from "react";

export default function ZohoCallback({ onDone }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      console.error("Zoho OAuth error:", error);
      onDone();
      return;
    }

    // Exchange code via your Worker
    fetch("/api/zoho/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then(() => {
        window.history.replaceState(null, "", "/");
        onDone();
      })
      .catch((err) => {
        console.error("Token exchange failed:", err);
        onDone();
      });
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", fontFamily: "monospace", color: "#0077aa",
      flexDirection: "column", gap: 12
    }}>
      <div style={{ fontSize: 24 }}>⏳</div>
      <div>Connecting Zoho Mail...</div>
    </div>
  );
}