import { getAlgorithmGuideSteps } from "./algorithmGuides";
import { getAlgorithmIntroduction } from "./algorithmIntroductions";
import { algorithmSearchMeta } from "./algorithmSearchMeta";
import { getAlgorithmByRoute } from "./implementationStatus";
import { getLearningContent } from "./learningContent";

export type LearnPageContent = {
  label: string;
  category: string;
  idea: string;
  story: string;
  important: string[];
  theory: string[];
  howItThinks: string[];
  formula: string;
  parameters: string[];
  miniExample: string;
  useWhen: string;
  watchFor: string;
  applications: string[];
  mistakes: string[];
  terms: Array<{ slug: string; label: string }>;
};

function sentences(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 28);
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function stepsFromHow(text: string | undefined): string[] {
  if (!text) return [];
  const numbered = text
    .split(/\s*(?:\d+\.\s+|; )\s*/)
    .map((part) => part.replace(/^\d+\.\s*/, "").trim())
    .filter((part) => part.length > 12 && !/^how /i.test(part));
  if (numbered.length >= 3) return numbered.slice(0, 6);
  return sentences(text).slice(0, 4);
}

const authored: Record<
  string,
  Partial<Pick<LearnPageContent, "important" | "theory" | "parameters" | "miniExample" | "formula">>
