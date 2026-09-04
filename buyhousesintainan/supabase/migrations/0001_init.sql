-- buyhousesintainan（劉育琪個人網站）初始 schema
-- 這個 Supabase 專案跟中控情報台完全分開，見計畫決策：對外公開網站 vs 內部工具要分開。
-- 原則：RLS 全部開啟；單一管理員（劉育琪本人），policy 用 auth.role() = 'authenticated' 判斷管理員動作，
-- 公開可讀的表另外用 status/is_visible 欄位區分「訪客看得到的」跟「只有登入後台看得到的」。

create extension if not exists "pgcrypto";

-- ── categories（部落格分類）──────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;
create policy "categories_select" on categories
  for select using (is_visible = true or auth.role() = 'authenticated');
create policy "categories_admin_insert" on categories
  for insert with check (auth.role() = 'authenticated');
create policy "categories_admin_update" on categories
  for update using (auth.role() = 'authenticated');
create policy "categories_admin_delete" on categories
  for delete using (auth.role() = 'authenticated');

-- ── articles（部落格文章）────────────────────────────────
create table articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table articles enable row level security;
create policy "articles_select" on articles
  for select using (status = 'published' or auth.role() = 'authenticated');
create policy "articles_admin_insert" on articles
  for insert with check (auth.role() = 'authenticated');
create policy "articles_admin_update" on articles
  for update using (auth.role() = 'authenticated');
create policy "articles_admin_delete" on articles
  for delete using (auth.role() = 'authenticated');

-- ── contact_messages（文章下方留言表單 → 寄到劉育琪信箱）──
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles (id) on delete set null,
  name text not null,
  contact_info text not null, -- email 或電話，訪客自己填
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
-- 任何訪客都可以送出表單（insert），但只有登入後台才能讀取內容，保護留言者隱私。
create policy "contact_messages_insert" on contact_messages
  for insert with check (true);
create policy "contact_messages_select" on contact_messages
  for select using (auth.role() = 'authenticated');
create policy "contact_messages_update" on contact_messages
  for update using (auth.role() = 'authenticated');

-- ── listings（熱銷物件）──────────────────────────────────
create table listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  district text,
  address text,
  price_wan numeric,
  layout text,
  area_ping numeric,
  photos jsonb not null default '[]'::jsonb,
  description text,
  status text not null default '上架' check (status in ('上架', '下架', '預約中', '已成交')),
  is_featured boolean not null default false,
  -- 委託到期日：過期即視為應下架。直接把去年的廣告檢舉風波經驗做成產品功能，
  -- 而不是每次都要手動記得去刪，見計畫「本期主打物件」討論。
  expiry_date date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table listings enable row level security;
create policy "listings_select" on listings
  for select using (
    (status = '上架' and (expiry_date is null or expiry_date >= current_date))
    or auth.role() = 'authenticated'
  );
create policy "listings_admin_insert" on listings
  for insert with check (auth.role() = 'authenticated');
create policy "listings_admin_update" on listings
  for update using (auth.role() = 'authenticated');
create policy "listings_admin_delete" on listings
  for delete using (auth.role() = 'authenticated');

-- ── listing_activity_log（物件上下架/編輯紀錄，供之後查證）──
create table listing_activity_log (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings (id) on delete cascade,
  action text not null, -- '建立' / '上架' / '下架' / '編輯' / '批次上架' / '批次下架'
  detail jsonb,
  actor uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table listing_activity_log enable row level security;
create policy "listing_activity_log_all" on listing_activity_log
  for all using (auth.role() = 'authenticated');

-- ── land_development_projects（台南市公辦土地開發總表）──
create table land_development_projects (
  id uuid primary key default gen_random_uuid(),
  mechanism text not null check (mechanism in ('市地重劃', '區段徵收')),
  era_group text not null, -- 對應前台分區標題，例如「原台南市」「已完成區段徵收」
  era_mark text,           -- 例如「合併前」「已完成」
  era_period text,         -- 例如「民國 58 年起 · 17 案」
  name text not null,
  nickname text,
  district text,
  period_text text,
  area_hectares text,
  status text not null check (status in ('done', 'wip', 'planning')),
  range_description text,
  note text,
  source_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table land_development_projects enable row level security;
-- 純參考資料，公開可讀；只有後台能編輯。
create policy "land_development_projects_select" on land_development_projects
  for select using (is_visible = true or auth.role() = 'authenticated');
create policy "land_development_projects_admin_insert" on land_development_projects
  for insert with check (auth.role() = 'authenticated');
create policy "land_development_projects_admin_update" on land_development_projects
  for update using (auth.role() = 'authenticated');
create policy "land_development_projects_admin_delete" on land_development_projects
  for delete using (auth.role() = 'authenticated');

-- ── site_settings（FB Pixel ID／GA4 ID／聯絡信箱等，後台可調整）──
create table site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;
-- pixel/GA4 ID 本來就會出現在前台頁面原始碼裡，不是敏感資料，公開可讀；只有後台能改。
create policy "site_settings_select" on site_settings
  for select using (true);
create policy "site_settings_admin_insert" on site_settings
  for insert with check (auth.role() = 'authenticated');
create policy "site_settings_admin_update" on site_settings
  for update using (auth.role() = 'authenticated');

-- 預設分類（跟計畫討論定案的 5 個一致，slug 之後不要改，文章會用 slug 關聯）
insert into categories (slug, name, description, sort_order) values
  ('market-watch', '房市觀察', '限貸令、新青安、政策解讀、市場趨勢分析', 1),
  ('tax-and-loan', '稅務貸款', '房地合一稅、重購退稅、自住事實認定、貸款細節', 2),
  ('deal-stories', '成交故事', '真實案件與委託故事，展現專業與職業道德', 3),
  ('daily-life', '房仲日常', '生活觀察、個人日常，讓讀者認識劉育琪這個人', 4),
  ('content-journey', '自媒體創作全紀錄', '拍片、上課、AI 工具心得——未來代言/短影音內容的自然延伸位置', 5);

insert into site_settings (key, value) values
  ('contact_email_to', 'bocheok@gmail.com'),
  ('fb_pixel_id', null),
  ('ga4_measurement_id', null);
