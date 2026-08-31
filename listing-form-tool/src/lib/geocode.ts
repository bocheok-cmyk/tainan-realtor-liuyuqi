export type LatLng = { lat: number; lng: number };

/** 用 Google Geocoding API 把地址轉成經緯度。沒設定金鑰時回傳 null。 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  );
  const json = await res.json();
  const loc = json?.results?.[0]?.geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}
