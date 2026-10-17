import { expect, test } from '@playwright/test';
import { aiVirtualLabs, allAiVirtualLabs, aiVirtualLabRoute } from '../src/features/ai-virtual-labs/catalog';

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

test('AI Virtual Labs catalogue exposes 39 distinct interactive visualizations', async ({ page }) => {
  await page.goto(`${origin}/studios/ai-virtual-labs`);
  const cards = page.locator('.avl-card');
  await expect(cards).toHaveCount(39);

  for (const [index, lab] of allAiVirtualLabs.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute('data-testid', `algorithm-card-${lab.slug}`);
    await expect(card.getByRole('link')).toHaveAttribute('href', aiVirtualLabRoute(lab.slug));
    await expect(card.locator(`svg.ai-scene-${lab.slug}`)).toHaveCount(1);
    await expect(card.getByRole('button', { name: new RegExp(`Preview ${lab.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) })).toHaveCount(1);
  }
});

test('preview, filters, focus and reduced motion remain usable', async ({ page }) => {
  await page.goto(`${origin}/studios/ai-virtual-labs`);
  const first = page.getByTestId('algorithm-card-uniform-cost-search');
  const preview = first.locator('.avl-preview-button');
  await expect(preview).toHaveAccessibleName('Preview Uniform Cost Search animation');
  await preview.click();
  await expect(preview).toHaveAttribute('aria-pressed', 'true');
  await expect(first.locator('.avl-stage')).toContainText('Optimal cost path locked');
  await expect(first.locator('path.ai-ill-motion')).toHaveCSS('animation-name', 'avl-trace');

  await page.getByRole('button', { name: 'Upcoming', exact: true }).click();
  await expect(page.locator('.avl-card')).toHaveCount(15);
  await expect(page.locator('.studio-count')).toHaveText('15 of 39 labs');
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await expect(page.locator('.avl-card')).toHaveCount(24);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.avl-card').first().locator('.ai-ill-node').first()).toHaveCSS('animation-name', 'none');
});

test('catalogue remains readable at desktop, tablet and mobile widths', async ({ page }) => {
  for (const [width, height] of [[1600, 900], [900, 1000], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}/studios/ai-virtual-labs`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `overflow at ${width}px`).toBeLessThanOrEqual(2);
    await expect(page.locator('.avl-card')).toHaveCount(39);
    expect(await page.locator('.avl-card').first().evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThan(260);
  }
});

test('learning companion is primary and graph tools appear only for matching search labs', async ({ page }) => {
  await page.goto(`${origin}/ai-algorithms/breadth-first-search`);
  const companion = page.getByRole('heading', { name: 'Learning Companion', exact: true });
  const workspace = page.getByRole('heading', { name: 'Breadth First Search workspace', exact: true });
  await expect(companion).toBeVisible();
  await expect(workspace).toBeVisible();
  expect(await page.evaluate(() => {
    const learningPane = document.querySelector('.ai-learn');
    const labWorkspace = document.querySelector('.ai-lab-workspace');
    return Boolean(learningPane && labWorkspace && (learningPane.compareDocumentPosition(labWorkspace) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);

  await expect(page.getByRole('tab', { name: 'Interactive Lab', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Graph Explorer', exact: true }).click();
  await expect(page.locator('#ai-lab-simulator-panel')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'BFS Graph Explorer', exact: true })).toBeVisible();
  await expect(page.getByLabel('Page algorithm')).toBeDisabled();

  const graphCompatible = new Set(['uniform-cost-search', 'a-star-search', 'ai-depth-first-search', 'greedy-best-first-search', 'breadth-first-search', 'beam-search']);
  for (const lab of aiVirtualLabs) {
    await page.goto(`${origin}${aiVirtualLabRoute(lab.slug)}`);
    await expect(page.getByRole('heading', { name: 'Learning Companion', exact: true })).toBeVisible();
    if (graphCompatible.has(lab.slug)) {
      await expect(page.getByRole('tab', { name: 'Graph Explorer', exact: true })).toHaveCount(1);
      await expect(page.locator('.gls')).toHaveCount(0);
    } else {
      await expect(page.getByRole('tab', { name: 'Graph Explorer', exact: true })).toHaveCount(0);
      await expect(page.locator('.gls')).toHaveCount(0);
      await expect(page.getByText('Page-specific simulator', { exact: true })).toBeVisible();
    }
  }
});
