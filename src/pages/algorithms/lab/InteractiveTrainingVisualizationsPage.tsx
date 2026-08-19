import { useMemo, useState } from 'react';
import { Activity, Play, RotateCcw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';

export default function InteractiveTrainingVisualizationsPage() {
  const [epoch, setEpoch] = useState(18);
  const [complexity, setComplexity] = useState(3);
  const progress = epoch / 80;
  const curves = useMemo(() => Array.from({ length: epoch + 1 }, (_, i) => ({
    epoch: i,
    loss: Number((1.4 * Math.exp(-i / (18 + complexity * 3)) + 0.04 * Math.sin(i / 2)).toFixed(3)),
    valLoss: Number((1.35 * Math.exp(-i / (22 + complexity * 4)) + 0.03 + Math.max(0, i - 45) * complexity * 0.002).toFixed(3)),
    accuracy: Number(Math.min(0.98, 0.42 + i * 0.008 + complexity * 0.025).toFixed(3)),
  })), [complexity, epoch]);
  const boundary = useMemo(() => Array.from({ length: 72 }, (_, i) => {
    const x = Math.sin(i * 1.7) * 2.2 + (i % 2 ? 0.8 : -0.8);
    const y = Math.cos(i * 1.3) * 2.2 + (i % 3 ? 0.3 : -0.5);
    const label = x + y + Math.sin(x * complexity) * progress > 0 ? 1 : 0;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), label };
  }), [complexity, progress]);
  const featureImportance = ['age', 'income', 'score', 'visits', 'risk'].map((name, i) => ({ name, value: Number((0.18 + Math.abs(Math.sin(i + progress * 3)) * 0.65).toFixed(3)) }));
  const confusion = [
    { cell: 'TP', value: Math.round(32 + progress * 28) },
    { cell: 'FP', value: Math.round(18 - progress * 10) },
    { cell: 'FN', value: Math.round(16 - progress * 9) },
    { cell: 'TN', value: Math.round(30 + progress * 22) },
  ];
  const roc = Array.from({ length: 12 }, (_, i) => ({ fpr: Number((i / 11).toFixed(2)), tpr: Number(Math.min(1, Math.pow(i / 11, 0.45 + complexity * 0.05) + progress * 0.08).toFixed(2)) }));
  const pr = Array.from({ length: 12 }, (_, i) => {
    const recall = Number((i / 11).toFixed(2));
    return { recall, precision: Number(Math.max(0.35, 0.94 - recall * (0.28 + complexity * 0.025) + progress * 0.08).toFixed(2)) };
  });
  const residuals = Array.from({ length: 40 }, (_, i) => ({ predicted: i, residual: Number((Math.sin(i / 3) * (1 - progress) + Math.cos(i / 5) * 0.2).toFixed(3)) }));
  const gradients = Array.from({ length: 18 }, (_, i) => ({ layer: `L${i + 1}`, grad: Number((Math.exp(-i / (4 + complexity)) * (1 - progress * 0.5)).toFixed(3)) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Interactive Training Visualizations" subtitle="Live loss curves, decision boundaries, feature importance, gradients, confusion matrices, ROC curves, and residuals." badge="Browser Trainable" category="Lab" icon={<Activity size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel compact />
      <Card title="Training Controls">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <label className="text-sm font-bold">Epoch: {epoch}<input type="range" min={1} max={80} value={epoch} onChange={event => setEpoch(Number(event.target.value))} className="mt-2 w-full accent-blue-600" /></label>
          <label className="text-sm font-bold">Complexity: {complexity}<input type="range" min={1} max={8} value={complexity} onChange={event => setComplexity(Number(event.target.value))} className="mt-2 w-full accent-blue-600" /></label>
          <button onClick={() => setEpoch(value => Math.min(80, value + 5))} className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Play size={14} /> Step</button>
          <button onClick={() => setEpoch(1)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-bold dark:border-gray-700"><RotateCcw size={14} /> Reset</button>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Loss and Accuracy"><ResponsiveContainer width="100%" height={260}><LineChart data={curves}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="epoch" /><YAxis /><Tooltip /><Line dataKey="loss" stroke="#dc2626" dot={false} /><Line dataKey="valLoss" stroke="#f59e0b" dot={false} /><Line dataKey="accuracy" stroke="#059669" dot={false} /></LineChart></ResponsiveContainer></Card>
        <Card title="Decision Boundary Samples"><ResponsiveContainer width="100%" height={260}><ScatterChart><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="x" type="number" /><YAxis dataKey="y" type="number" /><Tooltip /><Scatter data={boundary}>{boundary.map((point, i) => <Cell key={i} fill={point.label ? '#2563eb' : '#f97316'} />)}</Scatter></ScatterChart></ResponsiveContainer></Card>
        <Card title="Feature Importance"><ResponsiveContainer width="100%" height={240}><BarChart data={featureImportance}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#7c3aed" /></BarChart></ResponsiveContainer></Card>
        <Card title="Confusion Matrix"><div className="grid grid-cols-2 gap-2">{confusion.map(item => <div key={item.cell} className="rounded bg-gray-50 p-6 text-center dark:bg-gray-900"><p className="text-xs font-bold text-gray-500">{item.cell}</p><p className="font-mono text-3xl font-black">{item.value}</p></div>)}</div></Card>
        <Card title="ROC Curve"><ResponsiveContainer width="100%" height={240}><LineChart data={roc}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="fpr" /><YAxis /><Tooltip /><Line dataKey="tpr" stroke="#059669" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
        <Card title="Precision / Recall Curve"><ResponsiveContainer width="100%" height={240}><LineChart data={pr}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="recall" /><YAxis domain={[0, 1]} /><Tooltip /><Line dataKey="precision" stroke="#2563eb" strokeWidth={2} /></LineChart></ResponsiveContainer></Card>
        <Card title="Residual Plot"><ResponsiveContainer width="100%" height={240}><ScatterChart><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="predicted" /><YAxis dataKey="residual" /><Tooltip /><Scatter data={residuals} fill="#2563eb" /></ScatterChart></ResponsiveContainer></Card>
        <Card title="Gradient Flow"><ResponsiveContainer width="100%" height={220}><BarChart data={gradients}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="layer" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="grad" fill="#dc2626" /></BarChart></ResponsiveContainer></Card>
        <InfoBox type={curves.at(-1)!.valLoss > curves.at(-1)!.loss * 1.35 ? 'warning' : 'success'} title="Training Signal">Validation loss, residual spread, gradients, and boundary complexity update together so overfit/underfit patterns are visible.</InfoBox>
      </div>
    </div>
  );
}
