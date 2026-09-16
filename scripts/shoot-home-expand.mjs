import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Exercises the landing catalogue's expand/collapse controls, the search box and
 * the level filters, capturing a screenshot of each state.
 *
 *   node scripts/shoot-home-expand.mjs [url] [outDir] [width]
 */

const url = process.argv[2] ?? "http://localhost:9867/";
const dir = (process.argv[3] ?? ".shots/home/expand").replace(/[/\\]+$/, "");
const width = Number(process.argv[4] ?? 1440);

mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width, height: 980 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

async function shoot(name) {
  const height = await page.evaluate(() => {
    const landing = document.querySelector(".home-landing");
    const candidates = [document.scrollingElement, document.body, landing, landing?.parentElement];
    return Math.max(...candidates.filter(Boolean).map((el) => el.scrollHeight));
  });
  await page.setViewportSize({ width, height: Math.min(6000, Math.ceil(height) + 4) });
  await page.waitForTimeout(360);
  await page.screenshot({ path: `${dir}/${name}.png`, animations: "disabled" });
  await page.setViewportSize({ width, height: 980 });
  console.log(`${name}: ${width}x${height}`);
}

/** Reports every group control's label plus how many cards it currently shows. */
async function state(tag) {
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll(".hl-group")].map((group) => ({
      title: group.querySelector("h3")?.textContent,
      control: group.querySelector(".hl-view-all")?.textContent?.trim(),
      expanded: group.querySelector(".hl-view-all")?.getAttribute("aria-expanded"),
      cards: group.querySelectorAll(".hl-card").length,
    })),
  );
  const panels = await page.evaluate(() =>
    [...document.querySelectorAll(".hl-mini-panel")].map((panel) => ({
      title: panel.querySelector("h4")?.textContent,
      hidden: panel.hasAttribute("hidden"),
      cards: panel.querySelectorAll(".hl-card").length,
    })),
  );
  console.log(`\n== ${tag}`);
  for (const row of rows) console.log(`   ${row.title}: "${row.control}" expanded=${row.expanded} cards=${row.cards}`);
  for (const p of panels) if (!p.hidden) console.log(`   panel ${p.title}: cards=${p.cards}`);
}

await state("initial (collapsed)");
await shoot("01-collapsed");

// Expand every group via keyboard to prove the controls are real buttons.
const controls = page.locator(".hl-group .hl-view-all");
const count = await controls.count();
for (let i = 0; i < count; i += 1) {
  await controls.nth(i).focus();
  await page.keyboard.press("Enter");
}
await page.waitForTimeout(400);
await state("all groups expanded (keyboard)");
await shoot("02-expanded");

// Expand the Time Series mini category inline.
await page.locator(".hl-mini", { hasText: "Time Series" }).locator("button").click();
await page.waitForTimeout(400);
await state("time series mini expanded");
await shoot("03-mini-expanded");

// Collapse everything again.
for (let i = 0; i < count; i += 1) await controls.nth(i).click();
await page.locator(".hl-mini", { hasText: "Time Series" }).locator("button").click();
await page.waitForTimeout(400);
await state("collapsed again");

// Search should reach algorithms that are collapsed away.
await page.fill(".hl-catalog input[type=search]", "boost");
await page.waitForTimeout(400);
await state('search "boost"');
await shoot("04-search-boost");

// Level filter on top of a cleared query.
await page.fill(".hl-catalog input[type=search]", "");
await page.locator(".hl-filters button", { hasText: "Advanced" }).click();
await page.waitForTimeout(400);
await state("level = Advanced");
await shoot("05-filter-advanced");

// A term that only exists in a non-grouped mini category.
await page.locator(".hl-filters button", { hasText: "All" }).click();
await page.fill(".hl-catalog input[type=search]", "q-learning");
await page.waitForTimeout(400);
await state('search "q-learning"');
await shoot("06-search-mini");

if (errors.length) console.log(`\nERRORS:\n${errors.slice(0, 12).join("\n")}`);
else console.log("\nno console/page errors");
await browser.close();
