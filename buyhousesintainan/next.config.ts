import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev server 預設會擋跨網域讀取 HMR/靜態資源，本機用 127.0.0.1 開發時要放行，
  // 不然頁面 HTML 讀得到但 JS 進不來，畫面會卡在「載入中」出不來。
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
