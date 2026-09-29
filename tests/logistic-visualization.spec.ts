import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

test('Logistic Regression view selector shows the correct visualization', async ({ page }) => {
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=visualize`);
  const chart = page.locator('.lr-chart-card');
  const sigmoid = chart.getByRole('img', { name: /Sigmoid probability curve/ });
  const logOdds = chart.getByRole('img', { name: /Log-odds space/ });

  await expect(page.getByRole('button', { name: 'Probability', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(sigmoid).toBeVisible();
  await expect(logOdds).toHaveCount(0);

  await page.getByRole('button', { name: 'Log-Odds', exact: true }).click();
  await expect(sigmoid).toHaveCount(0);
  await expect(logOdds).toBeVisible();
  await expect(chart.getByText(/1D Feature Space/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Both', exact: true }).click();
  await expect(sigmoid).toBeVisible();
  await expect(logOdds).toBeVisible();
});

test('threshold, coefficients, and observations update the same model', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=visualize`);
  const chart = page.locator('.lr-chart-card');
  const initialLine = await chart.locator('.lr-probability-threshold').getAttribute('y1');
  const initialBoundary = await chart.locator('.lr-decision-boundary').getAttribute('x1');
  const initialCurve = await chart.locator('.sigmoid').getAttribute('d');
  const initialMatrix = await page.locator('.lr-confusion').innerText();
  const bands = await chart.locator('.lr-observation').evaluateAll((points) => points.map((point) => Number(point.getAttribute('cy'))));
  expect(bands.some((y) => y < 100)).toBeTruthy();
  expect(bands.some((y) => y > 340)).toBeTruthy();

  await page.getByRole('slider', { name: 'Probability Threshold' }).fill('0.7');
  expect(await chart.locator('.lr-probability-threshold').getAttribute('y1')).not.toBe(initialLine);
  expect(await chart.locator('.lr-decision-boundary').getAttribute('x1')).not.toBe(initialBoundary);
  await expect(chart.locator('.lr-threshold-label')).toHaveText('Probability threshold τ = 0.70');
  expect(await page.locator('.lr-confusion').innerText()).not.toBe(initialMatrix);

  await page.getByRole('slider', { name: 'Intercept beta zero' }).fill('6');
  await page.getByRole('slider', { name: 'Coefficient beta one' }).fill('-12');
  expect(await chart.locator('.sigmoid').getAttribute('d')).not.toBe(initialCurve);
  await expect(page.locator('.lr-change-note')).toContainText('decreases as x increases');
  await expect(chart.locator('.lr-decision-boundary')).toBeAttached();
  await page.getByRole('slider', { name: 'Coefficient beta one' }).fill('0');
  await expect(chart.locator('.lr-decision-boundary')).toHaveCount(0);
  await expect(chart.getByText(/No finite x boundary/)).toBeVisible();

  await chart.locator('.lr-observation').first().click();
  await expect(chart.locator('.lr-selected-sample')).toContainText('Actual class');
  await page.getByRole('button', { name: /FP \d+/ }).click();
  await expect(chart.locator('.lr-observation.is-dimmed').first()).toBeAttached();
  expect(errors).toEqual([]);
});

test('the two pictured dataset styles switch without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/ml/supervised/logistic-regression?tab=visualize`);
  await expect(page.locator('.lr-dataset-pick strong')).toHaveText('Sigmoid reference (0–1)');
  await expect(page.locator('.lr-observation')).toHaveCount(320);
  await page.getByRole('button', { name: 'Switch Dataset' }).click();
  await expect(page.locator('.lr-dataset-pick strong')).toHaveText('Overlapping binary classes');
  await expect(page.locator('.lr-observation')).toHaveCount(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
});
