import type { TermCategoryId, TermEnhance, TermLesson } from './termsStudio';
import { getTermLesson, termsStudioLessons } from './termsStudio';
import { termsStudioEnhanceRest } from './termsStudioEnhanceRest';
import { termsStudioEnhanceNew } from './termsStudioEnhanceNew';

function e(item: TermEnhance): TermEnhance {
  return item;
}

function quiz(q: string, choices: string[], answer: number, why: string) {
  return { q, choices, answer, why };
}

export const termsStudioReadingOrder = [
  'neuron', 'relu', 'dot-product', 'forward-pass', 'mse-mae-huber',
  'gradient-descent', 'learning-rate', 'sgd-mini-batch', 'epochs-batches',
  'backpropagation', 'chain-rule', 'sigmoid', 'softmax', 'train-val-test',
  'overfitting', 'early-stopping', 'dropout', 'l1-l2', 'feature-scaling',
  'one-hot', 'binary-cross-entropy', 'categorical-cross-entropy',
  'momentum', 'adam', 'weight-decay', 'batch-layer-norm', 'weight-initialization',
  'vanishing-exploding', 'gradient-clipping', 'local-minima',
  'leaky-relu', 'tanh', 'gelu-swish', 'softplus-elu', 'temperature',
  'learning-rate-schedules', 'data-augmentation', 'hinge-loss', 'kl-divergence',
  'contrastive-triplet', 'norms', 'bias-variance', 'cross-validation',
  'baseline', 'learning-curve', 'data-leakage', 'token', 'embedding',
  'cosine-similarity', 'padding', 'attention', 'residual-connection',
] as const;

export const termsStudioConfusion: Record<string, string> = {
  'step size': 'learning-rate',
  lr: 'learning-rate',
  'learning rate': 'learning-rate',
  eta: 'learning-rate',
  stride: 'stride',
  regularisation: 'l1-l2',
  regularization: 'l1-l2',
  lasso: 'l1-l2',
  ridge: 'l1-l2',
  gini: 'gini-impurity',
  roc: 'roc-curve',
  auc: 'roc-curve',
  'f1': 'f1-score',
  cm: 'confusion-matrix',
  qkv: 'query-key-value',
  smote: 'smote',
  'dying neuron': 'relu',
  'dead relu': 'relu',
  'dying relu': 'relu',
  'log loss': 'binary-cross-entropy',
  nll: 'categorical-cross-entropy',
  minibatch: 'sgd-mini-batch',
  'mini batch': 'sgd-mini-batch',
  iteration: 'epochs-batches',
  step: 'epochs-batches',
  holdout: 'train-val-test',
  'dev set': 'train-val-test',
  kfold: 'cross-validation',
  'l2 penalty': 'l1-l2',
  'weight penalty': 'weight-decay',
  batchnorm: 'batch-layer-norm',
  layernorm: 'batch-layer-norm',
  vanishing: 'vanishing-exploding',
  exploding: 'vanishing-exploding',
  xavier: 'weight-initialization',
  'he init': 'weight-initialization',
  kaiming: 'weight-initialization',
  leakage: 'data-leakage',
  leak: 'data-leakage',
  cosine: 'cosine-similarity',
  'skip connection': 'residual-connection',
  residual: 'residual-connection',
  logit: 'softmax',
  logits: 'softmax',
  'one of k': 'one-hot',
  dummy: 'one-hot',
  standardize: 'feature-scaling',
  normalize: 'feature-scaling',
  zscore: 'feature-scaling',
  'practice exam': 'train-val-test',
  patience: 'early-stopping',
};

export const categoryStories: Record<TermCategoryId, { minutes: string; story: string; sequence: string[] }> = {
  optimization: {
    minutes: 'Read these in order: Gradient Descent → Learning Rate → SGD → Momentum → Adam',
    story: 'A model is a hiker in fog. First learn the downhill step, then how long the stride is, then how we peek at a few examples, then how memory and adaptive shoes help.',
    sequence: ['gradient-descent', 'learning-rate', 'sgd-mini-batch', 'momentum', 'adam', 'learning-rate-schedules', 'gradient-clipping', 'local-minima'],
  },
  activations: {
    minutes: 'ReLU first, then sigmoid, then softmax. The others are cousins.',
    story: 'A raw score is just a number. Activations decide whether it stays a line, becomes a probability, or gets a share of 100%.',
    sequence: ['relu', 'leaky-relu', 'sigmoid', 'tanh', 'softmax', 'temperature', 'gelu-swish', 'softplus-elu'],
  },
  losses: {
    minutes: 'Pick the scoreboard that matches the target: a number, a yes/no, or one of many classes.',
    story: 'The loss is the teacher’s red pen. Change the pen and the model studies a different kind of mistake.',
    sequence: ['mse-mae-huber', 'binary-cross-entropy', 'categorical-cross-entropy', 'hinge-loss', 'kl-divergence', 'contrastive-triplet'],
  },
  regularization: {
    minutes: 'When train looks perfect and test looks sad, come here.',
    story: 'These are seatbelts. They make the simple honest story cheaper than memorizing the homework, including the misprints.',
    sequence: ['overfitting', 'l1-l2', 'weight-decay', 'dropout', 'early-stopping', 'batch-layer-norm', 'data-augmentation'],
  },
  neural: {
    minutes: 'Neuron → Forward → Loss → Backprop is the whole loop.',
    story: 'A net is a crowd of tiny judges. They score left to right, get blamed right to left, then take a downhill step.',
    sequence: ['neuron', 'forward-pass', 'backpropagation', 'chain-rule', 'epochs-batches', 'weight-initialization', 'vanishing-exploding', 'learning-curve', 'residual-connection', 'attention'],
  },
  'data-math': {
    minutes: 'Scale, split, then encode. Honesty first, cleverness second.',
    story: 'These are the kitchen tools. If the ruler is crooked or the final exam leaked into homework, no fancy model can save you.',
    sequence: ['dot-product', 'norms', 'one-hot', 'feature-scaling', 'train-val-test', 'cross-validation', 'baseline', 'data-leakage', 'token', 'embedding', 'cosine-similarity', 'padding'],
  },
};

