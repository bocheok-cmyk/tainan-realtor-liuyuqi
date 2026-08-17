-- 中控情報臺 初始 schema
-- 原則：RLS 全部開啟；policy 先用 auth.role() = 'authenticated'（小型信任團隊，非多租戶）；
-- 每張表都帶 created_by 方便未來加細粒度權限。
-- 沒有任何欄位存第三方帳密（FB/IG/比房網/公司後台）——這是硬性要求，見計畫「貫穿全專案的安全原則」。

create extension if not exists "pgcrypto";

-- ── agents ──────────────────────────────────────────────
create table agents (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

alter table agents enable row level security;
create policy "agents_select" on agents for select using (auth.role() = 'authenticated');
create policy "agents_self_update" on agents for update using (id = auth.uid());

-- ── properties ──────────────────────────────────────────
create table properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  region text,
  road_width_m numeric,
  road_width_source text check (road_width_source in ('user', 'nlsc_estimate')),
  building_type text check (building_type in ('透天厝', '大樓')),
  created_by uuid references agents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table properties enable row level security;
create policy "properties_all" on properties for all using (auth.role() = 'authenticated');

-- ── valuations ──────────────────────────────────────────
create table valuations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  building_age_years numeric,
  floor_total int,
  floor_unit int,
  building_use text,
  -- 透天厝：面寬/傳統式-新加坡式/車位數；大樓：車位。兩種形狀差異大，用 jsonb 不硬湊共用欄位。
  condition_fields jsonb not null default '{}'::jsonb,
  -- 系統試算參考區間（實價登錄換算），跟 final_price_manual 是完全分開的欄位，
  -- 系統絕不把這裡的值寫進 final_price_manual。
  reference_price_range jsonb,
  -- 最終售價，只能由使用者手動輸入，任何自動化流程都不可以寫入這個欄位。
  final_price_manual numeric,
  final_price_notes text,
  street_view_snapshot_url text,
  report_image_url text,
  created_by uuid references agents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table valuations enable row level security;
create policy "valuations_all" on valuations for all using (auth.role() = 'authenticated');

-- ── transcript_uploads ──────────────────────────────────
create table transcript_uploads (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references valuations (id) on delete cascade,
  doc_type text not null check (doc_type in ('土地謄本', '建物謄本')),
  storage_path text not null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'extracted', 'needs_review', 'confirmed', 'ocr_required')),
  raw_text_excerpt text,
  created_at timestamptz not null default now()
);

alter table transcript_uploads enable row level security;
create policy "transcript_uploads_all" on transcript_uploads for all using (auth.role() = 'authenticated');

-- ── transcript_extractions ──────────────────────────────
-- 一個欄位一列，is_confirmed 在資料庫層面強制「每個欄位都要人工核對過才算數」，
-- 不能只在 UI 層口頭承諾。
create table transcript_extractions (
  id uuid primary key default gen_random_uuid(),
  transcript_upload_id uuid not null references transcript_uploads (id) on delete cascade,
  field_name text not null,
  extracted_value text,
  confirmed_value text,
  is_confirmed boolean not null default false,
  flag_note text,
  -- 抵押設定加總時，每一筆組成明細（權利人＋金額＋登記次序）存這裡供稽核。
  source_entries jsonb,
  created_at timestamptz not null default now()
);

alter table transcript_extractions enable row level security;
create policy "transcript_extractions_all" on transcript_extractions for all using (auth.role() = 'authenticated');

-- ── comps ───────────────────────────────────────────────
create table comps (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references valuations (id) on delete cascade,
  source text not null check (
    source in ('591', '樂居', '比房網', '公司內部', '銀行估價_中國信託', '銀行估價_富邦', '銀行估價_安泰')
  ),
  tier text not null check (tier in ('core', 'pro')),
  raw_paste_text text,
  parsed_fields jsonb not null default '{}'::jsonb,
  created_by uuid references agents (id),
  created_at timestamptz not null default now()
);

alter table comps enable row level security;
create policy "comps_all" on comps for all using (auth.role() = 'authenticated');

-- ── comp_view_logs ──────────────────────────────────────
-- 沒有比房網的 fallback：自己每次查看時手動回填，長期追蹤上架天數/降價紀錄。
create table comp_view_logs (
  id uuid primary key default gen_random_uuid(),
  comp_id uuid not null references comps (id) on delete cascade,
  log_date date not null,
  views int,
  price_snapshot numeric,
  created_at timestamptz not null default now()
);

alter table comp_view_logs enable row level security;
create policy "comp_view_logs_all" on comp_view_logs for all using (auth.role() = 'authenticated');

