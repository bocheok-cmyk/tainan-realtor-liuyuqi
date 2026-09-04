import elementaryData from "@/data/school-zones/elementary-115.json";
import middleData from "@/data/school-zones/middle-115.json";

export type SchoolZoneLevel = "elementary" | "middle";

export type SchoolZoneRecord = {
  no: number;
  district: string;
  schoolName: string;
  zoneRaw: string;
};

export type SchoolZoneMatch = {
  level: SchoolZoneLevel;
  district: string;
  schoolName: string;
  /** 這個里在該校 zoneRaw 裡出現的完整片段（含前後文，方便核對是基本學區還是共同學區） */
  context: string;
  /** 這次出現的文字後面有沒有立刻接括號——有代表這是「共同學區」（跟其他學校共用），沒有代表「基本學區」 */
  isSharedZone: boolean;
};

const ELEMENTARY: SchoolZoneRecord[] = elementaryData as SchoolZoneRecord[];
const MIDDLE: SchoolZoneRecord[] = middleData as SchoolZoneRecord[];

/**
 * 用「里」名稱查詢學區（例如「泉南里」「大同里」，不含縣市/區，也不處理鄰的細節）。
 * 對每所學校的 zoneRaw 原文做全文比對，找出提到這個里的所有片段。
 * 台南是「共同學區制」：同一個里常常可以在多所學校間自由選填，isSharedZone=true 代表
 * 這個里（或其中某幾鄰）是跟其他學校共用的範圍，不是這間學校唯一負責的區域。
 *
 * 國小版PDF的里名都帶「里」字尾（例如「大同里」），國中版全部省略「里」字（同一個地方寫成
 * 「大同」），所以查詢字串要正規化成兩種型式分別比對，不能直接假設輸入格式跟資料格式一致。
 *
 * 這一步只做到「里」層級——鄰的細節仍然在 context 原文裡，需要更精確判斷時要讓使用者自己核對，
 * 不做進一步的自動拆解（拆解鄰層級出錯風險高，見 school-zones/README.md 的說明）。
 */
export function findSchoolsForVillage(villageInput: string, level: SchoolZoneLevel): SchoolZoneMatch[] {
  const records = level === "elementary" ? ELEMENTARY : MIDDLE;
  // 國小版帶「里」字尾，國中版不帶——依查詢的資料集正規化成對應格式。
  const villageName =
    level === "elementary"
      ? villageInput.endsWith("里")
        ? villageInput
        : `${villageInput}里`
      : villageInput.endsWith("里")
        ? villageInput.slice(0, -1)
        : villageInput;

  const matches: SchoolZoneMatch[] = [];

  for (const record of records) {
    let searchFrom = 0;
    while (true) {
      const idx = record.zoneRaw.indexOf(villageName, searchFrom);
      if (idx === -1) break;

      const after = record.zoneRaw.slice(idx + villageName.length);
      // 不能只看「後面有沒有括號」就判定共同學區——國中版連基本學區的鄰別範圍也會用括號
      // 標注（例如「大同（5至9鄰）」），要看括號裡面的內容有沒有提到其他學校/共同學區字樣。
      const bracketMatch = after.match(/^[^\n，,。]{0,30}?[（(]([^）)]*)[）)]/);
      const isSharedZone = bracketMatch ? /國小|國中|實小|分校|共同學區/.test(bracketMatch[1]) : false;

      const contextStart = Math.max(0, idx - 10);
      const contextEnd = Math.min(record.zoneRaw.length, idx + villageName.length + 30);
      const context = record.zoneRaw.slice(contextStart, contextEnd).replace(/\n/g, "");

      matches.push({
        level,
        district: record.district,
        schoolName: record.schoolName,
        context,
        isSharedZone,
      });

      searchFrom = idx + villageName.length;
    }
  }

  return matches;
}

/** 同時查小學＋國中學區。 */
export function findSchoolZones(villageName: string): { elementary: SchoolZoneMatch[]; middle: SchoolZoneMatch[] } {
  return {
    elementary: findSchoolsForVillage(villageName, "elementary"),
    middle: findSchoolsForVillage(villageName, "middle"),
  };
}
