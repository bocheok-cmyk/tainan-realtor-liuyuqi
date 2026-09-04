"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleArticleStatus(id: string, nextStatus: "draft" | "published") {
  const supabase = await createClient();
  await supabase
    .from("articles")
    .update({
      status: nextStatus,
      published_at: nextStatus === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
}