> = {
  "/ml/time-series/moving-average": {
    important: [
      "A moving average replaces each value with the mean of a local window of size n — it does not learn weights.",
      "Trailing (causal) windows use only past and present values, so they are valid for forecasting. Centered windows peek at the future and are for visualization or decomposition only.",
      "Larger n makes a smoother line and a larger lag. Small n follows noise; huge n can erase the very swings you care about.",
      "The residual (raw − average) is the homework the average refused to explain: spikes, seasonality, and sudden level shifts.",
      "Never validate a smoother with a random shuffle. Time order is the feature. A future leak makes the line look brilliant and the forecast useless.",
      "A moving average is a baseline, not a weather model. If the series has a strong trend plus a weekly season, Holt–Winters or ARIMA usually beat a lone window mean.",
    ],
    theory: [
      "For a trailing window of size n at time t, ŷ_t = (y_t + y_{t-1} + … + y_{t-n+1}) / n once the window is full. Until then the average is undefined or uses a partial window — this lab waits for a full window.",
      "Lag is built in: a trailing mean of daily data with n = 7 is roughly 3 days late on a sudden jump. Centered alignment splits that lag but spends future observations you will not have at forecast time.",
      "In frequency terms the simple moving average is a low-pass filter. It damps high-frequency jitter and passes slow level. It cannot invent a seasonal shape it was not given.",
    ],
  },
  "/ml/time-series/exponential-smoothing": {
    important: [
      "Exponential smoothing remembers the whole past, but each older point is multiplied by (1 − α) again — recent values speak louder.",
      "α near 1 chases the last observation. α near 0 barely moves. That single knob is the whole model in simple ES.",
      "Unlike a hard window of n, there is no sharp cutoff. Influence fades; it does not vanish at a cliff.",
      "Simple ES assumes a roughly constant level. A climbing series needs Holt (trend). A weekly heartbeat needs Holt–Winters.",
    ],
    theory: [
      "The level update is ℓ_t = α y_t + (1 − α) ℓ_{t-1}. The one-step forecast is often just ℓ_t. Unrolling the recursion shows y_t, y_{t-1}, y_{t-2}, … weighted by α, α(1−α), α(1−α)², …",
      "That geometric decay is why the method is named exponential. It is still a smoother, not a regression on calendar features.",
    ],
  },
  "/ml/time-series/holt-winters": {
    important: [
      "Holt–Winters keeps three memories: level, trend, and a seasonal profile that repeats every m steps.",
      "Additive seasonality adds a holiday bump. Multiplicative seasonality scales the bump with the level (busier shops, bigger weekends).",
      "You must pick the seasonal period m from the calendar (24 hours, 7 days, 12 months). The algorithm will not discover it for you.",
      "Three smoothing constants (α, β, γ) can overfit if you chase training MAE without a time-based holdout.",
    ],
    theory: [
      "Each step updates level from the de-seasonalized observation, trend from the change in level, and the seasonal slot from the leftover. The forecast adds (or multiplies) the right seasonal slot onto the projected level.",
      "If seasonality is missing, the seasonal component will try to eat noise. If the period is wrong, the profile will smear across the true cycle.",
    ],
  },
  "/ml/supervised/simple-linear-regression": {
    important: [
      "The whole model is two numbers: intercept (height at x = 0) and slope (how much y moves when x moves one unit).",
      "Least squares picks the line that minimizes the sum of squared vertical leftovers. One far outlier can yank the whole tilt.",
      "A healthy residual plot looks like random spray. A banana, funnel, or leftover trend means the straight line is unfinished homework.",
      "R² is “how much of the variance the line explained,” not a proof that x causes y.",
    ],
    theory: [
      "ŷ = β₀ + β₁x + ε. Ordinary least squares solves for β₀, β₁ so Σ(yᵢ − ŷᵢ)² is smallest. In the simple case the slope is Cov(x, y) / Var(x).",
      "The residual eᵢ = yᵢ − ŷᵢ is the vertical leftover. Patterned residuals ask for a curve, another feature, or a different loss.",
    ],
    formula: "ŷ = β₀ + β₁x + ε",
    parameters: [
      "Slope β₁ — change in ŷ when x increases by 1",
      "Intercept β₀ — predicted y when x is 0",
    ],
    miniExample: "Hours studied vs exam score: a slope of 8 means one extra hour is worth about 8 points on the fitted line.",
  },
  "/ml/supervised/multiple-linear-regression": {
    important: [
      "Several numeric clues share one intercept. Each coefficient is a partial effect: change in ŷ when that feature moves 1 unit and the others stay put.",
      "Two features can be plotted as a plane. Three or more live in coefficient space — do not pretend a 3D picture shows every axis.",
      "Collinear features steal credit from each other. The fit may still predict well while the story of “which variable matters” falls apart.",
    ],
    theory: [
      "ŷ = β₀ + β₁x₁ + β₂x₂ + … + βₚxₚ. OLS still minimizes squared residuals, now in a higher-dimensional hyperplane.",
    ],
    formula: "ŷ = β₀ + β₁x₁ + β₂x₂ + ⋯ + βₚxₚ",
    parameters: ["Included features", "Train/test split"],
    miniExample: "House price from size and rooms: β_size is the extra dollars per square foot holding rooms fixed.",
  },
  "/ml/supervised/polynomial-regression": {
    important: [
      "Same linear engine, extra powers of x: 1, x, x², …, xᵈ. Degree 1 is a line; high degree can wiggle through every point.",
      "Watch train vs validation error as degree rises. A falling train curve with a rising validation curve is overfitting.",
    ],
    theory: [
      "ŷ = β₀ + β₁x + β₂x² + … + β_d xᵈ. The model is still linear in the coefficients, nonlinear in x.",
    ],
    formula: "ŷ = β₀ + β₁x + β₂x² + ⋯ + β_d xᵈ",
    parameters: ["Degree d", "Optional ridge α", "Noise in the sample"],
    miniExample: "A gentle U-shape needs degree 2. Degree 9 will chase noise and look brilliant on the training dots.",
  },
  "/ml/supervised/ridge-regression": {
    important: [
      "Ridge adds λ Σβ² to squared error. Coefficients shrink toward zero but almost never land exactly on zero.",
      "Larger λ is a stronger leash. Correlated features share the blame more calmly than ordinary least squares.",
    ],
    theory: [
      "Minimize ‖y − Xβ‖² + λ ‖β‖² (usually without shrinking the intercept). This is L2 regularization, not feature selection.",
    ],
    formula: "L = Σ(yᵢ − ŷᵢ)² + λ Σ βⱼ²",
    parameters: ["λ / alpha — L2 penalty strength"],
    miniExample: "Two almost-duplicate predictors: OLS fights over huge opposite weights; Ridge splits a modest weight between them.",
  },
  "/ml/supervised/lasso-regression": {
    important: [
      "Lasso uses λ Σ|β|. Weak coefficients can hit exactly zero — that is feature selection, unlike Ridge.",
      "Among a cluster of correlated clues, Lasso often keeps one and drops the rest. Elastic Net is gentler with groups.",
    ],
    theory: [
      "Minimize ‖y − Xβ‖² + λ ‖β‖₁. The L1 diamond geometry produces sparse solutions.",
    ],
    formula: "L = Σ(yᵢ − ŷᵢ)² + λ Σ |βⱼ|",
    parameters: ["λ / alpha — L1 penalty; larger λ → more zeros"],
    miniExample: "Ten noisy sensors, two real signals: raise λ and watch unused bars collapse to the axis.",
  },
  "/ml/supervised/elastic-net-regression": {
    important: [
      "Elastic Net mixes L1 sparsity with L2 grouping. The mixing ratio is the personality; λ is the overall volume.",
    ],
    theory: [
      "L = squared error + λ [ ρ Σ|β| + ((1−ρ)/2) Σβ² ]. ρ = 1 is Lasso; ρ = 0 is Ridge.",
    ],
    formula: "L = Σ(y − ŷ)² + λ (ρ‖β‖₁ + ((1−ρ)/2)‖β‖²)",
    parameters: ["λ / alpha", "l1_ratio ρ"],
    miniExample: "A bundle of related lab tests: Ridge keeps them all small; Lasso keeps one; Elastic Net keeps a small team.",
  },
  "/ml/supervised/decision-tree-regression": {
    important: [
      "The tree carves the x-axis into intervals and predicts the mean y of the points that land in each leaf.",
      "Deeper trees fit jagged steps. Pruning or min-samples stops a staircase from memorizing noise.",
    ],
    theory: [
      "Each split picks a threshold that most reduces target variance (MSE). A leaf’s prediction is the average of its samples.",
    ],
    formula: "split = argmin MSE_left + MSE_right;  ŷ_leaf = mean(y in leaf)",
    parameters: ["Max depth", "Min samples per leaf", "Cost-complexity α"],
    miniExample: "Temperature vs demand: one split at 18°C gives a low-heat mean and a high-heat mean — a two-step staircase.",
  },
  "/ml/supervised/random-forest-regression": {
    important: [
      "Many trees vote by averaging. Each tree sees a bootstrap sample and a random feature subset, so they disagree usefully.",
      "The forest is not boosting: trees are grown in parallel, not as residual correctors.",
    ],
    theory: [
      "ŷ = (1/T) Σ tree_t(x). Variance falls as T grows; bias stays close to a typical tree’s bias.",
    ],
    formula: "ŷ(x) = average of T randomized trees",
    parameters: ["Number of trees", "Max depth", "Feature subset"],
    miniExample: "One tree jumps when a single outlier lands in a leaf. Fifty trees dilute that jump.",
  },
  "/ml/supervised/gradient-boosting-regression": {
    important: [
      "Boosting is sequential. Start with a constant, fit a small tree to the leftover residuals, add a fraction of that tree, repeat.",
      "Learning rate ν is the step size. Many tiny steps usually beat a few aggressive ones.",
    ],
    theory: [
      "F₀ = mean(y). Then F_m = F_{m−1} + ν h_m, where h_m fits the current residuals. This is not a random forest.",
    ],
    formula: "ŷ = F₀ + Σ_m ν h_m(x)",
    parameters: ["Number of estimators", "Learning rate ν", "Tree depth"],
    miniExample: "A flat mean misses a bump. Tree 1 learns the bump in the residuals; tree 2 cleans what tree 1 left behind.",
  },
  "/ml/supervised/support-vector-regression": {
    important: [
      "SVR cares only about points outside an ε-wide tube around the fit. Inside the tube, error is ignored.",
      "Support vectors sit on or beyond the tube. C trades a wider/softer tube against a more complex curve. Kernel chooses the shape family.",
    ],
    theory: [
      "Minimize ½‖w‖² + C Σ(ξ + ξ*). Constraints: |y − f(x)| ≤ ε + slack. Linear, polynomial, and RBF kernels are the shapes this lab supports.",
    ],
    formula: "|y − f(x)| ≤ ε  (no loss inside the tube)",
    parameters: ["ε tube width", "C", "Kernel (linear / poly / RBF)", "γ or degree when the kernel needs them"],
    miniExample: "A noisy sine: widen ε and more points go “free”; shrink ε and the tube hugs wiggles, recruiting more support vectors.",
  },
  "/ml/supervised/logistic-regression": {
    important: [
      "A linear score becomes a probability through the sigmoid. The decision is a threshold on that probability, not a second training run.",
      "The boundary is linear in the features you gave it. XOR needs extra features or a different model.",
    ],
    theory: [
      "P(y=1|x) = σ(w·x + b) with σ(z) = 1/(1+e^{−z}). Train by minimizing log loss. Threshold τ turns p into a class.",
    ],
    formula: "P(y=1|x) = 1 / (1 + e^{−(w·x+b)})",
    parameters: ["Threshold τ", "L2 strength", "Feature used in the 1D view"],
    miniExample: "Exam score → admit: p = 0.73 at 72 points. Raise τ to 0.8 and that student flips to “reject” without refitting w.",
  },
  "/ml/supervised/multinomial-logistic-regression": {
    important: [
      "One model, K class scores (logits). Softmax turns them into probabilities that sum to 1. This is joint multiclass training, not a pile of unrelated binaries — unless you explicitly pick one-vs-rest.",
    ],
    theory: [
      "score_k = w_k·x + b_k. P(y=k) = exp(score_k) / Σ_j exp(score_j). The argmax class is the painted region.",
    ],
    formula: "P(y=k|x) = softmax(W x)_k",
    parameters: ["L2 / C", "Which two features to draw"],
    miniExample: "Iris petals: three overlapping blobs. Softmax paints three territories whose probabilities at any point add to 100%.",
  },
  "/ml/supervised/knn-classification": {
    important: [
      "KNN does not train a formula. At predict time it looks up the K nearest labeled examples and lets them vote.",
      "K is the entire personality: K = 1 is nervous and jagged; large K is calmer and biased toward the majority class.",
      "Distance is the assumption. Unscaled features let one tall column own “near.” Scale before you measure.",
      "The model is the training set. Delete a point and the painted map can change. That is honesty, not instability for its own sake.",
    ],
    formula: "ŷ = majority vote of the K nearest neighbors",
    parameters: ["K", "Distance (Euclidean / Manhattan / Minkowski if enabled)", "Vote weights"],
    miniExample: "Drop a query in a blue neighborhood with K = 5. Four blue, one pink → blue. Move the query and the neighbor list updates live.",
  },
  "/ml/supervised/naive-bayes": {
    important: [
      "Assume features are independent given the class. That “naive” shortcut still works surprisingly often.",
      "This page’s live model is Gaussian Naive Bayes: each class has a mean and variance per feature. Priors × likelihoods → posterior.",
      "Do not mix the Gaussian density formula with a multinomial count table unless you switch model type.",
    ],
    theory: [
      "P(class|x) ∝ P(class) Π_j P(x_j | class). For Gaussian NB, P(x_j | class) is a normal density with that class’s mean and variance.",
    ],
    formula: "posterior ∝ prior × Π likelihood_j   (Gaussian NB)",
    parameters: ["Prior mode (empirical vs uniform)", "Variance smoothing"],
    miniExample: "A petal length of 5.1 is likelier under versicolor’s bell than setosa’s. Multiply by the class prior to rank posteriors.",
  },
  "/ml/supervised/decision-tree-classification": {
    important: [
      "Each split asks one yes/no question on one feature. Impurity (Gini or entropy) falls when child nodes get purer class mixes.",
      "Play animates those splits in order. Pruning with cost-complexity α collapses weak branches into majority leaves — it changes the model, not just the drawing.",
    ],
    theory: [
      "CART searches thresholds that maximize impurity reduction. Leaves predict the majority class. Cost-complexity pruning removes splits whose gain is below α.",
    ],
    formula: "gain = I(parent) − (n_L/n) I(left) − (n_R/n) I(right)",
    parameters: ["Max depth", "Min samples split / leaf", "Criterion (gini or entropy)", "Cost-complexity α"],
    miniExample: "Petal length ≤ 2.45 cm isolates setosa. Deeper splits carve versicolor from virginica. Raise α and those extra twigs collapse.",
  },
  "/ml/supervised/random-forest-classification": {
    important: [
      "Many trees, each on a bootstrap sample and a random feature subset. The forest’s class is the majority of tree votes.",
      "You do not need to stare at hundreds of full trees — a handful plus the vote tally tells the ensemble story.",
    ],
    theory: [
      "Tree t sees in-bag rows. Out-of-bag rows are a built-in check. Final ŷ = majority{ h_t(x) }.",
    ],
    formula: "ŷ = majority vote of T trees",
    parameters: ["Number of trees", "Max depth", "Feature subset / seed"],
    miniExample: "A query gets 7 setosa votes and 3 versicolor votes → setosa. Changing one tree rarely flips a large forest.",
  },
  "/ml/supervised/svm-classification": {
    important: [
      "SVM draws the fattest street between classes. The sidewalks are the margins; points on them are support vectors.",
      "C is the soft-margin budget: small C allows more mistakes for a wider street; large C hugs the data. Kernels bend the street without you drawing extra axes by hand.",
    ],
    theory: [
      "Hard margin: maximize 2/‖w‖ with y(w·x+b) ≥ 1. Soft margin adds slack punished by C. Linear, RBF, and polynomial kernels are offered only where implemented.",
    ],
    formula: "f(x) = w·x + b   (or K(x, x_i) in kernel space)",
    parameters: ["Kernel", "C", "γ for RBF", "Degree for polynomial"],
    miniExample: "Two blobs: raise C and the margin pinches around a stray point. Switch to RBF on moons so the street can curve.",
  },
  "/ml/supervised/gradient-boosting-classification": {
    important: [
      "Start with a base probability, then each tree fits the leftover error in log-odds. Later trees correct earlier ones — sequential, not a forest average.",
      "Unlike AdaBoost, points are not reweighted by a discrete α. Gradient boosting follows the gradient of log loss (or a similar loss).",
    ],
    theory: [
      "F₀ is the log-odds of the base rate. Each stage adds ν h_m(x) fitted to pseudo-residuals. σ(F) is the class probability.",
    ],
    formula: "P(y=1) = σ( F₀ + Σ ν h_m(x) )",
    parameters: ["Estimators", "Learning rate", "Tree depth"],
    miniExample: "A stubborn moon arm stays wrong after tree 1. Tree 2 is grown on that residual and pulls the probability across 0.5.",
  },
  "/ml/supervised/adaboost-classification": {
    important: [
      "Misclassified points gain weight. The next stump is forced to care about them. Each stump gets a vote weight α from its weighted error.",
      "The final call is a weighted vote of stumps, not a single boundary and not residual-fitting like gradient boosting.",
    ],
    theory: [
      "ε_m = weighted error. α_m = ½ ln((1−ε_m)/ε_m). Update w_i ← w_i exp(α_m) when stump m is wrong, then renormalize.",
    ],
    formula: "H(x) = sign( Σ_m α_m h_m(x) )",
    parameters: ["Number of rounds", "Stump depth (usually 1)"],
    miniExample: "Round 1 misses a red clump. Those points swell. Round 2’s stump aims at them. Final sign(α₁h₁+α₂h₂+…) is the ensemble.",
  },
  "/ml/deep-learning/perceptron": {
    important: [
      "A weighted sum plus bias hits a step (or similar) activation. If the prediction is wrong, nudge weights toward the missed point.",
      "Linearly separable clouds converge. XOR does not — the update rule is honest, not broken.",
    ],
    theory: [
      "z = w·x + b. ŷ = 1 if z ≥ θ else 0. Update: w ← w + η (y − ŷ) x,  b ← b + η (y − ŷ).",
    ],
    formula: "ŷ = 1 if (w·x + b) ≥ θ else 0",
    parameters: ["Weights w", "Bias b", "Threshold θ", "Learning rate η"],
    miniExample: "A class-1 point on the wrong side of the line: y−ŷ = +1, so the line steps toward that point.",
  },
  "/ml/clustering/k-means": {
    important: [
      "You promise K groups. K-Means will find that many even if the picture has 2 or 20 real blobs.",
      "A centroid is an average address, not necessarily a real data point. Outliers drag that address.",
      "It loves compact, similarly sized blobs. Moons, rings, and spaghetti need density or spectral methods.",
      "Scale features first. Euclidean “nearest” on mixed units is already lying.",
    ],
  },
  "/ml/clustering/k-medoids": {
    important: [
      "A medoid is an actual observation, not an average floating between points. The cluster center is one of the rows you already have.",
      "That makes K-Medoids sturdier against outliers than K-Means: a far-away point cannot pull the center off the data.",
      "You still pick K. Swap search is slower than averaging centroids. Distance can be Euclidean, Manhattan, or Chebyshev here.",
    ],
    theory: [
      "Initialize K medoids. Assign every point to the nearest medoid. Try swapping a medoid with a non-medoid if total dissimilarity drops.",
    ],
    formula: "cost = Σ_i d(x_i, m_{c(i)})  with  m_c ∈ {x_1,…,x_n}",
    parameters: ["k (cluster count)", "distance metric", "initialization (random or k-medoids++)"],
    miniExample: "Three shop locations among customer dots: the medoid is a real customer address, never a GPS average in a lake.",
  },
  "/ml/clustering/mean-shift": {
    important: [
      "Mean Shift does not take K. It climbs the density. Bandwidth is the neighborhood radius used to estimate that density.",
      "Small bandwidth: many local modes. Large bandwidth: fewer broader peaks. Cluster count is discovered, not typed in.",
      "Each point (or a candidate) repeatedly shifts toward the kernel-weighted mean of its neighbors until it sits at a mode.",
    ],
    theory: [
      "x ← Σ_i K(‖x−x_i‖/h) x_i / Σ_i K(‖x−x_i‖/h). Nearby points that converge to the same mode share a cluster.",
    ],
    formula: "m(x) = (Σ K_h(x−x_i) x_i) / (Σ K_h(x−x_i))",
    parameters: ["bandwidth h", "kernel (flat / Epanechnikov)", "max iterations", "tolerance"],
    miniExample: "A tight blob with h too large merges with its neighbor. Shrink h and the two peaks split again.",
  },
  "/ml/clustering/spectral-clustering": {
    important: [
      "Spectral clustering groups by graph connectivity, not by Euclidean ball shape. Two moons can be two clusters even though they curve.",
      "Pipeline: points → similarity graph → affinity matrix → Laplacian → eigenvectors → ordinary clustering in that embedding.",
      "Gamma/σ and neighbor count decide which edges exist. Too many edges glue everything; too few shatter the graph.",
    ],
    theory: [
      "Build A (affinity). Degree D. Laplacian L = D − A (also a normalized form). The first k eigenvectors of the (normalized) affinity/Laplacian are coordinates; cluster those rows.",
    ],
    formula: "L = D − A, then cluster rows of the leading eigenvectors",
    parameters: ["k clusters", "σ / gamma (RBF width)", "nearest-neighbor count", "kernel / metric"],
    miniExample: "Two interlocking moons: Euclidean K-Means cuts the crescents. The graph follows the arms, so the embedding separates them.",
  },
  "/ml/clustering/optics": {
    important: [
      "OPTICS orders points by density reachability. It is not DBSCAN with a new name: the plot of reachability vs processing order is the lesson.",
      "Valleys in the reachability plot are clusters. High bars are gaps or noise. Core distance is how far you must reach to gather minPts neighbors.",
      "A later ε cut can extract DBSCAN-like labels from the same ordering, but the ordering itself is the model of density structure.",
    ],
    theory: [
      "Process points so each next point is the closest density-reachable candidate. reachability = max(core-dist of predecessor, dist to it).",
    ],
    formula: "reach(p,o) = max( core(o), dist(o,p) )",
    parameters: ["minPts", "max ε / neighborhood cap", "extract ε (optional cut)"],
    miniExample: "A dense island, a gap, another island: the plot dips, spikes, then dips again. Those two valleys are the two clusters.",
  },
  "/ml/dimensionality-reduction/kernel-pca": {
    important: [
      "Kernel PCA is not ordinary PCA with a curved overlay. A kernel stands in for an inner product in a (possibly infinite) feature map ϕ.",
      "We never draw ϕ itself. The Gram matrix of pairwise kernel similarities is what we eigen-decompose after centering.",
      "Gamma (RBF) controls locality. Degree (polynomial) controls how wild the implicit map is. Linear kernel is the closest cousin of PCA.",
    ],
    theory: [
      "K_ij = κ(x_i, x_j). Center K. Eigenvectors of the centered kernel give coordinates in the implicit feature space; project to the top components.",
    ],
    formula: "K̃ = (I − 1/n) K (I − 1/n), then K̃ α = λ α",
    parameters: ["kernel", "gamma", "degree / coef0", "n_components"],
    miniExample: "Concentric rings are not linearly separable in 2D. An RBF kernel can lift them so PC1/PC2 pull the rings apart. Schematic ϕ is labeled as such.",
  },
  "/ml/dimensionality-reduction/umap-concept": {
    important: [
      "UMAP builds a fuzzy nearest-neighbor graph in high-D, then lays a similar graph down in 2D. It tries to keep local neighborhoods, not axis units.",
      "n_neighbors: small = local islands; large = more global skeleton. min_dist: packing tightness in the picture.",
      "The embedding is stochastic unless you fix the seed. This lab uses a UMAP-like optimizer, not the official umap-learn transform API.",
    ],
    theory: [
      "Local fuzzy simplicial set from k-NN + distances. Optimize 2D points so attractive/repulsive forces match those strengths (here: a teaching approximation with a seed).",
    ],
    formula: "high-D fuzzy graph → low-D layout (seeded, educational optimizer)",
    parameters: ["n_neighbors", "min_dist", "metric", "random_state / seed", "spread"],
    miniExample: "Digits: small n_neighbors keeps each glyph island. Raise it and islands stitch into a looser manifold.",
  },
  "/ml/dimensionality-reduction/lda": {
    important: [
      "This page is Linear Discriminant Analysis (supervised projection), not Latent Dirichlet Allocation (topic model).",
      "LDA uses class labels. It aims at directions that stretch between-class scatter relative to within-class scatter. PCA ignores labels and chases variance.",
      "You get at most C−1 axes. Two classes → one line. Overlapping Gaussians still overlap after projection.",
    ],
    theory: [
      "S_W within-class scatter, S_B between-class. Solve S_W^{-1} S_B w = λ w (with shrinkage if S_W is ill-conditioned). Project x onto those w.",
    ],
    formula: "argmax_w (wᵀ S_B w) / (wᵀ S_W w)",
    parameters: ["requested components (capped at C−1)", "regularization / shrinkage", "priors", "standardize", "centering"],
    miniExample: "Iris: PCA’s first axis may mix species if that direction is merely long. LDA’s first axis is the one that gossip between labels cares about.",
  },
  "/ml/deep-learning/transformer-attention": {
    important: [
      "A Transformer block is a pipeline: tokens → embeddings → positional information → attention → feed-forward → residual + norm → output vectors.",
      "This lab computes educational scaled-dot-product attention on hashed 8-D embeddings. It is not a pretrained model’s weights.",
      "The heatmap is query tokens (rows) × key tokens (columns). Click a cell to see that pair’s score and softmax weight.",
    ],
    theory: [
      "Attention(Q,K,V) = softmax(QKᵀ / √d_k) V. Optional causal mask zeros future keys before softmax.",
    ],
    formula: "Attention(Q, K, V) = softmax(QKᵀ / √d_k) V",
    parameters: ["sequence", "temperature τ", "causal mask", "layer/head (hash seeds, not trained heads)"],
    miniExample: "Query “sat”: higher weight on “cat” than on “moon” if those hashed keys align more — a teaching similarity, not linguistic proof.",
  },
  "/ml/deep-learning/multi-head-attention": {
    important: [
      "Several heads run the same attention recipe on different projections of Q, K, V, then concatenate and project back to d_model.",
      "Heads can learn different relations in a trained model. Here each head is an independent hashed projection — labeled conceptual, not syntax-vs-semantics from BERT.",
      "Inspect one head at a time. A wall of 12 tiny matrices is unreadable on purpose; we cap the grid.",
    ],
    theory: [
      "head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V). MultiHead = Concat(heads) W^O.",
    ],
    formula: "MultiHead(Q,K,V) = Concat(head_1,…,head_h) W^O",
    parameters: ["number of heads h", "d_model (must divide h)", "causal mask", "dropout (educational noise)"],
    miniExample: "Switch Head 1 vs Head 2 on “The cat sat on the mat”: the two heatmaps differ because their projection matrices differ, not because we claimed “syntax” vs “anaphora.”",
  },
  "/ml/deep-learning/transfer-learning": {
    important: [
      "Feature extraction: freeze the pretrained extractor, train a new head. Fine-tuning: unfreeze some (or all) extractor scales and keep training.",
      "This lab is a synthetic 12-D extractor plus a linear head in the browser. It is not ImageNet, not ResNet, not reported SOTA accuracy.",
      "Train-from-scratch vs freeze-head vs unfreeze-blocks is a comparison of data hunger and trainable parameter count — not invented ImageNet numbers.",
    ],
    theory: [
      "Frozen features z = f_θ*(x). Head logits = W z (+ optional trainable feature scales when blocks > 0). Early stopping watches validation loss.",
    ],
    formula: "ŷ = softmax(W z ⊙ s + b)  with s frozen or trainable",
    parameters: ["trainable blocks (0 = head only)", "learning rate", "epochs", "early stopping / patience"],
    miniExample: "Blocks = 0: only W,b move (feature extraction). Blocks > 0: feature scales s also move (a tiny fine-tune).",
  },
  "/ml/deep-learning/cnn": {
    important: [
      "A CNN does not see a photo as one long list first. Small stamps (kernels) slide across the picture looking for local patterns like edges.",
      "Early layers find simple marks. Deeper layers mix those marks into shapes. The last stage unrolls the maps and guesses a class.",
      "Convolution shares the same stamp everywhere, so a vertical line in the corner uses the same detector as one in the center.",
      "Pooling shrinks the map and keeps the strongest response. That buys some shift tolerance and fewer weights.",
    ],
  },
  "/ml/dimensionality-reduction/tsne": {
    important: [
      "t-SNE is a visualization of neighborhoods, not a feature factory you should train a classifier on blindly.",
      "Nearby points in the picture were nearby (or chosen as neighbors) in high dimension. Far-apart clusters in the picture are not a proven hierarchy.",
      "Perplexity is “how many neighbors count as local.” Cluster sizes and gaps change when you change it — that is expected.",
      "You cannot read axis units. There is no “PC1 = size.” Distances between far islands are not trustworthy.",
    ],
  },
};

