import { geocodeAddress } from "@/lib/geocode";

export type NearbyCategory = "school" | "park" | "bank" | "market";

const CATEGORY_QUERY: Record<NearbyCategory, string> = {
  school: "國小 OR 國中 OR 高中",
  park: "公園",
  bank: "銀行 OR 郵局",
  market: "市場 OR 超市 OR 全聯 OR 家樂福",
};

export type NearbyPlace = {
  name: string;
  distanceMeters: number;
};

/**
 * 用 Places API (New) 的 Text Search 查地址附近的設施，只要名稱＋距離（Essentials 等級欄位，免費額度內）。
 * 沒有設定 GOOGLE_MAPS_API_KEY 時回傳 null，前端會改成手動輸入。
 */
export async function findNearby(
  address: string,
  category: NearbyCategory
): Promise<NearbyPlace[] | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const loc = await geocodeAddress(address);
  if (!loc) return [];

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName,places.location",
    },
    body: JSON.stringify({
      textQuery: CATEGORY_QUERY[category],
      locationBias: {
        circle: { center: { latitude: loc.lat, longitude: loc.lng }, radius: 1000 },
      },
      languageCode: "zh-TW",
      maxResultCount: 5,
    }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  const places = Array.isArray(json?.places) ? json.places : [];

  return places
    .map((p: { displayName?: { text?: string }; location?: { latitude: number; longitude: number } }) => ({
      name: p.displayName?.text || "",
      distanceMeters: p.location ? haversine(loc.lat, loc.lng, p.location.latitude, p.location.longitude) : 0,
    }))
    .filter((p: NearbyPlace) => p.name)
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceMeters - b.distanceMeters);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
