import Link from "next/link";
import { AGENT } from "@/lib/brand";

const NAV_ITEMS = [
  { href: "/", label: "首頁" },
  { href: "/about", label: "關於我" },
  { href: "/blog", label: "部落格" },
  { href: "/listings", label: "熱銷物件" },
  { href: "/land-development", label: "都市計畫總表" },
  { href: "/contact", label: "聯絡我" },
];

export function SiteNav() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-lg font-bold text-text">
          {AGENT.name}
          <span className="ml-2 text-sm font-normal text-text/60">{AGENT.title}</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-button px-3 py-2 text-sm text-text/80 transition-colors hover:bg-surface hover:text-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
