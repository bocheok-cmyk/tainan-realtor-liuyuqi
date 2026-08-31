import { createClient } from "@supabase/supabase-js";

function todayInTaiwan(): string {
  // 用台灣時區（UTC+8）判斷「今天」，避免伺服器時區不同造成算錯重置時間
  const now = new Date();
  const twMs = now.getTime() + 8 * 60 * 60 * 1000;
  return new Date(twMs).toISOString().slice(0, 10);
}

/**
 * 全部使用者共用同一個每日額度（沒有分使用者，內部帳密保護的是整個網站）。
 * 用 Supabase 的 increment_ai_usage_daily RPC 做原子性的「檢查額度＋累加」，
 * 這樣多個請求同時打進來也不會因為各自讀到舊次數而超用額度。
 * 沒設定 Supabase 環境變數時直接放行（本機開發用，不擋功能）。
 */
export async function tryConsumeDailyQuota(limit: number): Promise<{ allowed: boolean; usedToday: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { allowed: true, usedToday: 0 };

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .rpc("increment_ai_usage_daily", { p_date: todayInTaiwan(), p_limit: limit })
    .single();

  if (error || !data) {
    // 資料庫查詢失敗時放行，避免額度控管的問題擋住整個功能
    return { allowed: true, usedToday: 0 };
  }

  const row = data as { allowed: boolean; used_today: number };
  return { allowed: row.allowed, usedToday: row.used_today };
}
