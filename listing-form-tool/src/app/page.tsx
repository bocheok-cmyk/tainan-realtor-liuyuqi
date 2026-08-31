import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ListingForm from "@/app/ListingForm";

export default async function Page() {
  // Next.js 16.2.10 的 proxy/middleware 在這個專案的dev/webpack/turbopack組合下實測都不會被呼叫
  // （連最簡單的無條件redirect都不執行，疑似這個版本的bug），所以登入檢查直接放在頁面本身，
  // 不依賴proxy.ts/middleware.ts——這兩個檔案目前留著但沒有作用。
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return <ListingForm />;
}
