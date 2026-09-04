import { getListings } from "@/lib/listings";

export const metadata = { title: "熱銷物件" };

export default async function ListingsPage() {
  const listings = await getListings();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold text-text">熱銷物件</h1>
      <p className="mt-2 text-text/60">目前正在銷售的物件，資料會隨時更新。</p>

      {listings.length === 0 ? (
        <div className="mt-12 rounded-card border border-border p-12 text-center text-text/50">
          <p>目前後台還沒有上架的物件資料。</p>
          <p className="mt-1 text-sm">物件建立後，這裡會自動顯示上架中的案件。</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-card border border-border p-6">
              {listing.isFeatured && (
                <p className="mb-2 inline-block rounded-full bg-pale-terracotta px-3 py-1 text-xs font-semibold text-accent">
                  本期主打
                </p>
              )}
              <p className="font-heading text-lg font-bold text-text">{listing.title}</p>
              <p className="mt-1 text-sm text-text/60">
                {listing.district}
                {listing.layout ? `．${listing.layout}` : ""}
                {listing.areaPing ? `．${listing.areaPing} 坪` : ""}
              </p>
              {listing.priceWan && (
                <p className="mt-3 font-numeric text-xl font-bold text-accent">
                  {listing.priceWan.toLocaleString()} 萬
                </p>
              )}
              {listing.description && <p className="mt-3 text-sm text-text/70">{listing.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
