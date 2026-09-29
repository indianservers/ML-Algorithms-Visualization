import { expect, test } from '@playwright/test';

const route = `${process.env.LAB_BASE_URL ?? 'http://localhost:3355'}/ml/supervised/simple-linear-regression`;

test('each regression tab contains its own relevant content', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route);
  const lab = page.locator('.slr2-page');
  await expect(lab).toBeVisible();
  await expect(lab.getByRole('tab', { name: 'Learn' })).toHaveAttribute('aria-selected', 'true');
  await expect(lab.locator('.lab-tab-guide')).toBeVisible();
  await expect(lab.locator('.slr2-plot')).toHaveCount(0);
  await expect(lab.locator('.slr2-dataset-bar')).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Visualize' }).click();
  await expect(lab.locator('.slr2-plot')).toBeVisible();
  await expect(lab.getByRole('slider', { name: 'Prediction X' })).toBeVisible();
  await expect(lab.getByRole('button', { name: 'Step', exact: true })).toHaveCount(0);
  await expect(lab.locator('.slr2-metric-grid')).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Dataset' }).click();
  await expect(lab.getByRole('combobox', { name: 'Regression dataset' })).toBeVisible();
  await expect(lab.locator('.slr2-data-table tbody tr')).toHaveCount(100);
  await expect(lab.locator('.slr2-plot')).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Train' }).click();
  await expect(lab.getByRole('button', { name: 'Step', exact: true })).toBeVisible();
  await expect(lab.getByRole('button', { name: 'Export fitted model' })).toBeVisible();
  await expect(lab.getByRole('slider', { name: 'Prediction X' })).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Metrics' }).click();
  await expect(lab.locator('.slr2-metric-grid article')).toHaveCount(5);
  await expect(lab.locator('.slr2-residual-plot')).toBeVisible();
  await expect(lab.locator('.slr2-plot')).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Compare' }).click();
  await expect(lab.getByRole('slider', { name: 'Manual Slope' })).toBeVisible();
  await expect(lab.locator('.slr2-manual-line')).toBeVisible();
  await expect(lab.locator('.slr2-residual-plot')).toHaveCount(0);

  await lab.getByRole('tab', { name: 'Explain' }).click();
  await expect(lab.locator('.slr2-formula')).toHaveCount(3);
  await expect(lab.locator('.slr2-plot')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('dataset change updates visualization, training and metrics without mixing their controls', async ({ page }) => {
  await page.goto(`${route}?tab=visualize`);
  const lab = page.locator('.slr2-page');
  const initialSlope = await lab.locator('.slr2-parameters strong').first().innerText();
  const initialPrediction = await lab.locator('.slr2-prediction-card b').innerText();
  await lab.getByRole('slider', { name: 'Prediction X' }).fill('8');
  await expect(lab.locator('.slr2-prediction-card b')).not.toHaveText(initialPrediction);

  await lab.getByRole('tab', { name: 'Dataset' }).click();
  await lab.getByRole('combobox', { name: 'Regression dataset' }).selectOption('negative');
  await lab.getByRole('tab', { name: 'Visualize' }).click();
  await expect(lab.locator('.slr2-parameters strong').first()).not.toHaveText(initialSlope);
  await lab.getByRole('tab', { name: 'Train' }).click();
  await lab.getByRole('button', { name: 'Restart' }).click();
  await expect(lab.locator('.slr2-chart-heading')).toContainText('Step 1 / 10');
  await lab.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(lab.locator('.slr2-chart-heading')).toContainText('Step 2 / 10');

  await lab.getByRole('tab', { name: 'Dataset' }).click();
  await lab.locator('input[type=file]').setInputFiles({ name: 'demo.csv', mimeType: 'text/csv', buffer: Buffer.from('age,score,other\n1,3,0\n2,5,1\n3,7,2\n4,9,3\n') });
  await lab.getByRole('button', { name: 'Load CSV', exact: true }).click();
  await expect(lab.locator('.slr2-dataset-bar')).toContainText('4 samples');
  await lab.getByRole('tab', { name: 'Metrics' }).click();
  await expect(lab.locator('.slr2-other')).toContainText('Model metrics from 4 observations');
  await lab.getByRole('tab', { name: 'Visualize' }).click();
  await expect(lab.locator('.slr2-point')).toHaveCount(4);
});

test('mobile layout has no page-level horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}?tab=visualize`);
  await expect(page.locator('.slr2-page')).toBeVisible();
  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport + 1);
});
