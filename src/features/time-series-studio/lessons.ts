import type { LabKind } from "./types";
export type Lesson = {
  problem: string;
  intuition: string;
  formula: string;
  variables: string;
  example: string;
  steps: string[];
  applications: string;
  strengths: string;
  limits: string;
  mistake: string;
  alternative: string;
};
export const LESSONS: Record<LabKind, Lesson> = {
  "moving-average": {
    problem:
      "Noisy measurements can hide a slower signal. A moving average summarizes a local window without fitting a parametric trend.",
    intuition:
      "Imagine sliding a ruler across a jagged line. A larger window averages away more short changes, but responds later to genuine changes.",
    formula: "MAₜ = (yₜ + yₜ₋₁ + … + yₜ₋ₙ₊₁) / n",
    variables:
      "yₜ: observed value; n: number of observations; MAₜ: trailing mean. Full windows only: the first n−1 values are unavailable.",
    example:
      "For [2, 4, 6, 8, 10] and n = 3, the complete trailing means are 4, 6, 8. At the final step: (6 + 8 + 10) / 3 = 8; the residual is 10 − 8 = 2.",
    steps: [
      "Choose a window shorter than the available history.",
      "Select n consecutive observations ending at the current time.",
      "Sum the values and divide by n.",
      "Advance one time step, dropping the oldest observation.",
      "For a recursive forecast, append the predicted mean and repeat.",
    ],
    applications:
      "Sensor monitoring, demand trend exploration, and a simple forecasting baseline.",
    strengths:
      "Fast, transparent, robust to individual small fluctuations, and easy to audit.",
    limits:
      "Equal weights ignore observation age. Turning points lag; a constant window cannot adapt to every regime.",
    mistake:
      "Centered or leading windows use future observations. They are retrospective displays, not real-time predictors. Lagging a curve does not create a new causal forecasting model.",
    alternative:
      "Use SES for age-dependent weighting, Holt–Winters for trend and seasonality, or a learned model when sufficient training data exists.",
  },
  "exponential-smoothing": {
    problem:
      "You need a compact level estimate that updates as each new observation arrives.",
    intuition:
      "Blend the latest observation with your previous estimate. Alpha sets how quickly old evidence fades.",
    formula: "ℓₜ = αyₜ + (1 − α)ℓₜ₋₁; ŷₜ₊ₕ|ₜ = ℓₜ",
    variables:
      "α ∈ (0,1]: smoothing weight; ℓₜ: updated level; h: positive forecast horizon. SES has no separate trend or seasonal component.",
    example:
      "With previous level 10, observation 14 and α = 0.25, the new level is 0.25 × 14 + 0.75 × 10 = 11. Every multi-step point forecast from that origin equals 11.",
    steps: [
      "Initialize a level from the first observation or a training-only average.",
      "Forecast the next value using the previous level.",
      "Observe the actual value and calculate the one-step error.",
      "Update the level with alpha.",
      "Freeze the forecast origin for an honest holdout evaluation.",
    ],
    applications:
      "Short-term inventory and approximately level demand without strong trend or seasonality.",
    strengths:
      "Only one main smoothing parameter and a small state. Updates can be performed online.",
    limits:
      "Point forecasts are flat. Gaussian intervals assume additive, uncorrelated, stable-variance innovations; they can be poorly calibrated otherwise.",
    mistake:
      "Do not call a same-time smoothed value a one-step forecast. Do not tune alpha by minimizing test error, and do not draw an upward SES forecast simply because the data trends.",
    alternative:
      "Holt–Winters for seasonal trend, or ARIMA when differenced serial correlation dominates.",
  },
  "holt-winters": {
    problem:
      "Demand may have both a changing level, a trend, and a recurring seasonal pattern.",
    intuition:
      "Keep three coordinated memories: the current baseline, the direction it moves, and a correction for this seasonal position.",
    formula:
      "Additive: ℓₜ=α(yₜ−sₜ₋ₘ)+(1−α)(ℓₜ₋₁+bₜ₋₁); bₜ=β(ℓₜ−ℓₜ₋₁)+(1−β)bₜ₋₁; sₜ=γ(yₜ−ℓₜ)+(1−γ)sₜ₋ₘ",
    variables:
      "m: seasonal period in observations; ℓ: level; b: trend per step; s: seasonal offset. Multiplicative seasonality divides out the seasonal factor and forecasts (ℓ + hb) × s.",
    example:
      "With level 100, trend 2 and next seasonal effect −10, a one-step additive forecast is 100 + 2 − 10 = 92. With seasonal factor 0.9, the multiplicative version gives (100 + 2) × 0.9 = 91.8.",
    steps: [
      "Choose the number of observations in a genuine seasonal cycle.",
      "Initialize level, trend and seasonal factors from two training cycles.",
      "Remove seasonality and update the level.",
      "Update trend from the level change, then the seasonal effect.",
      "Extrapolate level and trend and reuse the matching seasonal positions.",
    ],
    applications:
      "Retail sales, electricity demand, and website traffic when repeating cycles are sufficiently stable.",
    strengths:
      "Interpretable components and strong performance on many small seasonal datasets.",
    limits:
      "Needs at least two complete training cycles. Wrong period or changing seasonality causes systematic errors. Multiplicative models require positive data.",
    mistake:
      "A 12-step period means twelve observations, not automatically twelve months. Avoid interpreting initialized fitted values as honest prequential predictions.",
    alternative:
      "Seasonal naïve is a useful baseline. SARIMA handles correlated residual structure; richer models may be needed for multiple seasonal periods.",
  },
  "arima-concept": {
    problem:
      "A series may become stable after differencing but still contain correlations between past values and forecast errors.",
    intuition:
      "Difference to remove persistent level changes, then describe remaining dependence using past transformed values (AR) and innovations (MA).",
    formula: "φ(B)(1−B)ᵈyₜ = c + θ(B)εₜ; seasonal terms use Bˢ",
    variables:
      "p: AR order; d: differences; q: MA order. P,D,Q are seasonal counterparts at period s. B shifts a series by one observation.",
    example:
      "For [1, 3, 6, 10], one difference is [2, 3, 4]. ARIMA(0,1,0) without drift forecasts the last observed level repeatedly; the uncertainty grows over the horizon.",
    steps: [
      "Inspect the original data and its sampling interval.",
      "Difference cautiously and compare ACF/PACF before and after.",
      "Choose modest orders supported by the amount of training data.",
      "Fit the CTSA statistical likelihood engine.",
      "Evaluate untouched holdout values and inspect warnings and diagnostics.",
    ],
    applications:
      "Univariate economic, engineering and demand series with regular spacing and stable transformed dynamics.",
    strengths:
      "Explicit statistical assumptions, seasonal variants, and model-based prediction variance.",
    limits:
      "Order selection and stationarity matter. ACF/PACF shapes are hints rather than proofs. The browser engine does not expose likelihood or residual arrays, so those diagnostics remain unavailable. Pure integrated white-noise orders use exact closed-form Gaussian forecasts to avoid a native edge-case bug.",
    mistake:
      "Over-differencing can introduce dependence. Do not replace ARIMA with polynomial extrapolation or report AIC from an unrelated fitted model.",
    alternative:
      "SES for a level-only process, Holt–Winters for interpretable seasonal components, or a neural model with enough data and validation evidence.",
  },
  "anomaly-detection": {
    problem:
      "Monitoring systems need to distinguish unusual observations from normal fluctuation and repeating context.",
    intuition:
      "Estimate an expected value and acceptable range from observations already available. Flag a new value when it falls outside that range.",
    formula: "zₜ = (yₜ − μpast) / σpast; flag if |zₜ| > threshold",
    variables:
      "The past window excludes the current observation. Modified Z uses median/MAD. IQR fences use quartiles. Seasonal residuals compare the same seasonal phase.",
    example:
      "If the past mean is 20, standard deviation is 2 and threshold is 3, the accepted range is [14,26]. A new value 30 is outside it. The current point must not inflate its own baseline.",
    steps: [
      "Choose an explicit statistical detector and past-window length.",
      "Replay the observations chronologically.",
      "Inject a spike, drop, persistent shift or seasonal disruption.",
      "Inspect the actual alert values and causal baseline.",
      "Adjust threshold and compare missed injected points against extra alerts.",
    ],
    applications:
      "Server monitoring, quality control, sensor fault detection and traffic monitoring.",
    strengths: "Transparent thresholds, fast updates and inspectable alerts.",
    limits:
      "An anomaly is unusual, not necessarily a fault. Persistent shifts can contaminate adaptive baselines. Collective runs need temporal interpretation; this workspace highlights runs of flagged points, not a separate learned collective detector.",
    mistake:
      "Do not call every statistical rule machine learning. Do not describe local replay as a live external feed. Alert cooldown suppresses notifications, not underlying detections.",
    alternative:
      "Use domain-specific seasonal context or a validated learned detector when simple statistical baselines fail.",
  },
  "rnn-forecasting": {
    problem:
      "The next observation can depend on a sequence rather than a single lag.",
    intuition:
      "Process observations in order, updating a hidden state that compresses what has been seen so far.",
    formula: "hₜ = f(Wxₜ + Uhₜ₋₁ + b); ŷ = Vhₜ + c",
    variables:
      "x: scaled input; h: hidden-state vector; W,U,V: learned matrices. This implementation trains a one-step output and recursively rolls it forward.",
    example:
      "With one unit, x = 1, previous h = 0, input weight 0.5 and zero bias, the tanh hidden state is tanh(0.5) ≈ 0.4621. The actual displayed inspector uses your trained weights.",
    steps: [
      "Split the dataset chronologically before fitting the scaler.",
      "Build windows with targets strictly after their inputs.",
      "Train real recurrent weights through backpropagation through time.",
      "Watch real training and validation losses.",
      "Freeze weights and evaluate recursive holdout predictions.",
    ],
    applications:
      "Sequence forecasting when sufficient observations are available and nonlinear temporal dependence is plausible.",
    strengths:
      "Learns a recurrent representation rather than a fixed smoothing equation.",
    limits:
      "Vanishing gradients can limit long-memory learning. A small training loss is not evidence of generalization, especially on tiny datasets.",
    mistake:
      "Never shuffle timestamps before splitting or fit the scaler to future data. Changing hidden units or layers requires retraining.",
    alternative:
      "Compare against naïve, seasonal naïve, classical methods, LSTM and GRU using the identical forecast origin.",
  },
  "lstm-forecasting": {
    problem:
      "A plain recurrent network can struggle to preserve information across long sequences.",
    intuition:
      "A cell-state path carries memory while gates decide what to forget, add, and reveal.",
    formula:
      "f=σ(Wf[x,h]+bf); i=σ(Wi[x,h]+bi); g=tanh(Wg[x,h]+bg); c=f⊙cprev+i⊙g; o=σ(Wo[x,h]+bo); h=o⊙tanh(c)",
    variables:
      "f: forget; i: input; g: candidate; o: output; c: cell state; h: hidden state; ⊙: elementwise product. The selected activation replaces tanh consistently when configured.",
    example:
      "If old cell = 2, forget = 0.75, input = 0.2 and candidate = 0.5, the new cell is 0.75×2 + 0.2×0.5 = 1.6. With output = 0.5, hidden = 0.5×tanh(1.6) ≈ 0.4608.",
    steps: [
      "Create chronological training and validation windows.",
      "Train actual TensorFlow.js LSTM layers.",
      "Select a step in the first recurrent layer.",
      "Inspect its exact forget/input/candidate/output activations and cell state.",
      "Evaluate recursive forecasts on untouched test observations.",
    ],
    applications:
      "Demand and environmental sequences where longer memory is useful and enough data exists.",
    strengths:
      "A gated cell state can preserve information more effectively than a plain RNN.",
    limits:
      "More parameters and computation do not guarantee better holdout forecasts. Gate values are activations, not causal feature importance.",
    mistake:
      "Do not invent attractive gate percentages or interpret a high cell magnitude as proof of relevance. Inspect values computed from the trained weights.",
    alternative:
      "GRU offers a smaller gated state; classical seasonal methods remain competitive on many short univariate series.",
  },
  "gru-forecasting": {
    problem:
      "You want gated recurrent memory without a separate LSTM cell state.",
    intuition:
      "The update gate retains previous hidden state. The reset gate controls how much past state enters the candidate computation.",
    formula:
      "z=σ(Wz x+Uz hprev+bz); r=σ(Wr x+Ur hprev+br); g=f(Wh x+Uh(r⊙hprev)+bh); h=z⊙hprev+(1−z)⊙g",
    variables:
      "z: update gate; r: reset gate; g: candidate; h: hidden state. This is the TensorFlow.js reset-before GRU convention, with sigmoid recurrent gates.",
    example:
      "With z = 0.8, old hidden = 0.5 and candidate = −0.5, the new state is 0.8×0.5 + 0.2×(−0.5) = 0.3. An update gate near one keeps the past in this convention.",
    steps: [
      "Configure real GRU layers, hidden units and optimizer.",
      "Train using chronologically separated validation targets.",
      "Inspect exact update/reset/candidate vectors from the first trained layer.",
      "Generate recursive forecasts using the frozen model.",
      "Save the actual model weights and compare valid experiments.",
    ],
    applications:
      "Forecasting and sequence learning where gated memory helps and a compact model is desirable.",
    strengths:
      "Fewer recurrent gate matrices than LSTM at the same hidden width.",
    limits:
      "Can overfit short sequences. Timing and model storage depend on the actual architecture and runtime, not a fixed advertised GPU.",
    mistake:
      "Some texts use the complementary update-gate convention. Match the displayed equation to the actual model; do not relabel a plain RNN as GRU.",
    alternative:
      "Evaluate RNN, LSTM, GRU and simpler baselines on the same target and holdout period.",
  },
};
