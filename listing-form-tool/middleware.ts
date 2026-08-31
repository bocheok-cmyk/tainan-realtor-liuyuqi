// 這個檔案目前沒有作用：實測 Next.js 16.2.10 在這個專案不會真的呼叫 middleware/proxy
// （見 src/app/page.tsx 的說明），登入檢查已經直接寫在頁面裡。
// 留著只是因為檔案刪不掉（環境權限擋掉刪除），內容改成無害的原樣通過。
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}
