import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
import { lookupVillage } from "@/lib/geo-lookup";
import { findSchoolZones } from "@/lib/school-zones";

// 「查查我家附近有什麼」的第一步雛形：地址 → 座標 → 村里 → 學區。
// 之後其他8項功能（周邊設施/淹水潛勢/土壤液化/土地使用分區/嫌惡設施/大眾運輸/醫療資源）
// 陸續接進來時，都會是同一個「先 geocode 出座標，再各自查詢」的模式。
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") || "";
  if (!address) {
    return NextResponse.json({ error: "缺少 address 參數" }, { status: 400 });
  }

  const coord = await geocodeAddress(address);
  if (!coord) {
    return NextResponse.json({ error: "查不到這個地址的座標，請確認地址是否正確" }, { status: 404 });
  }

  const village = await lookupVillage(coord.lat, coord.lng);
  if (!village) {
    return NextResponse.json({
      coord,
      village: null,
      schoolZones: null,
      note: "這個座標不在台南市村里資料範圍內（也可能是地址落在道路縫隙、離最近的村里超過100公尺，查無結果）",
    });
  }

  const schoolZones = findSchoolZones(village.village, village.town);

  return NextResponse.json({ coord, village, schoolZones });
}
