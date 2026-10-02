import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AlgorithmNavItem } from '../../data/implementationStatus';
import { algorithmBreadcrumbs } from '../../data/algorithmBreadcrumbs';

export function AlgorithmBreadcrumbs({ item, pathname, search }: { item?: AlgorithmNavItem; pathname: string; search: string }) {
  const pageName = pathname.split('/').filter(Boolean).at(-1)?.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) ?? 'Page';
  const crumbs = item ? algorithmBreadcrumbs(item, search) : [
    { label: 'Home', to: '/' },
    { label: pageName, to: undefined },
  ];

  return (
    <nav className="app-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={`${index}-${crumb.label}`}>
            {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
            {crumb.to ? (
              <Link to={crumb.to}>
                {index === 0 && <Home size={13} aria-hidden="true" />}
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
