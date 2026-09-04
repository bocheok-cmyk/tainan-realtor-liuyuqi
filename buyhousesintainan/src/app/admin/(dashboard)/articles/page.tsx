import { getArticles } from "@/lib/content";
import { toggleArticleStatus } from "./actions";

export default async function AdminArticlesPage() {
  const articles = await getArticles({ includeDrafts: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章</h1>
      </div>
      <p className="mt-1 text-sm text-text/70">
        目前列表包含從舊臉書貼文改寫的示範草稿——這些文章需要你確認過內容才能發布，不會自動上線。
      </p>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text/50">
            <tr>
              <th className="px-4 py-3">標題</th>
              <th className="px-4 py-3">分類</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{article.title}</td>
                <td className="px-4 py-3 text-text/60">{article.categoryName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      article.status === "published" ? "bg-pale-sage text-primary" : "bg-surface text-text/50"
                    }`}
                  >
                    {article.status === "published" ? "已發布" : "草稿"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await toggleArticleStatus(
                        article.id,
                        article.status === "published" ? "draft" : "published",
                      );
                    }}
                  >
                    <button className="text-xs font-medium text-primary hover:underline">
                      {article.status === "published" ? "改回草稿" : "發布"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
