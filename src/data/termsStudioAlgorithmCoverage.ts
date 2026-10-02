import { navigationData } from './navigation';
import { algorithmCatalogSearchMeta } from './algorithmCatalogSearchMeta';
import { getAlgorithmIntroduction } from './algorithmIntroductions';
import type { TermCategoryId, TermLesson } from './termsStudio';

// Keep the glossary in step with the catalog. Lab and Deployment contain tools,
// rather than algorithm lessons, so they are outside this algorithm index.
const excludedCategories = new Set(['Terms Studio', 'Lab', 'Deployment']);

// An algorithm can have a short catalog name and a longer teaching name.
// Preserve both searchable entries and link their explanations to the lab.
const teachingTermByRouteTail: Record<string, string> = {
  'k-means': 'k-means-clustering',
  pca: 'principal-component-analysis',
  lda: 'linear-discriminant-analysis',
  tsne: 't-sne',
  'umap-concept': 'umap',
  'knn-classification': 'k-nearest-neighbors',
  'svm-classification': 'support-vector-machine',
  cnn: 'convolutional-neural-network',
  mlp: 'multilayer-perceptron',
  rnn: 'recurrent-neural-network',
  lstm: 'long-short-term-memory',
  gru: 'gated-recurrent-unit',
  'transformer-attention': 'transformer',
  'backpropagation-visualizer': 'backpropagation',
  'convolution-visualizer': 'convolution',
  'train-test-split': 'train-val-test',
  'roc-auc': 'roc-curve',
  'precision-recall-curve': 'precision-recall',
  'scaling-normalization': 'feature-scaling',
  'shap-concept': 'shap',
  sgd: 'sgd-mini-batch',
  'gaussian-process-regression': 'gaussian-process',
};

const termCategory: Record<string, TermCategoryId> = {
  'Supervised - Regression': 'models',
  'Supervised - Classification': 'models',
  Clustering: 'models',
  'Dimensionality Reduction': 'data-math',
  'Deep Learning': 'neural',
  Evaluation: 'evaluation',
  Preprocessing: 'data-math',
  'Time Series': 'time-series',
  NLP: 'language',
  'Computer Vision': 'vision',
  'AI Algorithms Virtual Labs': 'ai-foundations',
  Recommendation: 'models',
  'Reinforcement Learning': 'reinforcement',
  Explainability: 'evaluation',
  Optimization: 'optimization',
  Ensemble: 'models',
  Probabilistic: 'models',
};

