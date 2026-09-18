import type { BadgeType, NavItem } from './navigation';
import { termsStudioNewLessons } from './termsStudioNewTerms';

export type TermCategoryId =
  | 'optimization'
  | 'activations'
  | 'losses'
  | 'regularization'
  | 'neural'
  | 'data-math';

export type TermDemoKind =
  | 'activation'
  | 'softmax'
  | 'learning-rate'
  | 'loss-compare'
  | 'dropout'
  | 'split'
  | 'overfit'
  | 'gradient-walk'
  | 'scaling'
  | 'onehot'
  | 'epochs'
  | 'clipping'
  | 'momentum'
  | 'schedule'
  | 'norm'
  | 'chain-rule'
  | 'forward'
  | 'init'
  | 'cross-entropy'
  | 'bias-variance'
  | 'hinge'
  | 'kl'
  | 'batch-norm'
  | 'weight-decay'
  | 'augmentation'
  | 'dot-product'
  | 'saddle'
  | 'early-stop'
  | 'adam'
  | 'sgd'
  | 'neuron'
  | 'backprop'
  | 'contrastive'
  | 'residual'
  | 'attention'
  | 'embedding'
  | 'learning-curve'
  | 'baseline'
  | 'leakage'
  | 'cosine'
  | 'padding'
  | 'token'
  | 'overlay-activation'
  | 'overlay-loss';

export interface TermCategory {
  id: TermCategoryId;
  title: string;
  blurb: string;
  tone: 'amber' | 'blue' | 'green' | 'purple' | 'rose' | 'teal';
}

export interface TermLesson {
  slug: string;
  label: string;
  category: TermCategoryId;
  badge: Extract<BadgeType, 'Beginner' | 'Intermediate'>;
  blurb: string;
  analogy: string;
  hook: string;
  explanation: string[];
  formula?: string;
  formulaPlain?: string;
  workedExample: {
    title: string;
    setup: string;
    steps: string[];
    takeaway: string;
  };
  tryThis: string[];
  whenToUse: string;
  watchFor: string;
  related: string[];
  labLinks: Array<{ label: string; route: string }>;
  demo: { kind: TermDemoKind; variant?: string };
  synonyms: string[];
  tags: string[];
}

export interface WorkedBlock {
  title: string;
  setup: string;
  steps: string[];
  takeaway: string;
}

export interface TermQuizItem {
  q: string;
  choices: string[];
  answer: number;
  why: string;
}

export interface TermEnhance {
  sixty: { what: string; why: string; remember: string };
  meetingLine: string;
  mixups: Array<{ other: string; vs: string; otherSlug?: string }>;
  symbols: Array<{ symbol: string; say: string; means: string }>;
  secondExample: WorkedBlock;
  wrongWalkthrough: WorkedBlock;
  rememberNumber: { label: string; value: string };
  classroomScript: string[];
  myths: Array<{ myth: string; fact: string }>;
  inThisApp: string;
  compareWith: string[];
  quiz: TermQuizItem[];
  beforeAfter: { before: string; after: string };
  vocab: Array<{ word: string; def: string }>;
  simple: { hook: string; analogy: string; explanation: string[] };
  hindi: { hook: string; analogy: string; meetingLine: string; sixty: { what: string; why: string; remember: string } };
  diagramCaption: string;
  unitsNote?: string;
  needFirst: string[];
  readNext: string[];
  searchAliases: string[];
}

export type TermLanguage = 'default' | 'simple' | 'hindi';

export const TERMS_STUDIO_HUB_ROUTE = '/ml/terms-studio';
export const TERMS_STUDIO_TOPIC_ROUTE = '/ml/terms-studio/topic';

export function categoryRoute(id: TermCategoryId): string {
  return `${TERMS_STUDIO_TOPIC_ROUTE}/${id}`;
}

export const termCategories: TermCategory[] = [
  { id: 'optimization', title: 'Optimization', blurb: 'How a model takes steps to get less wrong', tone: 'amber' },
  { id: 'activations', title: 'Activation functions', blurb: 'The switches that let a network bend, not just draw a line', tone: 'blue' },
  { id: 'losses', title: 'Loss functions', blurb: 'The scoreboard that says how wrong a guess was', tone: 'rose' },
  { id: 'regularization', title: 'Regularization', blurb: 'Seatbelts that stop a model from memorizing homework', tone: 'green' },
  { id: 'neural', title: 'Neural-net mechanics', blurb: 'The moving parts inside a tiny brain of numbers', tone: 'purple' },
  { id: 'data-math', title: 'Data math', blurb: 'The everyday number tricks every algorithm leans on', tone: 'teal' },
];

export const termsStudioStartPath = [
  'neuron',
  'relu',
  'gradient-descent',
  'learning-rate',
  'mse-mae-huber',
  'forward-pass',
  'backpropagation',
  'overfitting',
  'train-val-test',
] as const;

