// 一次性腳本：把 src/data/land-development.ts 的資料轉成 SQL seed migration。
// 之後如果改了 land-development.ts，重跑這個腳本就能重新產生 0002_seed_land_development.sql。
import { MARKET_READJUSTMENT_ERAS, ZONE_EXPROPRIATION_GROUPS } from "../src/data/land-development.ts";

function esc(v) {
  if (v === undefined || v === null) return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function numOrNull(v) {
  if (v === undefined || v === null || v === "—" || v === "TBD") return "null";
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : "null";
}

let sql = `-- 台南市公辦土地開發總表 — 從 src/data/land-development.ts 產生，勿手動編輯此檔案內容。
-- 重新產生：node scripts/gen-land-development-seed.mjs > supabase/migrations/0002_seed_land_development.sql

insert into land_development_projects
  (mechanism, era_group, era_mark, era_period, name, nickname, district, period_text, area_hectares, status, range_description, note, source_url, sort_order)
values
`;

let sortOrder = 0;
const rows = [];

function pushEra(era) {
  for (const z of era.zones) {
    rows.push(
      `  (${esc(era.mechanism)}, ${esc(era.title)}, ${esc(era.mark)}, ${esc(era.period)}, ${esc(z.name)}, ${esc(z.nickname)}, ${esc(z.district)}, ${esc(z.period)}, ${numOrNull(z.areaHectares)}, ${esc(z.status)}, ${esc(z.range)}, ${esc(z.note)}, ${esc(z.sourceUrl)}, ${sortOrder++})`,
    );
  }
}

for (const era of MARKET_READJUSTMENT_ERAS) pushEra(era);
for (const era of ZONE_EXPROPRIATION_GROUPS) pushEra(era);

sql += rows.join(",\n") + ";\n";

console.log(sql);
