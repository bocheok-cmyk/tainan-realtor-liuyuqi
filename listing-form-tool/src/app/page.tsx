import ListingForm from "@/app/ListingForm";

// 目前只有她自己用，暫時拿掉登入門檻。/login 頁面跟 Supabase auth 設定都還留著沒刪，
// 之後真的要開放給別人用時，改回來走 LINE 登入（Supabase 沒有內建 LINE provider，
// 但支援 Custom OAuth/OIDC，LINE Login 本身是 OIDC，可以走這條路接）。
export default function Page() {
  return <ListingForm />;
}
