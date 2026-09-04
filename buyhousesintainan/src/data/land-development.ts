// 台南市公辦土地開發總表 — 資料整理自臺南市政府地政局官方統計表與政府資料開放平臺。
// 來源：https://land.tainan.gov.tw/News.aspx?n=29663&sms=24169（市地重劃）
//       https://land.tainan.gov.tw/cl.aspx?n=29676（區段徵收）
//       https://data.gov.tw/dataset/53421（政府資料開放平臺）
// 114年10月版。這是靜態備援資料——正式版本以 Supabase 的 land_development_projects
// 資料表為準，這裡的資料是「Supabase 還沒連上/查不到資料時」的 fallback，
// 也是 supabase/seed/land_development.sql 的產生來源，兩邊改動要同步。

export type LandDevelopmentStatus = "done" | "wip" | "planning";

export interface LandDevelopmentZone {
  name: string;
  nickname?: string;
  district: string;
  period: string;
  areaHectares?: string;
  status: LandDevelopmentStatus;
  range?: string;
  note?: string;
  sourceUrl?: string;
}

export interface LandDevelopmentEra {
  key: string;
  mechanism: "市地重劃" | "區段徵收";
  mark: string;
  title: string;
  period: string;
  cards: boolean;
  zones: LandDevelopmentZone[];
}

const SOURCE_URLS: Record<string, string> = {
  "永康區大橋區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811296",
  "永康區新設鹽行國中暨附近地區區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811305",
  "高速鐵路臺南車站特定區區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811295",
  "南台南站副都心第一期區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811300",
  "中國城暨運河星鑽地區區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811302",
  "安平水景公園區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811306",
  "德高區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811294",
  "和順寮農場區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811299",
  "新市新和社內區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811298",
  "台南科學工業園區特定區計畫（新市建設地區L、M地區）區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=7811297",
  "臺南市南科特定區開發區塊F、G區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32373&s=8729716",
  "永康砲校遷建暨創意設計園區開發區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32372&s=7811303",
  "臺南市南科特定區開發區塊A、B、C、D、E、N、O區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32372&s=8727813",
  "臺南市臺南科技產業專區區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32372&s=8770031",
  "「變更安定都市計畫（第五次通盤檢討）主要計畫（變11案農業區整體開發計畫）」區段徵收": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=8531437",
  "南台南站副都心第二期區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=8770341",
  "歸仁聯合行政中心區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=8649411",
  "臺南市南科特定區開發區塊I區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=8649410",
  "臺南市新市都市計畫（附帶條件農業區）區段徵收案": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=8649839",
  "南科特定區優先發展區區段徵收開發案": "https://land.tainan.gov.tw/News_Content.aspx?n=32422&s=7811304",
  "第十期永康六甲頂醫療專用區市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811395",
  "第十一期永康崑大路市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811390",
  "第十二期怡中市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811396",
  "第十三期喜樹灣裡市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811384",
  "第十四期永康二王市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811394",
  "第十五期善化區興華市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811391",
  "第十六期永康大同市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811389",
  "第十七期永康車站北側產業專用區市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811378",
  "第十八期東區機35市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=8591497",
  "第十九期下營公設解編市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=8612945",
  "新營第二市場市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=8112009",
  "第二十四期安南區朝皇市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7873246",
  "永康永大市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7865831",
  "永康區五王市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811383",
  "永康區竹園市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7811393",
  "官田二鎮市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7876134",
  "臺南市安平區漁光島北側市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7865840",
  "臺南市安平區漁光島南側市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=7865835",
  "臺南市南區灣裡產業專用區市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=8719789",
  "學甲區東陽市地重劃": "https://land.tainan.gov.tw/News_Content.aspx?n=29687&s=8682716",
};

function withSource(zones: LandDevelopmentZone[]): LandDevelopmentZone[] {
  return zones.map((z) => ({ ...z, sourceUrl: SOURCE_URLS[z.name] }));
}

