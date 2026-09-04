import { promises as fs } from "fs";
import path from "path";

// point-in-polygon核心邏輯跟 listing-form-tool 的 src/lib/geo-lookup.ts 是同一套（那邊拿來查
// 使用分區/重劃區，這邊拿來查村里），兩邊各自獨立一份而不是共用套件，因為是兩個不同的 Next.js 專案。

type Ring = [number, number][];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };

type Feature<P> = { type: "Feature"; properties: P; geometry: Geometry };
type FeatureCollection<P> = { type: "FeatureCollection"; features: Feature<P>[] };

/** 地址定位點常常落在道路正中央、剛好不在任何分區polygon裡面一點點，超過這個距離（約100公尺）才判定查無資料 */
const NEAREST_MAX_DEGREES = 0.001;

function ringsOf(geometry: Geometry): Ring[] {
  return geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
}

/** 射線法判斷點是否在單一環（ring）裡面，[lng, lat] 順序跟 GeoJSON 一致 */
function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygonRings(lng: number, lat: number, rings: Ring[]): boolean {
  if (rings.length === 0 || !pointInRing(lng, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) {
    if (pointInRing(lng, lat, rings[k])) return false;
  }
  return true;
}

function pointInGeometry(lng: number, lat: number, geometry: Geometry): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonRings(lng, lat, geometry.coordinates);
  }
  return geometry.coordinates.some((rings) => pointInPolygonRings(lng, lat, rings));
}

function distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function distancePointToFeature(lng: number, lat: number, geometry: Geometry): number {
  let min = Infinity;
  for (const ring of ringsOf(geometry)) {
    for (let i = 0; i < ring.length - 1; i++) {
      const d = distancePointToSegment(lng, lat, ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
      if (d < min) min = d;
    }
  }
  return min;
}

/**
 * 先找「點真的落在裡面」的feature；地址定位點常剛好落在道路縫隙裡找不到，
 * 就退而求其次找距離最近的feature（在NEAREST_MAX_DEGREES範圍內），並標記為approx。
 */
function findFeature<P>(fc: FeatureCollection<P>, lng: number, lat: number): { properties: P; approx: boolean } | null {
  for (const feature of fc.features) {
    if (pointInGeometry(lng, lat, feature.geometry)) return { properties: feature.properties, approx: false };
  }

  let best: Feature<P> | null = null;
  let bestDist = Infinity;
  for (const feature of fc.features) {
    const d = distancePointToFeature(lng, lat, feature.geometry);
    if (d < bestDist) {
      bestDist = d;
      best = feature;
    }
  }
  if (best && bestDist <= NEAREST_MAX_DEGREES) return { properties: best.properties, approx: true };
  return null;
}

const GEO_DIR = path.join(process.cwd(), "data", "geo");
const cache = new Map<string, FeatureCollection<unknown>>();

async function loadGeoJSON<P>(filename: string): Promise<FeatureCollection<P>> {
  const cached = cache.get(filename);
  if (cached) return cached as FeatureCollection<P>;
  const raw = await fs.readFile(path.join(GEO_DIR, filename), "utf-8");
  const parsed = JSON.parse(raw) as FeatureCollection<P>;
  cache.set(filename, parsed as FeatureCollection<unknown>);
  return parsed;
}

type VillageProps = {
  COUNTYNAME: string;
  TOWNNAME: string;
  VILLNAME: string;
};

export type VillageLookupResult = {
  county: string;
  town: string;
  village: string;
  approx: boolean;
};

/**
 * 查一個座標落在台南市哪個「村里」。資料來源：內政部國土測繪中心「村(里)界(TWD97經緯度)」
 * 開放資料，見 data/geo/README.md。只收錄臺南市（下載時已過濾），查其他縣市一律回傳 null。
 */
export async function lookupVillage(lat: number, lng: number): Promise<VillageLookupResult | null> {
  const fc = await loadGeoJSON<VillageProps>("village.geojson");
  const hit = findFeature(fc, lng, lat);
  if (!hit) return null;
  return {
    county: hit.properties.COUNTYNAME,
    town: hit.properties.TOWNNAME,
    village: hit.properties.VILLNAME,
    approx: hit.approx,
  };
}
