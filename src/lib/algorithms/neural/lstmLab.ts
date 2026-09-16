import {
  lstmRetailDemandDataset,
  timeSeriesSalesDataset,
  weatherDailyDataset,
} from "../../../data/sampleDatasets";

export type LSTMBeat = 0 | 1 | 2 | 3;

export interface LSTMLabSequence {
  id: string;
  name: string;
  kind: "toy" | "real" | "task";
  values: number[];
  extras: number[];
  featureNames: string[];
  targets?: number[];
  stress: string;
  highlight: number;
}

export interface LSTMQuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const LSTM_BEATS: {
  id: LSTMBeat;
  gate: "forget" | "write" | "add" | "output";
  title: string;
  body: string;
}[] = [
  {
    id: 0,
    gate: "forget",
    title: "1. Forget",
    body: "fₜ decides how much of Cₜ₋₁ survives. Close to 1 keeps the backpack; close to 0 empties it.",
  },
  {
    id: 1,
    gate: "write",
    title: "2. Write",
    body: "iₜ scales the candidate c̃ₜ. Together they are the only way new evidence enters the cell.",
  },
  {
    id: 2,
    gate: "add",
    title: "3. Add to cell",
    body: "Cₜ = fₜ ⊙ Cₜ₋₁ + iₜ ⊙ c̃ₜ. Old memory and new content meet at the + node.",
  },
  {
    id: 3,
    gate: "output",
    title: "4. Reveal h",
    body: "hₜ = oₜ ⊙ tanh(Cₜ). The cell can stay large while the output gate hides it this step.",
  },
];

function normalize(values: number[], scale = 1) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value) => ((value - min) / span) * 2 * scale - scale);
}

function take<T>(items: T[], count: number) {
  return items.slice(Math.max(0, items.length - count));
}

function fromColumn(
  rows: Array<Record<string, unknown>>,
  column: string,
  count: number,
  scale = 1,
) {
  return normalize(
    take(
      rows.map((row) => Number(row[column])),
      count,
    ).filter(Number.isFinite),
    scale,
  );
}

export function buildLstmSequences(): LSTMLabSequence[] {
  const weather = take(weatherDailyDataset.data, 16);
  const sales = timeSeriesSalesDataset.data;
  const demand = take(lstmRetailDemandDataset.data, 18);

  return [
    {
      id: "sine",
      name: "Synth. Sequence (Sine)",
      kind: "toy",
      values: [0.23, -0.11, 0.42, -0.14, 0.08, 0.31, -0.27, 0.19, 0.05],
      extras: [],
      featureNames: ["x"],
      stress:
        "Smooth oscillation. Forget should stay high so the phase is not wiped each step.",
      highlight: 3,
    },
    {
      id: "temperature-toy",
      name: "Temperature Cycle",
      kind: "toy",
      values: [0.12, 0.28, 0.55, 0.81, 0.63, 0.24, -0.13, -0.38, -0.2],
      extras: [],
      featureNames: ["x"],
      stress:
        "Peak at t=3 must still color C at t=7 — a short seasonal memory test.",
      highlight: 3,
    },
    {
      id: "demand-toy",
      name: "Demand Pulse",
      kind: "toy",
      values: [0.05, 0.08, 0.12, 0.72, 0.91, 0.48, 0.19, 0.11, 0.07],
      extras: [],
      featureNames: ["x"],
      stress:
        "Pulse at t=3–4. Write should open there; forget should not dump C afterwards.",
      highlight: 4,
    },
    {
      id: "weather",
      name: "Daily weather (°C)",
      kind: "real",
      values: fromColumn(weather, "temperature_c", 16),
      extras: fromColumn(weather, "rainfall_mm", 16, 0.8),
      featureNames: ["temperature", "rainfall"],
      stress:
        "Rain is a second feature. Peepholes and extra input should nudge gates on wet days.",
      highlight: 8,
    },
    {
      id: "sales",
      name: "Monthly sales",
      kind: "real",
      values: fromColumn(sales, "sales", 24),
      extras: [],
      featureNames: ["sales"],
      stress: "December spikes. The cell should carry November into the holiday peak.",
      highlight: 11,
    },
    {
      id: "retail",
      name: "Weekly retail demand",
      kind: "real",
      values: fromColumn(demand, "orders", 18),
      extras: fromColumn(demand, "promo_index", 18),
      featureNames: ["orders", "promo"],
      stress:
        "Promo flag is feature 2. Memory test: keep the lift after the promo week.",
      highlight: 10,
    },
    {
      id: "copy",
      name: "Copy-memory",
      kind: "task",
      values: [0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      extras: [],
      featureNames: ["pulse"],
      targets: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85],
      stress:
        "Token 0.85 at t=0 must still be in C at t=9. This is the job LSTM was built for.",
      highlight: 0,
    },
    {
      id: "xor",
      name: "Delayed XOR",
      kind: "task",
      values: [1, 0, 0, 0, 0, 0, 0, 0],
      extras: [0, 0, 0, 0, 0, 0, 0, 0],
      featureNames: ["bit A", "bit B"],
      targets: [0, 0, 0, 0, 0, 0, 0, 1],
      stress:
        "Bit A=1 at t=0, bit B=0 at t=1 (feature 2 stays 0). Last h should stay high: 1 XOR 0 = 1.",
      highlight: 0,
    },
    {
      id: "add",
      name: "Add two numbers",
      kind: "task",
      values: [0.35, 0, 0, 0, 0, 0, 0, 0],
      extras: [0, 0.5, 0, 0, 0, 0, 0, 0],
      featureNames: ["a", "b"],
      targets: [0, 0, 0, 0, 0, 0, 0, 0.85],
      stress:
        "Store 0.35, then add 0.50 at t=1. Last h should approach 0.85.",
      highlight: 1,
    },
  ];
}

