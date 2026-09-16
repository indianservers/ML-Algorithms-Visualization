// Screenshot one search surface with a query typed in.
//
//   node scripts/shoot-search.mjs <route> <inputSelector> <query> <out.png>

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [route, inputSelector, query, out] = process.argv.slice(2);
const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";

mkdirSync(out.replace(/[^/\\]+$/, ""), { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

await page.goto(base + route, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
if (process.env.PROBE_PRESS) {
  await page.keyboard.press(process.env.PROBE_PRESS);
  await page.waitForTimeout(400);
}
await page.fill(inputSelector, query);
await page.waitForTimeout(500);
await page.screenshot({ path: out, animations: "disabled" });

console.log(`saved ${out}`);
if (errors.length) console.log(errors.slice(0, 10).join("\n"));
await browser.close();
