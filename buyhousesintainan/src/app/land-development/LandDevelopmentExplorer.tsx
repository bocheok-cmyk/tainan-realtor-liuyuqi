"use client";

import { useMemo, useState } from "react";
import type { LandDevelopmentEra, LandDevelopmentStatus, LandDevelopmentZone } from "@/data/land-development";
import styles from "./land-development.module.css";

const STATUS_LABEL: Record<LandDevelopmentStatus, string> = {
  done: "已完成",
  wip: "辦理中",
  planning: "規劃中",
};

const TONE_CLASS: Record<string, string> = {
  "old-city": styles.toneOldCity,
  "old-county": styles.toneOldCounty,
  unified: styles.toneUnified,
  "z-done": styles.toneDone,
  "z-wip": styles.toneWip,
  "z-planning": styles.tonePlanning,
};

function matches(zone: LandDevelopmentZone, statusFilter: string, query: string, district: string) {
  const matchesStatus = statusFilter === "all" || zone.status === statusFilter;
  const matchesQuery = !query || (zone.name + (zone.nickname ?? "")).includes(query);
  const matchesDistrict = !district || zone.district.includes(district);
  return matchesStatus && matchesQuery && matchesDistrict;
}

function ZoneTable({ zones }: { zones: LandDevelopmentZone[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>名稱</th>
            <th>行政區</th>
            <th>時間</th>
            <th style={{ textAlign: "right" }}>面積（公頃）</th>
            <th>狀態</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.name}>
              <td className={styles.tdName}>{z.name}</td>
              <td className={styles.tdDistrict}>
                {z.district === "TBD" ? <span className={styles.tbd}>待查</span> : z.district}
              </td>
              <td>{z.period}</td>
              <td className={styles.tdArea}>{z.areaHectares ?? "—"}</td>
              <td>
                <span className={`${styles.pill} ${styles["pill" + capitalize(z.status)]}`}>
                  {STATUS_LABEL[z.status]}
                </span>
              </td>
              <td className={styles.tdRemark}>{z.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ZoneCards({ zones }: { zones: LandDevelopmentZone[] }) {
  return (
    <div className={styles.zoneGrid}>
      {zones.map((z) => (
        <article key={z.name} className={styles.zoneCard}>
          <div className={styles.zoneCardHead}>
            <h4>{z.name}</h4>
            <div className={styles.zoneCardMeta}>
              <span className={`${styles.pill} ${styles["pill" + capitalize(z.status)]}`}>
                {STATUS_LABEL[z.status]}
              </span>
              {z.areaHectares && z.areaHectares !== "—" && <span>{z.areaHectares} 公頃</span>}
              <span>{z.period}</span>
            </div>
          </div>
          <div className={styles.zoneCardSub}>
            <b>{z.district}</b>
            {z.nickname ? ` · ${z.nickname}` : ""}
          </div>
          {z.range && <p className={styles.zoneRange}>{z.range}</p>}
          {z.note && (
            <p className={styles.zoneRange} style={{ marginTop: z.range ? 6 : 0, color: "var(--ink-faint)", fontSize: 12.5 }}>
              ＊ {z.note}
            </p>
          )}
          {z.sourceUrl && (
            <p className={styles.sourceLink}>
              <a href={z.sourceUrl} target="_blank" rel="noopener">
                查看地政局原始公告 →
              </a>
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export function LandDevelopmentExplorer({
  market,
  zone,
}: {
  market: LandDevelopmentEra[];
  zone: LandDevelopmentEra[];
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");

  const allEras = [...market, ...zone];
  const allZones = allEras.flatMap((e) => e.zones);

  const counts = useMemo(
    () => ({
      all: allZones.length,
      done: allZones.filter((z) => z.status === "done").length,
      wip: allZones.filter((z) => z.status === "wip").length,
      planning: allZones.filter((z) => z.status === "planning").length,
    }),
    [allZones],
  );

  const districts = useMemo(
    () => [...new Set(allZones.map((z) => z.district).filter((d) => d && d !== "TBD"))].sort((a, b) => a.localeCompare(b, "zh-Hant")),
    [allZones],
  );

  function filteredEras(eras: LandDevelopmentEra[]) {
    return eras
      .map((era) => ({ ...era, zones: era.zones.filter((z) => matches(z, statusFilter, query, district)) }))
      .filter((era) => era.zones.length > 0);
  }

  const filteredMarket = filteredEras(market);
  const filteredZone = filteredEras(zone);
  const anyVisible = filteredMarket.length > 0 || filteredZone.length > 0;

  return (
    <>
      <div className={styles.stats} role="group" aria-label="依狀態篩選">
        <button
          className={`${styles.stat} ${styles.statAll} ${statusFilter === "all" ? styles.statActive : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className={styles.statN}>{counts.all}</span>
          <span className={styles.statL}>全部</span>
        </button>
        <button
          className={`${styles.stat} ${styles.statDone} ${statusFilter === "done" ? styles.statActive : ""}`}
          onClick={() => setStatusFilter("done")}
        >
          <span className={styles.statN}>{counts.done}</span>
          <span className={styles.statL}>已完成</span>
        </button>
        <button
          className={`${styles.stat} ${styles.statWip} ${statusFilter === "wip" ? styles.statActive : ""}`}
          onClick={() => setStatusFilter("wip")}
        >
          <span className={styles.statN}>{counts.wip}</span>
          <span className={styles.statL}>辦理中</span>
        </button>
        <button
          className={`${styles.stat} ${styles.statPlanning} ${statusFilter === "planning" ? styles.statActive : ""}`}
          onClick={() => setStatusFilter("planning")}
        >
          <span className={styles.statN}>{counts.planning}</span>
          <span className={styles.statL}>規劃中</span>
        </button>
      </div>

      <div className={styles.filters}>
        <input
          type="search"
          placeholder="搜尋名稱…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">所有行政區</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {!anyVisible && <p className={styles.noMatch}>沒有符合條件的項目。</p>}

      {filteredMarket.length > 0 && (
        <section className={styles.mechanism}>
          <div className={styles.mechanismHead}>
            <span className={styles.num}>一</span>
            <h2>公辦市地重劃</h2>
          </div>
          <p className={styles.mechanismNote}>
            地主保留土地所有權，政府重新整理地形、興建公共設施，地主按比例捐地作為費用負擔。共 52 案（原台南市
            17、原台南縣 6、合併後台南市 29）。
          </p>
          {filteredMarket.map((era) => (
            <div key={era.key} className={`${styles.era} ${TONE_CLASS[era.key] ?? ""}`}>
              <div className={styles.eraHead}>
                <span className={styles.mark}>{era.mark}</span>
                <h3>{era.title}</h3>
                <span className={styles.eraPeriod}>{era.period}</span>
              </div>
              {era.cards ? <ZoneCards zones={era.zones} /> : <ZoneTable zones={era.zones} />}
            </div>
          ))}
        </section>
      )}

      {filteredZone.length > 0 && (
        <section className={styles.mechanism}>
          <div className={styles.mechanismHead}>
            <span className={styles.num}>二</span>
            <h2>區段徵收</h2>
          </div>
          <p className={styles.mechanismNote}>
            政府先徵收全部私有土地，重新規劃後再配回原地主或公開標售。業界常俗稱「XX重劃區」，但法規上與市地重劃是不同機制。共
            20 案。
          </p>
          {filteredZone.map((era) => (
            <div key={era.key} className={`${styles.era} ${TONE_CLASS[era.key] ?? ""}`}>
              <div className={styles.eraHead}>
                <span className={styles.mark}>{era.mark}</span>
                <h3>{era.title}</h3>
                <span className={styles.eraPeriod}>{era.period}</span>
              </div>
              <ZoneCards zones={era.zones} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}
