import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Wand2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadActiveDatasets } from '../../../lib/experimentWorkspace';
import { buildTrainingBlueprint } from '../../../lib/modelZoo';

function downloadPlan(payload: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'automl-blueprint.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AutoMLAssistantPage() {
  const dataset = loadActiveDatasets()[0]?.dataset;
  const plan = useMemo(() => buildTrainingBlueprint(dataset), [dataset]);
  const chart = plan.recommendations.map(item => ({ model: item.model.name, score: Math.round(item.score) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="AutoML Assistant" subtitle="Automatically suggests algorithms, preprocessing, hyperparameters, and warnings based on dataset shape." badge="Advanced" category="Lab" icon={<Wand2 size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel dataset={dataset} compact />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card title="Dataset Diagnosis">
            {dataset ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Dataset</p><p className="truncate font-bold">{dataset.name}</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Target</p><p className="truncate font-bold">{dataset.target ?? 'unset'}</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Rows</p><p className="font-mono font-bold">{dataset.data.length}</p></div>
                <div className="rounded bg-gray-50 p-3 dark:bg-gray-900"><p className="text-xs text-gray-500">Columns</p><p className="font-mono font-bold">{dataset.columns.length}</p></div>
              </div>
            ) : <InfoBox type="info">Load a dataset in Dataset Manager or an algorithm page to get specific AutoML recommendations.</InfoBox>}
          </Card>
          <Card title="Preprocessing Plan">
            <ol className="space-y-2 text-sm">
              {plan.preprocessing.map((step, index) => <li key={step} className="flex gap-2 rounded border border-gray-200 p-2 dark:border-gray-700"><CheckCircle2 size={14} className="mt-0.5 text-emerald-600" /><span><b>{index + 1}.</b> {step}</span></li>)}
            </ol>
          </Card>
          <InfoBox type={plan.warnings.length ? 'warning' : 'success'} title="AutoML Warnings">
            {plan.warnings.length ? plan.warnings.join(' ') : 'No major blocking warnings for the current dataset.'}
          </InfoBox>
          <Card title="Blueprint Readiness">
            <div className="space-y-3 text-sm">
              <div className="rounded bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
                <p className="text-xs font-bold uppercase">Training readiness</p>
                <p className="font-mono text-3xl font-black">{plan.readinessScore}/100</p>
              </div>
              <button onClick={() => downloadPlan({ dataset, plan })} className="min-h-10 w-full rounded bg-blue-600 px-3 py-2 text-sm font-bold text-white">Export AutoML Plan</button>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Recommended Models">
            <ResponsiveContainer width="100%" height={280}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="model" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="score" fill="#2563eb" /></BarChart></ResponsiveContainer>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {plan.recommendations.map(({ model, score, reasons }, index) => (
              <Card key={model.id} title={`${index + 1}. ${model.name}`} subtitle={`${model.family} / score ${Math.round(score)}`}>
                <div className="space-y-3 text-sm">
                  <pre className="overflow-auto rounded bg-gray-950 p-3 text-xs text-gray-100">{JSON.stringify(model.defaultParams, null, 2)}</pre>
                  <ul className="space-y-1 text-xs text-gray-500">{reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {model.warnings.map(warning => <span key={warning} className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><AlertTriangle size={11} /> {warning}</span>)}
                  </div>
                  {model.route && <Link to={model.route} className="inline-flex min-h-10 items-center rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white">Open recommended algorithm</Link>}
                </div>
              </Card>
            ))}
          </div>
          <Card title="End-to-End Pipeline Blueprint">
            <div className="grid gap-2 md:grid-cols-3">
              {plan.pipeline.map(step => (
                <div key={step.stage} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                  <p className="font-black text-gray-900 dark:text-white">{step.stage}</p>
                  <p className="mt-1 text-xs text-gray-500">{step.action}</p>
                  <p className="mt-2 rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-900 dark:text-gray-300">{step.status}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Monitoring Checklist">
            <div className="grid gap-2 md:grid-cols-2">
              {plan.monitoring.map(item => <div key={item} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">{item}</div>)}
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Validation Plan">
              <div className="space-y-2">
                {plan.validationPlan.map(item => <div key={item} className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700">{item}</div>)}
              </div>
            </Card>
            <Card title="Metric Targets">
              <div className="space-y-2">
                {plan.metricTargets.map(item => (
                  <div key={item.metric} className="grid grid-cols-[140px_1fr] gap-2 rounded border border-gray-200 p-3 text-sm dark:border-gray-700">
                    <span className="font-black text-gray-900 dark:text-white">{item.metric}</span>
                    <span className="text-gray-500">{item.target}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card title="Exportable Artifacts">
            <div className="grid gap-2 md:grid-cols-3">
              {plan.artifacts.map(item => <div key={item} className="rounded border border-gray-200 p-3 text-sm font-bold dark:border-gray-700">{item}</div>)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
