import { getAlgorithmGuideSteps } from "./algorithmGuides";
import { getAlgorithmByRoute } from "./implementationStatus";
import { getAlgorithmIntroduction } from "./algorithmIntroductions";
import { getLearningContent } from "./learningContent";

export type GuideStep = {
  id: string;
  title: string;
  /** Why this part of the page exists. */
  purpose: string;
  /** What the learner should do here. */
  does: string;
  /** How a teacher can explain the idea out loud. */
  teach: string;
  /** Matches `[data-guide="…"]` on the page. */
  spot?: string;
  /** Matches a tab / button by visible label. */
  tab?: string;
};

export type GuideTour = {
  title: string;
  pitch: string;
  steps: GuideStep[];
};

const labTabs: GuideStep[] = [
  {
    id: "tab-learn",
    title: "Learn",
    purpose: "Give the idea first, before any sliders or metrics.",
    does: "Read the story, the formula, and the one-sentence intuition. Stay here until you can say the idea in your own words.",
    teach: "Ask: “If we banned jargon, how would you explain this to a friend?” Then point at the formula only after that sentence is solid.",
    tab: "Learn",
    spot: "tab-learn",
  },
  {
    id: "tab-visualize",
    title: "Visualize",
    purpose: "Make the algorithm visible so the update rule is not just a paragraph.",
    does: "Watch the plot, then change one control and say out loud what moved and why.",
    teach: "Narrate the picture: “This is the model’s current guess. That gap is the error it will try to fix next.”",
    tab: "Visualize",
    spot: "tab-visualize",
  },
  {
    id: "tab-dataset",
    title: "Dataset",
    purpose: "Show that the algorithm is only as honest as the table it trains on.",
    does: "Load a built-in set, then edit or import a few rows and watch the fit change.",
    teach: "Change one outlier and ask what a robust method should do. If nothing moves, the lesson is incomplete.",
    tab: "Dataset",
    spot: "tab-dataset",
  },
  {
    id: "tab-train",
    title: "Build / Train",
    purpose: "Turn knobs into a fitted model so learners see cause and effect.",
    does: "Set a hyperparameter, train, and compare the new result with the last run.",
    teach: "Change only one knob per run. Write the before/after metric on the board so the class owns the experiment.",
    tab: "Build / Train",
    spot: "tab-train",
  },
  {
    id: "tab-metrics",
    title: "Metrics",
    purpose: "Judge quality with numbers that match the task, not just a pretty plot.",
    does: "Read the headline score, then check whether train and test tell the same story.",
    teach: "Ask which error is more expensive in the real task. Accuracy is not always the right exam.",
    tab: "Metrics",
    spot: "tab-metrics",
  },
  {
    id: "tab-compare",
    title: "Compare",
    purpose: "Place this method next to its relatives so it is not learned in isolation.",
    does: "Open a sibling algorithm and name one thing this method does better and one thing it does worse.",
    teach: "Force a tradeoff sentence: “I would pick this when … and I would pick the other when …”",
    tab: "Compare",
    spot: "tab-compare",
  },
  {
    id: "tab-explain",
    title: "Explain",
    purpose: "Connect the demo back to the update rule, the code, and common mistakes.",
    does: "Walk the pseudocode once, then find the same step in the visualization.",
    teach: "Have a learner teach the last three steps to the room. If they skip residuals or the learning rate, loop back.",
    tab: "Explain",
    spot: "tab-explain",
  },
];

