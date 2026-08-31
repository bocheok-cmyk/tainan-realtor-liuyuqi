import { CaseType, ListingData, isHouseCase, isLandCase } from "@/lib/listing-schema";

const MODEL = "claude-sonnet-4-6";

export type FeaturesResult = {
  text: string;
  source: "rule" | "claude";
};

/** 不用 API key 也能動的規則制草稿，從已填欄位拼出幾句常見講法（依案件類型挑相關欄位，避免房屋/土地欄位混用） */
export function ruleFeatures(data: ListingData, caseType: CaseType): string {
  const lines: string[] = [];

  if (isHouseCase(caseType)) {
    if (data.floor && data.totalFloors) {
      if (data.floor === data.totalFloors) lines.push("頂樓景觀戶，視野開闊，採光充足");
      else if (data.floor / data.totalFloors >= 0.7) lines.push("高樓層，視野佳，採光通風良好");
    }
    if (data.isCornerUnit) lines.push("邊間格局，採光面多，通風良好，不易潮濕");
    if (data.orientation.includes("南")) lines.push("座向佳，冬暖夏涼");
    if (data.parkingType) lines.push(`附車位（${data.parkingType}），停車方便`);
  }
  if (isLandCase(caseType)) {
    if (data.useZone) lines.push(`使用分區為${data.useZone}，用途明確`);
    if (data.frontageWidth) lines.push(`面寬約${data.frontageWidth}米，臨路方正`);
  }
  if (data.nearbySchool) lines.push(`鄰近${data.nearbySchool}，通學方便`);
  if (data.nearbyMarket) lines.push(`鄰近${data.nearbyMarket}，生活機能佳`);
  if (data.roadWidth) lines.push(`臨路${data.roadWidth}，交通便利`);

  if (lines.length === 0) return "";
  return lines.map((l, i) => `${i + 1}.${l}`).join("\n");
}

/**
 * 對外入口：沒設 ANTHROPIC_API_KEY 就回規則制草稿；有設就用 AI 潤飾，
 * AI 出任何差錯都退回規則制，不會擋住表格填寫。
 */
export async function generateFeatures(data: ListingData, caseType: CaseType): Promise<FeaturesResult> {
  const fallback = ruleFeatures(data, caseType);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { text: fallback, source: "rule" };

  const houseFields = isHouseCase(caseType)
    ? [
        data.floor && data.totalFloors && `樓層：${data.floor}樓，共${data.totalFloors}樓`,
        data.orientation && `朝向：${data.orientation}`,
        data.layoutRooms && `格局：${data.layoutRooms}房${data.layoutLivingRooms ?? ""}廳${data.layoutBaths ?? ""}衛`,
        data.isCornerUnit && "邊間",
        data.parkingType && `車位：${data.parkingType}`,
        data.material && `建材：${data.material}`,
        data.completionDate && `建築完成日：${data.completionDate}`,
      ]
    : [];
  const landFields = isLandCase(caseType)
    ? [
        data.useZone && `使用分區：${data.useZone}`,
        data.useCategory && `使用地類別：${data.useCategory}`,
        data.frontageWidth && `面寬：${data.frontageWidth}米`,
      ]
    : [];

  const summary = [
    `案件類型：${caseType}`,
    data.title && `案名：${data.title}`,
    data.address && `地址：${data.address}`,
    ...houseFields,
    ...landFields,
    data.roadWidth && `臨路：${data.roadWidth}`,
    data.nearbyMarket && `鄰近市場：${data.nearbyMarket}`,
    data.nearbySchool && `鄰近學校：${data.nearbySchool}`,
    data.nearbyPark && `公園綠地：${data.nearbyPark}`,
    data.nearbyBank && `金融機構：${data.nearbyBank}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system:
          "你是資深房仲的助理，幫忙把物件資料寫成「物件特性」條列文字（繁體中文，絕不簡體）。" +
          "輸出格式：每行一句賣點，前面加「數字.」，3-5 句，直接講重點不誇大、不虛構沒給的資訊，只能用使用者提供的欄位內容去推論。" +
          "案件類型如果是「土地買賣」或「土地租賃」，只能談土地相關的賣點（分區、面寬、臨路、地段），絕對不要提到樓層、邊間、車位、建材這些房屋才有的東西。",
        messages: [{ role: "user", content: summary || "（欄位尚未填寫，請回空字串）" }],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return { text: fallback, source: "rule" };

    const json = await res.json();
    const text = String(json?.content?.[0]?.text || "").trim();
    if (!text) return { text: fallback, source: "rule" };

    return { text, source: "claude" };
  } catch {
    return { text: fallback, source: "rule" };
  }
}
