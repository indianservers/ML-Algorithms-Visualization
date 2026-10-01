import { getAlgorithmByRoute } from './implementationStatus';
import { generatedAlgorithmLessons } from './generatedAlgorithmLessons';
import { algorithmSearchMeta } from './algorithmSearchMeta';
import { getAlgorithmIntroduction } from './algorithmIntroductions';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface LessonPage {
  pageNumber: number;
  title: string;
  story: string;
  simpleExplanation: string;
  realtimeExample: string;
  realtimeApplications: string[];
  teacherTip: string;
}

export interface RouteLessonContent {
  algorithmId: string;
  sourceTitle: string;
  lessons: LessonPage[];
  quiz: QuizQuestion[];
}

export interface LearningContent {
  lessons: LessonPage[];
  objectives: string[];
  intuition: string;
  pseudocode: string[];
  formula: string;
  code: string;
  python: string;
  mistakes: string[];
  challenge: string;
  quiz: QuizQuestion[];
}

const categoryHints: Record<string, Pick<LearningContent, 'formula' | 'challenge'>> = {
  'Supervised - Regression': {
    formula: 'minimize mean squared error: J(theta) = (1/n) sum (y - y_hat)^2',
    challenge: 'Tune the model to reduce validation error without widening the train/test gap.',
  },
  'Supervised - Classification': {
    formula: 'optimize class probabilities and evaluate precision, recall, F1, ROC, or PR curves',
    challenge: 'Move the decision threshold and find a useful tradeoff between false positives and false negatives.',
  },
  Clustering: {
    formula: 'group points by distance, density, likelihood, or graph structure without labels',
    challenge: 'Change the data shape and hyperparameters until the clusters match the visible structure.',
  },
  'Dimensionality Reduction': {
    formula: 'project high-dimensional data into fewer dimensions while preserving variance or neighborhoods',
    challenge: 'Reduce dimensions while preserving class separation or neighborhood structure.',
  },
  'Deep Learning': {
    formula: 'forward pass -> loss -> backpropagation -> weight update',
    challenge: 'Adjust architecture and learning rate until loss falls smoothly without instability.',
  },
  Evaluation: {
    formula: 'measure generalization by comparing predictions, labels, thresholds, splits, and residuals',
    challenge: 'Find a metric setting that matches the business cost of different errors.',
  },
  Preprocessing: {
    formula: 'transform raw columns into clean, scaled, encoded, and leak-free model inputs',
    challenge: 'Create the cleanest version of the dataset while avoiding leakage from validation data.',
  },
  'Time Series': {
    formula: 'forecast future values from trend, seasonality, lagged values, and residual structure',
    challenge: 'Tune smoothing or window size to follow trend without chasing noise.',
  },
  NLP: {
    formula: 'convert text into tokens, counts, weights, embeddings, probabilities, or sequence states',
    challenge: 'Edit example text and inspect which tokens or weights drive the prediction.',
  },
  'Computer Vision': {
    formula: 'transform pixels through filters, features, embeddings, or learned convolutional layers',
    challenge: 'Alter the image or filter and explain which visual pattern becomes easier to detect.',
  },
  Recommendation: {
    formula: 'estimate user-item preference from similarity, content features, or latent factors',
    challenge: 'Create a cold-start case and compare content-based versus collaborative behavior.',
  },
  'Reinforcement Learning': {
    formula: 'learn value from reward: Q(s,a) <- Q(s,a) + alpha [r + gamma max Q(s\',a\') - Q(s,a)]',
    challenge: 'Tune exploration and discounting so the agent learns a stable policy.',
  },
  Explainability: {
    formula: 'attribute model behavior to feature changes, local perturbations, or marginal effects',
    challenge: 'Find one example where global importance and local explanation disagree.',
  },
  Optimization: {
    formula: 'theta <- theta - learning_rate * gradient(loss)',
    challenge: 'Find the fastest stable learning rate and compare it with momentum or Adam behavior.',
  },
  Ensemble: {
    formula: 'combine multiple learners by voting, averaging, boosting, or stacking',
    challenge: 'Compare one strong model with several weak models combined.',
  },
  Probabilistic: {
    formula: 'represent uncertainty with distributions, priors, likelihoods, posteriors, or hidden states',
    challenge: 'Change prior or noise assumptions and inspect how uncertainty changes.',
  },
  Deployment: {
    formula: 'package model artifacts, inputs, outputs, metadata, and runtime constraints for inference',
    challenge: 'Export a small model card with intended use and limitations.',
  },
  Lab: {
    formula: 'compare algorithms under identical data, splits, metrics, and reporting rules',
    challenge: 'Run at least three algorithms on the same dataset and defend the chosen winner.',
  },
};