const categoryImportant: Record<string, (label: string) => string[]> = {
  "Supervised - Regression": (label) => [
    `${label} predicts a number. Judge it with residuals and a held-out error (RMSE/MAE), not only a pretty overlay.`,
    "Change one control at a time. If train error falls and test error rises, you are memorizing.",
  ],
  "Supervised - Classification": (label) => [
    `${label} assigns a category (or a probability of one). Accuracy can hide a rare class you care about.`,
    "Ask which mistake is expensive before you pick a threshold of 0.5 out of habit.",
  ],
  Clustering: (label) => [
    `${label} invents groups without labels. A tidy coloring is not proof the groups are useful.`,
    "Scale, then cluster. Distance-based methods inherit whatever units you left in the table.",
  ],
  "Dimensionality Reduction": (label) => [
    `${label} compresses or re-embeds features. Always ask what was kept and what was thrown away.`,
    "A 2D picture is a view, not the data. Downstream models may still need the original columns.",
  ],
  "Deep Learning": (label) => [
    `${label} learns layered representations. More layers and epochs can fit noise as easily as signal.`,
    "Watch validation loss, not only the training curve. Normalize inputs before celebrating a low loss.",
  ],
  "Time Series": (label) => [
    `${label} treats order as information. Shuffle the timestamps and you have destroyed the exam.`,
    "Split by time (last weeks as test), never by a random row lottery, or you leak the future.",
  ],
  Evaluation: (label) => [
    `${label} is a judgment tool. A metric that ignores the real cost of a miss will reward the wrong model.`,
  ],
  Preprocessing: (label) => [
    `${label} must be fit on training data only, then applied to validation and test with the same rule.`,
    "A transform that peeks at the test set is leakage wearing a cleaning costume.",
  ],
  NLP: (label) => [
    `${label} turns text into numbers. Vocabulary, casing, and rare words change the story before the model even starts.`,
  ],
  "Reinforcement Learning": (label) => [
    `${label} learns from reward over time. A poorly designed reward teaches loopholes, not the job you meant.`,
  ],
};

