// Supabase Auth 本身沒有「帳號」的概念，只有 email/password。
// 這裡用一個固定、不對外公開的假網域把「帳號」轉成 email，
// 使用者永遠只會看到/輸入帳號，不會看到這個轉換。
const INTERNAL_EMAIL_DOMAIN = "buyhousesintainan.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;
}