export const termsStudioLessons: TermLesson[] = [
  {
    slug: 'gradient-descent',
    label: 'Gradient Descent',
    category: 'optimization',
    badge: 'Beginner',
    blurb: 'Walk downhill on a loss hill until the guess is good enough.',
    analogy: 'You are hiking in fog. You cannot see the valley, so you feel the slope under your feet and take a small step downhill. Repeat.',
    hook: 'A model starts with a bad guess. Gradient descent is the recipe for improving that guess, a little at a time, by following the slope of the error.',
    explanation: [
      'Imagine the error as a hill. High places mean “the model is very wrong.” Low places mean “the model is almost right.” Gradient descent asks: which way is downhill from here?',
      'The gradient is just a fancy word for slope. If the slope is +4, walking right makes the error worse, so we step left. If the slope is −1, we step right. The size of the step is the learning rate.',
      'We do not jump to the bottom in one leap. We take many small steps so we do not overshoot the valley. That is why training looks like a slow walk, not a teleport.',
    ],
    formula: '\\theta \\leftarrow \\theta - \\eta \\nabla L(\\theta)',
    formulaPlain: 'new guess = old guess minus (step size times the slope of the error)',
    workedExample: {
      title: 'Find the bottom of (x − 3)²',
      setup: 'Start at x = 0. The error is (x − 3)². The slope is 2(x − 3). Use a step size of 0.25.',
      steps: [
        'At x = 0 the slope is 2(0 − 3) = −6. Step: 0 − 0.25 × (−6) = 1.5.',
        'At x = 1.5 the slope is 2(1.5 − 3) = −3. Step: 1.5 − 0.25 × (−3) = 2.25.',
        'At x = 2.25 the slope is −1.5. Step: 2.25 + 0.375 = 2.625. We are walking toward 3.',
      ],
      takeaway: 'Each step uses the current slope. We do not need a map of the whole hill — only the ground under our feet.',
    },
    tryThis: [
      'In the demo, start far from the valley and watch the ball walk in.',
      'Raise the step size until the ball jumps over the bottom and bounces.',
    ],
    whenToUse: 'Any time a model has knobs (weights) and a score for “how wrong.” Almost every neural net uses this idea.',
    watchFor: 'A step that is too big overshoots. A step that is too small crawls forever. Hills with several valleys can trap you in a local dip.',
    related: ['learning-rate', 'sgd-mini-batch', 'momentum', 'local-minima'],
    labLinks: [
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
      { label: 'Neural Network Playground', route: '/ml/deep-learning/nn-playground' },
    ],
    demo: { kind: 'gradient-walk' },
    synonyms: ['gd', 'batch gradient descent', 'steepest descent'],
    tags: ['optimizer', 'slope', 'loss hill', 'training'],
  },
  {
    slug: 'sgd-mini-batch',
    label: 'SGD & Mini-batches',
    category: 'optimization',
    badge: 'Beginner',
    blurb: 'Estimate the downhill direction from a handful of examples, not the whole dataset.',
    analogy: 'Instead of polling every student before changing the lesson, you ask a random group of ten. Faster, a bit noisier, usually good enough.',
    hook: 'Full gradient descent looks at every training example before taking one step. That is honest — and painfully slow on big data. SGD peeks at a sample.',
    explanation: [
      'SGD means Stochastic Gradient Descent. Stochastic just means “a little random.” We shuffle the data and update after one example or a small batch.',
      'A mini-batch of 32 examples is the usual compromise: cheap enough to be fast, large enough that the slope is not pure noise.',
      'The noise is not only a bug. A slightly shaky path can bounce you out of a shallow dip that full-batch descent would sit in forever.',
    ],
    formula: '\\theta \\leftarrow \\theta - \\eta \\nabla L_{batch}(\\theta)',
    formulaPlain: 'same downhill step, but the slope is estimated from a small random batch',
    workedExample: {
      title: '1,000 house-price rows',
      setup: 'Full-batch GD would average the slope of all 1,000 houses, then take one step.',
      steps: [
        'SGD: pick 1 house, step. Repeat 1,000 times. Very noisy, very cheap per step.',
        'Mini-batch 32: pick 32 houses, average their slopes, step. About 32 steps per full pass.',
        'One full pass through the data is called an epoch. Mini-batches make many updates inside one epoch.',
      ],
      takeaway: 'We trade a perfect slope for many cheap, slightly messy slopes. Training usually finishes sooner.',
    },
    tryThis: [
      'In the demo, compare a smooth full-batch path with a jittery mini-batch path.',
      'Shrink the batch. The walk gets noisier. Grow it. The walk gets calmer.',
    ],
    whenToUse: 'Default for neural nets and any dataset too large to load as one giant gradient.',
    watchFor: 'Tiny batches can bounce so hard the model never settles. Very large batches can waste memory and still get stuck.',
    related: ['gradient-descent', 'epochs-batches', 'learning-rate', 'adam'],
    labLinks: [
      { label: 'SGD lab', route: '/ml/optimization/sgd' },
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
    ],
    demo: { kind: 'sgd' },
    synonyms: ['stochastic gradient descent', 'mini batch', 'minibatch gd'],
    tags: ['optimizer', 'batch', 'noise', 'epoch'],
  },
  {
    slug: 'learning-rate',
    label: 'Learning Rate',
    category: 'optimization',
    badge: 'Beginner',
    blurb: 'The step-size knob. Too big and you leap past the answer. Too small and you crawl.',
    analogy: 'Turning a shower: a tiny twist barely changes the temperature. A huge twist scalds you. The learning rate is how far you twist each time.',
    hook: 'If gradient descent is “walk downhill,” the learning rate is the length of each stride.',
    explanation: [
      'Call it η (eta) or lr. We multiply the slope by this number to decide how far to move the weights.',
      'Too large: the error jumps up and down, or explodes to infinity. Too small: training looks frozen and you wait forever.',
      'There is no magic number for every problem. People often start near 0.01 or 0.001, then watch the loss curve and adjust.',
    ],
    formula: '\\Delta \\theta = -\\eta \\cdot \\text{gradient}',
    formulaPlain: 'how far we move = step size times the slope',
    workedExample: {
      title: 'Same slope, three step sizes',
      setup: 'Suppose the slope is 10 and we want to go downhill.',
      steps: [
        'η = 0.001 → move 0.01. Safe, sleepy.',
        'η = 0.1 → move 1.0. A healthy stride on a gentle hill.',
        'η = 1.0 → move 10. We may jump clean over the valley and land higher than we started.',
      ],
      takeaway: 'The slope tells direction. The learning rate tells courage. You need both.',
    },
    tryThis: [
      'Set a tiny learning rate and count how many steps reach the bottom.',
      'Set a huge one and watch the ball ping-pong or fly away.',
    ],
    whenToUse: 'Every gradient-based trainer. It is the first knob to check when training looks “stuck” or “exploding.”',
    watchFor: 'A pretty loss that suddenly NaNs is often a learning rate that is too bold. Also pair it with scaling — unscaled features need tiny rates.',
    related: ['gradient-descent', 'learning-rate-schedules', 'adam', 'feature-scaling'],
    labLinks: [
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
      { label: 'Adam optimizer', route: '/ml/optimization/adam' },
    ],
    demo: { kind: 'learning-rate' },
    synonyms: ['lr', 'eta', 'step size', 'step length'],
    tags: ['hyperparameter', 'convergence', 'training'],
  },
  {
    slug: 'momentum',
    label: 'Momentum',
    category: 'optimization',
    badge: 'Beginner',
    blurb: 'Remember the last few steps so the walk keeps rolling through wrinkles in the hill.',
    analogy: 'A heavy ball rolling downhill does not stop for every pebble. It carries speed from earlier slopes.',
    hook: 'Plain gradient descent can zigzag in a long, skinny valley. Momentum adds memory so updates keep a consistent direction.',
    explanation: [
      'We keep a velocity: a running average of recent gradients. Each new step is a mix of “where the slope points now” and “where we were already going.”',
      'That damps the side-to-side jitter and speeds up the long downhill corridor.',
      'The usual mix is about 90% old velocity and 10% new slope (β ≈ 0.9).',
    ],
    formula: 'v \\leftarrow \\beta v + \\eta \\nabla L,\\quad \\theta \\leftarrow \\theta - v',
    formulaPlain: 'new speed = most of the old speed plus a bit of the new slope, then move that way',
    workedExample: {
      title: 'Zigzag valley',
      setup: 'The hill is steep left-right but gentle forward. Plain GD wiggles hard left and right.',
      steps: [
        'Step 1 goes a lot left. Velocity stores that left push.',
        'Step 2 the slope says right. Momentum only partly listens, so we do not fully reverse.',
        'After a few steps the left-right cancels out and the ball rolls down the long axis.',
      ],
      takeaway: 'Memory turns a nervous walk into a roll.',
    },
    tryThis: [
      'Turn momentum off and watch the zigzag.',
      'Turn it on and see the path straighten.',
    ],
    whenToUse: 'When the loss surface is a long valley, or when vanilla GD chatters. It is the parent of many modern optimizers.',
    watchFor: 'Too much momentum can overshoot the bottom and loop. Combine with a sensible learning rate.',
    related: ['gradient-descent', 'adam', 'learning-rate'],
    labLinks: [
      { label: 'Momentum optimizer', route: '/ml/optimization/momentum' },
      { label: 'Adam optimizer', route: '/ml/optimization/adam' },
    ],
    demo: { kind: 'momentum' },
    synonyms: ['heavy ball', 'velocity optimizer', 'nesterov'],
    tags: ['optimizer', 'velocity', 'oscillation'],
  },
  {
    slug: 'adam',
    label: 'Adam, RMSProp & AdaGrad',
    category: 'optimization',
    badge: 'Intermediate',
    blurb: 'Give every weight its own step size, using a memory of recent slopes.',
    analogy: 'Some streets are icy, some are gravel. Adaptive methods put a different shoe on each foot instead of one stride length for the whole hike.',
    hook: 'Adam is the default optimizer in a huge number of tutorials because it usually “just works” without heroic learning-rate tuning.',
    explanation: [
      'AdaGrad remembers the sum of squared slopes. Weights that have been updated a lot get smaller future steps. Great for sparse features, but the steps can shrink to zero.',
      'RMSProp uses a fading average of those squared slopes, so old history is forgotten. Steps stay alive.',
      'Adam mixes RMSProp with momentum: it tracks both the average slope (direction) and the average squared slope (how wild that direction is). Then it takes a calibrated step.',
    ],
    formula: '\\theta \\leftarrow \\theta - \\eta \\frac{\\hat{m}}{\\sqrt{\\hat{v}} + \\epsilon}',
    formulaPlain: 'move using a smoothed direction, divided by a smoothed “how bumpy has this weight been” number',
    workedExample: {
      title: 'Two weights, different personalities',
      setup: 'Weight A has noisy slopes like 8, −7, 9. Weight B has calm slopes like 0.2, 0.3, 0.1.',
      steps: [
        'Adam sees A as jumpy, so it shrinks A’s step.',
        'B looks calm, so it keeps a healthier step.',
        'One global learning rate still exists, but each weight gets a personal scaling on top.',
      ],
      takeaway: 'Adam is not magic. It is a polite automatic gearbox for step sizes.',
    },
    tryThis: [
      'Compare Adam with plain GD on the demo hill. Adam usually arrives with less drama.',
      'If Adam still diverges, the learning rate is still too large — adaptive is not invincible.',
    ],
    whenToUse: 'Default first try for deep nets, transformers, and messy real data. AdaGrad is still useful for sparse text features.',
    watchFor: 'Adam can generalize a bit worse than well-tuned SGD on some vision tasks. Also, a tiny epsilon is there so we never divide by zero.',
    related: ['momentum', 'learning-rate', 'sgd-mini-batch'],
    labLinks: [
      { label: 'Adam optimizer', route: '/ml/optimization/adam' },
      { label: 'SGD lab', route: '/ml/optimization/sgd' },
    ],
    demo: { kind: 'adam' },
    synonyms: ['adamw', 'rmsprop', 'adagrad', 'adaptive optimizer'],
    tags: ['optimizer', 'adaptive', 'moments'],
  },
  {
    slug: 'learning-rate-schedules',
    label: 'Learning-rate Schedules',
    category: 'optimization',
    badge: 'Intermediate',
    blurb: 'Start with brave steps, then take smaller ones as you near the answer.',
    analogy: 'Search a house with big strides in the hallway, then tiny steps once you are in the room looking for keys.',
    hook: 'A single learning rate for the whole training run is like one walking speed for a whole hike. Schedules change the pace.',
    explanation: [
      'Warmup starts small so a randomly initialized net does not explode on step one, then ramps up.',
      'Step decay multiplies the rate by 0.1 every few epochs. Cosine annealing smoothly eases it down. Reduce-on-plateau waits until the loss stops improving.',
      'The idea is the same: explore early, settle late.',
    ],
    formula: '\\eta_t = \\eta_0 \\cdot \\gamma^{\\lfloor t / s \\rfloor}',
    formulaPlain: 'every few steps, multiply the learning rate by a number smaller than 1',
    workedExample: {
      title: 'Step decay',
      setup: 'Start at η = 0.1. Every 10 epochs, multiply by 0.1.',
      steps: [
        'Epochs 1–10: 0.1 — big, searching steps.',
        'Epochs 11–20: 0.01 — refining.',
        'Epochs 21–30: 0.001 — polishing the last decimals.',
      ],
      takeaway: 'The schedule is a story: hunt, then settle.',
    },
    tryThis: [
      'Watch the demo rate fall over time and see the ball stop bouncing.',
      'Compare a constant high rate with a decaying one.',
    ],
    whenToUse: 'Long training runs, transformers (warmup + cosine), and any time the loss chatters near the end.',
    watchFor: 'Decay too early and you freeze a half-trained model. Decay too late and you waste time oscillating.',
    related: ['learning-rate', 'adam', 'early-stopping'],
    labLinks: [
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
      { label: 'Training visualizations', route: '/ml/lab/training-visualizations' },
    ],
    demo: { kind: 'schedule' },
    synonyms: ['lr decay', 'cosine annealing', 'warmup', 'reduce on plateau'],
    tags: ['schedule', 'warmup', 'decay'],
  },
  {
    slug: 'gradient-clipping',
    label: 'Gradient Clipping',
    category: 'optimization',
    badge: 'Intermediate',
    blurb: 'Cap huge slopes so one wild step cannot blow up the network.',
    analogy: 'A speed limiter on a car. You can still drive, but you cannot instantly hit 400 km/h because one hill was steep.',
    hook: 'Sometimes a batch produces a gigantic gradient. Without a cap, that one update can send weights to NaN. Clipping says “this step may be large, but not that large.”',
    explanation: [
      'Value clipping chops each number to a range, say −1 to 1. Norm clipping shrinks the whole gradient vector if its length is above a max, keeping its direction.',
      'RNNs and deep stacks love this because they are famous for exploding gradients.',
      'Clipping does not fix a bad learning rate forever. It is a safety belt, not a driving lesson.',
    ],
    formula: 'g \\leftarrow g \\cdot \\min\\!\\left(1, \\frac{c}{\\|g\\|}\\right)',
    formulaPlain: 'if the slope-vector is longer than the speed limit, shrink it so it just meets the limit',
    workedExample: {
      title: 'Norm clip at 1.0',
      setup: 'The gradient is [3, 4]. Its length is 5.',
      steps: [
        '5 is bigger than the cap 1, so we multiply by 1/5.',
        'New gradient: [0.6, 0.8]. Length is now 1. Direction is unchanged.',
        'The update is still “that way,” just not a cannon shot.',
      ],
      takeaway: 'Keep the compass. Shorten the stride.',
    },
    tryThis: [
      'Turn clipping off and watch an exploding step.',
      'Turn it on and see the same direction, safer size.',
    ],
    whenToUse: 'RNNs, LSTMs, GRUs, very deep nets, mixed-precision training, or any loss that occasionally spikes.',
    watchFor: 'A tiny clip value can stall learning. If you clip every single step, the learning rate is probably too high.',
    related: ['vanishing-exploding', 'gradient-descent', 'learning-rate'],
    labLinks: [
      { label: 'RNN lab', route: '/ml/deep-learning/rnn' },
      { label: 'LSTM lab', route: '/ml/deep-learning/lstm' },
    ],
    demo: { kind: 'clipping' },
    synonyms: ['clip grad', 'grad clip', 'max grad norm'],
    tags: ['stability', 'exploding', 'rnn'],
  },
  {
    slug: 'local-minima',
    label: 'Local Minima & Saddle Points',
    category: 'optimization',
    badge: 'Intermediate',
    blurb: 'Not every valley is the deepest one. Some “bottoms” are just flat ridges.',
    analogy: 'A foggy mountain range. You can walk downhill into a small pond and think you found the ocean. A saddle is a mountain pass: downhill one way, uphill the other.',
    hook: 'People worry about local minima. In modern deep nets, saddles — flat spots that fool the slope — are often the bigger nuisance.',
    explanation: [
      'A local minimum is a bowl. Every nearby direction goes up. You can be stuck even if a deeper bowl exists elsewhere.',
      'A saddle is like a horse saddle or a mountain pass: two directions go down, two go up. The gradient can be almost zero even though escape routes exist.',
      'SGD noise, momentum, and just having many dimensions make true terrible local minima less common than textbooks from 1995 suggested. Still, the picture helps you read a stuck loss curve.',
    ],
    formula: '\\nabla L = 0 \\text{ does not always mean “best answer”}',
    formulaPlain: 'a zero slope can mean a bowl, a peak, or a mountain pass',
    workedExample: {
      title: 'z = x² − y²',
      setup: 'At (0, 0) the slope is zero.',
      steps: [
        'Move along x and the surface goes up. Looks like a minimum.',
        'Move along y and the surface goes down. Looks like a maximum.',
        'Together it is a saddle. Standing still there is not “done.”',
      ],
      takeaway: 'Flat gradient ≠ finished. Ask whether every nearby path goes up.',
    },
    tryThis: [
      'In the demo, land in the small bowl, then give the ball a noisy shove.',
      'Find the saddle and see how a tiny sideways push escapes.',
    ],
    whenToUse: 'When training stalls with a still-high loss. Also when explaining why random restarts or SGD noise can help.',
    watchFor: 'Do not assume a stuck run is a local minimum. Check learning rate, data bugs, and dead ReLUs first.',
    related: ['gradient-descent', 'sgd-mini-batch', 'momentum'],
    labLinks: [
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
      { label: 'Bias-variance', route: '/ml/evaluation/bias-variance-tradeoff' },
    ],
    demo: { kind: 'saddle' },
    synonyms: ['saddle point', 'local min', 'nonconvex', 'critical point'],
    tags: ['loss surface', 'nonconvex', 'convergence'],
  },
  {
    slug: 'relu',
    label: 'ReLU',
    category: 'activations',
    badge: 'Beginner',
    blurb: 'Keep positive numbers. Turn negatives into zero. The default hidden-layer switch.',
    analogy: 'A one-way door. Good news (positive) walks through unchanged. Bad news (negative) is stopped at the door.',
    hook: 'ReLU means Rectified Linear Unit. It is the activation most beginners meet first because it is simple and it trains well.',
    explanation: [
      'The rule is: if x > 0, output x. If x ≤ 0, output 0. That tiny kink is enough to let a stack of layers draw curves, not just straight lines.',
      'Why not sigmoid for everything? Sigmoid squishes big numbers into a flat tail, so the slope becomes almost zero and learning dies. ReLU’s positive side has slope 1. Signals stay loud.',
      'The catch is the “dead ReLU”: if a neuron is always negative, it outputs 0 forever and stops learning. Leaky ReLU is the patch.',
    ],
    formula: 'f(x) = \\max(0, x)',
    formulaPlain: 'output the number if it is positive, otherwise output zero',
    workedExample: {
      title: 'Five incoming scores',
      setup: 'A neuron receives −3, −0.2, 0, 1.5, 4.',
      steps: [
        'ReLU turns them into 0, 0, 0, 1.5, 4.',
        'Only the last two neurons “fire.” The first three are silent.',
        'If those silent ones stay silent on every example, they are dead and need a new start or a leak.',
      ],
      takeaway: 'ReLU is a light switch with a dimmer only on the bright side.',
    },
    tryThis: [
      'Hover along the ReLU line. Left of zero is flat. Right of zero is a ramp.',
      'Compare the derivative: 0 on the left, 1 on the right.',
    ],
    whenToUse: 'Default hidden activation for MLPs and CNNs. Fast, simple, strong.',
    watchFor: 'Dead neurons after a wild learning rate. Also, ReLU is not centered at zero, so later layers see only non-negative values.',
    related: ['leaky-relu', 'sigmoid', 'gelu-swish', 'vanishing-exploding'],
    labLinks: [
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
    ],
    demo: { kind: 'activation', variant: 'relu' },
    synonyms: ['rectified linear unit', 'rectifier'],
    tags: ['activation', 'nonlinearity', 'hidden layer'],
  },
  {
    slug: 'leaky-relu',
    label: 'Leaky ReLU & PReLU',
    category: 'activations',
    badge: 'Beginner',
    blurb: 'Like ReLU, but negatives leak a little instead of dying at zero.',
    analogy: 'A sink that never fully closes. Most water still stops, but a drip remains so the pipe does not rust shut.',
    hook: 'Dead ReLUs scared people into inventing a leak: a tiny slope on the negative side so the neuron can still whisper a gradient.',
    explanation: [
      'Leaky ReLU uses a small fixed slope, often 0.01, for negative inputs. PReLU lets the network learn that slope.',
      'The leak is small on purpose. We still want most negative junk to stay quiet. We just refuse to cut the wire completely.',
      'If ReLU is working, you do not have to switch. Reach for a leak when many hidden units sit at zero.',
    ],
    formula: 'f(x) = x \\text{ if } x>0,\\; 0.01x \\text{ otherwise}',
    formulaPlain: 'positives pass through; negatives are shrunk, not deleted',
    workedExample: {
      title: 'Same five scores as ReLU',
      setup: 'Inputs: −3, −0.2, 0, 1.5, 4. Leak = 0.01.',
      steps: [
        'Outputs: −0.03, −0.002, 0, 1.5, 4.',
        'The negatives are tiny, but not zero. A gradient can still flow.',
        'Next update can push that neuron back into the useful region.',
      ],
      takeaway: 'A whisper of slope keeps the student from falling asleep.',
    },
    tryThis: [
      'Compare ReLU and leaky ReLU on the same x. The left side is no longer a dead floor.',
      'Imagine a learning-rate explosion: leaky ReLU is more likely to recover.',
    ],
    whenToUse: 'When ReLU units die, or as a cheap default if you want a bit more robustness.',
    watchFor: 'A huge leak (like 0.5) makes the layer almost linear again. Keep it small unless you are using PReLU and watching validation.',
    related: ['relu', 'softplus-elu', 'gelu-swish'],
    labLinks: [
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
    ],
    demo: { kind: 'activation', variant: 'leaky-relu' },
    synonyms: ['lrelu', 'prelu', 'parametric relu'],
    tags: ['activation', 'dead relu', 'leak'],
  },
  {
    slug: 'sigmoid',
    label: 'Sigmoid',
    category: 'activations',
    badge: 'Beginner',
    blurb: 'Squash any number into a probability between 0 and 1.',
    analogy: 'A volume knob that can never go below mute or above max. Huge scores still land near 1. Huge negative scores land near 0.',
    hook: 'Sigmoid is the classic S-curve. Logistic regression is basically “a linear score, then a sigmoid.”',
    explanation: [
      'The formula is 1 / (1 + e^(−x)). At 0 it outputs 0.5. Large positive x approaches 1. Large negative x approaches 0.',
      'That makes it perfect for a yes/no probability. It is a weaker choice for deep hidden layers because the tails are almost flat — the gradient vanishes.',
      'If you have three or more classes, use softmax instead of a pile of independent sigmoids (unless the labels can overlap).',
    ],
    formula: '\\sigma(x) = \\frac{1}{1+e^{-x}}',
    formulaPlain: 'stretch any score onto a 0-to-1 probability slider',
    workedExample: {
      title: 'Spam score to chance of spam',
      setup: 'A linear model outputs raw scores −2, 0, and 3.',
      steps: [
        'σ(−2) ≈ 0.12 → about 12% chance of spam.',
        'σ(0) = 0.50 → a coin flip.',
        'σ(3) ≈ 0.95 → almost sure spam.',
      ],
      takeaway: 'The model still thinks in “scores.” Sigmoid translates the score into a sentence a human can use.',
    },
    tryThis: [
      'Drag x far left and right. Notice how the curve flattens. That flatness is vanishing gradient.',
      'Compare with tanh, which is a taller S centered at zero.',
    ],
    whenToUse: 'Binary classification outputs, gates inside LSTM/GRU, and any time you need a single probability.',
    watchFor: 'Do not stack many hidden sigmoids. The network will struggle to learn. Prefer ReLU in the middle.',
    related: ['tanh', 'softmax', 'binary-cross-entropy', 'vanishing-exploding'],
    labLinks: [
      { label: 'Logistic regression', route: '/ml/supervised/logistic-regression' },
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
    ],
    demo: { kind: 'activation', variant: 'sigmoid' },
    synonyms: ['logistic function', 'expit', 's-curve'],
    tags: ['activation', 'probability', 'binary'],
  },
  {
    slug: 'tanh',
    label: 'Tanh',
    category: 'activations',
    badge: 'Beginner',
    blurb: 'An S-curve like sigmoid, but centered at zero, from −1 to 1.',
    analogy: 'A see-saw instead of a ramp from 0 to 1. Answers can lean left (negative) or right (positive).',
    hook: 'Tanh is sigmoid’s sibling. Hidden layers often like it better than sigmoid because the average output can sit near zero.',
    explanation: [
      'Outputs live in (−1, 1). Negative inputs can stay negative. That helps later layers see a balanced signal.',
      'The tails still flatten, so deep tanh stacks can vanish. That is why ReLU took over for plain feed-forward nets.',
      'RNNs, LSTMs, and GRUs still use tanh for candidate hidden states because a bounded, zero-centered memory is handy.',
    ],
    formula: '\\tanh(x) = \\frac{e^{x}-e^{-x}}{e^{x}+e^{-x}}',
    formulaPlain: 'squash a number into a range from −1 to 1, with 0 in the middle',
    workedExample: {
      title: 'Same scores as sigmoid',
      setup: 'Inputs −2, 0, 3.',
      steps: [
        'tanh(−2) ≈ −0.96 — strongly negative.',
        'tanh(0) = 0 — neutral.',
        'tanh(3) ≈ 0.995 — strongly positive.',
      ],
      takeaway: 'Same S-shape, different floor and ceiling. Zero means “no opinion.”',
    },
    tryThis: [
      'Compare tanh and sigmoid on the plot. Tanh is taller and crosses the origin.',
      'Notice both flatten far from zero — both can starve gradients in a deep stack.',
    ],
    whenToUse: 'RNN hidden states, older MLPs, and any time you want a bounded, signed activation.',
    watchFor: 'Saturation. If inputs are huge before tanh, you get ±1 and almost no learning.',
    related: ['sigmoid', 'relu', 'neuron'],
    labLinks: [
      { label: 'GRU lab', route: '/ml/deep-learning/gru' },
      { label: 'LSTM lab', route: '/ml/deep-learning/lstm' },
    ],
    demo: { kind: 'activation', variant: 'tanh' },
    synonyms: ['hyperbolic tangent', 'tanh activation'],
    tags: ['activation', 'zero-centered', 'rnn'],
  },
  {
    slug: 'softmax',
    label: 'Softmax',
    category: 'activations',
    badge: 'Beginner',
    blurb: 'Turn a list of raw scores into probabilities that add up to 1.',
    analogy: 'Three contestants get scores. Softmax turns those scores into vote shares so the room adds to 100%.',
    hook: 'A classifier does not output “cat” directly. It outputs three numbers like 2.0, 1.0, 0.1. Softmax makes them 0.66, 0.24, 0.10.',
    explanation: [
      'We raise e to each score (so bigger scores grow faster), then divide by the total. That forces a valid probability distribution.',
      'Temperature T softens or sharpens the votes. High T makes everyone look equal. Low T makes the winner take almost everything.',
      'Softmax is paired with cross-entropy loss. Together they punish a model that is confidently wrong.',
    ],
    formula: 'p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}',
    formulaPlain: 'make each score positive with e^score, then share them out so they add to 1',
    workedExample: {
      title: 'Cat, dog, bird',
      setup: 'Raw scores (logits): cat 2.0, dog 1.0, bird 0.1. Temperature 1.',
      steps: [
        'e² ≈ 7.39, e¹ ≈ 2.72, e^{0.1} ≈ 1.11. Total ≈ 11.22.',
        'Probabilities: 7.39/11.22 ≈ 66% cat, 24% dog, 10% bird.',
        'If we raise cat to 5, it swallows almost all of the probability.',
      ],
      takeaway: 'Softmax is a polite argument: the loudest score gets the biggest slice, but everyone gets something.',
    },
    tryThis: [
      'Move the three sliders. Watch the bars always sum to 100%.',
      'Raise temperature. The bars flatten. Lower it. One bar dominates.',
    ],
    whenToUse: 'Last layer of any single-label multiclass model: digits, animals, next-token prediction.',
    watchFor: 'Numerically, e^big_number overflows. Libraries subtract the max logit first. Also, softmax is not for overlapping labels — use sigmoids there.',
    related: ['categorical-cross-entropy', 'sigmoid', 'dot-product'],
    labLinks: [
      { label: 'Multinomial logistic', route: '/ml/supervised/multinomial-logistic-regression' },
      { label: 'Image classification', route: '/ml/computer-vision/image-classification' },
    ],
    demo: { kind: 'softmax' },
    synonyms: ['soft max', 'normalized exponential', 'logits to probabilities'],
    tags: ['activation', 'multiclass', 'temperature', 'logits'],
  },
  {
    slug: 'gelu-swish',
    label: 'GELU, Swish & SiLU',
    category: 'activations',
    badge: 'Intermediate',
    blurb: 'Smooth, modern ReLU cousins used in transformers.',
    analogy: 'ReLU is a sharp corner. GELU is that corner sanded down, so the door eases shut instead of slamming.',
    hook: 'BERT, GPT-style blocks, and many modern MLPs swapped ReLU for GELU or Swish. They keep ReLU’s “ignore the junk” idea but stay smooth.',
    explanation: [
      'GELU multiplies x by the chance that a normal random number is below x. Negatives mostly vanish, but not with a hard corner.',
      'Swish / SiLU is x · sigmoid(x). Near zero it is a smooth dip. For large positive x it behaves like ReLU.',
      'Smoothness helps optimization. The extra multiply costs a bit more than ReLU, which is why mobile CNNs sometimes stay with ReLU.',
    ],
    formula: '\\mathrm{SiLU}(x) = x \\cdot \\sigma(x)',
    formulaPlain: 'multiply the number by its own sigmoid, so negatives fade instead of clipping',
    workedExample: {
      title: 'x = −1, 0, 2',
      setup: 'Compare ReLU and SiLU.',
      steps: [
        'ReLU: 0, 0, 2.',
        'SiLU(−1) ≈ −0.27, SiLU(0) = 0, SiLU(2) ≈ 1.76.',
        'The negative side is a soft scoop, not a wall. Gradients still exist.',
      ],
      takeaway: 'Modern activations keep a little of the negative signal instead of a hard zero.',
    },
    tryThis: [
      'Overlay GELU and ReLU in the demo. The difference is the rounded knee near zero.',
      'Ask: would a sharp corner or a smooth one be easier to roll a ball over?',
    ],
    whenToUse: 'Transformers, modern MLPs, and anytime you can afford a slightly fancier activation.',
    watchFor: 'Not a miracle. A bad learning rate still fails. Use the library version — home-grown GELU is easy to get slightly wrong.',
    related: ['relu', 'sigmoid', 'softplus-elu'],
    labLinks: [
      { label: 'Transformer attention', route: '/ml/deep-learning/transformer-attention' },
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
    ],
    demo: { kind: 'activation', variant: 'gelu' },
    synonyms: ['swish', 'silu', 'gaussian error linear unit'],
    tags: ['activation', 'transformer', 'smooth'],
  },
  {
    slug: 'softplus-elu',
    label: 'Softplus & ELU',
    category: 'activations',
    badge: 'Intermediate',
    blurb: 'Smooth ReLU-like curves that never slam into a hard zero.',
    analogy: 'A skateboard ramp instead of a curb. You still go up on the right, but the left side is a gentle bowl.',
    hook: 'Softplus is a smooth “always positive” curve. ELU lets negatives sit near a negative floor so the layer can stay closer to zero-centered.',
    explanation: [
      'Softplus(x) = log(1 + e^x). It looks like ReLU from far away, but it is curved near zero. Its derivative is a sigmoid.',
      'ELU uses x when x > 0 and α(e^x − 1) when x ≤ 0. Negatives approach −α instead of 0.',
      'These were popular ReLU alternatives before GELU became the transformer default.',
    ],
    formula: '\\mathrm{softplus}(x) = \\log(1+e^{x})',
    formulaPlain: 'a smooth ramp that is never quite zero and grows like x when x is large',
    workedExample: {
      title: 'x = −2 and x = 2',
      setup: 'Softplus and ReLU side by side.',
      steps: [
        'ReLU(−2) = 0, ReLU(2) = 2.',
        'Softplus(−2) ≈ 0.13, Softplus(2) ≈ 2.13.',
        'Softplus never outputs a hard zero, so a tiny gradient always exists.',
      ],
      takeaway: 'Smooth ramps trade a bit of speed for fewer “stuck at zero” neurons.',
    },
    tryThis: [
      'Zoom near zero. Softplus is rounded; ReLU is a corner.',
      'ELU’s left side sits below zero — that is the zero-centering trick.',
    ],
    whenToUse: 'When you want ReLU behavior without dead units, or when you need a smooth always-positive transform (softplus).',
    watchFor: 'Softplus is slower than ReLU. For most new feed-forward nets, ReLU or GELU is the simpler default.',
    related: ['relu', 'leaky-relu', 'gelu-swish'],
    labLinks: [
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
    ],
    demo: { kind: 'activation', variant: 'softplus' },
    synonyms: ['elu', 'selu', 'smooth relu'],
    tags: ['activation', 'smooth', 'elu'],
  },
  {
    slug: 'mse-mae-huber',
    label: 'MSE, MAE & Huber',
    category: 'losses',
    badge: 'Beginner',
    blurb: 'Three ways to score “how far was the number guess.”',
    analogy: 'Grading a dart throw. MAE is the distance from the bullseye. MSE is that distance squared — so a wild miss looks extra bad. Huber is MAE for far darts and MSE for near ones.',
    hook: 'If the target is a number — price, temperature, age — you need a regression loss. These three are the starter kit.',
    explanation: [
      'MAE (mean absolute error) is the average |guess − truth|. Easy to read: “we are off by 3 degrees.” Outliers do not dominate.',
      'MSE (mean squared error) squares the gap first. A miss of 10 costs 100, not 10. The math is smooth and the gradient is 2 × error, which training likes. Outliers yank the model hard.',
      'Huber is the mix: square small errors, treat huge errors like MAE so one broken sensor does not ruin the fit.',
    ],
    formula: '\\mathrm{MSE} = \\frac{1}{n}\\sum (y - \\hat{y})^2',
    formulaPlain: 'average of the squared gaps between the true number and the guess',
    workedExample: {
      title: 'Three houses',
      setup: 'Truth: 200, 220, 800. Guess: 210, 210, 230. That last house is an outlier.',
      steps: [
        'Errors: −10, 10, 570. MAE = (10 + 10 + 570) / 3 = 196.7.',
        'MSE = (100 + 100 + 324900) / 3 ≈ 108,367. The 570 swallows the story.',
        'Huber would treat 570 more like a linear miss, so the model still cares about the first two houses.',
      ],
      takeaway: 'Pick MSE when big misses must scream. Pick MAE or Huber when a few wild points should not run the class.',
    },
    tryThis: [
      'In the demo, drag one residual huge and watch MSE explode while MAE stays calm.',
      'Ask which loss you would want for house prices with a palace in the set.',
    ],
    whenToUse: 'Any numeric target. MSE is the default. MAE/Huber when the data has monsters.',
    watchFor: 'Units: MSE is in squared dollars or squared degrees. RMSE (square root of MSE) talks in the original units.',
    related: ['overfitting', 'feature-scaling', 'huber-note'],
    labLinks: [
      { label: 'Regression metrics', route: '/ml/evaluation/regression-metrics' },
      { label: 'Simple linear regression', route: '/ml/supervised/simple-linear-regression' },
    ],
    demo: { kind: 'loss-compare' },
    synonyms: ['mean squared error', 'l2 loss', 'mean absolute error', 'l1 loss', 'huber loss'],
    tags: ['loss', 'regression', 'outliers'],
  },
  {
    slug: 'binary-cross-entropy',
    label: 'Binary Cross-Entropy',
    category: 'losses',
    badge: 'Beginner',
    blurb: 'Punish a yes/no model that is confidently wrong.',
    analogy: 'A weather app says “99% chance of sun” and it pours. That lie should cost more than a shy “55% sun.”',
    hook: 'After sigmoid gives a probability p that the answer is yes, binary cross-entropy asks how surprised the truth is.',
    explanation: [
      'If the true label is 1 (yes), the loss is −log(p). If p is 0.9, the loss is small. If p is 0.01, −log(0.01) is large. Confidence in the wrong answer is expensive.',
      'If the true label is 0, the loss is −log(1 − p). Same idea from the other side.',
      'This pairs with a sigmoid output. Using MSE on probabilities is possible, but it learns more slowly when the model is very wrong.',
    ],
    formula: 'L = -[y\\log p + (1-y)\\log(1-p)]',
    formulaPlain: 'if it was yes, score −log(guessed yes-probability); if no, score −log(guessed no-probability)',
    workedExample: {
      title: 'Was this email spam?',
      setup: 'The email is spam (y = 1). Model says p = 0.2.',
      steps: [
        'Loss = −log(0.2) ≈ 1.61. A bad, confident-ish miss.',
        'If p = 0.8, loss = −log(0.8) ≈ 0.22. Much kinder.',
        'If p = 0.01, loss ≈ 4.6. The model was almost sure — and wrong.',
      ],
      takeaway: 'Cross-entropy cares about honesty. Being unsure is cheaper than being loudly wrong.',
    },
    tryThis: [
      'Slide the predicted probability. Watch the loss explode near 0 when the truth is 1.',
      'Compare a 50/50 shrug with a 99% wrong answer.',
    ],
    whenToUse: 'Any two-class problem: spam, fraud, click, disease present/absent.',
    watchFor: 'p = 0 or 1 makes log(0). Libraries clip probabilities. Also match it with a sigmoid, not a raw unbounded score.',
    related: ['sigmoid', 'categorical-cross-entropy', 'softmax'],
    labLinks: [
      { label: 'Logistic regression', route: '/ml/supervised/logistic-regression' },
      { label: 'ROC & AUC', route: '/ml/evaluation/roc-auc' },
    ],
    demo: { kind: 'cross-entropy', variant: 'binary' },
    synonyms: ['log loss', 'bce', 'binary log loss'],
    tags: ['loss', 'classification', 'probability'],
  },
  {
    slug: 'categorical-cross-entropy',
    label: 'Categorical Cross-Entropy',
    category: 'losses',
    badge: 'Beginner',
    blurb: 'The multiclass version of log loss: how surprised were we by the true class?',
    analogy: 'A quiz with four answers. You put 70% on B. The teacher wanted C. The more you piled onto the wrong letter, the worse the grade.',
    hook: 'Softmax gives a probability for every class. Categorical cross-entropy looks only at the probability of the true class and takes −log of that.',
    explanation: [
      'If the true class had probability 0.8, loss is small. If it had 0.05, loss is large. The other probabilities matter only because they stole mass from the truth.',
      'Sparse cross-entropy is the same math when the label is an index (2) instead of a one-hot vector ([0, 0, 1]).',
      'This is the default loss for digit classification, language next-token prediction, and most single-label classifiers.',
    ],
    formula: 'L = -\\log p_{\\text{true class}}',
    formulaPlain: 'look at the probability you gave the correct answer, then take −log of it',
    workedExample: {
      title: 'Digit 3',
      setup: 'Softmax says P(0)…P(9). The true digit is 3 with p₃ = 0.25.',
      steps: [
        'Loss = −log(0.25) ≈ 1.39.',
        'If the model had put 0.80 on 3, loss ≈ 0.22.',
        'If it put 0.80 on 8 and 0.02 on 3, loss ≈ 3.91. Loud and wrong.',
      ],
      takeaway: 'You are graded on the slice you gave the truth, not on how pretty the other slices look.',
    },
    tryThis: [
      'In the demo, steal probability from the true class and watch the loss climb.',
      'Give the true class 95% and see the loss almost vanish.',
    ],
    whenToUse: 'Any single-label multiclass task with a softmax head.',
    watchFor: 'Do not pair softmax with binary cross-entropy. Do not one-hot encode and then also use a sparse loss without knowing which API you called.',
    related: ['softmax', 'binary-cross-entropy', 'one-hot'],
    labLinks: [
      { label: 'Multinomial logistic', route: '/ml/supervised/multinomial-logistic-regression' },
      { label: 'Confusion matrix', route: '/ml/evaluation/confusion-matrix' },
    ],
    demo: { kind: 'cross-entropy', variant: 'categorical' },
    synonyms: ['multiclass log loss', 'nll', 'sparse categorical crossentropy'],
    tags: ['loss', 'multiclass', 'softmax'],
  },
  {
    slug: 'hinge-loss',
    label: 'Hinge Loss',
    category: 'losses',
    badge: 'Intermediate',
    blurb: 'Not just “right or wrong” — demand a safety margin around the decision line.',
    analogy: 'A hiking path along a cliff. Being on the path is not enough. The teacher wants you a full meter from the edge.',
    hook: 'Support vector machines popularized hinge loss. A correct answer that is barely correct still pays a fee.',
    explanation: [
      'For a label y = ±1 and a score s, hinge is max(0, 1 − y·s). If y·s ≥ 1, you are correct with margin and the loss is 0.',
      'If you are correct but close to the line, you still get a small loss. If you are wrong, the loss grows linearly.',
      'Unlike cross-entropy, hinge does not output probabilities. It outputs a “keep away from the fence” rule.',
    ],
    formula: 'L = \\max(0, 1 - y \\cdot s)',
    formulaPlain: 'if the score is on the correct side by at least 1, the loss is zero; otherwise you pay the shortfall',
    workedExample: {
      title: 'Two emails',
      setup: 'Spam is y = +1. Ham is y = −1.',
      steps: [
        'Spam email, score 2.0. y·s = 2 ≥ 1. Loss 0. Comfortably spam.',
        'Spam email, score 0.2. y·s = 0.2. Loss = 0.8. Right, but hugging the fence.',
        'Spam email, score −1.0. Loss = 2. Wrong side.',
      ],
      takeaway: 'Hinge wants a buffer, not a photo-finish.',
    },
    tryThis: [
      'Slide the score across zero. Loss is zero only after you pass the margin of +1.',
      'Compare with a probability loss: hinge does not care about 99% vs 80% once the margin is met.',
    ],
    whenToUse: 'SVMs and some ranking models. Great when you want a crisp boundary with a margin.',
    watchFor: 'No natural probability. If you need “32% chance,” use a logistic / cross-entropy model.',
    related: ['binary-cross-entropy', 'mse-mae-huber'],
    labLinks: [
      { label: 'SVM classification', route: '/ml/supervised/svm-classification' },
      { label: 'SVR', route: '/ml/supervised/support-vector-regression' },
    ],
    demo: { kind: 'hinge' },
    synonyms: ['svm loss', 'margin loss', 'max margin'],
    tags: ['loss', 'svm', 'margin'],
  },
  {
    slug: 'kl-divergence',
    label: 'KL Divergence',
    category: 'losses',
    badge: 'Intermediate',
    blurb: 'How surprised would you be if you believed Q but the world was really P?',
    analogy: 'You packed for the weather forecast (Q). The real weather is P. KL is the extra clothes you wish you had brought.',
    hook: 'KL divergence compares two probability distributions. It is not a distance — it is not even symmetric. KL(P‖Q) ≠ KL(Q‖P).',
    explanation: [
      'If P and Q agree, KL is 0. If Q puts almost no mass where P is common, KL is huge. That is “you never expected this.”',
      'Cross-entropy = entropy(P) + KL(P‖Q). So when P is the one-hot true class, minimizing cross-entropy is the same as pushing Q toward P.',
      'VAEs, knowledge distillation, and some attention regularizers use KL to keep a learned distribution close to a prior.',
    ],
    formula: 'D_{KL}(P\\|Q) = \\sum_i P_i \\log\\frac{P_i}{Q_i}',
    formulaPlain: 'for each bucket, take how often it really happens times log(reality / your belief), then add them up',
    workedExample: {
      title: 'Two coin stories',
      setup: 'True coin P is 70% heads. Your model Q says 50% heads.',
      steps: [
        'KL ≈ 0.7 log(0.7/0.5) + 0.3 log(0.3/0.5) ≈ 0.082.',
        'If Q says 10% heads, KL jumps — you almost never expected the common event.',
        'If Q = P, KL is 0. Perfect match.',
      ],
      takeaway: 'KL is “how many extra bits of surprise your story costs.”',
    },
    tryThis: [
      'Move Q toward P and watch KL fall to zero.',
      'Swap P and Q in your head: the number changes. That is why it is not a distance.',
    ],
    whenToUse: 'When both sides are distributions: VAEs, distillation, language-model calibration, attention priors.',
    watchFor: 'Q_i = 0 where P_i > 0 is infinite surprise. Libraries add epsilon. Also do not treat KL like accuracy.',
    related: ['categorical-cross-entropy', 'softmax'],
    labLinks: [
      { label: 'Autoencoder', route: '/ml/dimensionality-reduction/autoencoder' },
      { label: 'Gaussian mixture', route: '/ml/clustering/gaussian-mixture-model' },
    ],
    demo: { kind: 'kl' },
    synonyms: ['kullback leibler', 'relative entropy', 'kl div'],
    tags: ['loss', 'distribution', 'information'],
  },
  {
    slug: 'contrastive-triplet',
    label: 'Contrastive & Triplet Loss',
    category: 'losses',
    badge: 'Intermediate',
    blurb: 'Pull twins together in embedding space. Push strangers apart.',
    analogy: 'A seating chart. Friends sit close. Strangers sit far. The loss yells if two friends are across the room or two strangers share a chair.',
    hook: 'Face recognition and search do not always predict a class name. They learn a map where similar items land nearby.',
    explanation: [
      'Contrastive loss uses pairs: same class should have small distance, different class should have distance above a margin.',
      'Triplet loss uses three points: an anchor, a positive (same identity), and a negative (different). We want d(anchor, positive) + margin < d(anchor, negative).',
      'The output is an embedding vector, not a softmax class. Later you compare vectors with cosine or Euclidean distance.',
    ],
    formula: 'L = \\max\\big(0,\\; d(a,p) - d(a,n) + m\\big)',
    formulaPlain: 'if the stranger is not farther than the friend by a safety margin, pay the difference',
    workedExample: {
      title: 'Three face photos',
      setup: 'Anchor and positive are you. Negative is a stranger. Margin m = 1.',
      steps: [
        'd(you, you-other-photo) = 0.4. d(you, stranger) = 0.9.',
        '0.4 − 0.9 + 1 = 0.5 > 0, so we still pay 0.5. The stranger is not far enough.',
        'If the stranger sits at distance 2.0, 0.4 − 2.0 + 1 < 0, loss is 0. Good seating.',
      ],
      takeaway: 'These losses teach geometry, not class names.',
    },
    tryThis: [
      'In the demo, drag the negative closer and watch the loss turn on.',
      'Push it past the margin and the loss goes quiet.',
    ],
    whenToUse: 'Face verify, image retrieval, contrastive pretraining, metric learning.',
    watchFor: 'Triplet mining is the hard part. Random triplets are often too easy (loss already zero) and teach nothing.',
    related: ['mse-mae-huber', 'dot-product', 'norms'],
    labLinks: [
      { label: 'Word embedding', route: '/ml/nlp/word-embedding-concept' },
      { label: 'Few-shot learning', route: '/ml/deep-learning/few-shot-learning' },
    ],
    demo: { kind: 'contrastive' },
    synonyms: ['triplet loss', 'contrastive loss', 'metric learning', 'siamese'],
    tags: ['loss', 'embedding', 'similarity'],
  },
  {
    slug: 'l1-l2',
    label: 'L1 & L2 Regularization',
    category: 'regularization',
    badge: 'Beginner',
    blurb: 'Tax large weights so the model cannot rely on one wild feature.',
    analogy: 'L2 is a volume knob tax: every loud weight pays. L1 is a “do you even need this microphone?” tax that can mute a weight to exactly zero.',
    hook: 'A model with huge coefficients can fit the training set by shouting. Regularization adds a fee for shouting.',
    explanation: [
      'L2 (Ridge) adds the sum of squared weights to the loss. Weights shrink toward zero but usually stay alive.',
      'L1 (Lasso) adds the sum of absolute weights. Some weights hit exactly zero, so you get a smaller, sparser story.',
      'Elastic Net mixes both. The strength is λ (or alpha). Too much λ and the model becomes shy and underfits.',
    ],
    formula: 'L_{\\text{total}} = L_{\\text{data}} + \\lambda \\|w\\|_p',
    formulaPlain: 'training error plus a tax on the size of the weights',
    workedExample: {
      title: 'Two features, one is noise',
      setup: 'Houses: size (useful) and a random ID number (useless).',
      steps: [
        'Without a tax, the model may give the ID a huge coefficient to memorize rows.',
        'L2 shrinks that coefficient. The ID still whispers.',
        'L1 can zero it. The story becomes “price from size,” which is what we wanted.',
      ],
      takeaway: 'The tax is not about morality. It is about making the simple explanation cheaper than the memorizing one.',
    },
    tryThis: [
      'Raise λ in your head and imagine every slope getting timid.',
      'Ask which features you would like L1 to fire.',
    ],
    whenToUse: 'Linear models with many features, correlated features (L2), or a need for a short feature list (L1).',
    watchFor: 'Scale features first. Otherwise you tax “meters” and “millimeters” as if they were the same crime. See also weight decay — same idea for neural nets.',
    related: ['weight-decay', 'feature-scaling', 'overfitting'],
    labLinks: [
      { label: 'Ridge regression', route: '/ml/supervised/ridge-regression' },
      { label: 'Lasso regression', route: '/ml/supervised/lasso-regression' },
    ],
    demo: { kind: 'weight-decay', variant: 'l1l2' },
    synonyms: ['ridge', 'lasso', 'elastic net', 'weight penalty'],
    tags: ['regularization', 'sparsity', 'shrinkage'],
  },
  {
    slug: 'dropout',
    label: 'Dropout',
    category: 'regularization',
    badge: 'Beginner',
    blurb: 'During training, randomly mute neurons so the net cannot cling to one star pupil.',
    analogy: 'A group project where a random teammate is out sick each day. Everyone must learn the material, not just the one genius.',
    hook: 'Dropout is a cheap ensemble. Each training step uses a thinner, random sub-network.',
    explanation: [
      'A dropout rate of 0.5 means each hidden unit is turned off with 50% chance on that step. Off units output 0.',
      'At test time we keep everyone on, and scale the weights (or use inverted dropout during training) so the average signal matches.',
      'The model learns redundant backup routes. That usually improves generalization.',
    ],
    formula: 'h_i = \\frac{m_i}{1-p} \\cdot f(x_i),\\quad m_i \\sim \\mathrm{Bernoulli}(1-p)',
    formulaPlain: 'flip a coin for each neuron; if it is out, it stays silent; the others speak a bit louder',
    workedExample: {
      title: 'Four hidden neurons, p = 0.5',
      setup: 'Their usual outputs would be 1, 2, 3, 4.',
      steps: [
        'A random mask turns off the 2 and the 4. Alive: 1 and 3.',
        'With inverted dropout we divide by 0.5, so they become 2 and 6.',
        'Next step a different pair is gone. No single neuron is irreplaceable.',
      ],
      takeaway: 'Dropout is organized forgetfulness during practice, not during the exam.',
    },
    tryThis: [
      'Toggle neurons off in the demo and watch the representation change.',
      'Remember: the exam (inference) uses the full team.',
    ],
    whenToUse: 'MLPs and some CNNs when you overfit. Less common inside modern transformers that already use other regularizers.',
    watchFor: 'Do not apply dropout at test time unless you want Bayesian-style uncertainty (MC dropout) on purpose. Also, too much dropout underfits.',
    related: ['overfitting', 'data-augmentation', 'weight-decay'],
    labLinks: [
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
      { label: 'Network builder', route: '/ml/deep-learning/network-builder' },
    ],
    demo: { kind: 'dropout' },
    synonyms: ['drop out', 'inverted dropout', 'mc dropout'],
    tags: ['regularization', 'ensemble', 'hidden units'],
  },
  {
    slug: 'batch-layer-norm',
    label: 'Batch & Layer Normalization',
    category: 'regularization',
    badge: 'Intermediate',
    blurb: 'Rescale activations so each layer sees tidy numbers instead of wild swings.',
    analogy: 'A teacher who re-grades every quiz to mean 0 and std 1 before the next class starts. Nobody arrives with scores of 10,000.',
    hook: 'Deep nets are happier when each layer’s inputs stay on a familiar scale. Normalization is that reset.',
    explanation: [
      'Batch Normalization uses the mean and variance of the current mini-batch (per channel). It also learns a scale γ and shift β so the layer can undo the reset if it wants.',
      'Layer Normalization uses the mean and variance of the features of one example. It does not depend on batch size, which is why transformers love it.',
      'These are often listed with regularizers because they stabilize training and sometimes reduce the need for dropout. Their main job is stable optimization.',
    ],
    formula: '\\hat{x} = \\frac{x-\\mu}{\\sqrt{\\sigma^2+\\epsilon}},\\quad y = \\gamma \\hat{x} + \\beta',
    formulaPlain: 'subtract the local average, divide by the local spread, then let the layer stretch and shift if needed',
    workedExample: {
      title: 'A batch of three values: 2, 4, 12',
      setup: 'Mean μ = 6. Variance is high because of 12.',
      steps: [
        'Centered: −4, −2, 6. After dividing by std they sit near −1, −0.5, +1.5.',
        'The next layer now sees numbers of a normal size.',
        'γ and β can stretch this back if the network decides the raw scale was useful.',
      ],
      takeaway: 'Normalization is a courtesy to the next layer: “here are civilized numbers.”',
    },
    tryThis: [
      'In the demo, add an outlier and watch the batch stats jump.',
      'Compare that with layer norm, which only looks inside one example.',
    ],
    whenToUse: 'CNNs (batch norm), transformers and RNNs (layer norm), any deep stack that trains unstably.',
    watchFor: 'Tiny batches make batch-norm stats noisy. At test time batch norm uses running averages — train/serve mismatch is a classic bug.',
    related: ['feature-scaling', 'weight-initialization', 'dropout'],
    labLinks: [
      { label: 'CNN lab', route: '/ml/deep-learning/cnn' },
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
    ],
    demo: { kind: 'batch-norm' },
    synonyms: ['batchnorm', 'layernorm', 'bn', 'ln'],
    tags: ['normalization', 'stability', 'transformer'],
  },
  {
    slug: 'early-stopping',
    label: 'Early Stopping',
    category: 'regularization',
    badge: 'Beginner',
    blurb: 'Stop training when the held-out score stops improving, even if the training score still looks prettier.',
    analogy: 'Practicing a song. At some point more rehearsal makes you stiff and you start missing notes you used to hit. A friend in the audience says “that was the best take — stop.”',
    hook: 'Training loss almost always falls if you wait long enough. Test loss does not. Early stopping treats the validation curve as a referee.',
    explanation: [
      'After each epoch, measure validation loss. Keep a copy of the best weights. If validation has not improved for P epochs (patience), stop and restore the best copy.',
      'This is regularization without adding a term to the loss. You simply refuse to keep memorizing.',
      'You need a real validation split. Peeking at the test set to decide when to stop cheats the final exam.',
    ],
    formula: '\\text{stop if } L_{val} \\text{ has not improved for } P \\text{ epochs}',
    formulaPlain: 'if the practice-audience score stalls for a while, end rehearsal and keep the best take',
    workedExample: {
      title: 'Patience = 2',
      setup: 'Val losses: 1.0, 0.8, 0.7, 0.72, 0.74.',
      steps: [
        'Best is 0.7 at epoch 3.',
        'Epoch 4 and 5 are worse. Patience runs out.',
        'We restore epoch-3 weights, not the last ones.',
      ],
      takeaway: 'The last epoch is not automatically the best epoch.',
    },
    tryThis: [
      'Watch the demo curves: train keeps falling, val rises, a marker snaps back to the valley.',
      'Change patience. Tiny patience stops too soon. Huge patience waits through a real overfit.',
    ],
    whenToUse: 'Almost every serious training run. Cheap, effective, easy to explain.',
    watchFor: 'Noisy validation can trigger a false stop. Use a little patience. And never tune stopping on the test set.',
    related: ['overfitting', 'train-val-test', 'epochs-batches'],
    labLinks: [
      { label: 'Bias-variance', route: '/ml/evaluation/bias-variance-tradeoff' },
      { label: 'Training visualizations', route: '/ml/lab/training-visualizations' },
    ],
    demo: { kind: 'early-stop' },
    synonyms: ['patience', 'stop on plateau', 'best checkpoint'],
    tags: ['regularization', 'validation', 'checkpoint'],
  },
  {
    slug: 'weight-decay',
    label: 'Weight Decay',
    category: 'regularization',
    badge: 'Beginner',
    blurb: 'After each update, gently shrink every weight toward zero.',
    analogy: 'A tidy desk rule: every night you put 1% of the clutter back in the drawer. Only the papers you keep using stay on the desk.',
    hook: 'Weight decay is L2 regularization told as an optimizer story. Unused weights fade. Useful weights get refreshed by the gradient every step.',
    explanation: [
      'A common update is w ← (1 − λ)w − η · gradient. The (1 − λ)w piece is the decay.',
      'AdamW applies the decay correctly even when Adam’s adaptive scaling is in play. Older “Adam + L2” recipes mixed the tax into the gradient and behaved oddly.',
      'It is not dropout. Nothing is randomly turned off. The model just prefers smaller numbers.',
    ],
    formula: 'w \\leftarrow (1-\\lambda)w - \\eta \\nabla L',
    formulaPlain: 'shrink the weight a little, then apply the usual learning step',
    workedExample: {
      title: 'A weight that is not needed',
      setup: 'w = 5. Decay λ = 0.02. Gradient this step is 0 (feature unused).',
      steps: [
        'New w = 0.98 × 5 = 4.9.',
        'A few hundred unused steps later it is near 0.',
        'A useful weight has a gradient that keeps pushing it back up.',
      ],
      takeaway: 'Decay is a slow leak. Gradients are the refill.',
    },
    tryThis: [
      'In the demo, watch unused bars shrink and used bars survive.',
      'Raise decay too high and even useful weights get timid — that is underfitting.',
    ],
    whenToUse: 'Default regularizer for modern nets (often AdamW with a small λ like 0.01).',
    watchFor: 'Do not decay bias terms and normalization γ as aggressively. Many libraries skip them on purpose.',
    related: ['l1-l2', 'adam', 'overfitting'],
    labLinks: [
      { label: 'Ridge regression', route: '/ml/supervised/ridge-regression' },
      { label: 'Adam optimizer', route: '/ml/optimization/adam' },
    ],
    demo: { kind: 'weight-decay' },
    synonyms: ['l2 decay', 'adamw', 'weight shrinkage'],
    tags: ['regularization', 'optimizer', 'shrinkage'],
  },
  {
    slug: 'data-augmentation',
    label: 'Data Augmentation',
    category: 'regularization',
    badge: 'Beginner',
    blurb: 'Invent extra training examples by legally remixing the ones you have.',
    analogy: 'Teaching “this is a cat” with photos of the same cat flipped, cropped, a bit darker. The idea of cat stays. The pixels change.',
    hook: 'More varied practice data is one of the strongest regularizers you can buy — and you often do not need new labels.',
    explanation: [
      'Images: flip, crop, rotate a little, change color. Text: synonym swap, back-translation. Audio: noise, time shift. Tables: careful noise or mixup, used more rarely.',
      'The rule is: the label must stay true. Rotating a “6” into a “9” is vandalism, not augmentation.',
      'Augmentation fights overfitting because the model cannot memorize exact pixels.',
    ],
    formula: 'x^{\\prime} = T(x) \\quad \\text{with the same label } y',
    formulaPlain: 'transform the input, keep the answer the same',
    workedExample: {
      title: 'One cat photo',
      setup: 'You have 50 cat pictures. That is not many.',
      steps: [
        'Each epoch, randomly flip, crop, and dim them.',
        'The model sees thousands of slightly different cats.',
        'A test cat in a new kitchen is less shocking.',
      ],
      takeaway: 'You multiplied experience without multiplying labeling cost.',
    },
    tryThis: [
      'In the demo, apply flip and noise. The label stays “cat.”',
      'Imagine a transform that would break the label, and refuse it.',
    ],
    whenToUse: 'Images and audio almost always. Text with care. Small datasets especially.',
    watchFor: 'Leaking the test set through augmentation pipelines, or transforms that change the meaning. Also do not augment the validation set the same wild way if you want a stable score.',
    related: ['overfitting', 'dropout', 'train-val-test'],
    labLinks: [
      { label: 'Data augmentation lab', route: '/ml/lab/data-augmentation' },
      { label: 'Image classification', route: '/ml/computer-vision/image-classification' },
    ],
    demo: { kind: 'augmentation' },
    synonyms: ['aug', 'image transforms', 'mixup', 'cutout'],
    tags: ['regularization', 'data', 'images'],
  },
  {
    slug: 'neuron',
    label: 'Neuron & Perceptron',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'A tiny decision unit: multiply inputs by weights, add a bias, then squash.',
    analogy: 'A judge who listens to several witnesses, gives each a volume knob (weight), adds a personal bias, then says yes or no.',
    hook: 'Every neural network is a crowd of these little judges. One neuron draws a line. Many layers of them draw almost any curve.',
    explanation: [
      'The neuron computes z = w·x + b, then h = activation(z). The weights say which inputs matter. The bias says how easy it is to fire.',
      'A perceptron is the classic version with a hard yes/no step. Modern neurons use ReLU, sigmoid, or tanh so we can take gradients.',
      'If you understand one neuron, a layer is just many neurons side by side, each with its own weights.',
    ],
    formula: 'h = f(w_1 x_1 + w_2 x_2 + \\cdots + b)',
    formulaPlain: 'weighted sum of the clues, plus a bias, then an activation',
    workedExample: {
      title: 'Should we take an umbrella?',
      setup: 'Inputs: rain forecast 1, wind 0. Weights: 2 and 0.5. Bias: −1. Activation: step at 0.',
      steps: [
        'z = 2·1 + 0.5·0 − 1 = 1.',
        '1 > 0, so the neuron fires: take the umbrella.',
        'If the forecast is 0, z = −1, it stays quiet.',
      ],
      takeaway: 'A neuron is a scoring rule plus a threshold.',
    },
    tryThis: [
      'In the demo, drag weights and watch the decision line tilt.',
      'Change the bias and watch the line slide without tilting.',
    ],
    whenToUse: 'This is the atom of deep learning. Start here before MLP, CNN, or transformers.',
    watchFor: 'One neuron can only cut the plane with a straight fence. XOR-style puzzles need more than one, or a hidden layer.',
    related: ['relu', 'forward-pass', 'dot-product', 'perceptron-lab'],
    labLinks: [
      { label: 'Perceptron lab', route: '/ml/deep-learning/perceptron' },
      { label: 'NN playground', route: '/ml/deep-learning/nn-playground' },
    ],
    demo: { kind: 'neuron' },
    synonyms: ['unit', 'node', 'perceptron', 'artificial neuron'],
    tags: ['neural net', 'weights', 'bias'],
  },
  {
    slug: 'forward-pass',
    label: 'Forward Pass',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'Send the input through every layer, left to right, to get a prediction.',
    analogy: 'An assembly line. Raw parts go in. Each station transforms them. A finished guess comes out the end. Nobody walks backward yet.',
    hook: 'Training has two trips. The forward pass is the first: “given these weights, what do we currently predict?”',
    explanation: [
      'Layer 1 takes x and makes h1. Layer 2 takes h1 and makes h2. The last layer makes ŷ.',
      'We store the in-between values because the backward pass will need them.',
      'Inference (using a trained model) is only a forward pass. No gradients, no updates.',
    ],
    formula: 'h^{(l)} = f(W^{(l)} h^{(l-1)} + b^{(l)})',
    formulaPlain: 'each layer: multiply by that layer’s weights, add bias, activate, hand the result to the next layer',
    workedExample: {
      title: 'Two-layer toy',
      setup: 'x = 2. Hidden weight 3, bias 1, ReLU. Output weight 4, bias 0.',
      steps: [
        'Hidden pre-activation: 3·2 + 1 = 7. ReLU keeps 7.',
        'Output: 4·7 + 0 = 28. That is the prediction.',
        'If the true target is 20, the error is +8. That story continues in backprop.',
      ],
      takeaway: 'Forward is just arithmetic in order. Mystery lives in the weights, not in the direction of travel.',
    },
    tryThis: [
      'Trace the demo arrows from input to output.',
      'Change one weight and predict which number on the right will move.',
    ],
    whenToUse: 'Every prediction. Understanding this is required before backprop will make sense.',
    watchFor: 'People mix up forward and backward. Forward computes guesses. Backward computes blame.',
    related: ['backpropagation', 'neuron', 'relu'],
    labLinks: [
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
    ],
    demo: { kind: 'forward' },
    synonyms: ['inference pass', 'forward propagation', 'feedforward'],
    tags: ['neural net', 'inference', 'layers'],
  },
  {
    slug: 'backpropagation',
    label: 'Backpropagation',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'Walk the error backward so every weight learns how much it is to blame.',
    analogy: 'A play went badly. The director asks the last actor what happened, then the previous one, then the stage crew. Blame is split using “if you had changed your line, how would the ending change?”',
    hook: 'Backprop is the chain rule applied to a network. It is how we get the gradient that gradient descent needs.',
    explanation: [
      'After the forward pass we know the loss. We ask: how much would the loss change if this last weight moved a little? That is a local derivative.',
      'Then we reuse that answer to blame the layer before it, then the layer before that. We never restart the math from scratch — we multiply the already-known local slopes. That reuse is the chain rule.',
      'The result is a gradient for every weight. Gradient descent (or Adam) takes those numbers and steps.',
    ],
    formula: '\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial h}\\,\\frac{\\partial h}{\\partial z}\\,\\frac{\\partial z}{\\partial w}',
    formulaPlain: 'how loss changes with a weight = (how loss changes with the output) × (how the output changes with the sum) × (how the sum changes with the weight)',
    workedExample: {
      title: 'One weight, one neuron',
      setup: 'Prediction ŷ = w · x with x = 2, w = 3, so ŷ = 6. Target y = 4. Loss = (6 − 4)² = 4.',
      steps: [
        'dL/dŷ = 2 · (6 − 4) = 4. The guess is too high.',
        'dŷ/dw = x = 2. Raising w raises the guess.',
        'dL/dw = 4 · 2 = 8. We should decrease w. A step w ← 3 − 0.1 · 8 = 2.2 already moves toward a better guess.',
      ],
      takeaway: 'Backprop is organized blame. Each weight gets a number that says “nudge this way.”',
    },
    tryThis: [
      'In the demo, watch red blame arrows travel right to left.',
      'Open the full Backprop visualizer lab when you want every multiply shown.',
    ],
    whenToUse: 'Training any neural net. If you can forward, you can backward — as long as every piece is differentiable.',
    watchFor: 'Vanishing gradients (blame becomes a whisper) and exploding ones (blame becomes a shout). Also, a bug in the forward pass makes a perfect-looking backward pass meaningless.',
    related: ['forward-pass', 'chain-rule', 'gradient-descent', 'vanishing-exploding'],
    labLinks: [
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
    ],
    demo: { kind: 'backprop' },
    synonyms: ['backprop', 'backward pass', 'reverse mode autodiff'],
    tags: ['neural net', 'gradient', 'training'],
  },
  {
    slug: 'chain-rule',
    label: 'Chain Rule',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'When functions are nested, multiply the local slopes to get the total slope.',
    analogy: 'A rumor travels through three friends. If each friend exaggerates by 2×, the final story is 8× louder. Slopes multiply the same way.',
    hook: 'Backprop is not a new law of nature. It is the calculus chain rule with better branding.',
    explanation: [
      'If y = f(g(x)), then dy/dx = f′(g(x)) · g′(x). Each wrapper contributes its own slope, and we multiply.',
      'A deep net is just a long nesting: loss(softmax(linear(ReLU(linear(x))))). The total derivative is a product of many local derivatives.',
      'If any local slope is near 0 (a saturated sigmoid), the whole product collapses. That is vanishing gradient in one sentence.',
    ],
    formula: '\\frac{dy}{dx} = \\frac{dy}{du}\\,\\frac{du}{dx}',
    formulaPlain: 'total slope = slope of the outer function times slope of the inner function',
    workedExample: {
      title: 'y = (3x + 1)²',
      setup: 'Let u = 3x + 1, y = u². At x = 1, u = 4, y = 16.',
      steps: [
        'dy/du = 2u = 8.',
        'du/dx = 3.',
        'dy/dx = 8 · 3 = 24. Nudge x up by 0.01 and y should rise by about 0.24.',
      ],
      takeaway: 'You never expand the whole formula if you can multiply local slopes.',
    },
    tryThis: [
      'In the demo, change the inner slope and watch the product move.',
      'Set one local slope to 0 and see the whole chain go silent.',
    ],
    whenToUse: 'Any time you need a gradient through stacked steps — neural nets, computational graphs, autodiff.',
    watchFor: 'A single zero in the product zeros everything after it (or before it, depending on direction). Dead ReLUs and flat sigmoids are chain-rule traps.',
    related: ['backpropagation', 'vanishing-exploding', 'sigmoid'],
    labLinks: [
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
      { label: 'Gradient Descent lab', route: '/ml/optimization/gradient-descent' },
    ],
    demo: { kind: 'chain-rule' },
    synonyms: ['calculus chain rule', 'composite derivative'],
    tags: ['calculus', 'gradient', 'autodiff'],
  },
  {
    slug: 'vanishing-exploding',
    label: 'Vanishing & Exploding Gradients',
    category: 'neural',
    badge: 'Intermediate',
    blurb: 'In a deep stack, multiplied slopes can shrink to dust or blow up to fireworks.',
    analogy: 'A whisper passed through ten people becomes silence (vanish). A shout passed through ten megaphones becomes a siren (explode).',
    hook: 'Because backprop multiplies many local slopes, depth is dangerous if those slopes are usually < 1 or usually > 1.',
    explanation: [
      'Sigmoid and tanh tails have tiny slopes. Ten layers of “× 0.1” is 0.0000000001. Early layers hear nothing and stop learning. That is vanishing.',
      'Unstable RNN weights can be > 1. Ten layers of “× 2” is 1024, then a million. Updates jump off a cliff. That is exploding.',
      'Fixes: ReLU (slope 1 on the positive side), residual connections, LSTM/GRU gates, careful init (Xavier/He), gradient clipping, normalization.',
    ],
    formula: '\\frac{\\partial L}{\\partial h_0} \\propto \\prod_{l=1}^{L} f\'(z_l) W_l',
    formulaPlain: 'the earliest layer’s blame is a long product of later slopes and weights — products shrink or explode',
    workedExample: {
      title: 'Ten sigmoids',
      setup: 'Each local slope is 0.25, a typical saturated sigmoid.',
      steps: [
        'After 4 layers: 0.25⁴ ≈ 0.004.',
        'After 10 layers: 0.25¹⁰ ≈ 0.000001.',
        'An early weight that should move by 0.1 now wants to move by 0.0000001. Training looks frozen.',
      ],
      takeaway: 'Depth multiplies problems. Architecture is often a fix for the product, not a fancier loss.',
    },
    tryThis: [
      'In the demo, stack more layers and watch the backward signal fade or explode.',
      'Switch the activation toward ReLU and see the signal survive.',
    ],
    whenToUse: 'Whenever a deep or recurrent net trains poorly. Check this before blaming the dataset.',
    watchFor: 'NaN losses (explode) or a training loss that never leaves the starting value (vanish). Also check learning rate and init first.',
    related: ['chain-rule', 'gradient-clipping', 'relu', 'weight-initialization'],
    labLinks: [
      { label: 'LSTM lab', route: '/ml/deep-learning/lstm' },
      { label: 'Backprop visualizer', route: '/ml/deep-learning/backpropagation-visualizer' },
    ],
    demo: { kind: 'clipping', variant: 'vanish' },
    synonyms: ['vanishing gradient', 'exploding gradient', 'unstable training'],
    tags: ['stability', 'depth', 'rnn'],
  },
  {
    slug: 'weight-initialization',
    label: 'Weight Initialization',
    category: 'neural',
    badge: 'Intermediate',
    blurb: 'How you roll the starting dice. Zeros fail. Smart random scales keep signals alive.',
    analogy: 'A choir. If everyone starts at volume 0, nobody sings. If everyone starts at volume 100, it is noise. Xavier and He pick a polite indoor voice.',
    hook: 'Training is a walk from the start point. A terrible start can sit in a dead ReLU region or explode on step one.',
    explanation: [
      'All zeros is fatal: every neuron in a layer computes the same thing, gets the same gradient, and stays twins forever (symmetry).',
      'Xavier / Glorot scales random weights using fan-in and fan-out. It assumes tanh/sigmoid-ish activations.',
      'He initialization uses a larger scale and assumes ReLU, which throws away half the signal. Modern ReLU nets should start with He.',
    ],
    formula: 'W \\sim \\mathcal{N}\\!\\left(0, \\sqrt{2 / n_{\\mathrm{in}}}\\right) \\quad \\text{(He)}',
    formulaPlain: 'draw small random weights whose spread depends on how many inputs the neuron has',
    workedExample: {
      title: 'A layer with 100 inputs',
      setup: 'We want the hidden sum to have variance near 1.',
      steps: [
        'If each weight has variance 1, the sum of 100 terms has variance 100 — too wild. Activations saturate.',
        'He says std = √(2/100) ≈ 0.14. The sum stays civilized.',
        'ReLU keeps about half the units alive, so the extra 2 in the numerator pays for that.',
      ],
      takeaway: 'Init is not decoration. It is matching the volume of the signal to the width of the layer.',
    },
    tryThis: [
      'Compare zero init with He in the demo. Zeros stay stuck as clones.',
      'Use a huge init and watch the first activations slam into a sigmoid wall.',
    ],
    whenToUse: 'Every new network. Use the init that matches the activation: He for ReLU, Xavier for tanh.',
    watchFor: 'Transfer learning already has trained weights — do not re-initialize those. Only init the new head.',
    related: ['relu', 'vanishing-exploding', 'batch-layer-norm'],
    labLinks: [
      { label: 'MLP lab', route: '/ml/deep-learning/mlp' },
      { label: 'Network builder', route: '/ml/deep-learning/network-builder' },
    ],
    demo: { kind: 'init' },
    synonyms: ['xavier', 'glorot', 'he init', 'kaiming'],
    tags: ['initialization', 'symmetry', 'variance'],
  },
  {
    slug: 'epochs-batches',
    label: 'Epochs, Batches & Iterations',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'The calendar of training: a batch is a bite, an iteration is a step, an epoch is one full pass.',
    analogy: 'A textbook with 1,000 practice problems. A batch is 32 problems. An iteration is “do those 32, then update.” An epoch is finishing the book once.',
    hook: 'These three words get mixed up constantly. They are just how we slice the homework.',
    explanation: [
      'Dataset size N. Batch size B. Then iterations per epoch ≈ N / B.',
      'Small batches: more updates, noisier slopes, need more epochs maybe, but each epoch has many steps.',
      '“I trained for 20 epochs” means the model saw every training example about 20 times, not that it took 20 steps.',
    ],
    formula: '\\text{steps per epoch} \\approx N / B',
    formulaPlain: 'how many weight updates happen each time you finish the dataset once',
    workedExample: {
      title: '8,000 images, batch 32, 10 epochs',
      setup: 'A small image set.',
      steps: [
        'Steps per epoch = 8000 / 32 = 250.',
        'Ten epochs = 2,500 updates.',
        'If someone says “2,500 epochs” they almost certainly mean steps. Ask.',
      ],
      takeaway: 'Epoch = full book. Iteration = one homework set. Batch = how many problems in that set.',
    },
    tryThis: [
      'In the demo, change batch size and watch steps-per-epoch move.',
      'Say the three words out loud with the textbook analogy until they stick.',
    ],
    whenToUse: 'Every training conversation. Get this right before you tune anything else.',
    watchFor: 'The last batch may be smaller than B. Some libraries drop it. Also, more epochs is not always better — see early stopping.',
    related: ['sgd-mini-batch', 'early-stopping', 'learning-rate'],
    labLinks: [
      { label: 'Training visualizations', route: '/ml/lab/training-visualizations' },
      { label: 'NN playground', route: '/ml/deep-learning/nn-playground' },
    ],
    demo: { kind: 'epochs' },
    synonyms: ['iteration', 'step', 'batch size', 'minibatch'],
    tags: ['training', 'batch', 'epoch'],
  },
  {
    slug: 'overfitting',
    label: 'Overfitting vs Underfitting',
    category: 'neural',
    badge: 'Beginner',
    blurb: 'Memorizing the homework versus being too simple to learn the pattern.',
    analogy: 'Underfit: a student who only learned “add 2” for every math problem. Overfit: a student who memorized last year’s answer key, including the misprints.',
    hook: 'The goal is not a tiny training error. The goal is a model that still works on new examples.',
    explanation: [
      'Underfitting: train and test errors are both high. The model is too simple, under-trained, or missing features.',
      'Overfitting: train error is tiny, test error is worse. The model chased noise — outliers, quirks, random IDs.',
      'The sweet spot is a small gap: good enough on train, almost as good on test. Regularization, more data, and early stopping help the overfit side. A richer model or longer training helps the underfit side.',
    ],
    formula: '\\text{generalization gap} = L_{\\text{test}} - L_{\\text{train}}',
    formulaPlain: 'how much worse we are on new data than on the data we studied',
    workedExample: {
      title: 'Ten noisy points on a line',
      setup: 'The true story is a gentle line plus measurement jitter.',
      steps: [
        'A horizontal line underfits. Train and test are both bad.',
        'A degree-9 polynomial threads every point. Train error ≈ 0. A new point misses badly.',
        'A straight line with a little slope ignores jitter and predicts the next point.',
      ],
      takeaway: 'A perfect training score can be a confession, not a trophy.',
    },
    tryThis: [
      'In the demo, raise the polynomial degree and watch the curve start chasing dots.',
      'Compare train vs test error as the wiggling grows.',
    ],
    whenToUse: 'Always. Read both curves, not one.',
    watchFor: 'A tiny test set looks like overfitting by luck. Also, leakage (a feature that is the answer in disguise) creates fake perfection.',
    related: ['bias-variance', 'early-stopping', 'dropout', 'train-val-test'],
    labLinks: [
      { label: 'Bias-variance', route: '/ml/evaluation/bias-variance-tradeoff' },
      { label: 'Polynomial regression', route: '/ml/supervised/polynomial-regression' },
    ],
    demo: { kind: 'overfit' },
    synonyms: ['overfit', 'underfit', 'memorization', 'generalization'],
    tags: ['generalization', 'error', 'capacity'],
  },
  {
    slug: 'bias-variance',
    label: 'Bias-Variance Tradeoff',
    category: 'neural',
    badge: 'Intermediate',
    blurb: 'Bias is being systematically simple. Variance is being jumpy when the data wiggles.',
    analogy: 'A dart player. High bias: always hits the same wrong spot. High variance: darts fly everywhere depending on the breeze. We want a tight cluster on the bullseye.',
    hook: 'Overfitting is mostly variance. Underfitting is mostly bias. The tradeoff says you rarely get zero of both.',
    explanation: [
      'Bias: the model’s favorite wrong shape. A line trying to fit a bowl is biased. More capacity (trees, deeper nets, higher degree) lowers bias.',
      'Variance: the model’s mood swings when you redraw the training sample. A degree-20 polynomial changes violently. Regularization and more data lower variance.',
      'Test error ≈ bias² + variance + noise. You cannot delete the noise in the labels. You can only balance the first two.',
    ],
    formula: '\\mathbb{E}[(y-\\hat{y})^2] = \\mathrm{Bias}^2 + \\mathrm{Var} + \\sigma^2',
    formulaPlain: 'average test miss = (systematic wrongness)² + (jumpy-ness) + (unavoidable label noise)',
    workedExample: {
      title: 'Five different training draws',
      setup: 'Same true curve. Five small random samples.',
      steps: [
        'A line: all five fits look similar (low variance) and all miss the curve (high bias).',
        'A wild polynomial: each sample produces a different roller coaster (high variance).',
        'A slightly flexible model: the five fits agree and follow the bowl.',
      ],
      takeaway: 'Ask two questions: is it the wrong shape, or is it too loyal to this particular sample?',
    },
    tryThis: [
      'In the demo, redraw the sample and see which model jumps.',
      'Add regularization mentally to a wild model and imagine the darts clustering.',
    ],
    whenToUse: 'When choosing model capacity, tree depth, polynomial degree, or whether to collect more data.',
    watchFor: 'More data lowers variance. A better family of models lowers bias. Regularization trades a little bias for less variance.',
    related: ['overfitting', 'l1-l2', 'dropout'],
    labLinks: [
      { label: 'Bias-variance lab', route: '/ml/evaluation/bias-variance-tradeoff' },
      { label: 'Random forest', route: '/ml/supervised/random-forest-classification' },
    ],
    demo: { kind: 'bias-variance' },
    synonyms: ['bias variance', 'error decomposition'],
    tags: ['generalization', 'capacity', 'ensembles'],
  },
  {
    slug: 'dot-product',
    label: 'Dot Product & Matrix Multiply',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'The workhorse of ML: multiply matching pairs and add. A layer is this, in bulk.',
    analogy: 'A grocery receipt. Quantity × price for each item, then a total. That total is a dot product.',
    hook: 'Almost every “the model scored this input” line is a dot product. Attention, linear layers, cosine similarity — same verb, different costumes.',
    explanation: [
      'The dot product of [2, 3] and [4, 5] is 2·4 + 3·5 = 23. It is “how much do these two lists agree, after pairing.”',
      'A matrix times a vector is many dot products stacked — one per output neuron.',
      'If both vectors are length 1, the dot product is cosine similarity: 1 means they point the same way, 0 means they are sideways, −1 means opposite.',
    ],
    formula: 'w \\cdot x = \\sum_i w_i x_i',
    formulaPlain: 'pair each weight with its input, multiply, then add the pile',
    workedExample: {
      title: 'A tiny linear neuron',
      setup: 'x = [hours studied, practice tests] = [4, 2]. w = [3, 5]. Bias 1.',
      steps: [
        'Dot product = 4·3 + 2·5 = 22.',
        'Plus bias: 23. That is the raw score before an activation.',
        'A whole layer with 8 neurons is 8 such receipts.',
      ],
      takeaway: 'If you can do a receipt, you can do a linear layer.',
    },
    tryThis: [
      'In the demo, change one pair and watch only that term move, then the total.',
      'Make the vectors point opposite ways and see a negative total.',
    ],
    whenToUse: 'Linear layers, attention scores, recommendation dots, any “weighted sum.”',
    watchFor: 'Mismatched lengths. Also scale: huge features dominate the sum — that is why we normalize.',
    related: ['neuron', 'feature-scaling', 'softmax'],
    labLinks: [
      { label: 'Perceptron lab', route: '/ml/deep-learning/perceptron' },
      { label: 'Transformer attention', route: '/ml/deep-learning/transformer-attention' },
    ],
    demo: { kind: 'dot-product' },
    synonyms: ['inner product', 'weighted sum', 'matmul', 'linear layer'],
    tags: ['linear algebra', 'similarity', 'layers'],
  },
  {
    slug: 'norms',
    label: 'L1 & L2 Norms',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Two ways to measure the size of a vector: city blocks vs a straight crow-fly.',
    analogy: 'L1 is walking the city grid: 3 blocks east and 4 north is 7 blocks. L2 is a helicopter: the diagonal is 5.',
    hook: '“Norm” means “how long is this arrow?” Regularization, clipping, and distance-based models all need a length.',
    explanation: [
      'L1 norm is the sum of absolute values. |3| + |−4| = 7. It treats each axis separately and likes sparsity.',
      'L2 norm is the usual Euclidean length. √(3² + (−4)²) = 5. It is rotation-friendly and the default for “distance.”',
      'We write ||w||₂ for L2. Gradient clipping often uses this length. “Unit vector” means we divided by the L2 norm so the length is 1.',
    ],
    formula: '\\|x\\|_1 = \\sum |x_i|,\\quad \\|x\\|_2 = \\sqrt{\\sum x_i^2}',
    formulaPlain: 'L1 adds the absolute values. L2 is the ordinary straight-line length.',
    workedExample: {
      title: 'The 3-4-5 triangle',
      setup: 'Vector (3, 4).',
      steps: [
        'L1 = 3 + 4 = 7.',
        'L2 = 5.',
        'If we clip to max L2 = 1, the vector becomes (3/5, 4/5) = (0.6, 0.8).',
      ],
      takeaway: 'Same arrow, two rulers. Name the ruler before you compare sizes.',
    },
    tryThis: [
      'Drag the vector in the demo. Compare the city-block number with the diagonal number.',
      'Ask which ruler a taxi uses, and which a bird uses.',
    ],
    whenToUse: 'Regularization, gradient clipping, k-NN distances, normalizing embeddings.',
    watchFor: 'L2 is sensitive to big coordinates (they get squared). Scale features before comparing L2 distances.',
    related: ['l1-l2', 'gradient-clipping', 'feature-scaling'],
    labLinks: [
      { label: 'KNN classification', route: '/ml/supervised/knn-classification' },
      { label: 'Ridge regression', route: '/ml/supervised/ridge-regression' },
    ],
    demo: { kind: 'norm' },
    synonyms: ['euclidean norm', 'manhattan', 'vector length', 'l2 norm'],
    tags: ['linear algebra', 'distance', 'regularization'],
  },
  {
    slug: 'one-hot',
    label: 'One-Hot Encoding',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Turn a category name into a row of 0s with a single 1 in the matching slot.',
    analogy: 'Three light switches labeled cat, dog, bird. For “dog” you flip only the dog switch on.',
    hook: 'Models do not understand the word “Tuesday.” They understand numbers. One-hot is the honest way to number labels that have no order.',
    explanation: [
      'If colors are red, green, blue, then green becomes [0, 1, 0]. The position is the identity. The 1 is “this one.”',
      'Do not encode Tuesday as 2 and Sunday as 7 if that order is fake. The model will think Sunday is “bigger.” Use one-hot (or embeddings) instead.',
      'The true class in classification is often a one-hot vector. Softmax outputs a soft version of the same idea.',
    ],
    formula: '\\mathrm{onehot}(\\text{dog}) = [0,1,0]',
    formulaPlain: 'a slot per category; only the true category gets a 1',
    workedExample: {
      title: 'Fruit basket',
      setup: 'Classes: apple, banana, cherry.',
      steps: [
        'banana → [0, 1, 0].',
        'A softmax prediction [0.1, 0.7, 0.2] is a soft banana.',
        'If we had used banana = 2, apple = 1, the model might invent “1.5 fruit.”',
      ],
      takeaway: 'Names that are just names want one-hot, not a ranking.',
    },
    tryThis: [
      'Pick a fruit in the demo and watch which lamp turns on.',
      'Count how many columns you need: one per unique category.',
    ],
    whenToUse: 'Categorical inputs with no true order, and multiclass labels before some losses.',
    watchFor: 'A column for every rare city can explode the width (high cardinality). Then use embeddings or target encoding. Also drop one column in linear models to avoid the dummy-variable trap if an intercept exists.',
    related: ['softmax', 'categorical-cross-entropy', 'feature-scaling'],
    labLinks: [
      { label: 'Categorical encoding', route: '/ml/preprocessing/categorical-encoding' },
      { label: 'Multinomial logistic', route: '/ml/supervised/multinomial-logistic-regression' },
    ],
    demo: { kind: 'onehot' },
    synonyms: ['one hot', 'dummy variable', 'one-of-k'],
    tags: ['preprocessing', 'categorical', 'labels'],
  },
  {
    slug: 'feature-scaling',
    label: 'Feature Scaling',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Put features on a comparable ruler so meters and millimeters do not fight.',
    analogy: 'Comparing test scores out of 10 with incomes in rupees. Without scaling, the income number shouts down the room.',
    hook: 'Gradient descent, k-NN, SVM, and PCA all care about scale. Trees care much less. When in doubt, scale.',
    explanation: [
      'Standardization (z-score): subtract the mean, divide by the standard deviation. Result sits near 0 with spread 1.',
      'Min-max: squeeze into [0, 1] (or [−1, 1]). Nice for pixels and bounded activations.',
      'Robust scaling uses the median and IQR so a palace does not set the ruler for every house.',
    ],
    formula: 'z = \\frac{x - \\mu}{\\sigma}',
    formulaPlain: 'new value = (old value − typical value) / typical spread',
    workedExample: {
      title: 'Age and income',
      setup: 'Age 30 (mean 30, std 10). Income 90,000 (mean 50,000, std 20,000).',
      steps: [
        'Age z = (30 − 30) / 10 = 0. Typical age.',
        'Income z = (90,000 − 50,000) / 20,000 = 2. Unusually high, but on the same kind of ruler as age.',
        'Without scaling, k-NN would think income distance of 1,000 is “farther” than 40 years of age.',
      ],
      takeaway: 'Scaling is fairness between columns. Fit the scaler on train only, then apply it to val/test.',
    },
    tryThis: [
      'In the demo, watch k-NN neighbors flip after scaling a stretched axis.',
      'Remember: never compute the mean on the test set first. That leaks.',
    ],
    whenToUse: 'Before GD-based models, k-NN, SVM, PCA, and most neural nets. After train/val/test split.',
    watchFor: 'Leakage if you scale using the whole dataset. Also, one-hot columns are already 0/1 — sometimes you leave them alone.',
    related: ['train-val-test', 'gradient-descent', 'norms'],
    labLinks: [
      { label: 'Scaling & normalization', route: '/ml/preprocessing/scaling-normalization' },
      { label: 'KNN classification', route: '/ml/supervised/knn-classification' },
    ],
    demo: { kind: 'scaling' },
    synonyms: ['standardize', 'normalize', 'z-score', 'minmax'],
    tags: ['preprocessing', 'scale', 'leakage'],
  },
  {
    slug: 'train-val-test',
    label: 'Train / Val / Test Split',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Homework, practice exam, final exam. Never study the final exam.',
    analogy: 'Homework (train) is for learning. A practice test (validation) is for choosing how late to study and which knobs to turn. The sealed final (test) is for the report card.',
    hook: 'If you tune on the same data you grade, you will look like a genius and fail in production. The three-way split is the adult version of honesty.',
    explanation: [
      'Train: fit weights here. The model is allowed to look as much as it wants.',
      'Validation: choose learning rate, depth, epochs, architecture. Early stopping lives here.',
      'Test: touch once at the end. If you keep peeking and changing things, it becomes a second validation set and you need a new final.',
    ],
    formula: 'n = n_{\\mathrm{train}} + n_{\\mathrm{val}} + n_{\\mathrm{test}}',
    formulaPlain: 'every row gets exactly one job: learn, tune, or grade',
    workedExample: {
      title: '1,000 labeled rows',
      setup: 'A common 70 / 15 / 15 split.',
      steps: [
        '700 train, 150 val, 150 test.',
        'You try five learning rates using val scores and pick 0.01.',
        'You report the test score of that one choice. You do not pick again.',
      ],
      takeaway: 'Validation is for decisions. Test is for the sentence you publish.',
    },
    tryThis: [
      'In the demo, color the three piles. Notice none of the test dots may be used to tilt the line.',
      'Ask what happens if you early-stop on test. You just wrote on the answer key.',
    ],
    whenToUse: 'Every supervised project with enough rows. Tiny data may need cross-validation instead of a single split.',
    watchFor: 'Time series must split by time, not shuffle. Groups (same patient, same household) must not appear in two piles. That is leakage.',
    related: ['cross-validation', 'early-stopping', 'overfitting'],
    labLinks: [
      { label: 'Train/test split', route: '/ml/evaluation/train-test-split' },
      { label: 'Cross validation', route: '/ml/evaluation/cross-validation' },
    ],
    demo: { kind: 'split' },
    synonyms: ['holdout', 'validation set', 'dev set', 'train test split'],
    tags: ['evaluation', 'leakage', 'honesty'],
  },
  {
    slug: 'cross-validation',
    label: 'Cross-Validation',
    category: 'data-math',
    badge: 'Beginner',
    blurb: 'Rotate who sits out so every row gets a turn as the practice exam.',
    analogy: 'Five friends take turns being the quiz-grader while the other four study. Everyone is graded once. You average the five quizzes.',
    hook: 'A single validation split can be unlucky. K-fold cross-validation reuses data more fairly when you cannot afford a big holdout.',
    explanation: [
      'Split into K folds (often 5 or 10). Train on K−1, validate on the remaining fold. Repeat so each fold is the validation fold once.',
      'The reported score is the average (and sometimes the spread) of the K runs.',
      'After you pick the knobs, retrain on all training data (or all data except the final test) before you ship.',
    ],
    formula: '\\mathrm{CV} = \\frac{1}{K}\\sum_{k=1}^{K} L_k',
    formulaPlain: 'average the error of each “whose turn is it to sit out?” run',
    workedExample: {
      title: '5-fold on 100 rows',
      setup: 'Each fold has 20 rows.',
      steps: [
        'Run 1: train 80, val 20 → score 0.81.',
        'Runs 2–5: 0.76, 0.83, 0.79, 0.80.',
        'CV accuracy ≈ 0.80. The wobble tells you the split luck.',
      ],
      takeaway: 'CV is a more honest practice exam when data is scarce.',
    },
    tryThis: [
      'In the demo, watch the highlighted fold walk around the circle.',
      'Notice every point is orange (val) in exactly one round.',
    ],
    whenToUse: 'Small or medium tabular datasets, model selection, anytime a single split feels noisy.',
    watchFor: 'It is K times more compute. Also, the test set still stays sealed. Nested CV is the extra-honest version when you tune a lot.',
    related: ['train-val-test', 'overfitting', 'early-stopping'],
    labLinks: [
      { label: 'Cross validation', route: '/ml/evaluation/cross-validation' },
      { label: 'Train/test split', route: '/ml/evaluation/train-test-split' },
    ],
    demo: { kind: 'split', variant: 'kfold' },
    synonyms: ['k-fold', 'cv', 'leave one out', 'kfold'],
    tags: ['evaluation', 'validation', 'small data'],
  },
];

