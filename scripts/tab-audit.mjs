// Temporary diagnostic: clicks every tab-bar button on a route and reports
// whether the active marker and the page content actually change.
//
//   node scripts/tab-audit.mjs /ml/deep-learning/perceptron [...more routes]

import { chromium } from "@playwright/test";

const routes = process.argv.slice(2);
const base = process.env.LAB_BASE_URL ?? "http://localhost:9867";

const helpers = () => {
  const isTabish = (el) =>
    el.tagName === "BUTTON" || el.getAttribute("role") === "tab";
  const isActive = (el) =>
    /(^|[\s-])(active|selected)/.test(
      typeof el.className === "string" ? el.className : "",
    ) || el.getAttribute("aria-selected") === "true";
  const pathOf = (el) => {
    const parts = [];
    while (el && el !== document.body) {
      parts.unshift(Array.prototype.indexOf.call(el.parentElement.children, el));
      el = el.parentElement;
    }
    return parts;
  };
  const atPath = (parts) => {
    let el = document.body;
    for (const i of parts) {
      el = el?.children[i];
      if (!el) return null;
    }
    return el;
  };
  window.__tabs = {
    isActive,
    atPath,
    bars() {
      const bars = [];
      const seen = new Set();
      for (const el of document.querySelectorAll("button, [role='tab']")) {
        const parent = el.parentElement;
        if (!parent || seen.has(parent)) continue;
        seen.add(parent);
        const kids = Array.prototype.filter.call(parent.children, isTabish);
        if (kids.length < 3) continue;
        if (kids.filter(isActive).length !== 1) continue;
        if (!kids.some((k) => k.getBoundingClientRect().width > 0)) continue;
        bars.push({
          path: pathOf(parent),
          labels: kids.map((k) => k.textContent.trim().slice(0, 26)),
        });
      }
      return bars;
    },
    kids(path) {
      const parent = atPath(path);
      return parent ? Array.prototype.filter.call(parent.children, isTabish) : [];
    },
  };
};

const browser = await chromium.launch({ channel: "msedge" });

for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("[pageerror] " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("[console] " + m.text());
  });
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("ml-suite-theme-v3", "dark");
  });

  console.log("\n=== " + route + " ===");
  try {
    await page.goto(base + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    await page.evaluate(`(${helpers.toString()})()`);

    const bars = await page.evaluate(() => window.__tabs.bars());
    if (!bars.length) console.log("  no tab bars detected");

    for (let b = 0; b < bars.length; b++) {
      const { path, labels } = bars[b];
      const rows = [];
      // Count visible panels rather than diffing text: many pages also write a
      // status line on tab click, which would mask a dashboard that never changes.
      const signature = () =>
        page.evaluate(() => {
          const visible = Array.from(
            document.querySelectorAll("section, article, aside, .panel, h2, h3"),
          ).filter((el) => el.offsetParent !== null);
          const classes = visible
            .map((el) =>
              typeof el.className === "string" ? el.className.trim() : "",
            )
            .join("|");
          const heads = visible
            .filter((el) => /^H[23]$/.test(el.tagName))
            .map((el) => el.textContent.trim().slice(0, 30))
            .join("|");
          return `${visible.length}#${classes}#${heads}`;
        });

      for (let k = 0; k < labels.length; k++) {
        const before = await signature();
        const clicked = await page.evaluate(
          ([p, j]) => {
            const kid = window.__tabs.kids(p)[j];
            if (!kid) return "missing";
            kid.click();
            return "ok";
          },
          [path, k],
        );
        await page.waitForTimeout(320);
        const after = await signature();
        const activeAfter = await page.evaluate(
          (p) =>
            window.__tabs
              .kids(p)
              .find(window.__tabs.isActive)
              ?.textContent.trim()
              .slice(0, 26) ?? "(none)",
          path,
        );
        rows.push({
          label: labels[k],
          click: clicked,
          activeAfter,
          panels: after.split("#")[0],
          signature: after,
        });
        await page.evaluate(`(${helpers.toString()})()`);
      }
      const indicator = rows.every((r) => r.activeAfter === r.label);
      const layouts = new Set(rows.map((r) => r.signature));
      console.log(
        `  bar#${b} [${labels.join(" | ")}]\n    indicator=${indicator ? "ok" : "BROKEN"} layouts=${layouts.size}/${rows.length} panels=[${rows.map((r) => r.panels).join(",")}]`,
      );
      for (const r of rows)
        if (r.activeAfter !== r.label || r.click !== "ok")
          console.log(
            `    - "${r.label}" click=${r.click} activeAfter="${r.activeAfter}"`,
          );
    }
  } catch (error) {
    console.log("  AUDIT ERROR: " + error.message.split("\n")[0]);
  }
  for (const e of [...new Set(errors)]) console.log("  " + e);
  await page.close();
}

await browser.close();
