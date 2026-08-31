import { NextRequest, NextResponse } from "next/server";
import { generateFeatures } from "@/lib/features-ai";
import type { CaseType, ListingData } from "@/lib/listing-schema";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { data: ListingData; caseType: CaseType };
  const result = await generateFeatures(body.data, body.caseType);
  return NextResponse.json(result);
}
