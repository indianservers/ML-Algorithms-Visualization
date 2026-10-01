import { expect, test } from '@playwright/test';

const route = `${process.env.LAB_BASE_URL ?? 'http://localhost:3355'}/ml/supervised/knn-classification?tab=visualize`;

test('dragging a training point maps it to the destination KNN class', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  await page.locator('.route-progress[data-active]').waitFor({ state: 'hidden' });

  const setosa = page.locator('.knn-chart circle:has(title)').filter({ hasText: 'Setosa' });
  const virginica = page.locator('.knn-chart circle:has(title)').filter({ hasText: 'Virginica' });
  await expect(setosa.first()).toBeVisible();
  await expect(virginica.first()).toBeVisible();
  const originalSetosa = await setosa.count();
  const originalVirginica = await virginica.count();
  const start = await setosa.first().boundingBox();
  const destination = await virginica.first().boundingBox();
  expect(start).not.toBeNull();
  expect(destination).not.toBeNull();

  const from = { x: start!.x + start!.width / 2, y: start!.y + start!.height / 2 };
  const to = { x: destination!.x + destination!.width / 2 + 8, y: destination!.y + destination!.height / 2 + 8 };

  await page.mouse.click(from.x, from.y);
  await expect(setosa).toHaveCount(originalSetosa);

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();

  await expect(setosa).toHaveCount(originalSetosa - 1);
  await expect(virginica).toHaveCount(originalVirginica + 1);
  await expect(page.locator('.knn-toast')).toContainText('mapped to Virginica');
});
