import { callGeminiVisionJSON } from "@/lib/gemini-vision";

export type DeedVisionResult = {
  landSqm: number | null;
  mainBuildingSqm: number | null;
  ancillaryBuildingSqm: number | null;
  publicSqm: number | null;
  address: string | null;
  landLocation: string | null;
  note: string;
};

const EMPTY: DeedVisionResult = {
  landSqm: null,
  mainBuildingSqm: null,
  ancillaryBuildingSqm: null,
  publicSqm: null,
  address: null,
  landLocation: null,
  note: "",
};

const SYSTEM_PROMPT =
  "你是地政士助理，讀取台灣地政機關「土地/建物登記謄本」（可能是完整PDF全部頁面，也可能只是標示部的截圖），" +
  "在裡面找到標示部的面積數字跟地址，只回傳一個JSON物件，不要有其他文字或說明。" +
  "數字常被印成星號填充（例如*****69.81），星號要忽略當作填充不是數字的一部分。" +
  "欄位定義：" +
  "landSqm＝土地標示部的「面積」（僅土地謄本才有，建物謄本填null）；" +
  "mainBuildingSqm＝建物「層次面積」或「總面積」（這戶本身登記的面積，不含附屬建物和公設）；" +
  "ancillaryBuildingSqm＝「附屬建物」（陽台/雨遮/露台等）的面積；" +
  "publicSqm＝這戶實際分到的公設坪數：找到「共有部分」那個建號印出的總面積，乘上緊接在附近的「權利範圍：A分之B」比例算出 總面積×(B/A)，不是共有部分的原始總面積本身，也不要跟停車位自己的權利範圍搞混；" +
  "address＝建物標示部的「建物門牌」欄位原文（僅建物謄本才有，例如「東橋七路195號二樓之9」，土地謄本填null）；" +
  "landLocation＝土地標示部的「坐落」或「土地坐落」欄位原文（段/小段/地號，僅土地謄本才有，建物謄本填null）。" +
  "看不出某個欄位就填null，不要用猜的，面積單位一律是平方公尺。" +
  '回傳格式固定為：{"landSqm":數字或null,"mainBuildingSqm":數字或null,"ancillaryBuildingSqm":數字或null,"publicSqm":數字或null,"address":文字或null,"landLocation":文字或null}';

/**
 * 把謄本標示部截圖丟給 Gemini 視覺辨識，直接讀出坪數相關欄位（含公設持分換算）跟地址。
 * 沒有 GEMINI_API_KEY 時整包回 null，前端要提示改用 PDF 上傳或手動輸入。
 */
export async function guessDeedFieldsFromImage(
  imageBase64: string,
  mimeType: string
): Promise<DeedVisionResult> {
  const { text, errorNote } = await callGeminiVisionJSON(
    SYSTEM_PROMPT,
    "請讀取這張謄本截圖並回傳JSON。",
    imageBase64,
    mimeType
  );
  if (errorNote) return { ...EMPTY, note: errorNote };

  try {
    const parsed = JSON.parse(text!);
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return {
      landSqm: num(parsed.landSqm),
      mainBuildingSqm: num(parsed.mainBuildingSqm),
      ancillaryBuildingSqm: num(parsed.ancillaryBuildingSqm),
      publicSqm: num(parsed.publicSqm),
      address: str(parsed.address),
      landLocation: str(parsed.landLocation),
      note: "",
    };
  } catch {
    return { ...EMPTY, note: "AI回傳格式異常，請改用PDF上傳或手動輸入" };
  }
}
