import { test, expect } from '@playwright/test';
import { aiVirtualLabs, aiVirtualLabRoute } from '../src/features/ai-virtual-labs/catalog';

for (const width of [360, 390, 768]) {
  test(`all live labs fit and remain interactive at ${width}px`, async ({ page }) => {
    test.setTimeout(240000);
    await page.setViewportSize({ width, height: 844 });
    for (const lab of aiVirtualLabs) {
      await page.goto(`http://localhost:3355${aiVirtualLabRoute(lab.slug)}`);
      const iframe = page.locator('.ai-virtual-lab-frame.is-ready');
      await expect(iframe).toBeVisible({ timeout: 30000 });
      expect(await iframe.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(500);
      expect(await page.locator('.ai-learn').evaluate(el => !!(el.compareDocumentPosition(document.querySelector('iframe')!) & Node.DOCUMENT_POSITION_PRECEDING))).toBe(true);
      const frame = page.frameLocator('iframe');
      expect(await frame.locator('html').evaluate(el => el.scrollWidth - el.clientWidth), lab.title).toBeLessThanOrEqual(2);
      const step = frame.locator('#step');
      if (await step.count() && await step.isEnabled()) await frame.locator('.mobile-lab-dock [data-action="step"]').click();
      const reset = frame.locator('#reset');
      if (await reset.count() && await reset.isEnabled()) await frame.locator('.mobile-lab-dock [data-action="reset"]').click();
    }
  });
}
