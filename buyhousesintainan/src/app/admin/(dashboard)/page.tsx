const MODULES = [
  { href: "/admin/articles", title: "文章", desc: "發文、編輯、切換發布／草稿", ready: true },
  { href: "/admin/listings", title: "物件", desc: "上架／下架、本期主打、批次操作", ready: true },
  { href: "/admin/land-development", title: "都市計畫總表", desc: "編輯公辦土地開發資料", ready: false },
  { href: "/admin/traffic", title: "流量／SEO", desc: "GA4＋Search Console 串接", ready: false },
  { href: "/admin/settings", title: "設定", desc: "FB Pixel、GA4、聯絡信箱", ready: true },
];

export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold">總覽</h1>
      <p className="mt-1 text-sm text-text/70">網站後台目前的模組</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <div key={m.href} className="rounded-card border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{m.title}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  m.ready ? "bg-pale-sage text-primary" : "bg-surface text-text/50"
                }`}
              >
                {m.ready ? "已上線" : "建置中"}
              </span>
            </div>
            <p className="mt-2 text-sm text-text/70">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