export const termsStudioEnhance: Record<string, TermEnhance> = {
  'gradient-descent': e({
    sixty: { what: 'Walk downhill on the error hill.', why: 'A first guess is almost always wrong.', remember: 'new guess = old guess − step × slope' },
    meetingLine: 'Gradient descent is how we improve the guess: feel the slope, take a small step downhill, repeat.',
    mixups: [
      { other: 'SGD', otherSlug: 'sgd-mini-batch', vs: 'GD uses every example before one step. SGD peeks at a sample.' },
      { other: 'Backprop', otherSlug: 'backpropagation', vs: 'Backprop computes the slope. GD uses that slope to move.' },
    ],
    symbols: [
      { symbol: 'θ', say: 'theta', means: 'the knobs / weights we are changing' },
      { symbol: 'η', say: 'eta', means: 'learning rate, the step size' },
      { symbol: '∇L', say: 'nabla L / gradient', means: 'the slope of the error' },
    ],
    secondExample: {
      title: 'Lemonade stand',
      setup: 'You guess the price is ₹10. Customers grimace. The “too expensive” slope is +4.',
      steps: ['Step size 0.5. New price = 10 − 0.5×4 = ₹8.', 'Fewer grimaces. Slope is now +1.', 'New price = 8 − 0.5×1 = ₹7.5. Closer to the sweet spot.'],
      takeaway: 'Same walk, different story. The hill can be money, error, or regret.',
    },
    wrongWalkthrough: {
      title: 'A stride that leaps the valley',
      setup: 'Start at 0, valley at 3, slope −6, but η = 2.',
      steps: ['Step: 0 − 2×(−6) = 12. You jumped over 3 to the far slope.', 'Next slope is huge the other way. You ping-pong.', 'The loss plot looks like a heartbeat, not a slide.'],
      takeaway: 'If the walk explodes, shrink η. Do not blame the hill first.',
    },
    rememberNumber: { label: 'First learning rate to try', value: '0.01 or 0.001' },
    classroomScript: [
      'I am standing on a foggy hill. I cannot see the bottom.',
      'I feel the ground. This way is downhill.',
      'I take a baby step, not a leap.',
      'I feel again. That is one training step.',
    ],
    myths: [
      { myth: 'GD always finds the global best.', fact: 'On wrinkly hills it can sit in a local dip or a saddle.' },
      { myth: 'One giant step is faster.', fact: 'One giant step often lands higher than you started.' },
    ],
    inThisApp: 'Open the Gradient Descent lab. The moving ball on the curve is this term, not a decoration.',
    compareWith: ['sgd-mini-batch', 'learning-rate', 'momentum'],
    quiz: [
      quiz('The slope is +4. Which way do we step?', ['Right, bigger x', 'Left, smaller x', 'Stay'], 1, 'Positive slope means “going right makes error worse,” so we step left.'),
      quiz('What does η do?', ['Picks the dataset', 'Sets the stride', 'Chooses ReLU or tanh'], 1, 'η is only the step size.'),
      quiz('GD vs backprop?', ['Same thing', 'Backprop finds the slope; GD uses it', 'GD finds the slope; backprop uses it'], 1, 'They are partners, not twins.'),
    ],
    beforeAfter: { before: 'You guess once and hope.', after: 'You improve the guess every step by following the slope.' },
    vocab: [
      { word: 'gradient', def: 'the slope — which way the error rises fastest' },
      { word: 'parameter', def: 'a knob the model is allowed to change, like a weight' },
    ],
    simple: {
      hook: 'Start with a bad guess. Look which way the error goes up. Walk the other way a little. Do it again.',
      analogy: 'Eyes closed on a hill. Feel with your feet. Step downhill.',
      explanation: [
        'High error is a tall hill. Low error is the valley.',
        'The slope tells you the downhill direction.',
        'A small step is safer than a jump.',
      ],
    },
    hindi: {
      hook: 'मॉडल पहले गलत अनुमान लगाता है। ढलान देखकर छोटी सी सीढ़ी नीचे की ओर चलता है।',
      analogy: 'कोहरे में पहाड़। घाटी नहीं दिखती, इसलिए पैरों से ढलान महसूस कर छोटी चाल चलो।',
      meetingLine: 'Gradient descent का मतलब है: गलती की ढलान पकड़ो और धीरे-धीरे नीचे उतरो।',
      sixty: { what: 'गलती के पहाड़ से नीचे चलना।', why: 'पहला अनुमान आमतौर पर गलत होता है।', remember: 'नया अनुमान = पुराना − कदम × ढलान' },
    },
    diagramCaption: 'The curve is the hill. Dots are footsteps. They should slide toward the lowest point, not bounce over it.',
    unitsNote: 'Loss units depend on the scoreboard (squared rupees, log-probability). The walk still uses the slope, not the unit name.',
    needFirst: ['mse-mae-huber'],
    readNext: ['learning-rate', 'sgd-mini-batch'],
    searchAliases: ['downhill', 'steepest descent', 'walk the loss'],
  }),
  'sgd-mini-batch': e({
    sixty: { what: 'Estimate the slope from a handful of rows, not the whole set.', why: 'Full-data slopes are honest and slow.', remember: 'Batch 32 is the usual first bite' },
    meetingLine: 'SGD is gradient descent that peeks at a random bite of data so we can take more cheap steps.',
    mixups: [
      { other: 'Full GD', otherSlug: 'gradient-descent', vs: 'GD waits for every row. SGD updates after one row or a mini-batch.' },
      { other: 'Epoch', otherSlug: 'epochs-batches', vs: 'An epoch is one full pass. SGD takes many updates inside that pass.' },
    ],
    symbols: [{ symbol: 'B', say: 'B / batch size', means: 'how many examples share one slope' }],
    secondExample: {
      title: '1,000 exam scripts',
      setup: 'A teacher could average every script before changing the lesson (full GD).',
      steps: ['Or read 32 scripts, tweak the lesson, repeat.', 'The advice is noisier but the class improves the same hour.', 'One full pass through 1,000 scripts is still one epoch.'],
      takeaway: 'Noise is the price of speed — and sometimes it escapes a shallow dip.',
    },
    wrongWalkthrough: {
      title: 'Batch size 1 with a huge learning rate',
      setup: 'Every row yanks the weights a different way.',
      steps: ['Loss jumps like static.', 'You think the model is broken.', 'Raise B or shrink η and the walk calms down.'],
      takeaway: 'Jitter is expected. A fireworks plot is a tuning bug.',
    },
    rememberNumber: { label: 'Default mini-batch', value: '32' },
    classroomScript: ['I will not poll the whole class each time.', 'I will ask ten students, then adjust.', 'Tomorrow a different ten.', 'That is a mini-batch.'],
    myths: [{ myth: 'Noisy updates are always bad.', fact: 'A little noise can bounce you out of a tiny valley.' }],
    inThisApp: 'The SGD lab’s shaky path versus the smooth GD path is this idea.',
    compareWith: ['gradient-descent', 'epochs-batches', 'adam'],
    quiz: [
      quiz('A mini-batch is…', ['The whole dataset', 'A small random group of rows', 'The test set'], 1, 'A bite, not the buffet.'),
      quiz('Why use SGD?', ['It is always more accurate', 'It is cheaper per step on big data', 'It needs no learning rate'], 1, 'Speed and many updates.'),
      quiz('Steps inside one epoch?', ['Always 1', 'About N / batch size', 'Always 100'], 1, 'More bites, more steps.'),
    ],
    beforeAfter: { before: 'Wait for 1,000,000 rows, then take one step.', after: 'Take a step every 32 rows and finish the day.' },
    vocab: [{ word: 'stochastic', def: 'a little random on purpose' }],
    simple: { hook: 'Don’t wait for every example. Use a small group, step, repeat.', analogy: 'Ask ten students, not the whole school.', explanation: ['A batch is a bite of data.', 'The slope from a bite is a bit messy.', 'Messy and fast often beats perfect and slow.'] },
    hindi: { hook: 'पूरी डेटा की प्रतीक्षा मत करो। थोड़े उदाहरण देखो, कदम चलाओ।', analogy: 'पूरी कक्षा की जगह दस विद्यार्थियों से पूछो।', meetingLine: 'SGD छोटे बैच से ढलान अनुमान लगाता है।', sixty: { what: 'थोड़े से उदाहरण से ढलान।', why: 'पूरा डेटा धीमा है।', remember: 'बैच 32 आज़माओ' } },
    diagramCaption: 'Grey line: calm full-batch walk. Orange line: the same hill, but each step listened to a noisy sample.',
    needFirst: ['gradient-descent'],
    readNext: ['epochs-batches', 'adam'],
    searchAliases: ['noisy gradient', 'batch size'],
  }),
  'learning-rate': e({
    sixty: { what: 'How long each downhill stride is.', why: 'The slope only names the direction.', remember: 'Too big explodes. Too small freezes.' },
    meetingLine: 'Learning rate is the volume knob on every update — how brave each step is.',
    mixups: [{ other: 'Momentum', otherSlug: 'momentum', vs: 'Learning rate is stride length. Momentum is memory of earlier strides.' }],
    symbols: [{ symbol: 'η', say: 'eta', means: 'learning rate' }],
    secondExample: {
      title: 'Shower tap',
      setup: 'Water is scalding. You need lukewarm.',
      steps: ['Tiny twist: nothing changes. That is η = 0.0001.', 'Sensible twist: closer. That is 0.01.', 'Yank the tap: ice or steam. That is 1.0.'],
      takeaway: 'Courage and direction are different knobs.',
    },
    wrongWalkthrough: {
      title: 'NaN after epoch 1',
      setup: 'η = 2 on unscaled house prices.',
      steps: ['First update is enormous.', 'Weights become Inf, then NaN.', 'Scale features and drop η to 0.001.'],
      takeaway: 'Exploding loss is often η plus unscaled columns.',
    },
    rememberNumber: { label: 'Starter η', value: '0.001 for Adam, 0.01 for plain GD' },
    classroomScript: ['The slope said “go left.”', 'The learning rate said “how far?”', 'I tried a giant step and fell over.', 'Now I take baby steps.'],
    myths: [{ myth: 'There is one perfect η for all models.', fact: 'It depends on scale, optimizer, and batch size.' }],
    inThisApp: 'On Gradient Descent, the learning-rate slider is this term. Watch the ball overshoot when you crank it.',
    compareWith: ['gradient-descent', 'learning-rate-schedules', 'adam'],
    quiz: [
      quiz('Huge η usually…', ['Fits faster and better', 'Overshoots or explodes', 'Does nothing'], 1, 'Brave is not always smart.'),
      quiz('Tiny η looks like…', ['Instant win', 'A frozen training curve', 'Overfitting'], 1, 'The walk is happening, just invisibly slowly.'),
      quiz('η is…', ['A dataset', 'A step-size number', 'An activation'], 1, 'One number multiplying the slope.'),
    ],
    beforeAfter: { before: 'Every update is an unknown leap.', after: 'You chose a stride and can defend it.' },
    vocab: [{ word: 'convergence', def: 'the walk settling near a good valley' }],
    simple: { hook: 'It is only “how big is the step?”', analogy: 'A shower tap. Tiny twist or a yank.', explanation: ['Direction comes from the slope.', 'Size comes from η.', 'Start small if the plot looks wild.'] },
    hindi: { hook: 'ढलान दिशा बताती है। लर्निंग रेट बताता है कितनी दूर चलना है।', analogy: 'शावर का नल — हल्की घुंडी या झटका।', meetingLine: 'Learning rate हर अपडेट की लंबाई है।', sixty: { what: 'कदम कितना बड़ा।', why: 'ढलान सिर्फ़ दिशा है।', remember: 'बड़ा = फट, छोटा = रुका' } },
    diagramCaption: 'Same hill, three stride lengths. The middle walk arrives. The huge one bounces.',
    unitsNote: 'η itself has no friendly unit. It is scaled by feature size, so scale the data first.',
    needFirst: ['gradient-descent'],
    readNext: ['learning-rate-schedules', 'adam'],
    searchAliases: ['step size', 'eta', 'lr'],
  }),
  momentum: e({
    sixty: { what: 'Remember recent steps so the walk rolls instead of zigzags.', why: 'Skinny valleys make plain GD chatter.', remember: 'β ≈ 0.9 means 90% old speed' },
    meetingLine: 'Momentum is a heavy ball: it keeps a bit of yesterday’s direction so we stop twitching.',
    mixups: [{ other: 'Adam', otherSlug: 'adam', vs: 'Momentum remembers direction. Adam also rescales each weight’s step.' }],
    symbols: [{ symbol: 'β', say: 'beta', means: 'how much old velocity we keep, often 0.9' }],
    secondExample: {
      title: 'Shopping trolley',
      setup: 'The aisle is long, the floor is tiled and jerky.',
      steps: ['Without momentum you wiggle left-right on every tile.', 'A loaded trolley straightens.', 'You still steer, you just don’t reset every second.'],
      takeaway: 'Memory damps the twitch.',
    },
    wrongWalkthrough: {
      title: 'β = 0.99 and a big η',
      setup: 'The ball rolls past the valley and loops.',
      steps: ['Loss oscillates with a slow period.', 'You lower β or η.', 'The orbit collapses into the bowl.'],
      takeaway: 'Too much memory is a runaway trolley.',
    },
    rememberNumber: { label: 'Typical β', value: '0.9' },
    classroomScript: ['Yesterday I was going that way.', 'Today the slope disagrees a little.', 'I only partly listen.', 'That mix is momentum.'],
    myths: [{ myth: 'Momentum always helps.', fact: 'On tiny convex bowls, plain GD is already fine.' }],
    inThisApp: 'Momentum optimizer lab: the path straightens in the long valley.',
    compareWith: ['gradient-descent', 'adam'],
    quiz: [
      quiz('Momentum stores…', ['The dataset', 'Recent update direction', 'The test score'], 1, 'Velocity is memory of steps.'),
      quiz('β near 1 means…', ['Ignore the past', 'Trust the past a lot', 'Stop training'], 1, '0.9 keeps most of the old speed.'),
      quiz('Zigzag valleys need…', ['More dropout', 'Memory of direction', 'A bigger test set'], 1, 'That is momentum’s job.'),
    ],
    beforeAfter: { before: 'Each step forgets the last one.', after: 'The walk has a roll.' },
    vocab: [{ word: 'velocity', def: 'a running average of recent gradients' }],
    simple: { hook: 'Keep some of the last step so you don’t wiggle.', analogy: 'A heavy ball rolling downhill.', explanation: ['Old direction plus new slope.', 'Wiggles cancel.', 'The long way down speeds up.'] },
    hindi: { hook: 'पिछले कदम याद रखो ताकि चाल सीधी रहे।', analogy: 'भारी गेंद — कंकड़ पर नहीं रुकती।', meetingLine: 'Momentum पुरानी दिशा का स्मरण है।', sixty: { what: 'पुरानी चाल याद रखना।', why: 'तिरछी घाटी में GD काँपता है।', remember: 'β ≈ 0.9' } },
    diagramCaption: 'Grey zigzags. Purple remembers and cuts across the valley.',
    needFirst: ['gradient-descent', 'learning-rate'],
    readNext: ['adam'],
    searchAliases: ['heavy ball', 'velocity'],
  }),
  adam: e({
    sixty: { what: 'A per-weight step size using two memories: direction and bumpiness.', why: 'One η for every weight is awkward.', remember: 'Default-ish: lr 0.001, β1 0.9, β2 0.999' },
    meetingLine: 'Adam is the automatic gearbox: each weight gets its own scaled stride.',
    mixups: [{ other: 'SGD + momentum', otherSlug: 'momentum', vs: 'Adam also divides by a running RMS of the gradient, so jumpy weights take smaller steps.' }],
    symbols: [
      { symbol: 'm', say: 'm / first moment', means: 'smoothed gradient (direction)' },
      { symbol: 'v', say: 'v / second moment', means: 'smoothed squared gradient (bumpiness)' },
    ],
    secondExample: {
      title: 'Two streets',
      setup: 'One icy, one gravel.',
      steps: ['One shoe size fails both.', 'Adam puts a different shoe on each foot.', 'The icy weight gets cautious steps.'],
      takeaway: 'Adaptive ≠ magic. It is manners per parameter.',
    },
    wrongWalkthrough: {
      title: 'Adam still NaNs',
      setup: 'lr = 0.1 on raw pixels.',
      steps: ['Adaptive scaling cannot save a ridiculous global lr.', 'Drop to 0.001 and scale inputs.', 'Training starts.'],
      takeaway: 'Adam is polite, not invincible.',
    },
    rememberNumber: { label: 'Adam learning rate', value: '0.001' },
    classroomScript: ['This weight has been shouting.', 'This other one whispers.', 'I will not give them the same shove.', 'That is Adam.'],
    myths: [{ myth: 'Always use Adam.', fact: 'Well-tuned SGD still wins some vision leaderboards. Adam is the best first try.' }],
    inThisApp: 'Adam optimizer page. Compare it with the GD ball on the same hill.',
    compareWith: ['momentum', 'sgd-mini-batch', 'learning-rate'],
    quiz: [
      quiz('Adam adapts…', ['The dataset', 'Each weight’s step', 'The activation'], 1, 'Per-parameter scaling.'),
      quiz('A common Adam lr is…', ['10', '0.001', '0'], 1, 'Three zeros after the point is the folk default.'),
      quiz('AdamW fixes…', ['Dropout', 'How decay mixes with adaptive steps', 'Softmax'], 1, 'Decay should sit outside Adam’s scaling.'),
    ],
    beforeAfter: { before: 'One stride length for every knob.', after: 'Jumpy knobs automatically walk smaller.' },
    vocab: [{ word: 'adaptive', def: 'the step size changes with recent history' }],
    simple: { hook: 'Adam gives each weight its own step size.', analogy: 'Different shoes for ice and gravel.', explanation: ['It remembers direction.', 'It remembers how wild the slope was.', 'Then it takes a calibrated step.'] },
    hindi: { hook: 'हर वज़न का अपना कदम।', analogy: 'अलग जूते — बर्फ और बजरी।', meetingLine: 'Adam अपने आप हर पैरामीटर की चाल बदलता है।', sixty: { what: 'व्यक्तिगत कदम।', why: 'एक η सबके लिए कठिन।', remember: 'lr 0.001' } },
    diagramCaption: 'Purple (adaptive) arrives with less drama than grey (one stride).',
    needFirst: ['gradient-descent', 'momentum'],
    readNext: ['weight-decay', 'learning-rate-schedules'],
    searchAliases: ['adamw', 'rmsprop', 'adagrad'],
  }),
  'learning-rate-schedules': e({
    sixty: { what: 'Change η over time: brave early, polite late.', why: 'One speed for a whole hike is clumsy.', remember: 'Warmup, then decay' },
    meetingLine: 'A schedule is a story for the learning rate: hunt first, settle later.',
    mixups: [{ other: 'Early stopping', otherSlug: 'early-stopping', vs: 'A schedule changes η. Early stopping may halt the run. They pair well.' }],
    symbols: [{ symbol: 'γ', say: 'gamma', means: 'the multiply-by-this decay factor, like 0.1' }],
    secondExample: {
      title: 'House search',
      setup: 'Big strides in the hallway, tiny steps in the room with the keys.',
      steps: ['Epochs 1–4: warmup from 0.02 to 0.1.', 'Then decay every 8 epochs.', 'Late training stops bouncing.'],
      takeaway: 'Pace is a policy, not a constant.',
    },
    wrongWalkthrough: {
      title: 'Decay on epoch 2',
      setup: 'η collapses before the model learned the shape.',
      steps: ['Train loss plateaus high.', 'You thought the model was weak.', 'Delay decay or raise the floor.'],
      takeaway: 'Do not freeze a half-trained student.',
    },
    rememberNumber: { label: 'Common step decay', value: '×0.1 every 10 epochs' },
    classroomScript: ['Early: look around.', 'Middle: walk with purpose.', 'Late: tiptoe so we do not kick the vase.', 'That is a schedule.'],
    myths: [{ myth: 'Decay is only for researchers.', fact: 'Any long run benefits from slowing down at the end.' }],
    inThisApp: 'Training visualizations: if the late curve chatters, you wanted a schedule.',
    compareWith: ['learning-rate', 'early-stopping'],
    quiz: [
      quiz('Warmup means…', ['Stop training', 'Start η small, then raise it', 'Drop η to zero'], 1, 'Protect a random start.'),
      quiz('Why decay late?', ['To overfit more', 'To settle instead of bounce', 'To skip validation'], 1, 'Polite steps near the bowl.'),
      quiz('A schedule changes…', ['The labels', 'η over time', 'The test set'], 1, 'Only the stride policy.'),
    ],
    beforeAfter: { before: 'Same η from step 1 to step 50,000.', after: 'The hike has gears.' },
    vocab: [{ word: 'warmup', def: 'a few steps where η rises from a tiny start' }],
    simple: { hook: 'Change the step size as training goes on.', analogy: 'Hallway strides, then tiny steps for keys.', explanation: ['Start careful or start searching.', 'Later, slow down.', 'That story is the schedule.'] },
    hindi: { hook: 'समय के साथ कदम बदलो।', analogy: 'गलियारे में बड़े कदम, कमरे में छोटे।', meetingLine: 'शेड्यूल लर्निंग रेट की कहानी है।', sixty: { what: 'η समय के साथ।', why: 'एक गति अधूरी।', remember: 'वार्मअप, फिर कमी' } },
    diagramCaption: 'The rate line climbs (warmup) then stairs down. That is the pace story.',
    needFirst: ['learning-rate'],
    readNext: ['early-stopping'],
    searchAliases: ['cosine annealing', 'lr decay', 'warmup'],
  }),
  'gradient-clipping': e({
    sixty: { what: 'Cap a huge slope so one batch cannot explode the net.', why: 'RNNs and deep stacks sometimes shout.', remember: 'Keep the direction, shorten the stride' },
    meetingLine: 'Clipping is a speed limiter: same compass, shorter step when the slope is a cannon.',
    mixups: [{ other: 'Vanishing gradients', otherSlug: 'vanishing-exploding', vs: 'Clipping fights explosions. Vanishing is the opposite disease (slopes too small).' }],
    symbols: [{ symbol: 'c', say: 'c / clip norm', means: 'max allowed length of the gradient vector' }],
    secondExample: {
      title: 'Speed bump',
      setup: 'Gradient [3, 4], length 5, cap 1.',
      steps: ['Multiply by 1/5.', 'New vector [0.6, 0.8].', 'Still points the same way.'],
      takeaway: 'Compass stays. Speed drops.',
    },
    wrongWalkthrough: {
      title: 'Clip at 0.01 always',
      setup: 'Every step is crushed.',
      steps: ['Learning crawls.', 'You add more epochs.', 'Raise the cap or lower η properly.'],
      takeaway: 'A belt that is too tight is just under-training.',
    },
    rememberNumber: { label: 'Common max-norm', value: '1.0 or 5.0' },
    classroomScript: ['That batch produced a monster slope.', 'I will not let it drive.', 'Same direction, shorter legs.', 'That is clipping.'],
    myths: [{ myth: 'Clipping fixes a bad learning rate forever.', fact: 'It is a seatbelt. You still tune η.' }],
    inThisApp: 'RNN and LSTM labs are where exploding blame shows up. Clipping is the safety switch.',
    compareWith: ['vanishing-exploding', 'learning-rate'],
    quiz: [
      quiz('Norm clipping keeps…', ['The length, changes direction', 'The direction, shortens length', 'Neither'], 1, 'Same way, smaller step.'),
      quiz('Clip when you see…', ['Pretty accuracy', 'NaNs or huge jumps', 'A small dataset'], 1, 'Explosions.'),
      quiz('If every step clips…', ['Perfect', 'η is probably too big', 'Add more dropout'], 1, 'The limiter is always on — fix the driver.'),
    ],
    beforeAfter: { before: 'One wild batch → NaN.', after: 'Same batch, capped shove.' },
    vocab: [{ word: 'grad norm', def: 'the length of the whole gradient vector' }],
    simple: { hook: 'If the slope is huge, shrink it before you step.', analogy: 'A car speed limiter.', explanation: ['Keep the steering.', 'Cut the speed.', 'Used a lot in RNNs.'] },
    hindi: { hook: 'बहुत बड़ी ढलान को काट दो।', analogy: 'कार की स्पीड लिमिट।', meetingLine: 'क्लिपिंग दिशा रखती है, चाल छोटा करती है।', sixty: { what: 'बड़ी ढलान पर कैप।', why: 'एक बैच नेट तोड़ सकता है।', remember: 'दिशा रखो, चाल काटो' } },
    diagramCaption: 'Red bar is the raw shout. Blue bar is the same shout after the cap.',
    needFirst: ['gradient-descent', 'vanishing-exploding'],
    readNext: ['vanishing-exploding'],
    searchAliases: ['clip grad', 'max grad norm'],
  }),
  'local-minima': e({
    sixty: { what: 'A dip that is not the deepest, or a flat pass that fools the slope.', why: 'Zero slope ≠ finished.', remember: 'Saddles fool you more than ponds in deep nets' },
    meetingLine: 'A local minimum is a small pond. A saddle is a mountain pass — downhill exists, the slope just went quiet.',
    mixups: [{ other: 'Overfitting', otherSlug: 'overfitting', vs: 'A local min is about the loss surface. Overfitting is about train vs test.' }],
    symbols: [{ symbol: '∇L = 0', say: 'gradient equals zero', means: 'a critical point: bowl, peak, or pass' }],
    secondExample: {
      title: 'Foggy range',
      setup: 'You walk into a pond and celebrate.',
      steps: ['A ridge to the side leads to a lake.', 'SGD noise is a shove.', 'Sometimes the shove is the feature.'],
      takeaway: 'Stuck is a question, not a verdict.',
    },
    wrongWalkthrough: {
      title: 'You blamed a local min. It was η.',
      setup: 'Loss stuck at the random-start value.',
      steps: ['You restarted 20 times.', 'Then you dropped η and it moved.', 'The “local min” was a dead step size.'],
      takeaway: 'Check η, dead ReLUs, and data bugs before the mountain-range story.',
    },
    rememberNumber: { label: 'Saddle toy', value: 'z = x² − y² is zero-slope at the origin' },
    classroomScript: ['The slope is zero. Am I done?', 'Not if one path still goes down.', 'That is a saddle.', 'Give the ball a sideways nudge.'],
    myths: [{ myth: 'Local minima ruin modern deep nets.', fact: 'In high dimensions, saddles and flat regions are the more common stall.' }],
    inThisApp: 'Gradient Descent lab’s saddle surface is this picture.',
    compareWith: ['gradient-descent', 'sgd-mini-batch'],
    quiz: [
      quiz('A saddle is…', ['The deepest bowl', 'A pass: down one way, up another', 'The test set'], 1, 'Horse-saddle shape.'),
      quiz('Zero gradient always means best?', ['Yes', 'No', 'Only for classification'], 1, 'Bowl, peak, or pass.'),
      quiz('SGD noise can…', ['Only hurt', 'Help escape a small dip', 'Delete saddles from math'], 1, 'A shove off a tiny pond.'),
    ],
    beforeAfter: { before: 'Stuck means “the math is finished.”', after: 'Stuck means “ask whether every nearby path goes up.”' },
    vocab: [{ word: 'saddle', def: 'a critical point that is a min one way and a max another' }],
    simple: { hook: 'Not every valley is the lowest. Some flat spots are just passes.', analogy: 'A small pond vs the ocean. A mountain pass vs a bowl.', explanation: ['A bowl traps you.', 'A pass only looks flat.', 'A nudge can escape a pass.'] },
    hindi: { hook: 'हर गड्ढा सबसे गहरा नहीं। कुछ समतल जगह दर्रा होती है।', analogy: 'छोटा तालाब बनाम समुद्र।', meetingLine: 'लोकल मिनिमम छोटा गड्ढा है, सैडल दर्रा है।', sixty: { what: 'छोटा गड्ढा या दर्रा।', why: 'शून्य ढलान ≠ खत्म।', remember: 'सैडल ज़्यादा धोखा देते हैं' } },
    diagramCaption: 'Move x and the surface rises. Move y and it falls. Origin slope is 0 — that is the saddle.',
    needFirst: ['gradient-descent'],
    readNext: ['sgd-mini-batch', 'momentum'],
    searchAliases: ['saddle point', 'critical point'],
  }),
};

