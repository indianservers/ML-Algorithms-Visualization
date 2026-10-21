export type LabKind =
  | "moving-average"
  | "exponential-smoothing"
  | "holt-winters"
  | "arima-concept"
  | "anomaly-detection"
  | "rnn-forecasting"
  | "lstm-forecasting"
  | "gru-forecasting";
export type NeuralKind = "rnn" | "lstm" | "gru";
export type LabConfig = {
  window: number;
  alignment: "trailing" | "centered" | "leading";
  lag: number;
  alpha: number;
  beta: number;
  gamma: number;
  season: number;
  seasonalMode: "additive" | "multiplicative";
  initialLevel: number | null;
  initialTrend: number | null;
  seasonalInit: "cycle" | "neutral";
  horizon: number;
  holdout: number;
  confidence: number;
  initialization: "first" | "mean";
  p: number;
  d: number;
  q: number;
  P: number;
  D: number;
  Q: number;
  detector: "zscore" | "modified" | "iqr" | "ewma" | "seasonal";
  threshold: number;
  cooldown: number;
  lookback: number;
  stride: number;
  layers: number;
  units: number;
  dropout: number;
  activation: "tanh" | "relu";
  optimizer: "adam" | "sgd" | "rmsprop";
  learningRate: number;
  loss: "meanSquaredError" | "meanAbsoluteError";
  batch: number;
  epochs: number;
  patience: number;
  earlyStopping: boolean;
  scaling: "standard" | "minmax" | "none";
  seed: number;
};
export const DEFAULT_CONFIG: LabConfig = {
  window: 12,
  alignment: "trailing",
  lag: 0,
  alpha: 0.3,
  beta: 0.2,
  gamma: 0.3,
  season: 12,
  seasonalMode: "additive",
  initialLevel: null,
  initialTrend: null,
  seasonalInit: "cycle",
  horizon: 12,
  holdout: 20,
  confidence: 0.95,
  initialization: "first",
  p: 1,
  d: 1,
  q: 1,
  P: 0,
  D: 0,
  Q: 0,
  detector: "zscore",
  threshold: 3,
  cooldown: 0,
  lookback: 12,
  stride: 1,
  layers: 1,
  units: 8,
  dropout: 0,
  activation: "tanh",
  optimizer: "adam",
  learningRate: 0.01,
  loss: "meanSquaredError",
  batch: 16,
  epochs: 20,
  patience: 5,
  earlyStopping: true,
  scaling: "standard",
  seed: 42,
};
export const LABS: Record<
  LabKind,
  { title: string; subtitle: string; objective: string; tags: string[] }
> = {
  "moving-average": {
    title: "Moving Average",
    subtitle:
      "Reveal the signal beneath the noise, one rolling window at a time.",
    objective:
      "Discover how window size changes smoothness, lag, and residuals.",
    tags: ["Smoothing", "Trend analysis", "Noise reduction"],
  },
  "exponential-smoothing": {
    title: "Exponential Smoothing",
    subtitle: "Adaptive level forecasts that learn from each new observation.",
    objective:
      "Trace the level update and compare how alpha changes responsiveness.",
    tags: ["Level forecasting", "Weighted memory", "Uncertainty"],
  },
  "holt-winters": {
    title: "Holt–Winters",
    subtitle:
      "Separate a time series into its level, trend, and repeating seasonal pattern.",
    objective:
      "Understand the three component updates and forecast seasonal demand.",
    tags: ["Level + trend", "Seasonality", "Business forecasting"],
  },
  "arima-concept": {
    title: "ARIMA",
    subtitle:
      "Explore stationarity, differencing, and statistical forecasting.",
    objective:
      "Inspect ACF/PACF and fit an actual ARIMA or seasonal ARIMA model.",
    tags: ["Stationarity", "Differencing", "ACF & PACF"],
  },
  "anomaly-detection": {
    title: "Time-Series Anomaly Detection",
    subtitle:
      "Discover unusual observations with causal, adaptive statistical detectors.",
    objective:
      "Inject disruptions and investigate sensitivity, false alerts, and context.",
    tags: ["Statistical detection", "Adaptive thresholds", "Stream replay"],
  },
  "rnn-forecasting": {
    title: "RNN Forecasting",
    subtitle:
      "Learn how a recurrent hidden state turns past sequences into forecasts.",
    objective:
      "Configure, train, inspect, and evaluate a real recurrent neural network.",
    tags: ["Deep learning", "Recurrent states", "Sequence modeling"],
  },
  "lstm-forecasting": {
    title: "LSTM Forecasting",
    subtitle: "Follow information through forget, input, and output gates.",
    objective:
      "Inspect exact gate activations and cell states from your trained LSTM.",
    tags: ["Deep learning", "Cell memory", "Long dependencies"],
  },
  "gru-forecasting": {
    title: "GRU Forecasting",
    subtitle: "Explore gated recurrent learning with update and reset gates.",
    objective:
      "Train a real GRU and inspect how its gates control hidden-state updates.",
    tags: ["Deep learning", "Update & reset", "Sequence modeling"],
  },
};
export const isNeural = (kind: LabKind) => kind.endsWith("-forecasting");
export const neuralKind = (kind: LabKind) => kind.split("-")[0] as NeuralKind;
export const fmt = (value: number | null | undefined, digits = 2) =>
  value != null && Number.isFinite(value)
    ? value.toFixed(digits)
    : "Unavailable";
