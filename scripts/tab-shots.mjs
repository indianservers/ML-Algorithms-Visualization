// Temporary diagnostic: screenshot each tab of a lesson page.
//
//   node scripts/tab-shots.mjs /ml/deep-learning/perceptron .shots/tabs

import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const route = process.argv[2];
const outDir = process.argv[3] ?? ".shots/tabs";
const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console]", m.text());
});
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("ml-suite-theme-v3", "dark");
});
await page.goto(base + route, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const slug = route.replace(/\W+/g, "-").replace(/^-|-$/g, "");
const tabs = page.locator("[role='tab']");
const count = await tabs.count();
console.log(`${route}: ${count} tabs`);
for (let i = 0; i < count; i++) {
  const label = (await tabs.nth(i).textContent()).trim();
  await tabs.nth(i).click();
  await page.waitForTimeout(400);
  const file = `${outDir}/${slug}-${i}-${label.replace(/\W+/g, "")}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("  " + file);
}

await browser.close();
