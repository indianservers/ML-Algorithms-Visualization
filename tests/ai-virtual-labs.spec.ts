import { test, expect } from '@playwright/test';
import { aiVirtualLabs, aiVirtualLabRoute } from '../src/features/ai-virtual-labs/catalog';
import { learningContent } from '../src/features/ai-virtual-labs/learningCatalog';

test.describe.configure({ mode: 'serial' });

test('home category follows Computer Vision and lists all labs', async ({ page }) => {
  await page.goto('http://localhost:3355/');
  await expect(page.getByRole('heading', { name: 'AI Algorithms Virtual Labs' })).toBeVisible();
  const vision = page.locator('.hl-group').filter({ has: page.getByRole('heading', { name: 'Computer Vision' }) });
  const group = page.locator('.hl-ai-section');
  expect(await vision.evaluate((node) => node.compareDocumentPosition(document.querySelector('.hl-ai-section')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  await expect(group.locator('.hl-ai-card')).toHaveCount(24);
  await group.getByRole('button', { name: 'Collapse' }).click();
  await expect(group.getByText('24 Labs')).toBeVisible();
  await group.getByRole('button', { name: 'Expand' }).click();
  await group.getByRole('searchbox', { name: 'Search AI algorithms' }).fill('bayes');
  await expect(group.locator('.hl-ai-card')).toHaveCount(2);
  await group.getByRole('searchbox', { name: 'Search AI algorithms' }).fill('not-a-real-algorithm');
  await expect(group.getByText('No algorithms found')).toBeVisible();
  await group.getByRole('button', { name: 'Clear search' }).click();
  await expect(group.locator('.hl-ai-card')).toHaveCount(24);
  for (const [index, lab] of aiVirtualLabs.entries()) {
    const card = group.locator('.hl-ai-card').nth(index);
    await expect(card).toHaveAttribute('href', aiVirtualLabRoute(lab.slug));
    await expect(card).toContainText(lab.title);
    await expect(card.locator('.hl-ai-copy span')).not.toBeEmpty();
    await expect(card.locator('svg.hl-ai-illustration')).toHaveCount(1);
  }
});

test('AI launcher fits responsive widths and exposes keyboard focus', async ({ page }) => {
  await page.goto('http://localhost:3355/');
  for (const [width, height] of [[1920,1080],[1536,864],[1366,768],[1024,768],[768,1024],[390,844]]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, `launcher overflows at ${width}px`).toBeLessThanOrEqual(2);
    const cards = page.locator('.hl-ai-section .hl-ai-card');
    await expect(cards).toHaveCount(24);
    const cardWidth = await cards.first().evaluate((node) => node.getBoundingClientRect().width);
    expect(cardWidth, `card too narrow at ${width}px`).toBeGreaterThan(180);
  }
  const first = page.locator('.hl-ai-section .hl-ai-card').first();
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/\/ai-algorithms\/uniform-cost-search$/);
});

test('A* preview and reduced-motion behavior remain usable', async ({ page }) => {
  await page.goto('http://localhost:3355/');
  const card = page.locator('.hl-ai-card-astar');
  await card.hover();
  await expect(card.locator('.hl-ai-hint')).toHaveCSS('opacity', '1');
  await expect(card.locator('.ai-astar-path').first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card.locator('.ai-astar-path').first()).toHaveCSS('animation-name', 'none');
});

test('home cards animate AI and ML artwork for hover and keyboard focus', async ({ page }) => {
  await page.goto('http://localhost:3355/');
  const aiCard = page.locator('.hl-ai-section .hl-ai-card').first();
  await aiCard.hover();
  await expect(aiCard.locator('.ai-ill-node').first()).toHaveCSS('animation-name', 'hl-art-pop');
  const mlCard = page.locator('.hl-group .hl-home-card').first();
  await mlCard.focus();
  await expect(mlCard.locator('.hl-art-content :is(circle, rect, ellipse)').first()).toHaveCSS('animation-name', 'hl-art-pop');
  await expect(mlCard.locator('.hl-ai-arrow')).toHaveCSS('animation-name', 'hl-arrow-nudge');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(mlCard.locator('.hl-art-content :is(circle, rect, ellipse)').first()).toHaveCSS('animation-name', 'none');
});

test('every AI lab has a learning goal, path and concept check', async ({ page }) => {
  for (const lab of aiVirtualLabs) {
    const content = learningContent(lab.slug);
    expect(content.goal.length).toBeGreaterThan(15);
    expect(content.concepts).toHaveLength(2);
    expect(content.check.options).toHaveLength(3);
    expect(content.check.answer).toBeGreaterThanOrEqual(0);
  }
  await page.goto('http://localhost:3355/ai-algorithms/uniform-cost-search');
  await expect(page.getByRole('heading', { name: 'Learning Companion' })).toBeVisible();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('tab', { name: 'Practice' }).click();
  await expect(page.getByRole('heading', { name: 'Concept check' })).toBeVisible();
});

test('Q-learning companion reads the live engine and runs isolated experiments', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3355/ai-algorithms/q-learning');
  await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'Learning Companion' })).toBeVisible();
  await page.getByRole('tab', { name: 'Practice' }).click();
  await page.getByRole('radio', { name: 'Up', exact: true }).check();
  await page.getByRole('button', { name: 'Check with Step' }).click();
  await expect(page.getByText(/The agent chose/)).toBeVisible();
  const frame = page.frameLocator('iframe.ai-virtual-lab-frame');
  await frame.locator('#step').click();
  const answer = await frame.locator('body').evaluate(() => (window as Window & { AiLearningLive: { snapshot: () => { transition: { newQ: number } } } }).AiLearningLive.snapshot().transition.newQ);
  await page.getByRole('spinbutton', { name: 'Your new Q value' }).fill(String(answer));
  await page.getByRole('button', { name: 'Check calculation' }).click();
  await expect(page.getByText(/Correct: the new Q value/)).toBeVisible();
  await page.getByRole('tab', { name: 'Explore' }).click();
  await page.getByRole('button', { name: 'Compare 50 episodes' }).click();
  await expect(page.getByRole('heading', { name: 'Side-by-side result' })).toBeVisible();
  await page.getByRole('button', { name: 'Assess challenge' }).click();
  await expect(page.getByText(/Challenge passed|Not yet/)).toBeVisible();
  await page.getByRole('button', { name: 'Compare algorithms' }).click();
  await expect(page.getByText('SARSA', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try unseen grid' }).click();
  await expect(page.getByText(/Recent average reward/).last()).toBeVisible();
});

