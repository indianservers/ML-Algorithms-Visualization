import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.env.LAB_BASE_URL ?? 'http://localhost:3355';
const source = readFileSync(new URL('../src/data/navigation.ts', import.meta.url), 'utf8');
const routes = [...new Set([...source.matchAll(/route: '(\/ml\/[^']+)'/g)].map(match => match[1]))];
const browser = await chromium.launch({ headless: true });
const index = { next: 0 };
const results = [];
const kinds = ['learn', 'visualize', 'dataset', 'train', 'build / train', 'metrics', 'compare', 'explain', 'transform'];

async function worker() {
  const page = await browser.newPage();
  while (index.next < routes.length) {
    const route = routes[index.next++];
    try {
      await page.goto(`${base}${route}?tab=learn`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction((labels) => {
        const groups = new Map();
        for (const button of document.querySelectorAll('#main-content button')) {
          const kind = (button.textContent ?? '').toLowerCase().replace(/^[^a-z]+/, '').trim();
          if (!labels.includes(kind) || !button.parentElement) continue;
          groups.set(button.parentElement, (groups.get(button.parentElement) ?? 0) + 1);
        }
        return [...groups.values()].some(count => count >= 4);
      }, kinds, { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(120);
      const result = await page.evaluate((labels) => {
        const normalize = (text) => text.toLowerCase().replace(/^[^a-z]+/, '').trim();
        const groups = new Map();
        for (const button of document.querySelectorAll('#main-content button')) {
          const kind = normalize(button.textContent ?? '');
          if (!labels.includes(kind)) continue;
          const parent = button.parentElement;
          if (!parent) continue;
          const current = groups.get(parent) ?? [];
          current.push({ kind, icon: Boolean(button.querySelector('svg, .ml-tab-icon')), decorated: Boolean(parent.closest('[data-ml-lesson-tabs]')) });
          groups.set(parent, current);
        }
        const tabs = [...groups.values()].filter(group => group.length >= 4).sort((a, b) => b.length - a.length)[0];
        return tabs ? { tabs: tabs.length, missing: tabs.filter(tab => !tab.icon).map(tab => tab.kind), decorated: tabs.every(tab => tab.decorated) } : { tabs: 0, missing: [], decorated: false };
      }, kinds);
      results.push({ route, ...result });
    } catch (error) {
      results.push({ route, error: String(error) });
    }
  }
  await page.close();
}

await Promise.all(Array.from({ length: 4 }, worker));
await browser.close();
results.sort((a, b) => a.route.localeCompare(b.route));
const withTabs = results.filter(result => result.tabs);
const missing = withTabs.filter(result => result.missing.length || !result.decorated);
console.log(JSON.stringify({ routes: routes.length, withTabs: withTabs.length, missing, noTabs: results.filter(result => result.tabs === 0).map(result => result.route), errors: results.filter(result => result.error) }, null, 2));
if (missing.length || results.some(result => result.error)) process.exitCode = 1;
