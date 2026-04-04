// scripts/scrape.js
// ดึงหน้า https://xn--42cah7d0cxcvbbb9x.com/ แล้วแยกค่า
// "ทองรูปพรรณ" ลำดับที่ N (=9) → ราคาขายออก (td ที่สองหลัง label)
// เขียน goldprice.json (ถ้าสำเร็จ) และเขียน status.json (เสมอ)

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const OUT_JSON = path.join(process.cwd(), "goldprice.json");
const STATUS_JSON = path.join(process.cwd(), "status.json");
const URL = "https://xn--42cah7d0cxcvbbb9x.com/";
const LABEL = "ทองรูปพรรณ";
const NTH = 9; // เปลี่ยนได้

// --- helpers แบบเดียวกับฝั่ง ESP32 ---
function findNth(s, needle, nth) {
  let pos = -1;
  for (let i = 0; i < nth; i++) {
    pos = s.indexOf(needle, pos + 1);
    if (pos < 0) return -1;
  }
  return pos;
}

function extractTdTextAt(html, tdStart) {
  if (tdStart < 0) return "";
  const gt = html.indexOf(">", tdStart);
  if (gt < 0) return "";
  const tdEnd = html.indexOf("</td>", gt + 1);
  if (tdEnd < 0) return "";
  let t = html.substring(gt + 1, tdEnd);
  t = t.replace(/<[^>]*>/g, ""); // ลบ tag ภายในถ้ามี
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function extractNthJewelrySell(html, nth) {
  const p = findNth(html, LABEL, nth);
  if (p < 0) return "";

  const labelTdClose = html.indexOf("</td>", p);
  if (labelTdClose < 0) return "";

  const tdBuyStart = html.indexOf("<td", labelTdClose);
  if (tdBuyStart < 0) return "";
  const tdBuyEnd = html.indexOf("</td>", tdBuyStart);
  if (tdBuyEnd < 0) return "";
  const tdSellStart = html.indexOf("<td", tdBuyEnd);
  if (tdSellStart < 0) return "";

  return extractTdTextAt(html, tdSellStart);
}

async function main() {
  const ts = new Date().toISOString();
  let status = { ok: false, ts, source: URL, message: "" };

  try {
    // Node 20+ มี fetch ในตัว
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      status.message = `Upstream HTTP ${res.status}`;
      await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
      console.log(status.message);
      process.exit(0);
    }

    const html = await res.text();

    // กันกรณี minified/ขาดบรรทัด → ใช้ regex ลบช่องว่างบางส่วน เพื่อให้ indexOf ทำงานได้กว้างขึ้น
    const compact = html.replace(/\r?\n|\r/g, " ").replace(/\s{2,}/g, " ");
    const sell = extractNthJewelrySell(compact, NTH);

    if (!sell || sell.length < 3) {
      status.message = "Parse fail: not found jewelry N=" + NTH;
      await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
      console.log(status.message);
      process.exit(0);
    }

    const out = {
      ok: true,
      ts,
      source: "xn--42cah7d0cxcvbbb9x.com",
      jewelry_sell_n9: sell
    };

    // เขียน goldprice.json (ทับเฉพาะตอนสำเร็จเท่านั้น)
    await fs.promises.writeFile(OUT_JSON, JSON.stringify(out, null, 2));
    status.ok = true;
    status.message = "ok";

    await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
    console.log("Wrote goldprice.json", out);
  } catch (err) {
    status.message = "Error: " + (err && err.message ? err.message : String(err));
    await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
    console.log(status.message);
    // ไม่เขียนทับ goldprice.json ถ้าล้มเหลว
  }
}

main();
