"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/supabase/username";

const bg = "#F7F4EF";
const surface = "#E8E2D7";
const primary = "#7E9384";
const ink = "#3E463D";
const muted = "#A69A8F";
const border = "#DADADA";
const headingFont = "var(--font-heading), 'Noto Serif TC', serif";
const bodyFont = "var(--font-body), 'Noto Sans TC', sans-serif";

const input = {
  width: "100%",
  height: 44,
  padding: "0 16px",
  fontSize: 16,
  border: `1px solid ${border}`,
  borderRadius: 14,
  boxSizing: "border-box" as const,
  background: bg,
  color: ink,
  fontFamily: bodyFont,
  marginTop: 6,
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    setPending(false);

    if (error) {
      setError("登入失敗，請確認帳號密碼是否正確");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: surface,
          borderRadius: 20,
          border: `1px solid ${border}`,
          padding: 32,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, fontFamily: headingFont, color: ink, margin: 0 }}>
          謄本填表工具
        </h1>
        <p style={{ fontSize: 14, color: muted, fontFamily: bodyFont, marginTop: 4, marginBottom: 20 }}>
          內部登入
        </p>

        <label style={{ fontSize: 14, color: muted, fontFamily: bodyFont }}>
          帳號
          <input
            style={input}
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label style={{ fontSize: 14, color: muted, fontFamily: bodyFont, display: "block", marginTop: 16 }}>
          密碼
          <input
            style={input}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p style={{ fontSize: 13, color: "#b45309", marginTop: 12, fontFamily: bodyFont }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            marginTop: 20,
            width: "100%",
            height: 44,
            borderRadius: 14,
            border: "none",
            background: primary,
            color: "#fff",
            fontFamily: bodyFont,
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}
