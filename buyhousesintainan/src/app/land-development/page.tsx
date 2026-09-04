import { getLandDevelopmentData } from "@/lib/land-development";
import { LandDevelopmentExplorer } from "./LandDevelopmentExplorer";
import styles from "./land-development.module.css";

export const metadata = { title: "台南市公辦土地開發總表" };

export default async function LandDevelopmentPage() {
  const { market, zone } = await getLandDevelopmentData();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>臺南市地政局公開資料整理 · 114年10月版</div>
          <h1 className={styles.h1}>台南市公辦土地開發總表</h1>
          <p className={styles.lede}>
            整理自臺南市政府地政局官方統計表與政府資料開放平臺，涵蓋台南市兩種主要的公辦土地開發手段：
            <b>市地重劃</b>（地主保留所有權，重新整理地形＋捐地）與<b>區段徵收</b>（政府先徵收，再重新配地或標售）。
          </p>
          <p className={`${styles.lede} ${styles.ledeSmall}`}>
            目前不含自辦市地重劃案（另計約 130＋ 案，範圍更大、資料更零碎，暫未整理）。
          </p>
        </header>

        <LandDevelopmentExplorer market={market} zone={zone} />

        <footer className={styles.footer}>
          <div className={styles.caveat}>
            <b>市地重劃資料註記：</b>原台南市／原台南縣的 23 個歷史案（民國58-97年）僅有官方統計表數字，
            無法查到當年的四至文字，「南寧」「新東」兩案的行政區也未標明，暫列待查；
            合併後台南市 29 案已逐案對照地政局公告頁面，範圍文字取得程度不一，部分案子官方僅附地籍套繪圖、無逐字四至敘述，卡片上已標明。
          </div>
          <div className={styles.caveat}>
            <b>區段徵收資料註記：</b>範圍敘述取自地政局各案公告頁的四至文字，已逐案核對來源；
            南科特定區相關幾案（F、G／A-E,N,O／I／優先發展區）行政區橫跨新市、善化、安定三區，
            「優先發展區」為整體規劃母案，面積不應與其下各子案重複加總。正式引用前仍建議對照原始公告頁面。
          </div>
          <p>
            資料來源：
            <a href="https://land.tainan.gov.tw/News.aspx?n=29663&sms=24169" target="_blank" rel="noopener">
              臺南市政府地政局．市地重劃業務成果
            </a>
            　·
            <a href="https://land.tainan.gov.tw/cl.aspx?n=29676" target="_blank" rel="noopener">
              臺南市政府地政局．區段徵收專區
            </a>
            　·
            <a href="https://data.gov.tw/dataset/53421" target="_blank" rel="noopener">
              政府資料開放平臺
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
