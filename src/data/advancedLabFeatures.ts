import {
  BarChart3,
  Boxes,
  BrainCircuit,
  FlaskConical,
  GitCompare,
  Lightbulb,
  Play,
  ShieldAlert,
  SlidersHorizontal,
  Wand2,
} from 'lucide-react';

export const advancedLabFeatures = [
  {
    label: 'Experiment Workspace',
    route: '/ml/lab/experiment-workspace',
    summary: 'Common command center for datasets, runs, notes, recommended algorithms, and next actions.',
    icon: FlaskConical,
  },
  {
    label: 'Model Zoo',
    route: '/ml/lab/model-zoo',
    summary: 'Built-in classical ML, deep learning, NLP, vision, time-series, recommender, and RL models.',
    icon: Boxes,
  },
  {
    label: 'AutoML Assistant',
    route: '/ml/lab/automl-assistant',
    summary: 'Dataset-aware model, preprocessing, hyperparameter, and warning recommendations.',
    icon: Wand2,
  },
  {
    label: 'Training Visualizations',
    route: '/ml/lab/training-visualizations',
    summary: 'Loss, boundaries, importance, gradients, confusion, ROC, and residual diagnostics.',
    icon: Play,
  },
  {
    label: 'Inference Playground',
    route: '/ml/lab/inference-playground',
    summary: 'Single and batch prediction surface with saved-model metadata and explanations.',
    icon: BrainCircuit,
  },
  {
    label: 'Comparison Dashboard',
    route: '/ml/lab/model-comparison-dashboard',
    summary: 'Accuracy, F1, RMSE, latency, memory, fairness, calibration, and robustness comparison.',
    icon: GitCompare,
  },
  {
    label: 'Explainability Center',
    route: '/ml/lab/explainability-center',
    summary: 'SHAP/LIME-style contributions, PDP, permutation importance, and counterfactuals.',
    icon: Lightbulb,
  },
  {
    label: 'Dataset Intelligence',
    route: '/ml/lab/dataset-intelligence',
    summary: 'Drift, leakage, imbalance, missingness, outliers, and schema contracts.',
    icon: ShieldAlert,
  },
  {
    label: 'Tuning Engine',
    route: '/ml/lab/tuning-engine',
    summary: 'Grid, random, Bayesian-style search, early stopping, and tuning history.',
    icon: SlidersHorizontal,
  },
  {
    label: 'Performance Dashboard',
    route: '/ml/lab/performance-dashboard',
    summary: 'Live browser inference latency, memory, FPS, and prediction drift monitoring.',
    icon: BarChart3,
  },
];
