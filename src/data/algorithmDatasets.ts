import {
  allSampleDatasets,
  generateLinearData,
  generateSyntheticBlobs,
  generateSyntheticCircles,
  generateSyntheticMoons,
} from './sampleDatasets';
import type { Dataset } from './sampleDatasets';
import {
  audioToneFeaturesDataset,
  categoricalCustomersDataset,
  clusterBlobsDataset,
  clusterCirclesDataset,
  clusterMoonsDataset,
  clusterVariableDensityDataset,
  contentItemFeaturesDataset,
  fewShotCharactersDataset,
  gestureLandmarksDataset,
  hmmWeatherDataset,
  imagePatchDataset,
  linearlySeparableDataset,
  missingValuesHousingDataset,
  outlierSalaryDataset,
  polynomialCurveDataset,
  poseKeypointsDataset,
  scaleMismatchDataset,
  transferDomainDataset,
  xorClassificationDataset,
} from './algorithmSpecificDatasets';
import {
  bookRatingsDataset,
  courseRatingsDataset,
  customerChurnLargeDataset,
  ecommerceInteractionsDataset,
  energyDemandLargeDataset,
  fraudTransactionsLargeDataset,
  gruMachineLoadLargeDataset,
  housingLargeDataset,
  irisLargeDataset,
  loanLargeDataset,
  lstmRetailDemandLargeDataset,
  mallCustomersLargeDataset,
  medicalRiskLargeDataset,
  musicRatingsDataset,
  newsTopicLargeDataset,
  productReviewsLargeDataset,
  ratingsLargeDataset,
  recurrentTrafficLargeDataset,
  restaurantRatingsDataset,
  retailBasketLargeDataset,
  sensorAnomalyLargeDataset,
  sentimentLargeDataset,
  spamLargeDataset,
  studentMarksLargeDataset,
  timeSeriesSalesLargeDataset,
  videoWatchRatingsDataset,
  weatherDailyLargeDataset,
} from './expandedSampleDatasets';
import { timeSeriesCatalogTables } from '../lib/timeSeries/timeSeriesDatasets';
import { dimensionalityCatalogTables } from '../lib/dimensionality/dimensionalityDatasets';
import { audioCatalogTables, nlpCatalogTables } from '../lib/nlp/nlpDatasets';

export interface AlgorithmDatasetSuggestion {
  id: string;
  name: string;
  description: string;
  kind: 'sample' | 'synthetic' | 'upload';
  columns: string[];
  target?: string;
  why?: string;
  dataset?: Dataset;
}

export interface LoadedAlgorithmDataset {
  id: string;
  name: string;
  description: string;
  type?: Dataset['type'] | 'synthetic';
  columns: string[];
  data: Record<string, unknown>[];
  target?: string;
  why?: string;
  kind: AlgorithmDatasetSuggestion['kind'];
}

const byId = Object.fromEntries(allSampleDatasets.map(dataset => [dataset.id, dataset]));

function sample(dataset: Dataset, target?: string, why?: string): AlgorithmDatasetSuggestion {
  return {
    id: dataset.id,
    name: dataset.name,
    description: dataset.description,
    kind: 'sample',
    columns: dataset.columns,
    target,
    why,
    dataset,
  };
}

export const timeSeriesLibraryDatasets: Dataset[] = timeSeriesCatalogTables();
export const dimensionalityLibraryDatasets: Dataset[] = dimensionalityCatalogTables();
export const nlpLibraryDatasets: Dataset[] = [...nlpCatalogTables(), ...audioCatalogTables()];
const timeSeriesSuggestions = timeSeriesLibraryDatasets.map((dataset) =>
  sample(dataset, 'value', 'Catalog series with a known trend, season, or shock.'),
);
const dimensionalitySuggestions = dimensionalityLibraryDatasets.map((dataset) =>
  sample(
    dataset,
    dataset.columns.includes('species') || dataset.columns.includes('class') || dataset.columns.includes('digit') || dataset.columns.includes('cluster') || dataset.columns.includes('ring') || dataset.columns.includes('roll') ? dataset.columns.at(-1) : undefined,
    'High-dimensional catalog table built for projection and manifold views.',
  ),
);
const nlpTextSuggestions = nlpLibraryDatasets
  .filter((item) => item.columns.includes('text'))
  .map((item) => sample(item, item.columns.includes('label') ? 'label' : undefined, 'Short labeled documents for bag-of-words and TF-IDF.'));
const nlpLabeledSuggestions = nlpLibraryDatasets
  .filter((item) => item.columns.includes('label'))
  .map((item) => sample(item, 'label', 'Labeled text corpus for classification metrics.'));
const audioSuggestions = nlpLibraryDatasets
  .filter((item) => item.id === 'j-audio-tones' || item.columns.includes('class'))
  .map((item) => sample(item, item.columns.includes('class') ? 'class' : 'label', 'Tone or clip features for audio classification.'));

