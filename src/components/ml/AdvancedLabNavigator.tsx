import { Link, useLocation } from 'react-router-dom';
import { advancedLabFeatures } from '../../data/advancedLabFeatures';
import { Card } from '../common/Card';

export function AdvancedLabNavigator({ compact = false }: { compact?: boolean }) {
  const location = useLocation();
  const items = compact ? advancedLabFeatures.slice(0, 9) : advancedLabFeatures;

  return (
    <Card title="Advanced ML Suite" subtitle="Connected tools for dataset preparation, training, inference, comparison, explainability, and optimization.">
      <div className={`grid gap-2 ${compact ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-2 xl:grid-cols-5'}`}>
        {items.map(({ label, route, summary, icon: Icon }) => {
          const active = location.pathname === route;
          return (
            <Link
              key={route}
              to={route}
              className={`rounded border p-3 transition-colors ${
                active
                  ? 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30'
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon size={16} className={active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-500'} />
                <span className="text-sm font-black text-gray-900 dark:text-white">{label}</span>
              </div>
              {!compact && <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">{summary}</p>}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
