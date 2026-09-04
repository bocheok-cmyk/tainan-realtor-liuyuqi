import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getArticles } from "@/lib/content";

export default async function CategoryPage({ params }: PageProps<"/blog/category/[slug]">) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const articles = await getArticles({ categorySlug: slug });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/blog" className="text-sm text-primary hover:underline">
        ← 回部落格
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold text-text">{category.name}</h1>
      {category.description && <p className="mt-2 text-text/60">{category.description}</p>}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="rounded-card border border-border p-6 transition-colors hover:bg-surface"
          >
            <p className="mt-2 font-heading text-lg font-bold text-text">{article.title}</p>
            {article.excerpt && <p className="mt-2 line-clamp-3 text-sm text-text/60">{article.excerpt}</p>}
          </Link>
        ))}
        {articles.length === 0 && <p className="text-text/50">這個分類還沒有文章。</p>}
      </div>
    </div>
  );
}
