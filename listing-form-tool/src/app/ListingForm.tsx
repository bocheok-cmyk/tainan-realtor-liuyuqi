"use client";

import { useEffect, useState } from "react";
import {
  ListingData,
  AreaField,
  CaseType,
  CASE_TYPES,
  emptyListing,
  mainPlusAncillaryPing,
  isLandCase,
  isHouseCase,
} from "@/lib/listing-schema";
import { sqmToPing, presaleLandPing } from "@/lib/ping";
import type { NearbyPlace } from "@/lib/nearby-places";
import { HousePreview, LandPreview } from "@/app/HousePreview";

// 劉育琪品牌視覺規範（C:\agent-os\brand-system）— 色碼/字體/圓角/高度一律對照 design-tokens.json，禁止另外發明數值
const bg = "#F7F4EF"; // 暖米白 Warm Paper，主背景
const surface = "#E8E2D7"; // 淺砂岩灰 Sandstone，卡片／輸入框背景
const primary = "#7E9384"; // 莫蘭迪鼠尾草綠 Muted Sage，主色
const ink = "#3E463D"; // 深橄欖灰 Deep Olive，文字色
const muted = "#A69A8F"; // 暖灰棕 Warm Gray Brown，輔助／次要文字
const accent = "#C77958"; // 陶土橘 Terracotta，強調色（金額／重要數字）
const border = "#DADADA"; // 淺冷灰 Light Gray，分隔線
const headingFont = "var(--font-heading), 'Noto Serif TC', serif";
const bodyFont = "var(--font-body), 'Noto Sans TC', sans-serif";
const numericFont = "var(--font-numeric), 'Inter', sans-serif";

const card = { background: surface, borderRadius: 20, border: `1px solid ${border}`, padding: 24 };
const label = { fontSize: 14, color: muted, display: "block", marginBottom: 6, fontFamily: bodyFont };
const input = {
  width: "100%",
  height: 44,
  padding: "0 16px",
  fontSize: 16,
  border: `1px solid ${border}`,
  borderRadius: 14,
  boxSizing: "border-box" as const,
  background: bg,
  color: ink,
  fontFamily: bodyFont,
};
const buttonPrimary = {
  height: 44,
  padding: "0 24px",
  borderRadius: 14,
  border: "none",
  background: primary,
  color: "#fff",
  fontFamily: bodyFont,
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer" as const,
  boxShadow: "none",
};
const buttonSecondary = {
  height: 44,
  padding: "0 24px",
  borderRadius: 14,
  border: `1px solid ${primary}`,
  background: "transparent",
  color: primary,
  fontFamily: bodyFont,
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer" as const,
};
const sectionTitle = { fontSize: 20, fontWeight: 600, margin: "0 0 16px", fontFamily: headingFont, color: ink };
const row = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 };

type NearbyResponse = { configured: boolean; results: Record<string, NearbyPlace[]> | null };
type FloodResponse = {
  configured: boolean;
  result: { scenarios: { label: string; depthRange: string | null }[] } | null;
};

function AreaInput({
  label: fieldLabel,
  value,
  onChange,
}: {
  label: string;
  value: AreaField;
  onChange: (v: AreaField) => void;
}) {
  return (
    <div>
      <span style={label}>{fieldLabel}</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          style={input}
          type="number"
          placeholder="平方公尺"
          value={value.sqm ?? ""}
          onChange={(e) => {
            const sqm = e.target.value === "" ? null : parseFloat(e.target.value);
            onChange({ sqm, ping: sqm === null ? value.ping : sqmToPing(sqm) });
          }}
        />
        <span style={{ fontSize: 12, color: muted }}>㎡ →</span>
        <input
          style={input}
          type="number"
          placeholder="坪"
          value={value.ping ?? ""}
          onChange={(e) => onChange({ ...value, ping: e.target.value === "" ? null : parseFloat(e.target.value) })}
        />
        <span style={{ fontSize: 12, color: muted }}>坪</span>
      </div>
    </div>
  );
}