const LEARN_TERMS: Record<string, Array<{ slug: string; label: string }>> = {
  '/ml/supervised/decision-tree-classification': [
    { slug: 'gini-impurity', label: 'Gini impurity' },
    { slug: 'entropy', label: 'Entropy' },
    { slug: 'information-gain', label: 'Information gain' },
    { slug: 'pruning', label: 'Pruning' },
  ],
  '/ml/supervised/logistic-regression': [
    { slug: 'decision-boundary', label: 'Decision boundary' },
    { slug: 'sigmoid', label: 'Sigmoid' },
    { slug: 'gradient-descent', label: 'Gradient descent' },
  ],
  '/ml/supervised/svm-classification': [
    { slug: 'support-vector', label: 'Support vector' },
    { slug: 'margin', label: 'Margin' },
    { slug: 'kernel-trick', label: 'Kernel trick' },
  ],
  '/ml/supervised/knn-classification': [
    { slug: 'euclidean-distance', label: 'Euclidean distance' },
    { slug: 'decision-boundary', label: 'Decision boundary' },
  ],
  '/ml/supervised/random-forest-classification': [
    { slug: 'bagging', label: 'Bagging' },
    { slug: 'bootstrap', label: 'Bootstrap' },
    { slug: 'feature-importance', label: 'Feature importance' },
  ],
  '/ml/supervised/adaboost-classification': [
    { slug: 'boosting', label: 'Boosting' },
  ],
  '/ml/supervised/gradient-boosting-classification': [
    { slug: 'boosting', label: 'Boosting' },
    { slug: 'gradient-descent', label: 'Gradient descent' },
  ],
  '/ml/deep-learning/transformer-attention': [
    { slug: 'attention', label: 'Attention' },
    { slug: 'self-attention', label: 'Self-attention' },
    { slug: 'query-key-value', label: 'Query, key, value' },
    { slug: 'positional-encoding', label: 'Positional encoding' },
  ],
  '/ml/deep-learning/multi-head-attention': [
    { slug: 'attention', label: 'Attention' },
    { slug: 'self-attention', label: 'Self-attention' },
    { slug: 'query-key-value', label: 'Q / K / V' },
  ],
  '/ml/deep-learning/transfer-learning': [
    { slug: 'transfer-learning', label: 'Transfer learning' },
    { slug: 'fine-tuning', label: 'Fine-tuning' },
  ],
  '/ml/deep-learning/cnn': [
    { slug: 'convolution', label: 'Convolution' },
    { slug: 'filter-kernel', label: 'Filter / kernel' },
    { slug: 'pooling', label: 'Pooling' },
  ],
  '/ml/deep-learning/lstm': [
    { slug: 'lstm', label: 'LSTM' },
    { slug: 'rnn', label: 'RNN' },
    { slug: 'vanishing-exploding', label: 'Vanishing gradient' },
  ],
  '/ml/deep-learning/rnn': [
    { slug: 'rnn', label: 'RNN' },
    { slug: 'vanishing-exploding', label: 'Vanishing gradient' },
  ],
  '/ml/evaluation/confusion-matrix': [
    { slug: 'confusion-matrix', label: 'Confusion matrix' },
    { slug: 'precision-recall', label: 'Precision / recall' },
    { slug: 'f1-score', label: 'F1 score' },
    { slug: 'accuracy', label: 'Accuracy' },
  ],
  '/ml/evaluation/roc-auc': [
    { slug: 'roc-curve', label: 'ROC curve' },
    { slug: 'confusion-matrix', label: 'Confusion matrix' },
  ],
  '/ml/preprocessing/scaling-normalization': [
    { slug: 'feature-scaling', label: 'Feature scaling' },
    { slug: 'standardization', label: 'Standardization' },
    { slug: 'min-max-scaling', label: 'Min-max scaling' },
  ],
  '/ml/preprocessing/categorical-encoding': [
    { slug: 'one-hot', label: 'One-hot encoding' },
    { slug: 'label-encoding', label: 'Label encoding' },
  ],
  '/ml/dimensionality-reduction/kernel-pca': [
    { slug: 'kernel-trick', label: 'Kernel trick' },
  ],
};