const categoryExtras: Record<string, GuideStep[]> = {
  "Supervised - Regression": [
    {
      id: "reg-residual",
      title: "Residuals are the lesson",
      purpose: "A residual is the leftover error after the current guess.",
      does: "Point at a point above the curve and say “the model under-predicted here.”",
      teach: "If residuals still have a pattern, the model left homework on the table. Change one knob and ask whether that homework shrank.",
      spot: "algo-watch",
    },
  ],
  "Supervised - Classification": [
    {
      id: "clf-mistake",
      title: "Name the expensive mistake",
      purpose: "Accuracy is a headline. The interesting story is which class we confuse with which.",
      does: "Open the confusion or the boundary and say one false-positive and one false-negative in words.",
      teach: "Ask which error would hurt a real person. That answer picks the threshold and the metric.",
      spot: "algo-metrics",
    },
  ],
  Clustering: [
    {
      id: "cluster-distance",
      title: "Distance is the assumption",
      purpose: "Clusters only exist in the space you measure.",
      does: "Toggle scaling or the metric and watch groups merge or split.",
      teach: "If two features have different units, Euclidean distance is already lying. Scale first, then cluster.",
      spot: "algo-dataset",
    },
  ],
  "Dimensionality Reduction": [
    {
      id: "dr-axes",
      title: "Do not worship the new axes",
      purpose: "A 2D picture is a camera angle, not a new reality.",
      does: "Color the embedding by a known label or a raw feature and say what survived.",
      teach: "If you cannot name what a component kept, you have a picture, not an explanation.",
      spot: "algo-visualize",
    },
  ],
  "Deep Learning": [
    {
      id: "dl-weights",
      title: "Weights are the memory",
      purpose: "Training writes the lesson into numbers, not into the architecture drawing.",
      does: "Train, then change one input and watch the output move.",
      teach: "The picture of layers is the stadium. The weights are the players. Empty seats do not play.",
      spot: "algo-visualize",
    },
  ],
  Evaluation: [
    {
      id: "eval-split",
      title: "The sealed envelope",
      purpose: "A metric is only honest if the exam rows stayed hidden while we studied.",
      does: "Point at train vs test (or each fold) and refuse to celebrate a single number.",
      teach: "If we tuned on the same rows we report, we opened the envelope. Say that out loud.",
      spot: "algo-metrics",
    },
  ],
  Preprocessing: [
    {
      id: "prep-leak",
      title: "Fit on train, transform both",
      purpose: "Scalers, imputers, and encoders can leak if they see the test set while learning their rules.",
      does: "Do the wrong order once on purpose, then the right order.",
      teach: "Preprocessing is part of the model. It has a training set too.",
      spot: "algo-params",
    },
  ],
  "Time Series": [
    {
      id: "ts-order",
      title: "Time is the split",
      purpose: "Tomorrow cannot train on next Friday. Order is the feature and the exam.",
      does: "Refuse a shuffled split. Cut the series in time and forecast forward.",
      teach: "If a shuffle made the score better, the model was cheating with the future.",
      spot: "algo-dataset",
    },
  ],
  NLP: [
    {
      id: "nlp-token",
      title: "Tokens are the features",
      purpose: "The model never saw a “sentence.” It saw counts, weights, or embeddings of pieces.",
      does: "Edit one word and watch which token or weight moves the prediction.",
      teach: "Ask what is lost when we throw away order — and whether this page even kept order.",
      spot: "algo-visualize",
    },
  ],
  "Computer Vision": [
    {
      id: "cv-pixel",
      title: "The picture is the dataset",
      purpose: "Lighting, crop, and resolution are features whether we named them or not.",
      does: "Change one image or filter and say which visual pattern became easier.",
      teach: "If the model fails on a shifted crop, it learned a studio, not an object.",
      spot: "algo-dataset",
    },
  ],
  Recommendation: [
    {
      id: "rec-cold",
      title: "Cold start is the exam",
      purpose: "A new user or a new item has no friends in the matrix yet.",
      does: "Zero out a user’s history and watch the ranking fall back to popularity or content.",
      teach: "Accuracy on veterans can hide a product that cannot greet a stranger.",
      spot: "algo-watch",
    },
  ],
  "Reinforcement Learning": [
    {
      id: "rl-explore",
      title: "Exploration is tuition",
      purpose: "An agent that never tries the other lever cannot learn its reward.",
      does: "Raise exploration, then lower it after the values settle.",
      teach: "Greedy from step one is a student who never takes a practice test.",
      spot: "algo-params",
    },
  ],
  Explainability: [
    {
      id: "xai-local",
      title: "Local is not global",
      purpose: "A reason for one row can disagree with the average reason.",
      does: "Explain two opposite examples and refuse to quote only one.",
      teach: "Explanation is not causation. It is “what the model used,” not “what the world is.”",
      spot: "algo-visualize",
    },
  ],
  Optimization: [
    {
      id: "opt-lr",
      title: "The step size is the mood",
      purpose: "Too small is a nap. Too large is a seizure. The loss plot tells which.",
      does: "Sweep the learning rate until the curve walks, then until it jumps.",
      teach: "Students remember the jumping curve faster than the derivative.",
      spot: "algo-params",
    },
  ],
  Ensemble: [
    {
      id: "ens-diverse",
      title: "Disagreement is the point",
      purpose: "Identical models cannot cancel each other’s mistakes.",
      does: "Compare one strong learner with a crowd of weaker, different ones.",
      teach: "Ask what made the crowd different: rows, features, or residual homework.",
      spot: "algo-visualize",
    },
  ],
  Probabilistic: [
    {
      id: "prob-uncert",
      title: "The interval is the answer",
      purpose: "A single number without a spread is pretending to be sure.",
      does: "Change prior or noise and watch the band widen or shrink.",
      teach: "Ask whether a decision would change at the edge of the band. That is why the band exists.",
      spot: "algo-metrics",
    },
  ],
  Deployment: [
    {
      id: "dep-parity",
      title: "The same preprocessing, or bust",
      purpose: "A model file without its ruler, encoder, and input shape is a costume.",
      does: "Export, reload, and feed one known example. The number should match.",
      teach: "Most production bugs are missing scalers, not missing layers.",
      spot: "algo-watch",
    },
  ],
  Lab: [
    {
      id: "lab-control",
      title: "One change, one note",
      purpose: "A workspace is only a lab if the next person can replay the run.",
      does: "Change one setting, save the experiment, and write why the metric moved.",
      teach: "If the note is missing, the result is a rumor.",
      spot: "algo-params",
    },
  ],
};

