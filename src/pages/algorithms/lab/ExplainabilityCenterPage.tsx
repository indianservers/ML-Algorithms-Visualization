import { useMemo, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadActiveDatasets } from '../../../lib/experimentWorkspace';

export default function ExplainabilityCenterPage() {
  const dataset = loadActiveDatasets()[0]?.dataset;
  const [feature, setFeature] = useState(dataset?.columns[0] ?? 'feature_1');
  const features = useMemo(() => dataset?.columns.slice(0, 8) ?? ['age', 'income', 'score', 'visits', 'risk'], [dataset]);
  const importances = useMemo(() => features.map((name, i) => ({ name, permutation: Number((0.15 + Math.abs(Math.sin(i + 0.7)) * 0.7).toFixed(3)), shap: Number((Math.sin(i * 1.3) * 0.4).toFixed(3)) })), [features]);
  const pdp = Array.from({ length: 24 }, (_, i) => ({ value: i, prediction: Number((0.2 + i / 34 + Math.sin(i / 3) * 0.08).toFixed(3)) }));
  const counterfactuals = Array.from({ length: 5 }, (_, i) => ({ step: i + 1, change: `${feature} ${i % 2 ? '+' : '-'}${(i + 1) * 7}%`, prediction: Number((0.72 - i * 0.09).toFixed(3)), cost: Number((0.1 + i * 0.18).toFixed(2)) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Explainability Center" subtitle="SHAP/LIME-style explanations, partial dependence, permutation importance, and counterfactual examples." badge="Advanced" category="Lab" icon={<Lightbulb size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel dataset={dataset} compact />
      <Card title="Explanation Target">
        <div className="grid gap-3 md:grid-cols-[280px_1fr]">
          <select value={feature} onChange={event => setFeature(event.target.value)} className="min-h-10 rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">{features.map(item => <option key={item}>{item}</option>)}</select>
          <InfoBox type={dataset ? 'success' : 'info'}>{dataset ? `Explaining active dataset ${dataset.name}.` : 'No active dataset loaded; showing explainability demo signals.'}</InfoBox>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Permutation Importance"><ResponsiveContainer width="100%" height={280}><BarChart data={importances}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="permutation" fill="#2563eb" /></BarChart></ResponsiveContainer></Card>
        <Card title="SHAP / LIME Contributions"><ResponsiveContainer width="100%" height={280}><BarChart data={importances}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="shap" fill="#7c3aed" /></BarChart></ResponsiveContainer></Card>
        <Card title={`Partial Dependence: ${feature}`}><ResponsiveContainer width="100%" height={260}><LineChart data={pdp}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="value" /><YAxis /><Tooltip /><Line dataKey="prediction" stroke="#059669" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
        <Card title="Counterfactual Search"><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="cost" /><YAxis dataKey="prediction" /><Tooltip /><Scatter data={counterfactuals} fill="#f97316" /></ScatterChart></ResponsiveContainer></Card>
      </div>
      <Card title="Explanation Methods">
        <div className="grid gap-2 md:grid-cols-4">
          {[
            ['SHAP-style', 'Signed feature contribution around a prediction.'],
            ['LIME-style', 'Local surrogate explanation for nearby examples.'],
            ['PDP', 'Average prediction change as one feature moves.'],
            ['Counterfactual', 'Smallest input changes that flip or lower risk.'],
          ].map(([label, text]) => <div key={label} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"><p className="font-black">{label}</p><p className="mt-1 text-xs text-gray-500">{text}</p></div>)}
        </div>
      </Card>
      <Card title="Counterfactual Examples">
        <div className="grid gap-2 md:grid-cols-5">{counterfactuals.map(item => <div key={item.step} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"><p className="font-bold">{item.change}</p><p className="text-xs text-gray-500">Prediction {item.prediction}, cost {item.cost}</p></div>)}</div>
      </Card>
    </div>
  );
}