const examplesByCategory: Record<string, [string, string]> = {
  'Supervised - Regression': ['A school has study hours and exam scores and wants to estimate a new student’s score.', 'A clinic has past measurements and wants to predict a continuous value for a new patient.'],
  'Supervised - Classification': ['A school has labeled student records and wants to predict whether a new student will pass.', 'A clinic has labeled examples and wants to assign a new record to one of the known classes.'],
  Clustering: ['A shop has customer behavior but no group labels and wants to discover useful segments.', 'A scientist has unlabeled measurements and wants to see which observations naturally belong together.'],
  'Dimensionality Reduction': ['A dataset has dozens of measurements per sample and needs a compact view for plotting.', 'A researcher compresses many correlated features before exploring or training another model.'],
  'Deep Learning': ['A learner trains a network on examples and watches how its internal representation changes.', 'An engineer compares model outputs on unseen examples to see whether learned features transfer.'],
  Evaluation: ['Two models look accurate, but their different errors matter when the rare class is important.', 'A team checks unseen data before deciding whether its model is reliable enough to use.'],
  Preprocessing: ['A table contains messy or differently scaled columns that must be prepared before training.', 'A learner applies the same transformation to training and test rows to avoid data leakage.'],
  'Time Series': ['A store records sales each day and wants to understand patterns or forecast later days.', 'A sensor produces ordered readings, so training and evaluation must respect time.'],
  NLP: ['A team analyzes messages and wants to turn text into useful signals or predictions.', 'A learner compares two differently worded sentences to see what information the method preserves.'],
  'Computer Vision': ['A camera image contains objects or patterns that a model must recognize or locate.', 'A learner tests the same visual task on new lighting and backgrounds to check robustness.'],
  'AI Algorithms Virtual Labs': ['A learner changes a small search problem and traces the next decision step by step.', 'A planner compares candidate actions to see how the method reaches its goal.'],
  Recommendation: ['A movie site has user interactions and wants to rank titles a visitor may enjoy.', 'A shop compares sparse user and item histories before recommending new products.'],
  'Reinforcement Learning': ['An agent tries actions in a grid and learns from the reward after each move.', 'A learner changes exploration or rewards and watches how the policy changes.'],
  Explainability: ['A team inspects which inputs contributed to one surprising prediction.', 'A learner compares explanations across records to see whether the model relies on sensible features.'],
  Optimization: ['A learner changes the update rule and observes how quickly training loss falls.', 'A team checks whether a different step size makes parameter updates more stable.'],
  Ensemble: ['Several models make predictions on the same records, and their outputs are combined.', 'A learner compares a single model with a combined model on examples neither has seen.'],
  Probabilistic: ['A model expresses uncertainty about an outcome instead of giving only one fixed answer.', 'A learner changes the evidence and checks how the predicted probability responds.'],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function usefulDescription(route: string, label: string, summary: string) {
  const description = algorithmCatalogSearchMeta[route]?.description ?? summary;
  return description.length > 25 ? description : `${label} is a method for exploring patterns and decisions in the interactive lab.`;
}

export function addAlgorithmTerms(lessons: TermLesson[]): TermLesson[] {
  const byName = new Map(lessons.map((term) => [normalize(term.label), term]));
  const bySlug = new Map(lessons.map((term) => [term.slug, term]));
  const usedSlugs = new Set(lessons.map((term) => term.slug));
  const added: TermLesson[] = [];

  navigationData.forEach((group, categoryIndex) => {
    if (excludedCategories.has(group.category)) return;
    group.items.forEach((item, itemIndex) => {
      const routeSlug = item.route.split('/').filter(Boolean).at(-1) ?? normalize(item.label).replaceAll(' ', '-');
      const teachingTerm = bySlug.get(teachingTermByRouteTail[routeSlug]);
      if (teachingTerm && !teachingTerm.labLinks.some((link) => link.route === item.route)) {
        teachingTerm.labLinks.push({ label: item.label, route: item.route });
      }
      const existing = byName.get(normalize(item.label));
      if (existing) {
        if (!existing.labLinks.some((link) => link.route === item.route)) {
          existing.labLinks.push({ label: item.label, route: item.route });
        }
        return;
      }

      const intro = getAlgorithmIntroduction({ ...item, category: group.category, categoryIndex, itemIndex });
      const description = usefulDescription(item.route, item.label, intro.summary);
      const [firstScenario, secondScenario] = examplesByCategory[group.category] ?? examplesByCategory['AI Algorithms Virtual Labs'];
      let slug = routeSlug;
      if (usedSlugs.has(slug)) slug = `${routeSlug}-algorithm`;
      let suffix = 2;
      while (usedSlugs.has(slug)) slug = `${routeSlug}-algorithm-${suffix++}`;
      usedSlugs.add(slug);

      const upcoming = item.badge === 'Upcoming';
      const term: TermLesson = {
        slug,
        label: item.label,
        category: termCategory[group.category] ?? 'models',
        badge: item.badge === 'Beginner' ? 'Beginner' : 'Intermediate',
        blurb: description,
        analogy: `Think of ${item.label} as a specific way to solve the ${group.category.toLowerCase()} task: change the inputs and inspect how its output responds.`,
        hook: description,
        explanation: [
          description,
          intro.useWhen,
          upcoming ? 'The linked lab is marked Upcoming; its page previews the method while the full experiment is being prepared.' : `Open the ${item.label} lab to change inputs, watch the method work, and connect the result to this explanation.`,
        ],
        workedExample: {
          title: `${item.label} in practice`,
          setup: `${firstScenario} ${description}`,
          steps: [
            'Start with the example inputs and identify the output or decision you want to understand.',
            `Apply ${item.label} and observe which patterns, actions, or predictions change.`,
            `Check the result against the goal and consider this limitation: ${intro.watchFor}`,
          ],
          takeaway: intro.useWhen,
        },
        moreExamples: [`${secondScenario} Use ${item.label} to explore the result, then compare it with the first example and check the method’s assumptions.`],
        tryThis: [
          upcoming ? 'Open the upcoming lab preview to see what the interactive experiment will cover.' : `Open the ${item.label} lab and change one input or control at a time.`,
          'Explain in your own words why the result changed and when you would use this method.',
        ],
        whenToUse: intro.useWhen,
        watchFor: intro.watchFor,
        related: [],
        labLinks: [{ label: item.label, route: item.route }],
        demo: { kind: 'concept-cards', variant: slug },
        synonyms: algorithmCatalogSearchMeta[item.route]?.synonyms ?? [],
        tags: [...new Set([group.category.toLowerCase(), ...(algorithmCatalogSearchMeta[item.route]?.tags ?? []), upcoming ? 'upcoming' : 'algorithm'])],
      };
      byName.set(normalize(item.label), term);
      added.push(term);
    });
  });
  return added;
}
