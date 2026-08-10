import { applySpacing } from "../src/lib/posting/pangu-spacing.ts";

const sample =
  "今天要跟大家分享一間位在台南東區的3房2廳物件，總價1580萬，屋齡15年。\n\n這間房子採光非常好，離捷運站走路5分鐘。\n\n有興趣的朋友歡迎line我預約看房！";

const result = applySpacing(sample, { pangu: true, blankLine: true });

console.log("plainText:\n" + result.plainText);
console.log("\nspaceCount:", result.spaceCount, "(expect 12)");
console.log("zwspCount:", result.zwspCount, "(expect 2)");

const expectedSnippets = ["3 房 2 廳", "1580 萬", "15 年", "line 我"];
for (const s of expectedSnippets) {
  const ok = result.plainText.includes(s);
  console.log(`${ok ? "PASS" : "FAIL"}: contains "${s}"`);
}
