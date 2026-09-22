import { lazy, Suspense, useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import {
  LAB_TABS,
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
import { imageSample } from "../../../lib/algorithms/neural/toySamples";
import {
  applyBank,
  batchNormVolume,
  denseForward,
  flattenVolume,
  makeDenseWeights,
  makeKernelBank,
  maxPoolVolume,
  normalizeFeatureMap,
  reluVolume,
  softmax,
  volumeStats,
  type ImageMatrix,
} from "../../../lib/algorithms/neural/cnn";
import "./CNNPage.css";

const TensorFlowDeepLearningLab = lazy(
  () => import("../shared/TensorFlowDeepLearningLab"),
);

const CONV1_FILTERS = 8;
const CONV2_FILTERS = 8;
const DENSE_UNITS = 32;
const SAMPLE_COUNT = 12;
const LABELS = ["horizontal bar", "vertical bar"] as const;
const LABEL_PLAIN = ["a horizontal line", "a vertical line"] as const;
const STAGES = [
  { id: "input", name: "Picture", tech: "Input", detail: "tiny 8×8 image", number: 1 },
  { id: "conv1", name: "Find edges", tech: "Conv2D", detail: `${CONV1_FILTERS} stamps`, number: 2 },
  { id: "relu1", name: "Keep positives", tech: "ReLU", detail: "drop negatives", number: 3 },
  { id: "pool1", name: "Shrink", tech: "MaxPool", detail: "keep strongest", number: 4 },
  { id: "conv2", name: "Find shapes", tech: "Conv2D", detail: `${CONV2_FILTERS} stamps`, number: 5 },
  { id: "relu2", name: "Keep positives", tech: "ReLU", detail: "drop negatives", number: 6 },
  { id: "pool2", name: "Shrink again", tech: "MaxPool", detail: "2×2 leftover", number: 7 },
  { id: "flatten", name: "Unroll", tech: "Flatten", detail: `${CONV2_FILTERS * 4} numbers`, number: 8 },
  { id: "dense", name: "Mix", tech: "Dense", detail: `${DENSE_UNITS} neurons`, number: 9 },
  { id: "softmax", name: "Guess", tech: "Softmax", detail: "2 choices", number: 10 },
] as const;

type StageId = (typeof STAGES)[number]["id"];
type View = "overview" | "data" | "model" | "train" | "evaluate" | "deploy" | "settings";

const VIEWS: Array<[View, string]> = [
  ["overview", "⌂ Overview"],
  ["data", "▤ Data"],
  ["model", "⌘ Model"],
  ["train", "▷ Train"],
  ["evaluate", "▥ Evaluate"],
  ["deploy", "♧ Deploy"],
  ["settings", "⚙ Settings"],
];

const STAGE_COPY: Record<StageId, { purpose: string; does: string }> = {
  input: {
    purpose: "This is the only picture the network sees: 8×8 gray pixels. Bright = ink, dark = paper.",
    does: "Switch Horizontal / Vertical above. Every later map updates from this one picture.",
  },
  conv1: {
    purpose: "A 3×3 stamp slides over the picture. Each stamp hunts for one tiny edge.",
    does: "Change the 9 numbers. An edge stamp lights up the bar; a blur stamp washes it out.",
  },
  relu1: {
    purpose: "Keep the “I found it” scores. Anything below zero becomes exactly zero.",
    does: "Dark cells are true zeros — not faint noise. Compare with the previous green map.",
  },
  pool1: {
    purpose: "Look at every 2×2 patch and keep only the brightest cell. The picture shrinks.",
    does: "An 8-pixel bar becomes a 4×4 glow. Where it is matters less; that it exists still does.",
  },
  conv2: {
    purpose: `Now ${CONV2_FILTERS} stamps look at all ${CONV1_FILTERS} earlier maps at once, so they can join edges into shapes. (A production CNN often uses 32 then 64; this lab stays small so it stays live.)`,
    does: `Flip through detectors 1–${CONV2_FILTERS}. Each map is a real mix of the previous layer, not a copy.`,
  },
  relu2: {
    purpose: "Same rule again: keep positive shape scores, drop the rest.",
    does: "If a map is all black, that stamp is pointed the wrong way for this picture.",
  },
  pool2: {
    purpose: `Shrink one more time. You are left with 2×2×${CONV2_FILTERS} — that is ${CONV2_FILTERS * 4} numbers.`,
    does: `Count it: 2 × 2 × ${CONV2_FILTERS} = ${CONV2_FILTERS * 4}. That is why Unroll says ${CONV2_FILTERS * 4}.`,
  },
  flatten: {
    purpose: `Line those ${CONV2_FILTERS * 4} numbers up so the next layer can read them like a list.`,
    does: "The bars are the pooled maps in order — not random decoration.",
  },
  dense: {
    purpose: `${DENSE_UNITS} neurons mix the ${CONV2_FILTERS * 4} numbers into a short code about “what kind of line is this?”`,
    does: "Tall bars are live neurons. A bar at zero means that neuron stayed quiet.",
  },
  softmax: {
    purpose: "Turn two scores into two percentages that add to 100%. Highest percentage wins.",
    does: "Press Train to replace this practice guess with a fitted TensorFlow.js model.",
  },
};

const STAGE_NEXT: Record<StageId, string> = {
  input: "Next: slide 3×3 stamps over this picture to find edges.",
  conv1: "Next: throw away negative detections (Keep positives).",
  relu1: "Next: shrink the map — keep only the strongest 2×2 cell.",
  pool1: "Next: look at all the edge maps together and hunt for bigger shapes.",
  conv2: "Next: keep only the positive shape scores.",
  relu2: `Next: shrink again so the leftover is just 2×2×${CONV2_FILTERS}.`,
  pool2: `Next: unroll those ${CONV2_FILTERS * 4} numbers into a single list.`,
  flatten: `Next: mix the list into ${DENSE_UNITS} neurons.`,
  dense: "Next: turn the mix into two percentages and pick a winner.",
  softmax: "You are at the guess. Train the model if you want a fitted answer.",
};

type KernelBank = ImageMatrix[][];
type DenseLayer = { weights: number[][]; bias: number[] };

function makeImage(seed = 0): ImageMatrix {
  const values = imageSample(101 + seed).values;
  return Array.from({ length: 8 }, (_, row) => values.slice(row * 8, row * 8 + 8));
}

function featurePass(
  image: ImageMatrix,
  conv1Bank: KernelBank,
  conv2Bank: KernelBank,
  stride: number,
  padding: number,
  useBias: boolean,
  batchNorm: boolean,
) {
  const biases1 = useBias ? conv1Bank.map((_, i) => ((i % 7) - 3) * 0.04) : undefined;
  const biases2 = useBias ? conv2Bank.map((_, i) => ((i % 5) - 2) * 0.03) : undefined;
  let conv1 = applyBank([image], conv1Bank, stride, padding, biases1);
  if (batchNorm) conv1 = batchNormVolume(conv1);
  const relu1 = reluVolume(conv1);
  const pool1 = maxPoolVolume(relu1, 2);
  let conv2 = applyBank(pool1, conv2Bank, 1, 1, biases2);
  if (batchNorm) conv2 = batchNormVolume(conv2);
  const relu2 = reluVolume(conv2);
  const pool2 = maxPoolVolume(relu2, 2);
  return { conv1, relu1, pool1, conv2, relu2, pool2, flat: flattenVolume(pool2) };
}

function runPass(
  image: ImageMatrix,
  conv1Bank: KernelBank,
  conv2Bank: KernelBank,
  dense128: DenseLayer,
  dense2: DenseLayer,
  stride: number,
  padding: number,
  useBias: boolean,
  batchNorm: boolean,
) {
  const features = featurePass(image, conv1Bank, conv2Bank, stride, padding, useBias, batchNorm);
  const hidden = denseForward(features.flat, dense128.weights, dense128.bias, "relu");
  const logits = denseForward(hidden, dense2.weights, dense2.bias);
  return { ...features, hidden, logits, probs: softmax(logits) };
}

function vectorStats(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    zeros: values.filter((value) => value <= 0).length / (values.length || 1),
  };
}

const PARAMS = {
  conv1: 3 * 3 * 1 * CONV1_FILTERS + CONV1_FILTERS,
  conv2: 3 * 3 * CONV1_FILTERS * CONV2_FILTERS + CONV2_FILTERS,
  dense: CONV2_FILTERS * 4 * DENSE_UNITS + DENSE_UNITS,
  softmax: DENSE_UNITS * 2 + 2,
};
const VIEW_TAB: Record<View, string> = {
  overview: "Visualize",
  data: "Dataset",
  model: "Visualize",
  train: "Build / Train",
  evaluate: "Metrics",
  deploy: "Visualize",
  settings: "Build / Train",
};

function Matrix({
  matrix,
  tone = "green",
  grid = false,
}: {
  matrix: ImageMatrix;
  tone?: string;
  grid?: boolean;
}) {
  const normalized = normalizeFeatureMap(matrix);
  const colors: Record<string, (v: number) => string> = {
    green: (v) => `rgb(${Math.round(v * 30)} ${Math.round(65 + v * 185)} ${Math.round(55 + v * 90)})`,
    blue: (v) => `rgb(${Math.round(v * 55)} ${Math.round(75 + v * 105)} ${Math.round(110 + v * 145)})`,
    purple: (v) => `rgb(${Math.round(55 + v * 145)} ${Math.round(35 + v * 60)} ${Math.round(90 + v * 160)})`,
    gray: (v) => `rgb(${Math.round(v * 225)} ${Math.round(v * 205)} ${Math.round(v * 175)})`,
  };
  return (
    <div
      className={`cnn-matrix ${grid ? "grid" : ""}`}
      role="img"
      aria-label={`${matrix.length} by ${matrix[0].length} pixel map. Brighter cells mean a stronger match.`}
      style={{ gridTemplateColumns: `repeat(${matrix[0].length},1fr)` }}
    >
      {normalized.flat().map((v, i) => (
        <i key={i} style={{ background: colors[tone](v) }} />
      ))}
    </div>
  );
}

function Bars({ values, tone = "#7c5cff" }: { values: number[]; tone?: string }) {
  const max = Math.max(1e-6, ...values.map(Math.abs));
  return (
    <div className="cnn-bars" aria-label="Activation vector">
      {values.map((value, index) => (
        <i
          key={index}
          title={`${index}: ${value.toFixed(3)}`}
          style={{ height: `${Math.max(4, (Math.abs(value) / max) * 100)}%`, background: tone }}
        />
      ))}
    </div>
  );
}

function shapeOf(volume: ImageMatrix[]) {
  return `${volume[0][0].length}×${volume[0].length}×${volume.length}`;
}

export default function CNNPage() {
  const { tab, setTab, lesson } = useLabTabs("Visualize");
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [stageId, setStageId] = useState<StageId>("conv1");
  const [filter, setFilter] = useState(0);
  const [conv1Bank, setConv1Bank] = useState(() =>
    makeKernelBank(CONV1_FILTERS, 1, CONV1_FILTERS),
  );
  const [conv2Bank, setConv2Bank] = useState(() =>
    makeKernelBank(CONV2_FILTERS, CONV1_FILTERS, CONV2_FILTERS),
  );
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(1);
  const [bias, setBias] = useState(true);
  const [batchNorm, setBatchNorm] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [grid, setGrid] = useState(true);
  const [epochs, setEpochs] = useState(18);
  const [seed, setSeed] = useState(0);
  const [toast, setToast] = useState("");
  const [training, setTraining] = useState(false);
  const [history, setHistory] = useState<Array<{ epoch: number; loss: number; accuracy: number }>>([]);
  const [prediction, setPrediction] = useState<number[]>([]);

  const image = useMemo(() => makeImage(seed), [seed]);
  const features = useMemo(
    () => featurePass(image, conv1Bank, conv2Bank, stride, padding, bias, batchNorm),
    [image, conv1Bank, conv2Bank, stride, padding, bias, batchNorm],
  );
  const flattenSize = features.flat.length;
  const dense128 = useMemo(
    () => makeDenseWeights(DENSE_UNITS, Math.max(1, flattenSize), DENSE_UNITS),
    [flattenSize],
  );
  const dense2 = useMemo(() => makeDenseWeights(2, DENSE_UNITS, 2), []);
  const paramCounts = {
    ...PARAMS,
    dense: flattenSize * DENSE_UNITS + DENSE_UNITS,
  };
  const totalParams =
    paramCounts.conv1 + paramCounts.conv2 + paramCounts.dense + paramCounts.softmax;
  const pass = useMemo(() => {
    const hidden = denseForward(features.flat, dense128.weights, dense128.bias, "relu");
    const logits = denseForward(hidden, dense2.weights, dense2.bias);
    return { ...features, hidden, logits, probs: softmax(logits) };
  }, [features, dense128, dense2]);
  const needRoster = view === "data" || view === "evaluate";
  const roster = useMemo(
    () =>
      Array.from({ length: SAMPLE_COUNT }, (_, index) => {
        const sample = makeImage(index);
        const truth = imageSample(101 + index).label;
        if (!needRoster) {
          return {
            index,
            image: sample,
            label: LABELS[truth],
            pred: LABELS[0],
            ok: false,
            conf: 0,
            probs: [0.5, 0.5],
          };
        }
        const out = runPass(
          sample,
          conv1Bank,
          conv2Bank,
          dense128,
          dense2,
          stride,
          padding,
          bias,
          batchNorm,
        );
        const pred = out.probs[1] >= out.probs[0] ? 1 : 0;
        return {
          index,
          image: sample,
          label: LABELS[truth],
          pred: LABELS[pred],
          ok: pred === truth,
          conf: out.probs[pred],
          probs: out.probs,
        };
      }),
    [needRoster, conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm],
  );

  const volumes: Record<Exclude<StageId, "flatten" | "dense" | "softmax">, ImageMatrix[]> = {
    input: [image],
    conv1: pass.conv1,
    relu1: pass.relu1,
    pool1: pass.pool1,
    conv2: pass.conv2,
    relu2: pass.relu2,
    pool2: pass.pool2,
  };

  const filterCount =
    stageId === "conv2" || stageId === "relu2" || stageId === "pool2"
      ? CONV2_FILTERS
      : CONV1_FILTERS;
  const channel = Math.min(filter, filterCount - 1);
  const stage = STAGES.find((item) => item.id === stageId) ?? STAGES[1];
  const selectedVolume = stageId in volumes ? volumes[stageId as keyof typeof volumes] : null;
  const selectedMap = selectedVolume?.[channel] ?? selectedVolume?.[0] ?? image;
  const stats = selectedVolume
    ? volumeStats(selectedVolume)
    : vectorStats(stageId === "dense" ? pass.hidden : stageId === "flatten" ? pass.flat : pass.probs);

  const kernel =
    stageId === "conv2" || stageId === "relu2" || stageId === "pool2"
      ? (conv2Bank[channel]?.[0] ?? conv2Bank[0][0])
      : (conv1Bank[Math.min(filter, CONV1_FILTERS - 1)]?.[0] ?? conv1Bank[0][0]);

  const editKernel = (r: number, c: number, value: number) => {
    if (stageId === "conv2" || stageId === "relu2" || stageId === "pool2") {
      setConv2Bank((bank) =>
        bank.map((kernels, i) =>
          i !== channel
            ? kernels
            : kernels.map((k) =>
                k.map((row, y) => row.map((item, x) => (y === r && x === c ? value : item))),
              ),
        ),
      );
      return;
    }
    setConv1Bank((bank) =>
      bank.map((kernels, i) =>
        i !== Math.min(filter, CONV1_FILTERS - 1)
          ? kernels
          : [
              kernels[0].map((row, y) => row.map((item, x) => (y === r && x === c ? value : item))),
            ],
      ),
    );
  };

  const trainModel = async () => {
    setTraining(true);
    setHistory([]);
    setPrediction([]);
    setToast("Training TensorFlow.js CNN…");
    try {
      const tf = await import("@tensorflow/tfjs");
      const { buildModel, makeTrainingData } = await import(
        "../../../lib/algorithms/neural/tensorflowDeepLearning"
      );
      const data = makeTrainingData("cnn", 96);
      const model = buildModel("cnn", CONV1_FILTERS, 0.025);
      await model.fit(data.xs, data.ys, {
        epochs,
        batchSize: 16,
        shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            setHistory((current) => [
              ...current,
              {
                epoch: epoch + 1,
                loss: Number((logs?.loss ?? 0).toFixed(4)),
                accuracy: Number((logs?.acc ?? logs?.accuracy ?? 0).toFixed(4)),
              },
            ]);
            await tf.nextFrame();
          },
        },
      });
      const input = tf.tensor4d(imageSample(101 + seed).values, [1, 8, 8, 1]);
      const predicted = model.predict(input);
      const output = Array.isArray(predicted) ? predicted[0] : predicted;
      setPrediction(Array.from(await output.data()));
      input.dispose();
      output.dispose();
      data.xs.dispose();
      data.ys.dispose();
      model.dispose();
      setToast("Training complete — held-out prediction updated");
    } catch (error) {
      setToast(error instanceof Error ? `Training failed: ${error.message}` : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const latest = history[history.length - 1];
  const predictedIndex =
    (prediction.length > 0 ? prediction : pass.probs)[1] >= (prediction.length > 0 ? prediction : pass.probs)[0]
      ? 1
      : 0;
  const shownProbs = prediction.length > 0 ? prediction : pass.probs;
  const guessPct = Math.round(shownProbs[predictedIndex] * 100);
  const truthIndex = imageSample(101 + seed).label;
  const modelStatus = training ? "training" : latest ? "trained" : "ready";
  const maxLoss = Math.max(1, ...history.map((point) => point.loss));
  const chartX = (index: number) => 20 + (history.length < 2 ? 0 : (index / (history.length - 1)) * 450);
  const lossPoints = history
    .map((point, index) => `${chartX(index)},${145 - (point.loss / maxLoss) * 125}`)
    .join(" ");
  const accuracyPoints = history
    .map((point, index) => `${chartX(index)},${145 - point.accuracy * 125}`)
    .join(" ");

  const reset = () => {
    setSeed(0);
    setStageId("conv1");
    setFilter(0);
    setConv1Bank(makeKernelBank(CONV1_FILTERS, 1, CONV1_FILTERS));
    setConv2Bank(makeKernelBank(CONV2_FILTERS, CONV1_FILTERS, CONV2_FILTERS));
    setStride(1);
    setPadding(1);
    setBias(true);
    setBatchNorm(false);
    setOverlay(true);
    setGrid(true);
    setHistory([]);
    setPrediction([]);
    setToast("Inspector reset");
  };

  if (advanced)
    return (
      <div className="cnn-advanced">
        <button onClick={() => setAdvanced(false)}>← Return to Layer Inspector</button>
        <Suspense fallback={<p className="cnn-lesson">Loading TensorFlow.js lab…</p>}>
          <TensorFlowDeepLearningLab mode="cnn" />
        </Suspense>
      </div>
    );

  const samples = roster.map((item) => ({ image: item.image, label: item.label }));
  const inspectorHits = roster.filter((item) => item.ok).length;
  const chooseView = (next: View) => {
    setView(next);
    setTab(VIEW_TAB[next]);
  };
  const chooseTab = (next: string) => {
    setTab(next);
    if (next === "Dataset") setView("data");
    else if (next === "Build / Train") setView("train");
    else if (next === "Metrics") setView("evaluate");
    else if (next === "Visualize") setView(view === "model" || view === "deploy" ? view : "overview");
    else setView("overview");
  };

  const pickKind = (kind: 0 | 1) => {
    const hit = roster.find((item) => imageSample(101 + item.index).label === kind);
    if (hit) setSeed(hit.index);
  };

  return (
    <div className="cnn-page">
      <header className="cnn-head">
        <h1>How a CNN reads a picture</h1>
        <p className="cnn-lede">
          A convolutional network is a stack of tiny pattern detectors. This lab uses 8×8 lines —
          {totalParams.toLocaleString()} weights, 96 practice pictures.
        </p>
        <div className="cnn-actions">
          <button onClick={reset}>
            <RotateCcw /> Reset
          </button>
          <button className="train" onClick={() => void trainModel()} disabled={training}>
            <Play /> {training ? "Training…" : "Train"}
          </button>
          <label>
            Rounds
            <select value={epochs} onChange={(e) => setEpochs(Number(e.target.value))}>
              <option>5</option>
              <option>18</option>
              <option>40</option>
            </select>
          </label>
          <span className={`cnn-status ${modelStatus}`}>
            <i />
            <b>{training ? "Training" : latest ? "Trained" : "Ready"}</b>
          </span>
        </div>
      </header>
      <nav className="cnn-tabs panel" role="tablist" aria-label="CNN lab tabs">
        {LAB_TABS.map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            className={tab === name ? "active" : ""}
            onClick={() => chooseTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <main>
        {lesson && <LabLessonPanel tab={tab} route="/ml/deep-learning/cnn" className="cnn-lesson" />}
        {!lesson && (
          <section className="cnn-guide panel">
            <span className="cnn-guide-kicker">How to read this</span>
            <div>
              <b>Bright cells mean “I found that pattern here.”</b>
              <p>
                Pick a picture, then click a numbered step. The middle panel is the layer you are
                looking inside. The right rail explains the same step in one sentence.
              </p>
              <div className="cnn-samples">
                <button className={truthIndex === 0 ? "active" : ""} onClick={() => pickKind(0)}>
                  Horizontal line
                </button>
                <button className={truthIndex === 1 ? "active" : ""} onClick={() => pickKind(1)}>
                  Vertical line
                </button>
                <button onClick={() => setSeed((seed + 1) % SAMPLE_COUNT)} aria-label="Next picture">
                  Next picture
                </button>
                <small>Picture {seed + 1} of {SAMPLE_COUNT} · truth: {LABELS[truthIndex]}</small>
              </div>
              <div className="cnn-views">
                {VIEWS.map(([id, label]) => (
                  <button key={id} className={view === id ? "active" : ""} onClick={() => chooseView(id)}>
                    {label.replace(/^[^\s]+\s/, "")}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
        {!lesson && <section className="cnn-pipeline panel">
          {STAGES.map((item) => (
            <button
              key={item.id}
              className={stageId === item.id ? "active" : ""}
              data-guide={`cnn-${item.id}`}
              onClick={() => {
                setStageId(item.id);
                setFilter(0);
              }}
            >
              <em>{item.number}</em>
              {item.name}
              <small>{item.detail}</small>
            </button>
          ))}
        </section>}

        {lesson ? null : view === "data" ? (
          <section className="cnn-flow panel cnn-data-grid">
            <p className="cnn-data-hint">
              Click a picture to send it through the network. The label is the truth; the % is the
              live guess.
            </p>
            {samples.map((sample, index) => (
              <button key={index} onClick={() => setSeed(index)} className={seed === index ? "active" : ""}>
                <Matrix matrix={sample.image} tone="gray" grid={grid} />
                <span>
                  {sample.label}
                  <small>
                    {" "}
                    · {roster[index].ok ? (
                      <span className="cnn-ok">✓ {roster[index].pred}</span>
                    ) : (
                      <span className="cnn-bad">✕ said {roster[index].pred}</span>
                    )}{" "}
                    {(roster[index].conf * 100).toFixed(0)}%
                  </small>
                </span>
              </button>
            ))}
          </section>
        ) : view === "model" ? (
          <section className="cnn-flow panel cnn-model-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Layer</th>
                  <th>Output</th>
                  <th>Params</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["—", "Input", "8×8×1", "0", STAGE_COPY.input.purpose],
                  ["1", "Find edges (Conv2D)", shapeOf(pass.conv1), String(PARAMS.conv1), STAGE_COPY.conv1.purpose],
                  ["2", "Keep positives (ReLU)", shapeOf(pass.relu1), "0", STAGE_COPY.relu1.purpose],
                  ["3", "Shrink (MaxPool 2×2)", shapeOf(pass.pool1), "0", STAGE_COPY.pool1.purpose],
                  ["4", "Find shapes (Conv2D)", shapeOf(pass.conv2), String(PARAMS.conv2), STAGE_COPY.conv2.purpose],
                  ["5", "Keep positives (ReLU)", shapeOf(pass.relu2), "0", STAGE_COPY.relu2.purpose],
                  ["6", "Shrink again (MaxPool)", shapeOf(pass.pool2), "0", STAGE_COPY.pool2.purpose],
                  ["7", "Unroll (Flatten)", String(pass.flat.length), "0", STAGE_COPY.flatten.purpose],
                  ["8", "Mix (Dense)", String(pass.hidden.length), String(paramCounts.dense), STAGE_COPY.dense.purpose],
                  ["9", "Guess (Softmax)", String(pass.probs.length), String(PARAMS.softmax), STAGE_COPY.softmax.purpose],
                ].map((row) => (
                  <tr key={row[0] + row[1]}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : view === "train" || view === "settings" ? (
          <section className="cnn-flow panel cnn-train">
            <article>
              <h4>TEACH THE NETWORK</h4>
              <p>
                Show it 96 labeled 8×8 lines, {epochs} times. After training, the Guess panel uses
                the fitted TensorFlow.js model instead of the practice inspector.
              </p>
              <button className="train" onClick={() => void trainModel()} disabled={training}>
                {training ? "Training…" : `Train ${epochs} rounds`}
              </button>
              <table>
                <thead>
                  <tr>
                    <th>Epoch</th>
                    <th>Loss</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {(history.length ? history : [{ epoch: 0, loss: 0, accuracy: 0 }]).map((point) => (
                    <tr key={point.epoch}>
                      <td>{point.epoch || "—"}</td>
                      <td>{point.epoch ? point.loss.toFixed(4) : "press Train"}</td>
                      <td>{point.epoch ? `${(point.accuracy * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article>
              <h4>STAMP SETTINGS</h4>
              <label>
                Stride
                <select value={stride} onChange={(e) => setStride(Number(e.target.value))}>
                  <option>1</option>
                  <option>2</option>
                </select>
              </label>
              <small className="cnn-help">
                How far the stamp jumps. 1 = every pixel; 2 = skip a pixel (faster, blurrier).
              </small>
              <label>
                Padding
                <select value={padding} onChange={(e) => setPadding(Number(e.target.value))}>
                  <option>0</option>
                  <option>1</option>
                </select>
              </label>
              <small className="cnn-help">
                Add a quiet border so the stamp can sit on the edge. 0 = crop; 1 = keep size.
              </small>
              <label>
                Bias
                <input type="checkbox" checked={bias} onChange={(e) => setBias(e.target.checked)} />
              </label>
              <label>
                Batch Norm
                <input type="checkbox" checked={batchNorm} onChange={(e) => setBatchNorm(e.target.checked)} />
              </label>
              <p>
                Live shapes with these settings: {shapeOf(pass.conv1)} → {shapeOf(pass.pool1)} →{" "}
                {shapeOf(pass.conv2)} → {shapeOf(pass.pool2)} → {pass.flat.length} → {pass.hidden.length} →{" "}
                {pass.probs.length}
              </p>
            </article>
            <article>
              <h4>EXPORT SPEC</h4>
              <pre className="cnn-card">{`input: 8×8×1
Conv2D(${CONV1_FILTERS}, 3×3, stride ${stride}, pad ${padding}) → ${shapeOf(pass.conv1)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool1)}
Conv2D(${CONV2_FILTERS}, 3×3) → ${shapeOf(pass.conv2)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool2)}
Flatten → ${pass.flat.length}
Dense(${DENSE_UNITS}, ReLU) → ${pass.hidden.length}
Softmax → ${pass.probs.map((p) => p.toFixed(3)).join(" / ")}
params ${totalParams}`}</pre>
            </article>
          </section>
        ) : view === "evaluate" ? (
          <section className="cnn-flow panel cnn-eval">
            <article>
              <h4>RIGHT OR WRONG</h4>
              <p>
                {inspectorHits} of {SAMPLE_COUNT} pictures guessed correctly. Click a row to open that picture.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Truth</th>
                    <th>Guess</th>
                    <th>Sure</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((item) => (
                    <tr
                      key={item.index}
                      className={item.index === seed ? "active" : ""}
                      onClick={() => setSeed(item.index)}
                    >
                      <td>{item.index + 1}</td>
                      <td>{item.label}</td>
                      <td className={item.ok ? "cnn-ok" : "cnn-bad"}>
                        {item.ok ? `✓ ${item.pred}` : `✕ ${item.pred}`}
                      </td>
                      <td>{(item.conf * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article className="cnn-selected">
              <h4>PICTURE {seed + 1}</h4>
              <p className="cnn-guess">
                {guessPct}% sure this is {LABEL_PLAIN[predictedIndex]}
                <span>
                  {" "}
                  · {prediction.length > 0 ? "trained model" : "practice inspector"}
                </span>
              </p>
              <div className="cnn-softmax">
                {LABELS.map((name, index) => (
                  <p className={index === predictedIndex ? "active" : ""} key={name}>
                    {name}
                    <i className="cnn-pct">
                      <span style={{ width: `${shownProbs[index] * 100}%` }} />
                    </i>
                    <b>{`${(shownProbs[index] * 100).toFixed(0)}%`}</b>
                  </p>
                ))}
              </div>
            </article>
          </section>
        ) : view === "deploy" ? (
          <section className="cnn-flow panel">
            <pre className="cnn-card">{`input: 8×8×1
Conv2D(${CONV1_FILTERS}, 3×3, stride ${stride}, pad ${padding}) → ${shapeOf(pass.conv1)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool1)}
Conv2D(${CONV2_FILTERS}, 3×3) → ${shapeOf(pass.conv2)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool2)}
Flatten → ${pass.flat.length}
Dense(${DENSE_UNITS}, ReLU) → ${pass.hidden.length}
Softmax → ${pass.probs.map((p) => p.toFixed(3)).join(" / ")}`}</pre>
          </section>
        ) : (
          <section className="cnn-flow panel">
            <article>
              <h4>THE PICTURE</h4>
              <Matrix matrix={image} tone="gray" grid={grid} />
              <p>8 × 8 pixels · picture {seed + 1}</p>
              {(stageId === "conv1" || stageId === "conv2") && (
                <div className="kernel-card">
                  <h4>
                    3×3 stamp · detector {channel + 1}
                  </h4>
                  {kernel.map((row, r) =>
                    row.map((v, c) => (
                      <input
                        key={`${r}:${c}`}
                        type="number"
                        value={Number(v.toFixed(3))}
                        step=".1"
                        onChange={(e) => editKernel(r, c, Number(e.target.value))}
                      />
                    )),
                  )}
                </div>
              )}
            </article>
            <article className="cnn-selected">
              <h4>
                {stage.name} <small>{stage.tech}{stage.detail ? ` · ${stage.detail}` : ""}</small>
              </h4>
              {selectedVolume ? (
                <>
                  <Matrix
                    matrix={selectedMap}
                    tone={stageId.includes("pool") ? "blue" : stageId.includes("conv") || stageId.includes("relu") ? "green" : "gray"}
                    grid={grid}
                  />
                  <p>
                    Pattern detector {channel + 1} of {selectedVolume.length} · {shapeOf(selectedVolume)}
                  </p>
                </>
              ) : stageId === "flatten" ? (
                <>
                  <Bars values={pass.flat} />
                  <p>{pass.flat.length} numbers lined up from the 2×2×64 leftover</p>
                </>
              ) : stageId === "dense" ? (
                <>
                  <Bars values={pass.hidden} tone="#5eead4" />
                  <p>
                    {pass.hidden.length} neurons · {pass.hidden.filter((v) => v <= 0).length} stayed quiet
                  </p>
                </>
              ) : (
                <>
                  <p className="cnn-guess">
                    {guessPct}% sure this is {LABEL_PLAIN[predictedIndex]}
                    <span> · {prediction.length > 0 ? "trained model" : "practice inspector"}</span>
                  </p>
                  <div className="cnn-softmax">
                    {LABELS.map((name, index) => (
                      <p className={index === predictedIndex ? "active" : ""} key={name}>
                        {name}
                        <i className="cnn-pct">
                          <span style={{ width: `${shownProbs[index] * 100}%` }} />
                        </i>
                        <b>{`${(shownProbs[index] * 100).toFixed(0)}%`}</b>
                      </p>
                    ))}
                  </div>
                </>
              )}
              {overlay && (
                <small>
                  min {stats.min.toFixed(2)} · max {stats.max.toFixed(2)} · mean {stats.mean.toFixed(2)}
                  {stageId.includes("relu") || stageId === "dense" || stageId === "flatten"
                    ? ` · ${Math.round(stats.zeros * 100)}% zeros`
                    : ""}
                </small>
              )}
            </article>
            <article className="dense">
              <h4>WHY THIS STEP</h4>
              <p>{STAGE_COPY[stageId].purpose}</p>
              <p>{STAGE_COPY[stageId].does}</p>
              <p className="cnn-next">{STAGE_NEXT[stageId]}</p>
            </article>
          </section>
        )}

        {!lesson && <section className="cnn-layers panel">
          <h3>LOOK INSIDE A STEP</h3>
          {STAGES.map((item) => (
            <button
              key={item.id}
              className={stageId === item.id ? "active" : ""}
              onClick={() => setStageId(item.id)}
            >
              <small>{item.number}</small>
              <b>{item.name}</b>
              <span>
                {item.id === "input"
                  ? "8×8×1"
                  : item.id === "conv1"
                    ? shapeOf(pass.conv1)
                    : item.id === "relu1"
                      ? shapeOf(pass.relu1)
                      : item.id === "pool1"
                        ? shapeOf(pass.pool1)
                        : item.id === "conv2"
                          ? shapeOf(pass.conv2)
                          : item.id === "relu2"
                            ? shapeOf(pass.relu2)
                            : item.id === "pool2"
                              ? shapeOf(pass.pool2)
                              : item.id === "flatten"
                                ? String(pass.flat.length)
                                : item.id === "dense"
                                  ? String(pass.hidden.length)
                                  : "2"}
              </span>
            </button>
          ))}
        </section>}
        {!lesson && <section className="cnn-bottom panel">
          <article>
            <h3>TRAINING PROGRESS</h3>
            {history.length === 0 ? (
              <p className="cnn-empty">
                No training yet. Press Train — the network looks at 96 tiny pictures and tries to
                tell the two kinds of line apart.
              </p>
            ) : (
              <>
                <p className="cnn-legend">
                  <span>
                    <i className="loss" /> mistakes (lower is better)
                  </span>
                  <span>
                    <i className="acc" /> correct guesses
                  </span>
                </p>
                <svg viewBox="0 0 480 170" aria-label="Training loss and accuracy">
                  <path d="M20 10V150H470" />
                  <polyline className="loss" points={lossPoints} />
                  <polyline className="acc" points={accuracyPoints} />
                </svg>
              </>
            )}
          </article>
          <article>
            <h3>SCOREBOARD</h3>
            <button onClick={() => setAdvanced(true)}>Open the full training lab →</button>
            <p>
              Round{" "}
              <b>
                {history.length} / {epochs}
              </b>
            </p>
            <p>
              Loss <b>{latest ? latest.loss.toFixed(4) : "—"}</b>
            </p>
            <p>
              Accuracy <b>{latest ? `${(latest.accuracy * 100).toFixed(1)}%` : "—"}</b>
            </p>
            <p>
              Flatten mean <b>{(pass.flat.reduce((a, b) => a + b, 0) / pass.flat.length).toFixed(3)}</b>
            </p>
          </article>
          <article>
            <h3>THE GUESS</h3>
            <p className="cnn-guess">
              {guessPct}% sure this is {LABEL_PLAIN[predictedIndex]}
            </p>
            {LABELS.map((name, index) => (
              <p key={name}>
                {name}
                <i>
                  <span style={{ width: `${shownProbs[index] * 100}%` }} />
                </i>
                <b>{`${(shownProbs[index] * 100).toFixed(0)}%`}</b>
              </p>
            ))}
          </article>
        </section>}
      </main>
      {!lesson && <aside className="cnn-inspector panel">
        <h2>Look inside this layer</h2>
        <p className="cnn-insp-sub">{STAGE_COPY[stageId].purpose}</p>
        <label>
          Step
          <select
            value={stageId}
            onChange={(e) => {
              setStageId(e.target.value as StageId);
              setFilter(0);
            }}
          >
            {STAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number} {item.name}
                {item.detail ? ` · ${item.detail}` : ""}
              </option>
            ))}
          </select>
        </label>
        {(stageId === "conv1" || stageId === "conv2" || stageId.includes("relu") || stageId.includes("pool")) && (
          <label>
            Pattern detector{" "}
            <span>
              <button onClick={() => setFilter(Math.max(0, channel - 1))}>‹</button>
              <b>
                {channel + 1} of {filterCount}
              </b>
              <button onClick={() => setFilter(Math.min(filterCount - 1, channel + 1))}>›</button>
            </span>
          </label>
        )}
        {(stageId === "conv1" || stageId === "conv2") && (
          <>
            <h3>
              3×3 stamp <small>what this detector likes</small>
            </h3>
            <div className="kernel-grid">
              {kernel.map((row, r) =>
                row.map((v, c) => (
                  <input
                    key={`${r}:${c}`}
                    value={Number(v.toFixed(3))}
                    type="number"
                    step=".1"
                    onChange={(e) => editKernel(r, c, Number(e.target.value))}
                  />
                )),
              )}
            </div>
          </>
        )}
        <label>
          Stride
          <select value={stride} onChange={(e) => setStride(Number(e.target.value))}>
            <option>1</option>
            <option>2</option>
          </select>
        </label>
        <small className="cnn-help">
          How far the stamp jumps. 1 = every pixel; 2 = skip a pixel.
        </small>
        <label>
          Padding
          <select value={padding} onChange={(e) => setPadding(Number(e.target.value))}>
            <option>0</option>
            <option>1</option>
          </select>
        </label>
        <small className="cnn-help">Quiet border so the stamp can sit on the edge.</small>
        <label>
          Bias
          <input type="checkbox" checked={bias} onChange={(e) => setBias(e.target.checked)} />
        </label>
        <label>
          Batch Norm
          <input type="checkbox" checked={batchNorm} onChange={(e) => setBatchNorm(e.target.checked)} />
        </label>
        <section>
          <h3>What you are seeing</h3>
          <p>
            {selectedVolume
              ? `${shapeOf(selectedVolume)} live maps`
              : stageId === "flatten"
                ? `${pass.flat.length} flattened units`
                : stageId === "dense"
                  ? `${pass.hidden.length} dense units`
                  : "2-class softmax"}
          </p>
          <input
            type="range"
            min="0"
            max={filterCount - 1}
            value={channel}
            onChange={(e) => setFilter(Number(e.target.value))}
          />
          <label>
            Stats overlay
            <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          </label>
          <label>
            Grid
            <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} />
          </label>
        </section>
        <button onClick={() => setAdvanced(true)}>Open TensorFlow.js Training Lab</button>
      </aside>}
      {toast && (
        <button className="cnn-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
