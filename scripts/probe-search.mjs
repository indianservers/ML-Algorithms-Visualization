// Type a query into a page's search input and report the visible result labels.
//
//   node scripts/probe-search.mjs <route> <inputSelector> <itemSelector> <query> [query...]

import { chromium } from "@playwright/test";

const [route, inputSelector, itemSelector, ...queries] = process.argv.slice(2);
const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";

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

const read = async () =>
  page.$$eval(itemSelector, (nodes) => nodes.map((node) => node.textContent.trim().split("\n")[0]));

console.log(`baseline (${(await read()).length}):`, (await read()).slice(0, 40).join(" | "));

for (const query of queries) {
  await page.fill(inputSelector, "");
  await page.fill(inputSelector, query);
  await page.waitForTimeout(350);
  const labels = await read();
  console.log(`\n"${query}" -> ${labels.length} results`);
  console.log(labels.slice(0, 25).map((label, index) => `  ${index + 1}. ${label}`).join("\n"));
}

if (errors.length) console.log("\nERRORS:\n" + errors.slice(0, 12).join("\n"));
await browser.close();
