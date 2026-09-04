import { getSiteSettings } from "@/lib/site-settings";
import { saveSettings } from "./actions";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold">設定</h1>
      <p className="mt-1 text-sm text-text/70">
        這裡改的值即時生效，不用重新部署網站。Facebook Pixel／GA4 ID 留空就不會在前台注入追蹤碼。
      </p>

      <form action={saveSettings} className="mt-8 max-w-md space-y-5">
        <label className="block text-sm">
          留言表單收件信箱
          <input
            name="contactEmailTo"
            defaultValue={settings.contactEmailTo}
            className="mt-1 h-11 w-full rounded-input border border-border px-3 outline-none focus:border-primary"
          />
        </label>

        <label className="block text-sm">
          Facebook Pixel ID
          <input
            name="fbPixelId"
            defaultValue={settings.fbPixelId ?? ""}
            placeholder="例如 1234567890123456"
            className="mt-1 h-11 w-full rounded-input border border-border px-3 outline-none focus:border-primary"
          />
        </label>

        <label className="block text-sm">
          GA4 Measurement ID
          <input
            name="ga4MeasurementId"
            defaultValue={settings.ga4MeasurementId ?? ""}
            placeholder="例如 G-XXXXXXXXXX"
            className="mt-1 h-11 w-full rounded-input border border-border px-3 outline-none focus:border-primary"
          />
        </label>

        <button
          type="submit"
          className="h-11 rounded-button bg-primary px-6 text-sm font-semibold text-background hover:opacity-90"
        >
          儲存
        </button>
      </form>
    </div>
  );
}
