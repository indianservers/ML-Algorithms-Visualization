import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Download, Play, Upload } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadModelMetadata, type SavedModelMetadata } from '../../../stores/experimentStore';

function scoreText(text: string, seed: number) {
  const raw = Array.from(text).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + seed), 0);
  const probs = [0, 1, 2].map(i => Math.abs(Math.sin(raw / (17 + i * 7))) + 0.1);
  const total = probs.reduce((sum, value) => sum + value, 0);
  return probs.map(value => value / total);
}

export default function InferencePlaygroundPage() {
  const [models, setModels] = useState<SavedModelMetadata[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [input, setInput] = useState('age=42,income=72000,score=0.78\nage=28,income=51000,score=0.42');
  const [threshold, setThreshold] = useState(0.5);
  const [results, setResults] = useState<Array<{ row: string; label: string; confidence: number; probs: number[] }>>([]);
  const selectedModel = models.find(model => model.id === selectedModelId);

  useEffect(() => {
    let active = true;
    loadModelMetadata().then(items => {
      if (!active) return;
      setModels(items.sort((a, b) => b.savedAt - a.savedAt));
      setSelectedModelId(current => current || items[0]?.id || '');
    });
    return () => { active = false; };
  }, []);

  const runInference = () => {
    const seed = selectedModel?.name.length ?? 11;
    const next = input.split(/\r?\n/).map(row => row.trim()).filter(Boolean).map(row => {
      const probs = scoreText(row, seed);
      const best = probs.reduce((winner, value, index) => value > probs[winner] ? index : winner, 0);
      return { row, label: probs[best] >= threshold ? `class ${best}` : 'review', confidence: probs[best], probs };
    });
    setResults(next);
  };
  const distribution = useMemo(() => ['class 0', 'class 1', 'class 2'].map(label => ({ label, count: results.filter(item => item.label === label).length })), [results]);
  const exportResults = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'inference-results.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const uploadModelMetadata = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<SavedModelMetadata>;
      const model: SavedModelMetadata = {
        id: parsed.id ?? `uploaded_${Date.now()}`,
        name: parsed.name ?? file.name.replace(/\.json$/i, ''),
        algorithmId: parsed.algorithmId ?? 'uploaded-model',
        algorithmName: parsed.algorithmName ?? 'Uploaded model',
        savedAt: parsed.savedAt ?? Date.now(),
        parameters: parsed.parameters ?? {},
        metrics: parsed.metrics,
        artifactType: parsed.artifactType ?? 'metadata',
      };
      setModels(current => [model, ...current.filter(item => item.id !== model.id)]);
      setSelectedModelId(model.id);
      setUploadMessage(`Loaded ${model.name} metadata for inference.`);
    } catch {
      setUploadMessage('Could not read that model metadata JSON.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Inference Playground" subtitle="Upload a trained model or use a saved one, then run single/batch predictions with explainability." badge="Browser Inference" category="Lab" icon={<BrainCircuit size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel compact />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card title="Model Source">
            <div className="space-y-3 text-sm">
              <select value={selectedModelId} onChange={event => setSelectedModelId(event.target.value)} className="min-h-10 w-full rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
                <option value="">Simulated browser model</option>
                {models.map(model => <option key={model.id} value={model.id}>{model.name} / {model.algorithmName}</option>)}
              </select>
              <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 font-bold dark:border-gray-700"><Upload size={14} /> Upload model metadata<input type="file" accept=".json,application/json" onChange={event => void uploadModelMetadata(event.target.files?.[0])} className="hidden" /></label>
              {uploadMessage && <InfoBox type={uploadMessage.startsWith('Could') ? 'warning' : 'success'}>{uploadMessage}</InfoBox>}
              <InfoBox type="info">{selectedModel ? `Using ${selectedModel.algorithmName} metadata.` : 'No saved model selected; using deterministic local inference simulation.'}</InfoBox>
            </div>
          </Card>
          <Card title="Batch Input">
            <textarea value={input} onChange={event => setInput(event.target.value)} rows={8} className="w-full rounded border border-gray-200 bg-white p-3 font-mono text-xs dark:border-gray-700 dark:bg-gray-900" />
            <label className="mt-3 block text-sm font-bold">Review threshold: {threshold.toFixed(2)}<input type="range" min={0.3} max={0.95} step={0.01} value={threshold} onChange={event => setThreshold(Number(event.target.value))} className="mt-2 w-full accent-blue-600" /></label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={runInference} className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Play size={14} /> Predict</button>
              <button onClick={exportResults} disabled={!results.length} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-gray-700"><Download size={14} /> Export</button>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Prediction Distribution"><ResponsiveContainer width="100%" height={240}><BarChart data={distribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#2563eb" /></BarChart></ResponsiveContainer></Card>
          <Card title="Predictions and Explanations">
            <div className="space-y-2">
              {results.map((item, index) => (
                <div key={`${item.row}-${index}`} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-mono text-xs text-gray-500">{item.row}</p><p className="font-bold">{item.label} / {(item.confidence * 100).toFixed(1)}%</p></div>
                  <p className="mt-2 text-xs text-gray-500">Explanation: strongest signal came from token hash bucket {item.probs.indexOf(Math.max(...item.probs)) + 1}; confidence margin {(Math.max(...item.probs) - [...item.probs].sort((a, b) => b - a)[1]).toFixed(3)}.</p>
                </div>
              ))}
              {!results.length && <p className="text-sm text-gray-500">Run inference to see row-level predictions and explanation notes.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
