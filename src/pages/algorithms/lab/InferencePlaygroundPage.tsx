import { useState } from 'react';
import { BrainCircuit, Download, Play, Upload } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { downloadJsonArtifact } from '../../../lib/modelArtifacts/downloadJsonArtifact';
import {
  parseLinearRegressionArtifact,
  predictLinearRegression,
  type LinearRegressionArtifact,
} from '../../../lib/modelArtifacts/linearRegressionArtifact';
import {
  parseTSNEArtifact,
  projectWithTSNEArtifact,
  type TSNEArtifact,
} from '../../../lib/dimensionality/tsneArtifact';

type ExecutableArtifact = LinearRegressionArtifact | TSNEArtifact;
type InferenceRow = { input: number[]; output: number[]; note: string };

function parseRows(input: string, count: number) {
  const lines = input.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
  if (!lines.length || lines.length > 100) throw new Error('Enter 1 to 100 rows, one sample per line.');
  return lines.map((line, index) => {
    const tokens = line.split(/[\s,]+/);
    const values = tokens.map(Number);
    if (tokens.some(token => !token) || values.length !== count || !values.every(Number.isFinite)) {
      throw new Error(`Row ${index + 1} needs ${count} finite numeric values.`);
    }
    return values;
  });
}

export default function InferencePlaygroundPage() {
  const [artifact, setArtifact] = useState<ExecutableArtifact | null>(null);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<InferenceRow[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const featureNames = artifact?.format === 'ml-suite-linear-regression-v1'
    ? artifact.inputFeatures
    : artifact ? Array.from({ length: artifact.inputDimensions }, (_, index) => `feature_${index + 1}`) : [];

  const importModel = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || !('format' in parsed)) {
        throw new Error('This file is not an exported ML Suite model.');
      }
      const format = parsed.format;
      const next = format === 'ml-suite-linear-regression-v1'
        ? parseLinearRegressionArtifact(parsed)
        : format === 'ml-suite-tsne-reference-v1'
          ? parseTSNEArtifact(parsed)
          : null;
      if (!next) throw new Error('This model format does not support inference here yet.');
      setArtifact(next);
      setInput(next.format === 'ml-suite-tsne-reference-v1'
        ? next.referenceFeatures[0].join(', ')
        : next.inputFeatures.map(() => '0').join(', '));
      setResults([]);
      setError('');
      setMessage(`${next.algorithm} model loaded from ${file.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this model file.');
      setMessage('');
    }
  };

  const runInference = () => {
    if (!artifact) return;
    try {
      const rows = parseRows(input, featureNames.length);
      const next = rows.map(row => {
        if (artifact.format === 'ml-suite-linear-regression-v1') {
          return { input: row, output: [predictLinearRegression(artifact, row)], note: 'Predicted target' };
        }
        const placement = projectWithTSNEArtifact(artifact, row);
        return {
          input: row,
          output: placement.position,
          note: placement.exact ? 'Exact reference match' : 'Approximate nearest-neighbor placement',
        };
      });
      setResults(next);
      setError('');
    } catch (cause) {
      setResults([]);
      setError(cause instanceof Error ? cause.message : 'Inference failed.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Inference Playground" subtitle="Import an exported model and run real predictions or projections on new numeric rows." badge="Browser Inference" category="Lab" icon={<BrainCircuit size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel compact />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card title="Model Source">
            <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-sm font-bold dark:border-gray-700">
              <Upload size={14} /> Import exported model JSON
              <input type="file" accept=".json,application/json" onChange={event => void importModel(event.currentTarget.files?.[0])} className="hidden" />
            </label>
            {message && <div className="mt-3"><InfoBox type="success">{message}</InfoBox></div>}
            {error && <div className="mt-3"><InfoBox type="warning">{error}</InfoBox></div>}
            {artifact ? (
              <div className="mt-3 space-y-1 text-sm">
                <p><b>{artifact.algorithm}</b> · {artifact.datasetName}</p>
                <p>{featureNames.length} input features: {featureNames.join(', ')}</p>
                {artifact.format === 'ml-suite-tsne-reference-v1' && <p>Projection for new rows is approximate.</p>}
              </div>
            ) : <p className="mt-3 text-sm text-gray-500">Export a model from an algorithm page, then import it here.</p>}
          </Card>
          <Card title="New Input">
            <label htmlFor="inference-rows" className="mb-2 block text-sm">One comma-separated feature row per line, in model feature order.</label>
            <textarea id="inference-rows" value={input} onChange={event => setInput(event.target.value)} rows={8} disabled={!artifact} className="w-full rounded border border-gray-200 bg-white p-3 font-mono text-xs disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={runInference} disabled={!artifact} className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"><Play size={14} /> Infer</button>
              <button onClick={() => downloadJsonArtifact('inference-results.json', { model: artifact?.algorithm, results })} disabled={!results.length} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-gray-700"><Download size={14} /> Export results</button>
            </div>
          </Card>
        </div>
        <Card title="Results">
          {results.length ? (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b>Row {index + 1}</b><strong>{result.output.map(value => Number(value.toFixed(4))).join(', ')}</strong></div>
                  <p className="mt-1 text-xs text-gray-500">{result.note}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-500">Import a supported model and infer new rows to see results.</p>}
        </Card>
      </div>
    </div>
  );
}
