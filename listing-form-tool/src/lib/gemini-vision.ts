const MODEL = "gemini-3.6-flash";

/**
 * 呼叫 Gemini 視覺辨識，強制回傳 JSON 字串（呼叫端自己 JSON.parse）。
 * 沒有 GEMINI_API_KEY 時回傳 null，呼叫端要自己處理「無法使用」的提示文字。
 */
export async function callGeminiVisionJSON(
  systemPrompt: string,
  userPrompt: string,
  imageBase64: string,
  mimeType: string
): Promise<{ text: string | null; errorNote: string | null }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: null, errorNote: "尚未設定 GEMINI_API_KEY，無法使用AI辨識" };

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
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
                { text: userPrompt },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(20000),
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