termsStudioLessons.push(...termsStudioNewLessons);

const termBySlug = new Map(termsStudioLessons.map((term) => [term.slug, term]));

export function getTermLesson(slug: string): TermLesson | undefined {
  return termBySlug.get(slug);
}

export function termRoute(slug: string): string {
  return `${TERMS_STUDIO_HUB_ROUTE}/${slug}`;
}

export function getRelatedTerms(term: TermLesson): TermLesson[] {
  return term.related
    .map((slug) => termBySlug.get(slug))
    .filter((item): item is TermLesson => Boolean(item));
}

export function getNeighborTerms(slug: string): { prev?: TermLesson; next?: TermLesson } {
  const index = termsStudioLessons.findIndex((term) => term.slug === slug);
  if (index < 0) return {};
  return {
    prev: index > 0 ? termsStudioLessons[index - 1] : undefined,
    next: index < termsStudioLessons.length - 1 ? termsStudioLessons[index + 1] : undefined,
  };
}

export const termsStudioNavItems: NavItem[] = [
  { label: 'Terms Studio', route: TERMS_STUDIO_HUB_ROUTE, badge: 'Educational' },
  ...termsStudioLessons.map((term) => ({
    label: term.label,
    route: termRoute(term.slug),
    badge: term.badge,
  })),
];

export const termsStudioSearchMeta: Record<string, { description: string; synonyms: string[]; tags: string[] }> =
  Object.fromEntries([
    [
      TERMS_STUDIO_HUB_ROUTE,
      {
        description: 'A beginner studio for the words behind the algorithms: ReLU, gradient descent, loss, dropout, and more.',
        synonyms: ['terms', 'glossary', 'vocabulary', 'understand terms', 'ml terms'],
        tags: ['studio', 'beginner', 'glossary', 'concepts'],
      },
    ],
    ...termsStudioLessons.map((term) => [
      termRoute(term.slug),
      {
        description: term.blurb,
        synonyms: term.synonyms,
        tags: term.tags,
      },
    ]),
    ...termCategories.map((category) => [
      categoryRoute(category.id),
      {
        description: category.blurb,
        synonyms: [category.title, category.id, 'terms topic'],
        tags: ['studio', 'topic', category.id],
      },
    ]),
  ]);
