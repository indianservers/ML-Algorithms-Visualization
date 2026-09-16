import { useMemo, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Link } from "react-router-dom";
import { Play, RotateCcw } from "lucide-react";
import TensorFlowDeepLearningLab from "../shared/TensorFlowDeepLearningLab";
import {
  LAB_TABS,
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
import {
  buildModel,
  imageSample,
  makeTrainingData,
} from "../../../lib/algorithms/neural/tensorflowDeepLearning";
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

const LABELS = ["horizontal bar", "vertical bar"] as const;
const STAGES = [
  { id: "input", icon: "▧", name: "Input", detail: "8×8×1", number: 0 },
  { id: "conv1", icon: "▣", name: "Conv2D", detail: "32 Filters", number: 1 },
  { id: "relu1", icon: "⌁", name: "ReLU", detail: "", number: 2 },
  { id: "pool1", icon: "▦", name: "MaxPool", detail: "2×2", number: 3 },
  { id: "conv2", icon: "▣", name: "Conv2D", detail: "64 Filters", number: 4 },
  { id: "relu2", icon: "⌁", name: "ReLU", detail: "", number: 5 },
  { id: "pool2", icon: "▦", name: "MaxPool", detail: "2×2", number: 6 },
  { id: "flatten", icon: "⠿", name: "Flatten", detail: "256", number: 7 },
  { id: "dense", icon: "⌘", name: "Dense", detail: "128", number: 8 },
  { id: "softmax", icon: "◇", name: "Softmax", detail: "2 Classes", number: 9 },
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
    purpose: "One grayscale 8×8 pattern. This is the only tensor the network sees.",
    does: "Change the sample seed to swap horizontal vs vertical bars and watch every later map move.",
  },
  conv1: {
    purpose: "32 learned 3×3 filters slide over the image and each produce an 8×8 map.",
    does: "Edit the selected 3×3 kernel. Edge filters light up bars; a blur kernel washes them out.",
  },
  relu1: {
    purpose: "ReLU zeroes negative detections so the next layer only sees “this pattern was found.”",
    does: "Compare sparsity with the Conv2D map. Dark cells are exact zeros, not small noise.",
  },
  pool1: {
    purpose: "2×2 max-pool keeps the strongest response in each window and halves height and width.",
    does: "A bar that was 8 pixels tall becomes a 4×4 glow. Location gets cheaper; presence stays.",
  },
  conv2: {
    purpose: "64 filters look at all 32 pooled channels at once, so they can combine edges into motifs.",
    does: "Cycle filters 1–64. Each map is a real depth-wise sum, not a copied thumbnail.",
  },
  relu2: {
    purpose: "Second ReLU again drops negative motif scores before the last downsample.",
    does: "If a filter is dead (all zeros), the kernel is pointed the wrong way for this image.",
  },
  pool2: {
    purpose: "Another 2×2 pool yields 2×2×64. That is exactly 256 numbers.",
    does: "Count the cells: 2×2×64 = 256. That identity is why Flatten says 256.",
  },
  flatten: {
    purpose: "The volume is unrolled into a vector so a dense layer can read it.",
    does: "The 256 bars are the pooled maps in channel order — not random decoration.",
  },
  dense: {
    purpose: "A 128-unit ReLU layer mixes those 256 numbers into a compact code.",
    does: "Positive bars are live neurons. Many zeros means the ReLU parked that unit.",
  },
  softmax: {
    purpose: "Two logits become a probability distribution over the two pattern classes.",
    does: "Train the TensorFlow.js model to replace this inspector head with a fitted classifier.",
  },
};

type KernelBank = ImageMatrix[][];
type DenseLayer = { weights: number[][]; bias: number[] };