-- ── blog_posts ──────────────────────────────────────────
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body_markdown text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text,
  meta_description text,
  structured_data jsonb,
  seo_faq jsonb,
  published_at timestamptz,
  created_by uuid references agents (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_posts enable row level security;
create policy "blog_posts_admin_all" on blog_posts for all using (auth.role() = 'authenticated');
create policy "blog_posts_public_read_published" on blog_posts for select
  using (status = 'published');

-- ── post_drafts ─────────────────────────────────────────
-- 她自己寫的初稿，是發文系統的共同來源：一篇初稿可以同時發到多個平台
-- （FB/IG/Threads/網站），潤飾只做一次，排版優化(pangu-spacing)套用在
-- 每個平台各自的 social_queue 列上（Threads 之後可能有自己的改寫規則）。
create table post_drafts (
  id uuid primary key default gen_random_uuid(),
  raw_draft text not null,
  polished_text text,
  polish_status text not null default 'none'
    check (polish_status in ('none', 'pending', 'done', 'failed')),
  created_by uuid references agents (id),
  created_at timestamptz not null default now()
);

alter table post_drafts enable row level security;
create policy "post_drafts_all" on post_drafts for all using (auth.role() = 'authenticated');

-- ── social_queue ────────────────────────────────────────
-- 刻意沒有任何「自動發布」相關欄位或狀態值。發布永遠是 Claude 操作已登入瀏覽器、
-- 使用者確認後才動手，這裡只負責記錄「準備好了」跟「已經人工貼出去了」。
-- 一篇初稿勾選多個平台 = 多列，不是一列塞多個平台，方便每個平台各自的
-- 確認/發布狀態獨立追蹤。
create table social_queue (
  id uuid primary key default gen_random_uuid(),
  post_draft_id uuid references post_drafts (id) on delete cascade,
  blog_post_id uuid references blog_posts (id) on delete set null,
  platform text not null check (platform in ('fb', 'ig', 'threads')),
  formatted_text text not null,
  char_count int not null,
  image_urls text[] not null default '{}',
  -- 只對 platform='ig' 有意義：貼文上傳後，順便同步轉發到限時動態
  -- （她的 IG 限時動態本身已連動 FB，這裡不需要另外處理 FB story）。
  also_post_to_story boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'ready', 'posted', 'skipped')),
  posted_at timestamptz,
  posted_note text,
  created_by uuid references agents (id),
  created_at timestamptz not null default now(),
  constraint social_queue_char_limit check (char_count <= 1900)
);

alter table social_queue enable row level security;
create policy "social_queue_all" on social_queue for all using (auth.role() = 'authenticated');

-- ── appointments ────────────────────────────────────────
-- 對應現有 realtor-ai-booking 範本的 Appointment type。
create table appointments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  meet_type text not null,
  intent text[] not null default '{}',
  urgency text,
  note text,
  slot_iso timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  ai_heat text check (ai_heat in ('high', 'mid', 'low')),
  ai_suggestion text,
  ai_summary text,
  ai_next_action text,
  ai_source text check (ai_source in ('rule', 'claude')),
  line_notify_sent boolean not null default false,
  confirmation_email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table appointments enable row level security;
create policy "appointments_admin_all" on appointments for all using (auth.role() = 'authenticated');
create policy "appointments_public_insert" on appointments for insert
  with check (true);

-- 防止同一時段被兩個客戶重複預約
create unique index appointments_slot_iso_active_idx
  on appointments (slot_iso)
  where status = 'confirmed';

-- ── platform_traffic_snapshots ──────────────────────────
create table platform_traffic_snapshots (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('fb', 'ig', 'threads', 'website')),
  metric_date date not null,
  metrics jsonb not null default '{}'::jsonb,
  captured_via text not null check (captured_via in ('live_browser', 'auto')),
  created_at timestamptz not null default now()
);

alter table platform_traffic_snapshots enable row level security;
create policy "platform_traffic_snapshots_all" on platform_traffic_snapshots for all
  using (auth.role() = 'authenticated');

-- ── Storage buckets ─────────────────────────────────────
-- transcripts、reports 都是私有 bucket，用 signed URL 存取，不公開。
insert into storage.buckets (id, name, public)
values ('transcripts', 'transcripts', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- 發文用的圖片，上傳後要在 FB/IG 貼文時參考，同樣不公開，讀取一律走 signed URL。
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', false)
on conflict (id) do nothing;

create policy "transcripts_authenticated_all" on storage.objects for all
  using (bucket_id = 'transcripts' and auth.role() = 'authenticated');

create policy "post_images_authenticated_all" on storage.objects for all
  using (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "reports_authenticated_all" on storage.objects for all
  using (bucket_id = 'reports' and auth.role() = 'authenticated');
