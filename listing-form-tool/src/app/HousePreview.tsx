import { CaseType, ListingData } from "@/lib/listing-schema";

// 劉育琪品牌視覺規範（C:\agent-os\brand-system）— 跟 ListingForm.tsx 用同一套色碼/字體，不重新發明數值
const bg = "#F7F4EF";
const surface = "#E8E2D7";
const primary = "#7E9384";
const ink = "#3E463D";
const muted = "#A69A8F";
const accent = "#C77958";
const border = "#DADADA";
const headingFont = "var(--font-heading), 'Noto Serif TC', serif";
const bodyFont = "var(--font-body), 'Noto Sans TC', sans-serif";
const numericFont = "var(--font-numeric), 'Inter', sans-serif";

const cell = { borderBottom: `1px solid ${border}`, padding: "10px 14px", fontSize: 14, fontFamily: bodyFont, color: ink };
const th = { ...cell, color: muted, width: 140, background: surface, fontWeight: 600 };
const priceCell = { ...cell, color: accent, fontWeight: 700, fontFamily: numericFont, fontSize: 18 };

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 18,
        fontWeight: 600,
        fontFamily: headingFont,
        color: ink,
        borderBottom: `2px solid ${primary}`,
        paddingBottom: 8,
        margin: "0 0 12px",
      }}
    >
      {children}
    </h3>
  );
}

function PlaceholderBox({ label, height }: { label: string; height: number }) {
  return (
    <div
      style={{
        border: `1px dashed ${border}`,
        borderRadius: 14,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: muted,
        fontSize: 12,
        fontFamily: bodyFont,
        textAlign: "center",
        padding: 8,
        background: surface,
      }}
    >
      {label}
    </div>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 20, padding: 32 }}>{children}</div>
  );
}

function Footer({ data }: { data: ListingData }) {
  return (
    <>
      <div style={{ fontSize: 13, color: ink, fontFamily: bodyFont, marginTop: 24 }}>
        經紀人：{data.agentName || "—"}
        {data.agentLicense ? `（${data.agentLicense}）` : ""}　電話：{data.agentPhone || "—"}
      </div>
      <div style={{ fontSize: 12, color: muted, fontFamily: bodyFont, marginTop: 8 }}>
        以上資料僅供參考，實際資料以地政機關登記為準。
      </div>
    </>
  );
}

