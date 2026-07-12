import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, BrainCircuit, Database, Filter, Play } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadActiveDatasets } from '../../../lib/experimentWorkspace';
import { getModelOperationalProfile, modelZoo, recommendModels, type ModelFamily } from '../../../lib/modelZoo';

export default function ModelZooPage() {
  const activeDataset = loadActiveDatasets()[0]?.dataset;
  const [family, setFamily] = useState<ModelFamily | 'All'>('All');
  const recommendations = useMemo(() => recommendModels(activeDataset), [activeDataset]);
  const visible = recommendations.filter(item => family === 'All' || item.model.family === family);
  const families = ['All', ...Array.from(new Set(modelZoo.map(model => model.family)))] as Array<ModelFamily | 'All'>;
  const chart = families.filter(item => item !== 'All').map(item => ({ family: item, models: modelZoo.filter(model => model.family === item).length }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Model Zoo" subtitle="Built-in classical ML, deep learning, NLP, vision, time-series, recommender, and reinforcement learning models." badge="Browser Trainable" category="Lab" icon={<Boxes size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel dataset={activeDataset} compact />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card title="Catalog Filter" icon={<Filter size={14} />}>
            <div className="space-y-2">
              {families.map(item => <button key={item} onClick={() => setFamily(item)} className={`min-h-10 w-full rounded border px-3 py-2 text-left text-sm font-bold ${family === item ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200' : 'border-gray-200 dark:border-gray-700'}`}>{item}</button>)}
            </div>
          </Card>
          <Card title="Zoo Coverage">
            <ResponsiveContainer width="100%" height={240}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="family" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="models" fill="#2563eb" /></BarChart></ResponsiveContainer>
          </Card>
          <InfoBox type={activeDataset ? 'success' : 'info'} title="Dataset-Aware Ranking">
            {activeDataset ? `Ranking models for ${activeDataset.name}.` : 'Load a dataset to rank models by fit.'}
          </InfoBox>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(({ model, score, reasons }) => (
            <Card key={model.id} title={model.name} subtitle={`${model.family} / ${model.task}`}>
              <div className="space-y-3 text-sm">
                {(() => {
                  const profile = getModelOperationalProfile(model);
                  return (
                    <div className="grid gap-2 text-xs md:grid-cols-2">
                      <div className="rounded bg-gray-50 p-2 dark:bg-gray-900">
                        <p className="font-black text-gray-900 dark:text-white">Use cases</p>
                        <p className="mt-1 text-gray-500">{profile.useCases.slice(0, 2).join(', ')}</p>
                      </div>
                      <div className="rounded bg-gray-50 p-2 dark:bg-gray-900">
                        <p className="font-black text-gray-900 dark:text-white">Visualize</p>
                        <p className="mt-1 text-gray-500">{profile.visualizations.slice(0, 2).join(', ')}</p>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-900 dark:text-gray-300">{model.latency} latency</span>
                  <span className="font-mono text-2xl font-black">{Math.round(score)}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{model.dataNeeds}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {model.trainable && <span className="rounded bg-emerald-100 px-2 py-1 font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">Trainable</span>}
                  {model.inference && <span className="rounded bg-blue-100 px-2 py-1 font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">Inference</span>}
                  {model.explainable && <span className="rounded bg-purple-100 px-2 py-1 font-bold text-purple-700 dark:bg-purple-950/30 dark:text-purple-200">Explainable</span>}
                </div>
                <ul className="space-y-1 text-xs text-gray-500">{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {model.route && <Link to={model.route} className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 font-bold text-white"><Play size={13} /> Open</Link>}
                  <Link to="/ml/lab/automl-assistant" className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 font-bold dark:border-gray-700"><BrainCircuit size={13} /> AutoML</Link>
                </div>
              </div>
            </Card>
          ))}
          {!visible.length && <Card><p className="text-sm text-gray-500">No models match this filter.</p></Card>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500"><Database size={13} /> Model ranking uses the active workspace dataset when one is loaded.</div>
    </div>
  );
}
