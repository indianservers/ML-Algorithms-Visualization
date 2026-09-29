import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

test('Logistic Regression keeps a real iteration trace visible after training', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=dataset`);
  await page.locator('.lr-train').click();
  const activity = page.getByRole('complementary', { name: 'Training activity' });
  await expect(activity).toBeVisible();
  await expect(activity.getByRole('log')).toContainText('Training started');
  await expect(activity.getByRole('log')).toContainText('Recorded iteration 650/650');
  await expect(activity.getByRole('log')).toContainText('Training completed');
  await expect(activity.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  await page.getByRole('button', { name: 'Collapse training activity' }).click();
  await expect(activity.getByRole('log')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand training activity' }).click();
  await expect(activity.getByRole('log')).toContainText('Training completed');
});

test('other algorithm train actions show a persistent activity log', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/random-forest-classification?tab=train`);
  await page.getByRole('button', { name: /Train \/ Retrain Forest/i }).click();
  const activity = page.getByRole('complementary', { name: 'Training activity' });
  await expect(activity.getByRole('log')).toContainText('Training started');
  await expect(activity.getByRole('log')).toContainText('Training action completed');
  await expect(activity.getByRole('log')).toContainText('forest size');
});

test('opening a Train tab does not start a training log', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=dataset`);
  await page.getByRole('navigation', { name: 'Lesson sections' }).getByRole('button', { name: 'Train' }).click();
  await expect(page.getByRole('complementary', { name: 'Training activity' })).toHaveCount(0);
});

test('a trainer with a busy state completes its shared log when fitting ends', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/random-forest-regression?tab=train`);
  await page.locator('.rf-train').click();
  const activity = page.getByRole('complementary', { name: 'Training activity' });
  await expect(activity.getByRole('log')).toContainText('Model fitting in progress');
  await expect(activity.getByRole('log')).toContainText('Training completed');
});

test('the training log fits on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=dataset`);
  await page.locator('.lr-train').click();
  const activity = page.getByRole('complementary', { name: 'Training activity' });
  await expect(activity).toBeVisible();
  const bounds = await activity.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
});
