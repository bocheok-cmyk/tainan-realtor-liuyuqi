import { NextRequest, NextResponse } from "next/server";
import { guessDeedFieldsFromImage } from "@/lib/deed-vision";
import { tryConsumeDailyQuota } from "@/lib/rate-limit";

const DAILY_LIMIT = 50;

export async function POST(req: NextRequest) {
  const quota = await tryConsumeDailyQuota(DAILY_LIMIT);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `今日AI辨識已達上限（${DAILY_LIMIT}次，跟分區AI辨識共用額度），請改用PDF上傳或手動輸入，明天再試。` },
      { status: 429 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "沒有收到圖片" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/png";

  const guess = await guessDeedFieldsFromImage(base64, mimeType);
  return NextResponse.json({ ...guess, usedToday: quota.usedToday, dailyLimit: DAILY_LIMIT });
}
