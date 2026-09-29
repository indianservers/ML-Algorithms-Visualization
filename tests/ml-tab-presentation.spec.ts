import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

for (const route of [
  '/ml/supervised/logistic-regression',
  '/ml/supervised/decision-tree-classification',
  '/ml/clustering/hierarchical-clustering',
  '/ml/deep-learning/gru',
]) {
  test(`${route} uses illustrated lesson tabs and Learn panes`, async ({ page }) => {
    await page.goto(`${base}${route}?tab=learn`);
    const tabs = page.locator('#main-content nav[data-ml-lesson-tabs]');
    await expect(tabs).toBeVisible();
    await expect(tabs.locator('button[data-ml-tab="learn"] svg')).toBeVisible();
    await expect(tabs.locator('button[data-ml-tab="dataset"] svg')).toBeVisible();
    await expect(page.locator('.lab-tab-guide .lab-guide-hero')).toBeVisible();
    await expect(page.locator('.lab-tab-guide .lab-guide-important')).toBeVisible();
    await tabs.locator('button[data-ml-tab="visualize"]').click();
    await expect(page).toHaveURL(/\?tab=visualize$/);
  });
}

test('Logistic Regression Learn panes and tab icons fit a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=learn`);
  await expect(page.locator('.lab-guide-actions a')).toHaveCount(4);
  await expect(page.locator('.lab-guide-art')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

for (const route of [
  '/ml/supervised/svm-classification',
  '/ml/supervised/multiple-linear-regression',
  '/ml/supervised/polynomial-regression',
]) {
  test(`${route} shows the shared icon cards and keeps tab navigation working`, async ({ page }) => {
    await page.goto(`${base}${route}?tab=learn`);
    const tabs = page.locator('#main-content [data-ml-lesson-tabs]').filter({
      has: page.locator('button[data-ml-tab="learn"]'),
    }).first();
    await expect(tabs).toBeVisible();
    await expect(tabs.locator('button[data-ml-tab="learn"] svg')).toBeVisible();
    await expect(tabs.locator('button[data-ml-tab="visualize"] svg')).toBeVisible();
    await tabs.locator('button[data-ml-tab="visualize"]').click();
    await expect(page).toHaveURL(/\?tab=visualize$/);
  });
}

for (const route of [
  '/ml/supervised/decision-tree-classification',
  '/ml/supervised/logistic-regression',
  '/ml/supervised/simple-linear-regression',
  '/ml/supervised/multiple-linear-regression',
  '/ml/supervised/support-vector-regression',
]) {
  test(`${route} labels its prediction tab Live test/inference`, async ({ page }) => {
    await page.goto(`${base}${route}?tab=explain`);
    const inferenceTab = page.locator('#main-content button[data-ml-tab="inference"]').first();
    await expect(inferenceTab).toHaveText(/Live test\/inference/);
    await expect(page).toHaveURL(/\?tab=explain$/);
  });
}

test('simple linear regression inference responds to a new input', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/simple-linear-regression?tab=explain`);
  const input = page.getByRole('spinbutton', { name: 'Inference input' });
  const prediction = page.locator('.slr2-inference-result strong');
  const before = await prediction.textContent();
  await input.fill('9');
  await expect(prediction).not.toHaveText(before ?? '');
});

test('nonpredictive labs keep the Explain label', async ({ page }) => {
  await page.goto(`${base}/ml/clustering/hierarchical-clustering?tab=explain`);
  await expect(page.locator('#main-content button[data-ml-tab="explain"]').first()).toHaveText(/Explain/);
});
