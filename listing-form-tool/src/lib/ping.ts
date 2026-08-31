const SQM_PER_PING = 3.305785;

export function sqmToPing(sqm: number): number {
  return Math.round((sqm / SQM_PER_PING) * 100) / 100;
}

export function pingToSqm(ping: number): number {
  return Math.round(ping * SQM_PER_PING * 100) / 100;
}

/** 預售屋土地：土地總面積(㎡) × 持分比例(%) → 買方實際坪數 */
export function presaleLandPing(totalSqm: number | null, sharePercent: number | null): number | null {
  if (totalSqm === null || sharePercent === null) return null;
  return sqmToPing((totalSqm * sharePercent) / 100);
}
