import { createClient } from "@/lib/supabase/server";
import {
  MARKET_READJUSTMENT_ERAS,
  ZONE_EXPROPRIATION_GROUPS,
  type LandDevelopmentEra,
  type LandDevelopmentStatus,
} from "@/data/land-development";

interface DbRow {
  mechanism: "市地重劃" | "區段徵收";
  era_group: string;
  era_mark: string | null;
  era_period: string | null;
  name: string;
  nickname: string | null;
  district: string | null;
  period_text: string | null;
  area_hectares: string | number | null;
  status: LandDevelopmentStatus;
  range_description: string | null;
  note: string | null;
  source_url: string | null;
  sort_order: number;
}

function groupRows(rows: DbRow[]): { market: LandDevelopmentEra[]; zone: LandDevelopmentEra[] } {
  const byGroup = new Map<string, LandDevelopmentEra>();
  const order: string[] = [];

  for (const row of rows) {
    if (!byGroup.has(row.era_group)) {
      byGroup.set(row.era_group, {
        key: row.era_group,
        mechanism: row.mechanism,
        mark: row.era_mark ?? "",
        title: row.era_group,
        period: row.era_period ?? "",
        cards: true,
        zones: [],
      });
      order.push(row.era_group);
    }
    byGroup.get(row.era_group)!.zones.push({
      name: row.name,
      nickname: row.nickname ?? undefined,
      district: row.district ?? "",
      period: row.period_text ?? "",
      areaHectares: row.area_hectares === null ? undefined : String(row.area_hectares),
      status: row.status,
      range: row.range_description ?? undefined,
      note: row.note ?? undefined,
      sourceUrl: row.source_url ?? undefined,
    });
  }

  const eras = order.map((k) => byGroup.get(k)!);
  return {
    market: eras.filter((e) => e.mechanism === "市地重劃"),
    zone: eras.filter((e) => e.mechanism === "區段徵收"),
  };
}

// 優先讀 Supabase（後台可編輯的正式資料來源），查不到/還沒接上時退回
// src/data/land-development.ts 的靜態備援，確保這頁在還沒連資料庫之前也能正常顯示。
export async function getLandDevelopmentData(): Promise<{
  market: LandDevelopmentEra[];
  zone: LandDevelopmentEra[];
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("land_development_projects")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return { market: MARKET_READJUSTMENT_ERAS, zone: ZONE_EXPROPRIATION_GROUPS };
    }
    return groupRows(data as DbRow[]);
  } catch {
    return { market: MARKET_READJUSTMENT_ERAS, zone: ZONE_EXPROPRIATION_GROUPS };
  }
}
