import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Download, Route, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { loadActiveDatasets } from '../../lib/experimentWorkspace';
import { getSuiteReadiness } from '../../lib/mlSuiteInsights';
import type { LoadedAlgorithmDataset } from '../../data/algorithmDatasets';

const toneClass = {
  good: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200',
  warn: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
  info: 'bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
};

export function MLSuiteCommandPanel({ dataset, compact = false }: { dataset?: LoadedAlgorithmDataset; compact?: boolean }) {
  const activeDataset = dataset ?? loadActiveDatasets()[0]?.dataset;
  const suite = getSuiteReadiness(activeDataset);
  const exportBrief = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      dataset: activeDataset ? {
        id: activeDataset.id,
        name: activeDataset.name,
        rows: activeDataset.data.length,
        columns: activeDataset.columns,
        target: activeDataset.target,
        type: activeDataset.type,
      } : null,
      readiness: suite.insights,
      governance: suite.governance,
      recommendedModels: suite.recommendations.map(item => ({
        model: item.model.name,
        family: item.model.family,
        task: item.model.task,
        score: Math.round(item.score),
        params: item.model.defaultParams,
        reasons: item.reasons,
      })),
      blueprint: suite.blueprint,
      productionGates: suite.productionGates,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ml-suite-brief.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card title="ML Command Layer" subtitle="Shared readiness, next actions, and production gates across the full advanced ML workflow." icon={<Activity size={14} />}>
      <div className="mb-3 flex justify-end">
        <button onClick={exportBrief} className="inline-flex min-h-9 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-xs font-bold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
          <Download size={13} /> Export suite brief
        </button>
      </div>
      <div className={`grid gap-3 ${compact ? 'lg:grid-cols-[1fr_1fr]' : 'xl:grid-cols-[1fr_1fr_1.2fr]'}`}>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-gray-500"><CheckCircle2 size={13} /> Readiness</div>
          <div className="grid grid-cols-2 gap-2">
            {suite.insights.map(item => (
              <div key={item.label} className={`rounded p-3 ${toneClass[item.tone]}`}>
                <p className="text-[11px] font-bold uppercase opacity-80">{item.label}</p>
                <p className="truncate text-sm font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-gray-500"><ShieldCheck size={13} /> Governance</div>
          <div className="grid grid-cols-2 gap-2">
            {suite.governance.map(item => (
              <div key={item.label} className={`rounded p-3 ${toneClass[item.tone]}`}>
                <p className="text-[11px] font-bold uppercase opacity-80">{item.label}</p>
                <p className="truncate text-sm font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {!compact && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-gray-500"><Route size={13} /> Next Best Actions</div>
            <div className="grid gap-2 md:grid-cols-2">
              {suite.actions.map(action => (
                <Link key={action.label} to={action.route} className="rounded border border-gray-200 p-3 text-sm hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                  <p className="font-black text-gray-900 dark:text-white">{action.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{action.reason}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {suite.productionGates.map(gate => (
            <div key={gate} className="rounded border border-gray-200 p-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">{gate}</div>
          ))}
        </div>
      )}
    </Card>
  );
}
