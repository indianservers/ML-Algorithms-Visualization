import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BrainCircuit, Database, Download, FlaskConical, GitCompare, Play, Save, Settings2, Upload, Wand2 } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadDatasets, loadExperiments, type Experiment, type SavedDataset } from '../../../stores/experimentStore';
import {
  bestFitSummary,
  loadActiveDatasets,
  loadWorkspaceNotes,
  saveWorkspaceNotes,
  scoreDatasetForAlgorithms,
  type ActiveDatasetEntry,
} from '../../../lib/experimentWorkspace';
import { buildTrainingBlueprint } from '../../../lib/modelZoo';

function downloadJson(filename: string, payload: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function savedToLoaded(dataset: SavedDataset) {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description || `${dataset.data.length} saved rows from browser storage.`,
    columns: dataset.columns,
    data: dataset.data,
    target: dataset.target,
    type: dataset.taskType as never,
    kind: 'upload' as const,
  };
}

export default function ExperimentWorkspacePage() {
  const [activeDatasets, setActiveDatasets] = useState<ActiveDatasetEntry[]>(() => loadActiveDatasets());
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [notes, setNotes] = useState(() => loadWorkspaceNotes());

  useEffect(() => {
    let active = true;
    Promise.all([loadDatasets(), loadExperiments()]).then(([datasets, runs]) => {
      if (!active) return;
      setSavedDatasets(datasets.sort((a, b) => (b.updatedAt ?? b.savedAt) - (a.updatedAt ?? a.savedAt)));
      setExperiments(runs.sort((a, b) => b.createdAt - a.createdAt));
      setSelectedDatasetId(current => current || activeDatasets[0]?.dataset.id || datasets[0]?.id || '');
    });
    const refreshActive = () => setActiveDatasets(loadActiveDatasets());
    window.addEventListener('ml:algorithm-dataset-loaded', refreshActive);
    window.addEventListener('storage', refreshActive);
    return () => {
      active = false;
      window.removeEventListener('ml:algorithm-dataset-loaded', refreshActive);
      window.removeEventListener('storage', refreshActive);
    };
  }, [activeDatasets]);

  const loadedCandidates = [
    ...activeDatasets.map(item => item.dataset),
    ...savedDatasets.map(savedToLoaded),
  ];
  const selectedDataset = loadedCandidates.find(dataset => dataset.id === selectedDatasetId) ?? loadedCandidates[0];
  const fits = useMemo(() => selectedDataset ? scoreDatasetForAlgorithms(selectedDataset, 12) : [], [selectedDataset]);
  const blueprint = useMemo(() => buildTrainingBlueprint(selectedDataset), [selectedDataset]);
  const recentExperiments = experiments.slice(0, 6);
  const algorithmCount = new Set(experiments.map(item => item.algorithmId)).size;
  const pipeline = [
    { label: 'Dataset', value: selectedDataset ? selectedDataset.name : 'Load data', to: '/ml/lab/dataset-manager', icon: Database },
    { label: 'Train', value: 'Run model', to: '/ml/lab/train-your-model', icon: Play },
    { label: 'Visualize', value: 'Compare metrics', to: '/ml/lab/model-comparison', icon: BarChart3 },
    { label: 'Infer', value: 'Batch predictions', to: '/ml/lab/batch-inference', icon: BrainCircuit },
    { label: 'Tune', value: 'Search params', to: '/ml/lab/hyperparameter-tuning', icon: Settings2 },
    { label: 'Save', value: `${experiments.length} runs`, to: '/ml/lab/saved-experiments', icon: Save },
  ];

  const saveNotes = (value: string) => {
    setNotes(value);
    saveWorkspaceNotes(value);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader
        title="Unified Experiment Workspace"
        subtitle="One workspace for dataset selection, algorithm fit, training routes, visualization, inference, saved runs, and reproducible notes."
        badge="Browser Trainable"
        category="Lab"
        icon={<FlaskConical size={22} />}
        showAlgorithmTools={false}
      />

      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel dataset={selectedDataset} />

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Active datasets', activeDatasets.length],
          ['Saved datasets', savedDatasets.length],
          ['Saved runs', experiments.length],
          ['Algorithms used', algorithmCount],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
            <p className="mt-1 font-mono text-3xl font-black text-gray-900 dark:text-white">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <Card title="Workspace Dataset" subtitle={selectedDataset ? bestFitSummary(selectedDataset) : 'No dataset is active yet.'} icon={<Database size={14} />}>
            <div className="space-y-3 text-sm">
              <select value={selectedDataset?.id ?? ''} onChange={event => setSelectedDatasetId(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                {activeDatasets.length > 0 && <optgroup label="Active on algorithm pages">
                  {activeDatasets.map(item => <option key={`${item.route}-${item.dataset.id}`} value={item.dataset.id}>{item.dataset.name}</option>)}
                </optgroup>}
                {savedDatasets.length > 0 && <optgroup label="Saved datasets">
                  {savedDatasets.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}
                </optgroup>}
              </select>
              {selectedDataset ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Rows</p><p className="font-mono font-bold">{selectedDataset.data.length}</p></div>
                  <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Columns</p><p className="font-mono font-bold">{selectedDataset.columns.length}</p></div>
                  <div className="rounded bg-gray-50 p-2 dark:bg-gray-900"><p className="text-gray-500">Target</p><p className="truncate font-mono font-bold">{selectedDataset.target ?? '-'}</p></div>
                </div>
              ) : (
                <InfoBox type="info">Load or save a dataset to start a reproducible workspace.</InfoBox>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Link to="/ml/lab/dataset-manager" className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 font-bold dark:border-gray-700"><Upload size={13} /> Dataset Manager</Link>
                <button onClick={() => selectedDataset && downloadJson(`${selectedDataset.name}-workspace.json`, { dataset: selectedDataset, fits, experiments: recentExperiments, notes })} disabled={!selectedDataset} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 font-bold disabled:opacity-40 dark:border-gray-700"><Download size={13} /> Export</button>
              </div>
            </div>
          </Card>

          <Card title="Experiment Notes">
            <textarea value={notes} onChange={event => saveNotes(event.target.value)} rows={8} className="w-full rounded border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900" placeholder="Run goal, dataset version, model choice, parameter idea, result notes..." />
          </Card>

          <Card title="Blueprint Readiness">
            <div className="space-y-3 text-sm">
              <div className="rounded bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                <p className="text-xs font-bold uppercase">Readiness</p>
                <p className="font-mono text-3xl font-black">{blueprint.readinessScore}/100</p>
              </div>
              {blueprint.pipeline.map(step => (
                <div key={step.stage} className="rounded border border-gray-200 p-2 dark:border-gray-700">
                  <p className="font-bold">{step.stage} <span className="text-xs font-normal text-gray-500">/{step.status}</span></p>
                  <p className="text-xs text-gray-500">{step.action}</p>
                </div>
              ))}
            </div>
          </Card>

          <InfoBox type="success" title="Common + Algorithm Specific">
            This page is the common workspace. Each algorithm page also shows a compact workspace panel using the same loaded dataset and fit scoring.
          </InfoBox>
        </div>

        <div className="space-y-4">
          <Card title="Pipeline Board" subtitle="Move through the complete ML flow without losing dataset context.">
            <div className="grid gap-3 md:grid-cols-3">
              {pipeline.map(({ label, value, to, icon: Icon }) => (
                <Link key={label} to={to} className="rounded border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                  <div className="mb-3 flex items-center justify-between">
                    <Icon size={18} className="text-blue-600" />
                    <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600 dark:bg-gray-900 dark:text-gray-300">{label}</span>
                  </div>
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Best Fit Algorithms" subtitle={selectedDataset ? `${selectedDataset.name} is best suited for these routes.` : 'Select a dataset to score algorithm fit.'} icon={<Wand2 size={14} />}>
            <div className="grid gap-2 md:grid-cols-2">
              {fits.map(item => (
                <Link key={item.algorithm.route} to={item.algorithm.route} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-gray-200 p-3 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{item.algorithm.label}</span>
                    <span className="block truncate text-xs text-gray-500">{item.algorithm.category} / {item.expectedTask}</span>
                    <span className="mt-1 block truncate text-xs text-gray-500">{item.errors[0] ?? item.warnings[0] ?? item.notes[0] ?? 'Dataset shape looks compatible.'}</span>
                  </span>
                  <span className="font-mono text-xl font-black text-gray-800 dark:text-gray-100">{Math.round(item.score)}</span>
                </Link>
              ))}
              {!fits.length && <p className="text-sm text-gray-500">No algorithm fits yet.</p>}
            </div>
          </Card>

          <Card title="Recent Saved Experiments" subtitle="Runs saved from algorithm pages and labs.">
            <div className="space-y-2">
              {recentExperiments.map(experiment => (
                <div key={experiment.id} className="grid gap-2 rounded border border-gray-200 p-3 text-sm dark:border-gray-700 md:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900 dark:text-white">{experiment.name}</p>
                    <p className="truncate text-xs text-gray-500">{experiment.algorithmName} / {new Date(experiment.createdAt).toLocaleString()}</p>
                  </div>
                  <Link to="/ml/lab/saved-experiments" className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs font-bold dark:border-gray-700"><GitCompare size={13} /> Compare</Link>
                </div>
              ))}
              {!recentExperiments.length && <p className="text-sm text-gray-500">No saved experiments yet. Train or save a run from an algorithm page.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