const synthetic = {
  linear: {
    id: 'synthetic-linear',
    name: 'Synthetic Linear Data',
    description: 'Generated x/y regression points for slope, intercept, residual, and optimizer demonstrations.',
    kind: 'synthetic' as const,
    columns: ['x', 'y'],
    target: 'y',
    why: 'A clean slope-plus-noise cloud for residual and optimizer plots.',
  },
  blobs: {
    id: 'synthetic-blobs',
    name: 'Synthetic Blobs',
    description: 'Generated 2-D class clusters for classification, clustering, and boundary visualization.',
    kind: 'synthetic' as const,
    columns: ['x', 'y', 'label'],
    target: 'label',
    why: 'Spherical class clouds for boundary and centroid demos.',
  },
  moons: {
    id: 'synthetic-moons',
    name: 'Synthetic Moons',
    description: 'Generated non-linear two-class data for SVM, KNN, neural nets, and density clustering.',
    kind: 'synthetic' as const,
    columns: ['x', 'y', 'label'],
    target: 'label',
    why: 'Crescent shapes that punish linear separators.',
  },
  circles: {
    id: 'synthetic-circles',
    name: 'Synthetic Circles',
    description: 'Generated concentric decision regions for non-linear neural-network classification.',
    kind: 'synthetic' as const,
    columns: ['x', 'y', 'label'],
    target: 'label',
    why: 'Nested rings that need a non-linear decision surface.',
  },
  imageGrid: {
    id: 'synthetic-image-grid',
    name: 'Synthetic Image Grid',
    description: 'Small pixel grids and kernels for convolution, edge detection, and segmentation lessons.',
    kind: 'synthetic' as const,
    columns: ['row', 'col', 'pixel', 'label'],
    target: 'label',
    why: 'An 8×8 pixel lattice for filters, edges, and segmentation.',
  },
  sequence: {
    id: 'synthetic-sequence',
    name: 'Synthetic Sequence Data',
    description: 'Generated sequences for RNN, LSTM, GRU, HMM, and forecasting behavior.',
    kind: 'synthetic' as const,
    columns: ['step', 'value', 'label'],
    target: 'value',
    why: 'A short rising sine wave with a forecast tail.',
  },
  bandit: {
    id: 'synthetic-bandit',
    name: 'Synthetic Bandit Rewards',
    description: 'Generated arm rewards for exploration, exploitation, and regret tracking.',
    kind: 'synthetic' as const,
    columns: ['trial', 'arm', 'reward'],
    target: 'reward',
    why: 'Four arms with different mean rewards for regret curves.',
  },
  gridWorld: {
    id: 'synthetic-grid-world',
    name: 'Synthetic Grid World',
    description: 'Generated states, actions, rewards, and terminal cells for RL policies.',
    kind: 'synthetic' as const,
    columns: ['state', 'action', 'reward', 'next_state'],
    target: 'reward',
    why: 'A 5×5 grid with a terminal reward for Q-learning and MDPs.',
  },
};

const iris = (why: string) => sample(irisLargeDataset, 'species', why);
const housing = (why: string) => sample(housingLargeDataset, 'price', why);
const marks = (why: string) => sample(studentMarksLargeDataset, 'marks', why);
const energy = (why: string) => sample(energyDemandLargeDataset, 'demand_mw', why);
const loan = (why: string) => sample(loanLargeDataset, 'approved', why);
const churn = (why: string) => sample(customerChurnLargeDataset, 'churned', why);
const medical = (why: string) => sample(medicalRiskLargeDataset, 'high_risk', why);
const fraud = (why: string) => sample(fraudTransactionsLargeDataset, 'fraud', why);
const mall = (why: string) => sample(mallCustomersLargeDataset, undefined, why);
const retail = (why: string) => sample(retailBasketLargeDataset, undefined, why);
const sensor = (why: string) => sample(sensorAnomalyLargeDataset, 'is_anomaly', why);
const weather = (why: string) => sample(weatherDailyLargeDataset, 'temperature_c', why);
const sales = (why: string) => sample(timeSeriesSalesLargeDataset, 'sales', why);
const traffic = (why: string) => sample(recurrentTrafficLargeDataset, 'visits', why);
const retailSeq = (why: string) => sample(lstmRetailDemandLargeDataset, 'orders', why);
const machineLoad = (why: string) => sample(gruMachineLoadLargeDataset, 'load_kw', why);
const news = (why: string) => sample(newsTopicLargeDataset, 'label', why);
const reviews = (why: string) => sample(productReviewsLargeDataset, 'label', why);
const sentiment = (why: string) => sample(sentimentLargeDataset, 'label', why);
const spam = (why: string) => sample(spamLargeDataset, 'label', why);
const movies = (why: string) => sample(ratingsLargeDataset, undefined, why);

const regressionCore = [
  energy('Hourly demand from weather and calendar features — a multi-feature regression table.'),
  housing('House price from area, rooms, age, and location.'),
  marks('Study hours versus marks — the two-column linear demo.'),
];
const classificationCore = [
  medical('Patient screening with a binary high-risk label.'),
  churn('Subscription tenure, fee, and tickets versus churn.'),
  loan('Credit, income, and debt versus approval.'),
];
const clusteringCore = [
  mall('Age, income, and spend score for shopper segments.'),
  retail('Basket mix counts for grocery segments.'),
  sample(clusterBlobsDataset, 'segment', 'Three spherical groups a centroid method can recover.'),
];
const nlpCore = [
  news('News sentences labeled by topic.'),
  reviews('Product reviews labeled positive, negative, or neutral.'),
  spam('Inbox messages labeled spam or ham.'),
];

