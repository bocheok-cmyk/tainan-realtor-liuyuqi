import { getListings } from "@/lib/listings";
import { setListingStatus, toggleFeatured } from "./actions";

export default async function AdminListingsPage() {
  const listings = await getListings();

  return (
    <div>
      <h1 className="text-2xl font-bold">物件</h1>
      <p className="mt-1 text-sm text-text/70">
        上架／下架即時反映到前台「熱銷物件」頁面。委託到期日一到，前台會自動視為下架，不用手動記得刪。
      </p>

      {listings.length === 0 ? (
        <div className="mt-8 rounded-card border border-border p-8 text-center text-text/50">
          還沒有物件資料，等你提供真實案件資訊之後可以在這裡建立。
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-text/50">
              <tr>
                <th className="px-4 py-3">物件</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">本期主打</th>
                <th className="px-4 py-3">委託到期</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{listing.title}</td>
                  <td className="px-4 py-3">{listing.status}</td>
                  <td className="px-4 py-3">
                    <form
                      action={async () => {
                        "use server";
                        await toggleFeatured(listing.id, !listing.isFeatured);
                      }}
                    >
                      <button className="text-xs font-medium text-primary hover:underline">
                        {listing.isFeatured ? "取消主打" : "設為主打"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-text/60">{listing.expiryDate ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await setListingStatus(listing.id, listing.status === "上架" ? "下架" : "上架");
                      }}
                    >
                      <button className="text-xs font-medium text-primary hover:underline">
                        {listing.status === "上架" ? "下架" : "上架"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
