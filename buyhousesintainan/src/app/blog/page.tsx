import Link from "next/link";
import { getCategories, getArticles } from "@/lib/content";

export const metadata = { title: "部落格" };

export default async function BlogIndexPage() {
  const [categories, articles] = await Promise.all([getCategories(), getArticles()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold text-text">部落格</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/blog/category/${cat.slug}`}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-text/70 transition-colors hover:border-primary hover:text-primary"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="rounded-card border border-border p-6 transition-colors hover:bg-surface"
          >
            <p className="text-xs font-semibold text-primary">{article.categoryName}</p>
            <p className="mt-2 font-heading text-lg font-bold text-text">{article.title}</p>
            {article.excerpt && <p className="mt-2 line-clamp-3 text-sm text-text/60">{article.excerpt}</p>}
          </Link>
        ))}
        {articles.length === 0 && (
          <p className="text-text/50">目前還沒有發布的文章。</p>
        )}
      </div>
    </div>
  );
}
