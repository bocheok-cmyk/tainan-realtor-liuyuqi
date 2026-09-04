import Link from "next/link";

export default function AdminLandDevelopmentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">都市計畫總表</h1>
      <p className="mt-1 text-sm text-text/70">
        目前這份資料是靜態管理（<code>src/data/land-development.ts</code>），還沒有後台編輯介面。
        資料表 <code>land_development_projects</code> 已經建好、前台已經接了 Supabase，之後要加編輯功能
        直接在這張表上做 CRUD 就可以，不用改資料結構。
      </p>
      <Link href="/land-development" target="_blank" className="mt-4 inline-block text-sm text-primary hover:underline">
        查看前台頁面 →
      </Link>
    </div>
  );
}
