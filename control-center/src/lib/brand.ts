export const AGENT = {
  name: "劉育琪",
  title: "臺南在地房仲",
  slogan: "這間有在賣",
  company: "幸福家不動產",
  phone: "0906-719-966",
  phoneRaw: "0906719966",
  line: "0906719966",
} as const;

export const SOCIAL = {
  fb: "https://www.facebook.com/LYCyuchiL/",
  ig: "#",
  threads: "#",
} as const;

export function hasLink(url: string) {
  return url !== "#" && url.length > 0;
}
