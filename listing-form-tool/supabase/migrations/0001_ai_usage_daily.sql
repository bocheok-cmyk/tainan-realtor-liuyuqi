-- 謄本/分區AI辨識的每日共用額度計數（原本是本機JSON檔，正式上線後需要跨伺服器實例共用才可靠，改用資料庫）。
-- 全站共用一個額度，不分使用者，用日期當主鍵，每天自然歸零。

create table ai_usage_daily (
  usage_date date primary key,
  count integer not null default 0
);

-- 原子性的「檢查額度＋累加」，避免同時間多個請求各自讀到舊次數、一起通過檢查造成額度被超用。
-- security definer：呼叫端用的是anon（沒有直接寫表權限），這個函式要用建立者權限執行才寫得進ai_usage_daily。
-- 搭配固定search_path，避免security definer常見的搜尋路徑劫持風險。
create or replace function increment_ai_usage_daily(p_date date, p_limit integer)
returns table(allowed boolean, used_today integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into ai_usage_daily (usage_date, count) values (p_date, 0)
  on conflict (usage_date) do nothing;

  select count into current_count from ai_usage_daily where usage_date = p_date for update;

  if current_count >= p_limit then
    return query select false, current_count;
  else
    update ai_usage_daily set count = count + 1 where usage_date = p_date;
    return query select true, current_count + 1;
  end if;
end;
$$;

-- 這支API本身沒有使用者登入狀態（用內部帳密保護的是整個網站，不是逐一使用者），
-- 用anon key呼叫這個RPC即可，不需要service role key。
grant execute on function increment_ai_usage_daily(date, integer) to anon, authenticated;
