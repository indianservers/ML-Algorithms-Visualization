import type { TermLesson } from './termsStudio';
import { getTermEnhance } from './termsStudioEnhance';

export interface TermExample {
  title: string;
  description: string;
  steps?: string[];
  takeaway?: string;
}

// Shorter glossary and concept entries need examples of their own: their
// generated workedExample repeats the definition rather than applying it.
const concreteExamples: Record<string, [string, string]> = {
  'decision-boundary': [
    'An email with a spam score of 0.7 lies on the spam side of a 0.5 decision boundary; one scored 0.3 lies on the other side.',
    'A k-NN map colors each part of a scatter plot by its closest class. The line where the color changes is the boundary.',
  ],
  'confusion-matrix': [
    'Of 20 sick patients, a test catches 16 and misses 4. Those are 16 true positives and 4 false negatives.',
    'Of 80 healthy patients, it wrongly alarms for 6 and clears 74. Those are 6 false positives and 74 true negatives.',
  ],
  'roc-curve': [
    'At one threshold, a model catches 80 of 100 positives and falsely alarms for 20 of 100 negatives: TPR 0.8, FPR 0.2.',
    'Lowering the threshold may catch 95 positives but also alarm for 40 negatives. Plot both points to see the trade-off.',
  ],
  'precision-recall': [
    'A fraud alert flags 10 payments; 8 are fraud. Precision is 8/10 = 80%.',
    'There were 20 fraudulent payments in total, and the model found 8. Recall is 8/20 = 40%.',
  ],
  'f1-score': [
    'If precision is 80% and recall is 50%, F1 is about 62%: it falls between the two, closer to the smaller value.',
    'Catching every case by flagging everyone gives high recall but poor precision, so the F1 score remains limited.',
  ],
  accuracy: [
    'A model gets 90 of 100 labels right. Its accuracy is 90%.',
    'If 95 of 100 patients are healthy, predicting “healthy” for everyone scores 95% accuracy but catches no illness.',
  ],
  'class-imbalance': [
    'A fraud dataset has 990 normal purchases and 10 fraudulent ones. The rare class can be missed even with 99% accuracy.',
    'Look at recall for fraud and the confusion matrix, not accuracy alone, to see whether the model catches rare cases.',
  ],
  oversampling: [
    'With 100 common examples and 10 rare ones, duplicate or resample rare training rows to make their class easier to learn.',
    'Oversample only the training fold; copying a rare row into validation would make evaluation misleading.',
  ],
  undersampling: [
    'From 1,000 common and 50 rare examples, keep a smaller sample of common training rows to reduce imbalance.',
    'Dropping too many common examples may hide real patterns, so compare validation performance before keeping the change.',
  ],
  smote: [
    'Two rare-class points at x = 2 and x = 4 can produce a synthetic training point between them, such as x = 3.',
    'Generate synthetic points only inside each training fold; doing it before splitting leaks information into validation.',
  ],
  'kernel-trick': [
    'A straight line cannot separate red points inside a circle from blue points outside it. A kernel lets a linear separator work in a richer feature space.',
    'An RBF SVM can bend its effective boundary around a cluster without explicitly adding every curved feature yourself.',
  ],
  'support-vector': [
    'The closest red and blue training points determine where an SVM puts its separating line. Faraway points matter less.',
    'Move one of those closest points and the boundary may shift; move a distant point and it often stays put.',
  ],
  margin: [
    'Two separating lines classify every training point correctly, but one leaves a wider gap to the nearest points. An SVM prefers that wider margin.',
    'A narrow gap can make a tiny measurement change flip the class, while a wider gap offers more room.',
  ],
  entropy: [
    'A bag with only red balls has entropy 0: the next color is certain.',
    'A bag with half red and half blue balls has higher entropy: the next color is harder to guess.',
  ],
  'gini-impurity': [
    'A node with 10 cats and no dogs has Gini impurity 0 because it is pure.',
    'A node split evenly between cats and dogs has Gini impurity 0.5 for two classes.',
  ],
  'information-gain': [
    'A yes/no question divides a mixed basket into one all-apple basket and one all-orange basket. That split gains a lot of information.',
    'A question that leaves both child baskets just as mixed as the parent gains little information.',
  ],
  pruning: [
    'A tree memorizes a branch for one unusual training row. Removing that branch may improve predictions on new rows.',
    'Try a shallow and deep tree: the deep one can fit training data better while doing worse on validation data.',
  ],
  bootstrap: [
    'From rows A, B, C, D, draw four times with replacement: A, C, A, D is a valid bootstrap sample.',
    'A tree trained on that sample sees A twice and never sees B; another tree receives a different sample.',
  ],
  bagging: [
    'Three trees trained on different bootstrap samples vote cat, cat, dog. Their bagged classification is cat.',
    'Averaging predictions from several regression trees can reduce the wobble of one tree.',
  ],
  boosting: [
    'The first small tree misses several hard examples. The next tree pays more attention to those mistakes.',
    'Many modest trees added in sequence can correct one another, but too many can overfit without a stopping rule.',
  ],
  'feature-importance': [
    'Shuffle the “study hours” column. If validation accuracy drops from 90% to 70%, that feature was useful to this model.',
    'Two strongly correlated columns can share credit, so a low importance score does not always mean a feature is irrelevant.',
  ],
  shap: [
    'On a chosen output scale, a baseline score of 0.4 plus a +0.2 age contribution and a −0.1 income contribution gives 0.5.',
    'For one prediction, a SHAP waterfall shows which features push the model output up and which push it down.',
  ],
  'label-encoding': [
    'Ordered sizes small, medium, large can be encoded 0, 1, 2 when that order is meaningful.',
    'Encoding red, blue, green as 0, 1, 2 may invent a false order; one-hot encoding is often safer for unordered colors.',
  ],
  standardization: [
    'If exam scores have mean 50 and standard deviation 10, a score of 70 becomes z = (70 − 50)/10 = 2.',
    'Fit mean and standard deviation on training rows, then use those same numbers for validation and test rows.',
  ],
  'min-max-scaling': [
    'For a training range of 10 to 30, the value 20 becomes (20 − 10)/(30 − 10) = 0.5.',
    'A later value of 40 becomes 1.5 with the same fitted scaler; min-max scaling does not guarantee future values stay below 1.',
  ],
  'euclidean-distance': [
    'From (0, 0) to (3, 4), straight-line Euclidean distance is 5.',
    'A k-NN classifier can compare that distance from a new point to every training point and use the nearest ones.',
  ],
  'manhattan-distance': [
    'From (0, 0) to (3, 4), moving three blocks east and four north gives Manhattan distance 7.',
    'On a city grid with no diagonal streets, block distance describes the route more naturally than straight-line distance.',
  ],
  convolution: [
    'Slide a small filter across an image. At each position, multiply nearby pixels by filter weights and add them to produce one output value.',
    'The same edge-detecting filter can find a vertical border near the left or right side of a photo.',
  ],
  'filter-kernel': [
    'A 3×3 blur kernel averages nearby pixels so isolated noise becomes less visible.',
    'An edge kernel gives opposite signs to pixels on either side of a border, making that border stand out.',
  ],
  stride: [
    'With stride 1, a filter moves one pixel at a time and checks many overlapping patches.',
    'With stride 2, it jumps two pixels each move, producing a smaller feature map.',
  ],
  'convolution-padding': [
    'A 3×3 filter on a 3×3 image produces one value without padding.',
    'Add a one-pixel border of zeros and the same filter can also be centered on edge pixels, producing a 3×3 output at stride 1.',
  ],
  pooling: [
    'Max pooling on values [1, 4; 2, 3] keeps 4 as the summary of that 2×2 region.',
    'Average pooling on the same region returns 2.5; it keeps overall level rather than the strongest signal.',
  ],
  'feature-map': [
    'An edge filter produces a map with bright values where the photo has a strong border.',
    'A later CNN layer can combine edge maps into a pattern that responds to a corner or eye.',
  ],
  rnn: [
    'While reading “the dog ran,” an RNN carries information from “dog” into the step for “ran.”',
    'In a long sentence, early information may fade after many recurrent steps; gated models help retain it.',
  ],
  lstm: [
    'An LSTM can keep the word “not” in memory until it reaches “good,” changing the meaning of the phrase.',
    'Its gates decide what to keep, what to forget, and what part of memory to expose at each step.',
  ],
  'self-attention': [
    'In “The dog chased the ball because it rolled,” the token “it” can attend strongly to “ball.”',
    'Each token can inspect other tokens in the same sequence rather than depending only on the immediately previous word.',
  ],
  'query-key-value': [
    'For the word “it,” the query asks what earlier word it refers to; keys from “dog” and “ball” compete for attention.',
    'If “ball” gets the stronger match, its value contributes more to the new representation of “it.”',
  ],
  'positional-encoding': [
    '“Dog bites man” and “Man bites dog” contain the same words; positions help a Transformer tell the sentences apart.',
    'Position information lets attention distinguish a word at the start of a sentence from the same word near the end.',
  ],
  'transfer-learning': [
    'Start with an image model trained on many everyday photos, then reuse its visual features for a smaller plant-leaf dataset.',
    'A pretrained language encoder can supply useful text representations before you train a task-specific classifier.',
  ],
  'fine-tuning': [
    'Load a pretrained image model, replace its last classifier, and train on your own flower labels.',
    'After the new head works, unfreeze some earlier layers with a small learning rate so the features adapt gently.',
  ],
  'weights-and-bias': [
    'For y = 2x + 1, weight 2 says each extra study hour adds two predicted points; bias 1 is the prediction at zero hours.',
    'Changing a weight alters how strongly an input matters. Changing the bias shifts every prediction up or down.',
  ],
  'batch-size': [
    'With 100 training rows and batch size 20, one epoch contains five update steps.',
    'A smaller batch gives noisier updates but needs less memory; a larger batch averages more examples per update.',
  ],
  transformer: [
    'In translation, attention can connect “bank” with nearby words about money or a river before choosing a meaning.',
    'A Transformer handles many tokens in parallel while attention mixes information across their positions.',
  ],
  underfitting: [
    'A straight line tries to model a U-shaped relationship. Both training and validation errors stay high.',
    'Adding useful features or a more flexible model may help when the model is too simple to learn the pattern.',
  ],
  'loss-function': [
    'The true value is 10 and a model predicts 8. Absolute error is 2; squared error is 4.',
    'For a yes/no label, cross-entropy penalizes a confident wrong probability more than an uncertain wrong one.',
  ],
  batch: [
    'With 100 training rows and batch size 25, the model processes four batches per epoch.',
    'One batch might contain rows 1–25; its average gradient is used for one update before the next batch arrives.',
  ],
  'validation-set': [
    'Train three tree depths on training data, compare them on validation data, then choose the depth that generalizes best.',
    'Keep a separate test set sealed until the end; repeated tuning on the test set makes it another validation set.',
  ],
};

export function getTermExamples(term: TermLesson): TermExample[] {
  const curated = concreteExamples[term.slug];
  if (curated) return curated.map((description, index) => ({ title: `Example ${index + 1}`, description }));

  const examples: TermExample[] = [{
    title: term.workedExample.title,
    description: term.workedExample.setup,
    steps: term.workedExample.steps,
    takeaway: term.workedExample.takeaway,
  }];
  const second = getTermEnhance(term).secondExample;
  if (!second.title.startsWith('Another story for') && second.setup !== term.workedExample.setup) {
    examples.push({ title: second.title, description: second.setup, steps: second.steps, takeaway: second.takeaway });
  }
  return examples.slice(0, 3);
}
