const MODULES = [
  {
    href: "/admin/valuations",
    title: "估價系統",
    desc: "謄本自動抓欄位、比較資料、浮水印報告",
    ready: false,
  },
  {
    href: "/admin/posts-queue",
    title: "發文助手",
    desc: "貼文排版優化（盤古之白＋行距修復）",
    ready: true,
  },
  {
    href: "/admin/blog",
    title: "Blog",
    desc: "文章編輯、SEO/GEO 自動注入",
    ready: false,
  },
  {
    href: "/admin/appointments",
    title: "預約",
    desc: "客戶預約清單、溫度分級",
    ready: false,
  },
  {
    href: "/admin/traffic",
    title: "流量儀表板",
    desc: "網站流量＋FB/IG/Threads 快照",
    ready: false,
  },
];

export default function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold">總覽</h1>
      <p className="mt-1 text-sm text-text/70">中控情報臺目前上線的模組</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <div
            key={m.href}
            className="rounded-card border border-border bg-background p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{m.title}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  m.ready
                    ? "bg-pale-sage text-primary"
                    : "bg-surface text-text/50"
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
