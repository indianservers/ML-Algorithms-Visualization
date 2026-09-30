import { expect, test } from '@playwright/test';

const route = `${process.env.LAB_BASE_URL ?? 'http://localhost:3355'}/ml/supervised/knn-classification`;

test('all KNN tabs reclaim the hidden lesson rail and fit the desktop width', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.addInitScript(() => localStorage.setItem('ml-suite-theme-v3', 'dark'));
  await page.goto(`${route}?tab=learn`);
  for (let index = 0; index < 7; index += 1) {
    await page.locator('.knn-tabs > div button').nth(index).click();
    await expect(page.locator('.knn-workspace')).toBeVisible();
    const layout = await page.evaluate(() => {
      const pageRect = document.querySelector('.knn-page')!.getBoundingClientRect();
      const mainRect = document.querySelector('.knn-page > main')!.getBoundingClientRect();
      const workspaceRect = document.querySelector('.knn-workspace')!.getBoundingClientRect();
      return {
        railHidden: getComputedStyle(document.querySelector('.knn-nav')!).display === 'none',
        leftGap: mainRect.left - pageRect.left,
        rightEdge: Math.max(mainRect.right, workspaceRect.right),
        viewport: innerWidth,
        pageOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    expect(layout.railHidden).toBe(true);
    expect(layout.leftGap).toBeLessThanOrEqual(20);
    expect(layout.rightEdge).toBeLessThanOrEqual(layout.viewport + 2);
    expect(layout.pageOverflow).toBeLessThanOrEqual(2);
  }
  await page.locator('.knn-tabs > div button').nth(1).click();
  const chart = page.locator('.knn-chart');
  await expect(chart).toBeVisible();
  const chartSize = await chart.boundingBox();
  expect(chartSize!.height).toBeGreaterThan(500);
  await page.locator('.knn-lower').scrollIntoViewIfNeeded();
  const lowerTop = await page.locator('.knn-lower').evaluate(element => element.getBoundingClientRect().top);
  expect(lowerTop).toBeLessThan(850);
});

test('KNN visualization fits a phone without a left gutter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}?tab=visualize`);
  await expect(page.locator('.knn-chart')).toBeVisible();
  const layout = await page.evaluate(() => ({
    leftGap: document.querySelector('.knn-page > main')!.getBoundingClientRect().left - document.querySelector('.knn-page')!.getBoundingClientRect().left,
    chartRight: document.querySelector('.knn-plot-card')!.getBoundingClientRect().right,
    pageOverflow: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(layout.leftGap).toBeLessThanOrEqual(12);
  expect(layout.chartRight).toBeLessThanOrEqual(392);
  expect(layout.pageOverflow).toBeLessThanOrEqual(2);
});
