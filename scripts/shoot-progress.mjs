import { chromium } from "@playwright/test";
import { mkdir } from "fs/promises";

await mkdir(".shots/progress", { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(25000);

await page.goto("http://localhost:9867/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
console.log("home bar nodes", await page.locator(".route-progress").count());

async function clickAndCatch(href, name) {
  const link = page.locator(`a[href="${href}"]`).first();
  if ((await link.count()) === 0) {
    await page.evaluate((h) => {
      window.history.pushState({}, "", h);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, href);
  } else {
    await link.click();
  }

  const seen = await page
    .waitForFunction(() => {
      const el = document.querySelector(".route-progress");
      return Boolean(el?.hasAttribute("data-active"));
    }, { timeout: 2500 })
    .then(() => true)
    .catch(() => false);

  const pct = await page.locator(".route-progress-value").innerText().catch(() => "missing");
  console.log(name, "active=", seen, "pct=", pct, "url=", page.url());
  await page.screenshot({
    path: `.shots/progress/${name}.png`,
    clip: { x: 0, y: 0, width: 1440, height: 90 },
  });
  await page.waitForTimeout(800);
}

await clickAndCatch("/ml/clustering/optics", "to-optics");
await clickAndCatch("/ml/supervised/knn-classification", "to-knn");
await clickAndCatch("/", "to-home");
await browser.close();
