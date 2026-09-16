import { chromium } from "@playwright/test";

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
await page.goto(process.argv[2] ?? "http://localhost:9867/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

const measured = await page.evaluate(() => {
  const box = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  const landing = document.querySelector(".home-landing");
  return {
    nav: box(".hl-nav"),
    hero: box(".hl-hero"),
    stats: box(".hl-stats"),
    quote: box(".hl-quote"),
    catalogHead: box(".hl-catalog-head"),
    group: box(".hl-group"),
    card: box(".hl-card"),
    cardArt: box(".hl-card-art"),
    mini: box(".hl-mini"),
    cardsPerRow: getComputedStyle(document.querySelector(".hl-cards")).gridTemplateColumns.split(" ").length,
    total: landing ? Math.round(landing.getBoundingClientRect().height) : null,
  };
});

// Mockup is a 1024px-wide capture of a 1440px viewport, so scale by 1440/1024.
const K = 1440 / 1024;
const expected = {
  nav: { h: Math.round(38 * K) },
  hero: { h: Math.round(158 * K) },
  group: { h: Math.round(116 * K) },
  card: { w: Math.round(155 * K), h: Math.round(76 * K) },
  mini: { h: Math.round(36 * K) },
  total: Math.round(682 * K),
};

console.log("measured", JSON.stringify(measured, null, 1));
console.log("expected", JSON.stringify(expected, null, 1));
await browser.close();