function makeImage(seed = 0): ImageMatrix {
  const values = imageSample(101 + seed).values;
  return Array.from({ length: 8 }, (_, row) => values.slice(row * 8, row * 8 + 8));
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
  const flat = flattenVolume(pool2);
  const hidden = denseForward(flat, dense128.weights, dense128.bias, "relu");
  const logits = denseForward(hidden, dense2.weights, dense2.bias);
  return { conv1, relu1, pool1, conv2, relu2, pool2, flat, hidden, logits, probs: softmax(logits) };
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
  conv1: 3 * 3 * 1 * 32 + 32,
  conv2: 3 * 3 * 32 * 64 + 64,
  dense: 256 * 128 + 128,
  softmax: 128 * 2 + 2,
};
const TOTAL_PARAMS = PARAMS.conv1 + PARAMS.conv2 + PARAMS.dense + PARAMS.softmax;

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
  const { tab, setTab, lesson } = useLabTabs("Visualize", "Visualize", [
    "Learn",
    "Compare",
    "Explain",
  ]);
  const [advanced, setAdvanced] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [stageId, setStageId] = useState<StageId>("conv1");
  const [filter, setFilter] = useState(0);
  const [conv1Bank, setConv1Bank] = useState(() => makeKernelBank(32, 1, 32));
  const [conv2Bank, setConv2Bank] = useState(() => makeKernelBank(64, 32, 64));
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

  const dense128 = useMemo(() => makeDenseWeights(128, 256, 128), []);
  const dense2 = useMemo(() => makeDenseWeights(2, 128, 2), []);

  const image = useMemo(() => makeImage(seed), [seed]);
  const pass = useMemo(
    () => runPass(image, conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm),
    [image, conv1Bank, conv2Bank, stride, padding, bias, batchNorm, dense128, dense2],
  );
  const roster = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const sample = makeImage(index);
        const out = runPass(sample, conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm);
        const truth = imageSample(101 + index).label;
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
    [conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm],
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

  const filterCount = stageId === "conv2" || stageId === "relu2" || stageId === "pool2" ? 64 : 32;
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
      : (conv1Bank[Math.min(filter, 31)]?.[0] ?? conv1Bank[0][0]);

  const editKernel = (r: number, c: number, value: number) => {
    if (stageId === "conv2" || stageId === "relu2" || stageId === "pool2") {
      setConv2Bank((bank) =>
        bank.map((kernels, i) =>
          i !== channel
            ? kernels
            : kernels.map((k, j) =>
                j !== 0 ? k : k.map((row, y) => row.map((item, x) => (y === r && x === c ? value : item))),
              ),
        ),
      );
      return;
    }
    setConv1Bank((bank) =>
      bank.map((kernels, i) =>
        i !== Math.min(filter, 31)
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
    const data = makeTrainingData("cnn", 96);
    const model = buildModel("cnn", 32, 0.025);
    try {
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
      const output = model.predict(input) as tf.Tensor;
      setPrediction(Array.from(await output.data()));
      input.dispose();
      output.dispose();
      setToast("Training complete — held-out prediction updated");
    } catch (error) {
      setToast(error instanceof Error ? `Training failed: ${error.message}` : "Training failed");
    } finally {
      data.xs.dispose();
      data.ys.dispose();
      model.dispose();
      setTraining(false);
    }
  };

  const latest = history[history.length - 1];
  const predictedIndex =
    (prediction.length > 0 ? prediction : pass.probs)[1] >= (prediction.length > 0 ? prediction : pass.probs)[0]
      ? 1
      : 0;
  const shownProbs = prediction.length > 0 ? prediction : pass.probs;
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
    setConv1Bank(makeKernelBank(32, 1, 32));
    setConv2Bank(makeKernelBank(64, 32, 64));
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
        <TensorFlowDeepLearningLab mode="cnn" />
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

  return (
    <div className="cnn-page">
      <aside className="cnn-side">
        <Link to="/">◉</Link>
        {VIEWS.map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => chooseView(id)}>
            {label}
          </button>
        ))}
        <section>
          <h4>DATASET</h4>
          <p>
            ▦ Synthetic Patterns · <small>96 images · 8×8×1</small>
          </p>
          <h4>MODEL</h4>
          <p>
            ⌘ CNN v1.0 · <small>9 layers · {TOTAL_PARAMS.toLocaleString()} weights</small>
          </p>
          <h4>TRAINING</h4>
          <p>
            ● 80% Train
            <br />● 10% Val
            <br />● 10% Test
          </p>
        </section>
      </aside>
      <header className="cnn-head">
        <h1>⌘ Convolutional Neural Network</h1>
        <div>
          <button onClick={reset}>
            <RotateCcw /> Reset
          </button>
          <button className="train" onClick={() => void trainModel()} disabled={training}>
            <Play /> {training ? "Training…" : "Train"}
          </button>
          <label>
            Epochs
            <select value={epochs} onChange={(e) => setEpochs(Number(e.target.value))}>
              <option>5</option>
              <option>18</option>
              <option>40</option>
            </select>
          </label>
          <span>
            ● Model Status <b>{training ? "Training" : latest ? "Trained" : "Ready"}</b>
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
              <b>{item.icon}</b>
              {item.name}
              <small>{item.detail}</small>
              {item.number > 0 && <i>{item.number}</i>}
            </button>
          ))}
        </section>}

        {lesson ? null : view === "data" ? (
          <section className="cnn-flow panel cnn-data-grid">
            {samples.map((sample, index) => (
              <button key={index} onClick={() => setSeed(index)} className={seed === index ? "active" : ""}>
                <Matrix matrix={sample.image} tone="gray" grid={grid} />
                <span>
                  {sample.label}
                  <small>
                    {" "}
                    · inspector {roster[index].pred} {(roster[index].conf * 100).toFixed(0)}%
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
                  ["1", "Conv2D", shapeOf(pass.conv1), String(PARAMS.conv1), STAGE_COPY.conv1.purpose],
                  ["2", "ReLU", shapeOf(pass.relu1), "0", STAGE_COPY.relu1.purpose],
                  ["3", "MaxPool 2×2", shapeOf(pass.pool1), "0", STAGE_COPY.pool1.purpose],
                  ["4", "Conv2D", shapeOf(pass.conv2), String(PARAMS.conv2), STAGE_COPY.conv2.purpose],
                  ["5", "ReLU", shapeOf(pass.relu2), "0", STAGE_COPY.relu2.purpose],
                  ["6", "MaxPool 2×2", shapeOf(pass.pool2), "0", STAGE_COPY.pool2.purpose],
                  ["7", "Flatten", String(pass.flat.length), "0", STAGE_COPY.flatten.purpose],
                  ["8", "Dense", String(pass.hidden.length), String(PARAMS.dense), STAGE_COPY.dense.purpose],
                  ["9", "Softmax", String(pass.probs.length), String(PARAMS.softmax), STAGE_COPY.softmax.purpose],
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
              <h4>TENSORFLOW.JS FIT</h4>
              <p>
                Fits Conv2D 32 → ReLU → MaxPool 2×2 → Conv2D 64 → ReLU → MaxPool 2×2 → Flatten 256 →
                Dense 128 → Softmax on 96 labeled 8×8×1 bars. The fitted head replaces the inspector
                softmax when training finishes.
              </p>
              <button className="train" onClick={() => void trainModel()} disabled={training}>
                {training ? "Training…" : `Train ${epochs} epochs`}
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
                      <td>{point.epoch ? point.loss.toFixed(4) : "run Train"}</td>
                      <td>{point.epoch ? `${(point.accuracy * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article>
              <h4>INSPECTOR SETTINGS</h4>
              <label>
                Stride
                <select value={stride} onChange={(e) => setStride(Number(e.target.value))}>
                  <option>1</option>
                  <option>2</option>
                </select>
              </label>
              <label>
                Padding
                <select value={padding} onChange={(e) => setPadding(Number(e.target.value))}>
                  <option>0</option>
                  <option>1</option>
                </select>
              </label>
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
Conv2D(32, 3×3, stride ${stride}, pad ${padding}) → ${shapeOf(pass.conv1)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool1)}
Conv2D(64, 3×3) → ${shapeOf(pass.conv2)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool2)}
Flatten → ${pass.flat.length}
Dense(128, ReLU) → ${pass.hidden.length}
Softmax → ${pass.probs.map((p) => p.toFixed(3)).join(" / ")}
params ${TOTAL_PARAMS}`}</pre>
            </article>
          </section>
        ) : view === "evaluate" ? (
          <section className="cnn-flow panel cnn-eval">
            <article>
              <h4>INSPECTOR ROSTER</h4>
              <p>
                {inspectorHits}/12 samples match the true bar class using the live 8×8×1 → 32 → 64 →
                256 → 128 → 2 forward pass.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Truth</th>
                    <th>Inspector</th>
                    <th>Conf</th>
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
                      <td>{item.ok ? item.pred : `${item.pred} ✕`}</td>
                      <td>{(item.conf * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article className="cnn-selected">
              <h4>SAMPLE {seed + 1} SOFTMAX</h4>
              <div className="cnn-softmax">
                {LABELS.map((name, index) => (
                  <p className={index === predictedIndex ? "active" : ""} key={name}>
                    {name}
                    <b>{shownProbs[index].toFixed(3)}</b>
                  </p>
                ))}
              </div>
              <strong>
                {prediction.length > 0
                  ? `Trained model: ${LABELS[predictedIndex]}`
                  : `Inspector head: ${LABELS[predictedIndex]}`}
              </strong>
            </article>
          </section>
        ) : view === "deploy" ? (
          <section className="cnn-flow panel">
            <pre className="cnn-card">{`input: 8×8×1
Conv2D(32, 3×3, stride ${stride}, pad ${padding}) → ${shapeOf(pass.conv1)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool1)}
Conv2D(64, 3×3) → ${shapeOf(pass.conv2)}
ReLU → MaxPool(2×2) → ${shapeOf(pass.pool2)}
Flatten → ${pass.flat.length}
Dense(128, ReLU) → ${pass.hidden.length}
Softmax → ${pass.probs.map((p) => p.toFixed(3)).join(" / ")}`}</pre>
          </section>
        ) : (
          <section className="cnn-flow panel">
            <article>
              <h4>INPUT IMAGE</h4>
              <Matrix matrix={image} tone="gray" grid={grid} />
              <p>8 × 8 × 1 · sample {seed + 1}</p>
              {(stageId === "conv1" || stageId === "conv2") && (
                <div className="kernel-card">
                  <h4>
                    3×3 KERNEL (Filter {channel + 1})
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
                {stage.name.toUpperCase()} {stage.detail && `· ${stage.detail}`}
              </h4>
              {selectedVolume ? (
                <>
                  <Matrix
                    matrix={selectedMap}
                    tone={stageId.includes("pool") ? "blue" : stageId.includes("conv") || stageId.includes("relu") ? "green" : "gray"}
                    grid={grid}
                  />
                  <p>
                    viewing map {channel + 1}/{selectedVolume.length} · {shapeOf(selectedVolume)}
                  </p>
                </>
              ) : stageId === "flatten" ? (
                <>
                  <Bars values={pass.flat} />
                  <p>{pass.flat.length} units · 2×2×64 unrolled</p>
                </>
              ) : stageId === "dense" ? (
                <>
                  <Bars values={pass.hidden} tone="#5eead4" />
                  <p>{pass.hidden.length} ReLU units · {pass.hidden.filter((v) => v <= 0).length} parked at 0</p>
                </>
              ) : (
                <>
                  <div className="cnn-softmax">
                    {LABELS.map((name, index) => (
                      <p className={index === predictedIndex ? "active" : ""} key={name}>
                        {name}
                        <b>{shownProbs[index].toFixed(3)}</b>
                      </p>
                    ))}
                  </div>
                  <strong>
                    {prediction.length > 0
                      ? `Trained model: ${LABELS[predictedIndex]}`
                      : `Inspector head: ${LABELS[predictedIndex]}`}
                  </strong>
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
              <h4>WHY THIS LAYER</h4>
              <p>{STAGE_COPY[stageId].purpose}</p>
              <p>{STAGE_COPY[stageId].does}</p>
            </article>
          </section>
        )}

        {!lesson && <section className="cnn-layers panel">
          <h3>LAYERS</h3>
          {STAGES.map((item) => (
            <button
              key={item.id}
              className={stageId === item.id ? "active" : ""}
              onClick={() => setStageId(item.id)}
            >
              {item.number > 0 && <small>{item.number}</small>}
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
            <svg viewBox="0 0 480 170">
              <path d="M20 10V150H470" />
              {history.length > 0 && (
                <>
                  <polyline className="loss" points={lossPoints} />
                  <polyline className="acc" points={accuracyPoints} />
                </>
              )}
            </svg>
          </article>
          <article>
            <h3>METRICS (TensorFlow lab)</h3>
            <button onClick={() => setAdvanced(true)}>Open live training metrics →</button>
            <p>
              Epoch{" "}
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
            <h3>PREDICTIONS</h3>
            {LABELS.map((name, index) => (
              <p key={name}>
                {name}
                <i>
                  <span style={{ width: `${shownProbs[index] * 100}%` }} />
                </i>
                <b>{`${(shownProbs[index] * 100).toFixed(1)}%`}</b>
              </p>
            ))}
          </article>
        </section>}
      </main>
      {!lesson && <aside className="cnn-inspector panel">
        <h2>
          LAYER INSPECTOR
          <button onClick={() => setView("overview")} aria-label="Focus overview">
            ×
          </button>
        </h2>
        <label>
          Layer
          <select
            value={stageId}
            onChange={(e) => {
              setStageId(e.target.value as StageId);
              setFilter(0);
            }}
          >
            {STAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number ? `${item.number} ` : ""}
                {item.name}
                {item.detail ? ` · ${item.detail}` : ""}
              </option>
            ))}
          </select>
        </label>
        {(stageId === "conv1" || stageId === "conv2" || stageId.includes("relu") || stageId.includes("pool")) && (
          <label>
            Filter{" "}
            <span>
              <button onClick={() => setFilter(Math.max(0, channel - 1))}>‹</button>
              <b>
                {channel + 1} / {filterCount}
              </b>
              <button onClick={() => setFilter(Math.min(filterCount - 1, channel + 1))}>›</button>
            </span>
          </label>
        )}
        {(stageId === "conv1" || stageId === "conv2") && (
          <>
            <h3>
              Kernel (3×3) <small>Edits this filter</small>
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
        <label>
          Padding
          <select value={padding} onChange={(e) => setPadding(Number(e.target.value))}>
            <option>0</option>
            <option>1</option>
          </select>
        </label>
        <label>
          Bias
          <input type="checkbox" checked={bias} onChange={(e) => setBias(e.target.checked)} />
        </label>
        <label>
          Batch Norm
          <input type="checkbox" checked={batchNorm} onChange={(e) => setBatchNorm(e.target.checked)} />
        </label>
        <section>
          <h3>Feature Map Visualization</h3>
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
