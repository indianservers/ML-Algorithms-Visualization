import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:9867/";
const out = process.argv[3] ?? ".shots/home/landing.png";
const width = Number(process.argv[4] ?? 1440);

mkdirSync(out.replace(/[^/\\]+$/, ""), { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width, height: 980 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const scrollHeight = await page.evaluate(() => {
  const landing = document.querySelector(".home-landing");
  const candidates = [document.scrollingElement, document.body, landing, landing?.parentElement];
  return Math.max(...candidates.filter(Boolean).map((el) => el.scrollHeight));
});
await page.setViewportSize({ width, height: Math.min(4000, Math.ceil(scrollHeight) + 4) });
await page.waitForTimeout(500);
await page.screenshot({ path: out, animations: "disabled" });

console.log(`saved ${out} at ${width}x${scrollHeight}`);
if (errors.length) console.log(errors.slice(0, 12).join("\n"));
await browser.close();
