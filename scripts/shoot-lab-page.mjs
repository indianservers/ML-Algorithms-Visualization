// Screenshot an algorithm lab page at mockup dimensions so the redesign can be
// compared side by side with D:\ML_AI_Redesign_Checkpoint_74.
//
//   node scripts/shoot-lab-page.mjs <route> <out.png> [datasetValue]

import { chromium } from "@playwright/test";

const [route, out, datasetValue] = process.argv.slice(2);
if (!route || !out) {
  console.error(
    "usage: node scripts/shoot-lab-page.mjs <route> <out.png> [datasetValue]",
  );
  process.exit(1);
}

const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";
const width = Number(process.env.LAB_WIDTH ?? 1672) || 1672;

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({
  viewport: { width, height: 941 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(20000);

// Start from a clean slate: no stale dataset handoff, dark theme.
const theme = process.env.LAB_THEME === "light" ? "light" : "dark";
await page.addInitScript((t) => {
  localStorage.clear();
  localStorage.setItem("ml-suite-theme-v3", t);
}, theme);

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

if (datasetValue) {
  const select = page.locator("select").first();
  if (await select.count()) {
    await select.selectOption(datasetValue).catch(() => {});
    await page.waitForTimeout(600);
  }
}

// LAB_CLIP=1 keeps the real viewport so scroll containers behave as a learner
// sees them, instead of being grown away by the full-page capture below.
if (process.env.LAB_CLIP === "1") {
  await page.screenshot({ path: out });
  console.log(`saved ${out}`);
  errors.slice(0, 10).forEach((e) => console.log(e));
  await browser.close();
  process.exit(0);
}

// The suite scrolls an inner element, so `fullPage` alone stops at the viewport.
// Grow the viewport to the content height instead.
const needed = await page.evaluate(() => {
  const m = document.querySelector("#main-content");
  return m ? m.scrollHeight + 60 : document.body.scrollHeight;
});
if (needed > 941) {
  await page.setViewportSize({
    width,
    height: Math.min(Math.ceil(needed), 4000),
  });
  await page.waitForTimeout(500);
}

await page.screenshot({ path: out, fullPage: true });
console.log(`saved ${out}`);
if (errors.length) {
  console.log("--- page errors ---");
  errors.slice(0, 10).forEach((e) => console.log(e));
} else {
  console.log("no console errors");
}

await browser.close();
