import { expect, test, type Locator } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';
const route = `${base}/ml/supervised/logistic-regression?tab=visualize`;
async function setRange(locator: Locator, value: number) {
  await locator.evaluate((element, next) => {
    const input = element as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(next));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test('visual studio shows real binary observations, model outputs, and footer-safe cards', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1672, height: 940 });
  await page.goto(route);
  const chart = page.locator('.lr-chart-card');
  await expect(chart).toBeVisible();
  await expect(page.locator('.lr-dataset-toolbar select')).toHaveValue('reference');
  await expect(chart.locator('.lr-observation')).toHaveCount(100);
  await expect(chart.locator('.sigmoid')).toBeVisible();
  await expect(chart.locator('.lr-probability-threshold')).toBeAttached();
  await expect(chart.locator('.lr-decision-boundary')).toBeAttached();
  await expect(page.locator('.lr-coeff-cards')).toContainText('Calculated from current dataset');
  await expect(page.locator('.lr-metrics > article')).toHaveCount(5);
  const points = await chart.locator('.lr-observation').evaluateAll(nodes => nodes.map(node => ({
    y: Number(node.getAttribute('cy')), positive: node.classList.contains('pt-pos'),
  })));
  expect(points.filter(point => point.positive).every(point => point.y < 90)).toBe(true);
  expect(points.filter(point => !point.positive).every(point => point.y > 180)).toBe(true);
  const positions = await page.evaluate(() => ({
    cards: document.querySelector('.lr-metrics')!.getBoundingClientRect().bottom,
    footer: document.querySelector('.site-footer')!.getBoundingClientRect().top,
  }));
  expect(positions.cards).toBeLessThanOrEqual(positions.footer);
  expect(errors).toEqual([]);
});

test('threshold and negative coefficient update boundary, regions, and metrics', async ({ page }) => {
  await page.goto(route);
  const chart = page.locator('.lr-chart-card');
  const threshold = page.getByRole('slider', { name: 'Probability Threshold' });
  const initialBoundary = Number(await chart.locator('.lr-decision-boundary').getAttribute('x1'));
  const initialMatrix = await page.locator('.lr-confusion').innerText();
  await setRange(threshold, 0.70);
  expect(Number(await chart.locator('.lr-decision-boundary').getAttribute('x1'))).toBeGreaterThan(initialBoundary);
  await expect(chart.locator('.lr-threshold-label')).toContainText('0.70');
  expect(await page.locator('.lr-confusion').innerText()).not.toBe(initialMatrix);
  await setRange(threshold, 0.30);
  expect(Number(await chart.locator('.lr-decision-boundary').getAttribute('x1'))).toBeLessThan(initialBoundary);
  await page.getByRole('button', { name: /Manual Experiment \(Custom/ }).click();
  await setRange(page.getByRole('slider', { name: 'Intercept beta zero' }), 4);
  await setRange(page.getByRole('slider', { name: 'Coefficient beta one' }), -0.07);
  await setRange(threshold, 0.50);
  await expect(chart.locator('.lr-strip-track > div').first()).toHaveClass(/positive/);
  await expect(chart.locator('.lr-strip-track > div').last()).toHaveClass(/negative/);
  await setRange(page.getByRole('slider', { name: 'Coefficient beta one' }), 0);
  await expect(chart.locator('.lr-decision-boundary')).toHaveCount(0);
  await expect(chart.locator('.lr-feature-strip')).toContainText('No finite decision boundary');
});

test('dataset, reset, probe, toggles, playback, and CSV mapping respond', async ({ page }) => {
  await page.goto(route);
  const dataset = page.locator('.lr-dataset-toolbar select');
  await dataset.selectOption('student');
  await expect(page.locator('.lr-dataset-toolbar')).toContainText('Student Risk Dataset');
  await setRange(page.locator('.lr-visual-rail').getByRole('slider', { name: /Prediction X/ }), 70);
  await expect(page.locator('.lr-analysis-prediction')).toContainText('70.0');
  await page.getByLabel('Show Decision Regions').uncheck();
  await expect(page.locator('.lr-region-zero, .lr-region-one')).toHaveCount(0);
  await page.getByLabel('Show Sample Labels').check();
  await expect(page.locator('.lr-sample-label').first()).toBeVisible();
  await page.getByLabel('Show Log-Odds').check();
  await expect(page.getByRole('img', { name: /Log-odds space/ })).toBeVisible();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.locator('.lr-playback')).toContainText('Step 1 / 10');
  await page.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(page.locator('.lr-playback')).toContainText('Step 2 / 10');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.lr-playback')).toContainText('Step 1 / 10', { timeout: 5000 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Reset Dataset' }).click();
  await expect(dataset).toHaveValue('reference');
  await expect(page.getByRole('slider', { name: 'Probability Threshold' })).toHaveValue('0.5');
  await expect(page.getByLabel('Show Decision Regions')).toBeChecked();
  await expect(page.getByLabel('Show Sample Labels')).not.toBeChecked();

  await page.locator('input[type=file]').setInputFiles({ name: 'risk.csv', mimeType: 'text/csv', buffer: Buffer.from('id,score,result\na,12,Fail\nb,28,Fail\nc,44,Fail\nd,54,Pass\ne,62,Pass\nf,77,Pass\ng,83,Pass\nh,96,Pass') });
  await expect(page.getByRole('group', { name: 'Map CSV columns' })).toBeVisible();
  await page.getByRole('combobox', { name: 'CSV feature column' }).selectOption('1');
  await page.getByRole('combobox', { name: 'CSV target column' }).selectOption('2');
  await page.getByRole('button', { name: 'Load 8 rows' }).click();
  await expect(page.locator('.lr-dataset-toolbar')).toContainText('8 samples');
  await expect(page.locator('.lr-observation')).toHaveCount(8);
});

test('phone layout stacks the chart before controls without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await expect(page.locator('.lr-chart-card')).toBeVisible();
  const positions = await page.evaluate(() => ({
    chart: document.querySelector('.lr-chart-card')!.getBoundingClientRect().top,
    controls: document.querySelector('.lr-model-controls')!.getBoundingClientRect().top,
    overflow: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(positions.chart).toBeLessThan(positions.controls);
  expect(positions.overflow).toBeLessThanOrEqual(1);
});

test('invalid CSV is rejected and auto fit restores dataset coefficients', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ml-suite-theme-v3', 'light'));
  await page.goto(route);
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from('score,outcome\nbad,Pass\n3,Fail\n5,Pass\n8,Fail'),
  });
  await expect(page.getByRole('alert')).toContainText(/numeric|feature/i);
  await expect(page.locator('.lr-dataset-toolbar select')).toHaveValue('reference');
  const original = await page.locator('.lr-coeff-cards').innerText();
  await page.getByRole('button', { name: /Manual Experiment \(Custom/ }).click();
  await setRange(page.getByRole('slider', { name: 'Intercept beta zero' }), 4);
  await expect(page.locator('.lr-coeff-cards')).not.toHaveText(original);
  await page.locator('#lr-fit-mode').selectOption('auto');
  await expect.poll(() => page.locator('.lr-coeff-cards').innerText()).toBe(original);
  const studio = await page.locator('.logistic-page').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(studio).toBe('rgb(6, 20, 38)');
});
