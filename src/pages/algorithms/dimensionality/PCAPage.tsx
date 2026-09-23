import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  BookOpen,
  Database,
  GitCompare,
  HelpCircle,
  Minimize2,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { MetricsPanel } from '../../../components/ml/MetricsPanel';
import { LabLessonPanel, isLabTab, useLabTabs } from '../../../components/common/LabTabs';
import {
  pca,
  pcaLoadings,
  reconstructFromComponents,
  topLoadingFeatures,
  transformPca,
} from '../../../lib/algorithms/dimensionality/pca';
import {
  componentsForVariance,
  constantFeatureWarning,
  correlationMatrix,
  reconstructionMse,
  type FeatureScaleMode,
} from '../../../lib/dimensionality/dimensionalityPrep';
import { getDimensionalityCatalog, type DimensionalityCatalogId } from '../../../lib/dimensionality/dimensionalityDatasets';
import { downloadEmbeddingCsv, embeddingToLoadedDataset } from '../../../lib/dimensionality/dimensionalityExport';
import { useActiveDimensionality } from '../../../lib/dimensionality/useActiveDimensionality';
import { DimensionalityComparePanel, DimensionalitySummary } from '../../../components/ml/DimensionalityComparePanel';
import {
  componentOrthogonality,
  distancePreservation,
  neighborhoodAtK,
  posthocKnnAccuracy,
} from '../../../lib/dimensionality/dimensionalityDiagnostics';
import { getAlgorithmByRoute } from '../../../data/implementationStatus';
import './PCAPage.css';

const LearningCompanion = lazy(() =>
  import('../../../components/learning/LearningCompanion').then((module) => ({ default: module.LearningCompanion })),
);
const AlgorithmDatasetLoader = lazy(() =>
  import('../../../components/dataset/AlgorithmDatasetLoader').then((module) => ({ default: module.AlgorithmDatasetLoader })),
);
const ExperimentWorkspacePanel = lazy(() =>
  import('../../../components/ml/ExperimentWorkspacePanel').then((module) => ({ default: module.ExperimentWorkspacePanel })),
);
const AlgorithmFAQ = lazy(() =>
  import('../../../components/learning/AlgorithmFAQ').then((module) => ({ default: module.AlgorithmFAQ })),
);
const AlgorithmIntroduction = lazy(() =>
  import('../../../components/learning/AlgorithmIntroduction').then((module) => ({ default: module.AlgorithmIntroduction })),
);

const ROUTE = '/ml/dimensionality-reduction/pca';
const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#d97706', '#0891b2'];
const catalog = getDimensionalityCatalog();

const PCA_TABS = [
  { id: 'Learn', icon: BookOpen },
  { id: 'Visualize', icon: Minimize2 },
  { id: 'Dataset', icon: Database },
  { id: 'Train', icon: Play },
  { id: 'Infer', icon: Sparkles },
  { id: 'Metrics', icon: BarChart3 },
  { id: 'Compare', icon: GitCompare },
  { id: 'Challenge', icon: Trophy },
  { id: 'Explain', icon: HelpCircle },
] as const;

