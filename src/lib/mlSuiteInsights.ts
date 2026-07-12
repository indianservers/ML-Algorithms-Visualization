import type { LoadedAlgorithmDataset } from '../data/algorithmDatasets';
import { profileDataset } from './preprocessing/dataProfile';
import { buildTrainingBlueprint, recommendModels } from './modelZoo';

export interface MLSuiteInsight {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'info';
}

export interface MLSuiteAction {
  label: string;
  route: string;
  reason: string;
}

export function getSuiteReadiness(dataset?: LoadedAlgorithmDataset) {
  const blueprint = buildTrainingBlueprint(dataset);
  const profile = dataset ? profileDataset(dataset.data, dataset.target) : null;
  const recommendations = recommendModels(dataset).slice(0, 3);
  const highRiskMissing = profile ? profile.missing / Math.max(1, profile.rows * profile.columns) > 0.1 : false;
  const likelyLeakage = profile?.columnsProfile.filter(column => column.likelyId || /target|label|answer|outcome/i.test(column.name)) ?? [];
  const bestModel = recommendations[0]?.model;

  const insights: MLSuiteInsight[] = [
    {
      label: 'Dataset',
      value: dataset ? `${profile?.rows ?? 0} rows / ${profile?.columns ?? 0} cols` : 'Not loaded',
      tone: dataset ? 'good' : 'warn',
    },
    {
      label: 'Target',
      value: dataset?.target ?? 'Not selected',
      tone: dataset?.target ? 'good' : 'warn',
    },
    {
      label: 'Best model',
      value: bestModel?.name ?? 'Pending',
      tone: bestModel ? 'good' : 'info',
    },
    {
      label: 'Readiness',
      value: `${blueprint.readinessScore}/100`,
      tone: blueprint.readinessScore >= 75 ? 'good' : blueprint.readinessScore >= 45 ? 'info' : 'warn',
    },
  ];

  const governance: MLSuiteInsight[] = [
    {
      label: 'Leakage',
      value: likelyLeakage.length ? `${likelyLeakage.length} flag(s)` : 'Clear',
      tone: likelyLeakage.length ? 'warn' : 'good',
    },
    {
      label: 'Missingness',
      value: profile ? `${profile.missing} cells` : 'Unknown',
      tone: highRiskMissing ? 'warn' : profile?.missing ? 'info' : 'good',
    },
    {
      label: 'Duplicates',
      value: profile ? `${profile.duplicates} rows` : 'Unknown',
      tone: profile?.duplicates ? 'warn' : 'good',
    },
    {
      label: 'Explainability',
      value: bestModel?.explainable ? 'Native' : bestModel ? 'Surrogate' : 'Pending',
      tone: bestModel?.explainable ? 'good' : 'info',
    },
  ];

  const actions: MLSuiteAction[] = [
    !dataset
      ? { label: 'Load dataset', route: '/ml/lab/dataset-manager', reason: 'Start with clean data and target metadata.' }
      : { label: 'Run AutoML', route: '/ml/lab/automl-assistant', reason: `Use ${bestModel?.name ?? 'a baseline'} and preprocessing guidance.` },
    profile && (profile.missing > 0 || profile.duplicates > 0 || likelyLeakage.length > 0)
      ? { label: 'Inspect data quality', route: '/ml/lab/dataset-intelligence', reason: 'Resolve quality gates before trusting metrics.' }
      : { label: 'Train and visualize', route: '/ml/lab/training-visualizations', reason: 'Watch loss, boundaries, metrics, and residuals together.' },
    { label: 'Compare models', route: '/ml/lab/model-comparison-dashboard', reason: 'Balance score, latency, memory, fairness, calibration, and robustness.' },
    { label: 'Inference playground', route: '/ml/lab/inference-playground', reason: 'Test single and batch predictions with row-level explanations.' },
  ];

  const productionGates = [
    dataset?.target ? 'Supervised target selected.' : 'Select a target for supervised training.',
    profile && profile.rows >= 30 ? 'Enough rows for first-pass validation.' : 'Use cross-validation or add rows for reliable validation.',
    likelyLeakage.length === 0 ? 'No obvious leakage columns.' : 'Remove ID or target-like leakage columns.',
    bestModel?.explainable ? 'Model supports native explanations.' : 'Plan surrogate explanations and sensitivity checks.',
    'Track drift, calibration, fairness slices, p95 latency, and memory before deployment.',
  ];

  return { blueprint, profile, recommendations, insights, governance, actions, productionGates };
}
