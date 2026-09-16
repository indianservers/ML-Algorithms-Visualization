// Report console/page errors and any Vite overlay message for one route.
//
//   node scripts/page-errors.mjs /ml/preprocessing/scaling-normalization

import { chromium } from "@playwright/test";

const route = process.argv[2];
const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console]", m.text());
});
await page.addInitScript(() => {
  localStorage.clear();
  localStorage.setItem("ml-suite-theme-v3", "dark");
});
await page.goto(base + route, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const overlay = await page.evaluate(() => {
  const el = document.querySelector("vite-error-overlay");
  if (!el) return null;
  const root = el.shadowRoot;
  return {
    message: root?.querySelector(".message")?.textContent?.trim(),
    file: root?.querySelector(".file")?.textContent?.trim(),
    frame: root?.querySelector(".frame")?.textContent?.trim(),
  };
});
console.log("overlay:", overlay ? JSON.stringify(overlay, null, 2) : "none");

await browser.close();
