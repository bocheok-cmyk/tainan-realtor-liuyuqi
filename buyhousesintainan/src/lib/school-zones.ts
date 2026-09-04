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

const TAINAN_DISTRICTS = [
  "東區", "南區", "北區", "中西區", "安南區", "安平區",
  "新營區", "鹽水區", "白河區", "柳營區", "後壁區", "東山區",
  "麻豆區", "下營區", "六甲區", "官田區", "大內區",
  "佳里區", "學甲區", "西港區", "七股區", "將軍區", "北門區",
  "新化區", "善化區", "新市區", "安定區", "山上區", "玉井區", "楠西區", "南化區", "左鎮區",
  "仁德區", "歸仁區", "關廟區", "龍崎區", "永康區",
];

// 國中版PDF的行政區標頭常常省略「區」字（國小版寫「善化區：」，國中版同一個地方寫「善化：」，
// 只有東/南/北/中西/安南/安平這幾個本來就短的例外，兩種版本都保留完整「區」字），
// 建一個「標頭候選字串 → 正式區名」的對照表，簡寫、全名都能對回同一個區。
const DISTRICT_HEADER_ALIASES = new Map<string, string>();
for (const d of TAINAN_DISTRICTS) {
  DISTRICT_HEADER_ALIASES.set(d, d);
  const short = d.replace(/區$/, "");
  if (short.length >= 2) DISTRICT_HEADER_ALIASES.set(short, d);
}

/**
 * 掃描 matchIdx 之前的文字，找最近一次出現的行政區標頭（例如「善化區：」或簡寫「善化：」），
 * 用來判斷這次里名命中，實際上下文屬於哪個區——台南不同區有同名的里（例如善化區、鹽水區
 * 都各有一個「文昌里」），只用里名比對會把兩個不相干的地方混在一起，一定要用區名再過濾一次。
 */
function findPrecedingDistrict(text: string, matchIdx: number): string | null {
  const headerPattern = /([一-鿿]{2,4})[:：]/g;
  let last: string | null = null;
  let m: RegExpExecArray | null;
  const prefix = text.slice(0, matchIdx);
  while ((m = headerPattern.exec(prefix))) {
    const canonical = DISTRICT_HEADER_ALIASES.get(m[1]);
    if (canonical) last = canonical;
  }
  return last;
}

/**
 * 用「里」名稱查詢學區（例如「泉南里」「大同里」，不含縣市/區，也不處理鄰的細節）。
 * 對每所學校的 zoneRaw 原文做全文比對，找出提到這個里的所有片段。
 * 台南是「共同學區制」：同一個里常常可以在多所學校間自由選填，isSharedZone=true 代表
 * 這個里（或其中某幾鄰）是跟其他學校共用的範圍，不是這間學校唯一負責的區域。
 *
 * 國小版PDF的里名都帶「里」字尾（例如「大同里」），國中版全部省略「里」字（同一個地方寫成
 * 「大同」），所以查詢字串要正規化成兩種型式分別比對，不能直接假設輸入格式跟資料格式一致。
 *
 * districtHint：查詢的里實際所在的區（例如「善化區」），有給的話會過濾掉「同名但不同區」的
 * 誤判命中。強烈建議傳這個參數——沒有的話遇到跨區同名里會把不相干的學校也列進來。
 *
 * 這一步只做到「里」層級——鄰的細節仍然在 context 原文裡，需要更精確判斷時要讓使用者自己核對，
 * 不做進一步的自動拆解（拆解鄰層級出錯風險高，見 school-zones/README.md 的說明）。
 */
export function findSchoolsForVillage(
  villageInput: string,
  level: SchoolZoneLevel,
  districtHint?: string
): SchoolZoneMatch[] {
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
      searchFrom = idx + villageName.length;

      if (districtHint) {
        const preceding = findPrecedingDistrict(record.zoneRaw, idx);
        if (preceding && preceding !== districtHint) continue; // 同名不同區，不是使用者要查的那個里
      }

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
    }
  }

  return matches;
}

/** 同時查小學＋國中學區。districtHint 見 findSchoolsForVillage 的說明，強烈建議傳。 */
export function findSchoolZones(
  villageName: string,
  districtHint?: string
): { elementary: SchoolZoneMatch[]; middle: SchoolZoneMatch[] } {
  return {
    elementary: findSchoolsForVillage(villageName, "elementary", districtHint),
    middle: findSchoolsForVillage(villageName, "middle", districtHint),
  };
}
