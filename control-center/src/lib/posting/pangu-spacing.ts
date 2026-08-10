const CJK = /[一-鿿㐀-䶿]/;
const ANS = /[A-Za-z0-9]/;

const isCJK = (ch: string) => CJK.test(ch);
const isANS = (ch: string) => ANS.test(ch);

export type TokenKind = "char" | "pangu" | "zwsp";

export type Token = {
  ch: string;
  inserted: boolean;
  kind: TokenKind;
};

export type SpacingOptions = {
  pangu: boolean;
  blankLine: boolean;
};

function tokenizeLine(line: string, panguOn: boolean): Token[] {
  if (!panguOn) {
    return [...line].map((ch) => ({ ch, inserted: false, kind: "char" as const }));
  }

  const out: Token[] = [];
  let lastReal: string | null = null;

  for (const ch of line) {
    if (
      lastReal !== null &&
      ((isCJK(lastReal) && isANS(ch)) || (isANS(lastReal) && isCJK(ch)))
    ) {
      out.push({ ch: " ", inserted: true, kind: "pangu" });
    }
    out.push({ ch, inserted: false, kind: "char" });
    lastReal = ch;
  }

  return out;
}

/** 每一行是一個 Token 陣列；空白行視 blankLine 選項換成一個零寬度空白 token。 */
export function computeLines(text: string, opts: SpacingOptions): Token[][] {
  return text.split("\n").map((line) => {
    if (line.trim() === "") {
      return opts.blankLine
        ? [{ ch: "​", inserted: true, kind: "zwsp" as const }]
        : [...line].map((ch) => ({ ch, inserted: false, kind: "char" as const }));
    }
    return tokenizeLine(line, opts.pangu);
  });
}

export type SpacingResult = {
  /** 實際要拿去貼上發文的純文字（含真正的零寬度空白字元） */
  plainText: string;
  lines: Token[][];
  spaceCount: number;
  zwspCount: number;
};

export function applySpacing(text: string, opts: SpacingOptions): SpacingResult {
  const lines = computeLines(text, opts);
  let spaceCount = 0;
  let zwspCount = 0;

  for (const tokens of lines) {
    for (const t of tokens) {
      if (t.inserted && t.kind === "pangu") spaceCount++;
      if (t.inserted && t.kind === "zwsp") zwspCount++;
    }
  }

  const plainText = lines.map((tokens) => tokens.map((t) => t.ch).join("")).join("\n");

  return { plainText, lines, spaceCount, zwspCount };
}
