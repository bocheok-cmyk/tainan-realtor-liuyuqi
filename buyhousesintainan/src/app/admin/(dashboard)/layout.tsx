import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AGENT } from "@/lib/brand";

const NAV_ITEMS = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/articles", label: "文章" },
  { href: "/admin/listings", label: "物件" },
  { href: "/admin/land-development", label: "都市計畫總表" },
  { href: "/admin/traffic", label: "流量／SEO" },
  { href: "/admin/settings", label: "設定" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 開發預覽用，之後接上真的 Supabase 帳號登入就要移除，不能留在 commit 裡。
  if (process.env.SKIP_AUTH_FOR_PREVIEW !== "1") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/admin/login");
    }
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="flex w-56 flex-none flex-col border-r border-border bg-background px-4 py-6">
        <div className="px-2">
          <p className="text-xs tracking-wide text-primary">網站後台</p>
          <p className="mt-1 text-sm font-medium">{AGENT.name}</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-button px-3 py-2 text-sm transition-colors hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/logout" method="post" className="mt-auto px-2">
          <button className="text-xs text-text/60 hover:text-text">登出</button>
        </form>
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
