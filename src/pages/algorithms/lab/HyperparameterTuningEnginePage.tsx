import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';

function exportTuning(payload: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tuning-history.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

type SearchMode = 'grid' | 'random' | 'bayesian';

export default function HyperparameterTuningEnginePage() {
  const [mode, setMode] = useState<SearchMode>('grid');
  const [trials, setTrials] = useState(24);
  const [earlyStopping, setEarlyStopping] = useState(true);
  const history = useMemo(() => Array.from({ length: trials }, (_, i) => {
    const lr = mode === 'grid' ? [0.001, 0.005, 0.01, 0.05][i % 4] : Number((0.001 + Math.abs(Math.sin(i * 9.7)) * 0.08).toFixed(4));
    const depth = mode === 'bayesian' ? Math.round(3 + Math.sin(i / 4) * 2 + i / trials * 3) : 2 + (i % 7);
    const regularization = Number((Math.abs(Math.cos(i * 1.3)) * 0.2).toFixed(3));
    const score = Number((0.58 + Math.log1p(i) * 0.045 + Math.sin(depth) * 0.035 - regularization * 0.12 - Math.abs(lr - 0.02) * 1.2).toFixed(3));
    return { trial: i + 1, lr, depth, regularization, score: Math.max(0.1, Math.min(0.98, score)), stopped: earlyStopping && i > trials * 0.72 && score < 0.68 };
  }), [earlyStopping, mode, trials]);
  const best = history.reduce((winner, item) => item.score > winner.score ? item : winner, history[0]);
  const explored = new Set(history.map(item => `${item.lr}-${item.depth}-${item.regularization}`)).size;
  const budget = {
    estimatedMinutes: Number((trials * (mode === 'bayesian' ? 0.42 : mode === 'random' ? 0.28 : 0.2)).toFixed(1)),
    explored,
    earlyStopped: history.filter(item => item.stopped).length,
    efficiency: Number((best.score / Math.max(1, trials) * 100).toFixed(2)),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Hyperparameter Tuning Engine" subtitle="Grid search, random search, Bayesian-style search, early stopping, and visual tuning history." badge="Advanced" category="Lab" icon={<SlidersHorizontal size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel compact />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-xs font-bold uppercase text-gray-500">Budget</p><p className="font-mono text-2xl font-black">{budget.estimatedMinutes}m</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Unique configs</p><p className="font-mono text-2xl font-black">{budget.explored}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Early stopped</p><p className="font-mono text-2xl font-black">{budget.earlyStopped}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Efficiency</p><p className="font-mono text-2xl font-black">{budget.efficiency}</p></Card>
      </div>
      <Card title="Search Controls">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select value={mode} onChange={event => setMode(event.target.value as SearchMode)} className="min-h-10 rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"><option value="grid">Grid search</option><option value="random">Random search</option><option value="bayesian">Bayesian-style search</option></select>
          <label className="text-sm font-bold">Trials: {trials}<input type="range" min={8} max={80} value={trials} onChange={event => setTrials(Number(event.target.value))} className="mt-2 w-full accent-blue-600" /></label>
          <label className="flex min-h-10 items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-bold dark:border-gray-700"><input type="checkbox" checked={earlyStopping} onChange={event => setEarlyStopping(event.target.checked)} /> Early stopping</label>
          <button onClick={() => exportTuning({ mode, trials, earlyStopping, best, budget, history })} className="min-h-10 rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white">Export</button>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tuning History"><ResponsiveContainer width="100%" height={280}><LineChart data={history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="trial" /><YAxis domain={[0, 1]} /><Tooltip /><Line dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card>
        <Card title="Learning Rate vs Score"><ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="lr" /><YAxis dataKey="score" domain={[0, 1]} /><Tooltip /><Scatter data={history} fill="#059669" /></ScatterChart></ResponsiveContainer></Card>
        <Card title="Depth Search"><ResponsiveContainer width="100%" height={260}><BarChart data={history.slice(-20)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="trial" /><YAxis /><Tooltip /><Bar dataKey="depth" fill="#7c3aed" /></BarChart></ResponsiveContainer></Card>
        <InfoBox type="success" title="Best Trial">Trial {best.trial}: score {best.score}, learning rate {best.lr}, depth {best.depth}, regularization {best.regularization}. {earlyStopping ? `${history.filter(item => item.stopped).length} weak late trials marked for early stop.` : 'Early stopping is disabled.'}</InfoBox>
      </div>
      <Card title="Trial Table">
        <div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-gray-50 dark:bg-gray-900"><th className="p-2">Trial</th><th className="p-2">LR</th><th className="p-2">Depth</th><th className="p-2">Reg</th><th className="p-2">Score</th><th className="p-2">Status</th></tr></thead><tbody>{history.map(row => <tr key={row.trial} className="border-t border-gray-100 dark:border-gray-800"><td className="p-2">{row.trial}</td><td className="p-2">{row.lr}</td><td className="p-2">{row.depth}</td><td className="p-2">{row.regularization}</td><td className="p-2 font-bold">{row.score}</td><td className="p-2">{row.stopped ? 'early stop' : 'kept'}</td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