export function getTermEnhance(term: TermLesson): TermEnhance {
  return {
    ...fallbackEnhance(term),
    ...termsStudioEnhance[term.slug],
    ...termsStudioEnhanceRest[term.slug],
    ...termsStudioEnhanceNew[term.slug],
  };
}

export function getReadingNeighbors(slug: string): { prev?: TermLesson; next?: TermLesson } {
  const index = termsStudioReadingOrder.indexOf(slug as typeof termsStudioReadingOrder[number]);
  if (index < 0) {
    const fallbackIndex = termsStudioLessons.findIndex((term) => term.slug === slug);
    if (fallbackIndex < 0) return {};
    return {
      prev: fallbackIndex > 0 ? termsStudioLessons[fallbackIndex - 1] : undefined,
      next: fallbackIndex < termsStudioLessons.length - 1 ? termsStudioLessons[fallbackIndex + 1] : undefined,
    };
  }
  return {
    prev: index > 0 ? getTermLesson(termsStudioReadingOrder[index - 1] ?? '') : undefined,
    next: index < termsStudioReadingOrder.length - 1 ? getTermLesson(termsStudioReadingOrder[index + 1] ?? '') : undefined,
  };
}

export function matchTermsStudioQuery(query: string): TermLesson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return termsStudioLessons;
  const confused = termsStudioConfusion[needle];
  return termsStudioLessons.filter((term) => {
    if (confused === term.slug) return true;
    const extra = getTermEnhance(term);
    const aliases = [term.label, term.slug.replace(/-/g, ' '), ...term.synonyms, ...extra.searchAliases];
    if (aliases.some((alias) => alias.toLowerCase() === needle)) return true;
    if (needle.length <= 3) {
      const words = aliases.join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      return words.some((word) => word === needle || word.startsWith(`${needle}-`) || word.startsWith(needle) && needle.length > 2);
    }
    const hay = [
      term.label,
      term.blurb,
      term.analogy,
      term.hook,
      extra.meetingLine,
      extra.sixty.what,
      extra.sixty.remember,
      ...term.synonyms,
      ...term.tags,
      ...extra.searchAliases,
    ].join(' ').toLowerCase();
    return hay.includes(needle);
  });
}