const routeFormulas: Record<string, string> = {
  '/ml/supervised/multinomial-logistic-regression': 'P(y=k|x) = exp(wₖ·x+bₖ) / Σⱼ exp(wⱼ·x+bⱼ); predict the class with the largest probability',
  '/ml/dimensionality-reduction/lda': 'choose projection W to maximize between-class scatter relative to within-class scatter: tr[(Wᵀ S_W W)⁻¹(Wᵀ S_B W)]',
  '/ml/ensemble/boosting': 'AdaBoost: H(x) = sign(Σₘ αₘhₘ(x)); increase the training weight of misclassified examples between weak learners',
  '/ml/nlp/text-classification': 'Multinomial Naive Bayes: score(c) = log P(c) + Σᵥ count(v, document) log P(v|c)',
  '/ml/nlp/naive-bayes-spam': 'Multinomial Naive Bayes: score(c) = log P(c) + Σᵥ count(v, message) log P(v|c)',
  '/ml/deep-learning/perceptron': 'ŷ = step(w·x + b); on a mistake, w ← w + η(y − ŷ)x and b ← b + η(y − ŷ)',
  '/ml/reinforcement-learning/markov-decision-process': 'V*(s) = maxₐ Σₛ′ P(s′|s,a) [R(s,a,s′) + γV*(s′)]',
  '/ml/reinforcement-learning/multi-armed-bandit': 'Q̂(a) = sum of observed rewards for action a / number of times action a was chosen; compare estimated reward while balancing exploration',
  '/ml/optimization/sgd': 'θₜ₊₁ = θₜ − η∇ℓᵢ(θₜ) for a sampled example or mini-batch',
  '/ml/optimization/momentum': 'vₜ = μvₜ₋₁ + ∇L(θₜ); θₜ₊₁ = θₜ − ηvₜ',
  '/ml/optimization/adam': 'mₜ = β₁mₜ₋₁ + (1−β₁)gₜ; vₜ = β₂vₜ₋₁ + (1−β₂)gₜ²; θₜ₊₁ = θₜ − ηm̂ₜ/(√v̂ₜ+ε)',
  '/ml/time-series/moving-average': 'ŷₜ₊₁ = (yₜ + yₜ₋₁ + … + yₜ₋ₙ₊₁) / n for a one-step-ahead forecast from n past observations',
  '/ml/time-series/exponential-smoothing': 'ℓₜ = αyₜ + (1−α)ℓₜ₋₁; the next level forecast is ℓₜ',
  '/ml/dimensionality-reduction/tsne': 'minimize KL(P‖Q), where P and Q encode pairwise neighborhood probabilities in the original and map spaces',
};

