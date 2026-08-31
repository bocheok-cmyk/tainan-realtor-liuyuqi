export type DeedGuess = {
  /** 每個欄位都只是「猜測」，前端要讓使用者核對後才能存檔 */
  landSqm: number | null;
  mainBuildingSqm: number | null;
  ancillaryBuildingSqm: number | null;
  publicSqm: number | null;
  rawText: string;
};

function firstNumber(re: RegExp, text: string): number | null {
  const m = text.match(re);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/[,*]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * 謄本「共有部分」欄位印出的是整棟公設建號的總坪數（例：37,953.34㎡），
 * 這戶實際分到的坪數要再乘上緊接在後面的「權利範圍：OO分之OO」持分比例才對。
 */
function guessPublicSqm(text: string): number | null {
  const totalSqm = firstNumber(/建號[:：]?([0-9.,*]+)平方公尺/, text);
  const shareMatch = text.match(/權利範圍[:：]?([0-9*]+)分之([0-9*]+)/);
  if (totalSqm == null || !shareMatch) return null;
  const denominator = parseFloat(shareMatch[1].replace(/\*/g, ""));
  const numerator = parseFloat(shareMatch[2].replace(/\*/g, ""));
  if (!denominator) return null;
  return totalSqm * (numerator / denominator);
}

/**
 * 這是「起手式」抓法，不是最終版：地政謄本格式因地政事務所、土地/建物謄本種類而不同，
 * 目前只用常見欄位名稱去猜測數字所在位置。準確度需要拿真實謄本樣本來校正，
 * 所以前端一定要把這些數字當「草稿」顯示，不能直接當正式資料存檔。
 */
export function guessDeedFields(rawText: string): DeedGuess {
  const text = rawText.replace(/\s+/g, "");

  return {
    landSqm: firstNumber(/土地面積[:：]?([0-9.,*]+)平方公尺/, text),
    mainBuildingSqm: firstNumber(/(?:層次面積|主建物[面積]*)[:：]?([0-9.,*]+)平方公尺/, text),
    ancillaryBuildingSqm: firstNumber(/附屬建物[^0-9]*?面積[:：]?([0-9.,*]+)平方公尺/, text),
    publicSqm: guessPublicSqm(text),
    rawText,
  };
}
