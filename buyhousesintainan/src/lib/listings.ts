import { createClient } from "@/lib/supabase/server";

export interface Listing {
  id: string;
  title: string;
  district: string | null;
  address: string | null;
  priceWan: number | null;
  layout: string | null;
  areaPing: number | null;
  photos: string[];
  description: string | null;
  status: "上架" | "下架" | "預約中" | "已成交";
  isFeatured: boolean;
  expiryDate: string | null;
}

// Supabase 還沒接上之前，前台沒有真實物件資料可以顯示——刻意回傳空陣列，
// 讓頁面走 Empty State，而不是放假的物件資訊誤導訪客。
export async function getListings(opts?: { featuredOnly?: boolean }): Promise<Listing[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("listings")
      .select("id, title, district, address, price_wan, layout, area_ping, photos, description, status, is_featured, expiry_date")
      .order("created_at", { ascending: false });

    if (opts?.featuredOnly) query = query.eq("is_featured", true);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      district: row.district,
      address: row.address,
      priceWan: row.price_wan,
      layout: row.layout,
      areaPing: row.area_ping,
      photos: Array.isArray(row.photos) ? row.photos : [],
      description: row.description,
      status: row.status,
      isFeatured: row.is_featured,
      expiryDate: row.expiry_date,
    }));
  } catch {
    return [];
  }
}
