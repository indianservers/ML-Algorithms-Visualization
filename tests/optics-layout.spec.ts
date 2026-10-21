import { test, expect } from "@playwright/test";
const base = process.env.TIMESERIES_BASE_URL ?? "http://127.0.0.1:9867";
test.use({ channel: "msedge" });
for (const width of [1440, 390])
  test(`OPTICS Visualize layout and controls at ${width}px`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/ml/clustering/optics?tab=visualize`);
    await expect(
      page.getByRole("heading", { name: /OPTICS/ }).first(),
    ).toBeVisible();
    await expect(page.locator(".op-grid")).toBeVisible();
    await expect(page.locator(".op-reach")).toBeVisible();
    expect(await page.locator(".op-grid > i").count()).toBeGreaterThan(20);
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      view: innerWidth,
      charts: [...document.querySelectorAll(".op-visuals > article")].map(
        (e) => e.getBoundingClientRect().width,
      ),
      grid: document.querySelector(".op-grid")!.getBoundingClientRect().height,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.view + 1);
    expect(geometry.charts.every((w) => w > 250)).toBe(true);
    expect(geometry.grid).toBeGreaterThanOrEqual(280);
    await page.locator(".op-grid > i").nth(10).click();
    await expect(page.locator(".op-grid > i").nth(10)).toHaveClass(/current/);
    await page.getByLabel("Distance Metric").selectOption("manhattan");
    await expect(page.getByLabel("Distance Metric")).toHaveValue("manhattan");
    await page.getByRole("button", { name: /Step/i, exact: true }).click();
    await page.screenshot({ path: info.outputPath(`optics-${width}.png`) });
    expect(errors).toEqual([]);
  });