const categoryMechanics: Record<string, [string, string]> = {
  'Supervised - Regression': ['Input: numeric features and known numeric targets. Output: a prediction for a new row.', 'Fit on labeled training rows, then compare numeric predictions with held-out targets and inspect residuals.'],
  'Supervised - Classification': ['Input: features and known class labels. Output: a predicted class or class probability.', 'Learn from labeled rows, then inspect held-out mistakes and class-specific metrics.'],
  Clustering: ['Input: unlabeled feature vectors. Output: groups, representatives, or noise labels.', 'Choose a similarity rule, form groups, then test whether assignments remain meaningful as settings change.'],
  'Dimensionality Reduction': ['Input: many measured features. Output: a lower-dimensional representation.', 'Preserve the particular structure the method targets, then inspect what information the projection loses.'],
  'Deep Learning': ['Input: examples represented as tensors. Output: a learned prediction or representation.', 'Compute a forward result, measure a task loss, and update parameters when the method includes training.'],
  Evaluation: ['Input: predictions, targets, or data splits. Output: evidence about model behavior.', 'Apply the metric definition to examples, then interpret it against the cost of mistakes.'],
  Preprocessing: ['Input: raw training rows. Output: transformed rows with a repeatable rule.', 'Fit any transformation statistics on training data and apply the same rule to unseen data.'],
  'Time Series': ['Input: observations in chronological order. Output: a smoother, decomposition, anomaly signal, or forecast.', 'Use only information available at each time and assess behavior on later observations.'],
  NLP: ['Input: text, tokens, or language features. Output: counts, vectors, classes, or other text-derived signals.', 'Apply the stated text representation, then inspect how wording changes the result.'],
  'Computer Vision': ['Input: images or video frames. Output: visual features, classes, positions, or masks.', 'Inspect image preprocessing and how predictions change across lighting, scale, and viewpoint.'],
  Recommendation: ['Input: user, item, content, or interaction signals. Output: a ranked list or estimated preference.', 'Compare the resulting ranking with a popularity baseline and probe sparse or new-user cases.'],
  'Reinforcement Learning': ['Input: states, actions, transitions, and rewards. Output: values or a policy for choosing actions.', 'Trace a transition and reward, then evaluate the resulting behavior over multiple episodes.'],
  Explainability: ['Input: a fitted model and examples. Output: an attribution or behavioral summary.', 'Perturb an input or compare examples, then check whether the explanation tracks actual prediction changes.'],
  Optimization: ['Input: an objective and its update signal. Output: a sequence of parameter values.', 'Take controlled update steps and compare objective values and stability across learning rates.'],
  Ensemble: ['Input: predictions or learners to combine. Output: a combined prediction.', 'Compare individual errors with the combined result on the same evaluation data.'],
  Probabilistic: ['Input: observations and probabilistic assumptions. Output: beliefs, distributions, or uncertainty estimates.', 'Update beliefs from evidence and check whether predicted uncertainty matches observed outcomes.'],
  Deployment: ['Input: a model artifact and validated inputs. Output: a reproducible inference result.', 'Check preprocessing parity, versioning, latency, and behavior on invalid inputs.'],
  Lab: ['Input: datasets, settings, and experiments. Output: results that can be reproduced and compared.', 'Hold the evaluation data fixed while changing one experimental choice at a time.'],
  'AI Algorithms Virtual Labs': ['Input: the states, rules, and controls defined by this virtual lab. Output: the resulting path, policy, decision, or state change.', 'Trace one transition at a time and compare the result with the stated algorithm rule.'],
};

// These generated workbooks describe a different method from the page implementation.
const misassignedWorkbookRoutes = new Set([
  '/ml/supervised/multinomial-logistic-regression',
  '/ml/dimensionality-reduction/lda',
  '/ml/ensemble/boosting',
]);

function resolveHints(route: string) {
  const item = getAlgorithmByRoute(route);
  const hints = item ? categoryHints[item.category] : undefined;
  return {
    item,
    formula: routeFormulas[route] ?? hints?.formula ?? 'inspect data -> configure model -> compute output -> evaluate behavior',
    challenge: hints?.challenge ?? 'Run a controlled experiment and explain what changed.',
  };
}

