import { geocodeAddress } from "@/lib/geocode";

const SCENARIOS = [
  { key: "06H150", label: "6小時累積150mm" },
  { key: "06H250", label: "6小時累積250mm" },
  { key: "06H350", label: "6小時累積350mm" },
  { key: "12H200", label: "12小時累積200mm" },
  { key: "12H300", label: "12小時累積300mm" },
  { key: "12H400", label: "12小時累積400mm" },
  { key: "24H200", label: "24小時累積200mm" },
  { key: "24H350", label: "24小時累積350mm" },
  { key: "24H500", label: "24小時累積500mm" },
  { key: "24H650", label: "24小時累積650mm" },
] as const;

const NCDR_TOKEN_URL = "https://dmap.ncdr.nat.gov.tw/api/tokeninfo";
const MAP_SERVER_BASE = "https://dwgis1.ncdr.nat.gov.tw/server/rest/services/WMS627";

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 5000) return cachedToken.token;
  const res = await fetch(NCDR_TOKEN_URL);
  const json = await res.json();
  cachedToken = { token: json.token, expires: json.expires };
  return cachedToken.token;
}

export type FloodScenarioResult = {
  label: string;
  /** null = 這個情境下這個地點沒有查到淹水潛勢資料 */
  depthRange: string | null;
};

export type FloodRiskResult = {
  scenarios: FloodScenarioResult[];
};

/**
 * 查國家災害防救科技中心（NCDR）淹水潛勢圖資：地址 → 經緯度 → 逐一查10種降雨情境下的淹水深度分類。
 * 沒設定 GOOGLE_MAPS_API_KEY（無法轉經緯度）時回傳 null。
 * 這是政府對外開放但非正式簽約的圖資服務，僅供參考，不保證長期穩定可用。
 */
export async function findFloodRisk(address: string): Promise<FloodRiskResult | null> {
  const loc = await geocodeAddress(address);
  if (!loc) return null;

  const token = await getToken();

  const scenarios = await Promise.all(
    SCENARIOS.map(async (s) => {
      try {
        const url =
          `${MAP_SERVER_BASE}/PotentalFlood${s.key}/MapServer/0/query` +
          `?geometry=${loc.lng},${loc.lat}&geometryType=esriGeometryPoint&inSR=4326` +
          `&spatialRel=esriSpatialRelIntersects&outFields=type&returnGeometry=false&f=json&token=${token}`;
        const res = await fetch(url);
        if (!res.ok) return { label: s.label, depthRange: null };
        const json = await res.json();
        const depthRange = json?.features?.[0]?.attributes?.type ?? null;
        return { label: s.label, depthRange };
      } catch {
        return { label: s.label, depthRange: null };
      }
    })
  );

  return { scenarios };
}