test('learning records, notebook and educator assignments persist without changing a lab', async ({ page }) => {
  await page.goto('http://localhost:3355/ai-algorithms/uniform-cost-search');
  await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('tab', { name: 'Practice' }).click();
  await page.getByRole('radio', { name: 'The node with the smallest accumulated cost' }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText(/Correct/)).toBeVisible();
  const frame = page.frameLocator('iframe.ai-virtual-lab-frame');
  await frame.locator('#step').click();
  await frame.locator('#step').click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Notebook' }).click();
  await page.getByRole('textbox', { name: 'Prediction' }).fill('The cheapest frontier node should be next.');
  await page.reload();
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('tab', { name: 'Notebook' }).click();
  await expect(page.getByRole('textbox', { name: 'Prediction' })).toHaveValue('The cheapest frontier node should be next.');
  await page.getByRole('tab', { name: 'Educator' }).click();
  await page.getByRole('button', { name: 'Create assignment link' }).click();
  await expect(page.getByText(/\?assignment=/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress CSV' }).click();
  expect((await download).suggestedFilename()).toBe('ai-lab-learning-report.csv');
  const learnerDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export learner report JSON' }).click();
  const learnerFile = await learnerDownload;
  expect(learnerFile.suggestedFilename()).toBe('ai-lab-learner-report.json');
  await page.getByLabel('Import learner reports').setInputFiles(await learnerFile.path());
  await expect(page.getByText('1 learner report imported.')).toBeVisible();
  await expect(page.getByText('Concepts needing support')).toBeVisible();
  await page.getByRole('tab', { name: 'Progress' }).click();
  await page.getByLabel('An agent moves right and receives −1. Which part is the reward?').selectOption('1');
  await page.getByLabel('If the next value is 4 and γ = 0.5, what is the discounted next value?').selectOption('0');
  await page.getByLabel('What does Q-learning use for the next-state target?').selectOption('1');
  await page.getByRole('button', { name: 'Find my next lab' }).click();
  await expect(page.getByRole('link', { name: 'SARSA Learning' })).toBeVisible();
});

test('sandbox runs are seeded, use the existing engines, and leave live Q state intact', async ({ page }) => {
  await page.goto('http://localhost:3355/ai-algorithms/q-learning');
  await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
  const result = await page.frameLocator('iframe.ai-virtual-lab-frame').locator('body').evaluate(() => {
    const lab = window as Window & { AiLearningLive: { snapshot: () => { steps: number; completed: number } }; AiLearningSandbox: { run: (options: object) => { history: unknown[]; environment: { goal: number }; q: number[][]; route: number[] } } };
    const before = lab.AiLearningLive.snapshot();
    const first = lab.AiLearningSandbox.run({ seed: 42, episodes: 8, maxSteps: 40 });
    const second = lab.AiLearningSandbox.run({ seed: 42, episodes: 8, maxSteps: 40 });
    const custom = lab.AiLearningSandbox.run({ seed: 42, episodes: 8, maxSteps: 40, environment: { size: 3, start: 0, goal: 8, walls: [4], penalties: [] } });
    const after = lab.AiLearningLive.snapshot();
    return { before: [before.steps, before.completed], after: [after.steps, after.completed], sameHistory: JSON.stringify(first.history) === JSON.stringify(second.history), customGoal: custom.environment.goal, customStates: custom.q.length, route: custom.route };
  });
  expect(result.before).toEqual(result.after);
  expect(result.sameHistory).toBe(true);
  expect(result.customGoal).toBe(8);
  expect(result.customStates).toBe(9);
  expect(result.route.length).toBeGreaterThan(0);
});

for (const lab of aiVirtualLabs) {
  test(`${lab.title} loads and responds`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => {
      if (new URL(request.url()).origin === 'http://localhost:3355')
        errors.push(`${request.url()}: ${request.failure()?.errorText}`);
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:3355${aiVirtualLabRoute(lab.slug)}`);
    await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: lab.title, exact: true })).toBeVisible();
    const frame = page.frameLocator('iframe.ai-virtual-lab-frame');
    await expect(frame.locator('.app')).toBeAttached();
    await expect(frame.locator('.controls, .side').first()).toBeAttached();
    expect(await frame.locator('body').evaluate(() => typeof (window as Window & { gsap?: unknown }).gsap)).toBe('object');
    const step = frame.locator('#step');
    if (await step.count() && await step.isEnabled()) await step.click();
    const reset = frame.locator('#reset');
    if (await reset.count() && await reset.isEnabled()) await reset.click();
    const run = frame.locator('#run');
    if (await run.count() && await run.isEnabled()) {
      await run.click();
      const pause = frame.locator('#pause');
      if (await pause.count() && await pause.isEnabled()) await pause.click();
      else if (await run.isEnabled() && /pause/i.test(await run.innerText())) await run.click();
    }
    expect(errors, errors.join('\n')).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}

test('saved Bayesian network opens in inference lab on the same origin', async ({ page }) => {
  await page.goto('http://localhost:3355/ai-algorithms/bayesian-network-construction');
  await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
  const frame = page.frameLocator('iframe.ai-virtual-lab-frame');
  await frame.locator('#useInference').click();
  await expect(page).toHaveURL(/\/ai-algorithms\/bayesian-network-inference\?saved=1$/);
  await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
  const loaded = await page.frameLocator('iframe.ai-virtual-lab-frame').locator('body').innerText();
  expect(loaded).not.toContain('Saved network could not be loaded');
});

test('all lab workspaces fit the production desktop breakpoints', async ({ page }) => {
  test.setTimeout(240000);
  for (const lab of aiVirtualLabs) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:3355${aiVirtualLabRoute(lab.slug)}`);
    await expect(page.locator('iframe.ai-virtual-lab-frame.is-ready')).toBeVisible({ timeout: 20000 });
    for (const width of [1920, 1600, 1440, 1366, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.frameLocator('iframe.ai-virtual-lab-frame').locator('body').evaluate(
        (body) => body.ownerDocument.documentElement.scrollWidth - body.ownerDocument.documentElement.clientWidth,
      );
      expect(overflow, `${lab.title} overflows at ${width}px`).toBeLessThanOrEqual(2);
    }
  }
});
