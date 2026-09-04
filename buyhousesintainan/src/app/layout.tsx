import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC, Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getSiteSettings } from "@/lib/site-settings";
import { AGENT } from "@/lib/brand";

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${AGENT.title}｜${AGENT.name}`,
  description: AGENT.slogan,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="zh-Hant"
      className={`${notoSerifTC.variable} ${notoSansTC.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-text">
        <FacebookPixel pixelId={settings.fbPixelId} />
        <GoogleAnalytics measurementId={settings.ga4MeasurementId} />
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
