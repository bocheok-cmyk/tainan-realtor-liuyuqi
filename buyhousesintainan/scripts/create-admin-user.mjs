// 建立網站後台的登入帳號。只需要跑一次，等你有真的 Supabase 專案之後執行：
//
//   $env:SUPABASE_SERVICE_ROLE_KEY = "你的 service_role key（Supabase 專案 Settings > API Keys）"
//   $env:ADMIN_USERNAME = "你想要的帳號"
//   $env:ADMIN_PASSWORD = "你的密碼"
//   node scripts/create-admin-user.mjs
//
// 帳密只從環境變數讀，不會寫進任何檔案，也不會被 commit。
// service_role key 權限很大，只在這支腳本用一次就好，不要放進 .env.local 長期保留
// （那個檔案給的是給一般執行用的 publishable/anon key）。

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

for (const [name, value] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  ADMIN_USERNAME: username,
  ADMIN_PASSWORD: password,
})) {
  if (!value) {
    console.error(`缺少環境變數 ${name}，請先設定再執行。`);
    process.exit(1);
  }
}

const email = `${username.trim().toLowerCase()}@buyhousesintainan.local`;
const supabase = createClient(url, serviceRoleKey);

const { error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("建立帳號失敗：", error.message);
  process.exit(1);
}

console.log(`後台管理員帳號建立完成，帳號：${username}`);