function columnStats(X: number[][], j: number) {
  const values = X.map((row) => row[j] ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return { min, max, mean, span: Math.max(1e-6, max - min) };
}

export default function PCAPage() {
  const { tab, setTab } = useLabTabs('Visualize', '', []);
  const algorithm = getAlgorithmByRoute(ROUTE);
  const handoff = useActiveDimensionality(ROUTE);
  const [dataset, setDataset] = useState<DimensionalityCatalogId>('d-iris');
  const [components, setComponents] = useState(2);
  const [scale, setScale] = useState<FeatureScaleMode>('standard');
  const [varianceTarget, setVarianceTarget] = useState(0);
  const [colorBy, setColorBy] = useState(true);
  const [runToken, setRunToken] = useState(0);
  const [status, setStatus] = useState<'NOT RUN' | 'COMPLETED' | 'STALE'>('NOT RUN');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pcX, setPcX] = useState(0);
  const [pcY, setPcY] = useState(1);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [inferValues, setInferValues] = useState<number[]>([]);

  const prepared = useMemo(() => {
    if (handoff) {
      return {
        name: handoff.name,
        features: handoff.featureNames,
        X: handoff.X,
        labels: handoff.y ?? handoff.X.map(() => 0),
        ignored: handoff.ignored,
        target: handoff.target,
      };
    }
    const item = catalog.find((entry) => entry.id === dataset) ?? catalog[3];
    return {
      name: item.name,
      features: item.featureNames,
      X: item.X,
      labels: item.y ?? item.X.map(() => 0),
      ignored: item.targetName ? [item.targetName] : [],
      target: item.targetName,
    };
  }, [dataset, handoff]);

  const spec = useMemo(
    () => ({
      name: prepared.name,
      rows: prepared.X.length,
      features: prepared.features,
      X: prepared.X,
      labels: prepared.labels,
      scale,
      components,
      varianceTarget,
    }),
    [prepared, scale, components, varianceTarget],
  );

  const { full, runtimeMs } = useMemo(() => {
    const start = performance.now();
    const fit = pca(spec.X, spec.features.length, spec.scale);
    return { full: fit, runtimeMs: performance.now() - start };
  }, [spec, runToken]);

  const autoK = varianceTarget > 0 ? componentsForVariance(full.explainedVarianceRatio, varianceTarget) : components;
  const k = Math.min(Math.max(1, varianceTarget > 0 ? autoK : components), prepared.features.length);
  const result = useMemo(() => pca(spec.X, k, spec.scale), [spec, k, runToken]);
  const corr = useMemo(() => correlationMatrix(prepared.X), [prepared.X]);
  const loadings = pcaLoadings(result, prepared.features);
  const top = topLoadingFeatures(result, prepared.features, 0, 3);
  const xIndex = Math.min(pcX, Math.max(0, k - 1));
  const yIndex = Math.min(pcY, Math.max(0, k - 1));
  const projection = result.projections.map((row, i) => ({
    pc1: row[xIndex] ?? 0,
    pc2: k < 2 ? 0 : (row[yIndex] ?? 0),
    label: prepared.labels[i],
    index: i,
  }));
  const variance = full.explainedVarianceRatio.map((ratio, i) => ({
    component: `PC${i + 1}`,
    explained: Number((ratio * 100).toFixed(2)),
    cumulative: Number((full.cumulativeExplainedVariance[i] * 100).toFixed(2)),
    eigenvalue: full.eigenvalues[i],
  }));
  const reconstructionRows = useMemo(() => {
    if (!isLabTab(tab, 'Metrics')) return [];
    return full.components.map((_, index) => {
      const used = index + 1;
      const reconstructed = reconstructFromComponents(
        full.projections.map((row) => row.slice(0, used)),
        full.components.slice(0, used),
        full.mean,
        full.scale,
      );
      return {
        components: used,
        mse: Number(reconstructionMse(prepared.X, reconstructed).toFixed(4)),
        explained: Number((full.cumulativeExplainedVariance[index] * 100).toFixed(2)),
      };
    });
  }, [tab, full, prepared.X]);
  const threshold = reconstructionRows.find((row) => row.explained >= 95)?.components ?? prepared.features.length;
  const warning = constantFeatureWarning(result.scale.constantFeatures);
  const featureRanges = useMemo(
    () => prepared.features.map((_, j) => columnStats(prepared.X, j)),
    [prepared.X, prepared.features],
  );
  const transformedNew = useMemo(() => {
    if (inferValues.length !== prepared.features.length) return null;
    if (inferValues.some((value) => !Number.isFinite(value))) return null;
    return transformPca([inferValues], result)[0];
  }, [inferValues, prepared.features.length, result]);
  const selected = prepared.X[selectedIndex];
  const selectedScore = result.projections[selectedIndex];
  const retained = result.cumulativeExplainedVariance.at(-1) ?? 0;

  useEffect(() => {
    setStatus((current) => (current === 'NOT RUN' ? current : 'STALE'));
  }, [dataset, scale, components, varianceTarget, handoff]);

  useEffect(() => {
    if (runToken === 0) return;
    setStatus('COMPLETED');
  }, [result, runToken]);

  useEffect(() => {
    setSelectedIndex(0);
    setPcX(0);
    setPcY(prepared.features.length > 1 ? 1 : 0);
    setInferValues(featureRanges.map((item) => Number(item.mean.toFixed(3))));
  }, [prepared.name, prepared.features, featureRanges]);

  const runPca = () => {
    setRunToken((value) => value + 1);
    setStatus('COMPLETED');
  };

  const exportEmbedding = () => {
    const shared = {
      id: `pca-${dataset}`,
      name: `PCA ${k} of ${prepared.name}`,
      prefix: 'PC' as const,
      embedding: result.projections,
      labels: prepared.target ? prepared.labels : undefined,
      history: `${prepared.name} → ${scale} → PCA → ${k} components`,
    };
    downloadEmbeddingCsv(
      'pca-embedding.csv',
      embeddingToLoadedDataset({ ...shared, sendRoute: '/ml/supervised/knn-classification' }),
    );
    embeddingToLoadedDataset({ ...shared, sendRoute: '/ml/clustering/k-means' });
  };

  const statusClass = status === 'COMPLETED' ? 'done' : status === 'STALE' ? 'stale' : '';

  return (
    <div className="pca-lab">
      <PageHeader
        title="Principal Component Analysis"
        subtitle="Fit a linear subspace, inspect the projection, then transform a new sample with the same scaler and components."
        badge="Intermediate"
        category="Dimensionality Reduction"
        icon={<Minimize2 size={22} />}
        showAlgorithmIntro={false}
        showAlgorithmTools={false}
      />

      <nav className="pca-tabs" role="tablist" aria-label="PCA lab sections">
        {PCA_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isLabTab(tab, item.id)}
              className={isLabTab(tab, item.id) ? 'pca-tab-on' : ''}
              onClick={() => setTab(item.id)}
            >
              <Icon size={13} />
              {item.id}
            </button>
          );
        })}
      </nav>

      <div className="pca-strip">
        <span className={`pca-status ${statusClass}`}>{status}</span>
        <span>{prepared.name}</span>
        <span>
          k = <b>{k}</b>
        </span>
        <span>
          variance <b>{(retained * 100).toFixed(1)}%</b>
        </span>
        <span>
          {prepared.X.length} × {prepared.features.length}
        </span>
        <button type="button" className="primary" onClick={runPca}>
          Run PCA
        </button>
        <button type="button" onClick={() => setTab('Train')}>
          Train
        </button>
        <button type="button" onClick={() => setTab('Infer')}>
          Infer
        </button>
        <button type="button" onClick={() => setTab('Visualize')}>
          Visualize
        </button>
      </div>

      {isLabTab(tab, 'Learn') && (
        <div className="space-y-4">
          {algorithm && (
            <Suspense fallback={null}>
              <AlgorithmIntroduction algorithm={algorithm} />
            </Suspense>
          )}
          <LabLessonPanel tab="Learn" route={ROUTE} />
          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}>
            <LearningCompanion route={ROUTE} compact sections={['lessons', 'companion']} />
          </Suspense>
        </div>
      )}

      {isLabTab(tab, 'Visualize') && (
        <div className="space-y-4">
          <div className="pca-grid-charts">
            <Card title={`Projection (PC${xIndex + 1} vs PC${yIndex + 1})`}>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2">
                  X
                  <select
                    value={xIndex}
                    onChange={(event) => setPcX(Number(event.target.value))}
                    className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                  >
                    {result.components.map((_, i) => (
                      <option key={i} value={i}>
                        PC{i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  Y
                  <select
                    value={yIndex}
                    onChange={(event) => setPcY(Number(event.target.value))}
                    className="rounded border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
                  >
                    {result.components.map((_, i) => (
                      <option key={i} value={i}>
                        PC{i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={colorBy} onChange={(event) => setColorBy(event.target.checked)} />
                  Color by label
                </label>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pc1" name={`PC${xIndex + 1}`} tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="pc2" name={`PC${yIndex + 1}`} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Scatter
                    data={projection}
                    fill="#2563eb"
                    isAnimationActive={false}
                    onClick={(point) => {
                      const payload = point as { payload?: { index?: number }; index?: number };
                      const index = payload.payload?.index ?? payload.index;
                      if (typeof index === 'number') setSelectedIndex(index);
                    }}
                  >
                    {projection.map((point) => (
                      <Cell
                        key={point.index}
                        fill={colorBy ? colors[Math.max(point.label, 0) % colors.length] : '#2563eb'}
                        stroke={selectedIndex === point.index ? '#0f172a' : 'transparent'}
                        strokeWidth={selectedIndex === point.index ? 2 : 0}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500">Click a point to inspect original features. Labels color the plot only — they never enter the covariance matrix.</p>
            </Card>
            <Card title="Scree + cumulative variance">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={variance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="component" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="explained" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cumulative" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div className="pca-grid-2">
            <Card title={`Sample ${selectedIndex + 1}`}>
              <div className="pca-inspector">
                {prepared.features.map((name, j) => (
                  <span key={name}>
                    {name}
                    <b>{(selected?.[j] ?? 0).toFixed(3)}</b>
                  </span>
                ))}
                {result.components.map((_, i) => (
                  <span key={`pc-${i}`}>
                    PC{i + 1}
                    <b>{(selectedScore?.[i] ?? 0).toFixed(3)}</b>
                  </span>
                ))}
              </div>
            </Card>
            <Card title="Biplot (scores + loadings)">
              <p className="mb-2 text-xs text-gray-500">
                Circles are PCA scores. Arrows are real loadings. Click an arrow to highlight that feature. Sign of w and −w are equivalent.
              </p>
              <Biplot
                projections={projection}
                features={prepared.features}
                components={result.components}
                labels={prepared.labels}
                colorBy={colorBy}
                selectedIndex={selectedIndex}
                activeFeature={activeFeature}
                onSelectSample={setSelectedIndex}
                onSelectFeature={setActiveFeature}
                infer={transformedNew ? { x: transformedNew[xIndex] ?? 0, y: transformedNew[yIndex] ?? 0 } : null}
              />
            </Card>
          </div>
        </div>
      )}

      {isLabTab(tab, 'Dataset') && (
        <div className="space-y-4">
          <Card title="Choose a matrix">
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3 text-sm">
                <select
                  value={dataset}
                  onChange={(event) => setDataset(event.target.value as DimensionalityCatalogId)}
                  className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                >
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {handoff ? `Dataset Library override: ${handoff.name}` : prepared.name}. Target is never used in the PCA fit.
                </p>
                <p className="text-xs text-gray-500">Selected: {prepared.features.join(', ')}</p>
                <p className="text-xs text-gray-500">Ignored / labels: {prepared.ignored.join(', ') || 'none'}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="pca-preview">
                  <thead>
                    <tr>
                      <th>#</th>
                      {prepared.features.map((name) => (
                        <th key={name}>{name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prepared.X.slice(0, 8).map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        {row.map((value, j) => (
                          <td key={j}>{value.toFixed(2)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-gray-500">First 8 rows of {prepared.X.length} samples.</p>
              </div>
            </div>
          </Card>
          <Card title="Original-space correlation (not the embedding)">
            <div className="overflow-x-auto">
              <table className="pca-preview">
                <thead>
                  <tr>
                    <th />
                    {prepared.features.map((name) => (
                      <th key={name}>{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corr.map((row, i) => (
                    <tr key={prepared.features[i]}>
                      <th>{prepared.features[i]}</th>
                      {row.map((value, j) => (
                        <td key={j}>{value.toFixed(2)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}>
            <AlgorithmDatasetLoader route={ROUTE} category="Dimensionality Reduction" />
            <div className="mt-4">
              <ExperimentWorkspacePanel route={ROUTE} category="Dimensionality Reduction" compact />
            </div>
          </Suspense>
        </div>
      )}

      {isLabTab(tab, 'Train') && (
        <div className="pca-grid-2">
          <Card title="Fit PCA">
            <div className="space-y-4 text-sm">
              <label className="block text-xs font-semibold text-gray-500">Scaling</label>
              <select
                value={scale}
                onChange={(event) => setScale(event.target.value as FeatureScaleMode)}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="none">No scaling (center only)</option>
                <option value="standard">Standardization (z-score)</option>
                <option value="minmax">Min-max [0, 1]</option>
              </select>
              <p className="text-xs text-gray-500">z = (x − mean) / std when standardized. Constant columns map to 0.</p>
              <label className="block text-xs font-semibold text-gray-500">
                Components: <span className="font-mono text-blue-600">{k}</span>
              </label>
              <input
                type="range"
                min={1}
                max={prepared.features.length}
                value={components}
                onChange={(event) => {
                  setVarianceTarget(0);
                  setComponents(Number(event.target.value));
                }}
                className="w-full accent-blue-600"
              />
              <label className="block text-xs font-semibold text-gray-500">Keep enough components for</label>
              <select
                value={varianceTarget}
                onChange={(event) => setVarianceTarget(Number(event.target.value))}
                className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value={0}>Manual component count</option>
                <option value={0.8}>80% variance</option>
                <option value={0.9}>90% variance</option>
                <option value={0.95}>95% variance</option>
                <option value={0.99}>99% variance</option>
              </select>
              <button type="button" className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white" onClick={runPca}>
                Run / refresh PCA
              </button>
              <button type="button" className="ml-2 rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white" onClick={exportEmbedding}>
                Export / send PCs
              </button>
              {warning && (
                <InfoBox type="warning" title="Constant features">
                  {warning}
                </InfoBox>
              )}
            </div>
          </Card>
          <div className="space-y-4">
            <Card title="Original vs reduced summary">
              <DimensionalitySummary
                items={[
                  { label: 'Dataset', value: prepared.name },
                  { label: 'Rows', value: prepared.X.length },
                  { label: 'Scaling', value: scale },
                  { label: 'Requested / output dims', value: `${k} / ${result.projections[0]?.length ?? 0}` },
                  { label: 'Run state', value: status },
                  { label: 'Runtime', value: `${runtimeMs.toFixed(0)} ms` },
                  { label: 'Variance retained', value: `${(retained * 100).toFixed(1)}%` },
                  { label: 'Reconstruction MSE', value: result.reconstructionMse.toFixed(4) },
                ]}
              />
            </Card>
            <Card title="Live projection after this fit">
              <div className="h-[240px] min-h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pc1" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="pc2" tick={{ fontSize: 11 }} />
                  <Scatter data={projection} fill="#2563eb" isAnimationActive={false}>
                    {projection.map((point) => (
                      <Cell key={point.index} fill={colorBy ? colors[Math.max(point.label, 0) % colors.length] : '#2563eb'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {isLabTab(tab, 'Infer') && (
        <div className="pca-grid-2">
          <Card title="Transform a new sample">
            <p className="mb-3 text-xs text-gray-500">
              Same fitted scaler and components as the current run. This is out-of-sample projection, not a refit.
            </p>
            {prepared.features.map((name, j) => {
              const range = featureRanges[j];
              const value = inferValues[j] ?? range.mean;
              return (
                <label key={name} className="pca-slider-row">
                  <span className="truncate font-mono" title={name}>
                    {name}
                  </span>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.span / 100}
                    value={value}
                    onChange={(event) => {
                      const next = [...inferValues];
                      next[j] = Number(event.target.value);
                      setInferValues(next);
                    }}
                  />
                  <input
                    type="number"
                    value={Number(value.toFixed(3))}
                    step={range.span / 100}
                    onChange={(event) => {
                      const next = [...inferValues];
                      next[j] = Number(event.target.value);
                      setInferValues(next);
                    }}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
                  />
                </label>
              );
            })}
            <p className="mt-3 font-mono text-sm text-blue-700 dark:text-blue-300">
              {transformedNew
                ? transformedNew.map((value, i) => `PC${i + 1}=${value.toFixed(3)}`).join(' · ')
                : 'Move a slider to project.'}
            </p>
          </Card>
          <Card title="Where the new point lands">
            <Biplot
              projections={projection}
              features={prepared.features}
              components={result.components}
              labels={prepared.labels}
              colorBy={colorBy}
              selectedIndex={selectedIndex}
              activeFeature={activeFeature}
              onSelectSample={setSelectedIndex}
              onSelectFeature={setActiveFeature}
              infer={transformedNew ? { x: transformedNew[xIndex] ?? 0, y: transformedNew[yIndex] ?? 0 } : null}
            />
            <p className="mt-2 text-xs text-gray-500">Amber marker is the transformed sample. Training points stay fixed.</p>
          </Card>
        </div>
      )}

      {isLabTab(tab, 'Metrics') && (
        <div className="space-y-4">
          <MetricsPanel
            title="PCA Metrics"
            metrics={[
              { label: 'Variance retained', value: retained, format: 'percent', color: 'green' },
              { label: 'PC1 ratio', value: result.explainedVarianceRatio[0] ?? 0, format: 'percent', color: 'blue' },
              { label: 'Reconstruction MSE', value: result.reconstructionMse, format: 'fixed4' },
              { label: 'Reconstruction MAE', value: result.reconstructionMae, format: 'fixed4' },
              { label: 'Max |WᵀW off-diag|', value: componentOrthogonality(result.components), format: 'fixed4' },
              { label: 'Neighborhood @10', value: neighborhoodAtK(prepared.X, result.projections, 10), format: 'percent' },
              { label: 'Distance preservation', value: distancePreservation(prepared.X, result.projections), format: 'fixed4' },
              { label: 'Post-hoc kNN (labels not in fit)', value: prepared.target ? posthocKnnAccuracy(result.projections, prepared.labels, 5) ?? 0 : 0, format: 'percent' },
              { label: 'Samples', value: prepared.X.length, format: 'number' },
            ]}
          />
          <Card title="Reconstruction vs component count">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={reconstructionRows} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="components" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <ReferenceLine x={threshold} stroke="#dc2626" strokeDasharray="5 4" label=">=95%" />
                <Line yAxisId="left" dataKey="mse" name="Reconstruction MSE" stroke="#dc2626" strokeWidth={2.5} />
                <Line yAxisId="right" dataKey="explained" name="Cumulative explained %" stroke="#2563eb" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Loadings (not feature importance)">
            <div className="overflow-x-auto">
              <table className="pca-preview">
                <thead>
                  <tr>
                    <th>Feature</th>
                    {result.components.map((_, i) => (
                      <th key={i}>PC{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadings.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      {row.loadings.map((value, i) => (
                        <td key={i}>{value.toFixed(3)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">PC1 influenced most by: {top.map((item) => `${item.name}: ${item.loading.toFixed(2)}`).join(', ')}</p>
          </Card>
        </div>
      )}

      {isLabTab(tab, 'Compare') && (
        <Card title="Comparison lab (same selected features)">
          <DimensionalityComparePanel X={prepared.X} labels={prepared.target ? prepared.labels : undefined} />
        </Card>
      )}

      {isLabTab(tab, 'Challenge') && (
        <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}>
          <LearningCompanion route={ROUTE} sections={['challenge', 'notes', 'quiz']} />
        </Suspense>
      )}

      {isLabTab(tab, 'Explain') && (
        <div className="space-y-4">
          <LabLessonPanel tab="Explain" route={ROUTE} />
          {algorithm && (
            <Suspense fallback={null}>
              <AlgorithmFAQ algorithm={algorithm} />
            </Suspense>
          )}
          <InfoBox type="warning" title="When not to use PCA">
            PCA is a linear projection. High variance is not the same as predictive relevance. Do not treat PC distances as a classifier, and do not feed the target into the covariance matrix.
          </InfoBox>
        </div>
      )}
    </div>
  );
}

function Biplot({
  projections,
  features,
  components,
  labels,
  colorBy,
  selectedIndex,
  activeFeature,
  onSelectSample,
  onSelectFeature,
  infer,
}: {
  projections: Array<{ pc1: number; pc2: number; index: number }>;
  features: string[];
  components: number[][];
  labels: number[];
  colorBy: boolean;
  selectedIndex: number;
  activeFeature: string | null;
  onSelectSample: (index: number) => void;
  onSelectFeature: (name: string) => void;
  infer: { x: number; y: number } | null;
}) {
  const xs = projections.map((point) => point.pc1);
  const ys = projections.map((point) => point.pc2);
  const xMin = Math.min(...xs, infer?.x ?? 0, -1);
  const xMax = Math.max(...xs, infer?.x ?? 0, 1);
  const yMin = Math.min(...ys, infer?.y ?? 0, -1);
  const yMax = Math.max(...ys, infer?.y ?? 0, 1);
  const mapX = (value: number) => 18 + ((value - xMin) / Math.max(1e-6, xMax - xMin)) * 164;
  const mapY = (value: number) => 102 - ((value - yMin) / Math.max(1e-6, yMax - yMin)) * 88;
  const cx = mapX(0);
  const cy = mapY(0);
  const w0 = components[0];
  const w1 = components[1] ?? components[0];

  return (
    <svg viewBox="0 0 200 120" className="pca-biplot" role="img" aria-label="PCA biplot">
      <line x1="18" y1={cy} x2="182" y2={cy} stroke="#94a3b8" strokeWidth="0.4" />
      <line x1={cx} y1="14" x2={cx} y2="106" stroke="#94a3b8" strokeWidth="0.4" />
      {projections.map((point) => (
        <circle
          key={point.index}
          className="sample"
          cx={mapX(point.pc1)}
          cy={mapY(point.pc2)}
          r={selectedIndex === point.index ? 2.4 : 1.4}
          fill={colorBy ? colors[Math.max(labels[point.index] ?? 0, 0) % colors.length] : '#2563eb'}
          opacity={0.85}
          onClick={() => onSelectSample(point.index)}
        />
      ))}
      {w0 && w1
        ? features.map((name, j) => {
            const x = cx + (w0[j] ?? 0) * 48;
            const y = cy - (w1[j] ?? 0) * 36;
            const active = activeFeature === name;
            return (
              <g key={name} onClick={() => onSelectFeature(name)} style={{ cursor: 'pointer' }}>
                <line className={`arrow${active ? ' active' : ''}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#dc2626" strokeWidth="1" />
                <text className={`arrow-label${active ? ' active' : ''}`} x={x} y={y} fill="currentColor" fontSize="7">
                  {name}
                </text>
              </g>
            );
          })
        : null}
      {infer && <circle className="pca-infer-dot" cx={mapX(infer.x)} cy={mapY(infer.y)} r="3.2" />}
    </svg>
  );
}
