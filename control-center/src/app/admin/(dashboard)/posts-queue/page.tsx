"use client";

import { useMemo, useState } from "react";
import { applySpacing, type Token } from "@/lib/posting/pangu-spacing";
import { polishAction, submitQueueAction, type Platform } from "./actions";
import { createClient } from "@/lib/supabase/client";

const CHAR_LIMIT = 1900;

const PLATFORM_LABELS: Record<Platform, string> = {
  fb: "臉書",
  ig: "IG",
  threads: "Threads",
};

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
        return '<span class="border-b border-dashed border-accent/60 text-xs text-accent">⋯</span>';
      }
      return escapeHtml(t.ch);
    })
    .join("");
}

type ImageItem = { file: File; previewUrl: string };

export default function PostsQueuePage() {
  const [rawDraft, setRawDraft] = useState("");
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [polishing, setPolishing] = useState(false);
  const [polishNote, setPolishNote] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<Record<Platform, boolean>>({
    fb: true,
    ig: true,
    threads: false,
  });
  const [alsoPostToStory, setAlsoPostToStory] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // 目前 Threads 的改寫規則還沒定案，先跟 FB/IG 用同一份文字。
  const sourceText = polishedText ?? rawDraft;
  const spacing = useMemo(() => applySpacing(sourceText, { pangu: true, blankLine: true }), [sourceText]);
  const finalText = spacing.plainText;
  const charCount = [...finalText].length;
  const overLimit = charCount > CHAR_LIMIT;

  const previewHtml = spacing.lines.map(renderLineHtml).join("<br />");
  const selectedPlatforms = (Object.keys(platforms) as Platform[]).filter((p) => platforms[p]);

  async function handlePolish() {
    if (!rawDraft.trim()) return;
    setPolishing(true);
    setPolishNote(null);
    const result = await polishAction(rawDraft);
    setPolishing(false);
    setPolishedText(result.polishedText);
    if (!result.wasPolished) {
      setPolishNote(
        result.error === "未設定 ANTHROPIC_API_KEY"
          ? "還沒設定 AI 潤稿的金鑰，這裡先原樣顯示你的草稿"
          : `AI 潤稿失敗，先用你的原始草稿（${result.error ?? ""}）`,
      );
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (selectedPlatforms.length === 0 || overLimit || !finalText.trim()) return;
    setSubmitting(true);
    setSubmitMessage(null);

    // 圖片上傳（有 Supabase 才會真的成功；沒接上時就先跳過，不擋整個流程）
    const imageUrls: string[] = [];
    if (images.length > 0) {
      const supabase = createClient();
      for (const img of images) {
        const path = `${Date.now()}-${img.file.name}`;
        const { data, error } = await supabase.storage.from("post-images").upload(path, img.file);
        if (!error && data) imageUrls.push(data.path);
      }
    }

    const result = await submitQueueAction({
      rawDraft,
      polishedText,
      entries: selectedPlatforms.map((platform) => ({
        platform,
        formattedText: finalText,
        charCount,
        alsoPostToStory,
      })),
    });

    setSubmitting(false);
    setSubmitMessage(
      result.ok
        ? "已加入發文佇列，等你確認後再實際發布"
        : `加入失敗：${result.error}（如果是資料庫連線問題，代表 Supabase 專案還沒接上）`,
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold">發文助手</h1>
      <p className="mt-1 text-sm text-text/70">
        寫初稿 → AI 潤飾 → 選平台 → 自動排版優化 → 加入佇列，實際發布前你會再確認一次。
      </p>

      {/* 1. 初稿 */}
      <div className="mt-6 rounded-card border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs tracking-wide text-text/50">文章初稿（你自己寫）</span>
          <span className="font-numeric text-xs text-text/50">{[...rawDraft].length} 字</span>
        </div>
        <textarea
          value={rawDraft}
          onChange={(e) => {
            setRawDraft(e.target.value);
            setPolishedText(null);
            setPolishNote(null);
          }}
          placeholder="在這裡貼上你寫好的文章……"
          className="mt-3 h-48 w-full resize-y rounded-input border border-border bg-surface/40 p-3 text-sm leading-7 outline-none focus:border-primary"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePolish}
            disabled={polishing || !rawDraft.trim()}
            className="h-9 rounded-button bg-primary px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {polishing ? "潤飾中…" : "AI 潤飾（用你的文章風格）"}
          </button>
          {polishNote && <span className="text-xs text-text/50">{polishNote}</span>}
        </div>
      </div>

      {/* 2. 潤飾結果（可編輯） */}
      {polishedText !== null && (
        <div className="mt-4 rounded-card border border-border bg-background p-5">
          <span className="text-xs tracking-wide text-text/50">潤飾結果（可以直接改）</span>
          <textarea
            value={polishedText}
            onChange={(e) => setPolishedText(e.target.value)}
            className="mt-3 h-48 w-full resize-y rounded-input border border-border bg-surface/40 p-3 text-sm leading-7 outline-none focus:border-primary"
          />
        </div>
      )}

      {/* 3. 平台選擇 */}
      <div className="mt-4 rounded-card border border-border bg-background p-5">
        <span className="text-xs tracking-wide text-text/50">要發到哪裡</span>
        <div className="mt-3 flex flex-wrap gap-4">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={platforms[p]}
                onChange={(e) => setPlatforms((prev) => ({ ...prev, [p]: e.target.checked }))}
                className="accent-primary"
              />
              {PLATFORM_LABELS[p]}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-text/40">
            <input type="checkbox" disabled className="accent-primary" />
            個人網站（尚未建置）
          </label>
        </div>
        {platforms.ig && (
          <label className="mt-3 flex items-center gap-2 text-sm text-text/70">
            <input
              type="checkbox"
              checked={alsoPostToStory}
              onChange={(e) => setAlsoPostToStory(e.target.checked)}
              className="accent-primary"
            />
            IG 上傳後同步轉發到限時動態
          </label>
        )}
        {platforms.threads && (
          <p className="mt-3 text-xs text-text/50">
            Threads 版本目前跟 FB/IG 用同一份文字——專屬的改寫規則還沒定案，之後再開發。
          </p>
        )}
      </div>

      {/* 4. 圖片 */}
      <div className="mt-4 rounded-card border border-border bg-background p-5">
        <span className="text-xs tracking-wide text-text/50">圖片</span>
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-input border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 flex items-center justify-center bg-text/60 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                移除
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-input border border-dashed border-border text-xs text-text/50 hover:border-primary hover:text-primary">
            + 上傳
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
          </label>
        </div>
      </div>

      {/* 5. 排版優化預覽 */}
      <div className="mt-4 rounded-card border border-border bg-background p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs tracking-wide text-text/50">
            排版優化預覽（自動套用盤古之白＋行距修復）
          </span>
          <span className={`font-numeric text-xs ${overLimit ? "font-bold text-danger" : "text-text/50"}`}>
            {charCount} / {CHAR_LIMIT} 字
          </span>
        </div>
        <div
          className="mt-3 max-h-64 overflow-y-auto rounded-input border border-border bg-surface/40 p-3 text-sm leading-7"
          dangerouslySetInnerHTML={{ __html: previewHtml || '<span class="text-text/40">寫點東西看看</span>' }}
        />
        {overLimit && (
          <p className="mt-2 text-xs text-danger">
            超過 1900 字上限，IG 也不允許超過，請縮短內容才能加入佇列。
          </p>
        )}
      </div>

      {/* 6. 送出 */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || selectedPlatforms.length === 0 || overLimit || !finalText.trim()}
          className="h-11 rounded-button bg-accent px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "處理中…" : "加入發文佇列"}
        </button>
        {submitMessage && <span className="text-sm text-text/70">{submitMessage}</span>}
      </div>
    </div>
  );
}
