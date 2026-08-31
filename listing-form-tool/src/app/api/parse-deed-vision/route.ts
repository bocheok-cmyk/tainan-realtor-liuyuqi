import { NextRequest, NextResponse } from "next/server";
import { guessDeedFieldsFromImages } from "@/lib/deed-vision";
import { tryConsumeDailyQuota } from "@/lib/rate-limit";

const DAILY_LIMIT = 50;
const MAX_FILES = 6;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "沒有收到圖片" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `一次最多上傳 ${MAX_FILES} 張截圖` }, { status: 400 });
  }

  const quota = await tryConsumeDailyQuota(DAILY_LIMIT);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `今日AI辨識已達上限（${DAILY_LIMIT}次，跟分區AI辨識共用額度），請改用PDF上傳或手動輸入，明天再試。` },
      { status: 429 }
    );
  }

  const images = await Promise.all(
    files.map(async (file) => ({
      data: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mimeType: file.type || "image/png",
    }))
  );

  const guess = await guessDeedFieldsFromImages(images);
  return NextResponse.json({ ...guess, usedToday: quota.usedToday, dailyLimit: DAILY_LIMIT });
}
