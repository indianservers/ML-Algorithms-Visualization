// Audit every route for whether the suite top bar's "Home" link is actually
// reachable, i.e. rendered AND not painted over by a page's own fixed header.
//
//   node scripts/audit-topbar.mjs

import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const src = readFileSync("src/routes/router.tsx", "utf8");
const paths = [...src.matchAll(/path:\s*["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((p) => p !== "*" && !p.includes(":"))
  .map((p) => (p.startsWith("/") ? p : "/" + p));

const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("ml-suite-theme-v3", "dark");
});

const buckets = { OK: [], MISSING: [], COVERED: [] };

for (const route of paths) {
  await page.goto(base + route, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(550);
  const res = await page.evaluate(() => {
    const link = [...document.querySelectorAll("nav.lab-topbar a")].find(
      (a) => a.textContent.trim() === "Home",
    );
    if (!link) return { state: "MISSING", by: "" };
    const b = link.getBoundingClientRect();
    if (!b.width || !b.height) return { state: "MISSING", by: "zero-size" };
    const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
    if (hit === link || link.contains(hit)) return { state: "OK", by: "" };
    const cls = (hit?.className ?? "").toString().split(" ")[0];
    return { state: "COVERED", by: `${hit?.tagName}.${cls}` };
  });
  buckets[res.state].push(res.by ? `${route}  <- ${res.by}` : route);
}

for (const [k, list] of Object.entries(buckets)) {
  console.log(`\n=== ${k} (${list.length}) ===`);
  list.forEach((l) => console.log("  " + l));
}

await browser.close();
