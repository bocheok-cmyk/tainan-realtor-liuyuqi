import "server-only";
import { VOICE_PROFILE } from "./voice-profile";

const MODEL = "claude-sonnet-4-6";

export type PolishResult = {
  polishedText: string;
  wasPolished: boolean;
  error?: string;
};

/**
 * 用她的風格設定潤稿。沒有 API key、逾時、或任何失敗，一律退回原始草稿，
 * 絕不讓潤稿功能擋住發文流程——這跟 appointment-ai.ts 的
 * 「規則制打底、AI 是加分」是同一個設計原則，只是這裡沒有規則制可以打底，
 * 「原始草稿」本身就是那個安全的 fallback。
 */
export async function polishDraft(rawDraft: string): Promise<PolishResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { polishedText: rawDraft, wasPolished: false, error: "未設定 ANTHROPIC_API_KEY" };
  }

  if (!rawDraft.trim()) {
    return { polishedText: rawDraft, wasPolished: false, error: "草稿是空的" };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system:
          VOICE_PROFILE +
          `\n\n只輸出潤飾後的完整文章內容（繁體中文），不要加任何說明、不要加引號包住整篇、不要加「潤飾後：」這種前綴。`,
        messages: [{ role: "user", content: rawDraft }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 200);
      console.error("[polish] API 回錯，改用原始草稿：", errText);
      return { polishedText: rawDraft, wasPolished: false, error: errText };
    }

    const data = await res.json();
    const text = String(data?.content?.[0]?.text || "").trim();

    if (!text) {
      return { polishedText: rawDraft, wasPolished: false, error: "AI 回傳空白" };
    }

    return { polishedText: text, wasPolished: true };
  } catch (e) {
    console.error("[polish] 失敗，改用原始草稿：", e);
    return { polishedText: rawDraft, wasPolished: false, error: String(e) };
  }
}