export const LSTM_SEQUENCES = buildLstmSequences();

export const LSTM_QUIZ: LSTMQuizItem[] = [
  {
    question: "A forget gate of 0.78 at t=3 means the cell will…",
    options: [
      "Keep about 78% of Cₜ₋₁ and discard the rest",
      "Write 78% of the input token into hₜ",
      "Skip this timestep entirely",
      "Force the output gate to 0.78 as well",
    ],
    answer: 0,
    explanation:
      "fₜ multiplies the previous cell. 0.78 keeps most of yesterday’s memory.",
  },
  {
    question: "Why can Cₜ stay large while hₜ is near 0?",
    options: [
      "The output gate can hide tanh(C) without erasing the cell",
      "tanh always maps C to 0",
      "Dropout deletes the cell state",
      "Layers greater than 1 zero the hidden state",
    ],
    answer: 0,
    explanation:
      "hₜ = oₜ ⊙ tanh(Cₜ). A low output gate conceals memory for a step without forgetting it.",
  },
  {
    question: "The default forget bias bf ≈ 1.35 is there so that…",
    options: [
      "New cells start by keeping memory (sigmoid(1.35) ≈ 0.79)",
      "Training is forced to overfit the first token",
      "Peephole connections turn off",
      "The candidate uses ReLU",
    ],
    answer: 0,
    explanation:
      "A positive forget bias is the usual LSTM trick against vanishing memory.",
  },
  {
    question: "Copy-memory is a fair LSTM test because…",
    options: [
      "A value shown at t=0 must still be available after a long blank gap",
      "It only needs a 3-tap convolution",
      "Labels leak from the future into each window",
      "Softmax over the whole sequence is required",
    ],
    answer: 0,
    explanation:
      "The cell highway is how the pulse survives the zeros. A plain RNN usually forgets it.",
  },
  {
    question: "When should you reach for attention instead of LSTM?",
    options: [
      "When the useful context is long or unordered and you can afford more compute",
      "When you have four numeric points and no labels",
      "When you need a linear ARIMA baseline",
      "When features are i.i.d. rows with no time axis",
    ],
    answer: 0,
    explanation:
      "LSTM is sequential and still struggles with very long range. Attention sees the prefix at once.",
  },
];

export const LSTM_WHEN_NOT = [
  {
    title: "Long, messy context",
    body: "Use a Transformer (or the suite’s attention labs) when clues sit dozens of steps back or the order is only weakly sequential.",
  },
  {
    title: "Tiny tabular series",
    body: "A linear trend, exponential smoothing, or ARIMA will beat an LSTM on a dozen monthly points.",
  },
  {
    title: "Bags, not sequences",
    body: "If rows have no order — iris petals, loan features — use an MLP or a tree, not a recurrent cell.",
  },
];
