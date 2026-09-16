import { algorithmSearchMeta } from "./algorithmSearchMeta";
import { getAlgorithmIntroduction } from "./algorithmIntroductions";
import { getAlgorithmByRoute } from "./implementationStatus";
import { getLearningContent } from "./learningContent";
import type { GuideStep } from "./guideMode";

function step(
  id: string,
  title: string,
  purpose: string,
  does: string,
  teach: string,
  spot?: string,
): GuideStep {
  return { id, title, purpose, does, teach, spot };
}

const authoredGuides: Record<string, GuideStep[]> = {
  "/ml/supervised/gradient-boosting-regression": [
    step("gbr-idea", "The whole idea in one breath", "Start with the average, then add tiny trees that only fix what is still wrong.", "Look at Stage 0 (the mean), then Stage 1, then the final sum. Each card is one correction.", "Classroom script: “I guess the average rent. I was too low on big houses, so I plant a small tree that boosts those. I add only 10% of that tree so I do not over-correct. I repeat.” That is gradient boosting.", "gbr-stages"),
    step("gbr-residuals", "Residuals after each stage", "Show the leftovers shrinking. If they do not shrink, the new tree learned nothing useful.", "Read RMSE left to right. It should fall. If it rises, the learning rate or depth is fighting you.", "Call residuals “the homework the next tree has to do.” When the homework is almost empty, stop adding trees.", "gbr-residuals"),
    step("gbr-additive", "Additive build-up", "The final curve is the sum of the mean plus every scaled tree — not a replacement.", "Watch the colored lines stack toward the points. The last line is the model you would ship.", "Contrast with a single deep tree: boosting keeps each tree weak on purpose, then votes by addition.", "gbr-additive"),
    step("gbr-estimators", "Number of trees", "More trees can fit more leftover structure — and also more noise.", "Train with 4 trees, then 40. Compare train vs test RMSE.", "More trees + high learning rate = memorization. More trees + low learning rate = a slow, safer climb.", "gbr-estimators"),
    step("gbr-lr", "Learning rate ν", "ν is how much of each new tree you actually add. It is the volume knob on every correction.", "Set ν near 0.05 and add trees. Then try 0.8 with few trees. The first is usually the teaching default.", "Say “take a small sip of this tree.” Students remember ν faster than “shrinkage.”", "gbr-learning-rate"),
    step("gbr-depth", "Max depth", "Depth is how clever one weak learner is allowed to be. Shallow trees are the point of boosting.", "Keep depth at 2–3 while you learn the additive idea. Raise it only after residuals stop shrinking.", "A depth-1 tree is a stump: one split, one correction. That is the cleanest demo of “fix the leftovers.”", "gbr-depth"),
    step("gbr-data", "Pick a dataset with a story", "Numbers need a noun. Housing, energy demand, or a CSV the class cares about.", "Switch datasets and ask which feature a tree would split first.", "Before training, guess the important feature. Then open Feature Importance and score the guess.", "gbr-dataset"),
  ],

  "/ml/supervised/simple-linear-regression": [
    step("slr-idea", "The whole idea in one breath", "One input, one number out: draw the fairest straight line through the dots.", "Watch the line, then name slope as “how much y moves when x moves one unit.”", "Ask: “If temperature is the only clue, what is the fairest guess for cups sold?” The line is that guess.", "algo-idea"),
    step("slr-fit", "Least squares is the scoreboard", "The “best” line is the one with the smallest total squared leftover.", "Point at a residual: vertical gap from dot to line. Squaring punishes big misses more.", "Have someone stand at a point above the line and say “the model under-predicted me.”", "algo-visualize"),
    step("slr-slope", "Slope and intercept", "Intercept is the starting height. Slope is the tilt. Together they are the whole model.", "Move the cloud of points and watch slope flip sign when the relationship reverses.", "Zero the intercept story: “what would we predict if x were 0 — and does that number even make sense?”", "algo-params"),
    step("slr-data", "Pick a dataset with a story", "A line about lemonade sales is easier to defend than a line about anonymous x and y.", "Load a built-in set, then add one outlier and watch the tilt change.", "Outliers yank a least-squares line. That yank is the lesson, not a bug.", "algo-dataset"),
    step("slr-fail", "Where a straight line lies", "Curves, clusters, and festival days will not sit on one line.", "Look at residuals: random scatter is healthy; a banana shape means you need a curve.", "If residuals still have a pattern, the line is unfinished homework.", "algo-watch"),
  ],

  "/ml/supervised/multiple-linear-regression": [
    step("mlr-idea", "The whole idea in one breath", "Several clues share one numeric target. Each feature gets its own slope.", "Name two features out loud and guess which one should have the bigger coefficient.", "Classroom script: “Price is some of size, plus some of rooms, plus a starting value.”", "algo-idea"),
    step("mlr-coef", "Coefficients are votes", "A coefficient is “how much the target moves if this feature moves one unit, holding the others still.”", "Scale a feature and watch its coefficient shrink or grow. Units matter.", "Ask whether the sign matches the story. A negative rooms coefficient is a teaching moment.", "algo-visualize"),
    step("mlr-multi", "Collinearity", "When two features tell the same story, the model cannot decide who owns the credit.", "Add a near-copy of a feature and watch coefficients become unstable.", "Say “two friends talking at once.” The model hears noise, not two independent clues.", "algo-params"),
    step("mlr-data", "Pick columns with a story", "Choose a target, then keep only features that would be known at prediction time.", "Drop a leaking column if you see one. The metric should get more honest, not prettier.", "If a feature is the target in disguise, the R² is a lie.", "algo-dataset"),
    step("mlr-fail", "R² is not the whole exam", "A high train R² with wild residuals still fails.", "Read residual plots after the headline score.", "Ask which error is expensive: missing a cheap house or missing an expensive one.", "algo-metrics"),
  ],

  "/ml/supervised/polynomial-regression": [
    step("poly-idea", "The whole idea in one breath", "Keep linear regression, but invent curved features: x², x³, so a line in that new space looks bent in x.", "Raise degree from 1 to 3 and watch the curve start to follow the bend.", "Say “we did not invent a new algorithm. We invented new columns.”", "algo-idea"),
    step("poly-degree", "Degree is the flexibility knob", "Degree 1 is a line. Degree 2 is a bowl. High degree can thread every point — and every noise spike.", "Fit degree 2, then 8. Compare train vs test error.", "When the curve starts chasing individual dots, you are memorizing, not learning.", "algo-params"),
    step("poly-viz", "The curve is the lesson", "The picture should hug the trend, not the jitter.", "Watch the ends of the x range. Polynomials go wild outside the data.", "Extrapolation is where polynomial models embarrass themselves. Point at the wings.", "algo-visualize"),
    step("poly-data", "A curved story", "Use a dataset that is actually bent: growth, saturation, a U-shape.", "If the cloud is already a line, raising degree teaches overfitting, not curvature.", "Ask first: “Do we even need a curve?”", "algo-dataset"),
    step("poly-fail", "More wiggle is not more wisdom", "High degree plus few points is a roller coaster.", "Leave a few points out and see whether the wild curve still hits them.", "Regularized linear models (Ridge/Lasso) are the grown-up version of this idea.", "algo-watch"),
  ],

  "/ml/supervised/ridge-regression": [
    step("ridge-idea", "The whole idea in one breath", "Ordinary least squares plus a tax on large weights. The tax is λ times the sum of squared coefficients.", "Train OLS mentally, then raise λ and watch coefficients shrink toward zero — but not to exactly zero.", "Say “Ridge does not fire features. It turns their volume down.”", "algo-idea"),
    step("ridge-lambda", "λ is the shrink knob", "λ = 0 is ordinary regression. Large λ makes a timid model that barely uses the features.", "Sweep λ and plot coefficient paths. They should slide toward zero together.", "Ask what we are afraid of: wild weights from correlated features. That fear is why Ridge exists.", "algo-params"),
    step("ridge-multi", "This is a collinearity medicine", "When features move together, OLS coefficients fight. Ridge shares the credit and calms the fight.", "Duplicate a feature and compare OLS vs Ridge stability.", "Stable signs across a λ sweep beat a slightly prettier train R².", "algo-visualize"),
    step("ridge-data", "Scale first", "Ridge’s tax treats a 0–1 feature and a 0–10,000 feature as different crimes unless you scale.", "Standardize, then tune λ. Otherwise you are penalizing units, not importance.", "Write “scale, then shrink” on the board.", "algo-dataset"),
    step("ridge-fail", "Ridge will not pick features for you", "Nothing goes exactly to zero. If you need a sparse story, open Lasso.", "Compare Ridge and Lasso on the same data. Name one thing each does better.", "Ridge is a seatbelt. Lasso is a filter.", "algo-watch"),
  ],

  "/ml/supervised/lasso-regression": [
    step("lasso-idea", "The whole idea in one breath", "A tax on the absolute size of weights. That tax can drive a coefficient all the way to zero, which is feature selection.", "Raise λ and watch weak features disappear from the equation.", "Say “Lasso is allowed to fire a feature.” That sentence is the whole difference from Ridge.", "algo-idea"),
    step("lasso-lambda", "λ is the sparsity knob", "Small λ keeps almost everyone. Large λ keeps a short, bold equation.", "Sweep λ and count how many coefficients are still alive.", "Ask the class to guess which feature dies first. Then check the path plot.", "algo-params"),
    step("lasso-path", "The path is the lesson", "Features enter and leave as λ changes. That path is the story of who mattered.", "Read the surviving features out loud as a sentence: “price ≈ size + location.”", "A short sentence you can defend beats a long one you cannot.", "algo-visualize"),
    step("lasso-data", "Scale, then select", "Without scaling, Lasso fires features because of their units, not their signal.", "Standardize first. Then let λ choose.", "If two features are twins, Lasso often keeps one and fires the other. That is a feature, not a bug.", "algo-dataset"),
    step("lasso-fail", "Zero is not proof of uselessness", "A dropped feature might be useful in another sample. Selection is unstable when features are twins.", "Rerun with a different split and see who survives.", "Elastic Net is the compromise when Lasso’s on/off switch feels too harsh.", "algo-watch"),
  ],

  "/ml/supervised/elastic-net-regression": [
    step("en-idea", "The whole idea in one breath", "Blend Ridge’s shrink and Lasso’s zeros. You get a short list that still shares credit among twins.", "Move the L1/L2 mix and watch whether groups of related features survive together.", "Say “Ridge for peace, Lasso for a short list, Elastic Net for both.”", "algo-idea"),
    step("en-mix", "The mix knob", "More L1 → more zeros. More L2 → more sharing among correlated features.", "Keep λ fixed and change only the mix. That isolates the lesson.", "If related features keep dying as a group, you are too Lasso-like.", "algo-params"),
    step("en-path", "Who survives together", "Elastic Net likes to keep or drop a whole friend group, not one twin.", "Highlight two correlated columns and watch them live or die as a pair.", "This is the teaching contrast with pure Lasso.", "algo-visualize"),
    step("en-data", "Scale, then blend", "Same rule as Ridge and Lasso: comparable units, then a penalty.", "Use a wide table so sparsity is visible.", "A 3-feature dataset cannot teach Elastic Net. You need extras to fire.", "algo-dataset"),
    step("en-fail", "Two knobs, one experiment", "Changing λ and the mix at once hides the cause.", "One knob per run. Write both settings next to the metric.", "If you cannot explain the mix, you are not ready to ship the model.", "algo-watch"),
  ],

  "/ml/supervised/decision-tree-regression": [
    step("dtr-idea", "The whole idea in one breath", "Ask yes/no questions about features until each leaf has a simple number — usually the average of the points that landed there.", "Follow one row down the splits and say the prediction at the leaf.", "A tree is a flowchart. Boosting and forests are many flowcharts.", "algo-idea"),
    step("dtr-depth", "Depth is how nosy the tree is", "A stump (depth 1) is one cut. A deep tree can isolate single points.", "Fit depth 2, then 12. Watch train error fall and test error rise.", "When a leaf has one point, the tree memorized a name, not a rule.", "algo-params"),
    step("dtr-split", "Each split reduces leftover error", "The best question is the one that makes the two child groups more constant.", "Watch impurity or SSE drop after a split. If it barely drops, the question was weak.", "Have a learner propose a split before the algorithm reveals it.", "algo-visualize"),
    step("dtr-data", "Trees like stories, hate units", "Trees do not need scaled features, but they do need honest rows.", "Add an outlier and see which leaf it hijacks.", "One extreme house can own a whole leaf. That is why forests exist.", "algo-dataset"),
    step("dtr-fail", "Axis-aligned cuts", "A tree cuts on one feature at a time. Diagonal patterns need many cuts or a different model.", "If the truth is a diagonal line, the tree will look like stairs.", "Compare with a linear model on the same diagonal cloud.", "algo-watch"),
  ],

  "/ml/supervised/random-forest-regression": [
    step("rfr-idea", "The whole idea in one breath", "Grow many slightly different trees, then average their guesses so no single weird tree owns the answer.", "Train one tree, then a forest. The average should be smoother and less jumpy.", "Say “wisdom of the crowd, but the crowd is trees that were not allowed to see the same rows or the same features.”", "algo-idea"),
    step("rfr-bag", "Bootstrap + feature lottery", "Each tree gets a resampled bag of rows and a random subset of features at each split.", "Turn the feature-subset size down and watch trees disagree more — then the average often gets better.", "Disagreement is the point. Identical trees cannot cancel each other’s mistakes.", "algo-params"),
    step("rfr-imp", "Importance is a vote count", "A feature is important if splits on it kept reducing error across many trees.", "Guess the top feature, then open the importance bar.", "Importance is not causation. It is “this column was useful for these trees on this data.”", "algo-visualize"),
    step("rfr-trees", "More trees, calmer average", "The first 20 trees still jitter. By 100–300 the average usually settles.", "Add trees until the metric stops moving. That plateau is “enough.”", "Forests rarely overfit from more trees the way one deep tree does. They just get slower.", "algo-metrics"),
    step("rfr-fail", "A forest is not a story", "You cannot read 200 trees out loud. If you need a single flowchart, go back to one tree.", "Compare interpretability vs error with a single tree on the same set.", "Use the forest to win, then a shallow tree or importances to explain.", "algo-watch"),
  ],

  "/ml/supervised/support-vector-regression": [
    step("svr-idea", "The whole idea in one breath", "Draw a tube of width ε around the curve. Points inside the tube are “close enough” and cost nothing.", "Widen ε and watch more points fall inside the free zone.", "Say “only the rude points — the ones outside the tube — get to vote on the shape.” Those are the support vectors.", "algo-idea"),
    step("svr-eps", "ε is the ‘good enough’ knob", "Tiny ε means almost every point is a complaint. Huge ε means the model shrugs.", "Sweep ε and count support vectors. They should fall as the tube grows.", "A tube that swallows the whole cloud is a lazy model.", "algo-params"),
    step("svr-c", "C is how angry we are at outsiders", "Large C: fit the outsiders tightly. Small C: allow a wider, calmer tube.", "Raise C on a noisy set and watch the curve start chasing noise.", "C and ε argue with each other. Change one at a time.", "algo-params"),
    step("svr-kernel", "The kernel bends the tube", "A linear kernel is a straight tube. RBF lets the tube wiggle with the data.", "Switch linear → RBF and watch a bent cloud suddenly make sense.", "RBF plus a tiny length scale is just memorization in a fancy hat.", "algo-visualize"),
    step("svr-data", "Scale the features", "Distance kernels treat unscaled columns as different worlds.", "Standardize, then fit. Compare with raw units.", "If one column is in millions, RBF is already lying.", "algo-dataset"),
  ],

  "/ml/supervised/logistic-regression": [
    step("log-idea", "The whole idea in one breath", "Learn a linear score, then squash it with a sigmoid so the answer is a probability between 0 and 1.", "Watch the S-curve. Far left is “almost no.” Far right is “almost yes.” The middle is the argument.", "Say “this is linear regression wearing a probability costume.” Then show why squared error would be the wrong costume.", "algo-idea"),
    step("log-odds", "Log-odds are the linear part", "The model is linear in log-odds, not in probability. That is why a coefficient can be read as a change in odds.", "Move one feature and watch probability change fastest near 0.5, not at the extremes.", "The slope is steepest at the decision, lazy at the sure answers. That is the sigmoid’s personality.", "algo-visualize"),
    step("log-thresh", "0.5 is a habit, not a law", "The threshold is where you turn a probability into a yes.", "Move the threshold and watch precision and recall trade places.", "Ask which mistake is more expensive. That answer picks the threshold, not 0.5.", "algo-metrics"),
    step("log-reg", "Regularization keeps odds calm", "Without a penalty, a perfectly separated class wants infinite weights.", "Add a little L2 and watch coefficients settle.", "Infinite weights are a tantrum, not confidence.", "algo-params"),
    step("log-data", "Linear in features, not in reality", "If the truth is a circle, a linear log-odds wall cannot draw it.", "Try a linearly separable set, then a moon-shaped set.", "Feature engineering or a nonlinear model is the next lesson, not a bigger sigmoid.", "algo-dataset"),
  ],

  "/ml/supervised/multinomial-logistic-regression": [
    step("mlog-idea", "The whole idea in one breath", "One linear score per class, then softmax so the scores become a pile of probabilities that add to 1.", "Watch all class probabilities on one point. They should share 100%.", "Say “the classes are arguing, and softmax makes them share a single pie.”", "algo-idea"),
    step("mlog-soft", "Softmax is a competition", "Raising one class’s score steals probability from the others.", "Nudge a feature that favors class B and watch A and C shrink.", "This is why “probability of A” is never independent of B in this model.", "algo-visualize"),
    step("mlog-bound", "Several walls, not one", "Each class gets a region. The boundaries are where two scores tie.", "Look at a 3-class scatter and name the disputed border.", "A point on the border is the best teaching point in the room.", "algo-visualize"),
    step("mlog-data", "Need all the labels", "Softmax needs every class to show up enough times to learn a score.", "Check class counts before celebrating accuracy.", "A rare class will look “bad” if you only read overall accuracy.", "algo-dataset"),
    step("mlog-fail", "Linear scores still", "Moons, rings, and XOR will still confuse a linear softmax.", "If the picture is curved, this model is the baseline, not the hero.", "Compare with a tree or a small neural net on the same moons.", "algo-watch"),
  ],

  "/ml/supervised/knn-classification": [
    step("knn-idea", "The whole idea in one breath", "A new point borrows the labels of its nearest neighbors and lets them vote.", "Drag the query point and watch the highlighted neighbors change their minds.", "Say “KNN does not study. It keeps the textbook and looks up the nearest examples at test time.”", "algo-idea"),
    step("knn-k", "K is how many friends get a vote", "K = 1 is nervous and local. Large K is calmer and more majority-class.", "Sweep K and watch the boundary go from jagged to blob-like.", "Odd K avoids ties in two-class problems. That is a classroom gift.", "algo-params"),
    step("knn-dist", "Distance is the assumption", "Neighbors only exist in the space you measure. Unscaled features let one tall column own the distance.", "Toggle scaling or switch Euclidean/Manhattan and watch who is suddenly “near.”", "If income is in rupees and age is in years, Euclidean distance is already lying.", "algo-visualize"),
    step("knn-paint", "Paint the space", "The colored regions are “if a new point landed here, the neighbors would vote this.”", "Add a point of a new class and watch a pocket appear.", "KNN’s model is the training set. Delete a point and the map changes.", "algo-visualize"),
    step("knn-fail", "Slow, local, and allergic to junk features", "Every prediction walks the training set. Extra noisy columns scramble nearness.", "Add a random feature and watch accuracy sag.", "KNN is honest: it cannot ignore a bad ruler unless you take that column away.", "algo-watch"),
  ],

  "/ml/supervised/naive-bayes": [
    step("nb-idea", "The whole idea in one breath", "Use Bayes’ rule, and pretend features are independent given the class so the math stays a product of simple pieces.", "Read prior × likelihood for two classes and see which posterior wins.", "Say “naive means we ignore feature friendships. The surprise is that this still works on text.”", "algo-idea"),
    step("nb-prior", "The prior is the base rate", "If spam is rare, the model should start skeptical.", "Change class balance and watch the same email become less “spammy.”", "A prior is not prejudice. It is how common the class was in the world you measured.", "algo-params"),
    step("nb-like", "Likelihood is the evidence", "Each feature says “I am more common in class A than B.” Multiply those whispers.", "Zero out a word’s count in one class and watch that class collapse — unless you smoothed.", "Smoothing is the adult in the room when a word never appeared in a class.", "algo-visualize"),
    step("nb-data", "Text is the hometown", "Bag-of-words or simple numeric features. Naive Bayes loves word counts.", "Try the spam-flavored set, then a numeric set, and name which one feels native.", "Independence is less wrong when features are word counts than when they are height and weight.", "algo-dataset"),
    step("nb-fail", "Correlated features double-count", "If two features are the same clue twice, Naive Bayes gets overconfident.", "Duplicate a column and watch probabilities get more extreme, not wiser.", "Calibration is the missing exam after a confident posterior.", "algo-watch"),
  ],

  "/ml/supervised/decision-tree-classification": [
    step("dtc-idea", "The whole idea in one breath", "Ask the most informative yes/no question, then repeat until a leaf can vote a class.", "Follow one example down the tree and read the leaf label.", "Gini or entropy is just “how mixed is this bucket?” The best question makes cleaner buckets.", "algo-idea"),
    step("dtc-split", "Information gain is the lesson", "A good split makes child nodes purer than the parent.", "Watch impurity fall. A split that does not clean the bucket is a bad question.", "Let a learner propose a question before revealing the chosen split.", "algo-visualize"),
    step("dtc-depth", "Depth vs memorization", "Shallow trees are slogans. Deep trees are gossip about individual rows.", "Grow depth and watch train accuracy hit 100% while test sags.", "A one-point leaf is a name, not a rule.", "algo-params"),
    step("dtc-data", "Trees read raw units", "No scaling required. Missing values and rare categories still need care.", "Add a useless ID column. A greedy tree may split on it if you let it.", "IDs are the classic leakage trap for trees.", "algo-dataset"),
    step("dtc-fail", "Unstable stories", "A small data change can pick a different first split and rewrite the whole story.", "Retrain after removing one row near a border.", "Forests average away that drama. A single tree keeps it.", "algo-watch"),
  ],

  "/ml/supervised/random-forest-classification": [
    step("rfc-idea", "The whole idea in one breath", "Many trees vote. Each tree saw a different bag of rows and a random subset of features.", "Compare one tree’s jagged border with the forest’s calmer vote map.", "The forest is allowed to be right for boring reasons: averaging.", "algo-idea"),
    step("rfc-vote", "Votes, not averages of probabilities only", "Classification forests usually count class ballots. The majority wins.", "Look at a disputed point and count the trees. A 51–49 vote is not a sure thing.", "Vote margin is a cheap uncertainty signal.", "algo-visualize"),
    step("rfc-mtry", "Feature lottery", "If every tree can see every strong feature, they all become cousins.", "Reduce features-per-split and watch diversity — and often accuracy — rise.", "Identical trees cannot cancel errors.", "algo-params"),
    step("rfc-imp", "Importance after the vote", "Which columns kept winning splits across the crowd?", "Guess, then check the bar chart.", "A high-importance ID is leakage wearing a medal.", "algo-metrics"),
    step("rfc-fail", "Still a black box", "You cannot recite 300 trees. Use importances or a surrogate tree to teach.", "Keep one shallow tree beside the forest as the explainer.", "Win with the forest. Teach with a stump.", "algo-watch"),
  ],

  "/ml/supervised/svm-classification": [
    step("svm-idea", "The whole idea in one breath", "Find the fattest street (margin) between two classes. Only the points on the curb — support vectors — hold the street up.", "Highlight the support vectors. The rest of the points could move a little and the street would stay.", "Say “the model is allergic to most of the data. Only the borderline examples matter.”", "algo-idea"),
    step("svm-c", "C is how much we hate mistakes", "Large C: skinny street, fewer training errors. Small C: fatter street, more patience with strays.", "Sweep C on a noisy set. The skinny street will start hugging outliers.", "A fat street that allows a few trespassers often travels better to new data.", "algo-params"),
    step("svm-kernel", "The kernel is a change of scenery", "Linear SVM draws a straight street. RBF draws a curved one by measuring similarity.", "Switch to RBF on moons. Then shrink gamma until the street becomes islands around single points.", "Tiny gamma islands are memorization.", "algo-visualize"),
    step("svm-scale", "Scale or the street tilts", "Margin lives in feature space. Unscaled axes warp the street.", "Fit on raw vs standardized data and compare the boundary.", "SVMs are geometry. Geometry needs honest axes.", "algo-dataset"),
    step("svm-fail", "Probabilities are not native", "A hard SVM outputs a side of the street, not a well-calibrated chance.", "If you need probabilities, say so — they are a post-process, not the core idea.", "Teach margin first. Probability later.", "algo-watch"),
  ],

  "/ml/supervised/gradient-boosting-classification": [
    step("gbc-idea", "The whole idea in one breath", "Start with a timid class guess, then add small trees that push the log-odds toward the labels that are still wrong.", "Watch stage-by-stage: residuals of the classification loss should get less angry.", "Same additive story as regression boosting, but the leftovers are from log-loss, not squared error.", "algo-idea"),
    step("gbc-loss", "The leftover is not y − ŷ", "Classification boosting fits the gradient of the loss. For log-loss that is “how surprised we still are.”", "After a few trees, confident correct points should stop attracting new splits.", "Say “the next tree hunts embarrassment, not distance.”", "algo-visualize"),
    step("gbc-lr", "Learning rate still sips", "Each tree is a small nudge of log-odds. Large ν plus many trees memorizes.", "Train slow (ν ≈ 0.05) and compare with ν = 0.8.", "“Take a sip of this tree” still works in classification.", "algo-params"),
    step("gbc-depth", "Keep the trees weak", "Stumps or depth-2/3 trees are the teaching default.", "A deep first tree steals the whole lesson from the additive story.", "If one tree is already strong, you are not boosting — you are dressing a single tree.", "algo-params"),
    step("gbc-fail", "Watch the train/test gap", "Boosting will drive training loss toward zero if you let it.", "Early stop when validation stops improving.", "The last trees are often polishing noise.", "algo-metrics"),
  ],

  "/ml/supervised/adaboost-classification": [
    step("ada-idea", "The whole idea in one breath", "Train a weak stump. Up-weight the people it got wrong. Train the next stump on that angrier dataset. Vote with weights.", "Watch sample weights bloom around the mistakes after round 1.", "Say “AdaBoost is a teacher who keeps handing the hard homework back.”", "algo-idea"),
    step("ada-weights", "Weights are the spotlight", "Misclassified rows get heavier. The next stump must look at them.", "After a round, point at the heaviest points. They should be the border cases or the noise.", "If noise gets heavy, later rounds start fitting insults, not signal.", "algo-visualize"),
    step("ada-alpha", "A stump’s speaking time", "A stump that barely beats a coin toss gets a small vote. A sharp stump gets a louder vote.", "Read the α of each round. Tiny α means that stump barely helped.", "If every α is tiny, your weak learners are too weak or the data is hopelessly mixed.", "algo-params"),
    step("ada-rounds", "More rounds, more focus on hard rows", "Early rounds get the obvious clusters. Late rounds obsess over the leftovers.", "Stop before weights concentrate on a few noisy points.", "AdaBoost’s famous weakness is outliers that refuse to be right.", "algo-watch"),
    step("ada-vs", "Not the same as gradient boosting", "AdaBoost reweights rows. Gradient boosting fits residuals of a loss.", "Open Gradient Boosting Classification and say one sentence of contrast.", "Same family photo, different household rules.", "algo-idea"),
  ],

  "/ml/supervised/xgboost-concept": [
    step("xgb-idea", "The whole idea in one breath", "Gradient boosting with extra seatbelts: second-order splits, shrinkage, and regularized tree scores.", "Treat this lab as “boosting plus a penalty for flashy leaves.”", "Say “XGBoost is GBM that studied regularization.”", "algo-idea"),
    step("xgb-reg", "λ and γ calm the leaves", "Regularization stops a leaf from becoming a wild number just to fit three noisy rows.", "Raise the leaf penalty and watch trees get shyer.", "A shy tree plus many rounds is the adult boosting recipe.", "algo-params"),
    step("xgb-eta", "η is still a sip", "Same learning-rate lesson as GBM. Small η, more trees.", "Do not use a huge η just because the name says “extreme.”", "Extreme is the engineering, not the step size.", "algo-params"),
    step("xgb-hist", "Histograms are speed, not a new idea", "Binning features makes split search fast. The teaching idea is still residual correction.", "If you change bin count and the story changes wildly, the signal is coarse.", "Speed tricks should not rewrite the lesson.", "algo-visualize"),
    step("xgb-fail", "Still a memorizer if you insist", "Huge depth, tiny min-child-weight, no subsample — you can overfit in any brand name.", "Keep a validation set in the room the whole time.", "The leaderboard is not a substitute for a held-out story.", "algo-watch"),
  ],

  "/ml/clustering/k-means": [
    step("km-idea", "The whole idea in one breath", "Pick K addresses (centroids). Every point moves in with the nearest address. Then each address moves to the middle of its residents. Repeat.", "Watch a centroid step toward its cloud. That walk is the algorithm.", "Say “K-Means is musical chairs for unlabeled dots.”", "algo-idea"),
    step("km-k", "K is a promise, not a discovery", "You told the algorithm how many groups exist. It will find that many even if the truth is 2 or 20.", "Try K = 2 on a 3-blob picture. Then K = 8. Both look “successful.”", "The elbow or silhouette is how we ask whether the promise was fair.", "algo-params"),
    step("km-init", "The starting chairs matter", "Bad initial addresses can trap a centroid in a lonely place.", "Rerun with a new seed. If the coloring flips, say that out loud — it is the lesson.", "k-means++ is “do not start all chairs in the same corner.”", "algo-visualize"),
    step("km-scale", "Scale before you measure", "A tall unscaled feature owns “nearest.”", "Toggle scaling and watch groups merge or split.", "If two features have different units, Euclidean distance is already lying.", "algo-dataset"),
    step("km-shape", "Circles, not snakes", "K-Means loves compact blobs. Moons, rings, and spaghetti need density or spectral methods.", "Run it on moons once so the failure is famous.", "Wrong shape is not a bug in K. It is a bug in the assumption.", "algo-watch"),
  ],

  "/ml/clustering/k-medoids": [
    step("kmed-idea", "The whole idea in one breath", "Same game as K-Means, but the center must be an actual data point (a medoid), not an average that might sit in empty space.", "Watch the medoid jump from point to point, never into the void.", "Say “the club president must be a member, not a made-up average person.”", "algo-idea"),
    step("kmed-robust", "Outliers cannot drag the address as easily", "An average chases the outlier. A medoid can refuse to be that outlier.", "Add a far point and compare K-Means vs K-Medoids centers.", "This is why medoids show up with weird distances and messy units.", "algo-visualize"),
    step("kmed-k", "K is still a promise", "You still choose the number of clubs.", "Sweep K and watch who remains president of each club.", "Silhouette still asks whether the promise was fair.", "algo-params"),
    step("kmed-dist", "Any distance you can defend", "Medoids work with a distance matrix, not only Euclidean averages.", "Switch metric if the lab allows it and see presidents change.", "If you cannot name the distance, you cannot defend the clubs.", "algo-dataset"),
    step("kmed-fail", "Slower, and still blob-shaped", "Trying every swap is heavier than moving an average.", "Do not expect rings to suddenly work. The assumption is still compact groups.", "Pick medoids for robustness, not for magic shapes.", "algo-watch"),
  ],

  "/ml/clustering/hierarchical-clustering": [
    step("hc-idea", "The whole idea in one breath", "Start with every point as its own club. Keep merging the two closest clubs until one family tree remains.", "Read the dendrogram from the leaves up. Each merge is a timestamp.", "The height of a merge is “how painful that friendship was.”", "algo-idea"),
    step("hc-link", "Linkage is the personality", "Single link chains through nearest neighbors (can make snakes). Complete link is cautious. Ward likes compact blobs.", "Change linkage on the same dots and watch the tree rewrite.", "Linkage is not a detail. It is the definition of “close.”", "algo-params"),
    step("hc-cut", "Where you cut the tree is K", "A horizontal cut makes a clustering. Higher cut, fewer clubs.", "Slide the cut and name when two real groups got glued too early.", "The dendrogram lets you postpone the K decision — that is the gift.", "algo-visualize"),
    step("hc-scale", "Distance again", "Unscaled features rewrite the whole family tree.", "Scale, then rebuild. The first merges should start making sense.", "If the first merge is two unrelated units, check the ruler.", "algo-dataset"),
    step("hc-fail", "Once glued, always glued", "Agglomerative clustering does not un-merge. An early mistake travels up the tree.", "Point at a merge you regret and show how every ancestor inherits it.", "That is why looking at the whole tree beats one cut.", "algo-watch"),
  ],

  "/ml/clustering/dbscan": [
    step("db-idea", "The whole idea in one breath", "A point is a core if it has enough neighbors inside ε. Core points infect their neighbors. Whoever never gets infected is noise.", "Toggle ε and minPts and watch islands grow, then merge, then swallow the sea.", "Say “DBSCAN does not ask how many clusters. It asks what counts as a crowded street.”", "algo-idea"),
    step("db-eps", "ε is the size of the street", "Too small: everything is noise. Too big: one giant city.", "Find the ε where the real islands appear and the stray dots stay gray.", "A k-distance plot is how grown-ups pick ε. Eyeballing is how we teach it.", "algo-params"),
    step("db-min", "minPts is how crowded is “crowded”", "Higher minPts makes the algorithm pickier about who is a core.", "Raise it until thin bridges break and clusters separate.", "minPts is also a noise filter. That is a feature.", "algo-params"),
    step("db-noise", "Noise is allowed", "K-Means would have stuffed those loners into a club. DBSCAN can say “no.”", "Count noise as ε changes. Tell the story of those points.", "Being unlabeled can be the honest answer.", "algo-visualize"),
    step("db-fail", "One density setting", "A tight blob plus a loose blob fight over the same ε.", "Show two densities and watch one become noise or both glue together.", "That fight is why OPTICS exists.", "algo-watch"),
  ],

  "/ml/clustering/mean-shift": [
    step("ms-idea", "The whole idea in one breath", "Each point walks uphill on the density hill until it sits on a peak. Points that climb the same peak are a cluster. You do not pick K.", "Watch trails of points drift toward modes.", "Say “Mean Shift is hiking toward the crowd.”", "algo-idea"),
    step("ms-bw", "Bandwidth is the hill’s smoothness", "Small bandwidth: many tiny peaks (over-clustering). Large: one gentle mountain.", "Sweep bandwidth until the visible blobs each own a peak.", "Bandwidth is the K you pretend you did not choose.", "algo-params"),
    step("ms-mode", "Modes, not means of assigned sets", "The center is a density peak, which may not equal a K-Means centroid.", "Compare a mode sitting on the crest vs a mean dragged by a tail.", "Tails move means. Modes can ignore them.", "algo-visualize"),
    step("ms-scale", "The hill is in feature space", "Unscaled axes stretch the hill in one direction.", "Scale first or the hike is along the tallest unit.", "Same distance sermon as K-Means.", "algo-dataset"),
    step("ms-fail", "Bandwidth is not free", "You escaped choosing K and inherited a length-scale choice.", "If you cannot defend the bandwidth, you cannot defend the clusters.", "Try a few bandwidths in public, not one in private.", "algo-watch"),
  ],

  "/ml/clustering/gaussian-mixture-model": [
    step("gmm-idea", "The whole idea in one breath", "Pretend the data was drawn from a few Gaussian blobs. Soft-assign each point to every blob (E), then update each blob’s mean, shape, and weight (M).", "Watch a point that sits between two ellipses. Its membership should be split, not forced.", "Say “K-Means with uncertainty and oval glasses.”", "algo-idea"),
    step("gmm-soft", "Soft assignment is the lesson", "A point can be 70% blob A and 30% blob B. That is allowed.", "Find the most “confused” point. That is the teaching point.", "Hard labels come later, if you need them. The model thinks in probabilities.", "algo-visualize"),
    step("gmm-cov", "Covariance is the glasses", "Spherical: circles. Diagonal: axis-aligned ovals. Full: tilted ovals.", "Switch covariance type and watch whether a tilted cloud finally fits.", "Wrong glasses make two blobs where one tilted oval would do.", "algo-params"),
    step("gmm-k", "K components, still a promise", "GMM will use as many Gaussians as you allow.", "Try extra components and watch a leftover Gaussian sit on noise.", "BIC/AIC are how we ask whether a component earned its keep.", "algo-params"),
    step("gmm-fail", "Gaussians only", "Rings and moons are not Gaussian. Soft ovals will still look lost.", "Show a ring once so the assumption is famous.", "A mixture of the wrong shape is still the wrong shape.", "algo-watch"),
  ],

  "/ml/clustering/spectral-clustering": [
    step("sc-idea", "The whole idea in one breath", "Build a friendship graph, take a few eigenvectors of that graph, then run K-Means in that new space — where a moon can look like a blob.", "Watch the embedding: curved neighbors become a simple gap.", "Say “we cluster the social network, not the raw x-y.”", "algo-idea"),
    step("sc-graph", "The graph is the assumption", "Who is connected depends on k-neighbors or a distance kernel.", "Tighten the neighborhood and watch a moon split or a bridge vanish.", "A bad graph cannot be saved by pretty eigenvectors.", "algo-params"),
    step("sc-k", "K is back", "Spectral clustering still wants a number of cuts.", "Choose K from the visible components after the embedding, not only from raw space.", "The embedding is the teacher. K-Means is just the last mile.", "algo-params"),
    step("sc-viz", "Look at the spectral space", "If the embedding does not separate, the graph was wrong.", "Do not judge success only in the original scatter.", "Two pictures: raw dots and embedded dots. Teach both.", "algo-visualize"),
    step("sc-fail", "Cost and graph tuning", "Big n makes an n×n friendship matrix. Also, one global K.", "If densities differ wildly, one graph scale will pick favorites.", "This is a shape tool, not a free lunch.", "algo-watch"),
  ],

  "/ml/clustering/optics": [
    step("opt-idea", "The whole idea in one breath", "Walk the points in a special order and record how reachable each one was. Valleys in that reachability plot are clusters — even if they have different densities.", "Read the plot left to right: a dip is a dense island, a spike is a hike to the next island.", "Say “OPTICS is DBSCAN that kept the whole hike journal instead of one ε snapshot.”", "algo-idea"),
    step("opt-reach", "Reachability is the lesson", "Low reachability = easy to stay in the crowd. High = you just jumped a gap.", "Cut the plot at a height and name the valleys below the cut.", "Students remember valleys faster than “core distance.”", "algo-visualize"),
    step("opt-min", "minPts still defines crowded", "The ordering depends on how many neighbors count as a core.", "Change minPts and watch valleys merge or split.", "Same street-crowd idea as DBSCAN, but you can see many streets at once.", "algo-params"),
    step("opt-xi", "Extracting clusters from the plot", "Steep downs and ups in the plot mark cluster borders.", "Do not only stare — extract and color the original scatter.", "The plot is the teacher. The coloring is the exam.", "algo-visualize"),
    step("opt-fail", "A journal, not a one-click answer", "You still choose how to cut or how steep a valley must be.", "If you cannot point at the valley you kept, you cannot defend the clusters.", "OPTICS shines when DBSCAN’s one ε fails.", "algo-watch"),
  ],

  "/ml/dimensionality-reduction/pca": [
    step("pca-idea", "The whole idea in one breath", "Rotate the axes to the directions where the data stretches most. Keep the first few. That is a compressed copy.", "Watch PC1 point along the longest cloud. PC2 is the leftover stretch.", "Say “PCA is a new camera angle that wastes less frame on empty space.”", "algo-idea"),
    step("pca-var", "Variance is the scoreboard", "A scree plot says how much stretch each new axis captured.", "Keep components until the leftover variance is the noise you are willing to drop.", "90% is a habit, not a law. Ask what the leftover 10% was.", "algo-metrics"),
    step("pca-load", "Loadings are the recipe", "A loading says how much each original feature mixes into a PC.", "Read PC1 as a sentence: “mostly income and rooms.”", "If you cannot name a PC, you have a rotation, not an explanation.", "algo-visualize"),
    step("pca-scale", "Scale or the tallest unit wins", "PCA on raw rupees vs years is a movie about rupees.", "Standardize, then rotate. Compare the first arrow.", "Unscaled PCA is a unit detector.", "algo-dataset"),
    step("pca-fail", "Linear camera only", "A rolled-up swiss roll needs a nonlinear embedding.", "If classes separate on a curve, PCA may still overlap them.", "PCA compresses stretch, not meaning.", "algo-watch"),
  ],

  "/ml/dimensionality-reduction/kernel-pca": [
    step("kpca-idea", "The whole idea in one breath", "Pretend we lifted the dots into a richer space with a kernel, then ran PCA there so a ring can become a line.", "Switch linear PCA vs RBF kernel PCA on a ring or moon.", "Say “same camera, fancier room.”", "algo-idea"),
    step("kpca-gamma", "γ is how local the lift is", "Large γ: tiny neighborhoods, speckled embedding. Small γ: almost linear.", "Sweep γ until the ring opens without shattering.", "γ is the personality of the lift, not a detail.", "algo-params"),
    step("kpca-comp", "Components in kernel space", "You still choose how many axes to keep, but they are not original-feature loadings anymore.", "Do not pretend a kernel PC is “mostly income.” It is a pattern.", "Explainability got harder. Separation may have gotten easier.", "algo-visualize"),
    step("kpca-scale", "Kernels need honest distances", "RBF on unscaled features is a tall-column movie.", "Standardize first.", "Every kernel sermon starts with scaling.", "algo-dataset"),
    step("kpca-fail", "No free reconstruction story", "Linear PCA can map back. Kernel PCA’s “inverse” is awkward.", "If you need to interpret axes, start with linear PCA.", "Use kernel PCA to unfold, not to write a report about features.", "algo-watch"),
  ],

  "/ml/dimensionality-reduction/tsne": [
    step("tsne-idea", "The whole idea in one breath", "Keep nearby points nearby in 2D. Far points can wander. The picture is a neighborhood map, not a tape measure.", "Watch local clumps form. Do not read leftover distances as real.", "Say “t-SNE is a seating chart for friends, not a world map.”", "algo-idea"),
    step("tsne-perp", "Perplexity is how big a friend group is", "Low: tiny cliques. High: bigger neighborhoods, smoother blobs.", "Sweep perplexity on the same data. Cluster count can appear to change.", "If the story flips with perplexity, the story was the parameter.", "algo-params"),
    step("tsne-iter", "It is an iterative party", "Early steps are a messy arrival. Later steps tighten seats.", "Do not screenshot step 50 and call it the answer.", "Run long enough that the clumps stop drifting.", "algo-visualize"),
    step("tsne-lie", "Global distances lie", "Two clumps far apart in the plot may not be far in the data. Cluster size is decorative.", "Never measure a t-SNE axis and report it as a real unit.", "Write “do not interpret axes” on the board.", "algo-watch"),
    step("tsne-data", "A map for seeing, not for modeling", "Use t-SNE to look. Train models on the original or on a stable embedding like PCA/UMAP with care.", "Color by a known label only after the map settles.", "A pretty map is a hypothesis generator, not a proof.", "algo-dataset"),
  ],

  "/ml/dimensionality-reduction/umap-concept": [
    step("umap-idea", "The whole idea in one breath", "Build a fuzzy neighborhood graph, then lay that graph down in 2D so both local friends and some global skeleton survive.", "Compare with t-SNE: UMAP often keeps more of the big picture.", "Say “UMAP is a seating chart that still remembers which rooms are next door.”", "algo-idea"),
    step("umap-n", "n-neighbors is the friend-group size", "Small: local detail, broken islands. Large: smoother global shapes.", "Sweep it and watch islands merge.", "Same lesson as t-SNE perplexity, different name.", "algo-params"),
    step("umap-min", "min-dist is how tightly we pack", "Small min-dist: tight clumps. Larger: breathing room.", "If clumps sit on top of each other, raise min-dist for teaching.", "Packing is cosmetics until it hides a gap you needed to see.", "algo-params"),
    step("umap-global", "Still not a tape measure", "Better global structure than t-SNE is not a license to read axes as real units.", "Do not report “UMAP-1 = 3.2 means income.”", "Use it to see, then confirm in the original space.", "algo-watch"),
    step("umap-data", "Scale, then embed", "Neighborhoods are distances. Distances need honest axes.", "Standardize numeric features before you trust a clump.", "A clump can be a unit accident.", "algo-dataset"),
  ],

  "/ml/dimensionality-reduction/lda": [
    step("lda-idea", "The whole idea in one breath", "Unlike PCA, LDA is supervised: it aims the camera at the directions that best separate known classes.", "Color the points by label. LDA should stretch the gap between colors.", "Say “PCA chases stretch. LDA chases class gossip.”", "algo-idea"),
    step("lda-sup", "Labels are required", "No labels, no LDA. This is not unsupervised compression.", "Hide labels and you should refuse to run the lesson.", "If someone asks for LDA on unlabeled data, send them to PCA.", "algo-dataset"),
    step("lda-comp", "At most C−1 axes", "Two classes → one separating line. Three classes → a plane, and so on.", "Do not ask for 10 LDA components on a 3-class problem.", "That cap is math, not a software limit.", "algo-params"),
    step("lda-gauss", "The assumption is oval classes", "LDA likes classes that look like Gaussians with similar spread.", "If one class is a banana, the “best” line can still mix them.", "Look at the projected overlap, not only the training accuracy.", "algo-visualize"),
    step("lda-fail", "A projection can still overlap", "LDA is a camera, not a classifier — though you can classify in the projected space.", "Compare with a classifier that can bend.", "If the 1D projection overlaps, the classes were never linearly separable in a useful way.", "algo-watch"),
  ],

  "/ml/dimensionality-reduction/autoencoder": [
    step("ae-idea", "The whole idea in one breath", "A neural net tries to copy its input through a skinny middle (the bottleneck). The skinny code is the compression.", "Watch reconstruction error fall, then inspect the 2D latent scatter.", "Say “the bottleneck is a forced summary. If it reconstructs, the summary held the story.”", "algo-idea"),
    step("ae-bot", "Bottleneck size is the compression knob", "2 units is a picture. More units is a roomier suitcase.", "Train with 2, then 8. Reconstruction should get easier — and less forced to be visual.", "If 2 units cannot reconstruct, the data’s story is not 2D.", "algo-params"),
    step("ae-recon", "Reconstruction is the exam", "A pretty latent plot with huge reconstruction error is a failed suitcase.", "Compare input vs output on a few rows.", "Ask what the model is allowed to forget. That is the real design question.", "algo-metrics"),
    step("ae-train", "Unsupervised, but still trainable", "No labels needed. The target is the input itself.", "Over-wide bottlenecks plus overtraining just learn the identity.", "A bottleneck that is too wide is not a lesson.", "algo-visualize"),
    step("ae-fail", "A black-box PCA cousin", "You do not get clean loadings. You get weights.", "If you need named axes, start with PCA and come back.", "Use autoencoders when the copy task is nonlinear.", "algo-watch"),
  ],

  "/ml/deep-learning/perceptron": [
    step("per-idea", "The whole idea in one breath", "One neuron: a weighted sum, a threshold, a yes or no. When it is wrong, it nudges the weights.", "Watch a misclassified point yank the boundary toward a better street.", "Say “the perceptron only studies on test days it fails.”", "algo-idea"),
    step("per-update", "The update is the lesson", "w ← w + η y x on a mistake. Correct points leave the weights alone.", "Step through one error. The wall should move.", "If nothing moves, you are looking at a correct point. That is also the lesson.", "algo-visualize"),
    step("per-lr", "η is the shove size", "Tiny η: polite nudges. Huge η: the wall overshoots and ricochets.", "Try 0.1, then 2.0, on the same mistakes.", "A shove that is too proud will miss the street forever.", "algo-params"),
    step("per-lin", "Linearly separable or bust", "XOR and rings cannot be cut with one straight street.", "Show a linearly separable cloud, then XOR. Stop when it loops.", "The perceptron convergence theorem is a promise with a precondition.", "algo-watch"),
    step("per-data", "Two colors, one street", "Use a 2D two-class set so the wall is visible.", "Add one stubborn point on the wrong side and watch the drama.", "That stubborn point is the whole 1950s argument about neural nets.", "algo-dataset"),
  ],

  "/ml/deep-learning/mlp": [
    step("mlp-idea", "The whole idea in one breath", "Stack perceptrons with nonlinear activations so the street can bend. Train by sending blame backward.", "Add a hidden layer and watch XOR become possible.", "Say “the hidden units invent new features. The last layer reads them.”", "algo-idea"),
    step("mlp-act", "Activation is the bend", "Linear hidden units collapse back to one linear model. ReLU/tanh give corners and curves.", "Switch activation and watch the decision surface change personality.", "No nonlinearity, no depth. That sentence is the course.", "algo-params"),
    step("mlp-width", "Width vs depth", "More units: more wiggles. More layers: more composed features — and harder training.", "Change one at a time. Draw the new boundary.", "A 200-unit soup is not automatically wiser than a 16-unit net you can explain.", "algo-params"),
    step("mlp-loss", "Loss should fall, then stay honest", "Training loss can hit zero while the boundary memorizes noise.", "Read train vs validation together.", "A beautiful training curve with a sad validation curve is the real exam.", "algo-metrics"),
    step("mlp-data", "Scale the inputs", "Gradient steps assume features live on similar streets.", "Standardize, then train. Compare with raw units.", "Unscaled nets spend their youth arguing about units.", "algo-dataset"),
  ],

  "/ml/deep-learning/nn-playground": [
    step("nnp-idea", "The whole idea in one breath", "A sandbox for depth, activations, and learning rate. The boundary is the teacher.", "Build the smallest net that solves the current shape, then add junk and watch it overfit.", "Say “architecture is a hypothesis. The picture grades it.”", "algo-visualize"),
    step("nnp-shape", "Match the net to the shape", "A line dataset wants almost no hidden layer. Moons want a bend. Spirals want more.", "Switch datasets before you switch layers.", "If a one-neuron net already works, stop celebrating depth.", "algo-dataset"),
    step("nnp-lr", "Learning rate is mood", "Too small: a nap. Too large: a seizure. Just right: a walk downhill.", "Sweep it while watching loss, not only the colors.", "If the boundary flickers, η is shouting.", "algo-params"),
    step("nnp-reg", "Regularize to keep the story short", "Dropout or weight decay should smooth a frantic boundary.", "Overfit first on purpose, then add the seatbelt.", "Students remember the before/after better than the formula.", "algo-watch"),
    step("nnp-fail", "A pretty boundary can still be a liar", "Colors on the training dots are not a test set.", "Hold out a few points or switch noise and re-grade.", "Playgrounds lie if you never leave the playground.", "algo-metrics"),
  ],

  "/ml/deep-learning/cnn": [
    step("cnn-idea", "The whole idea in one breath", "Slide small filters across the image. Early filters find edges. Later layers assemble those edges into parts, then objects.", "Click the pipeline stages: pixels → conv → activate → pool → decide.", "Say “a CNN does not read the whole photo at once. It reads with a tiny moving window.”", "algo-idea"),
    step("cnn-filter", "A filter is a pattern detector", "One 3×3 can be an edge. Another can be a blob. The network learns the patterns, we do not paint them.", "Inspect a filter and the feature map it lights up.", "If a map lights up on a vertical edge, name that out loud.", "cnn-conv"),
    step("cnn-pool", "Pooling throws away polite detail", "Max-pool keeps the loudest response in a neighborhood so a cat can move a few pixels and stay a cat.", "Watch resolution shrink and “what” survive more than “exactly where.”", "Translation-ish toughness is the gift. Lost pinpoint location is the price.", "algo-visualize"),
    step("cnn-depth", "Depth is composition", "Layer 1: ink strokes. Layer 3: eyes and wheels. The classifier reads the last summary.", "Do not jump to the logits before walking the stages.", "If you cannot narrate a stage, you are not ready to tune it.", "algo-idea"),
    step("cnn-data", "Pixels need a consistent frame", "Same size, similar contrast, honest labels.", "Swap a sample and watch which maps fire.", "A CNN trained on centered digits will blush at a digit in the corner — unless you augmented.", "algo-dataset"),
  ],

  "/ml/deep-learning/convolution-visualizer": [
    step("conv-idea", "The whole idea in one breath", "A kernel is a tiny stencil. Slide it, multiply, add. That number is “how much this patch looks like the stencil.”", "Pick an edge stencil and drag your eye across a bright edge.", "Say “convolution is a match score, not a mystery.”", "algo-idea"),
    step("conv-kernel", "Change the stencil, change the story", "A Sobel finds edges. A blur averages. A sharpen yells at differences.", "Swap kernels and keep the same image.", "The image did not change. Your question did.", "algo-params"),
    step("conv-pad", "Padding and stride are the walk", "Stride 2 skips tiles. Padding keeps the border in the conversation.", "Change them and count the output size.", "Output size is arithmetic you can do on the board.", "algo-visualize"),
    step("conv-fail", "A kernel is not yet a CNN", "One hand-made filter is a demo. Learned stacks of them are the model.", "After this page, open the CNN lab and watch filters become trainable.", "Do not stop at Sobel and call it deep learning.", "algo-watch"),
  ],

  "/ml/deep-learning/rnn": [
    step("rnn-idea", "The whole idea in one breath", "Read a sequence one step at a time. A hidden state is the notebook the network carries to the next word or time point.", "Watch the hidden state change as tokens arrive.", "Say “the notebook is the memory. If it forgets, later answers get dumber.”", "algo-idea"),
    step("rnn-vanish", "Long stories fade", "Vanilla RNNs multiply the same matrix again and again. Gradients vanish or explode.", "Lengthen the sequence until learning looks tired.", "That tiredness is why LSTM and GRU exist.", "algo-watch"),
    step("rnn-hid", "Hidden size is notebook paper", "Too small: cannot write the plot. Too large: memorizes the training script.", "Change hidden size and compare next-step error.", "Ask what the notebook would need to store for this task.", "algo-params"),
    step("rnn-data", "Order is the feature", "Shuffle a sequence and a good RNN should get worse. If it does not, it was ignoring time.", "That shuffle test is the exam.", "Time-series and text are hometowns. A bag of rows is not.", "algo-dataset"),
    step("rnn-loss", "Teacher forcing vs real rollouts", "Training can cheat by seeing the true last token. Free running cannot.", "If the lab lets you roll out, watch error accumulate.", "A model that cannot roll out did not finish the lesson.", "algo-metrics"),
  ],

  "/ml/deep-learning/lstm": [
    step("lstm-idea", "The whole idea in one breath", "An LSTM is an RNN with gates: forget, input, output. The cell can keep a fact for a long time without multiplying it to death.", "Watch a gate open to store a signal, then stay shut so it survives later steps.", "Say “the cell is a locked box. Gates are the keys.”", "algo-idea"),
    step("lstm-forget", "Forget is a skill", "A good forget gate drops yesterday’s weather when the topic changes, and keeps the subject of the sentence.", "Find a step where forgetting should happen. Check whether it did.", "Never forgetting is hoarding. Always forgetting is amnesia.", "algo-visualize"),
    step("lstm-long", "This is the long-range exam", "Plant a cue early, ask for it late.", "If a vanilla RNN fails and LSTM succeeds, write that score on the board.", "That gap is the whole product pitch.", "algo-metrics"),
    step("lstm-size", "More gates, more knobs", "Hidden size and learning rate still decide whether training walks or shakes.", "Start small. Prove the cue-and-recall story first.", "A huge LSTM on a tiny sequence is a costume.", "algo-params"),
    step("lstm-fail", "Still not a transformer", "LSTMs read in order and can struggle with very long pages. Attention looks at many seats at once.", "Open the attention lab after this one and say the contrast in one breath.", "Gates then attention is a good syllabus order.", "algo-watch"),
  ],

  "/ml/deep-learning/gru": [
    step("gru-idea", "The whole idea in one breath", "A slimmer gated RNN: reset and update. Same hope as LSTM — keep the important past — with fewer moving parts.", "Compare a GRU and LSTM on the same cue-and-recall task.", "Say “GRU is LSTM’s lighter suitcase.”", "algo-idea"),
    step("gru-update", "Update mixes past and now", "The update gate blends the old hidden state with a new candidate.", "Watch it stay near “keep” when the token is boring.", "If it updates on every token, it is not using the suitcase.", "algo-visualize"),
    step("gru-vs", "Fewer gates, same exam", "You still care about long-range credit and exploding steps.", "Lengthen the sequence until something breaks.", "Do not pick GRU because it is trendy. Pick it because the metric and the budget agreed.", "algo-metrics"),
    step("gru-data", "Sequences with a delayed punchline", "The best demos hide the answer early and ask late.", "If every answer is in the last token, any model looks smart.", "Delay is the teacher.", "algo-dataset"),
    step("gru-fail", "Not magic memory", "A tiny GRU on a shuffled sequence is still lost.", "Run the shuffle test.", "Gates need order worth keeping.", "algo-watch"),
  ],

  "/ml/deep-learning/transformer-attention": [
    step("att-idea", "The whole idea in one breath", "Every token looks at the others and takes a weighted mix. The weights are “who should I listen to for this job?”", "Click a query token and see which keys light up.", "Say “attention is a spotlight, not a crystal ball.”", "algo-idea"),
    step("att-qkv", "Q, K, V are job titles", "Query: what I am looking for. Key: what I offer. Value: what I hand over if you pick me.", "Trace one attention weight from score to softmax to mixed value.", "If a student cannot assign the three job titles, stop and drill that.", "algo-visualize"),
    step("att-soft", "Softmax makes a budget of 1", "Raising one weight steals from the others.", "Sharpen or flatten the scores and watch the spotlight go from laser to lamp.", "A uniform spotlight is a polite average. A spike is a decision.", "algo-params"),
    step("att-pos", "Without positions, it is a bag", "Attention alone does not know order. Positional signals put the seats back in a row.", "Scramble positions if the lab allows and watch meaning wobble.", "Order has to be injected. It is not native.", "algo-watch"),
    step("att-data", "A short sentence is enough", "“The cat sat on the mat” plus a who-did-what question is a complete lesson.", "Do not start with a 512-token essay.", "One clear alignment beats a heat-map you cannot read.", "algo-dataset"),
  ],

  "/ml/deep-learning/multi-head-attention": [
    step("mha-idea", "The whole idea in one breath", "Several spotlights at once. One head may watch syntax, another a name, another a comma.", "Toggle heads and see them disagree — that disagreement is the point.", "Say “one head is a specialist. Multi-head is a committee.”", "algo-idea"),
    step("mha-heads", "Heads should not be clones", "If every head attends the same token, you paid for copies.", "Look for at least two different lighting patterns.", "Clone heads mean the model did not use the extra seats.", "algo-visualize"),
    step("mha-dim", "Split the channels, do not just stack clones", "Each head works in a thinner space, then we concatenate.", "Changing head count without changing width is a different experiment than splitting a fixed width.", "One knob per run.", "algo-params"),
    step("mha-vs", "Still attention underneath", "The QKV story did not change. We just run it in parallel.", "If someone is lost, go back to single-head attention first.", "Committees confuse beginners who never met one spotlight.", "algo-idea"),
    step("mha-fail", "More heads ≠ more sense", "Tiny data plus many heads overfits lighting patterns.", "Read a downstream metric, not only a prettier heatmap.", "A heatmap is not a grade.", "algo-metrics"),
  ],

  "/ml/deep-learning/backpropagation-visualizer": [
    step("bp-idea", "The whole idea in one breath", "Forward: compute a guess. Loss: how wrong. Backward: send each weight its share of the blame, then step against that blame.", "Walk one example forward, then watch the colored blame flow back.", "Say “backprop is bookkeeping for blame.”", "algo-idea"),
    step("bp-chain", "The chain rule is the pipe", "A weight only hears the local slope times whatever blame arrived from above.", "Point at one multiply on the backward path.", "If the pipe is a tiny number, that weight learns almost nothing. Vanishing starts here.", "algo-visualize"),
    step("bp-lr", "The step uses the blame", "w ← w − η × (blame for w).", "Raise η until the loss jumps. That jump is overshoot.", "Blame without a sane η is just a tantrum.", "algo-params"),
    step("bp-act", "Activations shape the pipe", "Saturating sigmoids squeeze gradients. ReLUs pass them when they are alive.", "Compare a saturated unit with a live one.", "A dead ReLU is a worker who stopped showing up.", "algo-watch"),
    step("bp-fail", "Seeing the graph is not training a net", "This page teaches the pipe. The MLP/CNN pages spend the pipe on a task.", "After the animation, train a real tiny net.", "Bookkeeping is not the product. The updated weights are.", "algo-metrics"),
  ],

  "/ml/deep-learning/few-shot-learning": [
    step("fs-idea", "The whole idea in one breath", "Learn a way to compare, not a giant list of classes. At test time, a few labeled supports vote for a query.", "Pick 1-shot vs 5-shot and watch confidence change.", "Say “we trained a ruler, then measured a new student with only a few examples.”", "algo-idea"),
    step("fs-support", "The support set is the new textbook", "Change the supports and the same query can flip.", "Swap one support image and narrate the flip.", "Few-shot is honest about how brittle a tiny textbook is.", "algo-dataset"),
    step("fs-k", "K-shot is how many examples per class", "1-shot is a dare. 5-shot is a small class.", "Do not compare 5-shot accuracy to a 1000-example CNN without saying so.", "The exam must name K.", "algo-params"),
    step("fs-metric", "Distance in embedding space", "If the embedding is bad, nearest-support is bad.", "Look at who is actually nearest, not only the final label.", "A wrong neighbor is an embedding problem, not a voting problem.", "algo-visualize"),
    step("fs-fail", "Not free lunch for tiny data", "If supports are unrepresentative, the ruler is crooked.", "Try a weird support and celebrate the failure.", "Few-shot fails loudly. That is useful.", "algo-watch"),
  ],

  "/ml/deep-learning/network-builder": [
    step("nb-idea", "The whole idea in one breath", "You stack layers like blocks, then the trained weights — not the drawing — are the model.", "Add a layer, train, and ask whether the extra block earned its keep.", "Say “the picture of layers is the stadium. The weights are the players.”", "algo-idea"),
    step("nb-shape", "Shapes must fit", "Each layer’s output width is the next layer’s input. A mismatch is a broken Lego.", "Change a size and read the error like a teacher, not a crash.", "Shape errors are friendly errors. Use them.", "algo-params"),
    step("nb-train", "Train after you build", "An untrained architecture is an empty stadium.", "Run a short train and watch loss. Then change one block.", "No training, no lesson.", "algo-visualize"),
    step("nb-over", "More blocks can be less wisdom", "Deep and wide on a tiny table memorizes.", "Keep a validation number next to the architecture trophy.", "If validation got worse, the new block was decoration.", "algo-metrics"),
    step("nb-data", "Match the blocks to the data", "Images want convolution. Tables want dense layers. Sequences want recurrence or attention.", "Pick the wrong family on purpose once.", "Architecture is an inductive bias you can say in a sentence.", "algo-dataset"),
  ],

  "/ml/deep-learning/transfer-learning": [
    step("tl-idea", "The whole idea in one breath", "Borrow a net that already saw a huge world, freeze the early eyes, and train a small new head on your tiny labels.", "Freeze, train the head, then optionally unfreeze a little.", "Say “we hired an experienced intern and only retrained their last notebook page.”", "algo-idea"),
    step("tl-freeze", "Freezing is the point", "If you unfreeze everything on 40 images, you will wreck the intern’s eyes.", "Compare frozen vs fully fine-tuned on a small set.", "Small data + full fine-tune is how transfer learning becomes amnesia.", "algo-params"),
    step("tl-head", "The new head speaks your labels", "The borrowed body speaks general features. Your head speaks “this vs that.”", "Watch the head’s accuracy climb first.", "If the head cannot win, the borrowed features may not match your world.", "algo-visualize"),
    step("tl-domain", "The worlds must be cousins", "A net that lived on photos may be a tourist in medical scans or spectrograms.", "Name the original world and your world. Are they cousins?", "Transfer is a loan, not a spell.", "algo-dataset"),
    step("tl-fail", "Data leak still counts", "A pretrained net does not excuse testing on training photos.", "Keep a true holdout.", "Borrowed eyes, same honesty rules.", "algo-watch"),
  ],

  "/ml/evaluation/train-test-split": [
    step("tts-idea", "The whole idea in one breath", "Hide some rows from the model. Grade only the hidden ones. That grade is the rumor about the future.", "Change the split percent and watch both sides’ metrics move.", "Say “the test set is a sealed envelope. If you open it twice, it is no longer a test.”", "algo-idea"),
    step("tts-leak", "Leakage is opening the envelope", "Scaling, feature picks, and hyperparameter hunts must not see test rows.", "Fit a scaler on train only, then apply it to test. Do the wrong order once on purpose.", "The wrong order is the most common adult mistake in this whole suite.", "algo-watch"),
    step("tts-size", "How much to hide", "Too little test: a noisy grade. Too little train: a weak student.", "70/30 and 80/20 are habits. Time series wants a cut in time, not a shuffle.", "Ask whether a random split is even legal for this data.", "algo-params"),
    step("tts-strat", "Keep the class mix", "If the rare class all falls into train, test is a different planet.", "Stratify classification splits.", "A 99% accuracy on a 99% majority class is a costume.", "algo-dataset"),
    step("tts-once", "One test, many trains", "Use validation (or CV) to tune. Touch test at the end.", "If the lab lets you peek twice, call it out.", "Repeated peeking is how leaderboards lie.", "algo-metrics"),
  ],

  "/ml/evaluation/cross-validation": [
    step("cv-idea", "The whole idea in one breath", "Split the data into K folds. Each fold gets to be the exam once. Average the grades so one lucky split cannot brag.", "Watch each fold’s score, then the mean and the spread.", "Say “CV is several sealed envelopes, used in turn.”", "algo-idea"),
    step("cv-k", "K is a trade of time vs noise", "K = 2 is noisy. K = n (leave-one-out) is proud and slow.", "Try 5 and 10. The mean should settle; the spread tells honesty.", "A tiny spread is not always virtue — it can mean the folds are cousins.", "algo-params"),
    step("cv-group", "Respect groups and time", "If two rows are the same person, they should not sit in both train and test.", "For time, walk forward. Do not shuffle Tuesday into Monday’s exam.", "The unit of splitting is the unit of generalization.", "algo-dataset"),
    step("cv-tune", "Nested if you tune", "Tuning inside the same CV you report is another opened envelope.", "Outer CV reports. Inner CV tunes.", "If that sounds heavy, you now respect why people overfit leaderboards.", "algo-watch"),
    step("cv-fail", "Average without spread is a headline", "Always show the fold scores or a bar of uncertainty.", "One fold that collapses is a story, not an outlier to hide.", "Ask why that fold was hard.", "algo-metrics"),
  ],

  "/ml/evaluation/confusion-matrix": [
    step("cm-idea", "The whole idea in one breath", "A table of “said A, was B.” Diagonals are hits. Off-diagonals are the specific ways we fail.", "Read one off-diagonal out loud: “we called 12 cats dogs.”", "Accuracy hides that sentence. The matrix is that sentence.", "algo-idea"),
    step("cm-err", "Which mistake is expensive", "A hospital and a spam filter do not fear the same off-diagonal.", "Point at FP and FN and assign a cost.", "The cost picks the threshold later. The matrix shows the bill today.", "algo-metrics"),
    step("cm-bal", "Imbalance wears a disguise", "A 95% diagonal can be a majority-class costume.", "Compare accuracy with recall on the rare class.", "If the rare class is a whole empty row, celebrate nothing.", "algo-watch"),
    step("cm-thresh", "A threshold moves the ink", "Raising the bar for “yes” slides counts from FP toward FN (or the reverse).", "Move it and watch the ink travel.", "The matrix is not fixed. It is a slice of a curve.", "algo-params"),
    step("cm-data", "Need predicted labels, not only scores", "If you only have probabilities, pick a threshold first.", "Use a 2-class set so the 2×2 is readable, then a 3-class set.", "A 10-class matrix is a poster, not a first lesson.", "algo-dataset"),
  ],

  "/ml/evaluation/roc-auc": [
    step("roc-idea", "The whole idea in one breath", "Sweep every threshold. Plot true-positive rate against false-positive rate. AUC is “how often a random positive outranks a random negative.”", "Watch a point slide along the curve as the threshold moves.", "Say “ROC is the whole movie. One confusion matrix is one frame.”", "algo-idea"),
    step("roc-auc", "0.5 is a coin, 1.0 is a dream", "AUC does not care about one threshold. It cares about ranking.", "Shuffle labels and watch AUC fall toward 0.5.", "A model can have great AUC and a useless operating point if you pick a silly threshold.", "algo-metrics"),
    step("roc-imbal", "ROC can flatter rare events", "When negatives dominate, a lot of FPs still look like a small FPR.", "Open the PR curve on the same imbalanced set.", "If the class is rare and costly, PR is often the grown-up plot.", "algo-watch"),
    step("roc-point", "Pick a point with a cost", "After you admire AUC, stand on the curve where the cost is acceptable.", "Mark that threshold and jump back to a confusion matrix.", "AUC without a threshold is a trophy without a job.", "algo-params"),
    step("roc-data", "Need scores, not only hard labels", "ROC needs a ranking. Hard 0/1 predictions make a one-kink curve.", "Use probabilities or decision scores.", "A one-kink ROC is a confusion matrix in a tuxedo.", "algo-dataset"),
  ],

  "/ml/evaluation/precision-recall-curve": [
    step("pr-idea", "The whole idea in one breath", "Precision is “of the yeses we shouted, how many were real.” Recall is “of the real yeses, how many did we shout.” The curve is that trade.", "Move the threshold and watch precision and recall tug opposite ways.", "Say “PR is the plot you want when yes is rare.”", "algo-idea"),
    step("pr-base", "The baseline is the positive rate", "A no-skill classifier has precision ≈ prevalence.", "Draw that horizontal habit.", "If your curve hugs the baseline, you did not beat “just guess the base rate.”", "algo-metrics"),
    step("pr-f1", "F1 is one handshake", "F1 is the harmonic mean — it punishes a model that is great at only one of the two.", "Find the threshold that maximizes F1, then ask whether that handshake matches the real cost.", "F1 is a diplomat, not a CEO. Cost is the CEO.", "algo-params"),
    step("pr-vs", "Why not only ROC", "On 1% positives, ROC can look heroic while precision is junk.", "Show both curves on the same run.", "The pair is the lesson. Either alone can flatter.", "algo-watch"),
    step("pr-data", "A rare yes makes the plot matter", "Use an imbalanced set on purpose.", "If classes are 50/50, PR and ROC often tell similar jokes.", "Manufacture rarity if you have to. The punchline needs it.", "algo-dataset"),
  ],

  "/ml/evaluation/regression-metrics": [
    step("rm-idea", "The whole idea in one breath", "MAE is typical miss size. RMSE yells at big misses. R² says how much better we are than predicting the mean.", "Compute all three on the same residuals and explain why they disagree.", "Say “three scores, three personalities.”", "algo-idea"),
    step("rm-mae", "MAE is the honest average", "Every error counts the same. Easy to say in the original units.", "Add one huge outlier and watch MAE twitch while RMSE jumps.", "If the boss thinks in rupees, MAE is a friendly language.", "algo-metrics"),
    step("rm-rmse", "RMSE is the drama critic", "Squares make a 10-unit miss count like a hundred 1-unit misses in the sum of squares.", "That is why RMSE follows the worst house in the neighborhood.", "Use RMSE when big misses are unacceptable.", "algo-visualize"),
    step("rm-r2", "R² can be a costume", "High R² on a dataset with a huge y-range can hide ugly residuals.", "Always look at residual plots beside R².", "R² is “better than the mean,” not “good enough to ship.”", "algo-watch"),
    step("rm-data", "Units and outliers first", "A metric without units is a riddle.", "State the target’s unit before celebrating 0.3.", "0.3 RMSE on house prices in millions is not the same joke as 0.3 on a 0–1 score.", "algo-dataset"),
  ],

  "/ml/evaluation/bias-variance-tradeoff": [
    step("bv-idea", "The whole idea in one breath", "Bias: the model’s systematic wrong idea. Variance: how much the idea jumps if we resample the class. Total error is both, plus noise.", "Fit a shy model and a frantic model on several resamples.", "Say “underfit is a slogan. Overfit is gossip.”", "algo-idea"),
    step("bv-under", "High bias looks calmly wrong", "A line through a bend is consistently off in the same places.", "Residuals will show a pattern, not a cloud.", "If every resample draws the same wrong line, that is bias.", "algo-visualize"),
    step("bv-over", "High variance looks nervously right", "Each resample draws a different wild curve that hugs its own dots.", "Overlay several fits. A thick bundle is variance.", "If the bundle is a highway, you do not have a model. You have moods.", "algo-visualize"),
    step("bv-knob", "Complexity moves the seesaw", "Degree, depth, k, λ — each is a complexity knob.", "Move one knob from shy to frantic and plot train vs test.", "The U-shape of test error is the family photo of this page.", "algo-params"),
    step("bv-fail", "More data calms variance", "A frantic model on 20 rows is a different beast on 2,000.", "Add rows and watch the bundle thin.", "Data is a regularizer you can collect.", "algo-dataset"),
  ],

  "/ml/preprocessing/missing-values": [
    step("mv-idea", "The whole idea in one breath", "Decide why it is missing, then impute, drop, or flag. Pretending NaN is zero is a plot twist the model will believe.", "Compare drop-rows vs mean-impute vs a missingness flag.", "Say “missing is information until proven otherwise.”", "algo-idea"),
    step("mv-why", "MCAR, MAR, MNAR", "Random holes, holes that depend on other columns, holes that depend on the missing value itself.", "Invent one of each in a tiny table.", "MNAR cannot be fixed by a mean. It needs a story.", "algo-watch"),
    step("mv-fit", "Fit impute on train only", "The test mean is an opened envelope.", "Compute a mean on train, apply to test. Then do it the wrong way once.", "That wrong way is leakage with a friendly face.", "algo-params"),
    step("mv-flag", "A flag column keeps the hole visible", "Sometimes “was missing” predicts better than the filled number.", "Add an indicator and see whether it gets used.", "The hole can be the feature.", "algo-visualize"),
    step("mv-data", "Look at the Swiss cheese first", "Count missing by column before you model.", "A column that is 90% empty is a candidate to drop, not to invent.", "Imputation is not a duty. It is a choice.", "algo-dataset"),
  ],

  "/ml/preprocessing/scaling-normalization": [
    step("sc-idea", "The whole idea in one breath", "Put features on comparable rulers so distance and gradient methods do not worship the tallest unit.", "Scale income and age, then rerun KNN or gradient descent.", "Say “we are choosing a ruler, not changing the people.”", "algo-idea"),
    step("sc-std", "Standardize vs min-max", "z-score: mean 0, spread 1. Min-max: squeeze into 0–1. Robust: use medians when outliers shout.", "Apply each to a column with an outlier and compare.", "Min-max with an outlier crushes everyone else into a corner.", "algo-params"),
    step("sc-fit", "Fit on train, transform both", "The test max should not set the train ruler.", "Leak once on purpose. Then do it right.", "This is the same envelope as the split lesson.", "algo-watch"),
    step("sc-tree", "Trees mostly do not care", "A split on income < 50 does not need z-scores. KNN and SVM do.", "Run a tree on raw vs scaled. The story should stay.", "Do not scale as a religion. Scale as a need.", "algo-visualize"),
    step("sc-data", "Name the units first", "If you cannot name the unit, you cannot defend the ruler.", "Write units on the columns, then choose a scaler.", "“Dimensionless” is a choice you should be able to say.", "algo-dataset"),
  ],

  "/ml/preprocessing/categorical-encoding": [
    step("enc-idea", "The whole idea in one breath", "Models want numbers. Encoding is how a color or a city becomes a number without inventing a fake order.", "Compare one-hot vs ordinal on “red / green / blue.”", "Say “ordinal is a ranking. One-hot is a set of switches. Do not rank colors.”", "algo-idea"),
    step("enc-oh", "One-hot is honest and wide", "Each category gets a column. The table gets fatter.", "A high-cardinality city column will explode.", "When the table explodes, target or hashing encodings enter the chat.", "algo-visualize"),
    step("enc-ord", "Ordinal needs a real order", "Small / medium / large can be 1 / 2 / 3. Paris / Tokyo / Lima cannot.", "Force an ordinal on cities once so the crime is visible.", "A linear model will believe Tokyo is between Paris and Lima if you say so.", "algo-watch"),
    step("enc-fit", "Unseen categories at test time", "A city that never appeared in train needs a policy: extra bucket, error, or ignore.", "Invent an unseen label and watch the encoder.", "Production is full of unseen labels.", "algo-params"),
    step("enc-leak", "Target encoding can whisper the answer", "If you encode with the target mean, do it inside CV, not on the whole set.", "A perfect target encoding is leakage in a nice suit.", "When in doubt, one-hot the small stuff.", "algo-dataset"),
  ],

  "/ml/preprocessing/outlier-detection": [
    step("od-idea", "The whole idea in one breath", "An outlier is a point that does not play by the crowd’s rules. Detection is a question: error, novelty, or the most important row in the set?", "Mark a far point and try a z-score vs a robust fence vs isolation.", "Say “do not delete a point you have not named.”", "algo-idea"),
    step("od-rule", "The ruler changes the suspects", "z-score suspects the tails of a bell. IQR uses quartiles. Isolation forests isolate strangers.", "Switch methods on the same cloud.", "If the suspect list flips, the definition flipped.", "algo-params"),
    step("od-keep", "Sometimes the outlier is the prize", "Fraud, outages, and rare diseases live in the tail.", "Ask whether this page is a cleaner or a detector.", "Cleaning a fraud dataset is a plot twist.", "algo-watch"),
    step("od-scale", "Distance-based detectors need rulers", "A tall column owns “far.”", "Scale, then isolate.", "Unscaled isolation is a unit hunt.", "algo-dataset"),
    step("od-model", "How models react", "Least squares chases the stranger. Trees can isolate it in a leaf. Robust methods shrug.", "Open a regression page after flagging one point.", "The best demo is before/after a fit.", "algo-visualize"),
  ],

  "/ml/preprocessing/feature-selection": [
    step("fs2-idea", "The whole idea in one breath", "Keep the columns that carry the story. Drop the ones that are noise, twins, or leaks.", "Compare a filter score, a model-based importance, and a wrapper search on the same table.", "Say “fewer honest columns beat a parade of cousins.”", "algo-idea"),
    step("fs2-filter", "Filters are cheap questions", "Correlation, mutual information, χ² — they grade columns one at a time.", "A filter can miss a pair that only works together.", "Use filters to thin a circus, not to finish the act.", "algo-params"),
    step("fs2-model", "The model’s favorites", "Lasso zeros, tree importances, permutation drops.", "Permutation is the grown-up: shuffle a column and see who hurts.", "If shuffling an ID hurts, you found leakage.", "algo-visualize"),
    step("fs2-leak", "Never select on the test set", "Picking columns with the test labels is another opened envelope.", "Select inside train/CV only.", "This mistake makes papers look brilliant and products look confused.", "algo-watch"),
    step("fs2-data", "Start with a wide, messy table", "You cannot teach selection on three perfect features.", "Add a random column and an ID. They should lose.", "A random column that wins is a red siren.", "algo-dataset"),
  ],

  "/ml/preprocessing/polynomial-features": [
    step("pf-idea", "The whole idea in one breath", "Invent products and powers so a linear model can draw a curve. This is feature engineering, not a new learner.", "Add x² and xy, then fit a linear model.", "Say “we changed the ingredients, not the oven.”", "algo-idea"),
    step("pf-deg", "Degree explodes the table", "Degree 2 on 10 features is a crowd. Degree 3 is a mob.", "Count columns after expansion. Write the number in large digits.", "The mob overfits unless you regularize.", "algo-params"),
    step("pf-reg", "Ridge/Lasso after expansion", "The invented columns need a tax.", "Expand, then open Ridge. That pairing is the adult workflow.", "Polynomial features without a penalty is a dare.", "algo-watch"),
    step("pf-viz", "The curve lives in x, the fit lives in z", "We fit a plane in the expanded space that looks bent in the original x.", "Show both views if you can.", "Students think they left linear models. They did not.", "algo-visualize"),
    step("pf-data", "Only invent what the story needs", "A mild bend wants x², not a degree-6 carnival.", "Look at residuals of a line first. Then invent.", "Invention without a residual plot is superstition.", "algo-dataset"),
  ],
}

