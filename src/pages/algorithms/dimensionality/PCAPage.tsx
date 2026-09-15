import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Minimize2 } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { MetricsPanel } from '../../../components/ml/MetricsPanel';
import { pca, pcaLoadings, topLoadingFeatures, transformPca } from '../../../lib/algorithms/dimensionality/pca';
import {
  componentsForVariance,
  constantFeatureWarning,
  correlationMatrix,
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

const colors = ['#2563eb', '#059669', '#dc2626', '#7c3aed'];
const catalog = getDimensionalityCatalog();

export default function PCAPage() {
  const handoff = useActiveDimensionality('/ml/dimensionality-reduction/pca');
  const [dataset, setDataset] = useState<DimensionalityCatalogId>('d-iris');
  const [components, setComponents] = useState(2);
  const [scale, setScale] = useState<FeatureScaleMode>('standard');
  const [varianceTarget, setVarianceTarget] = useState(0);
  const [colorBy, setColorBy] = useState(true);
  const [runToken, setRunToken] = useState(0);
  const [status, setStatus] = useState<'NOT RUN' | 'COMPLETED' | 'STALE'>('NOT RUN');
  const [newSample, setNewSample] = useState('');

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
  const corr = correlationMatrix(prepared.X);
  const loadings = pcaLoadings(result, prepared.features);
  const top = topLoadingFeatures(result, prepared.features, 0, 3);
  const projection = result.projections.map((row, i) => ({
    pc1: row[0] ?? 0,
    pc2: row[1] ?? 0,
    label: prepared.labels[i],
    index: i,
  }));
  const variance = full.explainedVarianceRatio.map((ratio, i) => ({
    component: `PC${i + 1}`,
    explained: Number((ratio * 100).toFixed(2)),
    cumulative: Number((full.cumulativeExplainedVariance[i] * 100).toFixed(2)),
    eigenvalue: full.eigenvalues[i],
  }));
  const reconstructionRows = full.explainedVarianceRatio.map((_, index) => {
    const fit = pca(prepared.X, index + 1, scale);
    return {
      components: index + 1,
      mse: Number(fit.reconstructionMse.toFixed(4)),
      explained: Number((fit.cumulativeExplainedVariance.at(-1)! * 100).toFixed(2)),
    };
  });
  const threshold = reconstructionRows.find((row) => row.explained >= 95)?.components ?? prepared.features.length;
  const warning = constantFeatureWarning(result.scale.constantFeatures);
  const transformedNew = useMemo(() => {
    const values = newSample.split(/[,\s]+/).map(Number).filter((value) => Number.isFinite(value));
    if (values.length !== prepared.features.length) return null;
    return transformPca([values], result)[0];
  }, [newSample, prepared.features.length, result]);

  useEffect(() => {
    setStatus((current) => (current === 'NOT RUN' ? current : 'STALE'));
  }, [dataset, scale, components, varianceTarget, handoff]);

  useEffect(() => {
    if (runToken === 0) return;
    setStatus('COMPLETED');
  }, [result, runToken]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader
        title="Principal Component Analysis"
        subtitle="Real PCA: scale, center, covariance/eigenvectors, projection Z = Xc W, reconstruction, and out-of-sample transform with the fitted scaler."
        badge="Intermediate"
        category="Dimensionality Reduction"
        icon={<Minimize2 size={22} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card title="Dataset and Controls">
            <div className="space-y-4 text-sm">
              <select value={dataset} onChange={(event) => setDataset(event.target.value as DimensionalityCatalogId)} className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">{handoff ? `Dataset Library: ${handoff.name}` : prepared.name}. Target is never used in the PCA fit.</p>
              <label className="block text-xs font-semibold text-gray-500">Scaling</label>
              <select value={scale} onChange={(event) => setScale(event.target.value as FeatureScaleMode)} className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                <option value="none">No scaling (center only)</option>
                <option value="standard">Standardization (z-score)</option>
                <option value="minmax">Min-max [0, 1]</option>
              </select>
              <p className="text-xs text-gray-500">Scaling is explicit. z = (x − mean) / std when standardized. Constant columns are mapped to 0.</p>
              <label className="block text-xs font-semibold text-gray-500">Components: <span className="font-mono text-blue-600">{k}</span></label>
              <input type="range" min={1} max={prepared.features.length} value={components} onChange={(event) => { setVarianceTarget(0); setComponents(Number(event.target.value)); }} className="w-full accent-blue-600" />
              <label className="block text-xs font-semibold text-gray-500">Keep enough components for</label>
              <select value={varianceTarget} onChange={(event) => setVarianceTarget(Number(event.target.value))} className="w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                <option value={0}>Manual component count</option>
                <option value={0.8}>80% variance</option>
                <option value={0.9}>90% variance</option>
                <option value={0.95}>95% variance</option>
                <option value={0.99}>99% variance</option>
              </select>
              <p className="text-xs text-gray-500">Selected: {prepared.features.join(', ')}</p>
              <p className="text-xs text-gray-500">Ignored / labels: {prepared.ignored.join(', ') || 'none'}</p>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={colorBy} onChange={(event) => setColorBy(event.target.checked)} />
                Color by target (visualization only — not used in PCA)
              </label>
              <p className="text-xs font-semibold">State: {status}</p>
              <button
                type="button"
                className="rounded bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
                onClick={() => {
                  setRunToken((value) => value + 1);
                  setStatus('COMPLETED');
                }}
              >
                Run / refresh PCA
              </button>
              <button
                type="button"
                className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                onClick={() => {
                  const shared = {
                    id: `pca-${dataset}`,
                    name: `PCA ${k} of ${prepared.name}`,
                    prefix: "PC" as const,
                    embedding: result.projections,
                    labels: prepared.target ? prepared.labels : undefined,
                    history: `${prepared.name} → ${scale} → PCA → ${k} components`,
                  };
                  downloadEmbeddingCsv(
                    "pca-embedding.csv",
                    embeddingToLoadedDataset({ ...shared, sendRoute: "/ml/supervised/knn-classification" }),
                  );
                  embeddingToLoadedDataset({ ...shared, sendRoute: "/ml/clustering/k-means" });
                }}
              >
                Export / send PCs to KNN & clustering
              </button>
              <label className="block text-xs font-semibold text-gray-500">Transform new sample (fitted scaler + components)</label>
              <input value={newSample} onChange={(event) => setNewSample(event.target.value)} placeholder={prepared.features.join(', ')} className="w-full rounded border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900" />
              <p className="font-mono text-xs">{transformedNew ? transformedNew.map((value, i) => `PC${i + 1}=${value.toFixed(3)}`).join(' · ') : 'Enter one value per selected feature.'}</p>
            </div>
          </Card>

          <MetricsPanel
            title="PCA Metrics"
            metrics={[
              { label: 'Variance retained', value: result.cumulativeExplainedVariance.at(-1) ?? 0, format: 'percent', color: 'green' },
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
          {warning && <InfoBox type="warning" title="Constant features">{warning}</InfoBox>}
        </div>

        <div className="space-y-4">
          <Card title="Original vs reduced summary">
            <DimensionalitySummary
              items={[
                { label: 'Dataset', value: prepared.name },
                { label: 'Rows', value: prepared.X.length },
                { label: 'Original / selected', value: `${prepared.features.length} / ${prepared.features.length}` },
                { label: 'Scaling', value: scale },
                { label: 'Method', value: 'PCA' },
                { label: 'Requested / output dims', value: `${k} / ${result.projections[0]?.length ?? 0}` },
                { label: 'Run state', value: status },
                { label: 'Seed', value: 'deterministic power iteration' },
                { label: 'Runtime (full eigen)', value: `${runtimeMs.toFixed(0)} ms` },
                { label: 'Variance retained', value: `${((result.cumulativeExplainedVariance.at(-1) ?? 0) * 100).toFixed(1)}%` },
              ]}
            />
          </Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="2D Projection (PC1 vs PC2)">
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="pc1" name="PC1" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="pc2" name="PC2" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Scatter data={projection}>
                    {projection.map((point) => (
                      <Cell
                        key={point.index}
                        fill={colorBy ? colors[Math.max(point.label, 0) % colors.length] : '#2563eb'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-gray-500">Color is class/metadata only. Labels are not used to compute components.</p>
            </Card>
            <Card title="Scree + cumulative variance">
              <ResponsiveContainer width="100%" height={320}>
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

          <Card title="Loadings (not feature importance)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Feature</th>
                    {result.components.map((_, i) => <th key={i} className="p-2">PC{i + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loadings.map((row) => (
                    <tr key={row.feature}>
                      <td className="p-2 font-mono">{row.feature}</td>
                      {row.loadings.map((value, i) => <td key={i} className="p-2 text-center font-mono">{value.toFixed(3)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">PC1 influenced most by: {top.map((item) => `${item.name}: ${item.loading.toFixed(2)}`).join(', ')}</p>
          </Card>

          <Card title="Original-space correlation (not the embedding)">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr><th className="p-2" />{prepared.features.map((name) => <th key={name} className="p-2 font-mono">{name}</th>)}</tr>
                </thead>
                <tbody>
                  {corr.map((row, i) => (
                    <tr key={prepared.features[i]}>
                      <th className="p-2 text-left font-mono">{prepared.features[i]}</th>
                      {row.map((value, j) => <td key={j} className="border border-gray-200 p-2 text-center font-mono dark:border-gray-700">{value.toFixed(2)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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

          <Card title="Biplot (scores + loadings)">
            <p className="text-xs text-gray-500">
              Sample coordinates are PCA scores. Feature arrows are actual loadings. Sign of w and −w are equivalent.
            </p>
            <svg viewBox="0 0 200 120" className="mt-2 h-32 w-full text-xs">
              {result.components[0] && result.components[1]
                ? prepared.features.map((name, j) => {
                    const x = 100 + (result.components[0][j] ?? 0) * 80;
                    const y = 60 - (result.components[1][j] ?? 0) * 50;
                    return (
                      <g key={name}>
                        <line x1="100" y1="60" x2={x} y2={y} stroke="#dc2626" strokeWidth="1" />
                        <text x={x} y={y} fill="currentColor" fontSize="8">{name}</text>
                      </g>
                    );
                  })
                : null}
            </svg>
          </Card>

          <Card title="Comparison lab (same selected features)">
            <DimensionalityComparePanel X={prepared.X} labels={prepared.target ? prepared.labels : undefined} />
          </Card>

          <InfoBox type="warning" title="When not to use PCA">
            PCA is a linear projection. High variance is not the same as predictive relevance. Do not treat PC distances as a classifier, and do not feed the target into the covariance matrix.
          </InfoBox>
        </div>
      </div>
    </div>
  );
}
