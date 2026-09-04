export default function AdminTrafficPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">流量／SEO 關鍵字</h1>
      <p className="mt-1 text-sm text-text/70">建置中——這裡之後會嵌入兩個資料來源：</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text/70">
        <li>
          <b className="text-text">Google Analytics 4</b>：網站流量、頁面熱門度、訪客來源
        </li>
        <li>
          <b className="text-text">Google Search Console</b>：訪客實際搜尋進站的關鍵字、排名
        </li>
      </ul>
      <p className="mt-4 text-sm text-text/70">
        這兩個都要等網站有正式網域、部署上線之後才能申請驗證，不是現在能先做的部分。GA4 的
        Measurement ID 可以先在「設定」頁填入，之後網站上線會自動開始收資料。
      </p>
    </div>
  );
}
