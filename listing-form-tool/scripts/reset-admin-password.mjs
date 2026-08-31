// 重設某個內部登入帳號的密碼。需要時執行：
//
//   $env:NEXT_PUBLIC_SUPABASE_URL = "你的 Supabase 專案 URL"
//   $env:SUPABASE_SERVICE_ROLE_KEY = "你的 service_role key（在 Supabase Settings > API）"
//   $env:ADMIN_USERNAME = "要改密碼的帳號"
//   $env:ADMIN_PASSWORD = "新密碼"
//   node scripts/reset-admin-password.mjs
//
// 帳密只從環境變數讀，不會寫進任何檔案，也不會被 commit。
// service_role key 用完就不要留在 .env.local 裡。

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

const email = `${username.trim().toLowerCase()}@listingformtool.local`;
const supabase = createClient(url, serviceRoleKey);

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error("查詢帳號失敗：", listError.message);
  process.exit(1);
}

const user = list.users.find((u) => u.email === email);
if (!user) {
  console.error(`找不到帳號：${username}`);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
if (error) {
  console.error("更新密碼失敗：", error.message);
  process.exit(1);
}

console.log(`密碼更新完成，帳號：${username}`);
