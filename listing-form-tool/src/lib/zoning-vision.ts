import { callGeminiVisionJSON } from "@/lib/gemini-vision";

export type ZoningVisionResult = {
  useZone: string | null;
  useCategory: string | null;
  buildingCoverageRatio: string | null;
  floorAreaRatio: string | null;
  note: string;
};

const EMPTY: ZoningVisionResult = {
  useZone: null,
  useCategory: null,
  buildingCoverageRatio: null,
  floorAreaRatio: null,
  note: "",
};

const SYSTEM_PROMPT =
  "你是地政士助理，讀取台南市都市計畫地理資訊查詢系統（或其他縣市同類系統）查詢一筆地號/地址後跳出的分區資訊視窗截圖，" +
  "抓出土地使用分區資料，只回傳一個JSON物件，不要有其他文字或說明。" +
  "欄位定義：" +
  "useZone＝使用分區（例如「第三種住宅區」「商業區」等）；" +
  "useCategory＝使用地類別（非都市土地才有，例如「甲種建築用地」，都市土地填null）；" +
  "buildingCoverageRatio＝建蔽率（保留畫面上的寫法，例如「60%」）；" +
  "floorAreaRatio＝容積率（保留畫面上的寫法，例如「240%」）；" +
  "看不出某個欄位就填null，不要用猜的。" +
  '回傳格式固定為：{"useZone":文字或null,"useCategory":文字或null,"buildingCoverageRatio":文字或null,"floorAreaRatio":文字或null}';

/**
 * 把都市計畫查詢系統跳出的分區資訊視窗截圖丟給 Gemini 視覺辨識，直接讀出分區相關欄位。
 * 沒有 GEMINI_API_KEY 時整包回 null，前端要提示改用手動輸入。
 */
export async function guessZoningFieldsFromImage(
  imageBase64: string,
  mimeType: string
): Promise<ZoningVisionResult> {
  const { text, errorNote } = await callGeminiVisionJSON(
    SYSTEM_PROMPT,
    "請讀取這張都市計畫分區查詢截圖並回傳JSON。",
    imageBase64,
    mimeType
  );
  if (errorNote) return { ...EMPTY, note: errorNote };

  try {
    const parsed = JSON.parse(text!);
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return {
      useZone: str(parsed.useZone),
      useCategory: str(parsed.useCategory),
      buildingCoverageRatio: str(parsed.buildingCoverageRatio),
      floorAreaRatio: str(parsed.floorAreaRatio),
      note: "",
    };
  } catch {
    return { ...EMPTY, note: "AI回傳格式異常，請改用手動輸入" };
  }
}
