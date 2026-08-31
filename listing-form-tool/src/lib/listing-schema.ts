export type AreaField = {
  /** 謄本上登記的平方公尺數 */
  sqm: number | null;
  /** 換算後的坪數（sqm 有值時自動算出，也可以直接手動覆寫） */
  ping: number | null;
};

export function emptyArea(): AreaField {
  return { sqm: null, ping: null };
}

export const CASE_TYPES = ["房屋買賣-成屋", "房屋買賣-預售屋", "房屋租賃", "土地買賣", "土地租賃"] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export function isLandCase(caseType: CaseType): boolean {
  return caseType === "土地買賣" || caseType === "土地租賃";
}

export function isHouseCase(caseType: CaseType): boolean {
  return !isLandCase(caseType);
}

export type ListingData = {
  // 共通
  title: string;
  address: string;
  landLocation: string; // 土地坐落（土地類用，取代地址）
  relatedLocation: string; // 相關位置（土地類）
  terraceType: "" | "中庭" | "獨門獨院"; // 透天類別（房屋類）

  askingPriceWan: number | null; // 委託價（萬）／租屋時代表租金
  mortgageWan: number | null;
  mortgagee: string;

  // 房屋類面積
  landArea: AreaField;
  landSharePercent: number | null; // 土地持分比例（%，預售屋用：土地總面積 × 持分比例 = 買方土地面積）
  buildingArea: AreaField;
  mainArea: AreaField;
  ancillaryArea: AreaField;
  publicArea: AreaField;

  // 土地類面積
  landOnlyArea: AreaField; // 面積：坪(m²)
  frontageWidth: string; // 面寬（米）
  landDepth: string; // 深度（米，土地類）
  unitPriceWanPerPing: number | null; // 委託單價 萬/坪
  unitPriceWanPerFen: number | null; // 委託單價 萬/分

  // 土地使用分區資訊（房屋、土地案件都適用）
  landType: "" | "都市計畫區" | "非都市計畫區";
  useZone: string; // 使用分區（土地分區）
  useCategory: string; // 使用地類別
  buildingCoverageRatio: string; // 建蔽率
  floorAreaRatio: string; // 容積率
  publicAnnouncedValue: number | null; // 公告現值 元/m²
  reclamationZoneNote: string; // 重劃區摘要（自動查詢結果或手動填寫）
  floodRiskNote: string; // 淹水潛勢摘要（NCDR查詢結果或手動填寫）

  managementFee: number | null;
  managementFeeCycle: "月繳" | "季繳" | "年繳";

  completionDate: string;
  layoutRooms: number | null;
  layoutLivingRooms: number | null;
  layoutBaths: number | null;

  floor: number | null;
  totalFloors: number | null;
  orientation: string;
  mainUse: string; // 建物主要用途（售屋）
  constructionCompany: string; // 建設公司（預售屋）

  parkingType: string;
  parkingPosition: string; // 車位編號
  parkingArea: AreaField;
  motorcycleParking: string;

  unitsPerFloor: number | null;
  basementFloors: number | null;
  elevators: number | null;
  lightingFaces: number | null;
  isCornerUnit: boolean; // 是否為邊間（售屋、租屋）
  hasSecurityGuard: boolean;
  material: string;

  // 稅務
  taxSelfUse: number | null; // 增值稅（自用優惠稅率，售屋）
  taxGeneral: number | null; // 增值稅（一般稅率，售屋）
  landValueIncrementTax: number | null; // 增值稅（土地買賣）

  roadWidth: string;
  nearbyMarket: string;
  nearbySchool: string;
  nearbyPark: string;
  nearbyBank: string;

  features: string;
  notes: string;

  agentName: string;
  agentLicense: string;
  agentPhone: string;
};

export function emptyListing(): ListingData {
  return {
    title: "",
    address: "",
    landLocation: "",
    relatedLocation: "",
    terraceType: "",
    askingPriceWan: null,
    mortgageWan: null,
    mortgagee: "",
    landArea: emptyArea(),
    landSharePercent: null,
    buildingArea: emptyArea(),
    mainArea: emptyArea(),
    ancillaryArea: emptyArea(),
    publicArea: emptyArea(),
    landOnlyArea: emptyArea(),
    frontageWidth: "",
    landDepth: "",
    landType: "",
    useZone: "",
    useCategory: "",
    buildingCoverageRatio: "",
    floorAreaRatio: "",
    publicAnnouncedValue: null,
    reclamationZoneNote: "",
    floodRiskNote: "",
    unitPriceWanPerPing: null,
    unitPriceWanPerFen: null,
    managementFee: null,
    managementFeeCycle: "月繳",
    completionDate: "",
    layoutRooms: null,
    layoutLivingRooms: null,
    layoutBaths: null,
    floor: null,
    totalFloors: null,
    orientation: "",
    mainUse: "集合住宅",
    constructionCompany: "",
    parkingType: "",
    parkingPosition: "",
    parkingArea: emptyArea(),
    motorcycleParking: "",
    unitsPerFloor: null,
    basementFloors: null,
    elevators: null,
    lightingFaces: null,
    isCornerUnit: false,
    hasSecurityGuard: false,
    material: "鋼筋混凝土",
    taxSelfUse: null,
    taxGeneral: null,
    landValueIncrementTax: null,
    roadWidth: "",
    nearbyMarket: "",
    nearbySchool: "",
    nearbyPark: "",
    nearbyBank: "",
    features: "",
    notes: "",
    agentName: "",
    agentLicense: "",
    agentPhone: "",
  };
}

export function mainPlusAncillaryPing(data: ListingData): number | null {
  const m = data.mainArea.ping;
  const a = data.ancillaryArea.ping;
  if (m === null && a === null) return null;
  return Math.round(((m || 0) + (a || 0)) * 100) / 100;
}