export function getLearnPageContent(route: string): LearnPageContent {
  const item = getAlgorithmByRoute(route);
  const label = item?.label ?? "This method";
  const category = item?.category ?? "Machine Learning";
  const intro = item ? getAlgorithmIntroduction(item) : undefined;
  const lesson = getLearningContent(route);
  const steps = getAlgorithmGuideSteps(route);
  const meta = algorithmSearchMeta[route];
  const extra = authored[route];

  const idea =
    steps[0]?.purpose ??
    intro?.summary ??
    meta?.description ??
    lesson.lessons[0]?.simpleExplanation ??
    `${label} turns data into a prediction, grouping, or view you can inspect.`;

  const story =
    lesson.lessons[0]?.story ??
    lesson.lessons[1]?.story ??
    `${label} is easier when you name the input, the output, and what a bad miss would cost.`;

  const fromGuides = steps
    .slice(1)
    .map((step) => step.purpose)
    .filter((text) => text.length > 24);

  const important = unique([
    ...(extra?.important ?? []),
    ...fromGuides,
    ...(categoryImportant[category]?.(label) ?? []),
    ...sentences(intro?.watchFor),
    meta?.description ? `${label}: ${meta.description}` : "",
  ]).slice(0, 8);

  const howItThinks = unique([
    ...stepsFromHow(lesson.lessons[2]?.simpleExplanation),
    ...steps.slice(0, 5).map((step) => `${step.title}: ${step.purpose}`),
  ]).slice(0, 6);

  const theory = unique([
    ...(extra?.theory ?? []),
    intro?.summary ?? "",
    lesson.lessons[1]?.simpleExplanation ?? "",
    lesson.lessons[3]?.simpleExplanation ?? "",
    lesson.lessons[3]?.realtimeExample ?? "",
  ]).slice(0, 5);

  const applications = unique([
    ...(lesson.lessons[4]?.realtimeApplications ?? []),
    ...(lesson.lessons[0]?.realtimeApplications ?? []),
  ]).slice(0, 8);

  return {
    label,
    category,
    idea,
    story,
    important,
    theory,
    howItThinks,
    formula: extra?.formula || lesson.formula,
    parameters: extra?.parameters ?? [],
    miniExample: extra?.miniExample ?? "",
    useWhen: intro?.useWhen ?? `Use ${label} when it matches the data shape and the decision you need.`,
    watchFor: intro?.watchFor ?? "Watch the controls, the chart, and a held-out metric together.",
    applications,
    mistakes: lesson.mistakes.slice(0, 5),
    terms: LEARN_TERMS[route] ?? [],
  };
}