export function smarterRelated(term: TermLesson): TermLesson[] {
  const extra = getTermEnhance(term);
  const slugs = [...new Set([...extra.needFirst, ...term.related, ...extra.compareWith, ...extra.readNext])];
  return slugs
    .map((slug) => getTermLesson(slug))
    .filter((item): item is TermLesson => Boolean(item) && item.slug !== term.slug)
    .slice(0, 8);
}

export function fallbackEnhance(term: TermLesson): TermEnhance {
  const firstRelated = term.related[0];
  return {
    sixty: { what: term.blurb, why: term.hook, remember: term.formulaPlain ?? term.blurb },
    meetingLine: term.hook,
    mixups: term.related.slice(0, 2).map((slug) => ({ other: slug, otherSlug: slug, vs: `Read ${slug.replace(/-/g, ' ')} next to this page and name one difference.` })),
    symbols: term.formula ? [{ symbol: 'see formula', say: 'see the formula block', means: term.formulaPlain ?? term.blurb }] : [],
    secondExample: {
      title: `Another story for ${term.label}`,
      setup: term.workedExample.setup,
      steps: term.workedExample.steps,
      takeaway: term.workedExample.takeaway,
    },
    wrongWalkthrough: {
      title: `When ${term.label} is used badly`,
      setup: term.watchFor,
      steps: [term.watchFor, 'Change only one knob and watch the demo.', 'Name the symptom in one sentence.'],
      takeaway: term.watchFor,
    },
    rememberNumber: { label: 'Starter habit', value: term.tryThis[0] ?? 'Change one knob, then explain what moved.' },
    classroomScript: [term.analogy, term.hook, term.explanation[0] ?? term.blurb, term.workedExample.takeaway],
    myths: [{ myth: `${term.label} is only for experts.`, fact: term.blurb }],
    inThisApp: term.labLinks[0] ? `Open ${term.labLinks[0].label}. That screen is this term in motion.` : 'Stay on this page and use the demo.',
    compareWith: term.related.filter((slug) => slug !== firstRelated).slice(0, 3),
    quiz: [
      quiz(`What is ${term.label} trying to do?`, [term.blurb, 'Shuffle the test set', 'Delete the loss'], 0, term.blurb),
      quiz('A good next action is…', ['Ignore the demo', term.tryThis[0] ?? 'Turn one knob', 'Skip the analogy'], 1, 'The studio is for trying.'),
      quiz('Watch-out in one line?', [term.watchFor, 'There are never any traps', 'Always use η = 10'], 0, term.watchFor),
    ],
    beforeAfter: { before: `Without ${term.label}: the job is guesswork.`, after: `With ${term.label}: ${term.blurb}` },
    vocab: term.tags.slice(0, 2).map((word) => ({ word, def: `${word} is part of the ${term.label} story.` })),
    simple: { hook: term.hook, analogy: term.analogy, explanation: term.explanation },
    hindi: {
      hook: term.hook,
      analogy: term.analogy,
      meetingLine: term.hook,
      sixty: { what: term.blurb, why: term.hook, remember: term.formulaPlain ?? term.blurb },
    },
    diagramCaption: `This demo is the picture for ${term.label}. Read the numbers, then say the analogy out loud.`,
    unitsNote: undefined,
    needFirst: [],
    readNext: term.related.slice(0, 2),
    searchAliases: term.synonyms,
  };
}
