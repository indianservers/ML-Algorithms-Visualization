import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

for (const route of [
  '/',
  '/ai-algorithms/genetic-algorithm',
  '/ml/supervised/logistic-regression?tab=learn',
  '/ml/supervised/decision-tree-classification?tab=learn',
]) {
  test(`footer stays at the viewport bottom on ${route}`, async ({ page }) => {
    await page.goto(`${base}${route}`);
    const footer = page.getByRole('contentinfo', { name: 'Site credits' });
    await expect(footer).toBeVisible();
    const positions = await page.evaluate(() => {
      const footer = document.querySelector('.site-footer')!.getBoundingClientRect();
      const content = document.querySelector('main')!.getBoundingClientRect();
      const guide = document.querySelector('.guide-launch')!.getBoundingClientRect();
      return { footerTop: footer.top, footerBottom: footer.bottom, footerHeight: footer.height, contentBottom: content.bottom, guideTop: guide.top, guideBottom: guide.bottom, height: window.innerHeight };
    });
    expect(positions.footerBottom).toBe(positions.height);
    expect(positions.footerHeight).toBeLessThanOrEqual(44);
    expect(positions.contentBottom).toBeLessThanOrEqual(positions.footerTop);
    expect(positions.guideTop).toBeGreaterThanOrEqual(positions.footerTop);
    expect(positions.guideBottom).toBeLessThanOrEqual(positions.footerBottom);

    await page.locator('main').first().evaluate((element) => { element.scrollTop = element.scrollHeight / 2; });
    await expect(footer).toBeInViewport();
  });
}

test('compact mobile footer remains visible without covering the lab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/ai-algorithms/genetic-algorithm`);
  const footer = page.getByRole('contentinfo', { name: 'Site credits' });
  await expect(footer).toBeInViewport();
  const bounds = await footer.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y + bounds!.height).toBe(844);
  expect(bounds!.height).toBeLessThanOrEqual(64);
  await page.locator('#main-content').evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(footer).toBeInViewport();
});
