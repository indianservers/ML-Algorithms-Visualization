import type { LoadedAlgorithmDataset } from '../data/algorithmDatasets';
import { getAllAlgorithms, type AlgorithmNavItem } from '../data/implementationStatus';
import { checkDatasetCompatibility } from './preprocessing/datasetCompatibility';

export const ACTIVE_DATASETS_KEY = 'mlSuite.activeAlgorithmDatasets';
export const WORKSPACE_NOTES_KEY = 'mlSuite.experimentWorkspaceNotes';

export interface DatasetFit {
  algorithm: AlgorithmNavItem;
  score: number;
  errors: string[];
  warnings: string[];
  notes: string[];
  expectedTask: string;
}

export interface ActiveDatasetEntry {
  route: string;
  dataset: LoadedAlgorithmDataset;
}

export function loadActiveDatasetMap() {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_DATASETS_KEY) ?? '{}') as Record<string, LoadedAlgorithmDataset>;
  } catch {
    return {};
  }
}

export function loadActiveDatasets(): ActiveDatasetEntry[] {
  return Object.entries(loadActiveDatasetMap()).map(([route, dataset]) => ({ route, dataset }));
}

function categoryBonus(dataset: LoadedAlgorithmDataset, algorithm: AlgorithmNavItem) {
  const type = dataset.type ?? '';
  const text = `${algorithm.route} ${algorithm.category}`.toLowerCase();
  if (type === 'classification' && /classification|nlp|vision|confusion|roc|precision|ensemble/.test(text)) return 14;
  if (type === 'regression' && /regression|forecast|time|metrics|optimization/.test(text)) return 14;
  if (type === 'clustering' && /clustering|dimensionality|pca|tsne|umap/.test(text)) return 14;
  if (type === 'timeSeries' && /time|forecast|rnn|lstm|gru|arima|holt/.test(text)) return 16;
  if (type === 'nlp' && /nlp|text|sentiment|spam|embedding|bayes/.test(text)) return 16;
  if (type === 'recommendation' && /recommendation|collaborative|matrix/.test(text)) return 16;
  return 0;
}

function routePenalty(algorithm: AlgorithmNavItem) {
  if (algorithm.category === 'Lab') return 18;
  if (algorithm.category === 'Deployment') return 8;
  if (algorithm.category === 'Preprocessing' || algorithm.category === 'Evaluation') return 4;
  return 0;
}

export function scoreDatasetForAlgorithms(dataset: LoadedAlgorithmDataset, limit = 8): DatasetFit[] {
  return getAllAlgorithms()
    .map(algorithm => {
      const fit = checkDatasetCompatibility(dataset, algorithm.route, algorithm.category);
      const score = 100
        - fit.errors.length * 28
        - fit.warnings.length * 8
        + categoryBonus(dataset, algorithm)
        - routePenalty(algorithm)
        + Math.min(10, fit.profile.numericColumns.length * 2)
        + (dataset.target ? 5 : 0);
      return {
        algorithm,
        score: Math.max(0, Math.min(100, score)),
        errors: fit.errors,
        warnings: fit.warnings,
        notes: fit.notes,
        expectedTask: fit.expectedTask,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function bestFitSummary(dataset: LoadedAlgorithmDataset, limit = 3) {
  const fits = scoreDatasetForAlgorithms(dataset, limit);
  if (!fits.length) return 'No algorithm fit could be scored yet.';
  return `Best for ${fits.map(item => item.algorithm.label).join(', ')}.`;
}

export function loadWorkspaceNotes() {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(WORKSPACE_NOTES_KEY) ?? '';
}

export function saveWorkspaceNotes(notes: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WORKSPACE_NOTES_KEY, notes);
}
