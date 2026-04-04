// scripts/scrape.js
// ดึงราคาขายทองคำแท่ง 96.5% = 72,200.00 จากหน้าเว็บ
// เขียน goldprice.json เมื่อสำเร็จ และ status.json ทุกครั้ง

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const OUT_JSON = path.join(process.cwd(), "goldprice.json");
const STATUS_JSON = path.join(process.cwd(), "status.json");
const URL = "https://xn--42cah7d0cxcvbbb9x.com/";

function cleanText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

async function main() {
  const ts = new Date().toISOString();
  const status = { ok: false, ts, source: URL, message: "" };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(URL, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0",
        "accept-language": "th-TH,th;q=0.9,en;q=0.8"
      }
    });

    clearTimeout(timeout);

    if (!res.ok) {
      status.message = `Upstream HTTP ${res.status}`;
      await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
      console.log(status.message);
      process.exit(0);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let barSell = "";

    // วิธีที่ 1: ตารางสรุปด้านบนสุด
    $("div.divgta.goldshopf table tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length >= 3) {
        const label = cleanText($(tds[0]).text());
        const sell = cleanText($(tds[2]).text());

        if (label.includes("ทองคำแท่ง")) {
          barSell = sell;
          return false;
        }
      }
    });

    // วิธีที่ 2: ตาราง flip สำรอง
    if (!barSell) {
      $("table.flip tbody tr").each((_, tr) => {
        const sell = cleanText($(tr).find('td[data-column="ทองคำแท่งขายออก"]').text());
        if (sell) {
          barSell = sell;
          return false;
        }
      });
    }

    // วิธีที่ 3: dailytable สำรองอีกชั้น
    if (!barSell) {
      $("table.dailytable tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length >= 3) {
          const label = cleanText($(tds[0]).text());
          const sell = cleanText($(tds[1]).text());

          if (label.includes("ทองคำแท่ง")) {
            barSell = sell;
            return false;
          }
        }
      });
    }

    if (!barSell || !/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(barSell)) {
      status.message = "Parse fail: not found gold bar sell price";
      await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
      console.log(status.message);
      process.exit(0);
    }

    const out = {
      ok: true,
      ts,
      source: "xn--42cah7d0cxcvbbb9x.com",
      jewelry_sell_n9: barSell
    };

    await fs.promises.writeFile(OUT_JSON, JSON.stringify(out, null, 2));

    status.ok = true;
    status.message = "ok";
    await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));

    console.log("Wrote goldprice.json", out);
  } catch (err) {
    status.message = "Error: " + (err && err.message ? err.message : String(err));
    await fs.promises.writeFile(STATUS_JSON, JSON.stringify(status, null, 2));
    console.log(status.message);
  }
}

main();