function createFallbackLessons(route: string, label: string, category: string, formula: string, challenge: string): LessonPage[] {
  const item = getAlgorithmByRoute(route);
  const intro = item ? getAlgorithmIntroduction(item) : undefined;
  const description = algorithmSearchMeta[route]?.description ?? intro?.summary ?? `${label} is a ${category} method.`;
  const [inputOutput, process] = categoryMechanics[category] ?? [
    'Identify what data the method receives and what result it produces.',
    'Trace one input through the method and compare its result with a simple baseline.',
  ];
  return [
    {
      pageNumber: 1,
      title: `${label}: The Big Idea`,
      story: `Start with the task ${label} actually addresses, then identify the data and the result shown by this lab.`,
      simpleExplanation: description,
      realtimeExample: intro?.useWhen ?? `Use ${label} when its assumptions match the task and available data.`,
      realtimeApplications: [category, 'controlled experiments', 'model comparison'],
      teacherTip: 'Explain the specific input and output before changing a control.',
    },
    {
      pageNumber: 2,
      title: `${label}: Inputs and Outputs`,
      story: 'Treat each chart mark as a real input, intermediate value, or result rather than a decoration.',
      simpleExplanation: inputOutput,
      realtimeExample: `In this lab, observe how the output of ${label} responds when you change one valid input.`,
      realtimeApplications: ['data inspection', 'input validation', 'output interpretation'],
      teacherTip: 'Name the units and labels before interpreting the picture.',
    },
    {
      pageNumber: 3,
      title: `How ${label} Works`,
      story: 'Follow the input through the computation and inspect where the result changes.',
      simpleExplanation: `${description} ${process}`,
      realtimeExample: 'Keep the data and seed fixed while changing one setting so the cause of a change stays visible.',
      realtimeApplications: ['controlled experiments', 'debugging', 'validation'],
      teacherTip: 'Check that each step matches the method shown by the lab.',
    },
    {
      pageNumber: 4,
      title: `The Rule Behind ${label}`,
      story: 'Connect each symbol or phrase in the rule to the input, operation, or output it represents.',
      simpleExplanation: formula,
      realtimeExample: `Use the rule as a check on what the ${label} controls actually change.`,
      realtimeApplications: ['algorithm mechanics', 'parameter effects', 'result checks'],
      teacherTip: 'A rule for an optimizer, metric, or transform is not automatically a model-fitting loss.',
    },
    {
      pageNumber: 5,
      title: `${label} in the Real World`,
      story: 'A useful result needs evidence about its limits and the conditions in which it was produced.',
      simpleExplanation: intro?.watchFor ?? `Check where ${label} fails and whether its assumptions match new data.`,
      realtimeExample: 'Compare with a simple baseline on appropriate held-out examples or controlled cases.',
      realtimeApplications: ['result review', 'failure analysis', 'reproducible experiments'],
      teacherTip: challenge,
    },
  ];
}

function isGenericWorkbook(lessons: LessonPage[]) {
  return lessons[0]?.simpleExplanation.includes('transforms observed data into a useful representation, estimate, or decision');
}

function correctWorkbookLessons(route: string, lessons: LessonPage[]): LessonPage[] {
  if (route === '/ml/supervised/logistic-regression') return lessons.map((lesson) => ({
    ...lesson,
    simpleExplanation: lesson.simpleExplanation.replace('through a sigmoid or softmax', 'through a sigmoid'),
    realtimeExample: lesson.realtimeExample.replace('whether an email is spam, fraud, or safe', 'whether an email is spam or not spam'),
  }));
  if (['/ml/supervised/naive-bayes', '/ml/nlp/text-classification', '/ml/nlp/naive-bayes-spam'].includes(route)) {
    return lessons.map((lesson) => lesson.pageNumber === 4 ? {
      ...lesson,
      realtimeExample: 'The class with the largest posterior score is the predicted class.',
    } : lesson);
  }
  return lessons;
}

