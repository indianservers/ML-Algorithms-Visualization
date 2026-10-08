import { expect, test } from '@playwright/test';

test('KNN samples can be dragged on a narrow plot and update the live boundary', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5199/ml/supervised/knn-classification?tab=visualize', { waitUntil: 'domcontentloaded' });

  const chart = page.locator('svg.knn-chart');
  const sample = chart.locator('circle:has(title)').first();
  const destination = chart.locator('circle:has(title)').filter({ hasText: 'Versicolor' }).first();
  await expect(sample.locator('title')).toContainText('Setosa');
  await expect(chart.locator('.knn-plot-regions rect')).toHaveCount(819);

  const start = await sample.boundingBox();
  const end = await destination.boundingBox();
  expect(start).not.toBeNull();
  expect(end).not.toBeNull();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2);
  await page.mouse.down();
  await page.mouse.move(end!.x + end!.width / 2, end!.y + end!.height / 2, { steps: 10 });

  await expect(sample.locator('title')).toContainText('(4.70, 1.40)');
  await expect(chart.locator('.knn-plot-regions rect')).toHaveCount(350);
  await page.mouse.up();

  await expect(sample.locator('title')).toContainText('Versicolor');
  await expect(chart.locator('.knn-plot-regions rect')).toHaveCount(819);
});
