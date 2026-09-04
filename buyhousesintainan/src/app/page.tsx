import Image from "next/image";
import Link from "next/link";
import { AGENT } from "@/lib/brand";
import { getCategories, getArticles } from "@/lib/content";
import { getListings } from "@/lib/listings";

export default async function HomePage() {
  const [categories, articles, featuredListings] = await Promise.all([
    getCategories(),
    getArticles(),
    getListings({ featuredOnly: true }),
  ]);

  const latestArticles = articles.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Hero */}
      <section className="flex flex-col-reverse items-center gap-10 border-b border-border py-20 md:flex-row md:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold tracking-wide text-primary">{AGENT.title}</p>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl font-bold leading-tight text-text md:text-5xl">
            {AGENT.slogan}
          </h1>
          {/* slogan 還在挑選中，這行副標同理是暫定文字，定案前不要當成正式文案使用 */}
          <p className="mt-4 max-w-xl text-text/70">
            {AGENT.name}，{AGENT.company}，在地深耕多年，懂房子也懂稅務，陪你談成交，也陪你把稅算清楚。
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/contact"
              className="flex h-11 items-center rounded-button bg-primary px-6 text-sm font-semibold text-white transition-colors hover:brightness-95"
            >
              加 LINE 聊聊
            </Link>
            <Link
              href="/blog"
              className="flex h-11 items-center rounded-button border border-border px-6 text-sm font-semibold text-primary transition-colors hover:bg-surface"
            >
              看部落格文章
            </Link>
          </div>
        </div>
        <div className="w-56 flex-none md:w-72">
          {/* 去背透明照片，不加卡片邊框/圓角裁切——那會在透明區邊緣露出裁切痕跡 */}
          <Image
            src="/images/liu-yuqi-headshot-v2.png"
            alt={AGENT.name}
            width={480}
            height={640}
            priority
            className="w-full object-contain"
          />
        </div>
      </section>

      {/* Featured listings */}
      {featuredListings.length > 0 && (
        <section className="border-b border-border py-16">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-heading text-2xl font-bold text-text">本期主打物件</h2>
            <Link href="/listings" className="text-sm text-primary hover:underline">
              看全部物件 →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredListings.slice(0, 3).map((listing) => (
              <div key={listing.id} className="rounded-card border border-border p-6">
                <p className="font-heading text-lg font-bold text-text">{listing.title}</p>
                <p className="mt-1 text-sm text-text/60">{listing.district}</p>
                {listing.priceWan && (
                  <p className="mt-3 font-numeric text-xl font-bold text-accent">
                    {listing.priceWan.toLocaleString()} 萬
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category highlights */}
      <section className="border-b border-border py-16">
        <h2 className="mb-8 font-heading text-2xl font-bold text-text">分類</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog/category/${cat.slug}`}
              className="rounded-card border border-border p-6 transition-colors hover:bg-surface"
            >
              <p className="font-heading font-bold text-text">{cat.name}</p>
              {cat.description && <p className="mt-2 text-sm text-text/60">{cat.description}</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest articles */}
      <section className="py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-heading text-2xl font-bold text-text">最新文章</h2>
          <Link href="/blog" className="text-sm text-primary hover:underline">
            看全部文章 →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {latestArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="rounded-card border border-border p-6 transition-colors hover:bg-surface"
            >
              <p className="text-xs font-semibold text-primary">{article.categoryName}</p>
              <p className="mt-2 font-heading font-bold text-text">{article.title}</p>
              {article.excerpt && <p className="mt-2 line-clamp-3 text-sm text-text/60">{article.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
