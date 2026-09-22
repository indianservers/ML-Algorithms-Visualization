import type { TermLesson } from './termsStudio';

export type GlossaryLane =
  | 'Core'
  | 'Models'
  | 'Training'
  | 'Data'
  | 'Math'
  | 'NLP'
  | 'Vision'
  | 'Optimization'
  | 'Evaluation'
  | 'Trees'
  | 'CNN'
  | 'Sequence'
  | 'Attention';

export const GLOSSARY_PILLS = [
  'All',
  'Beginner',
  'Core',
  'Evaluation',
  'Optimization',
  'Training',
  'Data',
  'Models',
  'Trees',
  'CNN',
  'Sequence',
  'Attention',
  'Math',
  'NLP',
  'Vision',
] as const;

export type GlossaryPill = (typeof GLOSSARY_PILLS)[number];
export type GlossarySort = 'az' | 'za' | 'beginner' | 'intermediate';

const LANE_BY_SLUG: Record<string, GlossaryLane> = {
  neuron: 'Core',
  'residual-connection': 'Core',
  overfitting: 'Core',
  underfitting: 'Core',
  'forward-pass': 'Core',
  perceptron: 'Core',
  relu: 'Models',
  'leaky-relu': 'Models',
  sigmoid: 'Models',
  tanh: 'Models',
  softmax: 'Models',
  'gelu-swish': 'Models',
  'softplus-elu': 'Models',
  'gradient-descent': 'Optimization',
  'sgd-mini-batch': 'Optimization',
  'learning-rate': 'Optimization',
  momentum: 'Optimization',
  adam: 'Optimization',
  'learning-rate-schedules': 'Optimization',
  'gradient-clipping': 'Optimization',
  'local-minima': 'Optimization',
  backpropagation: 'Training',
  'epochs-batches': 'Training',
  batch: 'Training',
  epoch: 'Training',
  'loss-function': 'Training',
  'mse-mae-huber': 'Training',
  'binary-cross-entropy': 'Training',
  'categorical-cross-entropy': 'Training',
  'hinge-loss': 'Training',
  'kl-divergence': 'Training',
  'contrastive-triplet': 'Training',
  dropout: 'Training',
  'early-stopping': 'Training',
  'weight-decay': 'Training',
  'l1-l2': 'Training',
  'batch-layer-norm': 'Training',
  temperature: 'Training',
  'feature-scaling': 'Data',
  'one-hot': 'Data',
  embedding: 'NLP',
  'data-augmentation': 'Vision',
  'data-leakage': 'Data',
  padding: 'Data',
  'train-val-test': 'Evaluation',
  'validation-set': 'Evaluation',
  'cross-validation': 'Evaluation',
  'learning-curve': 'Evaluation',
  baseline: 'Evaluation',
  'bias-variance': 'Evaluation',
  'dot-product': 'Math',
  norms: 'Math',
  'chain-rule': 'Math',
  'cosine-similarity': 'Math',
  'vanishing-exploding': 'Math',
  'weight-initialization': 'Math',
  attention: 'Attention',
  token: 'NLP',
  transformer: 'Attention',
  'decision-boundary': 'Evaluation',
  'confusion-matrix': 'Evaluation',
  'roc-curve': 'Evaluation',
  'precision-recall': 'Evaluation',
  'f1-score': 'Evaluation',
  accuracy: 'Evaluation',
  'class-imbalance': 'Evaluation',
  entropy: 'Trees',
  'gini-impurity': 'Trees',
  'information-gain': 'Trees',
  pruning: 'Trees',
  bootstrap: 'Trees',
  bagging: 'Trees',
  boosting: 'Trees',
  convolution: 'CNN',
  'filter-kernel': 'CNN',
  stride: 'CNN',
  'convolution-padding': 'CNN',
  pooling: 'CNN',
  'feature-map': 'CNN',
  rnn: 'Sequence',
  lstm: 'Sequence',
  'self-attention': 'Attention',
  'query-key-value': 'Attention',
  'positional-encoding': 'Attention',
  'euclidean-distance': 'Math',
  'manhattan-distance': 'Math',
  'kernel-trick': 'Models',
  'support-vector': 'Models',
  margin: 'Models',
  shap: 'Evaluation',
  'feature-importance': 'Evaluation',
  'transfer-learning': 'Models',
  'fine-tuning': 'Models',
};

const LABEL_BY_SLUG: Record<string, string> = {
  neuron: 'Neuron',
  adam: 'Adam',
  'epochs-batches': 'Epoch',
  'train-val-test': 'Train / Val / Test',
  'mse-mae-huber': 'MSE / MAE / Huber',
  overfitting: 'Overfitting',
  'dot-product': 'Dot Product',
  'bias-variance': 'Bias-Variance',
  'one-hot': 'One-Hot',
  'sgd-mini-batch': 'SGD',
  'gelu-swish': 'GELU',
  'softplus-elu': 'ELU',
  'leaky-relu': 'Leaky ReLU',
  'feature-scaling': 'Feature Scaling',
  'learning-rate': 'Learning Rate',
  'gradient-descent': 'Gradient Descent',
  'cross-validation': 'Cross-Validation',
  'binary-cross-entropy': 'BCE',
  'categorical-cross-entropy': 'Cross-Entropy',
  'contrastive-triplet': 'Contrastive Loss',
  'batch-layer-norm': 'Batch Norm',
  'learning-rate-schedules': 'LR Schedule',
  'residual-connection': 'Residual',
  'weight-initialization': 'Init',
  'vanishing-exploding': 'Vanishing Gradient',
  'local-minima': 'Local Minima',
  'data-augmentation': 'Augmentation',
  'data-leakage': 'Leakage',
  'cosine-similarity': 'Cosine',
};