const routeSpecific: Record<string, AlgorithmDatasetSuggestion[]> = {
  '/ml/supervised/simple-linear-regression': [
    marks('Two numeric columns with a visible slope — the simple linear hometown.'),
    energy('Demand versus temperature if you want a noisier real-world line.'),
    { ...synthetic.linear },
  ],
  '/ml/supervised/multiple-linear-regression': [
    housing('Several numeric features that jointly explain price.'),
    energy('Temperature, humidity, wind, weekend, and hour all push demand.'),
  ],
  '/ml/supervised/polynomial-regression': [
    sample(polynomialCurveDataset, 'temperature_c', 'A curved RPM-to-temperature map a straight line underfits.'),
    marks('Mostly linear marks — compare against the engine curve.'),
    energy('Mild curvature from hour-of-day peaks.'),
  ],
  '/ml/supervised/ridge-regression': [
    housing('Correlated rooms and area — ridge shrinks the shared coefficients.'),
    energy('Many weather features with similar scale effects.'),
    { ...synthetic.linear },
  ],
  '/ml/supervised/lasso-regression': [
    housing('Lasso can zero out the weaker of area versus rooms.'),
    energy('Feature-rich demand table for sparsity demos.'),
    { ...synthetic.linear },
  ],
  '/ml/supervised/elastic-net-regression': [
    housing('Mix of correlated and weakly useful housing features.'),
    energy('Weather plus calendar flags for mixed penalties.'),
    { ...synthetic.linear },
  ],
  '/ml/supervised/decision-tree-regression': [
    housing('Trees split on area and age without needing scaled units.'),
    energy('Hour and weekend create natural leaf rules.'),
  ],
  '/ml/supervised/random-forest-regression': [
    energy('Bagged trees smooth noisy hourly demand.'),
    housing('Forest average vs one jumpy housing tree.'),
  ],
  '/ml/supervised/gradient-boosting-regression': [
    energy('Residuals from temperature and peak hours stack well.'),
    housing('Boosted trees on a priced listing table.'),
  ],
  '/ml/supervised/support-vector-regression': [
    energy('A tube around hourly demand shows ε-insensitive loss.'),
    marks('Simple 2-D support-vector tube.'),
    { ...synthetic.linear },
  ],

  '/ml/supervised/logistic-regression': [
    loan('Linear-ish approval odds from credit and debt.'),
    churn('Churn probability from tenure and tickets.'),
    medical('Risk screening with a binary label.'),
  ],
  '/ml/supervised/multinomial-logistic-regression': [
    iris('Three flower species — the multinomial softmax exam.'),
    news('More than two text topics if you encode the labels.'),
    sample(poseKeypointsDataset, 'pose', 'Four pose classes from joint angles.'),
  ],
  '/ml/supervised/knn-classification': [
    iris('Four measurements, three species — neighbors vote cleanly.'),
    medical('Nearest patients by BMI, BP, and glucose.'),
    sample(linearlySeparableDataset, 'label', 'Two compact clouds for a 2-D KNN map.'),
  ],
  '/ml/supervised/naive-bayes': [
    spam('Wordy inbox labels — Naive Bayes hometown.'),
    news('Topic words that are almost independent given the class.'),
    reviews('Review vocabulary versus sentiment.'),
  ],
  '/ml/supervised/decision-tree-classification': [
    medical('Readable splits on age, BMI, and blood pressure.'),
    churn('Tenure and tickets become leaf rules.'),
    iris('Classic three-class tree.'),
  ],
  '/ml/supervised/random-forest-classification': [
    churn('Bagged trees on a messy subscription table.'),
    fraud('Rare fraud votes need a crowd of trees.'),
    loan('Approval votes from correlated credit features.'),
  ],
  '/ml/supervised/svm-classification': [
    medical('Margin between high-risk and low-risk patients.'),
    sample(clusterMoonsDataset, 'shape', 'Crescents that need a kernel, not a hard line.'),
    sample(linearlySeparableDataset, 'label', 'A wide-margin linear SVM succeeds here.'),
  ],
  '/ml/supervised/gradient-boosting-classification': [
    fraud('Hard fraud leftovers are what boosting hunts.'),
    churn('Sequential trees on churn residuals.'),
    loan('Approval odds that are not quite linear.'),
  ],
  '/ml/supervised/adaboost-classification': [
    fraud('Misclassified fraud rows get heavier each round.'),
    medical('Borderline patients become the next stump’s homework.'),
    loan('Reweighted approvals after each weak learner.'),
  ],
  '/ml/supervised/xgboost-concept': [
    fraud('Regularized boosting on an imbalanced payment table.'),
    churn('Tree boosting with a numeric churn label.'),
    energy('Same booster family on a regression target.'),
  ],

  '/ml/clustering/k-means': [
    mall('Spherical shopper groups — K-Means hometown.'),
    retail('Basket mix centroids.'),
    sample(clusterBlobsDataset, 'segment', 'Three round clouds K-Means recovers cleanly.'),
  ],
  '/ml/clustering/k-medoids': [
    mall('Medoids are actual shoppers, not mean points.'),
    retail('Basket representatives survive outliers better than means.'),
    sample(clusterBlobsDataset, 'segment', 'Round groups with a real exemplar in each.'),
  ],
  '/ml/clustering/hierarchical-clustering': [
    retail('Nested grocery baskets for a dendrogram.'),
    mall('Shopper hierarchy from spend and income.'),
    sample(clusterBlobsDataset, 'segment', 'Clean blobs that merge bottom-up.'),
  ],
  '/ml/clustering/dbscan': [
    sample(clusterVariableDensityDataset, 'neighborhood', 'Dense cores, sparse cloud, and labeled outliers.'),
    sensor('Factory readings with anomaly flags as noise.'),
    sample(clusterMoonsDataset, 'shape', 'Crescents density methods can walk along.'),
  ],
  '/ml/clustering/mean-shift': [
    mall('Modes in spend/income without picking K first.'),
    sample(clusterBlobsDataset, 'segment', 'Three density peaks Mean Shift should find.'),
    retail('Basket modes instead of a forced cluster count.'),
  ],
  '/ml/clustering/gaussian-mixture-model': [
    sample(clusterBlobsDataset, 'segment', 'Soft spherical Gaussians — GMM hometown.'),
    mall('Overlapping shopper groups with membership probabilities.'),
    retail('Basket components that are allowed to overlap.'),
  ],
  '/ml/clustering/spectral-clustering': [
    sample(clusterMoonsDataset, 'shape', 'Graph cuts follow crescents that K-Means slices.'),
    sample(clusterCirclesDataset, 'ring', 'A ring around a disk — the spectral exam.'),
    { ...synthetic.moons },
  ],
  '/ml/clustering/optics': [
    sample(clusterVariableDensityDataset, 'neighborhood', 'Reachability order for dense, medium, and sparse groups.'),
    sample(clusterMoonsDataset, 'shape', 'Crescents OPTICS can extract without one global ε.'),
    mall('Shopper density that is not the same in every neighborhood.'),
  ],

  '/ml/dimensionality-reduction/pca': [
    iris('Four flower measurements collapse onto two clear axes.'),
    ...dimensionalitySuggestions,
  ],
  '/ml/dimensionality-reduction/kernel-pca': [
    sample(clusterCirclesDataset, 'ring', 'Concentric rings that linear PCA cannot unroll.'),
    iris('Compare a linear PCA plane with a kernel lift.'),
    ...dimensionalitySuggestions.filter((item) => item.id.includes('concentric') || item.id.includes('swiss') || item.id.includes('iris')),
  ],
  '/ml/dimensionality-reduction/tsne': [
    iris('Three species that t-SNE should keep as islands.'),
    ...dimensionalitySuggestions.filter((item) => item.id.includes('digit') || item.id.includes('blobs') || item.id.includes('swiss') || item.id.includes('iris')),
  ],
  '/ml/dimensionality-reduction/umap-concept': [
    iris('Local flower neighborhoods for a UMAP-style embedding.'),
    ...dimensionalitySuggestions.filter((item) => item.id.includes('digit') || item.id.includes('blobs') || item.id.includes('swiss') || item.id.includes('iris')),
  ],
  '/ml/dimensionality-reduction/lda': [
    iris('Labeled species — LDA’s supervised projection exam.'),
    medical('Binary risk labels to find a separating axis.'),
    ...dimensionalitySuggestions.filter((item) => item.id.includes('iris') || item.id.includes('class') || item.id.includes('informative')),
  ],
  '/ml/dimensionality-reduction/autoencoder': [
    iris('Tiny reconstruction task with four inputs.'),
    sample(imagePatchDataset, 'label', 'Pixel patches a small autoencoder can compress.'),
    ...dimensionalitySuggestions.filter((item) => item.id.includes('digit') || item.id.includes('noisy') || item.id.includes('informative')),
  ],

  '/ml/deep-learning/perceptron': [
    sample(linearlySeparableDataset, 'label', 'Two clouds a single neuron can split.'),
    sample(xorClassificationDataset, 'label', 'XOR — the table that proves one neuron is not enough.'),
    loan('Mostly linear approvals for a real-world perceptron try.'),
  ],
  '/ml/deep-learning/mlp': [
    sample(xorClassificationDataset, 'label', 'Hidden units exist so XOR becomes easy.'),
    sample(clusterMoonsDataset, 'shape', 'Crescents that need a non-linear net.'),
    sample(clusterCirclesDataset, 'ring', 'Nested rings for deeper layers.'),
  ],
  '/ml/deep-learning/nn-playground': [
    sample(clusterMoonsDataset, 'shape', 'Playground default: two moons.'),
    sample(xorClassificationDataset, 'label', 'Switch to XOR and add a hidden layer.'),
    sample(clusterCirclesDataset, 'ring', 'Concentric rings for deeper topologies.'),
  ],
  '/ml/deep-learning/cnn': [
    sample(imagePatchDataset, 'label', 'Tiny patches with edge, blob, stripe, and noise labels.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/deep-learning/convolution-visualizer': [
    sample(imagePatchDataset, 'label', 'Pixel rows a kernel can slide across.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/deep-learning/rnn': [
    weather('Daily temperature is a sequence, not a bag of rows.'),
    traffic('Hourly visits with recurrence.'),
    { ...synthetic.sequence },
  ],
  '/ml/deep-learning/lstm': [
    weather('Long daily weather memory for gates to keep.'),
    sales('Seasonal sales that need a longer memory than a vanilla RNN.'),
    retailSeq('Weekly orders built for LSTM forecasting.'),
  ],
  '/ml/deep-learning/gru': [
    machineLoad('Machine load sequence sized for a GRU.'),
    sales('Seasonal sales with a lighter recurrent cell.'),
    { ...synthetic.sequence },
  ],
  '/ml/deep-learning/transformer-attention': [
    news('Sentences where later words should attend to earlier topic cues.'),
    reviews('Review tokens that attend to sentiment words.'),
    sentiment('Short labeled comments for attention heatmaps.'),
  ],
  '/ml/deep-learning/multi-head-attention': [
    news('Multiple topics so heads can specialize.'),
    reviews('One head on adjectives, another on product nouns.'),
    spam('Spam cues versus ordinary meeting language.'),
  ],
  '/ml/deep-learning/backpropagation-visualizer': [
    sample(linearlySeparableDataset, 'label', 'A tiny labeled cloud for watching gradients move.'),
    sample(xorClassificationDataset, 'label', 'XOR loss that only drops after a hidden layer.'),
    marks('Simple numeric targets for a regression backprop walk.'),
  ],
  '/ml/deep-learning/few-shot-learning': [
    sample(fewShotCharactersDataset, 'class', 'Six support strokes per character class.'),
    sample(imagePatchDataset, 'label', 'Tiny labeled patches if you treat each class as a support set.'),
    iris('Hold out most flowers and match the rest by distance.'),
  ],
  '/ml/deep-learning/network-builder': [
    sample(clusterMoonsDataset, 'shape', 'Default playground data for a custom net.'),
    sample(xorClassificationDataset, 'label', 'Add layers until XOR trains.'),
    iris('A small real table for a custom architecture.'),
  ],
  '/ml/deep-learning/transfer-learning': [
    sample(transferDomainDataset, 'class', 'Clean source examples and noisier target-domain copies.'),
    sample(imagePatchDataset, 'label', 'Reuse a patch encoder on a new label set.'),
    iris('Pretend two species are the source domain and the third is the target.'),
  ],

  '/ml/evaluation/train-test-split': [
    churn('Hide later customers and grade only the hidden ones.'),
    iris('A small labeled table where a bad split is obvious.'),
    loan('Approvals that must not leak from train into test.'),
  ],
  '/ml/evaluation/cross-validation': [
    energy('Folds over hourly demand to see score variance.'),
    fraud('Folds that must keep fraud rare in every holdout.'),
    loan('Credit folds for a stable approval score.'),
  ],
  '/ml/evaluation/confusion-matrix': [
    fraud('False alarms versus missed fraud — the matrix’s reason to exist.'),
    churn('Who we called a churner and who actually left.'),
    loan('Approved vs rejected, predicted vs true.'),
  ],
  '/ml/evaluation/roc-auc': [
    fraud('A ranking problem: push fraud to the top of the score list.'),
    medical('Risk scores and a threshold-free curve.'),
    loan('Approval scores from low to high.'),
  ],
  '/ml/evaluation/precision-recall-curve': [
    fraud('Rare positives — precision-recall is more honest than ROC here.'),
    churn('Churn is common enough to compare both curves.'),
    loan('Approval precision as the threshold moves.'),
  ],
  '/ml/evaluation/regression-metrics': [
    energy('MAE, RMSE, and R² on hourly demand.'),
    housing('Price residuals in rupees, not abstract units.'),
    marks('A simple line so metric formulas stay readable.'),
  ],
  '/ml/evaluation/bias-variance-tradeoff': [
    sample(polynomialCurveDataset, 'temperature_c', 'Underfit with a line, overfit with a high-degree curve.'),
    energy('Capacity versus hourly noise.'),
    marks('Low-variance line versus a wiggly alternative.'),
  ],

  '/ml/preprocessing/missing-values': [
    sample(missingValuesHousingDataset, 'price', 'Blank area, age, and distance cells to impute.'),
    housing('Complete listings to compare against the incomplete table.'),
    loan('A clean approval table if you want to punch holes yourself.'),
  ],
  '/ml/preprocessing/scaling-normalization': [
    sample(scaleMismatchDataset, 'approved', 'Income in rupees next to a 0–1 utilization ratio.'),
    energy('Temperature, humidity, and megawatts on different scales.'),
    housing('Square feet versus bedroom counts.'),
  ],
  '/ml/preprocessing/categorical-encoding': [
    sample(categoricalCustomersDataset, 'churned', 'City, plan, channel, and device need encoding before a model.'),
    churn('Mostly numeric — compare with the categorical plan table.'),
    loan('Numeric-only approvals after you encode nothing.'),
  ],
  '/ml/preprocessing/outlier-detection': [
    sample(outlierSalaryDataset, 'salary', 'A few extreme bonuses sit far from the IQR fence.'),
    sensor('Factory spikes already labeled as anomalies.'),
    housing('A pricey listing that can own a leaf or a z-score.'),
  ],
  '/ml/preprocessing/feature-selection': [
    medical('Several vitals — some predict risk, some are weaker.'),
    energy('Weather and calendar flags to keep or drop.'),
    loan('Credit features that are not equally useful.'),
  ],
  '/ml/preprocessing/polynomial-features': [
    sample(polynomialCurveDataset, 'temperature_c', 'Expand RPM into RPM² and RPM³ and watch the fit.'),
    marks('A mostly linear table so extra powers look unnecessary.'),
    { ...synthetic.linear },
  ],

  '/ml/time-series/moving-average': [
    weather('Daily temperature a moving window can smooth.'),
    sales('Seasonal sales with a slow trend.'),
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/exponential-smoothing': [
    weather('Recent days should weigh more than last season.'),
    sales('Holiday peaks for a smoothing demo.'),
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/holt-winters': [
    sales('Trend plus yearly season — Holt-Winters hometown.'),
    weather('A milder seasonal temperature cycle.'),
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/arima-concept': [
    weather('Daily series with autocorrelation a student can plot.'),
    sales('Monthly-style season in a long table.'),
    { ...synthetic.sequence },
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/anomaly-detection': [
    sensor('Temperature and vibration with an anomaly flag.'),
    sample(outlierSalaryDataset, 'salary', 'Point anomalies in a salary stream.'),
    ...timeSeriesSuggestions.filter((item) => item.id.includes('anomal') || item.id.includes('spike') || item.id.includes('shift')),
  ],
  '/ml/time-series/rnn-forecasting': [
    traffic('Hourly visits built for a recurrent forecast.'),
    weather('Daily weather as the next-step target.'),
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/lstm-forecasting': [
    retailSeq('Weekly orders sized for an LSTM horizon.'),
    sales('Long seasonal memory.'),
    ...timeSeriesSuggestions,
  ],
  '/ml/time-series/gru-forecasting': [
    machineLoad('Machine load for a lighter recurrent cell.'),
    sensor('Sensor temperature as a forecast target.'),
    ...timeSeriesSuggestions,
  ],

  '/ml/nlp/bag-of-words': [
    news('Count topic words across short documents.'),
    reviews('Review vocabulary as a bag.'),
    spam('Prize words versus meeting words.'),
    ...nlpTextSuggestions,
  ],
  '/ml/nlp/tf-idf': [
    news('Down-weight words that appear in every topic.'),
    reviews('TF-IDF on sentiment vocabulary.'),
    spam('Rare prize phrases get a higher weight.'),
    ...nlpTextSuggestions,
  ],
  '/ml/nlp/text-classification': [
    news('Multiclass topic labels.'),
    reviews('Three-way review sentiment.'),
    sentiment('Short comments with clean labels.'),
    ...nlpLabeledSuggestions,
  ],
  '/ml/nlp/word-embedding-concept': [
    news('Topic words that should sit near each other.'),
    reviews('Sentiment neighbors like great and excellent.'),
    sentiment('Tiny labeled comments for embedding sketches.'),
  ],
  '/ml/nlp/sentiment-analysis': [
    reviews('Product reviews labeled positive, negative, or neutral.'),
    sentiment('Shorter comments with the same three labels.'),
  ],
  '/ml/nlp/naive-bayes-spam': [
    spam('The spam/ham inbox table.'),
    news('A harder topic task if spam looks too easy.'),
  ],
  '/ml/nlp/audio-classification': [
    sample(audioToneFeaturesDataset, 'class', 'Frequency and harmonic features for sine, square, noise, and chord.'),
    ...audioSuggestions,
  ],

  '/ml/computer-vision/image-classification': [
    sample(imagePatchDataset, 'label', 'Eight-pixel patches labeled edge, blob, stripe, or noise.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/computer-vision/audio-classification': [
    sample(audioToneFeaturesDataset, 'class', 'The same tone table used on the NLP audio page.'),
    ...audioSuggestions,
  ],
  '/ml/computer-vision/hand-gesture-recognition': [
    sample(gestureLandmarksDataset, 'gesture', 'Fingertip spans labeled open, fist, pinch, and point.'),
    sample(imagePatchDataset, 'label', 'Fallback pixel patches if you treat a hand crop as pixels.'),
  ],
  '/ml/computer-vision/pose-detection': [
    sample(poseKeypointsDataset, 'pose', 'Joint angles labeled stand, sit, squat, and wave.'),
    sample(gestureLandmarksDataset, 'gesture', 'Related landmark features if you compare hand vs body.'),
  ],
  '/ml/computer-vision/person-segmentation': [
    sample(imagePatchDataset, 'label', 'Patches that stand in for foreground versus background.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/computer-vision/cnn-filter-explorer': [
    sample(imagePatchDataset, 'label', 'Slide a kernel across labeled patches.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/computer-vision/kmeans-image-segmentation': [
    sample(imagePatchDataset, 'label', 'Pixel intensities to cluster into regions.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/computer-vision/edge-detection': [
    { ...synthetic.imageGrid, why: 'A diagonal edge already painted into the grid.' },
    sample(imagePatchDataset, 'label', 'Patches that include an edge class.'),
  ],
  '/ml/computer-vision/object-detection-demo': [
    sample(imagePatchDataset, 'label', 'Tiny objects as labeled patches.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/computer-vision/grad-cam': [
    sample(imagePatchDataset, 'label', 'Small patches so a class activation map stays readable.'),
    sample(transferDomainDataset, 'class', 'Object classes with brightness and edge energy.'),
  ],

  '/ml/recommendation/user-based-cf': [
    movies('User-by-movie ratings with missing cells to fill from similar users.'),
    sample(bookRatingsDataset, undefined, 'Genre scores for readers who overlap.'),
    sample(musicRatingsDataset, undefined, 'Track-taste neighbors.'),
    sample(restaurantRatingsDataset, undefined, 'Cuisine scores across diners.'),
  ],
  '/ml/recommendation/item-based-cf': [
    movies('Movies that are rated alike should recommend each other.'),
    sample(musicRatingsDataset, undefined, 'Tracks that share listeners.'),
    sample(bookRatingsDataset, undefined, 'Genres that travel together.'),
    sample(restaurantRatingsDataset, undefined, 'Cuisines that co-occur.'),
  ],
  '/ml/recommendation/matrix-factorization': [
    movies('A sparse ratings matrix to factor.'),
    sample(ecommerceInteractionsDataset, 'rating', 'Product interactions with a rating column.'),
    sample(videoWatchRatingsDataset, 'rating', 'Watch ratings for latent factors.'),
  ],
  '/ml/recommendation/content-based': [
    sample(contentItemFeaturesDataset, 'rating', 'Course topic, level, and tags — recommend by content, not neighbors.'),
    sample(courseRatingsDataset, 'rating', 'Course ratings if you mix content with scores.'),
    sample(ecommerceInteractionsDataset, 'rating', 'Product interactions plus item traits.'),
    reviews('Review text as a content signal.'),
  ],

  '/ml/reinforcement-learning/multi-armed-bandit': [
    { ...synthetic.bandit },
  ],
  '/ml/reinforcement-learning/q-learning-grid-world': [
    { ...synthetic.gridWorld },
  ],
  '/ml/reinforcement-learning/markov-decision-process': [
    { ...synthetic.gridWorld },
    sample(hmmWeatherDataset, 'hidden_state', 'A related state-sequence table if you compare MDPs with HMMs.'),
  ],

  '/ml/explainability/feature-importance': [
    medical('Which vital moves risk the most.'),
    energy('Temperature versus weekend for demand.'),
    churn('Tickets and tenure as competing importances.'),
  ],
  '/ml/explainability/partial-dependence-plot': [
    energy('Hold other weather fixed and sweep temperature.'),
    medical('BMI versus risk with other vitals locked.'),
    loan('Credit score PDP for approval.'),
  ],
  '/ml/explainability/shap-concept': [
    fraud('Per-transaction credit and blame.'),
    churn('Who left, and which feature paid for that call.'),
    energy('Demand attributions by hour and weather.'),
  ],
  '/ml/explainability/lime-concept': [
    churn('A local explanation around one customer.'),
    reviews('A local text explanation around one review.'),
    loan('A local approval story around one applicant.'),
  ],

  '/ml/optimization/gradient-descent': [
    { ...synthetic.linear },
    marks('A 2-D bowl you can walk downhill.'),
  ],
  '/ml/optimization/sgd': [
    marks('Mini-batches of students instead of the full table.'),
    { ...synthetic.linear },
  ],
  '/ml/optimization/momentum': [
    { ...synthetic.linear },
    sample(polynomialCurveDataset, 'temperature_c', 'A curved loss that momentum can overshoot.'),
  ],
  '/ml/optimization/adam': [
    { ...synthetic.linear },
    energy('A noisier bowl for adaptive step sizes.'),
  ],

  '/ml/ensemble/bagging': [
    churn('Bootstrap customers and average the votes.'),
    fraud('Bagged trees on rare fraud.'),
    energy('Bagged regressors on hourly demand.'),
  ],
  '/ml/ensemble/boosting': [
    fraud('Later rounds hunt the leftover fraud.'),
    churn('Sequential churn residuals.'),
    energy('Boosted demand residuals.'),
  ],
  '/ml/ensemble/stacking': [
    medical('Blend a linear risk model with a tree.'),
    churn('Stack tenure rules with a probability model.'),
    iris('Small labeled table for a stacked trio.'),
  ],

  '/ml/probabilistic/bayesian-linear-regression': [
    energy('A posterior over demand coefficients, not one line.'),
    housing('Price uncertainty bands.'),
    { ...synthetic.linear },
  ],
  '/ml/probabilistic/gaussian-process-regression': [
    weather('A smooth temperature function with uncertainty.'),
    marks('A 2-D GP you can plot.'),
    { ...synthetic.linear },
  ],
  '/ml/probabilistic/hidden-markov-model': [
    sample(hmmWeatherDataset, 'hidden_state', 'Rain readings generated from hidden sunny/cloudy/storm states.'),
    sensor('Observed vibration with a hidden anomaly regime.'),
    { ...synthetic.sequence },
  ],

  '/ml/deployment/browser-model-loader': [
    medical('A compact screening table to score in the browser.'),
    iris('Tiny labeled rows for a loaded classifier.'),
    sample(imagePatchDataset, 'label', 'Patches for a loaded vision model.'),
  ],
  '/ml/deployment/onnx-runtime-demo': [
    iris('A portable three-class table.'),
    sample(imagePatchDataset, 'label', 'Patch rows an ONNX vision demo can score.'),
  ],
  '/ml/deployment/tensorflowjs-training': [
    churn('A real table TensorFlow.js can train on in the browser.'),
    sample(clusterMoonsDataset, 'shape', '2-D moons for a fast TF.js net.'),
    iris('A small labeled trainer.'),
  ],
  '/ml/deployment/model-export': [
    fraud('Export a fraud scorer and keep the same columns.'),
    energy('Export a demand regressor.'),
    loan('Export an approval model.'),
  ],
  '/ml/deployment/export-hub': [
    iris('A small schema for export checklists.'),
    medical('A screening schema to pin on a model card.'),
    energy('A regression schema for bundled artifacts.'),
  ],
  '/ml/deployment/model-card': [
    medical('Risk screening facts a model card should disclose.'),
    fraud('Imbalance and false-alarm notes for a card.'),
    iris('A tiny, well-known table for a sample card.'),
  ],

  '/ml/lab/experiment-workspace': [
    churn('A default classification experiment.'),
    energy('A default regression experiment.'),
    iris('A tiny labeled control table.'),
  ],
  '/ml/lab/model-zoo': [
    iris('A classic table for pretrained demos.'),
    medical('A screening table for zoo classifiers.'),
    sample(imagePatchDataset, 'label', 'Patches for zoo vision models.'),
  ],
  '/ml/lab/automl-assistant': [
    churn('Let the assistant pick a churn model.'),
    energy('Let it pick a demand regressor.'),
    iris('A small labeled sanity check.'),
  ],
  '/ml/lab/training-visualizations': [
    sample(clusterMoonsDataset, 'shape', 'Loss and boundary curves on two moons.'),
    marks('A simple regression training walk.'),
    iris('A small classification run.'),
  ],
  '/ml/lab/inference-playground': [
    medical('Score new patients after a model is loaded.'),
    iris('Score a flower measurement.'),
    loan('Score an applicant row.'),
  ],
  '/ml/lab/model-comparison-dashboard': [
    churn('Compare classifiers on the same customers.'),
    energy('Compare regressors on the same hours.'),
    iris('A tiny three-class bake-off.'),
  ],
  '/ml/lab/explainability-center': [
    medical('Vitals to explain.'),
    churn('Subscription facts to explain.'),
    fraud('Payment facts to explain.'),
  ],
  '/ml/lab/dataset-intelligence': [
    sample(missingValuesHousingDataset, 'price', 'Gaps, types, and distributions to profile.'),
    sample(scaleMismatchDataset, 'approved', 'Scale problems the profiler should flag.'),
    sample(categoricalCustomersDataset, 'churned', 'Category cardinality to report.'),
  ],
  '/ml/lab/tuning-engine': [
    fraud('Tune a fraud model without leaking the test fold.'),
    energy('Tune a demand model.'),
    loan('Tune an approval threshold.'),
  ],
  '/ml/lab/train-your-model': [
    iris('A small table you can train immediately.'),
    churn('A larger classification trainer.'),
    energy('A regression trainer.'),
  ],
  '/ml/lab/image-annotation': [
    sample(imagePatchDataset, 'label', 'Patches that already have labels you can edit.'),
    { ...synthetic.imageGrid },
  ],
  '/ml/lab/data-augmentation': [
    sample(imagePatchDataset, 'label', 'Duplicate patches with brightness jitter.'),
    sample(transferDomainDataset, 'class', 'Source/target shift as a stand-in for augmentation.'),
  ],
  '/ml/lab/model-comparison': [
    churn('Same customers, different models.'),
    energy('Same hours, different regressors.'),
    iris('A tiny bake-off.'),
  ],
  '/ml/lab/batch-inference': [
    medical('Score a file of patients.'),
    loan('Score a file of applicants.'),
    iris('Score a file of flowers.'),
  ],
  '/ml/lab/active-learning': [
    iris('Start with a few labeled flowers and ask for the uncertain ones.'),
    medical('Uncertain patients are the next labels to request.'),
    sample(fewShotCharactersDataset, 'class', 'A tiny labeled pool to grow.'),
  ],
  '/ml/lab/performance-dashboard': [
    medical('Latency-friendly screening rows.'),
    iris('Tiny rows for a throughput demo.'),
    fraud('A larger batch for a stress score.'),
  ],
  '/ml/lab/architecture-flow': [
    sample(clusterMoonsDataset, 'shape', 'A 2-D net diagram with real points.'),
    sample(xorClassificationDataset, 'label', 'XOR as the architecture exam.'),
    iris('A small real schema for the flow.'),
  ],
  '/ml/lab/algorithm-comparison': [
    churn('Classification bake-off.'),
    energy('Regression bake-off.'),
    iris('Tiny labeled control.'),
    sample(clusterBlobsDataset, 'segment', 'Clustering bake-off.'),
  ],
  '/ml/lab/hyperparameter-tuning': [
    fraud('Sweep depth or learning rate on fraud.'),
    energy('Sweep tree count on demand.'),
    loan('Sweep regularization on approvals.'),
  ],
  '/ml/lab/automl-concept': [
    churn('An AutoML walk on subscriptions.'),
    energy('An AutoML walk on demand.'),
    iris('A tiny labeled walk.'),
  ],
  '/ml/lab/saved-experiments': [
    churn('Reload a churn experiment.'),
    energy('Reload a demand experiment.'),
    housing('Reload a pricing experiment.'),
  ],
  '/ml/lab/dataset-manager': allSampleDatasets.map((dataset) => sample(dataset, dataset.columns.at(-1), dataset.description)),
  '/ml/lab/report-builder': [
    fraud('A fraud story with counts and a matrix.'),
    energy('A demand story with residuals.'),
    iris('A short labeled report.'),
  ],
};

function categoryFallback(category: string): AlgorithmDatasetSuggestion[] {
  const normalized = category.toLowerCase();
  if (normalized.includes('regression')) return regressionCore;
  if (normalized.includes('classification')) return classificationCore;
  if (normalized.includes('clustering')) return clusteringCore;
  if (normalized.includes('dimensionality')) return dimensionalitySuggestions;
  if (normalized.includes('deep')) {
    return [
      sample(clusterMoonsDataset, 'shape', 'Non-linear 2-D clouds for a first net.'),
      weather('A sequence if the lab is recurrent.'),
      sample(imagePatchDataset, 'label', 'Patches if the lab is convolutional.'),
    ];
  }
  if (normalized.includes('evaluation')) return [fraud('Rare positives for honest metrics.'), medical('A clean binary table.'), energy('A regression metric table.')];
  if (normalized.includes('preprocessing')) {
    return [
      sample(missingValuesHousingDataset, 'price', 'Blank cells to repair.'),
      sample(scaleMismatchDataset, 'approved', 'Mismatched units to scale.'),
      sample(categoricalCustomersDataset, 'churned', 'Categories to encode.'),
    ];
  }
  if (normalized.includes('time')) return [weather('Daily series.'), sensor('Anomaly series.'), sales('Seasonal series.')];
  if (normalized.includes('nlp')) return nlpCore;
  if (normalized.includes('vision')) {
    return [sample(imagePatchDataset, 'label', 'Labeled patches.'), sample(gestureLandmarksDataset, 'gesture', 'Landmark features.')];
  }
  if (normalized.includes('recommendation')) {
    return [movies('User-item ratings.'), sample(bookRatingsDataset, undefined, 'Genre ratings.'), sample(contentItemFeaturesDataset, 'rating', 'Item content.')];
  }
  if (normalized.includes('reinforcement')) return [{ ...synthetic.gridWorld }, { ...synthetic.bandit }];
  if (normalized.includes('optimization')) return [{ ...synthetic.linear }, marks('A 2-D bowl.')];
  return regressionCore;
}

function uniqueSuggestions(items: AlgorithmDatasetSuggestion[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getAlgorithmDatasetSuggestions(route: string, category: string): AlgorithmDatasetSuggestion[] {
  return uniqueSuggestions(routeSpecific[route] ?? categoryFallback(category));
}

export function suggestionRowCount(suggestion: AlgorithmDatasetSuggestion) {
  return suggestion.dataset?.data.length ?? loadAlgorithmDataset(suggestion).data.length;
}

export function getAlgorithmSampleDatasets(route: string, category: string): Dataset[] {
  const samples = getAlgorithmDatasetSuggestions(route, category)
    .map((item) => item.dataset ?? byId[item.id] ?? toDataset(item))
    .filter((dataset): dataset is Dataset => Boolean(dataset));
  return samples.length > 0 ? samples : allSampleDatasets;
}

function toDataset(suggestion: AlgorithmDatasetSuggestion): Dataset | undefined {
  const loaded = loadAlgorithmDataset(suggestion);
  if (loaded.data.length === 0) return undefined;
  const type = loaded.type === 'synthetic' ? 'classification' : loaded.type ?? 'classification';
  return {
    id: loaded.id,
    name: loaded.name,
    description: loaded.description,
    type,
    columns: loaded.columns,
    data: loaded.data,
  };
}

function sequenceRows() {
  return Array.from({ length: 36 }, (_, step) => ({
    step,
    value: Number((60 + Math.sin(step / 3) * 12 + step * 0.7).toFixed(2)),
    label: step > 24 ? 'forecast' : 'history',
  }));
}

function imageGridRows() {
  return Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const edge = row === col || row + col === 7;
    return { row, col, pixel: edge ? 255 : (row + col) % 3 === 0 ? 120 : 20, label: edge ? 'edge' : 'background' };
  });
}

function banditRows() {
  return Array.from({ length: 60 }, (_, trial) => {
    const arm = trial % 4;
    const baseReward = [0.25, 0.45, 0.6, 0.35][arm];
    return { trial: trial + 1, arm, reward: Number((baseReward + ((trial * (arm + 3)) % 11) / 100).toFixed(2)) };
  });
}

function gridWorldRows() {
  const actions = ['up', 'right', 'down', 'left'];
  return Array.from({ length: 25 }, (_, state) => {
    const action = actions[state % actions.length];
    const terminal = state === 24;
    return { state, action, reward: terminal ? 1 : state % 7 === 0 ? -0.2 : -0.04, next_state: terminal ? state : Math.min(24, state + 1) };
  });
}

function syntheticRows(suggestion: AlgorithmDatasetSuggestion): Record<string, unknown>[] {
  if (suggestion.id === 'synthetic-linear') return generateLinearData(40, 2.8, 8, 2);
  if (suggestion.id === 'synthetic-blobs') return generateSyntheticBlobs(90, 3);
  if (suggestion.id === 'synthetic-moons') return generateSyntheticMoons(90);
  if (suggestion.id === 'synthetic-circles') return generateSyntheticCircles(90);
  if (suggestion.id === 'synthetic-image-grid') return imageGridRows();
  if (suggestion.id === 'synthetic-sequence') return sequenceRows();
  if (suggestion.id === 'synthetic-bandit') return banditRows();
  if (suggestion.id === 'synthetic-grid-world') return gridWorldRows();
  return [];
}

function syntheticDatasetType(id: string): LoadedAlgorithmDataset['type'] {
  if (id === 'synthetic-linear') return 'regression';
  if (id === 'synthetic-blobs' || id === 'synthetic-moons' || id === 'synthetic-circles' || id === 'synthetic-image-grid') return 'classification';
  if (id === 'synthetic-sequence') return 'timeSeries';
  if (id === 'synthetic-bandit' || id === 'synthetic-grid-world') return 'synthetic';
  return 'synthetic';
}

export function loadAlgorithmDataset(suggestion: AlgorithmDatasetSuggestion): LoadedAlgorithmDataset {
  const data = suggestion.dataset?.data ?? syntheticRows(suggestion);
  return {
    id: suggestion.id,
    name: suggestion.name,
    description: suggestion.description,
    type: suggestion.dataset?.type ?? syntheticDatasetType(suggestion.id),
    columns: suggestion.columns,
    data,
    target: suggestion.target,
    why: suggestion.why,
    kind: suggestion.kind,
  };
}
