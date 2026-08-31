import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocode";
import { lookupZoning, lookupReclamationZone } from "@/lib/geo-lookup";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "缺少地址" }, { status: 400 });
  }

  const loc = await geocodeAddress(address);
  if (!loc) {
    return NextResponse.json({ error: "地址定位失敗，請確認地址或改用手動輸入" }, { status: 422 });
  }

  const [zoning, reclamation] = await Promise.all([
    lookupZoning(loc.lat, loc.lng),
    lookupReclamationZone(loc.lat, loc.lng),
  ]);

  return NextResponse.json({ zoning, reclamation });
}
