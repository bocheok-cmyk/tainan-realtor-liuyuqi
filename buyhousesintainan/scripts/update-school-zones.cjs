// 更新台南市國中小學區資料。每年年底教育局公布新學年度學區一覽表時手動跑一次，
// 不建議做成排程自動覆蓋上線——PDF格式如果哪年改版，解析出錯的代價比人工確認一次高。
//
// 用法：
//   1. 去 https://www.tn.edu.tw/ 找當學年度的「新生入學期程/國中小學區一覽表」頁面
//      （網址每年學年度數字會變，不能沿用舊網址，要重新搜尋）
//   2. 把「國民小學學區一覽表」「國民中學學區一覽表」兩份PDF下載下來
//   3. node scripts/update-school-zones.cjs <小學PDF路徑> <小學最大編號> <國中PDF路徑> <國中最大編號> <學年度，例如115>
//   4. 腳本跑完會印出「可疑記錄」清單（校名太長或結尾格式不符），跟原始PDF人工核對這幾筆有沒有解析錯誤
//   5. 確認沒問題後，把新產出的 src/data/school-zones/elementary-<學年度>.json 跟
//      middle-<學年度>.json 換成 src/lib/school-zones.ts 引用的檔名（或改 school-zones.ts 的 import）
//
// 注意：這裡鎖定 pdf-parse@1.1.1（package.json 已固定版本），因為 pdf-parse 2.x 的文字擷取
// 换行/空格規則不一樣（中文字之間會插入空格、編號有時跟校名黏在同一行），沒有針對2.x重新驗證過
// 這份解析邏輯，升級 pdf-parse 前要先確認這個腳本還能正確跑。

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const TAINAN_DISTRICTS = [
  "東區", "南區", "北區", "中西區", "安南區", "安平區",
  "新營區", "鹽水區", "白河區", "柳營區", "後壁區", "東山區",
  "麻豆區", "下營區", "六甲區", "官田區", "大內區",
  "佳里區", "學甲區", "西港區", "七股區", "將軍區", "北門區",
  "新化區", "善化區", "新市區", "安定區", "山上區", "玉井區", "楠西區", "南化區", "左鎮區",
  "仁德區", "歸仁區", "關廟區", "龍崎區", "永康區",
];

const SCHOOL_SUFFIX = /(國小|國中|實小|分校|國中部|附小|附中|\(國小部\)|\(國中部\)|\(代用國中\)|國中小|高中)$/;

function parseSchoolZonePdfText(text, maxNo) {
  const rawLines = text.split("\n").map((l) => l.trim());

  // 每頁開頭都會重複出現「編號／區別／學校／名稱／基本學區(名稱) 共同學區(名稱)」表頭區塊，
  // 用區塊偵測（從「編號」開頭跳到「基本學區」那一行為止）取代逐字黑名單，
  // 避免誤殺資料裡真實出現的「區」「別」等單字（例如「七／股／區」這種行政區名稱拆行）。
  let started = false;
  const lines = [];
  for (let i = 0; i < rawLines.length; i++) {
    const l = rawLines[i];
    if (l === "") continue;
    if (/^編號/.test(l)) {
      started = true;
      while (i < rawLines.length && !/^基本學區/.test(rawLines[i])) i++;
      continue;
    }
    if (!started) continue;
    lines.push(l);
  }

  const records = [];
  let expectedNo = 1;
  for (let cursor = 0; cursor < lines.length; cursor++) {
    if (/^\d+$/.test(lines[cursor]) && parseInt(lines[cursor], 10) === expectedNo) {
      records.push({ no: expectedNo, startLine: cursor });
      expectedNo++;
    }
  }

  console.log(`偵測到 ${records.length} 筆編號記錄（預期 ${maxNo} 筆）`);

  const parsed = [];
  for (let i = 0; i < records.length; i++) {
    const start = records[i].startLine + 1;
    const end = i + 1 < records.length ? records[i + 1].startLine : lines.length;
    const block = lines.slice(start, end);

    let district = i > 0 ? parsed[i - 1].district : "";
    let idx = 0;
    {
      let probe = "";
      let matchedUpto = -1;
      for (let j = 0; j < Math.min(4, block.length); j++) {
        probe += block[j];
        if (TAINAN_DISTRICTS.includes(probe)) {
          matchedUpto = j;
          break;
        }
      }
      if (matchedUpto >= 0) {
        district = probe;
        idx = matchedUpto + 1;
      }
    }

    const nameChars = [];
    let nameEndIdx = idx;
    for (; nameEndIdx < block.length; nameEndIdx++) {
      nameChars.push(block[nameEndIdx]);
      const joined = nameChars.join("");
      if (SCHOOL_SUFFIX.test(joined) && joined.length >= 3) {
        nameEndIdx++;
        break;
      }
      if (nameChars.length >= 6) break;
    }
    const schoolName = nameChars.join("").replace(/\s+/g, "");

    const zoneRaw = block.slice(nameEndIdx).join("\n");

    parsed.push({ no: records[i].no, district, schoolName, zoneRaw });
  }

  const suspicious = parsed.filter((p) => (p.schoolName.length > 10 && !SCHOOL_SUFFIX.test(p.schoolName)) || !p.district);
  return { parsed, suspicious };
}

async function main() {
  const [, , elementaryPdfPath, elementaryMaxNo, middlePdfPath, middleMaxNo, schoolYear] = process.argv;
  if (!elementaryPdfPath || !elementaryMaxNo || !middlePdfPath || !middleMaxNo || !schoolYear) {
    console.error(
      "用法: node scripts/update-school-zones.cjs <小學PDF> <小學最大編號> <國中PDF> <國中最大編號> <學年度>"
    );
    process.exit(1);
  }

  const outDir = path.join(__dirname, "..", "src", "data", "school-zones");
  const sourceDir = path.join(outDir, "source-pdfs");
  fs.mkdirSync(sourceDir, { recursive: true });

  for (const [label, pdfPath, maxNo] of [
    ["elementary", elementaryPdfPath, parseInt(elementaryMaxNo, 10)],
    ["middle", middlePdfPath, parseInt(middleMaxNo, 10)],
  ]) {
    console.log(`\n=== ${label} ===`);
    const buffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(buffer);
    const { parsed, suspicious } = parseSchoolZonePdfText(data.text, maxNo);

    const outFile = path.join(outDir, `${label}-${schoolYear}.json`);
    fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2), "utf-8");
    console.log(`寫入 ${parsed.length} 筆到 ${outFile}`);

    fs.copyFileSync(pdfPath, path.join(sourceDir, `${label}-${schoolYear}.pdf`));

    console.log(`可疑記錄（務必人工核對這幾筆跟原始PDF）：${suspicious.length} 筆`);
    suspicious.forEach((p) => console.log(`  #${p.no} district="${p.district}" name="${p.schoolName}"`));
  }

  console.log(
    `\n完成。記得手動改 src/lib/school-zones.ts 裡的 import 檔名指向新的 ${schoolYear} 學年度檔案，並跟舊資料比對一下有沒有學校異動。`
  );
}

main();