export const MARKET_READJUSTMENT_ERAS: LandDevelopmentEra[] = [
  {
    key: "old-city",
    mechanism: "市地重劃",
    mark: "合併前",
    title: "原台南市",
    period: "民國 58 年起 · 17 案",
    cards: true,
    zones: withSource([
      { name: "安平", district: "安平區", period: "58.04~59.04", areaHectares: "17.1401", status: "done", range: "第一期重劃區，範圍為安平段387-2號以西、安平路以北一帶土地，配合安平特定區發展趨勢辦理。", note: "來自劉育琪蒐集的都市計畫書掃描件" },
      { name: "桶盤淺", district: "南區", period: "60.08~61.09", areaHectares: "35.0084", status: "done", range: "官方公告以地號方式標示範圍：桶盤淺段62-132號等十筆土地，原為美軍協防部隊防部官兵俱樂部、國民兵營、稅捐處宿舍等範圍，因法令限制影響發展，變更為住宅區。", note: "格式為段別+地號，非東西南北四至文字" },
      { name: "上鯤鯓", district: "安平區／南區", period: "62.03~63.04", areaHectares: "32.8573", status: "done", range: "官方文號「南市建都字第44381號」，計畫名稱「上鯤鯓段鹽埕段細部計畫案」，1972/09/12公告。掃描件字跡模糊，僅能確認地圖與文號，完整四至文字待補。", note: "跨兩區；四至文字尚未確認" },
      { name: "竹篙厝", district: "東區", period: "65.02~66.08", areaHectares: "304.1424", status: "done", range: "位於台南市東南角，西邊以大同路（縱貫公路）為界，東南方與台南縣仁德鄉緊鄰，市縣境界隨地形變化依行政界線為準，北邊包括公道四計畫道路，東北邊至富強路。計畫面積550.79公頃，涵蓋大智、仁和、竹篙、忠孝、大福、大德各里及龍山、大明里的一部份。" },
      { name: "台南新市區（五期重劃）", nickname: "俗稱「五期重劃區」", district: "安平區／南區", period: "71.05~73.05", areaHectares: "604.7830", status: "done", range: "位於台南市西南角，北起運河南岸與鹽水溪下游南岸，東以三等十六號道路邊緣及已發展區成曲折地帶為界，南止於二等四號道路（健康路延長線）中心以北及安平工業區、新興綜合住宅社區、鹽埕國民住宅以北，西止於遊艇碼頭區及漁港區之一部份。計畫面積626.43公頃。" },
      { name: "復興路", district: "東區", period: "71.05~72.02", areaHectares: "2.7615", status: "done", note: "範圍文字待補" },
      { name: "南寧", district: "TBD", period: "73.07~74.03", areaHectares: "2.0864", status: "done", note: "行政區與範圍文字都待補" },
      { name: "本淵寮", district: "安南區", period: "79.11~81.12", areaHectares: "51.3966", status: "done", note: "範圍文字待補" },
      { name: "虎尾寮", district: "東區", period: "82.02~85.02", areaHectares: "150.2934", status: "done", range: "計畫範圍含虎尾寮、後甲及竹篙厝地區，北邊以大同路、縱貫公路、鐵路為界，東南方與台南縣仁德鄉緊鄰，東北以公道四計畫道路為界，南與富強路、東門路相鄰，東自小東路以南，西邊以公道四計畫道路為界，並以台南縣仁德鄉太子村土庫西邊低地之鰍魚溝為界。合計總計畫面積1046.21公頃（含後甲、竹篙厝在內的擴大範圍）。" },
      { name: "安順一", district: "安南區", period: "82.11~84.02", areaHectares: "19.5571", status: "done", note: "範圍文字待補" },
      { name: "安順二", district: "安南區", period: "79.11~81.07", areaHectares: "26.4476", status: "done", note: "範圍文字待補" },
      { name: "土城", district: "安南區", period: "81.10~83.10", areaHectares: "12.0052", status: "done", note: "範圍文字待補" },
      { name: "鄭子寮", district: "北區", period: "82.05~86.03", areaHectares: "122.9401", status: "done", range: "官方文號「南市工都字第50762號」，1985/05/06公告，但只查到底下「商49商業區」子區塊的細部範圍：北起K-1-15M(北成路)、南至K-24-12M(北安路一段212巷)、東側道路K-26-8M(北安路一段176巷)、西至K-25-8M(北安路一段)。整個鄭子寮案的完整範圍待補。", note: "僅為子區塊範圍，非全案範圍" },
      { name: "水交社西南", district: "南區", period: "94.12~96.02", areaHectares: "10.9800", status: "done", range: "計畫範圍北達健康路，南至新都路，東臨南門路，西接西門路，東西寬約600公尺、南北長約900公尺，面積52.69公頃（含水交社西南、東北合併範圍）。範圍內主要有明德新村、實踐四村、志開新村等國軍老舊眷村，以及警察新村等老舊住宅社區。" },
      { name: "水交社東北", district: "南區", period: "95.06~97.01", areaHectares: "10.7759", status: "done", note: "範圍文字待補（與水交社西南同一計畫範圍內）" },
      { name: "小北夜市文小53", district: "北區", period: "95.12~96.05", areaHectares: "2.7600", status: "done", note: "範圍文字待補" },
      { name: "安平新都心（一）", district: "安平區", period: "95.08~97.11", areaHectares: "0.8410", status: "done", note: "範圍文字待補" },
    ]),
  },
  {
    key: "old-county",
    mechanism: "市地重劃",
    mark: "合併前",
    title: "原台南縣",
    period: "民國 64 年起",
    cards: false,
    zones: [
      { name: "永康（六甲頂）", district: "永康區", period: "64.6~67.12", areaHectares: "71.5963", status: "done" },
      { name: "學甲", district: "學甲區", period: "69.1~70.12", areaHectares: "27.3209", status: "done" },
      { name: "大灣", district: "永康區", period: "71.7~74.4", areaHectares: "105.3010", status: "done" },
      { name: "新營", district: "新營區", period: "76.4~78.5", areaHectares: "25.8799", status: "done" },
      { name: "新東", district: "TBD", period: "79.12~81.8", areaHectares: "38.4019", status: "done", note: "行政區推測新營區（有新東里）" },
      { name: "麻豆國中西側", district: "麻豆區", period: "96.8~100.2", areaHectares: "5.0525", status: "done" },
    ],
  },
  {
    key: "unified",
    mechanism: "市地重劃",
    mark: "合併後",
    title: "台南市",
    period: "民國 96 年起 · 29 案",
    cards: true,
    zones: withSource([
      { name: "九份子（第一期）", district: "安南區", period: "96.01~104.09", areaHectares: "101.76", status: "done", note: "抵費地標售 57 筆共 9.2 公頃，官方頁面未附四至文字" },
      { name: "平實營區（第二期）", district: "東區", period: "100.09~106.12", areaHectares: "42.4", status: "done", note: "官方頁面未附四至文字" },
      { name: "新營客運轉運中心（第三期）", district: "新營區", period: "—", areaHectares: "23.88", status: "wip", note: "107年完工，108年停售，官方頁面未附四至文字" },
      { name: "永康物流運轉區（第四期）", district: "永康區", period: "—", areaHectares: "14.59", status: "done", note: "113年2月財務結算，官方頁面未附四至文字" },
      { name: "佳里國小（第五期）", district: "佳里區", period: "—", areaHectares: "0.5664", status: "done", note: "官方頁面未附四至文字" },
      { name: "長勝營區（第六期）", district: "新營區", period: "—", areaHectares: "11.34", status: "done", note: "113年完成財務結算，官方頁面未附四至文字" },
      { name: "麻豆工業區（第七期）", district: "麻豆區", period: "—", areaHectares: "110.83", status: "wip", note: "各工區陸續竣工，官方頁面未附四至文字" },
      { name: "北安商業區（第八期）", district: "安南區", period: "—", areaHectares: "37.11", status: "done", note: "114年7月完成點交，官方頁面未附四至文字" },
      { name: "仁德（第九期）", district: "仁德區", period: "—", areaHectares: "1", status: "done", note: "114年7月內政部備查，官方頁面未附四至文字" },
      { name: "第十期永康六甲頂醫療專用區市地重劃", district: "永康區", period: "113-07-20", areaHectares: "4.093", status: "wip", range: "以跨區重劃方式辦理，涵蓋頂南段部分土地，分南北兩塊基地。北側基地東至中正南路52巷72弄、西至中正南路52巷68弄、南至中正南路52巷68弄、北至中正南路52巷；南側基地東至醫專（附）與住二（附）分區界、西至甲頂路151巷、南至柴頭港溪、北至甲頂路。" },
      { name: "第十一期永康崑大路市地重劃", district: "永康區", period: "111-03-22", areaHectares: "4.337", status: "wip", range: "位於永康區崑大路附近，範圍在國道一號東側、大灣路南側、永大路西側、崑大路北側，含永大路一段287巷及大灣路891巷道路用地。" },
      { name: "第十二期怡中市地重劃", district: "安南區", period: "114-10-02", areaHectares: "8.92", status: "wip", range: "分東、西兩塊基地。西側基地南以怡安路二段為界、東以怡安路二段456巷為界、西以計畫道路為界、北以本原街一段97巷為界；東側基地南以怡安路二段為界、東以北安路三段為界、西以計畫道路為界、北以計畫道路為界。" },
      { name: "第十三期喜樹灣裡市地重劃", district: "南區", period: "111-03-24", areaHectares: "29.59", status: "wip", range: "官方公告僅標示範圍為「喜樹及灣裡地區」，未附完整四至文字。", note: "行政區為南區，非安南區" },
      { name: "第十四期永康二王市地重劃", district: "永康區", period: "114-09-30", areaHectares: "32.505", status: "wip", range: "橫跨永康六甲頂都市計畫及高速公路永康交流道附近特定區計畫兩個都市計畫區，範圍涵蓋二王公墓及周邊地區，官方頁面未附完整四至文字。" },
      { name: "第十五期善化區興華市地重劃", district: "善化區", period: "114-02-03", areaHectares: "5.73", status: "wip", range: "原為民國71年劃設的善化運動場用地，鄰近善化高中運動場與善化文康育樂中心，官方頁面僅附地籍套繪圖，未附文字四至。" },
      { name: "第十六期永康大同市地重劃", district: "永康區", period: "114-09-24", areaHectares: "3.714", status: "wip", range: "原規劃為「文小5」學校用地，經教育局評估已無設校需求。官方頁面僅附地籍套繪圖，未附文字四至。" },
      { name: "第十七期永康車站北側產業專用區市地重劃", district: "永康區", period: "114-05-06", areaHectares: "11.512", status: "wip", range: "緊鄰永康車站站體及永康交流道旁，位居省道臺1線永康中正南路上，官方頁面未附完整四至文字。" },
      { name: "第十八期東區機35市地重劃", district: "東區", period: "114-10-15", areaHectares: "5.9189", status: "wip", range: "原為安置榮民之機構用地，因房舍老舊經行政院同意遷建後開發，官方頁面未附完整四至文字。" },
      { name: "第十九期下營公設解編市地重劃", district: "下營區", period: "115-07-15", areaHectares: "7.908", status: "wip", range: "開發區坐落於下營區十六甲段、仁里段、營南段、營平段、營安段、營正段等部分土地。" },
      { name: "新營第二市場市地重劃", district: "新營區", period: "114-04-29", areaHectares: "0.4737", status: "wip", range: "位於新營區市中心，即新營第二市場原址（民國45年營運至今屋齡逾70年），官方頁面未附完整四至文字。" },
      { name: "第二十四期安南區朝皇市地重劃", district: "安南區", period: "113-07-20", areaHectares: "9.01", status: "planning", range: "位於海佃路二段西側近安中路三段，鄰近已完成的第八期本淵寮市地重劃區、第71期安北自辦重劃及第92期淵北自辦重劃案。" },
      { name: "永康永大市地重劃", district: "永康區", period: "114-06-30", areaHectares: "5.63", status: "wip", range: "面臨永大路二段新興商業商圈軸帶，鄰近永康戶政、永康衛生所、永康地政及永康探索教育公園，官方頁面未附完整四至文字。" },
      { name: "永康區五王市地重劃", district: "永康區", period: "113-07-20", areaHectares: "3.934", status: "wip", range: "位於永康區繁華地帶，西側緊鄰五王國小，官方頁面未附完整四至文字。" },
      { name: "永康區竹園市地重劃", district: "永康區", period: "114-09-30", areaHectares: "5.692", status: "wip", range: "與永康交流道、永康車站、鹽行國中及永康物流市地重劃區相鄰，官方頁面未附完整四至文字。" },
      { name: "官田二鎮市地重劃", district: "官田區", period: "111-03-02", areaHectares: "—", status: "planning", range: "官方公告資訊有限，僅知111年3月辦理座談會，114年7月都市計畫變更案提送都市計畫委員會審議中，尚無四至文字或面積數字。" },
      { name: "臺南市安平區漁光島北側市地重劃", district: "安平區", period: "114-06-30", areaHectares: "14.43", status: "wip", range: "位於安平區漁光島北側，鄰近安平古堡、億載金城及安平老街等歷史遺跡，含原舢舨碼頭工程腹地及漁光橋北側港埠用地周邊。", note: "遊憩用地5.49公頃不納入重劃費用計算" },
      { name: "臺南市安平區漁光島南側市地重劃", district: "安平區", period: "114-06-30", areaHectares: "5.08", status: "wip", range: "位於安平區漁光島南側，官方頁面未附完整四至文字。" },
      { name: "臺南市南區灣裡產業專用區市地重劃", district: "南區", period: "114-04-29", areaHectares: "8.23", status: "wip", range: "位於南區灣裡工業區西側、二仁溪北側，範圍為南山段之土地。" },
      { name: "學甲區東陽市地重劃", district: "學甲區", period: "113-08-26", areaHectares: "7.35", status: "planning", range: "位於東陽國小東側、市道171（寶發路）北側及中華路二段西側，範圍涵蓋東陽段及東興段之土地。" },
    ]),
  },
];

