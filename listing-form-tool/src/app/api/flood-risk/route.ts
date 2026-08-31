import { NextRequest, NextResponse } from "next/server";
import { findFloodRisk } from "@/lib/flood-risk";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") || "";
  if (!address) return NextResponse.json({ error: "缺少地址" }, { status: 400 });

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json({ configured: false, result: null });
  }

  const result = await findFloodRisk(address);
  return NextResponse.json({ configured: true, result });
}
