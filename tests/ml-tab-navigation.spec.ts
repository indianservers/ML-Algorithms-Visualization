import { expect, test } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';

test('hierarchical clustering tabs expose distinct workspaces and restore the URL tab', async ({ page }) => {
  await page.goto(`${base}/ml/clustering/hierarchical-clustering`);
  await expect(page.getByRole('tab', { name: 'Learn' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(/dendrogram/i).first()).toBeVisible();

  await page.getByRole('tab', { name: 'Dataset' }).click();
  await expect(page.getByRole('heading', { name: 'Explore the dataset' })).toBeVisible();
  await expect(page).toHaveURL(/\?tab=dataset$/);

  await page.getByRole('tab', { name: 'Visualize' }).click();
  await expect(page.getByRole('heading', { name: /Linked Dendrogram & Scatter/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Train' }).click();
  await expect(page.getByRole('heading', { name: 'Build the hierarchy' })).toBeVisible();
  await page.getByRole('tab', { name: 'Metrics' }).click();
  await expect(page.getByRole('heading', { name: /Cluster Quality/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Compare' }).click();
  await expect(page.getByRole('tab', { name: 'Compare' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Explain' }).click();
  await expect(page.locator('.lab-tab-lesson')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Explain' })).toHaveAttribute('aria-selected', 'true');
});

for (const [route, metricsHeading] of [
  ['gru', 'Gate and state metrics'],
  ['few-shot-learning', 'Classification metrics'],
] as const) {
  test(`${route} keeps its tabs while opening the training lab`, async ({ page }) => {
    await page.goto(`${base}/ml/deep-learning/${route}`);
    await page.getByRole('tab', { name: 'Build / Train' }).click();
    await expect(page.getByRole('tab', { name: 'Build / Train' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Metrics' })).toBeVisible();
    await page.getByRole('tab', { name: 'Metrics' }).click();
    await expect(page.getByRole('heading', { name: metricsHeading })).toBeVisible();
    await page.getByRole('tab', { name: 'Dataset' }).click();
    await expect(page.getByRole('tab', { name: 'Dataset' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Visualize' }).click();
    await expect(page.getByRole('tab', { name: 'Visualize' })).toHaveAttribute('aria-selected', 'true');
  });
}
