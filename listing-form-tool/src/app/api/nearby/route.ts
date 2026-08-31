import { NextRequest, NextResponse } from "next/server";
import { findNearby, NearbyCategory } from "@/lib/nearby-places";

const CATEGORIES: NearbyCategory[] = ["school", "park", "bank", "market"];

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") || "";
  if (!address) return NextResponse.json({ error: "缺少地址" }, { status: 400 });

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ configured: false, results: null });
  }

  const entries = await Promise.all(
    CATEGORIES.map(async (c) => [c, await findNearby(address, c)] as const)
  );

  return NextResponse.json({ configured: true, results: Object.fromEntries(entries) });
}
