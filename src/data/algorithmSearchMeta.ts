// Hand-authored search metadata for the algorithm catalogue. Keyed by the same
// route slugs used in `navigation.ts` so the two files stay in lock step; every
// other searchable field (label, category, difficulty badge) is derived from
// `navigationData` rather than duplicated here.

export interface AlgorithmSearchMeta {
  /** One-line blurb shown in search results and matched at low weight. */
  description: string;
  /** Aliases, abbreviations and expansions people actually type. */
  synonyms?: string[];
  /** Topical keywords: data modality, task family, technique. */
  tags?: string[];
}

export interface CategorySearchMeta {
  /** Human-readable "Supervised · Classification" style label. */
  section: string;
  /** Tags applied to every algorithm in the category. */
  tags: string[];
}

export const categorySearchMeta: Record<string, CategorySearchMeta> = {
  'Supervised - Regression': {
    section: 'Supervised Learning · Regression',
    tags: ['supervised', 'regression', 'continuous', 'prediction', 'tabular'],
  },
  'Supervised - Classification': {
    section: 'Supervised Learning · Classification',
    tags: ['supervised', 'classification', 'classifier', 'labels', 'tabular'],
  },
  Clustering: {
    section: 'Unsupervised Learning · Clustering',
    tags: ['unsupervised', 'clustering', 'segmentation', 'groups'],
  },
  'Dimensionality Reduction': {
    section: 'Unsupervised Learning · Dimensionality Reduction',
    tags: ['unsupervised', 'dimensionality reduction', 'embedding', 'projection', 'visualization'],
  },
  'Deep Learning': {
    section: 'Deep Learning',
    tags: ['deep learning', 'neural network', 'tensorflow', 'gradient'],
  },
  Evaluation: {
    section: 'Model Evaluation',
    tags: ['evaluation', 'metrics', 'validation', 'scoring'],
  },
  Preprocessing: {
    section: 'Data Preprocessing',
    tags: ['preprocessing', 'feature engineering', 'data cleaning', 'pipeline'],
  },
  'Time Series': {
    section: 'Time Series',
    tags: ['time series', 'forecasting', 'sequence', 'temporal', 'trend'],
  },
  NLP: {
    section: 'NLP & Text',
    tags: ['nlp', 'text', 'language', 'words', 'documents'],
  },
  'Computer Vision': {
    section: 'Computer Vision',
    tags: ['computer vision', 'image', 'vision', 'pixels', 'camera'],
  },
  Recommendation: {
    section: 'Recommendation',
    tags: ['recommendation', 'recommender', 'collaborative filtering', 'ranking', 'personalization'],
  },
  'Reinforcement Learning': {
    section: 'Reinforcement Learning',
    tags: ['reinforcement learning', 'reward', 'agent', 'policy', 'exploration'],
  },
  Explainability: {
    section: 'Explainability',
    tags: ['explainability', 'interpretability', 'xai', 'transparency'],
  },
  Optimization: {
    section: 'Optimization',
    tags: ['optimization', 'optimizer', 'gradient', 'convergence', 'training'],
  },
  Ensemble: {
    section: 'Ensemble Methods',
    tags: ['ensemble', 'committee', 'meta learning'],
  },
  Probabilistic: {
    section: 'Probabilistic Models',
    tags: ['probabilistic', 'bayesian', 'uncertainty', 'distribution'],
  },
  Deployment: {
    section: 'Deployment',
    tags: ['deployment', 'export', 'inference', 'production', 'serving'],
  },
  Lab: {
    section: 'Lab & Workspaces',
    tags: ['lab', 'workspace', 'experiment', 'tooling'],
  },
};

