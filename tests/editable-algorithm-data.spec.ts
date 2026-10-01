import { expect, test } from '@playwright/test';

test('multiple regression points and table values retrain the model immediately', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3355/ml/supervised/multiple-linear-regression?tab=visualize');
  const chart = page.getByRole('img', { name: 'Multiple regression plot from the current OLS fit' });
  await expect(chart).toBeVisible();

  const pointValue = page.getByRole('spinbutton', { name: 'Selected point area_sqft' });
  const original = Number(await pointValue.inputValue());
  await pointValue.fill(String(original + 300));
  await expect(pointValue).toHaveValue(String(original + 300));
  await expect(page.getByRole('button', { name: 'Export model' })).toBeEnabled();

  const dot = chart.getByRole('button', { name: 'Edit point 1', exact: true });
  await expect(page.locator('.route-progress[data-active="true"]')).toBeHidden();
  const box = await dot.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 25, box!.y + box!.height / 2 - 15, { steps: 4 });
  await page.mouse.up();
  const draggedValue = await pointValue.inputValue();
  expect(Number(draggedValue)).not.toBe(original + 300);

  await page.getByRole('button', { name: 'Dataset', exact: true }).click();
  const cell = page.getByRole('spinbutton', { name: 'Row 1 House Size (sqft)' });
  await expect(cell).toHaveValue(draggedValue);
  await cell.fill('2500');
  await page.getByRole('button', { name: 'Visualize', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Selected point area_sqft' })).toHaveValue('2500');
  expect(errors).toEqual([]);
});

test('shared dataset loader exposes a visual numeric point editor', async ({ page }) => {
  await page.goto('http://localhost:3355/ml/optimization/gradient-descent');
  await expect(page.getByText('Visual point editor').first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('img', { name: /Editable .* versus .* dataset plot/ }).first()).toBeVisible();
  const axis = await page.getByRole('combobox', { name: 'Point editor X axis' }).first().inputValue();
  await page.getByRole('spinbutton', { name: `Selected dataset point ${axis}` }).first().fill('123.45');
  await page.getByRole('button', { name: 'Apply Edits' }).click();
  await expect.poll(() => page.evaluate(column => {
    const active = JSON.parse(localStorage.getItem('mlSuite.activeAlgorithmDatasets') ?? '{}');
    return active['/ml/optimization/gradient-descent']?.data?.[0]?.[column];
  }, axis)).toBe(123.45);
});

test('shared concept labs use edited numeric rows in their own dataset panel', async ({ page }) => {
  await page.goto('http://localhost:3355/ml/probabilistic/gaussian-process-regression');
  const editor = page.locator('details').filter({ hasText: 'Edit points and dataset values' });
  await editor.locator('summary').click();
  const axis = await editor.getByRole('combobox', { name: 'Point editor X axis' }).inputValue();
  const selected = editor.getByRole('spinbutton', { name: `Selected dataset point ${axis}` });
  await selected.fill('123.45');
  await expect(editor.getByRole('textbox', { name: `${axis} row 1`, exact: true })).toHaveValue('123.45');
});

test('logistic regression accepts visual dataset edits', async ({ page }) => {
  await page.goto('http://localhost:3355/ml/supervised/logistic-regression?tab=dataset');
  const editor = page.locator('.lr-editable-dataset');
  await expect(editor.getByText('Visual point editor')).toBeVisible();
  const x = editor.getByRole('spinbutton', { name: 'Selected dataset point x' });
  await x.fill('48.5');
  await expect(editor.getByRole('img', { name: 'Editable x versus y dataset plot' })).toBeVisible();
  await expect(x).toHaveValue('48.5');
});

test('classification tree rebuilds from visually edited samples', async ({ page }) => {
  await page.goto('http://localhost:3355/ml/supervised/decision-tree-classification?tab=dataset');
  const editor = page.locator('.dt-data');
  await expect(editor.getByText('Visual point editor')).toBeVisible();
  const axis = await editor.getByRole('combobox', { name: 'Point editor X axis' }).inputValue();
  await editor.getByRole('spinbutton', { name: `Selected dataset point ${axis}` }).fill('6.5');
  await expect(editor.getByRole('spinbutton', { name: 'Feature 1 row 1', exact: true })).toHaveValue('6.5');
});

test('regression tree rebuilds from visually edited samples', async ({ page }) => {
  await page.goto('http://localhost:3355/ml/supervised/decision-tree-regression?tab=dataset');
  const editor = page.locator('.tree-tab-panel');
  await expect(editor.getByText('Visual point editor')).toBeVisible();
  const axis = await editor.getByRole('combobox', { name: 'Point editor X axis' }).inputValue();
  await editor.getByRole('spinbutton', { name: `Selected dataset point ${axis}` }).fill('6.5');
  await expect(editor.getByRole('spinbutton', { name: `Row 1 ${axis}` })).toHaveValue('6.5');
});