const LINE_BY_SLUG: Record<string, string> = {
  attention: 'Focuses on the most relevant information.',
  'feature-scaling': 'Rescales features to a similar range.',
  relu: 'Activation function: output max(0, x).',
  backpropagation: 'Computes gradients to update model weights.',
  'gradient-descent': 'Iteratively updates parameters to reduce error.',
  softmax: 'Converts values to probabilities.',
  batch: 'A small subset of data used for one update step.',
  'learning-rate': 'Controls the size of parameter updates.',
  token: 'A small piece of text (word or subword).',
  'cross-validation': 'Evaluates model performance on multiple splits.',
  'loss-function': 'Measures how wrong the model’s predictions are.',
  'mse-mae-huber': 'Measures how wrong the model’s predictions are.',
  transformer: 'Model architecture based on self-attention.',
  embedding: 'Turns categorical data into dense vectors.',
  neuron: 'A simple unit that computes a weighted sum.',
  underfitting: 'Too simple to capture the underlying pattern.',
  epoch: 'One full pass through the training data.',
  'epochs-batches': 'One full pass through the training data.',
  overfitting: 'Learns training data too well and fails on new data.',
  'validation-set': 'Data used to tune and evaluate the model.',
  'train-val-test': 'Data used to tune and evaluate the model.',
};

const CATEGORY_LANE: Record<TermLesson['category'], GlossaryLane> = {
  optimization: 'Optimization',
  activations: 'Models',
  losses: 'Training',
  regularization: 'Training',
  neural: 'Core',
  'data-math': 'Data',
};

export function getGlossaryLane(term: TermLesson): GlossaryLane {
  return LANE_BY_SLUG[term.slug] ?? CATEGORY_LANE[term.category];
}

export function getGlossaryLabel(term: TermLesson): string {
  return LABEL_BY_SLUG[term.slug] ?? term.label;
}

export function getGlossaryLine(term: TermLesson): string {
  return LINE_BY_SLUG[term.slug] ?? term.blurb;
}

function stub(term: {
  slug: string;
  label: string;
  category: TermLesson['category'];
  badge: TermLesson['badge'];
  blurb: string;
  synonyms?: string[];
  tags?: string[];
  related?: string[];
  labLinks?: TermLesson['labLinks'];
  demo?: TermLesson['demo'];
}): TermLesson {
  return {
    analogy: term.blurb,
    hook: term.blurb,
    explanation: [term.blurb],
    workedExample: {
      title: term.label,
      setup: term.blurb,
      steps: [term.blurb],
      takeaway: term.blurb,
    },
    tryThis: ['Open a related term if you want the longer studio page.'],
    whenToUse: term.blurb,
    watchFor: 'This is a compact glossary entry. Follow the related terms for the full walkthrough.',
    related: term.related ?? [],
    labLinks: term.labLinks ?? [],
    demo: { kind: 'neuron' },
    synonyms: term.synonyms ?? [],
    tags: term.tags ?? [],
    ...term,
  };
}

export const termsStudioGlossaryExtras: TermLesson[] = [
  stub({
    slug: 'transformer',
    label: 'Transformer',
    category: 'neural',
    badge: 'Intermediate',
    blurb: 'Model architecture based on self-attention.',
    synonyms: ['transformers', 'encoder decoder', 'bert', 'gpt'],
    tags: ['nlp', 'attention'],
    related: ['attention', 'token', 'residual-connection'],
    labLinks: [{ label: 'Transformer attention', route: '/ml/deep-learning/transformer-attention' }],
    demo: { kind: 'self-attention' },
  }),
  stub({
    slug: 'underfitting',
    label: 'Underfitting',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'Too simple to capture the underlying pattern.',
    synonyms: ['underfit', 'high bias'],
    tags: ['evaluation'],
    related: ['overfitting', 'bias-variance', 'learning-curve'],
  }),
  stub({
    slug: 'loss-function',
    label: 'Loss Function',
    category: 'losses',
    badge: 'Beginner',
    blurb: 'Measures how wrong the model’s predictions are.',
    synonyms: ['cost', 'objective', 'error function'],
    tags: ['training'],
    related: ['mse-mae-huber', 'gradient-descent'],
  }),
  stub({
    slug: 'batch',
    label: 'Batch',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'A small subset of data used for one update step.',
    synonyms: ['mini-batch', 'batch size'],
    tags: ['training'],
    related: ['epochs-batches', 'sgd-mini-batch'],
  }),
  stub({
    slug: 'validation-set',
    label: 'Validation Set',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Data used to tune and evaluate the model.',
    synonyms: ['dev set', 'val set', 'holdout'],
    tags: ['evaluation'],
    related: ['train-val-test', 'overfitting'],
  }),
];
