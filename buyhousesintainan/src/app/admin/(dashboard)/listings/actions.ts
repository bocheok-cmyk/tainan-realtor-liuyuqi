"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setListingStatus(id: string, status: "上架" | "下架" | "預約中" | "已成交") {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  await supabase.from("listings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  await supabase.from("listing_activity_log").insert({
    listing_id: id,
    action: status === "上架" ? "上架" : "下架",
    actor: auth.user?.id ?? null,
  });

  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  revalidatePath("/");
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  const supabase = await createClient();
  await supabase.from("listings").update({ is_featured: isFeatured }).eq("id", id);
  revalidatePath("/admin/listings");
  revalidatePath("/listings");
  revalidatePath("/");
}