export const algorithmSearchMeta: Record<string, AlgorithmSearchMeta> = {
  '/ml/supervised/simple-linear-regression': {
    description: 'Fit a straight line through one feature to predict a continuous value.',
    synonyms: ['linear regression', 'ols', 'ordinary least squares', 'line of best fit', 'slr'],
    tags: ['line', 'least squares', 'trend', 'salary', 'house prices'],
  },
  '/ml/supervised/multiple-linear-regression': {
    description: 'Extend linear regression to many features with one coefficient per predictor.',
    synonyms: ['multiple regression', 'multivariate linear regression', 'mlr'],
    tags: ['coefficients', 'multicollinearity', 'least squares', 'house prices'],
  },
  '/ml/supervised/polynomial-regression': {
    description: 'Model curved relationships by adding polynomial powers of the input features.',
    synonyms: ['curve fitting', 'quadratic regression', 'nonlinear regression'],
    tags: ['curve', 'degree', 'overfitting', 'basis expansion'],
  },
  '/ml/supervised/ridge-regression': {
    description: 'Linear regression with L2 shrinkage that tames correlated features.',
    synonyms: ['l2 regularization', 'tikhonov regularization', 'weight decay'],
    tags: ['regularization', 'shrinkage', 'penalty', 'multicollinearity'],
  },
  '/ml/supervised/lasso-regression': {
    description: 'L1-penalised regression that drives weak coefficients to exactly zero.',
    synonyms: ['l1 regularization', 'least absolute shrinkage'],
    tags: ['regularization', 'sparsity', 'feature selection', 'penalty'],
  },
  '/ml/supervised/elastic-net-regression': {
    description: 'Blend L1 and L2 penalties to get sparsity and stability together.',
    synonyms: ['elastic net regression', 'l1 l2 regularization'],
    tags: ['regularization', 'sparsity', 'penalty', 'shrinkage'],
  },
  '/ml/supervised/decision-tree-regression': {
    description: 'Recursively split the feature space into regions with constant predictions.',
    synonyms: ['regression tree', 'cart regression'],
    tags: ['tree', 'splits', 'depth', 'interpretable', 'nonlinear'],
  },
  '/ml/supervised/random-forest-regression': {
    description: 'Average many de-correlated regression trees to cut variance.',
    synonyms: ['random forest', 'bagged trees regression'],
    tags: ['tree', 'ensemble', 'bagging', 'bootstrap', 'variance'],
  },
  '/ml/supervised/gradient-boosting-regression': {
    description: 'Fit trees sequentially on residuals to build a strong regressor.',
    synonyms: ['gbm', 'gbdt', 'boosted trees', 'gradient boosted regression'],
    tags: ['tree', 'ensemble', 'boosting', 'residuals', 'learning rate'],
  },
  '/ml/supervised/support-vector-regression': {
    description: 'Fit a tube around the data and only penalise points outside the margin.',
    synonyms: ['svr', 'support vector regression', 'epsilon insensitive regression'],
    tags: ['kernel', 'margin', 'epsilon tube', 'rbf'],
  },

  '/ml/supervised/logistic-regression': {
    description: 'Squash a linear score through a sigmoid to get class probabilities.',
    synonyms: ['logit', 'logit model', 'sigmoid classifier', 'binary classification'],
    tags: ['probabilistic', 'sigmoid', 'log loss', 'odds', 'roc', 'churn'],
  },
  '/ml/supervised/multinomial-logistic-regression': {
    description: 'Softmax regression for choosing between more than two classes.',
    synonyms: ['softmax regression', 'multiclass logistic regression', 'maxent'],
    tags: ['multiclass', 'softmax', 'probabilistic', 'cross entropy'],
  },
  '/ml/supervised/knn-classification': {
    description: 'Classify a point by majority vote of its nearest labelled neighbours.',
    synonyms: ['knn', 'k nn', 'k nearest neighbours', 'k nearest neighbors', 'nearest neighbour', 'instance based learning', 'lazy learning'],
    tags: ['distance', 'euclidean', 'manhattan', 'voting', 'decision boundary', 'nonparametric'],
  },
  '/ml/supervised/naive-bayes': {
    description: 'Apply Bayes rule with a conditional-independence shortcut per feature.',
    synonyms: ['naive bayes classifier', 'bayes classifier', 'gaussian naive bayes', 'multinomial naive bayes'],
    tags: ['probabilistic', 'bayesian', 'prior', 'posterior', 'likelihood', 'spam', 'text'],
  },
  '/ml/supervised/decision-tree-classification': {
    description: 'Split on the most informative feature at each node to reach a class leaf.',
    synonyms: ['decision trees', 'classification tree', 'cart', 'id3', 'c4.5'],
    tags: ['tree', 'gini', 'entropy', 'information gain', 'splits', 'interpretable', 'rules'],
  },
  '/ml/supervised/random-forest-classification': {
    description: 'Vote across hundreds of bootstrapped trees for a robust classifier.',
    synonyms: ['random forest', 'random forests', 'bagged trees'],
    tags: ['tree', 'ensemble', 'bagging', 'bootstrap', 'feature importance', 'churn'],
  },
  '/ml/supervised/svm-classification': {
    description: 'Find the maximum-margin hyperplane, optionally in a kernel feature space.',
    synonyms: ['svm', 'support vector machine', 'support vector machines', 'support vector classifier', 'svc', 'max margin classifier'],
    tags: ['kernel', 'rbf', 'hyperplane', 'margin', 'support vectors', 'decision boundary'],
  },
  '/ml/supervised/gradient-boosting-classification': {
    description: 'Stage-wise trees that each correct the previous ensemble mistakes.',
    synonyms: ['gbm', 'gbdt', 'gradient boosted trees', 'boosted classifier'],
    tags: ['tree', 'ensemble', 'boosting', 'learning rate', 'residuals', 'tabular'],
  },
  '/ml/supervised/adaboost-classification': {
    description: 'Reweight misclassified samples so each new stump focuses on hard cases.',
    synonyms: ['adaboost', 'adaptive boosting'],
    tags: ['tree', 'ensemble', 'boosting', 'stumps', 'sample weights'],
  },
  '/ml/supervised/xgboost-concept': {
    description: 'Regularised gradient boosting with second-order splits and shrinkage.',
    synonyms: ['xgboost', 'extreme gradient boosting', 'lightgbm', 'catboost'],
    tags: ['tree', 'ensemble', 'boosting', 'regularization', 'kaggle', 'tabular'],
  },

  '/ml/clustering/k-means': {
    description: 'Alternate assigning points to centroids and recomputing those centroids.',
    synonyms: ['kmeans', 'k means', 'lloyd algorithm', 'centroid clustering'],
    tags: ['centroid', 'inertia', 'elbow', 'silhouette', 'customer segmentation'],
  },
  '/ml/clustering/k-medoids': {
    description: 'Cluster around actual data points so outliers cannot drag centres away.',
    synonyms: ['kmedoids', 'k medoids', 'pam', 'partitioning around medoids'],
    tags: ['medoid', 'robust', 'outliers', 'distance matrix'],
  },
  '/ml/clustering/hierarchical-clustering': {
    description: 'Merge or split clusters step by step and read the result off a dendrogram.',
    synonyms: ['agglomerative clustering', 'dendrogram', 'ward linkage', 'divisive clustering'],
    tags: ['tree', 'linkage', 'dendrogram', 'distance', 'taxonomy'],
  },
  '/ml/clustering/dbscan': {
    description: 'Grow clusters through dense neighbourhoods and label the rest as noise.',
    synonyms: ['dbscan', 'density based clustering'],
    tags: ['density', 'epsilon', 'minpts', 'noise', 'outliers', 'arbitrary shapes'],
  },
  '/ml/clustering/mean-shift': {
    description: 'Shift every point uphill along the density gradient to find modes.',
    synonyms: ['mean shift', 'mode seeking clustering'],
    tags: ['density', 'kernel', 'bandwidth', 'modes'],
  },
  '/ml/clustering/gaussian-mixture-model': {
    description: 'Soft clustering with Gaussian components fitted by expectation-maximisation.',
    synonyms: ['gmm', 'gaussian mixture', 'mixture model', 'em algorithm'],
    tags: ['probabilistic', 'soft assignment', 'covariance', 'bayesian', 'density'],
  },
  '/ml/clustering/spectral-clustering': {
    description: 'Cluster the eigenvectors of a similarity graph instead of raw coordinates.',
    synonyms: ['spectral clustering', 'graph clustering', 'normalized cuts'],
    tags: ['graph', 'eigenvectors', 'laplacian', 'similarity', 'manifold'],
  },
  '/ml/clustering/optics': {
    description: 'Order points by reachability to expose clusters at many densities at once.',
    synonyms: ['optics', 'ordering points to identify clustering structure'],
    tags: ['density', 'reachability', 'hierarchy', 'noise'],
  },

  '/ml/dimensionality-reduction/pca': {
    description: 'Rotate onto the orthogonal directions that capture the most variance.',
    synonyms: ['pca', 'principal component analysis', 'principal components'],
    tags: ['variance', 'eigenvectors', 'eigenvalues', 'covariance', 'scree plot', 'whitening'],
  },
  '/ml/dimensionality-reduction/kernel-pca': {
    description: 'Run PCA in a kernel feature space to unfold curved structure.',
    synonyms: ['kernel pca', 'kpca', 'nonlinear pca'],
    tags: ['kernel', 'rbf', 'nonlinear', 'eigenvectors', 'manifold'],
  },
  '/ml/dimensionality-reduction/tsne': {
    description: 'Preserve local neighbourhoods when squeezing data down to 2D for plotting.',
    synonyms: ['tsne', 't sne', 't-distributed stochastic neighbor embedding', 'stochastic neighbour embedding'],
    tags: ['visualization', 'perplexity', 'manifold', 'neighbourhood', 'scatter plot'],
  },
  '/ml/dimensionality-reduction/umap-concept': {
    description: 'Manifold embedding that keeps more global structure than t-SNE.',
    synonyms: ['umap', 'uniform manifold approximation and projection'],
    tags: ['visualization', 'manifold', 'neighbourhood', 'topology', 'embedding'],
  },
  '/ml/dimensionality-reduction/lda': {
    description: 'Project onto the axes that best separate known class labels.',
    synonyms: ['lda', 'linear discriminant analysis', 'fisher discriminant'],
    tags: ['supervised', 'classification', 'scatter matrix', 'separability', 'projection'],
  },
  '/ml/dimensionality-reduction/autoencoder': {
    description: 'Train a neural bottleneck to compress and reconstruct its own input.',
    synonyms: ['autoencoder', 'autoencoders', 'encoder decoder', 'neural compression'],
    tags: ['neural network', 'bottleneck', 'reconstruction', 'latent space', 'compression'],
  },

  '/ml/deep-learning/perceptron': {
    description: 'The single-neuron linear classifier that started neural networks.',
    synonyms: ['perceptron', 'single layer neural network', 'linear threshold unit'],
    tags: ['neuron', 'weights', 'bias', 'activation'],
  },
  '/ml/deep-learning/mlp': {
    description: 'Stacked dense layers with nonlinear activations, trained by backprop.',
    synonyms: ['mlp', 'multilayer perceptron', 'feedforward neural network', 'dense network', 'fully connected network', 'neural networks'],
    tags: ['neuron', 'hidden layers', 'activation', 'backpropagation', 'relu'],
  },
  '/ml/deep-learning/nn-playground': {
    description: 'Interactive sandbox for wiring up and training a network in the browser.',
    synonyms: ['neural network playground', 'nn playground', 'network sandbox'],
    tags: ['playground', 'interactive', 'training', 'hyperparameters', 'sandbox'],
  },
  '/ml/deep-learning/cnn': {
    description: 'Convolution and pooling layers that learn spatial features from images.',
    synonyms: ['cnn', 'convolutional neural network', 'convnet'],
    tags: ['image', 'convolution', 'filters', 'pooling', 'computer vision', 'feature maps'],
  },
  '/ml/deep-learning/convolution-visualizer': {
    description: 'Step a kernel across a grid and watch each convolution output appear.',
    synonyms: ['convolution visualizer', 'kernel visualizer', 'filter visualizer'],
    tags: ['image', 'convolution', 'kernel', 'stride', 'padding', 'interactive'],
  },
  '/ml/deep-learning/rnn': {
    description: 'Carry a hidden state across time steps to model sequences.',
    synonyms: ['rnn', 'recurrent neural network'],
    tags: ['sequence', 'hidden state', 'time series', 'text', 'unrolling'],
  },
  '/ml/deep-learning/lstm': {
    description: 'Gated recurrent cells that keep gradients alive over long sequences.',
    synonyms: ['lstm', 'long short term memory', 'lstm networks'],
    tags: ['sequence', 'gates', 'memory', 'time series', 'text', 'vanishing gradient'],
  },
  '/ml/deep-learning/gru': {
    description: 'A lighter gated recurrent unit with fewer parameters than LSTM.',
    synonyms: ['gru', 'gated recurrent unit'],
    tags: ['sequence', 'gates', 'memory', 'time series'],
  },
  '/ml/deep-learning/transformer-attention': {
    description: 'Scaled dot-product attention that lets every token look at every other.',
    synonyms: ['transformer', 'transformers', 'self attention', 'attention mechanism', 'scaled dot product attention'],
    tags: ['nlp', 'text', 'tokens', 'softmax', 'query key value', 'llm', 'sequence'],
  },
  '/ml/deep-learning/multi-head-attention': {
    description: 'Run several attention heads in parallel and concatenate their views.',
    synonyms: ['multi head attention', 'mha', 'attention heads'],
    tags: ['nlp', 'text', 'tokens', 'transformer', 'parallel heads'],
  },
  '/ml/deep-learning/backpropagation-visualizer': {
    description: 'Trace gradients flowing backwards through a small network, layer by layer.',
    synonyms: ['backpropagation', 'backprop', 'chain rule', 'gradient flow'],
    tags: ['gradient', 'chain rule', 'training', 'derivatives', 'interactive'],
  },
  '/ml/deep-learning/few-shot-learning': {
    description: 'Recognise new classes from a handful of examples using embeddings.',
    synonyms: ['few shot learning', 'one shot learning', 'metric learning'],
    tags: ['embedding', 'similarity', 'prototypes', 'transfer', 'image'],
  },
  '/ml/deep-learning/network-builder': {
    description: 'Compose layers into an architecture and train it without writing code.',
    synonyms: ['network builder', 'architecture builder', 'model builder'],
    tags: ['architecture', 'layers', 'training', 'interactive', 'no code'],
  },
  '/ml/deep-learning/transfer-learning': {
    description: 'Reuse a pretrained backbone and fine-tune only the new head.',
    synonyms: ['transfer learning', 'fine tuning', 'pretrained model'],
    tags: ['image', 'pretrained', 'fine tuning', 'embedding', 'mobilenet'],
  },

  '/ml/evaluation/train-test-split': {
    description: 'Hold out unseen rows so your score estimates real generalisation.',
    synonyms: ['train test split', 'holdout', 'train validation split'],
    tags: ['holdout', 'generalization', 'leakage', 'sampling'],
  },
  '/ml/evaluation/cross-validation': {
    description: 'Rotate the validation fold so every row gets scored exactly once.',
    synonyms: ['cross validation', 'k fold', 'kfold', 'stratified cross validation'],
    tags: ['folds', 'generalization', 'variance', 'model selection'],
  },
  '/ml/evaluation/confusion-matrix': {
    description: 'Cross-tabulate predictions against truth to see which errors you make.',
    synonyms: ['confusion matrix', 'error matrix', 'true positives', 'false positives'],
    tags: ['classification', 'precision', 'recall', 'accuracy', 'errors'],
  },
  '/ml/evaluation/roc-auc': {
    description: 'Sweep the threshold and plot true positive rate against false positive rate.',
    synonyms: ['roc', 'auc', 'roc curve', 'area under curve', 'roc auc'],
    tags: ['classification', 'threshold', 'ranking', 'sensitivity', 'specificity'],
  },
  '/ml/evaluation/precision-recall-curve': {
    description: 'The threshold curve to trust when your positive class is rare.',
    synonyms: ['precision recall curve', 'pr curve', 'average precision'],
    tags: ['classification', 'imbalanced', 'threshold', 'f1', 'fraud'],
  },
  '/ml/evaluation/regression-metrics': {
    description: 'Compare MAE, MSE, RMSE and R-squared on the same predictions.',
    synonyms: ['regression metrics', 'mae', 'mse', 'rmse', 'r2', 'r squared'],
    tags: ['regression', 'error', 'residuals', 'scoring'],
  },
  '/ml/evaluation/bias-variance-tradeoff': {
    description: 'Watch underfitting and overfitting trade places as capacity grows.',
    synonyms: ['bias variance tradeoff', 'overfitting', 'underfitting', 'model complexity'],
    tags: ['generalization', 'capacity', 'learning curve', 'regularization'],
  },

  '/ml/preprocessing/missing-values': {
    description: 'Compare dropping, mean, median and indicator strategies for gaps in data.',
    synonyms: ['missing values', 'imputation', 'nan handling', 'null values'],
    tags: ['imputation', 'data cleaning', 'median', 'indicator'],
  },
  '/ml/preprocessing/scaling-normalization': {
    description: 'Standardise, min-max or robust-scale features onto a comparable range.',
    synonyms: ['scaling', 'normalization', 'standardization', 'standard scaler', 'min max scaler', 'z score'],
    tags: ['standardize', 'min max', 'robust scaler', 'distance', 'gradient descent'],
  },
  '/ml/preprocessing/categorical-encoding': {
    description: 'Turn category labels into numbers with one-hot, ordinal or target encoding.',
    synonyms: ['categorical encoding', 'one hot encoding', 'label encoding', 'ordinal encoding', 'target encoding'],
    tags: ['categories', 'one hot', 'dummy variables', 'cardinality'],
  },
  '/ml/preprocessing/outlier-detection': {
    description: 'Flag extreme rows with z-scores, IQR fences or isolation-style rules.',
    synonyms: ['outlier detection', 'anomaly', 'iqr', 'z score outliers'],
    tags: ['outliers', 'anomaly', 'robust', 'data cleaning', 'fraud'],
  },
  '/ml/preprocessing/feature-selection': {
    description: 'Keep the features that carry signal and drop the rest.',
    synonyms: ['feature selection', 'variable selection', 'filter methods', 'wrapper methods', 'rfe'],
    tags: ['feature importance', 'correlation', 'mutual information', 'dimensionality'],
  },
  '/ml/preprocessing/polynomial-features': {
    description: 'Expand features into powers and interactions before a linear model.',
    synonyms: ['polynomial features', 'feature interactions', 'basis expansion'],
    tags: ['interactions', 'degree', 'nonlinear', 'feature engineering'],
  },

  '/ml/time-series/moving-average': {
    description: 'Smooth a series with a rolling window to reveal the trend.',
    synonyms: ['moving average', 'rolling mean', 'sma', 'simple moving average'],
    tags: ['smoothing', 'window', 'trend', 'forecasting'],
  },
  '/ml/time-series/exponential-smoothing': {
    description: 'Weight recent observations more heavily with a single decay factor.',
    synonyms: ['exponential smoothing', 'ewma', 'ses', 'exponentially weighted moving average'],
    tags: ['smoothing', 'decay', 'alpha', 'forecasting'],
  },
  '/ml/time-series/holt-winters': {
    description: 'Triple exponential smoothing for level, trend and seasonality together.',
    synonyms: ['holt winters', 'triple exponential smoothing', 'seasonal smoothing'],
    tags: ['seasonality', 'trend', 'forecasting', 'smoothing'],
  },
  '/ml/time-series/arima-concept': {
    description: 'Combine autoregression, differencing and moving-average errors.',
    synonyms: ['arima', 'sarima', 'autoregressive integrated moving average', 'box jenkins'],
    tags: ['autoregression', 'differencing', 'stationarity', 'acf', 'forecasting'],
  },
  '/ml/time-series/anomaly-detection': {
    description: 'Spot points that break the expected temporal pattern.',
    synonyms: ['anomaly detection', 'outlier detection time series', 'novelty detection'],
    tags: ['anomaly', 'outliers', 'residuals', 'monitoring', 'fraud'],
  },
  '/ml/time-series/rnn-forecasting': {
    description: 'Train a recurrent net in the browser to predict the next values.',
    synonyms: ['rnn forecasting', 'recurrent forecasting', 'neural forecasting'],
    tags: ['forecasting', 'sequence', 'neural network', 'window'],
  },
  '/ml/time-series/lstm-forecasting': {
    description: 'Use LSTM memory cells for longer-horizon sequence forecasting.',
    synonyms: ['lstm forecasting', 'long short term memory forecasting'],
    tags: ['forecasting', 'sequence', 'neural network', 'memory', 'horizon'],
  },
  '/ml/time-series/gru-forecasting': {
    description: 'A lighter gated recurrent forecaster that trains faster than LSTM.',
    synonyms: ['gru forecasting', 'gated recurrent forecasting'],
    tags: ['forecasting', 'sequence', 'neural network', 'gates'],
  },

  '/ml/nlp/bag-of-words': {
    description: 'Represent a document as raw counts over a fixed vocabulary.',
    synonyms: ['bag of words', 'bow', 'count vectorizer', 'term counts'],
    tags: ['vocabulary', 'counts', 'tokenization', 'sparse'],
  },
  '/ml/nlp/tf-idf': {
    description: 'Weight terms by how often they appear here versus everywhere else.',
    synonyms: ['tf idf', 'tfidf', 'term frequency inverse document frequency'],
    tags: ['vocabulary', 'weighting', 'keywords', 'sparse', 'search'],
  },
  '/ml/nlp/text-classification': {
    description: 'Train a classifier over text features to predict document labels.',
    synonyms: ['text classification', 'document classification', 'topic classification'],
    tags: ['classification', 'spam', 'sentiment', 'labels', 'vectorizer'],
  },
  '/ml/nlp/word-embedding-concept': {
    description: 'Map words to dense vectors where distance encodes meaning.',
    synonyms: ['word embedding', 'word2vec', 'glove', 'embeddings', 'word vectors'],
    tags: ['embedding', 'vectors', 'similarity', 'semantics', 'cosine'],
  },
  '/ml/nlp/sentiment-analysis': {
    description: 'Score text as positive or negative and inspect which words drove it.',
    synonyms: ['sentiment analysis', 'opinion mining', 'polarity detection'],
    tags: ['classification', 'reviews', 'polarity', 'text', 'social media'],
  },
  '/ml/nlp/naive-bayes-spam': {
    description: 'Classic spam filter: naive Bayes over word counts in an inbox.',
    synonyms: ['spam classifier', 'spam filter', 'spam detection', 'naive bayes spam', 'email filtering'],
    tags: ['spam', 'email', 'probabilistic', 'bayesian', 'text', 'classification'],
  },
  '/ml/nlp/audio-classification': {
    description: 'Train a browser model to tell short audio clips apart.',
    synonyms: ['audio classification', 'sound classification', 'speech commands'],
    tags: ['audio', 'sound', 'microphone', 'spectrogram', 'classification'],
  },

  '/ml/computer-vision/image-classification': {
    description: 'Train an in-browser image classifier from your own webcam samples.',
    synonyms: ['image classification', 'picture classification', 'photo classifier'],
    tags: ['image', 'webcam', 'classification', 'mobilenet', 'transfer learning'],
  },
  '/ml/computer-vision/audio-classification': {
    description: 'Classify audio clips using the same browser training loop as images.',
    synonyms: ['audio classification', 'sound recognition'],
    tags: ['audio', 'sound', 'microphone', 'classification'],
  },
  '/ml/computer-vision/hand-gesture-recognition': {
    description: 'Detect hand landmarks from the webcam and classify gestures live.',
    synonyms: ['hand gesture recognition', 'hand tracking', 'hand pose detection'],
    tags: ['image', 'webcam', 'landmarks', 'gestures', 'real time'],
  },
  '/ml/computer-vision/pose-detection': {
    description: 'Estimate body keypoints and classify the resulting pose.',
    synonyms: ['pose detection', 'pose classification', 'pose estimation', 'skeleton tracking'],
    tags: ['image', 'webcam', 'keypoints', 'skeleton', 'real time'],
  },
  '/ml/computer-vision/person-segmentation': {
    description: 'Separate person pixels from background for masks and blur effects.',
    synonyms: ['person segmentation', 'body segmentation', 'background removal', 'semantic segmentation'],
    tags: ['image', 'webcam', 'mask', 'pixels', 'background'],
  },
  '/ml/computer-vision/cnn-filter-explorer': {
    description: 'Inspect what each convolutional filter responds to in an image.',
    synonyms: ['cnn filter explorer', 'filter visualization', 'feature map explorer'],
    tags: ['image', 'convolution', 'filters', 'feature maps', 'interactive'],
  },
  '/ml/computer-vision/kmeans-image-segmentation': {
    description: 'Cluster pixel colours with k-means to posterise and segment an image.',
    synonyms: ['kmeans image segmentation', 'colour quantization', 'color quantization', 'pixel clustering'],
    tags: ['image', 'clustering', 'pixels', 'colours', 'segmentation'],
  },
  '/ml/computer-vision/edge-detection': {
    description: 'Apply Sobel and Canny style kernels to find intensity boundaries.',
    synonyms: ['edge detection', 'sobel', 'canny', 'gradient filter'],
    tags: ['image', 'convolution', 'kernel', 'gradients', 'edges'],
  },
  '/ml/computer-vision/object-detection-demo': {
    description: 'Draw boxes around multiple objects in a frame with a pretrained detector.',
    synonyms: ['object detection', 'bounding boxes', 'coco ssd', 'yolo'],
    tags: ['image', 'webcam', 'bounding box', 'detection', 'real time'],
  },
  '/ml/computer-vision/grad-cam': {
    description: 'Overlay a heatmap showing which pixels drove the prediction.',
    synonyms: ['grad cam', 'gradcam', 'class activation map', 'saliency map'],
    tags: ['image', 'explainability', 'heatmap', 'attribution', 'interpretability'],
  },

  '/ml/recommendation/user-based-cf': {
    description: 'Recommend what similar users liked, using user-user similarity.',
    synonyms: ['user based collaborative filtering', 'user user cf', 'neighbourhood recommender'],
    tags: ['similarity', 'cosine', 'ratings', 'sparse matrix', 'neighbours'],
  },
  '/ml/recommendation/item-based-cf': {
    description: 'Recommend items similar to the ones a user already rated highly.',
    synonyms: ['item based collaborative filtering', 'item item cf'],
    tags: ['similarity', 'cosine', 'ratings', 'co-occurrence', 'catalogue'],
  },
  '/ml/recommendation/matrix-factorization': {
    description: 'Factor the rating matrix into latent user and item vectors.',
    synonyms: ['matrix factorization', 'svd recommender', 'latent factor model', 'als'],
    tags: ['latent factors', 'embedding', 'ratings', 'svd', 'cold start'],
  },
  '/ml/recommendation/content-based': {
    description: 'Match item attributes to a profile built from a user history.',
    synonyms: ['content based recommendation', 'content filtering', 'profile based recommender'],
    tags: ['features', 'similarity', 'tags', 'profile', 'cold start'],
  },

  '/ml/reinforcement-learning/multi-armed-bandit': {
    description: 'Balance exploring unknown arms against exploiting the best known one.',
    synonyms: ['multi armed bandit', 'bandit', 'epsilon greedy', 'ucb', 'thompson sampling'],
    tags: ['exploration', 'exploitation', 'regret', 'ab testing', 'reward'],
  },
  '/ml/reinforcement-learning/q-learning-grid-world': {
    description: 'Learn a Q-table of action values by wandering a reward grid.',
    synonyms: ['q learning', 'qlearning', 'q table', 'grid world', 'temporal difference learning'],
    tags: ['reward', 'policy', 'discount', 'bellman', 'exploration', 'agent'],
  },
  '/ml/reinforcement-learning/markov-decision-process': {
    description: 'The states, actions, transitions and rewards that RL is defined over.',
    synonyms: ['markov decision process', 'mdp', 'value iteration', 'policy iteration', 'bellman equation'],
    tags: ['states', 'transitions', 'policy', 'discount', 'dynamic programming'],
  },

  '/ml/explainability/feature-importance': {
    description: 'Rank features by how much the model actually leans on each one.',
    synonyms: ['feature importance', 'permutation importance', 'gain importance'],
    tags: ['ranking', 'attribution', 'tree', 'interpretability'],
  },
  '/ml/explainability/partial-dependence-plot': {
    description: 'Sweep one feature and plot the average predicted response.',
    synonyms: ['partial dependence plot', 'pdp', 'ice plot', 'marginal effect'],
    tags: ['attribution', 'marginal', 'response curve', 'interpretability'],
  },
  '/ml/explainability/shap-concept': {
    description: 'Attribute a prediction to features using Shapley values from game theory.',
    synonyms: ['shap', 'shapley values', 'shapley additive explanations'],
    tags: ['attribution', 'additive', 'game theory', 'local explanation'],
  },
  '/ml/explainability/lime-concept': {
    description: 'Fit a simple local surrogate around one prediction to explain it.',
    synonyms: ['lime', 'local interpretable model agnostic explanations', 'local surrogate'],
    tags: ['attribution', 'surrogate', 'local explanation', 'perturbation'],
  },

  '/ml/optimization/gradient-descent': {
    description: 'Step downhill along the gradient to minimise a loss surface.',
    synonyms: ['gradient descent', 'batch gradient descent', 'steepest descent'],
    tags: ['learning rate', 'loss surface', 'convergence', 'derivative'],
  },
  '/ml/optimization/sgd': {
    description: 'Noisy gradient steps from mini-batches, which is what actually scales.',
    synonyms: ['sgd', 'stochastic gradient descent', 'mini batch gradient descent'],
    tags: ['learning rate', 'mini batch', 'noise', 'convergence'],
  },
  '/ml/optimization/momentum': {
    description: 'Accumulate velocity across steps to power through ravines.',
    synonyms: ['momentum', 'momentum optimizer', 'nesterov momentum', 'heavy ball'],
    tags: ['velocity', 'learning rate', 'convergence', 'oscillation'],
  },
  '/ml/optimization/adam': {
    description: 'Adaptive per-parameter step sizes from first and second moments.',
    synonyms: ['adam', 'adam optimizer', 'adaptive moment estimation', 'rmsprop', 'adagrad'],
    tags: ['adaptive', 'learning rate', 'moments', 'convergence', 'deep learning'],
  },

  '/ml/ensemble/bagging': {
    description: 'Train models on bootstrap resamples and average away the variance.',
    synonyms: ['bagging', 'bootstrap aggregating', 'bootstrap aggregation'],
    tags: ['bootstrap', 'variance', 'parallel', 'tree', 'averaging'],
  },
  '/ml/ensemble/boosting': {
    description: 'Chain weak learners so each one fixes the previous mistakes.',
    synonyms: ['boosting', 'sequential ensemble', 'weak learners'],
    tags: ['sequential', 'bias', 'residuals', 'tree', 'learning rate'],
  },
  '/ml/ensemble/stacking': {
    description: 'Feed base-model predictions into a meta-learner that blends them.',
    synonyms: ['stacking', 'stacked generalization', 'blending', 'meta learner'],
    tags: ['meta learning', 'blending', 'out of fold', 'ensemble'],
  },

  '/ml/probabilistic/bayesian-linear-regression': {
    description: 'Put a prior on the weights and get a posterior with error bars.',
    synonyms: ['bayesian linear regression', 'bayesian regression', 'posterior regression'],
    tags: ['regression', 'prior', 'posterior', 'uncertainty', 'credible interval'],
  },
  '/ml/probabilistic/gaussian-process-regression': {
    description: 'A distribution over functions with calibrated predictive uncertainty.',
    synonyms: ['gaussian process', 'gpr', 'gaussian process regression', 'kriging'],
    tags: ['regression', 'kernel', 'uncertainty', 'covariance', 'nonparametric'],
  },
  '/ml/probabilistic/hidden-markov-model': {
    description: 'Infer hidden states behind an observed sequence with Viterbi.',
    synonyms: ['hidden markov model', 'hmm', 'viterbi', 'forward backward'],
    tags: ['sequence', 'states', 'transitions', 'emissions', 'time series', 'speech'],
  },

  '/ml/deployment/browser-model-loader': {
    description: 'Load a saved model into the browser and run predictions client-side.',
    synonyms: ['browser model loader', 'model loading', 'client side inference'],
    tags: ['inference', 'tensorflowjs', 'client side', 'loading'],
  },
  '/ml/deployment/onnx-runtime-demo': {
    description: 'Run an ONNX graph in WebAssembly for portable inference.',
    synonyms: ['onnx', 'onnx runtime', 'onnx runtime web'],
    tags: ['inference', 'onnx', 'wasm', 'portability', 'interoperability'],
  },
  '/ml/deployment/tensorflowjs-training': {
    description: 'Train end to end in the browser with TensorFlow.js and WebGL.',
    synonyms: ['tensorflowjs', 'tensorflow js', 'tfjs', 'browser training'],
    tags: ['training', 'webgl', 'tensorflowjs', 'client side'],
  },
  '/ml/deployment/model-export': {
    description: 'Serialise weights and topology into a portable artifact.',
    synonyms: ['model export', 'save model', 'serialization', 'checkpoint'],
    tags: ['export', 'weights', 'artifact', 'serialization'],
  },
  '/ml/deployment/export-hub': {
    description: 'One place to export models, datasets and reports in several formats.',
    synonyms: ['export hub', 'download hub', 'artifact hub'],
    tags: ['export', 'download', 'formats', 'reports'],
  },
  '/ml/deployment/model-card': {
    description: 'Document intended use, data, metrics and limitations of a model.',
    synonyms: ['model card', 'model documentation', 'model governance'],
    tags: ['documentation', 'governance', 'ethics', 'limitations', 'reporting'],
  },

  '/ml/lab/experiment-workspace': {
    description: 'Pick a dataset and algorithm, train, and keep the run side by side.',
    synonyms: ['experiment workspace', 'experiment runner'],
    tags: ['workflow', 'training', 'datasets', 'runs'],
  },
  '/ml/lab/model-zoo': {
    description: 'Browse ready-to-run pretrained models you can try immediately.',
    synonyms: ['model zoo', 'pretrained models', 'model catalogue'],
    tags: ['pretrained', 'catalogue', 'inference', 'browse'],
  },
  '/ml/lab/automl-assistant': {
    description: 'Let the assistant sweep candidate models and surface the best one.',
    synonyms: ['automl assistant', 'automated machine learning', 'auto ml'],
    tags: ['automation', 'search', 'model selection', 'tuning'],
  },
  '/ml/lab/training-visualizations': {
    description: 'Watch loss, accuracy and gradients evolve while a model trains.',
    synonyms: ['training visualizations', 'loss curves', 'training curves'],
    tags: ['monitoring', 'loss curve', 'metrics', 'epochs'],
  },
  '/ml/lab/inference-playground': {
    description: 'Feed ad-hoc inputs to a trained model and inspect the output.',
    synonyms: ['inference playground', 'prediction playground'],
    tags: ['inference', 'predictions', 'interactive', 'sandbox'],
  },
  '/ml/lab/model-comparison-dashboard': {
    description: 'Score several trained models on the same split and rank them.',
    synonyms: ['model comparison dashboard', 'leaderboard', 'benchmark dashboard'],
    tags: ['comparison', 'metrics', 'leaderboard', 'benchmark'],
  },
  '/ml/lab/explainability-center': {
    description: 'Run importance, PDP and attribution tools against one model.',
    synonyms: ['explainability center', 'interpretability hub'],
    tags: ['explainability', 'attribution', 'interpretability', 'reporting'],
  },
  '/ml/lab/dataset-intelligence': {
    description: 'Profile a dataset for leakage, drift, imbalance and correlation.',
    synonyms: ['dataset intelligence', 'data profiling', 'data quality'],
    tags: ['profiling', 'drift', 'imbalance', 'correlation', 'datasets'],
  },
  '/ml/lab/tuning-engine': {
    description: 'Search hyperparameter space with grid, random or Bayesian strategies.',
    synonyms: ['tuning engine', 'hyperparameter search', 'grid search', 'random search'],
    tags: ['hyperparameters', 'search', 'optimization', 'sweep'],
  },
  '/ml/lab/train-your-model': {
    description: 'Guided flow from raw data to a trained, evaluated model.',
    synonyms: ['train your model', 'guided training', 'training wizard'],
    tags: ['training', 'guided', 'workflow'],
  },
  '/ml/lab/image-annotation': {
    description: 'Label images and boxes to build your own vision dataset.',
    synonyms: ['image annotation', 'labelling tool', 'labeling tool', 'bounding box editor'],
    tags: ['image', 'labels', 'annotation', 'datasets'],
  },
  '/ml/lab/data-augmentation': {
    description: 'Synthesise extra training samples with flips, crops and noise.',
    synonyms: ['data augmentation', 'image augmentation', 'synthetic data'],
    tags: ['image', 'augmentation', 'regularization', 'datasets'],
  },
  '/ml/lab/model-comparison': {
    description: 'Train two configurations head to head on identical data.',
    synonyms: ['model comparison', 'a b model test'],
    tags: ['comparison', 'metrics', 'training', 'benchmark'],
  },
  '/ml/lab/batch-inference': {
    description: 'Score a whole file of rows in one pass and export the results.',
    synonyms: ['batch inference', 'bulk prediction', 'offline scoring'],
    tags: ['inference', 'batch', 'export', 'throughput'],
  },
  '/ml/lab/active-learning': {
    description: 'Label only the samples the model is most unsure about.',
    synonyms: ['active learning', 'human in the loop', 'uncertainty sampling'],
    tags: ['labels', 'uncertainty', 'annotation', 'sampling'],
  },
  '/ml/lab/performance-dashboard': {
    description: 'Track latency, memory and throughput of in-browser inference.',
    synonyms: ['performance dashboard', 'latency dashboard', 'profiling dashboard'],
    tags: ['latency', 'memory', 'throughput', 'monitoring'],
  },
  '/ml/lab/architecture-flow': {
    description: 'Diagram how data moves through a model architecture stage by stage.',
    synonyms: ['architecture flow', 'model diagram', 'pipeline diagram'],
    tags: ['architecture', 'diagram', 'pipeline', 'educational'],
  },
  '/ml/lab/algorithm-comparison': {
    description: 'Run many algorithms on one dataset and compare their metrics.',
    synonyms: ['algorithm comparison', 'model bake off', 'algorithm benchmark'],
    tags: ['comparison', 'benchmark', 'metrics', 'practice'],
  },
  '/ml/lab/hyperparameter-tuning': {
    description: 'See how each hyperparameter moves the validation score.',
    synonyms: ['hyperparameter tuning', 'parameter tuning', 'grid search lab'],
    tags: ['hyperparameters', 'search', 'validation', 'sweep'],
  },
  '/ml/lab/automl-concept': {
    description: 'How automated pipelines pick features, models and hyperparameters.',
    synonyms: ['automl', 'automated machine learning'],
    tags: ['automation', 'pipeline', 'model selection', 'concept'],
  },
  '/ml/lab/saved-experiments': {
    description: 'Revisit, rename and compare the runs you already saved.',
    synonyms: ['saved experiments', 'experiment history', 'run history'],
    tags: ['history', 'runs', 'workspace', 'comparison'],
  },
  '/ml/lab/dataset-manager': {
    description: 'Upload, clean, tag and reuse your own datasets across the suite.',
    synonyms: ['dataset manager', 'data manager', 'upload dataset', 'csv upload'],
    tags: ['datasets', 'upload', 'csv', 'tags', 'storage'],
  },
  '/ml/lab/report-builder': {
    description: 'Assemble charts, metrics and notes into a shareable report.',
    synonyms: ['report builder', 'report generator', 'export report'],
    tags: ['reporting', 'export', 'charts', 'documentation'],
  },
};
