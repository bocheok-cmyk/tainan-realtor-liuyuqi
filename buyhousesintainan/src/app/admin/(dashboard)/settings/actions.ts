"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();

  const entries: [string, string][] = [
    ["contact_email_to", String(formData.get("contactEmailTo") ?? "")],
    ["fb_pixel_id", String(formData.get("fbPixelId") ?? "")],
    ["ga4_measurement_id", String(formData.get("ga4MeasurementId") ?? "")],
  ];

  for (const [key, value] of entries) {
    await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
