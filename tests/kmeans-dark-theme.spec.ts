import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

test('K-means stays dark when the saved suite theme is light', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ml-suite-theme-v3', 'light'));
  await page.goto(`${base}/ml/clustering/k-means`);

  const lesson = page.locator('.km-page');
  await expect(lesson).toBeVisible();
  await expect(lesson).not.toHaveClass(/light/);
  expect(await lesson.evaluate(element => getComputedStyle(element).backgroundImage)).toContain('radial-gradient');
  expect(await lesson.evaluate(element => getComputedStyle(element).color)).toBe('rgb(244, 246, 249)');
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);

  await expect(page.locator('.km-dark-only.dark')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ml-suite-theme-v3'))).toBe('light');
});
