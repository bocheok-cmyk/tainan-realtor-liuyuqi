import { createClient } from "@/lib/supabase/server";

export interface SiteSettings {
  contactEmailTo: string;
  fbPixelId: string | null;
  ga4MeasurementId: string | null;
}

const FALLBACK: SiteSettings = {
  contactEmailTo: process.env.CONTACT_EMAIL_TO ?? "",
  fbPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || null,
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || null,
};

// Supabase 還沒接上（.env.local 是佔位值）的時候直接回傳環境變數版本，
// 不要讓整個網站因為資料庫連不上而打不開——跟中控情報台的 fallback 設計原則一致。
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error || !data) return FALLBACK;

    const map = Object.fromEntries(data.map((row) => [row.key, row.value]));
    return {
      contactEmailTo: map.contact_email_to || FALLBACK.contactEmailTo,
      fbPixelId: map.fb_pixel_id || FALLBACK.fbPixelId,
      ga4MeasurementId: map.ga4_measurement_id || FALLBACK.ga4MeasurementId,
    };
  } catch {
    return FALLBACK;
  }
}