export const ZONE_EXPROPRIATION_GROUPS: LandDevelopmentEra[] = [
  {
    key: "z-done",
    mechanism: "區段徵收",
    mark: "已完成",
    title: "已完成區段徵收",
    period: "11 案",
    cards: true,
    zones: withSource([
      { name: "永康區大橋區段徵收案", nickname: "俗稱「東橋重劃區」", district: "永康區", period: "107-01-24", areaHectares: "49.49", status: "done", range: "位於永康區大橋地區，東至東橋七路（緊鄰陸軍砲兵學校舊址），西至東橋一路，北鄰縱貫鐵路。開發目的是紓解永康人口成長下的住宅與國中用地需求。" },
      { name: "永康區新設鹽行國中暨附近地區區段徵收案", nickname: "俗稱「鹽行國中重劃區」", district: "永康區", period: "110-10-15", areaHectares: "57.68", status: "done", range: "位於永康區鹽行地區，東至中山高速公路、三民街及農業區邊界，西至永安路（幹7號道路），南鄰永康物流及貨運市地重劃區與工業區，北接工業區及三崁店社區。主要目的是新設雙語鹽行國中並拓寬永安路。" },
      { name: "高速鐵路臺南車站特定區區段徵收案", nickname: "俗稱「歸仁高鐵特區」", district: "歸仁區", period: "109-05-18", areaHectares: "—", status: "done", range: "位於歸仁區高鐵臺南站周邊，東至光明街（鄰明德新村），西至高發三路（鄰沙崙農場），南至大武路（鄰武東里），北至歸仁一、二路（鄰臺86線）。民國88年公告都市計畫，配合高鐵臺南站興建開發。" },
      { name: "南台南站副都心第一期區段徵收案", district: "東區", period: "111-12-15", areaHectares: "70.23", status: "done", range: "位於東區台糖試驗所周邊，東至崇明路、崇德路，西至大同路二段，北達崇賢七路及巴克禮公園，南以行政區界與仁德區二空眷村相鄰。配合台鐵地下捷運化增設南台南站而開發。" },
      { name: "中國城暨運河星鑽地區區段徵收案", district: "中西區", period: "110-10-13", areaHectares: "11.23", status: "done", range: "位於中西區台南運河與中正商圈交會處，分兩地區：運河星鑽地區北、東鄰台南運河，西至府前一街，南鄰現有住宅區；中國城地區北含環河北街、東至康樂街，西至環河街，南至金華新路。目標為恢復運河水岸空間並促進舊街區再發展。" },
      { name: "安平水景公園區段徵收案", district: "安平區", period: "110-03-05", areaHectares: "26.83", status: "done", range: "位於安平區，東至安平路850巷及內湖一街，北臨王城路，南至安平港舢舨碼頭，西臨安平路990巷及同平路。配合「安平港歷史風貌園區」開發計畫，已於103年完成財務結算。" },
      { name: "德高區段徵收案", district: "東區", period: "110-03-05", areaHectares: "8.7", status: "done", range: "位於東區與仁德區交界處，東鄰仁德區，西接德祥街及仁和路，南至民安路，北至自由路一段152巷及德祥街。原為空軍彈藥庫保護區，解編後變更為住宅區並打通仁和路聯絡功能。", note: "行政區為東區，非安南區" },
      { name: "和順寮農場區段徵收案", district: "安南區", period: "110-03-04", areaHectares: "192.64", status: "done", range: "位於安南區，東至和慶路（鄰鹽水溪排水路），南至台江大道（80米道路）及農業區，西至安順排水線（鄰市立安南醫院），北至農業區及安定區界。原為台糖甘蔗農場，因設立台灣歷史博物館而開發。" },
      { name: "新市新和社內區段徵收案", district: "新市區", period: "92年公告", areaHectares: "37.53", status: "done", range: "位於新市區復興路（台19甲）以西、新市大排以南、10公尺計畫道路以東、民權路及12公尺計畫道路以北所包圍的區域。配合南科就業人口與國道八號通車後的都市發展需求開發。" },
      { name: "台南科學工業園區特定區計畫（新市建設地區L、M地區）區段徵收案", district: "新市區", period: "107-01-24", areaHectares: "—", status: "done", range: "位於新市區台南科學工業園區特定區內，東以善新大道為界（鄰O區），西以善新西路為界（鄰縱貫鐵路），南以西拉雅大道為界（鄰N區），北以目加溜灣大道為界。配合南科園區生活機能而開發。" },
      { name: "臺南市南科特定區開發區塊F、G區段徵收案", district: "善化區／新市區", period: "109-11", areaHectares: "100.13", status: "done", range: "位於善化區及新市區南科特定區內，東以18-24米道路為界，南以3-50米道路為界（鄰O區），西以高速鐵路為界，北鄰E區。為提升南科園區生活服務機能而開發。", note: "南科特定區系列開發區塊之一" },
    ]),
  },
  {
    key: "z-wip",
    mechanism: "區段徵收",
    mark: "辦理中",
    title: "辦理中區段徵收",
    period: "3 案",
    cards: true,
    zones: withSource([
      { name: "永康砲校遷建暨創意設計園區開發區段徵收案", district: "永康區", period: "102年公告", areaHectares: "83.49", status: "wip", range: "位於永康區，西至東橋七路（鄰大橋國中區段徵收地區），東至中山南路365巷（鄰農業區及工業區），南以省道台20線中山南路為界，北以縱貫鐵路為界。配合「創意設計園區」開發及砲兵學校遷建。", note: "與市地重劃「永康二王」相鄰但屬不同案" },
      { name: "臺南市南科特定區開發區塊A、B、C、D、E、N、O區段徵收案", district: "安定區／善化區／新市區", period: "114-11~12", areaHectares: "334.18", status: "wip", range: "行政轄區橫跨安定區、善化區及新市區，北側以178市道為界，東西兩側略在鹽水溪排水路與大洲排水路之間。含產業用地74.84公頃、住宅商業區約158.98公頃、公共設施約141.36公頃。", note: "110年「優先發展區」母案曾估計此範圍約670公頃，114年正式公告面積下修為334.18公頃" },
      { name: "臺南市臺南科技產業專區區段徵收案", district: "中西區（西賢里）", period: "114-09-24", areaHectares: "30.23", status: "wip", range: "位於中西區西賢里，東側以華平路為界，南側接現有中西區建成社區與民權路四段（鄰安平區），西側緊鄰C3抽水站與和緯路五段，北側緊鄰和緯路五段（鄰北區）。原為教育部學產地魚塭，轉型為科技產業研發聚落。", note: "行政區為中西區，非仁德區" },
    ]),
  },
  {
    key: "z-planning",
    mechanism: "區段徵收",
    mark: "規劃中",
    title: "規劃中區段徵收",
    period: "6 案",
    cards: true,
    zones: withSource([
      { name: "「變更安定都市計畫（第五次通盤檢討）主要計畫（變11案農業區整體開發計畫）」區段徵收", nickname: "俗稱「安定國中重劃區」", district: "安定區", period: "112-04-17", areaHectares: "49.07", status: "planning", range: "位於安定區，東至市道178線西側，南至嘉南大圳安定分線周邊，西至嘉南大圳善化支線與安定分線匯流處，北至嘉南大圳善化支線周邊。配合南科產業發展需求開發安定都市計畫區。" },
      { name: "南台南站副都心第二期區段徵收案", district: "東區", period: "114-09-25", areaHectares: "13.88", status: "planning", range: "位於東區，分三個坵塊，範圍大致以鐵路地下化綠廊、巴克禮路、崇賢七路、生產路、大同路二段為界。為南台南站副都心第一期的後續開發案。" },
      { name: "歸仁聯合行政中心區段徵收案", district: "歸仁區", period: "113-07-17", areaHectares: "32.88", status: "planning", range: "位於歸仁區，北臨中正南路，東、西側鄰接現行計畫住宅區，南側納入部分非都市土地並臨接台南都會區外環道（凱旋路一段）。" },
      { name: "臺南市南科特定區開發區塊I區段徵收案", district: "新市區", period: "113-07-17", areaHectares: "14.66", status: "planning", range: "位於新市區南科特定區南側，北側以南134線為界，東西兩側略在鹽水溪排水路與大洲排水路之間，鄰近樹谷園區。" },
      { name: "臺南市新市都市計畫（附帶條件農業區）區段徵收案", district: "新市區", period: "113-07-19", areaHectares: "12.6", status: "planning", range: "位於新市區新和里及社內里、高鐵兩側，東側與工五變更案（明大公司開發案）相鄰，南側緊鄰農業區、位於四-20公尺道路以北，西側約以新市都市計畫範圍為界，北側緊鄰住宅區。", note: "與已完成的「新市新和社內區段徵收案」同區不同案" },
      { name: "南科特定區優先發展區區段徵收開發案", district: "新市區／善化區／安定區", period: "110-11-24", areaHectares: "—", status: "planning", range: "涵蓋新市區、善化區、安定區周邊，是南科特定區F、G、I、A-E、N、O等多個開發區塊的整體規劃母案，屬總面積約3,282.92公頃南科特定區的一部分。", note: "各子區塊已陸續各自另行公告，面積不應與F、G／A-E,N,O／I三案重複加總" },
    ]),
  },
];
