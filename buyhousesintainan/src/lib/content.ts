import { createClient } from "@/lib/supabase/server";
import { SEED_ARTICLES } from "@/data/seed-articles";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  categorySlug: string;
  categoryName: string;
  publishedAt: string | null;
  status: "draft" | "published";
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: "market-watch", slug: "market-watch", name: "房市觀察", description: "限貸令、新青安、政策解讀、市場趨勢分析" },
  { id: "tax-and-loan", slug: "tax-and-loan", name: "稅務貸款", description: "房地合一稅、重購退稅、自住事實認定、貸款細節" },
  { id: "deal-stories", slug: "deal-stories", name: "成交故事", description: "真實案件與委託故事，展現專業與職業道德" },
  { id: "daily-life", slug: "daily-life", name: "房仲日常", description: "生活觀察、個人日常，讓讀者認識劉育琪這個人" },
  { id: "content-journey", slug: "content-journey", name: "自媒體創作全紀錄", description: "拍片、上課、AI 工具心得" },
];

function fallbackArticles(): Article[] {
  const catBySlug = Object.fromEntries(FALLBACK_CATEGORIES.map((c) => [c.slug, c]));
  return SEED_ARTICLES.map((a) => ({
    id: a.slug,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    content: a.content,
    categorySlug: a.categorySlug,
    categoryName: catBySlug[a.categorySlug]?.name ?? a.categorySlug,
    publishedAt: null,
    status: a.status,
  }));
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name, description")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_CATEGORIES;
    return data;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

// includeDrafts: 只有後台管理頁面要傳 true。前台永遠只看 published。
export async function getArticles(opts?: { categorySlug?: string; includeDrafts?: boolean }): Promise<Article[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("articles")
      .select("id, slug, title, excerpt, content, status, published_at, categories(slug, name)")
      .order("published_at", { ascending: false });

    if (!opts?.includeDrafts) query = query.eq("status", "published");

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const fallback = fallbackArticles();
      return opts?.categorySlug ? fallback.filter((a) => a.categorySlug === opts.categorySlug) : fallback;
    }

    const mapped: Article[] = data.map((row) => {
      const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        content: row.content,
        categorySlug: cat?.slug ?? "",
        categoryName: cat?.name ?? "",
        publishedAt: row.published_at,
        status: row.status,
      };
    });

    return opts?.categorySlug ? mapped.filter((a) => a.categorySlug === opts.categorySlug) : mapped;
  } catch {
    const fallback = fallbackArticles();
    return opts?.categorySlug ? fallback.filter((a) => a.categorySlug === opts.categorySlug) : fallback;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = await getArticles({ includeDrafts: true });
  return all.find((a) => a.slug === slug) ?? null;
}
