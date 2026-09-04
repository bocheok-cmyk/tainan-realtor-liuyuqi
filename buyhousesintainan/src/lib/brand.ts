export const AGENT = {
  name: "劉育琪",
  // SEO 用字：Google Trends 實測「台南」搜尋量遠高於「臺南」（過去12個月台灣地區，
  // 幾乎是壓倒性差距），品牌主標題/meta title 一律用「台」，不要用「臺」。
  title: "台南在地房仲",
  // slogan 尚未定案，先用暫定文字卡位——見 memory feedback_communication_style，
  // 定案前不要在任何頁面上用「自我介紹」語氣硬填空白。
  slogan: "不只是帶看，是幫你把資產放對位置。",
  company: "幸福家事業有限公司崇明營業處所",
  phone: "0906-719-966",
  phoneRaw: "0906719966",
  line: "@vv617",
} as const;

export const SOCIAL = {
  fb: "https://www.facebook.com/LYCyuchiL/",
  threads: "https://www.threads.com/@buyhouses_in_tainan",
  ig: "#",
} as const;

export function hasLink(url: string) {
  return url !== "#" && url.length > 0;
}
