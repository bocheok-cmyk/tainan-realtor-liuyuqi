"use client";

import { useMemo, useState } from "react";
import { applySpacing, type Token } from "@/lib/posting/pangu-spacing";

const SAMPLE =
  "今天要跟大家分享一間位在台南東區的3房2廳物件，總價1580萬，屋齡15年。\n\n這間房子採光非常好，離捷運站走路5分鐘。\n\n有興趣的朋友歡迎line我預約看房！";

function escapeHtml(ch: string) {
  return ch.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderLineHtml(tokens: Token[]) {
  return tokens
    .map((t) => {
      if (t.inserted && t.kind === "pangu") {
        return '<mark class="rounded-sm bg-pale-terracotta px-0.5 font-semibold text-accent"> </mark>';
      }
      if (t.inserted && t.kind === "zwsp") {
        return '<span class="border-b border-dashed border-accent/60 text-xs text-accent" title="隱藏字元，避免這行空行被平台吃掉">⋯</span>';
      }
      return escapeHtml(t.ch);
    })
    .join("");
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function PostsQueuePage() {
  const [input, setInput] = useState("");
  const [pangu, setPangu] = useState(true);
  const [blankLine, setBlankLine] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => applySpacing(input, { pangu, blankLine }),
    [input, pangu, blankLine],
  );

  const previewHtml = result.lines.map(renderLineHtml).join("<br />");
  const fbPreviewText = result.plainText.replace(/​/g, "");

  async function handleCopy() {
    const ok = await copyText(result.plainText);
    setCopied(ok);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">發文助手 — 排版優化</h1>
      <p className="mt-1 text-sm text-text/70">
        貼上文章，自動補上盤古之白間距、修復 FB/IG 空行，複製後即可發文。
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-6 rounded-card border border-border bg-background px-5 py-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pangu}
            onChange={(e) => setPangu(e.target.checked)}
            className="accent-primary"
          />
          盤古之白（中英數間距）
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={blankLine}
            onChange={(e) => setBlankLine(e.target.checked)}
            className="accent-primary"
          />
          行距修復（防止空行被吃掉）
        </label>
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="ml-auto rounded-full border border-border px-3 py-1 text-xs text-text/60 hover:border-primary hover:text-primary"
        >
          填入範例文字
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs tracking-wide text-text/50">輸入原文</span>
            <span className="font-numeric text-xs text-text/50">
              {[...input].length} 字
            </span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在這裡貼上你要發佈的貼文內容……"
            className="mt-3 h-80 w-full resize-y rounded-input border border-border bg-surface/40 p-3 text-sm leading-7 outline-none focus:border-primary"
          />
        </div>

        <div className="rounded-card border border-border bg-background p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs tracking-wide text-text/50">轉換結果</span>
            <span className="font-numeric text-xs text-text/50">
              {[...result.plainText].length} 字
            </span>
          </div>
          <div
            className="mt-3 h-80 overflow-y-auto rounded-input border border-border bg-surface/40 p-3 text-sm leading-7"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="font-numeric flex gap-4 text-xs text-text/60">
              <span>
                補空格 <b className="text-text">{result.spaceCount}</b>
              </span>
              <span>
                修復空行 <b className="text-text">{result.zwspCount}</b>
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`h-9 rounded-button px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 ${
                copied ? "bg-success" : "bg-accent"
              }`}
            >
              {copied ? "已複製！" : "複製轉換結果"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs tracking-wide text-text/50">Facebook 貼文預覽</p>
        <div className="rounded-card border border-border bg-background p-5">
          <p className="text-sm font-medium">劉育琪</p>
          <p className="text-xs text-text/50">剛剛 · 🌐</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
            {fbPreviewText || "貼上文字後，這裡預覽貼文實際顯示的樣子"}
          </p>
        </div>
      </div>
    </div>
  );
}
