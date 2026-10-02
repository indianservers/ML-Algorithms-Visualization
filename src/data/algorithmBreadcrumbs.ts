import type { AlgorithmNavItem } from './implementationStatus';

const categoryTitles: Record<string, string> = {
  'Supervised - Regression': 'Supervised Learning / Regression',
  'Supervised - Classification': 'Supervised Learning / Classification',
  Clustering: 'Unsupervised Learning / Clustering',
  'AI Algorithms Virtual Labs': 'AI Virtual Labs',
  Lab: 'Algorithm Lab',
};

export function categoryCatalogUrl(category: string): string {
  return `/?category=${encodeURIComponent(category)}`;
}

export function algorithmBreadcrumbs(item: AlgorithmNavItem, search: string) {
  const tab = new URLSearchParams(search).get('tab');
  const readableTab = tab && /^[a-z][a-z-]*$/i.test(tab)
    ? tab.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null;

  return [
    { label: 'Home', to: '/' },
    { label: categoryTitles[item.category] ?? item.category, to: categoryCatalogUrl(item.category) },
    { label: item.label, to: readableTab ? item.route : undefined },
    ...(readableTab ? [{ label: readableTab, to: undefined }] : []),
  ];
}