function trainTabAliases(tab: string) {
  if (tab === "Build / Train") return ["Build / Train", "Build/Train", "Train"];
  if (tab === "Learn") return ["Learn"];
  return [tab];
}

function conceptStep(route: string): GuideStep {
  const item = getAlgorithmByRoute(route);
  const intro = item ? getAlgorithmIntroduction(item) : undefined;
  const lesson = getLearningContent(route);
  const label = item?.label ?? "This page";
  return {
    id: "concept",
    title: `What ${label} is`,
    purpose: intro?.summary ?? lesson.intuition,
    does: intro?.useWhen ?? "Use the tabs in order: idea, picture, data, train, score.",
    teach: intro?.watchFor ?? lesson.lessons[0]?.teacherTip ?? lesson.intuition,
  };
}

function homeTour(): GuideTour {
  return {
    title: "Home catalogue",
    pitch: "This board is the map. Guide Mode on any algorithm page will walk the lab itself.",
    steps: [
      {
        id: "home-search",
        title: "Search",
        purpose: "Find a method by name, synonym, or topic — not by scrolling every card.",
        does: "Try “tree”, “svm”, or “image” and notice the list narrows.",
        teach: "Search is how you start from a problem (“I have text”) instead of from a syllabus title.",
        spot: "home-search",
      },
      {
        id: "home-expand",
        title: "Expand a family",
        purpose: "The first six cards are the teaching set. Expand to see the rest of that family in place.",
        does: "Open Supervised, then expand. Stay on this page — nothing should navigate away.",
        teach: "Collapsed = today’s lesson. Expanded = the shelf around it.",
      },
    ],
  };
}

export function getGuideTour(route: string): GuideTour {
  if (route === "/") return homeTour();

  const item = getAlgorithmByRoute(route);
  const extras = [
    ...getAlgorithmGuideSteps(route),
    ...((item && categoryExtras[item.category]) ?? []),
  ];
  const seen = new Set<string>();
  const steps = [conceptStep(route), ...labTabs, ...extras].filter((step) => {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
    return true;
  });

  return {
    title: item?.label ?? "Lab guide",
    pitch:
      item
        ? `${item.label} is a ${item.category.toLowerCase()} lab. Use Guide Mode to learn what each tab and control is for before you twist knobs.`
        : "Use Guide Mode to learn what each part of this page is for.",
    steps,
  };
}

export { trainTabAliases };