export function HousePreview({
  data,
  caseType,
  mainPlusAncillary,
}: {
  data: ListingData;
  caseType: CaseType;
  mainPlusAncillary: number | null;
}) {
  const isPresale = caseType === "房屋買賣-預售屋";
  const isHouseSale = caseType === "房屋買賣-成屋";

  return (
    <Container>
      <div style={{ fontSize: 12, color: muted, fontFamily: bodyFont, marginBottom: 6 }}>
        {caseType}
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 600, fontFamily: headingFont, color: ink, margin: "0 0 12px" }}>
        {data.title || "（尚未填寫案名）"}
      </h2>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, marginBottom: 24 }}>{data.address || "—"}</div>

      <SectionHeader>基本資料</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>委託價</td>
            <td style={priceCell} colSpan={3}>
              {data.askingPriceWan ?? "—"} 萬
            </td>
          </tr>
          <tr>
            <td style={th}>抵押設定</td>
            <td style={cell} colSpan={3}>
              {data.mortgageWan ?? "—"} 萬　權利人：{data.mortgagee || "—"}
            </td>
          </tr>
          <tr>
            <td style={th}>登記地坪</td>
            <td style={cell}>{data.landArea.ping ?? "—"} 坪</td>
            <td style={th}>登記建坪</td>
            <td style={cell}>{data.buildingArea.ping ?? "—"} 坪</td>
          </tr>
          <tr>
            <td style={th}>主建物+附屬建物</td>
            <td style={cell}>{mainPlusAncillary ?? "—"} 坪</td>
            <td style={th}>公設</td>
            <td style={cell}>{data.publicArea.ping ?? "—"} 坪</td>
          </tr>
          <tr>
            <td style={th}>主建物</td>
            <td style={cell}>{data.mainArea.ping ?? "—"} 坪</td>
            <td style={th}>附屬建物</td>
            <td style={cell}>{data.ancillaryArea.ping ?? "—"} 坪</td>
          </tr>
          {isPresale && (
            <tr>
              <td style={th}>建設公司</td>
              <td style={cell} colSpan={3}>
                {data.constructionCompany || "—"}
              </td>
            </tr>
          )}
          <tr>
            <td style={th}>建築完成日</td>
            <td style={cell}>{data.completionDate || "—"}</td>
            <td style={th}>格局</td>
            <td style={cell}>
              {data.layoutRooms ?? "—"}房{data.layoutLivingRooms ?? "—"}廳{data.layoutBaths ?? "—"}衛
            </td>
          </tr>
          <tr>
            <td style={th}>建物樓層</td>
            <td style={cell}>
              {data.floor ?? "—"}樓，共{data.totalFloors ?? "—"}樓
            </td>
            <td style={th}>朝向</td>
            <td style={cell}>{data.orientation || "—"}</td>
          </tr>
          {!isPresale && (
            <tr>
              <td style={th}>是否為邊間</td>
              <td style={cell}>{data.isCornerUnit ? "是" : "否"}</td>
              <td style={th}>建物主要用途</td>
              <td style={cell}>{data.mainUse || "—"}</td>
            </tr>
          )}
          <tr>
            <td style={th}>建材</td>
            <td style={cell}>{data.material || "—"}</td>
            <td style={th}>有無警衛</td>
            <td style={cell}>{data.hasSecurityGuard ? "有" : "無"}</td>
          </tr>
          <tr>
            <td style={th}>管理費</td>
            <td style={cell}>
              {data.managementFee ?? "—"} 元/{data.managementFeeCycle}
            </td>
            <td style={th}>車位</td>
            <td style={cell}>
              {data.parkingType || "—"}
              {data.parkingType === "坡道機械車位" && data.parkingMechanicalLevel
                ? `（${data.parkingMechanicalLevel}）`
                : ""}
              （{data.parkingArea.ping ?? "—"} 坪，編號 {data.parkingPosition || "—"}）
            </td>
          </tr>
          <tr>
            <td style={th}>同層/地下/電梯/採光</td>
            <td style={cell} colSpan={3}>
              同層 {data.unitsPerFloor ?? "—"} 戶／地下 {data.basementFloors ?? "—"} 層／電梯 {data.elevators ?? "—"}{" "}
              台／採光 {data.lightingFaces ?? "—"} 面
            </td>
          </tr>
          <tr>
            <td style={th}>垃圾集中回收處</td>
            <td style={cell} colSpan={3}>
              {data.garbageCollection || "—"}
              {data.garbageCollection === "有（有時間限制）" && data.garbageCollectionTime
                ? `　時間：${data.garbageCollectionTime}`
                : ""}
            </td>
          </tr>
          {isHouseSale && (
            <tr>
              <td style={th}>土地增值稅</td>
              <td style={cell} colSpan={3}>
                自用 約{data.taxSelfUse ?? "—"}元　一般 約{data.taxGeneral ?? "—"}元
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <SectionHeader>土地使用分區資訊</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>使用分區</td>
            <td style={cell}>{data.useZone || "—"}</td>
            <td style={th}>使用地類別</td>
            <td style={cell}>{data.useCategory || "—"}</td>
          </tr>
          <tr>
            <td style={th}>建蔽率</td>
            <td style={cell}>{data.buildingCoverageRatio || "—"}</td>
            <td style={th}>容積率</td>
            <td style={cell}>{data.floorAreaRatio || "—"}</td>
          </tr>
          <tr>
            <td style={th}>公告現值</td>
            <td style={cell}>{data.publicAnnouncedValue ?? "—"} 元/m²</td>
            <td style={th}>面寬 / 臨路</td>
            <td style={cell}>
              {data.frontageWidth || "—"} 米／{data.roadWidth || "—"}
            </td>
          </tr>
          <tr>
            <td style={th}>重劃區</td>
            <td style={cell} colSpan={3}>
              {data.reclamationZoneNote || "—"}
            </td>
          </tr>
          <tr>
            <td style={th}>淹水潛勢</td>
            <td style={cell} colSpan={3}>
              {data.floodRiskNote || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <SectionHeader>周邊環境</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>鄰近市場</td>
            <td style={cell}>{data.nearbyMarket || "—"}</td>
            <td style={th}>鄰近學校</td>
            <td style={cell}>{data.nearbySchool || "—"}</td>
          </tr>
          <tr>
            <td style={th}>公園綠地</td>
            <td style={cell}>{data.nearbyPark || "—"}</td>
            <td style={th}>金融機構</td>
            <td style={cell}>{data.nearbyBank || "—"}</td>
          </tr>
        </tbody>
      </table>

      <SectionHeader>照片 / 格局圖 / 位置圖</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        <PlaceholderBox label="照片" height={140} />
        <PlaceholderBox label="格局圖（僅供參考，實際應以現場看屋為準）" height={140} />
        <PlaceholderBox label="位置圖" height={140} />
      </div>

      <SectionHeader>物件特性</SectionHeader>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 24 }}>
        {data.features || "—"}
      </div>

      <SectionHeader>注意事項</SectionHeader>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
        {data.notes || "—"}
      </div>

      <Footer data={data} />
    </Container>
  );
}

