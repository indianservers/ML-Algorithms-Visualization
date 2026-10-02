import { describe, expect, it } from 'vitest';
import { getAllAlgorithms } from '../src/data/implementationStatus';
import { algorithmBreadcrumbs, categoryCatalogUrl } from '../src/data/algorithmBreadcrumbs';

describe('algorithm breadcrumbs', () => {
  it('links every registered page to home and its catalog category', () => {
    for (const item of getAllAlgorithms()) {
      const crumbs = algorithmBreadcrumbs(item, '');
      expect(crumbs).toHaveLength(3);
      expect(crumbs[0]?.to, item.route).toBe('/');
      expect(crumbs[1]?.to, item.route).toBe(categoryCatalogUrl(item.category));
      expect(crumbs[2]?.label, item.route).toBe(item.label);
      expect(crumbs[2]?.to, item.route).toBeUndefined();
    }
  });

  it('links the algorithm and identifies the selected tab', () => {
    const item = getAllAlgorithms().find((entry) => entry.route === '/ml/supervised/logistic-regression');
    expect(item).toBeDefined();
    const crumbs = algorithmBreadcrumbs(item!, '?tab=dataset');
    expect(crumbs.map((crumb) => crumb.label)).toEqual([
      'Home', 'Supervised Learning / Classification', 'Logistic Regression', 'Dataset',
    ]);
    expect(crumbs[2]?.to).toBe(item?.route);
    expect(crumbs[3]?.to).toBeUndefined();
  });
});
