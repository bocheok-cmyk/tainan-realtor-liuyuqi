import { NextRequest, NextResponse } from "next/server";
import { findSchoolZones } from "@/lib/school-zones";

// 依「里」名稱查學區（例如 ?village=大同里）。目前只做到里的層級，還沒有「地址→里」的反查，
// 這個先做為驗證資料正確性用，之後「查查我家附近有什麼」網頁要接上地址查詢時會再擴充。
export async function GET(req: NextRequest) {
  const village = req.nextUrl.searchParams.get("village") || "";
  if (!village) {
    return NextResponse.json({ error: "缺少 village 參數" }, { status: 400 });
  }
  return NextResponse.json(findSchoolZones(village));
}