export default function ListingForm() {
  const [caseType, setCaseType] = useState<CaseType>("房屋買賣-成屋");
  const [data, setData] = useState<ListingData>(emptyListing());
  const [deedRaw, setDeedRaw] = useState<string>("");
  const [deedBusy, setDeedBusy] = useState(false);
  const [deedStatus, setDeedStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [deedVisionBusy, setDeedVisionBusy] = useState(false);
  const [deedVisionStatus, setDeedVisionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [deedVisionDragOver, setDeedVisionDragOver] = useState(false);
  const [deedVisionStagedFiles, setDeedVisionStagedFiles] = useState<File[]>([]);
  const [deedVisionPreviewUrls, setDeedVisionPreviewUrls] = useState<string[]>([]);
  const [zoningVisionBusy, setZoningVisionBusy] = useState(false);
  const [zoningVisionStatus, setZoningVisionStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [zoningVisionDragOver, setZoningVisionDragOver] = useState(false);
  const [geoLookupBusy, setGeoLookupBusy] = useState(false);
  const [geoLookupStatus, setGeoLookupStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [nearbyBusy, setNearbyBusy] = useState(false);
  const [nearbyResults, setNearbyResults] = useState<NearbyResponse | null>(null);
  const [floodBusy, setFloodBusy] = useState(false);
  const [floodResult, setFloodResult] = useState<FloodResponse | null>(null);
  const [featuresBusy, setFeaturesBusy] = useState(false);
  const [featuresSource, setFeaturesSource] = useState<"rule" | "claude" | null>(null);

  const isLand = isLandCase(caseType);
  const isHouse = isHouseCase(caseType);
  const isPresale = caseType === "房屋買賣-預售屋";
  const isHouseSale = caseType === "房屋買賣-成屋";
  const isLandSale = caseType === "土地買賣";
  const missingAddress = isLand ? !data.landLocation : !data.address;

  useEffect(() => {
    const urls = deedVisionStagedFiles.map((f) => URL.createObjectURL(f));
    setDeedVisionPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [deedVisionStagedFiles]);

  function set<K extends keyof ListingData>(key: K, value: ListingData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleDeedUpload(file: File) {
    setDeedBusy(true);
    setDeedStatus(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-deed", { method: "POST", body: form });
      if (!res.ok) {
        setDeedStatus({ ok: false, message: `辨識失敗（伺服器回傳 ${res.status}），請改用手動輸入。` });
        return;
      }

      const json = await res.json();
      setDeedRaw(json.rawText || "");

      const fields = [
        ["landSqm", json.landSqm],
        ["mainBuildingSqm", json.mainBuildingSqm],
        ["ancillaryBuildingSqm", json.ancillaryBuildingSqm],
        ["publicSqm", json.publicSqm],
      ] as const;
      const foundCount = fields.filter(([, v]) => v != null).length;

      if (foundCount === 0) {
        setDeedStatus({
          ok: false,
          message: "沒有從這份PDF抓到任何面積數字——可能是掃描檔沒有文字層，請改用手動輸入。",
        });
        return;
      }

      setDeedStatus({ ok: true, message: `辨識完成，抓到 ${foundCount} 項面積數字，請往下核對填入的欄位。` });
      setData((d) => ({
        ...d,
        landArea:
          !isLand && json.landSqm != null
            ? {
                sqm: json.landSqm,
                ping: isPresale ? presaleLandPing(json.landSqm, d.landSharePercent) : sqmToPing(json.landSqm),
              }
            : d.landArea,
        landOnlyArea:
          isLand && json.landSqm != null ? { sqm: json.landSqm, ping: sqmToPing(json.landSqm) } : d.landOnlyArea,
        mainArea:
          json.mainBuildingSqm != null
            ? { sqm: json.mainBuildingSqm, ping: sqmToPing(json.mainBuildingSqm) }
            : d.mainArea,
        ancillaryArea:
          json.ancillaryBuildingSqm != null
            ? { sqm: json.ancillaryBuildingSqm, ping: sqmToPing(json.ancillaryBuildingSqm) }
            : d.ancillaryArea,
        publicArea:
          json.publicSqm != null ? { sqm: json.publicSqm, ping: sqmToPing(json.publicSqm) } : d.publicArea,
      }));
    } catch {
      setDeedStatus({ ok: false, message: "辨識過程發生錯誤，請改用手動輸入。" });
    } finally {
      setDeedBusy(false);
    }
  }

  const MAX_DEED_VISION_FILES = 6;

  function addDeedVisionFiles(files: File[]) {
    if (files.length === 0) return;
    setDeedVisionStatus(null);
    setDeedVisionStagedFiles((prev) => {
      const combined = [...prev, ...files];
      if (combined.length > MAX_DEED_VISION_FILES) {
        setDeedVisionStatus({ ok: false, message: `一次最多 ${MAX_DEED_VISION_FILES} 張，超過的先不加入，請先送出辨識或移除幾張。` });
        return combined.slice(0, MAX_DEED_VISION_FILES);
      }
      return combined;
    });
  }

  function removeDeedVisionFile(index: number) {
    setDeedVisionStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitDeedVisionRecognition() {
    if (deedVisionStagedFiles.length === 0) return;
    setDeedVisionBusy(true);
    setDeedVisionStatus(null);
    try {
      const form = new FormData();
      deedVisionStagedFiles.forEach((f) => form.append("files", f));
      const res = await fetch("/api/parse-deed-vision", { method: "POST", body: form });
      const json = await res.json();

      if (res.status === 429) {
        setDeedVisionStatus({ ok: false, message: json.error || "今日AI辨識已達上限，請改用PDF上傳或手動輸入。" });
        return;
      }
      if (!res.ok) {
        setDeedVisionStatus({ ok: false, message: json.error || `辨識失敗（伺服器回傳 ${res.status}）。` });
        return;
      }
      if (json.note) {
        setDeedVisionStatus({ ok: false, message: json.note });
        setDeedVisionStagedFiles([]);
        return;
      }

      const fields = [
        ["landSqm", json.landSqm],
        ["mainBuildingSqm", json.mainBuildingSqm],
        ["ancillaryBuildingSqm", json.ancillaryBuildingSqm],
        ["publicSqm", json.publicSqm],
        ["address", json.address],
        ["landLocation", json.landLocation],
        ["mortgageWan", json.mortgageWan],
        ["mortgagee", json.mortgagee],
      ] as const;
      const foundCount = fields.filter(([, v]) => v != null).length;

      if (foundCount === 0) {
        setDeedVisionStatus({ ok: false, message: "AI沒有從這些截圖抓到任何面積數字、地址或抵押資料，請改用手動輸入。" });
        setDeedVisionStagedFiles([]);
        return;
      }

      setDeedVisionStatus({
        ok: true,
        message: `辨識完成，抓到 ${foundCount} 項欄位，請往下核對填入的內容。（今日已用 ${json.usedToday}/${json.dailyLimit} 次）`,
      });
      setDeedVisionStagedFiles([]);
      setData((d) => ({
        ...d,
        address: !isLand && json.address ? json.address : d.address,
        landLocation: isLand && json.landLocation ? json.landLocation : d.landLocation,
        landArea:
          !isLand && json.landSqm != null
            ? {
                sqm: json.landSqm,
                ping: isPresale ? presaleLandPing(json.landSqm, d.landSharePercent) : sqmToPing(json.landSqm),
              }
            : d.landArea,
        landOnlyArea:
          isLand && json.landSqm != null ? { sqm: json.landSqm, ping: sqmToPing(json.landSqm) } : d.landOnlyArea,
        mainArea:
          json.mainBuildingSqm != null
            ? { sqm: json.mainBuildingSqm, ping: sqmToPing(json.mainBuildingSqm) }
            : d.mainArea,
        ancillaryArea:
          json.ancillaryBuildingSqm != null
            ? { sqm: json.ancillaryBuildingSqm, ping: sqmToPing(json.ancillaryBuildingSqm) }
            : d.ancillaryArea,
        publicArea:
          json.publicSqm != null ? { sqm: json.publicSqm, ping: sqmToPing(json.publicSqm) } : d.publicArea,
        mortgageWan: json.mortgageWan != null ? json.mortgageWan : d.mortgageWan,
        mortgagee: json.mortgagee ? json.mortgagee : d.mortgagee,
      }));
    } catch {
      setDeedVisionStatus({ ok: false, message: "辨識過程發生錯誤，請改用手動輸入。" });
    } finally {
      setDeedVisionBusy(false);
    }
  }

  async function handleZoningImageUpload(file: File) {
    setZoningVisionBusy(true);
    setZoningVisionStatus(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/parse-zoning-vision", { method: "POST", body: form });
      const json = await res.json();

      if (res.status === 429) {
        setZoningVisionStatus({ ok: false, message: json.error || "今日AI辨識已達上限，請改用手動輸入。" });
        return;
      }
      if (!res.ok) {
        setZoningVisionStatus({ ok: false, message: json.error || `辨識失敗（伺服器回傳 ${res.status}）。` });
        return;
      }
      if (json.note) {
        setZoningVisionStatus({ ok: false, message: json.note });
        return;
      }

      const fields = [
        ["useZone", json.useZone],
        ["useCategory", json.useCategory],
        ["buildingCoverageRatio", json.buildingCoverageRatio],
        ["floorAreaRatio", json.floorAreaRatio],
      ] as const;
      const foundCount = fields.filter(([, v]) => v != null).length;

      if (foundCount === 0) {
        setZoningVisionStatus({ ok: false, message: "AI沒有從這張截圖抓到任何分區資料，請改用手動輸入。" });
        return;
      }

      setZoningVisionStatus({
        ok: true,
        message: `辨識完成，抓到 ${foundCount} 項分區資料，請往下核對填入的欄位。（今日已用 ${json.usedToday}/${json.dailyLimit} 次）`,
      });
      setData((d) => ({
        ...d,
        useZone: json.useZone ?? d.useZone,
        useCategory: json.useCategory ?? d.useCategory,
        buildingCoverageRatio: json.buildingCoverageRatio ?? d.buildingCoverageRatio,
        floorAreaRatio: json.floorAreaRatio ?? d.floorAreaRatio,
      }));
    } catch {
      setZoningVisionStatus({ ok: false, message: "辨識過程發生錯誤，請改用手動輸入。" });
    } finally {
      setZoningVisionBusy(false);
    }
  }

  async function handleFindNearby() {
    const addr = isLand ? data.landLocation : data.address;
    if (!addr) return;
    setNearbyBusy(true);
    try {
      const res = await fetch(`/api/nearby?address=${encodeURIComponent(addr)}`);
      const json = (await res.json()) as NearbyResponse;
      setNearbyResults(json);
    } finally {
      setNearbyBusy(false);
    }
  }

  async function handleGeoLookup() {
    const addr = isLand ? data.landLocation : data.address;
    if (!addr) return;
    setGeoLookupBusy(true);
    setGeoLookupStatus(null);
    try {
      const res = await fetch(`/api/geo-lookup?address=${encodeURIComponent(addr)}`);
      const json = await res.json();
      if (!res.ok) {
        setGeoLookupStatus({ ok: false, message: json.error || `查詢失敗（伺服器回傳 ${res.status}）。` });
        return;
      }

      const approxNote = (a: boolean) => (a ? "（定位點在最近的資料範圍附近，非精確落點，務必核對）" : "");
      const foundParts: string[] = [];

      if (json.zoning) {
        set("useZone", json.zoning.useZone);
        set("buildingCoverageRatio", json.zoning.buildingCoverageRatio);
        set("floorAreaRatio", json.zoning.floorAreaRatio);
        foundParts.push(`使用分區${approxNote(json.zoning.approx)}`);
      }
      if (json.reclamation) {
        const r = json.reclamation;
        set(
          "reclamationZoneNote",
          `${r.town}${r.name}：${r.nature}（${r.progress}）${approxNote(r.approx)}（資料來源：自製在地地圖，僅供參考）`
        );
        foundParts.push("重劃區");
      } else {
        set("reclamationZoneNote", "查詢範圍內無重劃區資料");
      }

      setGeoLookupStatus(
        foundParts.length > 0
          ? { ok: true, message: `查到：${foundParts.join("、")}，請往下核對填入的欄位。` }
          : { ok: false, message: "這個地址在使用分區跟重劃區資料裡都查無結果，請改用手動輸入。" }
      );
    } catch {
      setGeoLookupStatus({ ok: false, message: "查詢過程發生錯誤，請改用手動輸入。" });
    } finally {
      setGeoLookupBusy(false);
    }
  }

  async function handleFindFloodRisk() {
    const addr = isLand ? data.landLocation : data.address;
    if (!addr) return;
    setFloodBusy(true);
    try {
      const res = await fetch(`/api/flood-risk?address=${encodeURIComponent(addr)}`);
      const json = (await res.json()) as FloodResponse;
      setFloodResult(json);
      if (json.result) {
        const hits = json.result.scenarios.filter((s) => s.depthRange);
        const summary =
          hits.length > 0
            ? hits.map((s) => `${s.label}：淹水深度${s.depthRange}公尺`).join("；")
            : "查詢範圍內10種降雨情境皆無淹水潛勢資料";
        set("floodRiskNote", `${summary}（資料來源：NCDR災害潛勢地圖，僅供參考，正式資料請洽相關機關）`);
      }
    } finally {
      setFloodBusy(false);
    }
  }

  async function handleGenerateFeatures() {
    setFeaturesBusy(true);
    try {
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, caseType }),
      });
      const json = await res.json();
      set("features", json.text || "");
      setFeaturesSource(json.source);
    } finally {
      setFeaturesBusy(false);
    }
  }

  const mainPlusAncillary = mainPlusAncillaryPing(data);

  const deedHint = isLandCase(caseType)
    ? "可上傳土地登記謄本，自動抓地坪（草稿，務必核對）。"
    : isPresale
    ? "預售屋沒有建物謄本，只有土地謄本——上傳土地謄本可抓地坪，主建物/附屬建物/公設請從合約手動填。"
    : "可上傳土地+建物登記謄本，自動抓坪數（草稿，務必核對）。";

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 20px" }}>
      <style>{`
        input::placeholder, textarea::placeholder { color: ${muted}; opacity: 1; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <h1 className="no-print" style={{ fontSize: 24, fontWeight: 600, fontFamily: headingFont, color: ink, marginBottom: 6 }}>
        謄本填表工具
      </h1>
      <p className="no-print" style={{ fontSize: 14, color: muted, fontFamily: bodyFont, lineHeight: 1.6, marginBottom: 24 }}>
        選案件類型 → 上傳謄本抓數字（草稿，務必核對）→ 手動調整/補齊 → 查附近設施 → 產生物件特色 → 右側預覽列印。
      </p>

      <div className="no-print" style={{ ...card, marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 600, fontFamily: headingFont, color: ink }}>案件類型</span>
        {CASE_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setCaseType(t)}
            style={t === caseType ? { ...buttonPrimary, height: 40, padding: "0 18px", fontSize: 14 } : { ...buttonSecondary, height: 40, padding: "0 18px", fontSize: 14 }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 謄本上傳 */}
          <div style={card}>
            <h2 style={sectionTitle}>謄本上傳（自動辨識，僅供草稿）</h2>
            <p style={{ fontSize: 12, color: muted, marginBottom: 8 }}>{deedHint}</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files?.[0] && handleDeedUpload(e.target.files[0])}
            />
            {deedBusy && <p style={{ fontSize: 13, color: muted }}>辨識中…</p>}
            {deedStatus && (
              <p style={{ fontSize: 13, color: deedStatus.ok ? "#166534" : "#b45309", marginTop: 6 }}>
                {deedStatus.ok ? "✓ " : "⚠ "}
                {deedStatus.message}
              </p>
            )}
            {deedRaw && (
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 13, color: muted, cursor: "pointer" }}>
                  查看謄本原始文字（核對用）
                </summary>
                <pre
                  style={{
                    fontSize: 12,
                    fontFamily: bodyFont,
                    color: ink,
                    whiteSpace: "pre-wrap",
                    maxHeight: 200,
                    overflow: "auto",
                    background: bg,
                    border: `1px solid ${border}`,
                    padding: 12,
                    borderRadius: 14,
                  }}
                >
                  {deedRaw}
                </pre>
              </details>
            )}
          </div>

          {/* 謄本截圖辨識（AI） */}
          <div style={card}>
            <h2 style={sectionTitle}>謄本AI辨識（截圖或PDF皆可，僅供草稿）</h2>
            <p style={{ fontSize: 12, color: muted, marginBottom: 8 }}>
              適合上面「謄本上傳」抓不到字的情況（例如PDF文字層讀不到、只抓得到浮水印文字）。
              土地謄本、建物謄本、他項權利部常常是分開的文件，可以先把每一份都加進來（最多{MAX_DEED_VISION_FILES}張），
              全部加完之後再按「送出辨識」，這樣AI只會合併判讀一次，不會每加一張就用掉一次額度。
              會一併讀出「建物門牌／土地坐落」自動填入地址（下面依地址查詢的按鈕就會一起打開），也會讀他項權利部的抵押設定金額跟權利人。
              需要在伺服器設定 GEMINI_API_KEY 才能使用，且每日有全站共用次數上限。
            </p>
            <div
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDeedVisionDragOver(true);
              }}
              onDragLeave={() => setDeedVisionDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDeedVisionDragOver(false);
                addDeedVisionFiles(Array.from(e.dataTransfer.files || []));
              }}
              onPaste={(e) => {
                const items = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith("image/"));
                const files = items.map((i) => i.getAsFile()).filter((f): f is File => f !== null);
                addDeedVisionFiles(files);
              }}
              style={{
                border: `2px dashed ${deedVisionDragOver ? primary : border}`,
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
                background: deedVisionDragOver ? surface : bg,
                outline: "none",
              }}
            >
              <p style={{ fontSize: 13, color: muted, marginBottom: 8 }}>
                把截圖拖曳到這裡（可一次拖多張、也可以分好幾次拖）、或點這裡後按 Ctrl+V 貼上剪貼簿截圖，也可以直接選檔案（可複選）
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  addDeedVisionFiles(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
            </div>

            {deedVisionStagedFiles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {deedVisionStagedFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    style={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: `1px solid ${border}`,
                      background: bg,
                    }}
                  >
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={deedVisionPreviewUrls[i]}
                        alt={file.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          color: muted,
                          padding: 4,
                          textAlign: "center",
                          wordBreak: "break-all",
                        }}
                      >
                        {file.name}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDeedVisionFile(i)}
                      aria-label="移除"
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        color: "#fff",
                        fontSize: 11,
                        lineHeight: "18px",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={submitDeedVisionRecognition}
                disabled={deedVisionBusy || deedVisionStagedFiles.length === 0}
                style={{
                  ...buttonSecondary,
                  opacity: deedVisionBusy || deedVisionStagedFiles.length === 0 ? 0.5 : 1,
                }}
              >
                {deedVisionBusy ? "AI辨識中…" : `送出辨識（${deedVisionStagedFiles.length}張）`}
              </button>
              {deedVisionStagedFiles.length > 0 && !deedVisionBusy && (
                <button type="button" onClick={() => setDeedVisionStagedFiles([])} style={buttonSecondary}>
                  清空重選
                </button>
              )}
            </div>

            {deedVisionStatus && (
              <p style={{ fontSize: 13, color: deedVisionStatus.ok ? "#166534" : "#b45309", marginTop: 6 }}>
                {deedVisionStatus.ok ? "✓ " : "⚠ "}
                {deedVisionStatus.message}
              </p>
            )}
          </div>

          {/* 基本資料 */}
          <div style={card}>
            <h2 style={sectionTitle}>基本資料</h2>
            <div style={row}>
              <div>
                <span style={label}>案名</span>
                <input style={input} value={data.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              {isHouse && (
                <div>
                  <span style={label}>透天類別</span>
                  <select
                    style={input}
                    value={data.terraceType}
                    onChange={(e) => set("terraceType", e.target.value as ListingData["terraceType"])}
                  >
                    <option value="">（無）</option>
                    <option value="中庭">中庭</option>
                    <option value="獨門獨院">獨門獨院</option>
                  </select>
                </div>
              )}
            </div>

            {isHouse ? (
              <div style={{ marginBottom: 12 }}>
                <span style={label}>地址</span>
                <input style={input} value={data.address} onChange={(e) => set("address", e.target.value)} />
              </div>
            ) : (
              <div style={row}>
                <div>
                  <span style={label}>土地坐落</span>
                  <input
                    style={input}
                    value={data.landLocation}
                    onChange={(e) => set("landLocation", e.target.value)}
                  />
                </div>
                <div>
                  <span style={label}>相關位置</span>
                  <input
                    style={input}
                    value={data.relatedLocation}
                    onChange={(e) => set("relatedLocation", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={row}>
              <div>
                <span style={label}>委託價（萬）</span>
                <input
                  style={input}
                  type="number"
                  value={data.askingPriceWan ?? ""}
                  onChange={(e) => set("askingPriceWan", e.target.value === "" ? null : parseFloat(e.target.value))}
                />
              </div>
              <div>
                <span style={label}>抵押設定（萬）</span>
                <input
                  style={input}
                  type="number"
                  value={data.mortgageWan ?? ""}
                  onChange={(e) => set("mortgageWan", e.target.value === "" ? null : parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={label}>權利人（銀行）</span>
              <input style={input} value={data.mortgagee} onChange={(e) => set("mortgagee", e.target.value)} />
            </div>

            {isLand && (
              <div style={row}>
                <div>
                  <span style={label}>委託單價（萬/坪）</span>
                  <input
                    style={input}
                    type="number"
                    value={data.unitPriceWanPerPing ?? ""}
                    onChange={(e) =>
                      set("unitPriceWanPerPing", e.target.value === "" ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div>
                  <span style={label}>委託單價（萬/分）</span>
                  <input
                    style={input}
                    type="number"
                    value={data.unitPriceWanPerFen ?? ""}
                    onChange={(e) =>
                      set("unitPriceWanPerFen", e.target.value === "" ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* 面積 */}
          <div style={card}>
            <h2 style={sectionTitle}>{isLand ? "土地面積" : "面積換算（輸入平方公尺自動算坪數）"}</h2>

            {isHouse && (
              <>
                <div style={row}>
                  {isPresale ? (
                    <div>
                      <span style={label}>登記地坪（土地總面積 × 持分比例，建物未登記前無法直接查坪數）</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          style={input}
                          type="number"
                          placeholder="土地總面積㎡"
                          value={data.landArea.sqm ?? ""}
                          onChange={(e) => {
                            const sqm = e.target.value === "" ? null : parseFloat(e.target.value);
                            setData((d) => ({
                              ...d,
                              landArea: { sqm, ping: presaleLandPing(sqm, d.landSharePercent) },
                            }));
                          }}
                        />
                        <span style={{ fontSize: 12, color: muted }}>㎡ ×</span>
                        <input
                          style={input}
                          type="number"
                          placeholder="持分比例"
                          value={data.landSharePercent ?? ""}
                          onChange={(e) => {
                            const pct = e.target.value === "" ? null : parseFloat(e.target.value);
                            setData((d) => ({
                              ...d,
                              landSharePercent: pct,
                              landArea: { ...d.landArea, ping: presaleLandPing(d.landArea.sqm, pct) },
                            }));
                          }}
                        />
                        <span style={{ fontSize: 12, color: muted }}>% =</span>
                        <input style={input} readOnly value={data.landArea.ping ?? ""} />
                        <span style={{ fontSize: 12, color: muted }}>坪</span>
                      </div>
                    </div>
                  ) : (
                    <AreaInput label="登記地坪" value={data.landArea} onChange={(v) => set("landArea", v)} />
                  )}
                  <AreaInput label="登記建坪" value={data.buildingArea} onChange={(v) => set("buildingArea", v)} />
                </div>
                <div style={row}>
                  <AreaInput label="主建物" value={data.mainArea} onChange={(v) => set("mainArea", v)} />
                  <AreaInput label="附屬建物" value={data.ancillaryArea} onChange={(v) => set("ancillaryArea", v)} />
                </div>
                <div style={row}>
                  <AreaInput label="公設" value={data.publicArea} onChange={(v) => set("publicArea", v)} />
                  <AreaInput label="車位坪數" value={data.parkingArea} onChange={(v) => set("parkingArea", v)} />
                </div>
                {isPresale && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={label}>建設公司</span>
                    <input
                      style={input}
                      value={data.constructionCompany}
                      onChange={(e) => set("constructionCompany", e.target.value)}
                    />
                  </div>
                )}
                <div style={{ fontSize: 13, color: muted }}>主建物+附屬建物：{mainPlusAncillary ?? "—"} 坪</div>
              </>
            )}

            {isLand && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <AreaInput label="面積" value={data.landOnlyArea} onChange={(v) => set("landOnlyArea", v)} />
                </div>
                <div style={row}>
                  <div>
                    <span style={label}>面寬（米）</span>
                    <input
                      style={input}
                      value={data.frontageWidth}
                      onChange={(e) => set("frontageWidth", e.target.value)}
                    />
                  </div>
                  <div>
                    <span style={label}>深度（米）</span>
                    <input style={input} value={data.landDepth} onChange={(e) => set("landDepth", e.target.value)} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 土地使用分區資訊：房屋、土地案件都適用 */}
          <div style={card}>
            <h2 style={sectionTitle}>土地使用分區資訊</h2>
            <button
              type="button"
              onClick={handleGeoLookup}
              disabled={geoLookupBusy || missingAddress}
              style={{ ...buttonSecondary, width: "100%", marginBottom: 8 }}
            >
              {geoLookupBusy ? "查詢中…" : "依地址自動查詢使用分區／重劃區（在地地圖資料）"}
            </button>
            {missingAddress && (
              <p style={{ fontSize: 12, color: "#b45309", marginBottom: 12 }}>
                ⚠ 請先在上面「基本資料」填寫{isLand ? "土地坐落" : "地址"}，按鈕才會啟用
              </p>
            )}
            {geoLookupStatus && (
              <p style={{ fontSize: 13, color: geoLookupStatus.ok ? "#166534" : "#b45309", marginBottom: 12 }}>
                {geoLookupStatus.ok ? "✓ " : "⚠ "}
                {geoLookupStatus.message}
              </p>
            )}
            <div style={{ marginBottom: 12 }}>
              <span style={label}>土地種類</span>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ fontSize: 14, fontFamily: bodyFont, color: ink, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="radio"
                    checked={data.landType === "都市計畫區"}
                    onChange={() => set("landType", "都市計畫區")}
                  />
                  都市計畫區
                </label>
                <label style={{ fontSize: 14, fontFamily: bodyFont, color: ink, display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="radio"
                    checked={data.landType === "非都市計畫區"}
                    onChange={() => set("landType", "非都市計畫區")}
                  />
                  非都市計畫區
                </label>
              </div>
            </div>
            <div style={row}>
              <div>
                <span style={label}>使用分區（土地分區）</span>
                <input style={input} value={data.useZone} onChange={(e) => set("useZone", e.target.value)} />
              </div>
              <div>
                <span style={label}>使用地類別</span>
                <input style={input} value={data.useCategory} onChange={(e) => set("useCategory", e.target.value)} />
              </div>
            </div>
            <div style={row}>
              <div>
                <span style={label}>建蔽率</span>
                <input
                  style={input}
                  value={data.buildingCoverageRatio}
                  onChange={(e) => set("buildingCoverageRatio", e.target.value)}
                />
              </div>
              <div>
                <span style={label}>容積率</span>
                <input
                  style={input}
                  value={data.floorAreaRatio}
                  onChange={(e) => set("floorAreaRatio", e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={label}>公告現值（元/m²）</span>
              <input
                style={input}
                type="number"
                value={data.publicAnnouncedValue ?? ""}
                onChange={(e) =>
                  set("publicAnnouncedValue", e.target.value === "" ? null : parseFloat(e.target.value))
                }
              />
            </div>

            <a
              href="https://up.tainan.gov.tw/UPBUD_sys/Areas/Map/map?type=upbm&ver=public"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: primary, fontFamily: bodyFont }}
            >
              開啟台南市都市計畫地理資訊查詢系統（手動核對使用分區用）→
            </a>
            <p style={{ fontSize: 11, color: muted, marginTop: 4, marginBottom: 12 }}>
              查詢結果僅供參考使用，確切資料請洽地政局查詢分區。
            </p>

            <div
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setZoningVisionDragOver(true);
              }}
              onDragLeave={() => setZoningVisionDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setZoningVisionDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleZoningImageUpload(file);
              }}
              onPaste={(e) => {
                const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
                const file = item?.getAsFile();
                if (file) handleZoningImageUpload(file);
              }}
              style={{
                border: `2px dashed ${zoningVisionDragOver ? primary : border}`,
                borderRadius: 14,
                padding: 16,
                textAlign: "center",
                background: zoningVisionDragOver ? surface : bg,
                outline: "none",
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 13, color: muted, marginBottom: 8 }}>
                查完分區後，把彈出視窗的截圖拖曳到這裡、或點這裡後按 Ctrl+V 貼上，AI會自動讀出分區資料（僅供草稿）
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleZoningImageUpload(e.target.files[0])}
              />
              {zoningVisionBusy && <p style={{ fontSize: 13, color: muted, marginTop: 6 }}>AI辨識中…</p>}
              {zoningVisionStatus && (
                <p style={{ fontSize: 13, color: zoningVisionStatus.ok ? "#166534" : "#b45309", marginTop: 6 }}>
                  {zoningVisionStatus.ok ? "✓ " : "⚠ "}
                  {zoningVisionStatus.message}
                </p>
              )}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, fontFamily: bodyFont, color: ink, margin: "0 0 8px" }}>
              重劃區
            </h3>
            <textarea
              style={{ ...input, height: "auto", minHeight: 80, padding: 16, marginBottom: 16 }}
              value={data.reclamationZoneNote}
              onChange={(e) => set("reclamationZoneNote", e.target.value)}
              placeholder="重劃區摘要（用上面「自動查詢使用分區／重劃區」按鈕帶入，可自行修改）"
            />

            <h3 style={{ fontSize: 16, fontWeight: 600, fontFamily: bodyFont, color: ink, margin: "0 0 8px" }}>
              淹水潛勢
            </h3>
            <button
              type="button"
              onClick={handleFindFloodRisk}
              disabled={floodBusy || missingAddress}
              style={{ ...buttonSecondary, width: "100%", marginBottom: 8 }}
            >
              {floodBusy ? "查詢中…" : "依地址查詢淹水潛勢（NCDR）"}
            </button>
            {missingAddress && (
              <p style={{ fontSize: 12, color: "#b45309", marginBottom: 8 }}>
                ⚠ 請先在上面「基本資料」填寫{isLand ? "土地坐落" : "地址"}，按鈕才會啟用
              </p>
            )}
            {floodResult && !floodResult.configured && (
              <p style={{ fontSize: 12, color: muted, marginBottom: 8 }}>
                尚未設定 GOOGLE_MAPS_API_KEY（需要先轉經緯度），請直接手動填寫下面欄位。
              </p>
            )}
            {floodResult?.result && (
              <div style={{ fontSize: 12, color: muted, marginBottom: 8, lineHeight: 1.8 }}>
                {floodResult.result.scenarios.map((s) => (
                  <div key={s.label}>
                    {s.label}：{s.depthRange ? `淹水深度 ${s.depthRange} 公尺` : "無資料"}
                  </div>
                ))}
              </div>
            )}
            <textarea
              style={{ ...input, height: "auto", minHeight: 120, padding: 16 }}
              value={data.floodRiskNote}
              onChange={(e) => set("floodRiskNote", e.target.value)}
              placeholder="淹水潛勢摘要（查詢後自動帶入，可自行修改）"
            />
          </div>

          {/* 房屋資訊 */}
          {isHouse && (
            <div style={card}>
              <h2 style={sectionTitle}>房屋資訊</h2>
              <div style={row}>
                <div>
                  <span style={label}>建築完成日</span>
                  <input
                    style={input}
                    placeholder="例：107年06月19日"
                    value={data.completionDate}
                    onChange={(e) => set("completionDate", e.target.value)}
                  />
                </div>
                {isHouseSale && (
                  <div>
                    <span style={label}>建物主要用途</span>
                    <input style={input} value={data.mainUse} onChange={(e) => set("mainUse", e.target.value)} />
                  </div>
                )}
              </div>
              <div style={row}>
                <div>
                  <span style={label}>格局（房/廳/衛）</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={input}
                      type="number"
                      placeholder="房"
                      value={data.layoutRooms ?? ""}
                      onChange={(e) => set("layoutRooms", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                    <input
                      style={input}
                      type="number"
                      placeholder="廳"
                      value={data.layoutLivingRooms ?? ""}
                      onChange={(e) =>
                        set("layoutLivingRooms", e.target.value === "" ? null : parseInt(e.target.value))
                      }
                    />
                    <input
                      style={input}
                      type="number"
                      placeholder="衛"
                      value={data.layoutBaths ?? ""}
                      onChange={(e) => set("layoutBaths", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <span style={label}>朝向</span>
                  <input style={input} value={data.orientation} onChange={(e) => set("orientation", e.target.value)} />
                </div>
              </div>
              <div style={row}>
                <div>
                  <span style={label}>樓層 / 總樓層</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={input}
                      type="number"
                      value={data.floor ?? ""}
                      onChange={(e) => set("floor", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                    <input
                      style={input}
                      type="number"
                      value={data.totalFloors ?? ""}
                      onChange={(e) => set("totalFloors", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <span style={label}>建材</span>
                  <input style={input} value={data.material} onChange={(e) => set("material", e.target.value)} />
                </div>
              </div>
              <div style={row}>
                <div>
                  <span style={label}>同層戶數 / 地下層數 / 電梯數 / 採光面</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={input}
                      type="number"
                      placeholder="同層"
                      value={data.unitsPerFloor ?? ""}
                      onChange={(e) => set("unitsPerFloor", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                    <input
                      style={input}
                      type="number"
                      placeholder="地下"
                      value={data.basementFloors ?? ""}
                      onChange={(e) =>
                        set("basementFloors", e.target.value === "" ? null : parseInt(e.target.value))
                      }
                    />
                    <input
                      style={input}
                      type="number"
                      placeholder="電梯"
                      value={data.elevators ?? ""}
                      onChange={(e) => set("elevators", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                    <input
                      style={input}
                      type="number"
                      placeholder="採光"
                      value={data.lightingFaces ?? ""}
                      onChange={(e) => set("lightingFaces", e.target.value === "" ? null : parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <span style={label}>&nbsp;</span>
                  {!isPresale && (
                    <label style={{ ...label, display: "block", marginBottom: 8 }}>
                      <input
                        type="checkbox"
                        checked={data.isCornerUnit}
                        onChange={(e) => set("isCornerUnit", e.target.checked)}
                        style={{ marginRight: 6 }}
                      />
                      邊間
                    </label>
                  )}
                  <label style={{ ...label, display: "block" }}>
                    <input
                      type="checkbox"
                      checked={data.hasSecurityGuard}
                      onChange={(e) => set("hasSecurityGuard", e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                    有警衛
                  </label>
                </div>
              </div>
              <div style={row}>
                <div>
                  <span style={label}>管理費</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={input}
                      type="number"
                      value={data.managementFee ?? ""}
                      onChange={(e) =>
                        set("managementFee", e.target.value === "" ? null : parseFloat(e.target.value))
                      }
                    />
                    <select
                      style={input}
                      value={data.managementFeeCycle}
                      onChange={(e) => set("managementFeeCycle", e.target.value as ListingData["managementFeeCycle"])}
                    >
                      <option>月繳</option>
                      <option>季繳</option>
                      <option>年繳</option>
                    </select>
                  </div>
                </div>
                {isHouseSale && (
                  <div>
                    <span style={label}>土地增值稅（自用 / 一般，需自行查估）</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        style={input}
                        type="number"
                        placeholder="自用"
                        value={data.taxSelfUse ?? ""}
                        onChange={(e) => set("taxSelfUse", e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                      <input
                        style={input}
                        type="number"
                        placeholder="一般"
                        value={data.taxGeneral ?? ""}
                        onChange={(e) => set("taxGeneral", e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isLandSale && (
            <div style={card}>
              <h2 style={sectionTitle}>稅務</h2>
              <span style={label}>增值稅（元，以稅捐處核發之稅單為準）</span>
              <input
                style={input}
                type="number"
                value={data.landValueIncrementTax ?? ""}
                onChange={(e) =>
                  set("landValueIncrementTax", e.target.value === "" ? null : parseFloat(e.target.value))
                }
              />
            </div>
          )}

          {/* 車位 */}
          {isHouse && (
            <div style={card}>
              <h2 style={sectionTitle}>車位</h2>
              <div style={row}>
                <div>
                  <span style={label}>停車方式（例：坡道式平面車位）</span>
                  <input style={input} value={data.parkingType} onChange={(e) => set("parkingType", e.target.value)} />
                </div>
                <div>
                  <span style={label}>編號</span>
                  <input
                    style={input}
                    value={data.parkingPosition}
                    onChange={(e) => set("parkingPosition", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <span style={label}>機車位</span>
                <input
                  style={input}
                  value={data.motorcycleParking}
                  onChange={(e) => set("motorcycleParking", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 周邊環境 */}
          <div style={card}>
            <h2 style={sectionTitle}>周邊環境</h2>
            <div style={row}>
              {isHouse && (
                <div>
                  <span style={label}>面寬（米）</span>
                  <input
                    style={input}
                    value={data.frontageWidth}
                    onChange={(e) => set("frontageWidth", e.target.value)}
                  />
                </div>
              )}
              <div>
                <span style={label}>臨路</span>
                <input style={input} value={data.roadWidth} onChange={(e) => set("roadWidth", e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleFindNearby}
              disabled={nearbyBusy || missingAddress}
              style={{ ...buttonSecondary, width: "100%", marginBottom: 12 }}
            >
              {nearbyBusy ? "查詢中…" : "依地址查詢附近設施（Google）"}
            </button>
            {missingAddress && (
              <p style={{ fontSize: 12, color: "#b45309", marginBottom: 12 }}>
                ⚠ 請先在上面「基本資料」填寫{isLand ? "土地坐落" : "地址"}，按鈕才會啟用
              </p>
            )}
            {nearbyResults && !nearbyResults.configured && (
              <p style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
                尚未設定 GOOGLE_MAPS_API_KEY，請直接手動填寫下面欄位。
              </p>
            )}
            {nearbyResults?.results && (
              <div style={{ fontSize: 12, color: muted, marginBottom: 12 }}>
                {Object.entries(nearbyResults.results).map(([cat, places]) => (
                  <div key={cat}>
                    {cat}：
                    {places.slice(0, 3).map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          const map: Record<string, keyof ListingData> = {
                            school: "nearbySchool",
                            park: "nearbyPark",
                            bank: "nearbyBank",
                            market: "nearbyMarket",
                          };
                          set(map[cat], p.name as never);
                        }}
                        style={{ marginRight: 6, border: "none", background: "none", color: primary, fontFamily: bodyFont, cursor: "pointer" }}
                      >
                        {p.name}（{p.distanceMeters}m）
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div style={row}>
              <div>
                <span style={label}>鄰近市場</span>
                <input style={input} value={data.nearbyMarket} onChange={(e) => set("nearbyMarket", e.target.value)} />
              </div>
              <div>
                <span style={label}>鄰近學校</span>
                <input style={input} value={data.nearbySchool} onChange={(e) => set("nearbySchool", e.target.value)} />
              </div>
            </div>
            <div style={row}>
              <div>
                <span style={label}>公園綠地</span>
                <input style={input} value={data.nearbyPark} onChange={(e) => set("nearbyPark", e.target.value)} />
              </div>
              <div>
                <span style={label}>金融機構</span>
                <input style={input} value={data.nearbyBank} onChange={(e) => set("nearbyBank", e.target.value)} />
              </div>
            </div>
          </div>

          {/* 物件特性 */}
          <div style={card}>
            <h2 style={sectionTitle}>物件特性</h2>
            <button
              type="button"
              onClick={handleGenerateFeatures}
              disabled={featuresBusy}
              style={{ ...buttonSecondary, width: "100%", marginBottom: 8 }}
            >
              {featuresBusy ? "產生中…" : "產生建議文案（可再自行修改）"}
            </button>
            {featuresSource && (
              <p style={{ fontSize: 12, color: muted, marginTop: -4, marginBottom: 8 }}>
                來源：{featuresSource === "claude" ? "AI（Claude）" : "規則制（沒設定 API 金鑰時的預設）"}
              </p>
            )}
            <textarea
              style={{ ...input, height: "auto", minHeight: 120, padding: 16 }}
              value={data.features}
              onChange={(e) => set("features", e.target.value)}
            />
          </div>

          {/* 注意事項與經紀人 */}
          <div style={card}>
            <h2 style={sectionTitle}>注意事項 / 經紀人</h2>
            <div style={{ marginBottom: 12 }}>
              <span style={label}>注意事項</span>
              <textarea
                style={{ ...input, height: "auto", minHeight: 120, padding: 16 }}
                value={data.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
            <div style={row}>
              <div>
                <span style={label}>經紀人</span>
                <input style={input} value={data.agentName} onChange={(e) => set("agentName", e.target.value)} />
              </div>
              <div>
                <span style={label}>證號</span>
                <input
                  style={input}
                  value={data.agentLicense}
                  onChange={(e) => set("agentLicense", e.target.value)}
                />
              </div>
            </div>
            <div>
              <span style={label}>承辦人行動電話</span>
              <input style={input} value={data.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} />
            </div>
          </div>
        </div>

        {/* 預覽 */}
        <div>
          <div className="no-print" style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ ...buttonPrimary, width: "100%" }}
            >
              列印 / 另存 PDF
            </button>
          </div>
          {isHouse ? (
            <HousePreview data={data} caseType={caseType} mainPlusAncillary={mainPlusAncillary} />
          ) : (
            <LandPreview data={data} caseType={caseType} />
          )}
        </div>
      </div>
    </div>
  );
}

