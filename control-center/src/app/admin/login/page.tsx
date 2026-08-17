"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/supabase/username";

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

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-card border border-border bg-background p-8"
      >
        <h1 className="text-2xl font-bold">中控情報臺</h1>
        <p className="mt-1 text-sm text-text/70">登入後台</p>

        <label className="mt-6 block text-sm">
          帳號
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 h-11 w-full rounded-input border border-border px-3 outline-none focus:border-primary"
          />
        </label>

        <label className="mt-4 block text-sm">
          密碼
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-input border border-border px-3 outline-none focus:border-primary"
          />
        </label>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-11 w-full rounded-button bg-primary font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}