export function LandPreview({ data, caseType }: { data: ListingData; caseType: CaseType }) {
  const isSale = caseType === "土地買賣";

  return (
    <Container>
      <div style={{ fontSize: 12, color: muted, fontFamily: bodyFont, marginBottom: 6 }}>
        {caseType}
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 600, fontFamily: headingFont, color: ink, margin: "0 0 12px" }}>
        {data.title || "（尚未填寫案名）"}
      </h2>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, marginBottom: 24 }}>
        土地坐落：{data.landLocation || "—"}　相關位置：{data.relatedLocation || "—"}
      </div>

      <SectionHeader>基本資料</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>委託價</td>
            <td style={priceCell} colSpan={3}>
              {data.askingPriceWan ?? "—"} 萬
            </td>
          </tr>
          <tr>
            <td style={th}>委託單價</td>
            <td style={cell} colSpan={3}>
              約 {data.unitPriceWanPerPing ?? "—"} 萬/坪；{data.unitPriceWanPerFen ?? "—"} 萬/分
            </td>
          </tr>
          <tr>
            <td style={th}>面積</td>
            <td style={cell}>
              {data.landOnlyArea.ping ?? "—"} 坪（{data.landOnlyArea.sqm ?? "—"} m²）
            </td>
            <td style={th}>座向</td>
            <td style={cell}>{data.orientation || "—"}</td>
          </tr>
          <tr>
            <td style={th}>面寬 / 深度</td>
            <td style={cell}>
              約 {data.frontageWidth || "—"} 米／約 {data.landDepth || "—"} 米
            </td>
            <td style={th}>土地種類</td>
            <td style={cell}>{data.landType || "—"}</td>
          </tr>
          <tr>
            <td style={th}>抵押設定</td>
            <td style={cell} colSpan={3}>
              {data.mortgageWan ?? "—"} 萬　權利人：{data.mortgagee || "—"}
            </td>
          </tr>
          {isSale && (
            <tr>
              <td style={th}>增值稅</td>
              <td style={cell} colSpan={3}>
                {data.landValueIncrementTax ?? "—"} 元（以稅捐處核發之稅單為準）
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <SectionHeader>土地使用分區資訊</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>使用分區</td>
            <td style={cell}>{data.useZone || "—"}</td>
            <td style={th}>使用地類別</td>
            <td style={cell}>{data.useCategory || "—"}</td>
          </tr>
          <tr>
            <td style={th}>建蔽率</td>
            <td style={cell}>{data.buildingCoverageRatio || "—"}</td>
            <td style={th}>容積率</td>
            <td style={cell}>{data.floorAreaRatio || "—"}</td>
          </tr>
          <tr>
            <td style={th}>公告現值</td>
            <td style={cell} colSpan={3}>
              {data.publicAnnouncedValue ?? "—"} 元/m²
            </td>
          </tr>
          <tr>
            <td style={th}>重劃區</td>
            <td style={cell} colSpan={3}>
              {data.reclamationZoneNote || "—"}
            </td>
          </tr>
          <tr>
            <td style={th}>淹水潛勢</td>
            <td style={cell} colSpan={3}>
              {data.floodRiskNote || "—"}
            </td>
          </tr>
        </tbody>
      </table>

      <SectionHeader>周邊環境</SectionHeader>
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 28 }}>
        <tbody>
          <tr>
            <td style={th}>臨路</td>
            <td style={cell} colSpan={3}>
              約 {data.roadWidth || "—"}
            </td>
          </tr>
          <tr>
            <td style={th}>鄰近市場</td>
            <td style={cell}>{data.nearbyMarket || "—"}</td>
            <td style={th}>鄰近學校</td>
            <td style={cell}>{data.nearbySchool || "—"}</td>
          </tr>
          <tr>
            <td style={th}>公園綠地</td>
            <td style={cell}>{data.nearbyPark || "—"}</td>
            <td style={th}>金融機構</td>
            <td style={cell}>{data.nearbyBank || "—"}</td>
          </tr>
        </tbody>
      </table>

      <SectionHeader>照片 / 地形圖 / 位置圖</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        <PlaceholderBox label="照片" height={140} />
        <PlaceholderBox label="地形圖" height={140} />
        <PlaceholderBox label="位置圖" height={140} />
      </div>

      <SectionHeader>物件特性</SectionHeader>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 24 }}>
        {data.features || "—"}
      </div>

      <SectionHeader>注意事項</SectionHeader>
      <div style={{ fontSize: 14, fontFamily: bodyFont, color: ink, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
        {data.notes || "—"}
      </div>

      <Footer data={data} />
    </Container>
  );
}
