import type { LoadedAlgorithmDataset } from '../data/algorithmDatasets';
import { profileDataset } from './preprocessing/dataProfile';
import { scoreDatasetForAlgorithms } from './experimentWorkspace';

export type ModelFamily = 'Classical ML' | 'Deep Learning' | 'NLP' | 'Vision' | 'Time Series' | 'Recommender' | 'Reinforcement Learning';
export type ModelTask = 'classification' | 'regression' | 'clustering' | 'dimensionality' | 'timeSeries' | 'nlp' | 'vision' | 'recommendation' | 'reinforcement';

export interface ZooModel {
  id: string;
  name: string;
  family: ModelFamily;
  task: ModelTask;
  route?: string;
  trainable: boolean;
  inference: boolean;
  explainable: boolean;
  latency: 'low' | 'medium' | 'high';
  dataNeeds: string;
  strengths: string[];
  warnings: string[];
  defaultParams: Record<string, number | string | boolean>;
  metrics: string[];
}

export interface ModelOperationalProfile {
  useCases: string[];
  preprocessing: string[];
  visualizations: string[];
  explainability: string[];
  inferenceModes: string[];
  deploymentNotes: string[];
}

export const modelZoo: ZooModel[] = [
  { id: 'linear-regression', name: 'Linear Regression', family: 'Classical ML', task: 'regression', route: '/ml/supervised/simple-linear-regression', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Numeric features and numeric target.', strengths: ['Fast baseline', 'Interpretable coefficients'], warnings: ['Linear assumption', 'Sensitive to outliers'], defaultParams: { regularization: 0, fitIntercept: true }, metrics: ['RMSE', 'MAE', 'R2'] },
  { id: 'logistic-regression', name: 'Logistic Regression', family: 'Classical ML', task: 'classification', route: '/ml/supervised/logistic-regression', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Numeric features and class target.', strengths: ['Calibrated probabilities', 'Strong baseline'], warnings: ['Needs scaling', 'Linear boundary'], defaultParams: { learningRate: 0.08, epochs: 80, threshold: 0.5 }, metrics: ['Accuracy', 'F1', 'ROC AUC'] },
  { id: 'knn', name: 'K-Nearest Neighbors', family: 'Classical ML', task: 'classification', route: '/ml/supervised/knn-classification', trainable: true, inference: true, explainable: true, latency: 'medium', dataNeeds: 'Scaled numeric features.', strengths: ['Simple local reasoning', 'Nonlinear boundaries'], warnings: ['Slow inference on large data', 'Distance metric matters'], defaultParams: { k: 5, distance: 'euclidean' }, metrics: ['Accuracy', 'F1'] },
  { id: 'decision-tree', name: 'Decision Tree', family: 'Classical ML', task: 'classification', route: '/ml/supervised/decision-tree-classification', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Mixed numeric/categorical after encoding.', strengths: ['Human-readable rules', 'Nonlinear splits'], warnings: ['Can overfit', 'Unstable small changes'], defaultParams: { maxDepth: 5, minSamplesSplit: 4 }, metrics: ['Accuracy', 'F1', 'Feature importance'] },
  { id: 'random-forest', name: 'Random Forest', family: 'Classical ML', task: 'classification', route: '/ml/supervised/random-forest-classification', trainable: true, inference: true, explainable: true, latency: 'medium', dataNeeds: 'Tabular labeled data.', strengths: ['Robust tabular model', 'Good default accuracy'], warnings: ['Less transparent than a tree', 'More memory'], defaultParams: { trees: 80, maxDepth: 8 }, metrics: ['Accuracy', 'F1', 'OOB score'] },
  { id: 'gradient-boosting', name: 'Gradient Boosting', family: 'Classical ML', task: 'classification', route: '/ml/supervised/gradient-boosting-classification', trainable: true, inference: true, explainable: true, latency: 'medium', dataNeeds: 'Clean labeled tabular data.', strengths: ['High tabular accuracy', 'Handles nonlinearities'], warnings: ['Tuning sensitive', 'Can overfit noisy data'], defaultParams: { estimators: 120, learningRate: 0.08, maxDepth: 3 }, metrics: ['Accuracy', 'F1', 'Log loss'] },
  { id: 'kmeans', name: 'K-Means', family: 'Classical ML', task: 'clustering', route: '/ml/clustering/k-means', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Scaled numeric features without labels.', strengths: ['Fast grouping', 'Easy centroid inspection'], warnings: ['Requires K', 'Sensitive to scale/outliers'], defaultParams: { k: 3, iterations: 50 }, metrics: ['Silhouette', 'Inertia'] },
  { id: 'pca', name: 'PCA', family: 'Classical ML', task: 'dimensionality', route: '/ml/dimensionality-reduction/pca', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Scaled numeric matrix.', strengths: ['Fast projection', 'Variance explanation'], warnings: ['Linear projection', 'Components can be hard to name'], defaultParams: { components: 2 }, metrics: ['Explained variance', 'Reconstruction error'] },
  { id: 'mlp', name: 'Multilayer Perceptron', family: 'Deep Learning', task: 'classification', route: '/ml/deep-learning/mlp', trainable: true, inference: true, explainable: false, latency: 'medium', dataNeeds: 'Scaled features, enough labeled rows.', strengths: ['Flexible nonlinear model', 'Browser TFJS capable'], warnings: ['Needs tuning', 'Less interpretable'], defaultParams: { hiddenUnits: 16, learningRate: 0.01, epochs: 80 }, metrics: ['Accuracy', 'Loss'] },
  { id: 'cnn', name: 'Convolutional Neural Network', family: 'Vision', task: 'vision', route: '/ml/deep-learning/cnn', trainable: true, inference: true, explainable: true, latency: 'high', dataNeeds: 'Images or pixel grids with labels.', strengths: ['Spatial feature learning', 'Transfer learning ready'], warnings: ['Needs many examples', 'GPU preferred'], defaultParams: { filters: 16, kernel: 3, epochs: 20 }, metrics: ['Accuracy', 'Loss', 'Grad-CAM'] },
  { id: 'tfidf-naive-bayes', name: 'TF-IDF + Naive Bayes', family: 'NLP', task: 'nlp', route: '/ml/nlp/naive-bayes-spam', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'Text column and class labels.', strengths: ['Fast text baseline', 'Token-level explanations'], warnings: ['Bag-of-words loses order', 'Vocabulary drift'], defaultParams: { maxFeatures: 3000, alpha: 1 }, metrics: ['Accuracy', 'F1', 'Top tokens'] },
  { id: 'lstm-forecast', name: 'LSTM Forecaster', family: 'Time Series', task: 'timeSeries', route: '/ml/time-series/lstm-forecasting', trainable: true, inference: true, explainable: false, latency: 'high', dataNeeds: 'Ordered sequence with numeric target.', strengths: ['Learns temporal patterns', 'Multi-step forecasting'], warnings: ['Needs sequence volume', 'Harder to debug'], defaultParams: { window: 12, units: 24, epochs: 30 }, metrics: ['MAE', 'RMSE', 'MAPE'] },
  { id: 'matrix-factorization', name: 'Matrix Factorization', family: 'Recommender', task: 'recommendation', route: '/ml/recommendation/matrix-factorization', trainable: true, inference: true, explainable: false, latency: 'medium', dataNeeds: 'user_id, item_id, rating columns.', strengths: ['Personalized recommendations', 'Latent factors'], warnings: ['Cold start', 'Bias in interactions'], defaultParams: { factors: 12, learningRate: 0.02, epochs: 50 }, metrics: ['RMSE', 'Precision@K'] },
  { id: 'q-learning', name: 'Q-Learning', family: 'Reinforcement Learning', task: 'reinforcement', route: '/ml/reinforcement-learning/q-learning-grid-world', trainable: true, inference: true, explainable: true, latency: 'low', dataNeeds: 'State, action, reward transitions.', strengths: ['Transparent value table', 'Policy learning'], warnings: ['Discrete state simplification', 'Exploration design matters'], defaultParams: { alpha: 0.2, gamma: 0.9, epsilon: 0.15 }, metrics: ['Reward', 'Regret', 'Policy stability'] },
];

function inferDatasetTask(dataset: LoadedAlgorithmDataset): ModelTask {
  const profile = profileDataset(dataset.data, dataset.target);
  const names = dataset.columns.join(' ').toLowerCase();
  if (/text|review|message|body|content|sentence/.test(names)) return 'nlp';
  if (/image|pixel|row|col/.test(names)) return 'vision';
  if (/user_id|item_id|rating/.test(names)) return 'recommendation';
  if (/state|action|reward|arm|trial/.test(names)) return 'reinforcement';
  if (/date|time|month|step|sales|forecast|temperature/.test(names)) return 'timeSeries';
  if (!dataset.target) return profile.numericColumns.length >= 2 ? 'clustering' : 'classification';
  const targetProfile = profile.columnsProfile.find(column => column.name === dataset.target);
  return targetProfile?.type === 'numeric' && targetProfile.unique > Math.min(12, profile.rows / 2) ? 'regression' : 'classification';
}

export function recommendModels(dataset?: LoadedAlgorithmDataset) {
  if (!dataset) return modelZoo.map(model => ({ model, score: model.trainable ? 70 : 55, reasons: ['No active dataset loaded yet.'] }));
  const task = inferDatasetTask(dataset);
  const profile = profileDataset(dataset.data, dataset.target);
  const algorithmFits = scoreDatasetForAlgorithms(dataset, 20);
  return modelZoo.map(model => {
    const routeFit = algorithmFits.find(item => item.algorithm.route === model.route);
    const taskMatch = model.task === task || (task === 'classification' && ['classification', 'nlp', 'vision'].includes(model.task));
    const rowPenalty = profile.rows < 20 ? 12 : profile.rows < 50 ? 5 : 0;
    const missingPenalty = profile.missing > 0 ? 8 : 0;
    const score = Math.max(0, Math.min(100, (routeFit?.score ?? 62) + (taskMatch ? 18 : -8) - rowPenalty - missingPenalty));
    const reasons = [
      taskMatch ? `Matches inferred ${task} task.` : `Dataset looks like ${task}; this model is ${model.task}.`,
      profile.missing ? `${profile.missing} missing value(s) need preprocessing.` : 'No missing cells detected.',
      routeFit?.warnings[0] ?? model.strengths[0],
    ];
    return { model, score, reasons };
  }).sort((a, b) => b.score - a.score);
}

export function automlPlan(dataset?: LoadedAlgorithmDataset) {
  const recommendations = recommendModels(dataset).slice(0, 5);
  const profile = dataset ? profileDataset(dataset.data, dataset.target) : null;
  const preprocessing = [
    profile?.missing ? 'Fill missing values by median/mode before training.' : 'Keep missing-value check in the pipeline.',
    profile && profile.duplicates > 0 ? `Remove ${profile.duplicates} duplicate row(s).` : 'Track duplicate rows as a quality gate.',
    profile && profile.categoricalColumns.length ? 'Encode categorical columns; try one-hot for linear models and label encoding for trees.' : 'Scale numeric columns before distance-based or neural models.',
    profile && profile.columnsProfile.some(column => column.likelyId) ? 'Drop likely ID columns to avoid memorization.' : 'Run leakage check against target-like feature names.',
  ];
  const warnings = [
    profile && profile.rows < 30 ? 'Dataset is small; use cross-validation and avoid over-trusting a single score.' : '',
    profile && profile.missing / Math.max(1, profile.rows * profile.columns) > 0.1 ? 'Missingness rate is high; inspect whether missing values carry signal.' : '',
    dataset?.target ? '' : 'No target selected; supervised training needs a target column.',
  ].filter(Boolean);
  return { recommendations, preprocessing, warnings };
}

export function buildTrainingBlueprint(dataset?: LoadedAlgorithmDataset) {
  const plan = automlPlan(dataset);
  const topModel = plan.recommendations[0]?.model;
  const profile = dataset ? profileDataset(dataset.data, dataset.target) : null;
  const pipeline = [
    {
      stage: 'Validate',
      action: dataset ? `Check ${dataset.data.length} rows, ${dataset.columns.length} columns, target ${dataset.target ?? 'unset'}.` : 'Load a dataset and select a target column.',
      status: dataset ? 'ready' : 'blocked',
    },
    {
      stage: 'Preprocess',
      action: plan.preprocessing.slice(0, 2).join(' '),
      status: profile && profile.missing === 0 && profile.duplicates === 0 ? 'ready' : 'needs work',
    },
    {
      stage: 'Train',
      action: topModel ? `Start with ${topModel.name} using ${Object.keys(topModel.defaultParams).join(', ')}.` : 'Choose a baseline model.',
      status: topModel ? 'ready' : 'blocked',
    },
    {
      stage: 'Tune',
      action: 'Run grid search first, then random or Bayesian-style search around the best region.',
      status: 'planned',
    },
    {
      stage: 'Explain',
      action: topModel?.explainable ? 'Use feature importance, PDP, and counterfactual checks.' : 'Use surrogate explanations and input sensitivity checks.',
      status: 'planned',
    },
    {
      stage: 'Infer',
      action: 'Run single-row and batch predictions, then inspect confidence and explanation notes.',
      status: 'planned',
    },
  ];
  const monitoring = [
    'Track latency p95 and memory use per inference batch.',
    'Compare calibration and fairness across important slices.',
    'Watch drift PSI for top features and target distribution.',
    'Re-run explainability checks after major preprocessing changes.',
  ];
  const validationPlan = [
    profile && profile.rows < 100 ? 'Use repeated cross-validation because the dataset is small.' : 'Use train/validation/test split with stratification when classes exist.',
    dataset?.target ? `Keep ${dataset.target} out of preprocessing fit steps until labels are required.` : 'Select a target before supervised scoring.',
    'Compare a simple baseline, an interpretable model, and the top AutoML recommendation.',
    'Check calibration, fairness slices, robustness to noisy inputs, and latency before saving a winner.',
  ];
  const artifacts = [
    'Dataset profile JSON',
    'Preprocessing recipe',
    'Training run metrics',
    'Model card draft',
    'Inference sample set',
    'Monitoring thresholds',
  ];
  const metricTargets = topModel?.metrics.map((metric, index) => ({
    metric,
    target: /rmse|mae|loss|mape/i.test(metric) ? `minimize below baseline - ${8 + index * 3}%` : `improve over baseline + ${5 + index * 2}%`,
  })) ?? [
    { metric: 'Accuracy/F1 or RMSE', target: 'Choose after target type is known.' },
  ];
  const readinessScore = Math.round(
    (dataset ? 35 : 0)
    + (dataset?.target ? 15 : 0)
    + (profile && profile.missing === 0 ? 15 : 0)
    + (profile && profile.duplicates === 0 ? 10 : 0)
    + (topModel ? Math.min(25, plan.recommendations[0].score / 4) : 0),
  );
  return { ...plan, pipeline, monitoring, validationPlan, artifacts, metricTargets, readinessScore, topModel };
}

export function getModelOperationalProfile(model: ZooModel): ModelOperationalProfile {
  const commonInference = ['Single-row prediction', 'Batch prediction', 'Saved model metadata replay'];
  const explainable = model.explainable
    ? ['Feature importance', 'Permutation importance', 'Partial dependence', 'Counterfactual checks']
    : ['Surrogate tree', 'Input sensitivity', 'Embedding/neuron probe', 'Counterfactual checks'];

  if (model.task === 'nlp') {
    return {
      useCases: ['Spam detection', 'Sentiment classification', 'Ticket routing'],
      preprocessing: ['Clean text', 'Tokenize', 'Build TF-IDF or embeddings', 'Track vocabulary drift'],
      visualizations: ['Top tokens', 'Confusion matrix', 'PR curve', 'Error examples'],
      explainability: ['Token contribution', 'Local text perturbation', 'Class probability waterfall'],
      inferenceModes: [...commonInference, 'Paste text prediction'],
      deploymentNotes: ['Version vocabulary', 'Monitor unseen-token rate', 'Review bias in sensitive terms'],
    };
  }
  if (model.task === 'vision') {
    return {
      useCases: ['Image classification', 'Defect detection', 'Visual inspection'],
      preprocessing: ['Resize images', 'Normalize channels', 'Augment train images', 'Hold out camera/device groups'],
      visualizations: ['Loss curves', 'Confusion matrix', 'Grad-CAM', 'Misclassified gallery'],
      explainability: ['Grad-CAM', 'Occlusion sensitivity', 'Prototype examples'],
      inferenceModes: [...commonInference, 'Image upload prediction'],
      deploymentNotes: ['Track image resolution drift', 'Measure device latency', 'Keep label map with artifact'],
    };
  }
  if (model.task === 'timeSeries') {
    return {
      useCases: ['Demand forecasting', 'Anomaly detection', 'Sensor forecasting'],
      preprocessing: ['Sort by time', 'Create lags/windows', 'Avoid future leakage', 'Backtest by time split'],
      visualizations: ['Forecast vs actual', 'Residuals over time', 'MAPE by horizon', 'Drift chart'],
      explainability: ['Lag importance', 'Seasonality profile', 'Counterfactual demand shocks'],
      inferenceModes: [...commonInference, 'Rolling-window forecast'],
      deploymentNotes: ['Use time-based backtests', 'Monitor horizon error', 'Protect against future-data leakage'],
    };
  }
  if (model.task === 'recommendation') {
    return {
      useCases: ['Product recommendations', 'Content ranking', 'Next best action'],
      preprocessing: ['Validate user_id/item_id/rating', 'Create holdout interactions', 'Handle cold start'],
      visualizations: ['Precision@K', 'Coverage', 'Popularity bias', 'Embedding map'],
      explainability: ['Similar users/items', 'Factor contribution', 'Counterfactual item changes'],
      inferenceModes: [...commonInference, 'Top-K recommendation'],
      deploymentNotes: ['Monitor coverage and popularity bias', 'Refresh interactions', 'Audit cold-start behavior'],
    };
  }
  if (model.task === 'reinforcement') {
    return {
      useCases: ['Policy simulation', 'Grid-world learning', 'Bandit optimization'],
      preprocessing: ['Validate state/action/reward schema', 'Normalize rewards', 'Define terminal states'],
      visualizations: ['Reward curve', 'Policy map', 'Regret', 'Value table'],
      explainability: ['Q-value table', 'Policy trace', 'Reward attribution'],
      inferenceModes: [...commonInference, 'Policy action lookup'],
      deploymentNotes: ['Keep simulator assumptions explicit', 'Constrain exploration', 'Monitor reward hacking'],
    };
  }
  return {
    useCases: model.task === 'regression' ? ['Price prediction', 'Risk scoring', 'Demand estimation'] : ['Churn prediction', 'Fraud detection', 'Approval classification'],
    preprocessing: ['Impute missing values', 'Encode categoricals', 'Scale for linear/distance models', 'Drop leakage columns'],
    visualizations: model.task === 'regression' ? ['Residual plot', 'Prediction vs actual', 'Feature importance', 'Error distribution'] : ['Confusion matrix', 'ROC/PR curves', 'Decision boundary', 'Feature importance'],
    explainability: explainable,
    inferenceModes: commonInference,
    deploymentNotes: ['Export preprocessing recipe with model', 'Track schema contract', 'Monitor calibration, drift, and p95 latency'],
  };
}
