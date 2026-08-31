import { NextRequest, NextResponse } from "next/server";
import { guessDeedFields } from "@/lib/deed-parser";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "沒有收到檔案" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(buffer);

  const guess = guessDeedFields(parsed.text);
  return NextResponse.json(guess);
}
