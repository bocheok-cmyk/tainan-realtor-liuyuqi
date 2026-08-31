import type { Metadata } from "next";
import { Noto_Serif_TC, Noto_Sans_TC, Inter } from "next/font/google";

const notoSerifTC = Noto_Serif_TC({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-heading" });
const notoSansTC = Noto_Sans_TC({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-numeric" });

export const metadata: Metadata = {
  title: "謄本填表工具",
  description: "上傳謄本、換算坪數、自動填寫售屋資料表",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${notoSerifTC.variable} ${notoSansTC.variable} ${inter.variable}`}>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "var(--font-body), 'Noto Sans TC', sans-serif",
          color: "#3E463D",
          background: "#F7F4EF",
        }}
      >
        {children}
      </body>
    </html>
  );
}
