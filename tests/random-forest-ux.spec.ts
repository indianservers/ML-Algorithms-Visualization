import { test, expect } from '@playwright/test';

test('forest samples, tree paths, training, comparison and CSV validation work on mobile', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3355/ml/supervised/random-forest-classification');
  await page.getByLabel('Inspect sample', { exact: true }).selectOption('0');
  await expect(page.locator('.forest-overview')).toContainText('Sample 1 · Actual:');
  await expect(page.locator('.rfc-data-point.selected')).toHaveCount(1);
  await page.locator('.rfc-region-card').scrollIntoViewIfNeeded();
  await page.locator('.rfc-data-point').last().click();
  await expect(page.locator('.rfc-data-point').last()).toHaveClass(/selected/);
  await page.getByLabel('Inspect tree', { exact: true }).selectOption('31');
  await expect(page.locator('.forest-inspector')).toContainText('Vote:');
  await page.locator('.rfc-tabs button').filter({ hasText: 'Train and Test' }).click();
  await expect(page.getByLabel('Query Petal Length')).toBeVisible();
  await page.getByLabel('Query Petal Length').fill('6');
  await page.locator('.rfc-train').getByRole('button', { name: 'Train / Retrain Forest', exact: true }).click();
  await expect(page.locator('.rfc-train')).toContainText('Trained 32 trees');
  await page.locator('.ml-tab-more').click();
  await page.locator('.rfc-tabs button').filter({ hasText: /^Compare$/ }).click();
  await expect(page.getByText('Only the number of trees changes.', { exact: false })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'One tree', exact: true })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('Sepal Length,Sepal Width,Petal Length,Petal Width,Class\n1,2,3,4,9\n2,3,4,5,0\n3,4,5,6,1') });
  await expect(page.locator('.rfc-toast')).toContainText('No rows were imported');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});