function firstSentence(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^.+?[.](?=\s|$)/);
  return (match?.[0] ?? trimmed).slice(0, 280);
}

function slugFromRoute(route: string) {
  return route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "algo";
}

function buildGeneratedGuide(route: string): GuideStep[] {
  const item = getAlgorithmByRoute(route);
  const label = item?.label ?? "This method";
  const intro = item ? getAlgorithmIntroduction(item) : undefined;
  const lesson = getLearningContent(route);
  const story = lesson.lessons[0];
  const think = lesson.lessons[2] ?? story;
  const math = lesson.lessons[3] ?? story;
  const world = lesson.lessons[4] ?? story;
  const meta = algorithmSearchMeta[route];
  const knob = meta?.tags?.[0] ?? "the main control";
  const slug = slugFromRoute(route);

  return [
    step(
      `${slug}-idea`,
      "The whole idea in one breath",
      intro?.summary ?? firstSentence(story.simpleExplanation),
      firstSentence(story.simpleExplanation),
      story.teacherTip,
      "algo-idea",
    ),
    step(
      `${slug}-think`,
      `How ${label} thinks`,
      firstSentence(think.simpleExplanation),
      "Open Visualize, change one control, and narrate the step that moved.",
      think.teacherTip,
      "algo-visualize",
    ),
    step(
      `${slug}-knob`,
      `The knob that matters: ${knob}`,
      intro?.watchFor ?? `Watch ${knob} and whether the picture and the metric agree.`,
      "Change only that family of settings, retrain, and say what got better or worse.",
      "Write the before/after metric on the board so the class owns the experiment.",
      "algo-params",
    ),
    step(
      `${slug}-math`,
      "The scoreboard",
      firstSentence(lesson.formula),
      firstSentence(math.simpleExplanation),
      math.teacherTip,
      "algo-metrics",
    ),
    step(
      `${slug}-data`,
      "Pick a dataset with a story",
      firstSentence(story.realtimeExample),
      "Load a built-in set or a CSV the class cares about, then name the input and the output.",
      "Before running, guess what should happen. After running, score the guess.",
      "algo-dataset",
    ),
    step(
      `${slug}-fail`,
      "Where it lies",
      firstSentence(world.simpleExplanation),
      lesson.mistakes[0] ?? "Find one case where the pretty picture is the wrong exam.",
      intro?.watchFor ?? world.teacherTip,
      "algo-watch",
    ),
  ];
}

export function getAlgorithmGuideSteps(route: string): GuideStep[] {
  return authoredGuides[route] ?? buildGeneratedGuide(route);
}

export function hasAuthoredAlgorithmGuide(route: string) {
  return Object.prototype.hasOwnProperty.call(authoredGuides, route);
}
