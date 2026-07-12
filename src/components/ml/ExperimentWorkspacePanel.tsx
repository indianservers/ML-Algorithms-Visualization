import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BrainCircuit, Database, FlaskConical, GitCompare, Play, Save, Wand2 } from 'lucide-react';
import { Card, InfoBox } from '../common/Card';
import type { LoadedAlgorithmDataset } from '../../data/algorithmDatasets';
import { getAlgorithmByRoute } from '../../data/implementationStatus';
import {
  bestFitSummary,
  loadActiveDatasetMap,
  scoreDatasetForAlgorithms,
} from '../../lib/experimentWorkspace';

export function ExperimentWorkspacePanel({ route, category, compact = false }: { route: string; category: string; compact?: boolean }) {
  const [activeMap, setActiveMap] = useState<Record<string, LoadedAlgorithmDataset>>(() => loadActiveDatasetMap());
  const currentAlgorithm = getAlgorithmByRoute(route);
  const activeDataset = activeMap[route] ?? Object.values(activeMap)[0];
  const fits = useMemo(() => activeDataset ? scoreDatasetForAlgorithms(activeDataset, compact ? 4 : 6) : [], [activeDataset, compact]);
  const currentFit = fits.find(item => item.algorithm.route === route);
  const healthTone = currentFit?.errors.length
    ? 'error'
    : currentFit?.warnings.length ? 'warning' : activeDataset ? 'success' : 'info';

  useEffect(() => {
    const refresh = () => setActiveMap(loadActiveDatasetMap());
    window.addEventListener('ml:algorithm-dataset-loaded', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ml:algorithm-dataset-loaded', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (!currentAlgorithm && category !== 'Lab') return null;

  return (
    <Card
      title={compact ? 'Experiment Workspace' : 'Unified Experiment Workspace'}
      subtitle={activeDataset ? `${activeDataset.name}: ${bestFitSummary(activeDataset)}` : 'Load a dataset to connect training, visualization, comparison, and inference.'}
      icon={<FlaskConical size={14} />}
      actions={<Link to="/ml/lab/experiment-workspace" className="rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white">Open</Link>}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2 text-sm">
          {activeDataset ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Rows</p><p className="font-mono font-bold">{activeDataset.data.length}</p></div>
                <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Columns</p><p className="font-mono font-bold">{activeDataset.columns.length}</p></div>
                <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Target</p><p className="truncate font-mono font-bold">{activeDataset.target ?? '-'}</p></div>
              </div>
              <InfoBox type={healthTone} title={currentAlgorithm ? `${currentAlgorithm.label} Fit` : 'Dataset Fit'}>
                {currentFit
                  ? currentFit.errors[0] ?? currentFit.warnings[0] ?? `Ready for ${currentAlgorithm?.label}. Score ${Math.round(currentFit.score)}/100.`
                  : `Loaded dataset is available for workspace experiments.`}
              </InfoBox>
            </>
          ) : (
            <InfoBox type="info" title="No Dataset Loaded">
              Use Dataset Manager or the Load Dataset panel on any algorithm page to activate data for this workspace.
            </InfoBox>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Train', '/ml/lab/train-your-model', Play],
              ['Compare', '/ml/lab/model-comparison', GitCompare],
              ['Infer', '/ml/lab/batch-inference', BrainCircuit],
              ['Saved', '/ml/lab/saved-experiments', Save],
            ].map(([label, to, Icon]) => (
              <Link key={label as string} to={to as string} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-2 py-2 font-bold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                <Icon size={13} />
                {label as string}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Best Algorithm Fits</p>
            <Link to="/ml/lab/automl-concept" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"><Wand2 size={12} /> AutoML</Link>
          </div>
          <div className="space-y-2">
            {fits.map(item => (
              <Link key={item.algorithm.route} to={item.algorithm.route} className={`grid grid-cols-[1fr_auto] gap-2 rounded border px-3 py-2 text-xs hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 ${item.algorithm.route === route ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-gray-200 dark:border-gray-700'}`}>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-gray-900 dark:text-white">{item.algorithm.label}</span>
                  <span className="block truncate text-gray-500">{item.algorithm.category} / {item.expectedTask}</span>
                </span>
                <span className="font-mono font-black text-gray-700 dark:text-gray-200">{Math.round(item.score)}</span>
              </Link>
            ))}
            {!fits.length && (
              <Link to="/ml/lab/dataset-manager" className="flex min-h-10 items-center justify-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-xs font-bold text-gray-500 dark:border-gray-700">
                <Database size={13} /> Load Dataset
              </Link>
            )}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
          {[
            ['Dataset', 'clean and versioned'],
            ['Training', 'repeatable runs'],
            ['Visualization', 'metrics and charts'],
            ['Inference', 'single or batch predictions'],
          ].map(([label, value]) => (
            <div key={label} className="rounded bg-gray-50 p-2 dark:bg-gray-900">
              <p className="font-bold text-gray-500">{label}</p>
              <p className="text-gray-700 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <BarChart3 size={13} />
        <span>Common workspace plus algorithm-specific context: the same loaded dataset follows you between algorithm pages.</span>
      </div>
    </Card>
  );
}