function correctWorkbookQuiz(route: string, label: string, description: string, question: QuizQuestion): QuizQuestion {
  if (question.question.startsWith('Why does the formula matter')) {
    const options = question.options.map((option, index) => index === question.answer
      ? 'It states the rule connecting the inputs to the output'
      : option);
    return { ...question, options, explanation: `The ${label} formula describes how its inputs determine the result.` };
  }
  if (route === '/ml/supervised/naive-bayes') {
    if (question.question.startsWith('Which real-world use')) return {
      ...question,
      options: question.options.map((option, index) => index === question.answer ? 'Classifying flowers from numeric petal measurements' : option),
      explanation: 'Gaussian Naive Bayes models continuous measurements with class-specific Gaussian distributions.',
    };
    if (question.question.startsWith('Which setting should')) return {
      ...question,
      options: question.options.map((option, index) => index === question.answer ? 'Variance smoothing for numeric features' : option),
      explanation: 'Variance smoothing prevents near-zero feature variances from creating unstable likelihoods.',
    };
  }
  if (question.options.some((option) => option.endsWith('...') || option.endsWith('…'))) return {
    ...question,
    options: question.options.map((option, index) => index === question.answer && (option.endsWith('...') || option.endsWith('…')) ? description : option),
    explanation: description,
  };
  return question;
}

function fallbackQuiz(label: string, description: string): QuizQuestion[] {
  return [
    {
      question: `What is the main job of ${label}?`,
      options: [description, 'Guarantee a correct result for every input', 'Remove the need to inspect data'],
      answer: 0,
      explanation: description,
    },
    {
      question: `What should you check before trusting ${label}?`,
      options: ['Whether its assumptions fit the data and task', 'Only whether the chart looks smooth', 'Only its training result'],
      answer: 0,
      explanation: 'Inputs, assumptions, and evaluation conditions determine whether a result is meaningful.',
    },
    {
      question: 'How can you tell which control changed the outcome?',
      options: ['Change one setting while keeping data and seed fixed', 'Change every setting at once', 'Ignore the baseline'],
      answer: 0,
      explanation: 'A controlled experiment makes the cause of a change easier to identify.',
    },
  ];
}

export function getLearningContent(route: string): LearningContent {
  const { item, formula, challenge } = resolveHints(route);
  const label = item?.label ?? 'this algorithm';
  const category = item?.category ?? 'Machine Learning';
  const workbookContent = generatedAlgorithmLessons[route];
  const description = algorithmSearchMeta[route]?.description ?? `${label} is a ${category} method.`;
  const useWorkbook = workbookContent?.lessons?.length === 5
    && !misassignedWorkbookRoutes.has(route)
    && !isGenericWorkbook(workbookContent.lessons);
  const lessons = useWorkbook
    ? correctWorkbookLessons(route, workbookContent.lessons)
    : createFallbackLessons(route, label, category, formula, challenge);
  const workbookQuiz = useWorkbook && workbookContent.quiz?.length
    ? workbookContent.quiz.map((question) => correctWorkbookQuiz(route, label, description, question))
    : undefined;

  return {
    lessons,
    objectives: [
      `Explain what ${label} computes and when to use it.`,
      `Identify the inputs, outputs, and assumptions for ${category}.`,
      'Run one controlled experiment and interpret the resulting change.',
    ],
    intuition: `${label} becomes easier to learn when you connect each input and control to the visible output, then inspect where the method fails.`,
    pseudocode: [
      'Identify the input, output, and assumptions of this method.',
      ...(categoryMechanics[category] ?? ['Trace one input through the method.', 'Compare the result with a simple baseline.']),
      'Keep the input fixed and change one relevant control.',
      'Inspect the result and explain what changed.',
    ],
    formula,
    code: `// Conceptual sequence for ${label}\n// 1. Identify the inputs and assumptions.\n// 2. ${categoryMechanics[category]?.[1] ?? 'Trace an input through the method.'}\n// 3. Change one control and compare the result.`,
    python: `# Conceptual sequence for ${label}\n# Identify the input and expected output.\n# ${categoryMechanics[category]?.[1] ?? 'Trace an input through the method.'}\n# Change one setting and inspect the result.`,
    mistakes: [
      'Changing many settings at once and losing the cause of the result.',
      'Drawing conclusions from one example without checking other valid inputs.',
      'Ignoring whether the input matches the method’s assumptions.',
    ],
    challenge,
    quiz: workbookQuiz ?? fallbackQuiz(label, description),
  };
}
