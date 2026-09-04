"use client";

import { useState } from "react";

export function ContactForm({ articleId }: { articleId?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // e.currentTarget goes null once this handler yields past an await
    // (React tears down the synthetic event after dispatch), so grab
    // everything we need from the form synchronously, up front.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          contactInfo: form.get("contactInfo"),
          message: form.get("message"),
          articleId,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("sent");
      formEl.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-card border border-border bg-surface p-6 text-sm text-text">
        訊息已經送出，我看到會盡快回覆你，謝謝你留言 🙏
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-border bg-surface p-6">
      <h3 className="mb-4 font-heading text-lg font-bold text-text">留言給我</h3>
      <div className="flex flex-col gap-4">
        <input
          name="name"
          required
          placeholder="怎麼稱呼你"
          className="h-11 rounded-input border border-border bg-background px-4 text-sm text-text placeholder:text-text/40 focus:border-primary focus:outline-none"
        />
        <input
          name="contactInfo"
          required
          placeholder="LINE ID、電話或 Email，方便我回覆你"
          className="h-11 rounded-input border border-border bg-background px-4 text-sm text-text placeholder:text-text/40 focus:border-primary focus:outline-none"
        />
        <textarea
          name="message"
          required
          rows={4}
          placeholder="想問的問題，或想聊的房子"
          className="min-h-[120px] rounded-input border border-border bg-background px-4 py-3 text-sm text-text placeholder:text-text/40 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-11 rounded-button bg-primary px-6 text-sm font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-60"
        >
          {status === "sending" ? "送出中…" : "送出"}
        </button>
        {status === "error" && (
          <p className="text-sm text-danger">送出失敗，麻煩直接透過下方電話或 LINE 聯絡我。</p>
        )}
      </div>
    </form>
  );
}
