"use client";

import { useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import AppTopLogo from "@/components/AppTopLogo";
import { C, R, T } from "@/lib/iosTokens";

type Mode = "signin" | "register";

export default function SignInPage() {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "signin") await signIn(username, pin);
      else await register(username, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not continue.");
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: C.bg2, padding: "18px 20px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "28px" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ ...T.caption2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: C.blue, margin: 0 }}>
            Daily Tasks
          </p>
          <h1 style={{ ...T.largeTitle, color: C.label, margin: "2px 0 0" }}>
            {mode === "signin" ? "Sign In" : "Create User"}
          </h1>
        </div>
        <AppTopLogo />
      </div>

      <div style={{ display: "flex", backgroundColor: "#E5E5EA", borderRadius: `${R.md}px`, padding: "2px", marginBottom: "18px" }}>
        {(["signin", "register"] as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setMode(item); setError(""); }}
            style={{
              flex: 1,
              minHeight: "32px",
              borderRadius: `${R.sm}px`,
              backgroundColor: mode === item ? C.bg : "transparent",
              color: mode === item ? C.label : C.label2,
              ...T.subhead,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {item === "signin" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div style={{ borderRadius: `${R.lg}px`, overflow: "hidden", backgroundColor: C.bg }}>
          <label style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "48px", padding: "0 16px", borderBottom: `0.5px solid ${C.sep}` }}>
            <UserRound style={{ width: "20px", height: "20px", color: C.label3 }} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoCapitalize="none"
              autoComplete="username"
              style={{ ...T.body, color: C.label, flex: 1, minWidth: 0 }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "12px", minHeight: "48px", padding: "0 16px" }}>
            <LockKeyhole style={{ width: "20px", height: "20px", color: C.label3 }} />
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4 digit PIN"
              autoComplete="current-password"
              inputMode="numeric"
              type="password"
              style={{ ...T.body, color: C.label, flex: 1, minWidth: 0 }}
            />
          </label>
        </div>

        {error && (
          <p style={{ ...T.footnote, color: C.red, margin: "10px 4px 0" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="press"
          style={{
            width: "100%",
            height: "50px",
            borderRadius: "25px",
            backgroundColor: saving ? C.label4 : C.blue,
            color: "#fff",
            ...T.headline,
            cursor: saving ? "default" : "pointer",
            marginTop: "18px",
          }}
        >
          {saving ? "Please wait..." : mode === "signin" ? "Sign In" : "Create User"}
        </button>
      </form>
    </div>
  );
}
