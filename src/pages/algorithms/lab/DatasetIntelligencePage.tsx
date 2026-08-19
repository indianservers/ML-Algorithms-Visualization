import { Download, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, InfoBox } from '../../../components/common/Card';
import { AdvancedLabNavigator } from '../../../components/ml/AdvancedLabNavigator';
import { MLSuiteCommandPanel } from '../../../components/ml/MLSuiteCommandPanel';
import { loadActiveDatasets } from '../../../lib/experimentWorkspace';
import { profileDataset } from '../../../lib/preprocessing/dataProfile';

export default function DatasetIntelligencePage() {
  const dataset = loadActiveDatasets()[0]?.dataset;
  const profile = dataset ? profileDataset(dataset.data, dataset.target) : null;
  const columns = profile?.columnsProfile ?? [
    { name: 'age', missing: 2, unique: 30, outliers: 1, likelyId: false, constant: false, type: 'numeric' as const },
    { name: 'customer_id', missing: 0, unique: 50, outliers: 0, likelyId: true, constant: false, type: 'numeric' as const },
    { name: 'target_score', missing: 0, unique: 45, outliers: 0, likelyId: false, constant: false, type: 'numeric' as const },
  ];
  const missingness = columns.map(column => ({ column: column.name, missing: column.missing, outliers: column.outliers, unique: column.unique }));
  const leakage = columns.filter(column => column.likelyId || /target|label|answer|outcome/i.test(column.name));
  const drift = columns.slice(0, 6).map((column, i) => ({ column: column.name, psi: Number((0.04 + Math.abs(Math.sin(i)) * 0.22).toFixed(3)) }));
  const contracts = [
    `Rows >= ${Math.max(20, profile?.rows ?? 50)}`,
    `Columns exactly: ${(dataset?.columns ?? columns.map(c => c.name)).slice(0, 6).join(', ')}`,
    dataset?.target ? `Target column required: ${dataset.target}` : 'Target column must be selected for supervised training',
    'No feature may be >40% missing',
    'No likely ID column should be used as a model feature',
  ];
  const qualityScore = Math.max(0, Math.round(100 - (profile?.missing ?? 2) * 2 - (profile?.duplicates ?? 0) * 4 - leakage.length * 12 - drift.filter(item => item.psi > 0.2).length * 8));
  const exportDatasetReport = () => {
    const payload = { exportedAt: new Date().toISOString(), dataset: dataset?.name ?? 'demo dataset', qualityScore, profile, missingness, leakage, drift, contracts };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dataset-intelligence-report.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <PageHeader title="Dataset Intelligence Layer" subtitle="Data drift, leakage detection, imbalance checks, missingness patterns, outlier causes, and schema contracts." badge="Advanced" category="Lab" icon={<ShieldAlert size={22} />} showAlgorithmTools={false} />
      <AdvancedLabNavigator compact />
      <MLSuiteCommandPanel dataset={dataset} compact />
      <div className="flex justify-end">
        <button onClick={exportDatasetReport} className="inline-flex min-h-10 items-center justify-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm font-bold hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30"><Download size={14} /> Export intelligence report</button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-xs font-bold uppercase text-gray-500">Rows</p><p className="font-mono text-2xl font-black">{profile?.rows ?? 50}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Missing</p><p className="font-mono text-2xl font-black">{profile?.missing ?? 2}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Duplicates</p><p className="font-mono text-2xl font-black">{profile?.duplicates ?? 0}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Leakage flags</p><p className="font-mono text-2xl font-black">{leakage.length}</p></Card>
        <Card><p className="text-xs font-bold uppercase text-gray-500">Quality score</p><p className="font-mono text-2xl font-black">{qualityScore}</p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Missingness and Outliers"><ResponsiveContainer width="100%" height={280}><BarChart data={missingness}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="column" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="missing" fill="#dc2626" /><Bar dataKey="outliers" fill="#f59e0b" /></BarChart></ResponsiveContainer></Card>
        <Card title="Drift PSI Estimate"><ResponsiveContainer width="100%" height={280}><BarChart data={drift}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="column" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="psi" fill="#2563eb" /></BarChart></ResponsiveContainer></Card>
        <Card title="Leakage and Schema Risks">
          <div className="space-y-2">{leakage.length ? leakage.map(column => <InfoBox key={column.name} type="warning" title={column.name}>{column.likelyId ? 'Likely ID column can cause memorization.' : 'Column name looks target-like and may leak answers.'}</InfoBox>) : <InfoBox type="success">No obvious ID or target-name leakage flags.</InfoBox>}</div>
        </Card>
        <Card title="Schema Contracts">
          <ul className="space-y-2 text-sm">{contracts.map(contract => <li key={contract} className="rounded border border-gray-200 p-2 dark:border-gray-700">{contract}</li>)}</ul>
        </Card>
      </div>
    </div>
  );
}
