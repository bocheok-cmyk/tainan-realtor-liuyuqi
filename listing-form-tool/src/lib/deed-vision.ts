import { callGeminiVisionJSON, type GeminiImage } from "@/lib/gemini-vision";

export type DeedVisionResult = {
  landSqm: number | null;
  mainBuildingSqm: number | null;
  ancillaryBuildingSqm: number | null;
  publicSqm: number | null;
  address: string | null;
  landLocation: string | null;
  mortgageWan: number | null;
  mortgagee: string | null;
  note: string;
};

const EMPTY: DeedVisionResult = {
  landSqm: null,
  mainBuildingSqm: null,
  ancillaryBuildingSqm: null,
  publicSqm: null,
  address: null,
  landLocation: null,
  mortgageWan: null,
  mortgagee: null,
  note: "",
};

const SYSTEM_PROMPT =
  "你是地政士助理，讀取台灣地政機關「土地/建物登記謄本」，可能會一次收到多張圖片，" +
  "因為完整謄本常常是土地謄本、建物謄本、他項權利部分開好幾份文件或好幾頁截圖，" +
  "請把所有圖片當成同一筆物件的不同頁面一起讀，欄位互相補齊，合併成同一組JSON，只回傳一個JSON物件，不要有其他文字或說明。" +
  "數字常被印成星號填充（例如*****69.81），星號要忽略當作填充不是數字的一部分。" +
  "欄位定義：" +
  "landSqm＝土地標示部的「面積」（僅土地謄本才有，若沒有任何一張是土地謄本就填null）；" +
  "mainBuildingSqm＝建物「層次面積」或「總面積」（這戶本身登記的面積，不含附屬建物和公設）；" +
  "ancillaryBuildingSqm＝「附屬建物」（陽台/雨遮/露台等）的面積；" +
  "publicSqm＝這戶實際分到的公設坪數：找到「共有部分」那個建號印出的總面積，乘上緊接在附近的「權利範圍：A分之B」比例算出 總面積×(B/A)，不是共有部分的原始總面積本身，也不要跟停車位自己的權利範圍搞混；" +
  "address＝建物標示部的「建物門牌」欄位原文（僅建物謄本才有，例如「東橋七路195號二樓之9」）；" +
  "landLocation＝土地標示部的「坐落」或「土地坐落」欄位原文（段/小段/地號，僅土地謄本才有）；" +
  "mortgageWan＝他項權利部裡「擔保債權總金額」或「擔保債權限額」的數字，換算成「萬」為單位（例如原文是新台幣3,000,000元整，就填300）；如果有多筆抵押權，加總後填總數；完全沒有他項權利部或都是「塗銷」的舊資料就填null；" +
  "mortgagee＝他項權利部裡「權利人」欄位原文（通常是銀行或金融機構名稱），有多筆就用「、」連接，沒有就填null。" +
  "看不出某個欄位就填null，不要用猜的，面積單位一律是平方公尺。" +
  '回傳格式固定為：{"landSqm":數字或null,"mainBuildingSqm":數字或null,"ancillaryBuildingSqm":數字或null,"publicSqm":數字或null,"address":文字或null,"landLocation":文字或null,"mortgageWan":數字或null,"mortgagee":文字或null}';

/**
 * 把謄本截圖（可能是土地/建物/他項權利分開好幾張）一起丟給 Gemini 視覺辨識，
 * 合併讀出坪數相關欄位（含公設持分換算）、地址跟抵押設定資料。
 * 沒有 GEMINI_API_KEY 時整包回 null，前端要提示改用 PDF 上傳或手動輸入。
 */
export async function guessDeedFieldsFromImages(images: GeminiImage[]): Promise<DeedVisionResult> {
  const { text, errorNote } = await callGeminiVisionJSON(
    SYSTEM_PROMPT,
    images.length > 1 ? "請讀取這幾張謄本截圖（同一筆物件的不同頁面）並回傳JSON。" : "請讀取這張謄本截圖並回傳JSON。",
    images
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
      mortgageWan: num(parsed.mortgageWan),
      mortgagee: str(parsed.mortgagee),
      note: "",
    };
  } catch {
    return { ...EMPTY, note: "AI回傳格式異常，請改用PDF上傳或手動輸入" };
  }
}
