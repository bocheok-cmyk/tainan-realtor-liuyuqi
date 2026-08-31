const MODEL = "gemini-3.6-flash";

export type GeminiImage = { data: string; mimeType: string };

/**
 * 呼叫 Gemini 視覺辨識，強制回傳 JSON 字串（呼叫端自己 JSON.parse）。
 * 可以一次丟多張圖片（例如謄本的土地頁、建物頁、他項權利頁分開截圖），
 * 全部放進同一個request讓AI一起讀、合併成一組結果。
 * 沒有 GEMINI_API_KEY 時回傳 null，呼叫端要自己處理「無法使用」的提示文字。
 */
export async function callGeminiVisionJSON(
  systemPrompt: string,
  userPrompt: string,
  images: GeminiImage[]
): Promise<{ text: string | null; errorNote: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: null, errorNote: "尚未設定 GEMINI_API_KEY，無法使用AI辨識" };
  if (images.length === 0) return { text: null, errorNote: "沒有收到圖片" };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: "user",
              parts: [
                ...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.data } })),
                { text: userPrompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!res.ok) return { text: null, errorNote: `AI辨識失敗（HTTP ${res.status}）` };

    const json = await res.json();
    const text = String(json?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    if (!text) return { text: null, errorNote: "AI沒有回傳任何內容，請改用手動輸入" };

    return { text, errorNote: null };
  } catch {
    return { text: null, errorNote: "AI辨識發生錯誤，請改用手動輸入" };
  }
}
