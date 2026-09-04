export type LatLng = { lat: number; lng: number };

/**
 * 用 Nominatim（OpenStreetMap 免費 geocoding）把地址轉成經緯度，不需要申請金鑰。
 * 這是過渡方案：台灣地址準確度比官方 TGOS 差一些但堪用，等她的 TGOS「全國門牌位置比對服務」
 * 核准後要換成官方版本（跟 台南市重劃區地圖.html 用的是同一個決策，這個網站是公開給不特定
 * 大眾用的查詢工具，不像 listing-form-tool 是她自己內部用，用 Google Geocoding API 這種
 * 按查詢量計費的服務不合適）。
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tw&q=${encodeURIComponent(address)}`,
    { headers: { "User-Agent": "buyhousesintainan.com address lookup (contact: buyhousesintainan.2019@gmail.com)" } }
  );
  if (!res.ok) return null;
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  const first = results[0];
  if (!first) return null;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}
