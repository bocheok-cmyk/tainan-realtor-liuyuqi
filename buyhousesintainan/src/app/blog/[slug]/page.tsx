import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/content";
import { ContactForm } from "@/components/ContactForm";

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href={`/blog/category/${article.categorySlug}`} className="text-sm text-primary hover:underline">
        {article.categoryName}
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold leading-snug text-text">{article.title}</h1>

      <div className="prose prose-neutral mt-8 whitespace-pre-line leading-relaxed text-text/90">
        {article.content}
      </div>

      <div className="mt-16">
        <ContactForm articleId={article.id} />
      </div>
    </div>
  );
}
