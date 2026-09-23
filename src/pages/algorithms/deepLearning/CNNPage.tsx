import { useMemo, useState } from "react";
import { Play, RotateCcw, Scan } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Formula } from "../../../components/common/Formula";
import { LAB_TABS, LabLessonPanel, isLabTab, useLabTabs } from "../../../components/common/LabTabs";
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

const ROUTE = "/ml/deep-learning/cnn";
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
type KernelBank = ImageMatrix[][];
type DenseLayer = { weights: number[][]; bias: number[] };

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
    purpose: `Now ${CONV2_FILTERS} stamps look at all ${CONV1_FILTERS} earlier maps at once, so they can join edges into shapes.`,
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

const PARAMS = {
  conv1: 3 * 3 * 1 * CONV1_FILTERS + CONV1_FILTERS,
  conv2: 3 * 3 * CONV1_FILTERS * CONV2_FILTERS + CONV2_FILTERS,
  dense: CONV2_FILTERS * 4 * DENSE_UNITS + DENSE_UNITS,
  softmax: DENSE_UNITS * 2 + 2,
};

function cloneImage(image: ImageMatrix): ImageMatrix {
  return image.map((row) => [...row]);
}

function makeImage(seed = 0): ImageMatrix {
  const values = imageSample(101 + seed).values;
  return Array.from({ length: 8 }, (_, row) => values.slice(row * 8, row * 8 + 8));
}

function makeAlbum(): ImageMatrix[] {
  return Array.from({ length: SAMPLE_COUNT }, (_, index) => makeImage(index));
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
  const paint = colors[tone] ?? colors.green;
  return (
    <div
      className={`cnn-matrix ${grid ? "grid" : ""}`}
      role="img"
      aria-label={`${matrix.length} by ${matrix[0]?.length ?? 0} pixel map. Brighter cells mean a stronger match.`}
      style={{ gridTemplateColumns: `repeat(${matrix[0]?.length ?? 1},1fr)` }}
    >
      {normalized.flat().map((value, index) => (
        <i key={index} style={{ background: paint(value) }} />
      ))}
    </div>
  );
}

function PixelEditor({
  matrix,
  grid,
  onToggle,
}: {
  matrix: ImageMatrix;
  grid: boolean;
  onToggle: (row: number, column: number) => void;
}) {
  const normalized = normalizeFeatureMap(matrix);
  return (
    <div
      className={`cnn-matrix cnn-edit ${grid ? "grid" : ""}`}
      style={{ gridTemplateColumns: `repeat(${matrix[0]?.length ?? 1},1fr)` }}
    >
      {matrix.map((row, r) =>
        row.map((_, c) => {
          const value = normalized[r]?.[c] ?? 0;
          return (
            <button
              key={`${r}:${c}`}
              type="button"
              aria-label={`Toggle pixel ${r + 1}, ${c + 1}`}
              style={{
                background: `rgb(${Math.round(value * 225)} ${Math.round(value * 205)} ${Math.round(value * 175)})`,
              }}
              onClick={() => onToggle(r, c)}
            />
          );
        }),
      )}
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
  return `${volume[0]?.[0]?.length ?? 0}×${volume[0]?.length ?? 0}×${volume.length}`;
}

export default function CNNPage() {
  const { tab, setTab } = useLabTabs("Visualize", "", []);
  const [stageId, setStageId] = useState<StageId>("conv1");
  const [filter, setFilter] = useState(0);
  const [conv1Bank, setConv1Bank] = useState(() => makeKernelBank(CONV1_FILTERS, 1, CONV1_FILTERS));
  const [conv2Bank, setConv2Bank] = useState(() => makeKernelBank(CONV2_FILTERS, CONV1_FILTERS, CONV2_FILTERS));
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(1);
  const [bias, setBias] = useState(true);
  const [batchNorm, setBatchNorm] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [grid, setGrid] = useState(true);
  const [epochs, setEpochs] = useState(18);
  const [seed, setSeed] = useState(0);
  const [album, setAlbum] = useState<ImageMatrix[]>(makeAlbum);
  const [toast, setToast] = useState("");
  const [training, setTraining] = useState(false);
  const [history, setHistory] = useState<Array<{ epoch: number; loss: number; accuracy: number }>>([]);
  const [prediction, setPrediction] = useState<number[]>([]);

  const image = album[seed] ?? makeImage(seed);
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
  const totalParams = paramCounts.conv1 + paramCounts.conv2 + paramCounts.dense + paramCounts.softmax;
  const pass = useMemo(() => {
    const hidden = denseForward(features.flat, dense128.weights, dense128.bias, "relu");
    const logits = denseForward(hidden, dense2.weights, dense2.bias);
    return { ...features, hidden, logits, probs: softmax(logits) };
  }, [features, dense128, dense2]);
  const needRoster = isLabTab(tab, "Dataset", "Metrics", "Compare");
  const roster = useMemo(
    () =>
      album.map((sample, index) => {
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
        const out = runPass(sample, conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm);
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
    [needRoster, album, conv1Bank, conv2Bank, dense128, dense2, stride, padding, bias, batchNorm],
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
    stageId === "conv2" || stageId === "relu2" || stageId === "pool2" ? CONV2_FILTERS : CONV1_FILTERS;
  const channel = Math.min(filter, filterCount - 1);
  const stage = STAGES.find((item) => item.id === stageId) ?? STAGES[1];
  const selectedVolume = stageId in volumes ? volumes[stageId as keyof typeof volumes] : null;
  const selectedMap = selectedVolume?.[channel] ?? selectedVolume?.[0] ?? image;
  const stats = selectedVolume
    ? volumeStats(selectedVolume)
    : vectorStats(stageId === "dense" ? pass.hidden : stageId === "flatten" ? pass.flat : pass.probs);
  const kernel =
    stageId === "conv2" || stageId === "relu2" || stageId === "pool2"
      ? (conv2Bank[channel]?.[0] ?? conv2Bank[0]?.[0])
      : (conv1Bank[Math.min(filter, CONV1_FILTERS - 1)]?.[0] ?? conv1Bank[0]?.[0]);

  const editKernel = (r: number, c: number, value: number) => {
    if (stageId === "conv2" || stageId === "relu2" || stageId === "pool2") {
      setConv2Bank((bank) =>
        bank.map((kernels, i) =>
          i !== channel
            ? kernels
            : kernels.map((k) => k.map((row, y) => row.map((item, x) => (y === r && x === c ? value : item)))),
        ),
      );
      return;
    }
    setConv1Bank((bank) =>
      bank.map((kernels, i) =>
        i !== Math.min(filter, CONV1_FILTERS - 1)
          ? kernels
          : [kernels[0]!.map((row, y) => row.map((item, x) => (y === r && x === c ? value : item)))],
      ),
    );
  };

  const togglePixel = (row: number, column: number) => {
    setAlbum((current) =>
      current.map((sample, index) => {
        if (index !== seed) return sample;
        const next = cloneImage(sample);
        const cell = next[row]?.[column] ?? 0;
        if (next[row]) next[row][column] = cell > 0.5 ? 0 : 1;
        return next;
      }),
    );
  };

  const trainModel = async () => {
    setTraining(true);
    setHistory([]);
    setPrediction([]);
    setToast("Training TensorFlow.js CNN…");
    try {
      const tf = await import("@tensorflow/tfjs");
      const { buildModel, makeTrainingData } = await import("../../../lib/algorithms/neural/tensorflowDeepLearning");
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
      const input = tf.tensor4d(image.flat(), [1, 8, 8, 1]);
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
  const shownProbs = prediction.length > 0 ? prediction : pass.probs;
  const predictedIndex = shownProbs[1]! >= shownProbs[0]! ? 1 : 0;
  const guessPct = Math.round(shownProbs[predictedIndex]! * 100);
  const truthIndex = imageSample(101 + seed).label;
  const modelStatus = training ? "training" : latest ? "trained" : "ready";
  const inspectorHits = roster.filter((item) => item.ok).length;

  const reset = () => {
    setSeed(0);
    setAlbum(makeAlbum());
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

  const pickKind = (kind: 0 | 1) => {
    const hit = album.findIndex((_, index) => imageSample(101 + index).label === kind);
    if (hit >= 0) setSeed(hit);
  };

  const selectStage = (id: StageId) => {
    setStageId(id);
    setFilter(0);
  };

  const inspector = (
    <aside className="cnn-inspector" data-guide="cnn-conv">
      <h2>Look inside this layer</h2>
      <p className="cnn-insp-sub">{STAGE_COPY[stageId].purpose}</p>
      <label>
        Step
        <select
          value={stageId}
          onChange={(e) => selectStage(e.target.value as StageId)}
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
          Pattern detector
          <span>
            <button type="button" onClick={() => setFilter(Math.max(0, channel - 1))}>
              ‹
            </button>
            <b>
              {channel + 1} of {filterCount}
            </b>
            <button type="button" onClick={() => setFilter(Math.min(filterCount - 1, channel + 1))}>
              ›
            </button>
          </span>
        </label>
      )}
      {(stageId === "conv1" || stageId === "conv2") && kernel && (
        <>
          <h3>
            3×3 stamp <small>what this detector likes</small>
          </h3>
          <div className="kernel-grid">
            {kernel.map((row, r) =>
              row.map((value, c) => (
                <input
                  key={`${r}:${c}`}
                  value={Number(value.toFixed(3))}
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
      <small className="cnn-help">How far the stamp jumps. 1 = every pixel; 2 = skip a pixel.</small>
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
          max={Math.max(0, filterCount - 1)}
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
    </aside>
  );

  return (
    <div className="cnn-lab">
      <PageHeader
        title="Convolutional Neural Network"
        subtitle="Walk an 8×8 picture through conv, ReLU, pool, and a two-class guess — then train TensorFlow.js live."
        badge="Advanced"
        category="Deep Learning"
        icon={<Scan size={22} />}
        showAlgorithmIntro={false}
        showAlgorithmTools={false}
      />
      <nav className="cnn-tabs" role="tablist" aria-label="CNN lab tabs">
        {LAB_TABS.map((name) => (
          <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>
      <div className="cnn-strip">
        <span>
          Picture <b>{seed + 1}</b> / {SAMPLE_COUNT}
        </span>
        <span>
          Truth <b>{LABELS[truthIndex]}</b>
        </span>
        <span>
          Weights <b>{totalParams.toLocaleString()}</b>
        </span>
        <span className={`cnn-status ${modelStatus}`}>
          {training ? "Training" : latest ? "Trained" : "Ready"}
        </span>
        <button type="button" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {isLabTab(tab, "Learn") && (
        <div className="cnn-stack">
          <LabLessonPanel tab="Learn" route={ROUTE} />
          <article className="cnn-card" data-guide="algo-idea">
            <h2>A tiny window, not the whole photo</h2>
            <p>
              A CNN does not read 8×8 pixels as one blob. A 3×3 stamp slides across the picture. Early stamps find
              edges. Later stamps mix those edges into shapes. Pooling shrinks the map so “there is a bar” survives
              even if the bar moves a pixel.
            </p>
            <Formula value="y_{i,j} = b + \sum_{u,v} K_{u,v}\,x_{i+u,\,j+v}" block />
            <p>
              This lab stays small on purpose: {CONV1_FILTERS} then {CONV2_FILTERS} stamps, {DENSE_UNITS} neurons, two
              classes. Open Visualize to watch a live picture shrink; open Dataset to edit pixels; open Build / Train
              to fit TensorFlow.js on 96 practice pictures.
            </p>
          </article>
        </div>
      )}

      {isLabTab(tab, "Visualize") && (
        <div className="cnn-viz" data-guide="algo-visualize">
          <div className="cnn-viz-main">
            <section className="cnn-card cnn-samples-row">
              <button type="button" className={truthIndex === 0 ? "active" : ""} onClick={() => pickKind(0)}>
                Horizontal line
              </button>
              <button type="button" className={truthIndex === 1 ? "active" : ""} onClick={() => pickKind(1)}>
                Vertical line
              </button>
              <button type="button" onClick={() => setSeed((seed + 1) % SAMPLE_COUNT)}>
                Next picture
              </button>
              <small>
                Bright cells mean “I found that pattern here.” Click a numbered step below.
              </small>
            </section>
            <section className="cnn-pipeline" aria-label="CNN stages">
              {STAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={stageId === item.id ? "active" : ""}
                  data-guide={`cnn-${item.id}`}
                  onClick={() => selectStage(item.id)}
                >
                  <em>{item.number}</em>
                  {item.name}
                  <small>{item.detail}</small>
                </button>
              ))}
            </section>
            <section className="cnn-stage-view cnn-card">
              <header>
                <h2>
                  {stage?.number}. {stage?.name}
                </h2>
                <p>{STAGE_COPY[stageId].does}</p>
              </header>
              {selectedVolume ? (
                <Matrix
                  matrix={selectedMap}
                  tone={stageId === "input" ? "gray" : stageId.startsWith("pool") ? "purple" : "green"}
                  grid={grid}
                />
              ) : stageId === "flatten" ? (
                <Bars values={pass.flat} />
              ) : stageId === "dense" ? (
                <Bars values={pass.hidden} tone="#31d28c" />
              ) : (
                <div className="cnn-guess-block">
                  <p>
                    {guessPct}% sure this is {LABEL_PLAIN[predictedIndex]}
                    {prediction.length > 0 ? " (trained)" : " (inspector)"}
                  </p>
                  {LABELS.map((name, index) => (
                    <p key={name}>
                      {name}
                      <i>
                        <span style={{ width: `${(shownProbs[index] ?? 0) * 100}%` }} />
                      </i>
                      <b>{`${((shownProbs[index] ?? 0) * 100).toFixed(0)}%`}</b>
                    </p>
                  ))}
                </div>
              )}
              {overlay && (
                <p className="cnn-stats">
                  min {stats.min.toFixed(2)} · max {stats.max.toFixed(2)} · mean {stats.mean.toFixed(2)} · zeros{" "}
                  {(stats.zeros * 100).toFixed(0)}%
                </p>
              )}
              <p className="cnn-next">{STAGE_NEXT[stageId]}</p>
            </section>
          </div>
          {inspector}
        </div>
      )}

      {isLabTab(tab, "Dataset") && (
        <div className="cnn-stack" data-guide="algo-dataset">
          <article className="cnn-card">
            <h2>12 labeled 8×8 pictures</h2>
            <p>
              Click a thumbnail to send it through the inspector. Click a pixel on the large grid to flip ink. Labels
              stay as the original truth so you can sabotage a sample and watch the guess change.
            </p>
            <div className="cnn-data-grid">
              {roster.map((item) => (
                <button
                  key={item.index}
                  type="button"
                  className={seed === item.index ? "active" : ""}
                  onClick={() => setSeed(item.index)}
                >
                  <Matrix matrix={item.image} tone="gray" grid={grid} />
                  <span>
                    {item.label}
                    <small>
                      {" "}
                      · {item.ok ? "hit" : "miss"} {(item.conf * 100).toFixed(0)}%
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </article>
          <article className="cnn-card cnn-edit-card">
            <h3>
              Edit picture {seed + 1} · truth {LABELS[truthIndex]}
            </h3>
            <PixelEditor matrix={image} grid={grid} onToggle={togglePixel} />
            <p>
              Inspector guess: <b>{LABELS[pass.probs[1]! >= pass.probs[0]! ? 1 : 0]}</b> (
              {(Math.max(pass.probs[0]!, pass.probs[1]!) * 100).toFixed(0)}%)
            </p>
            <button type="button" onClick={() => setAlbum((current) => current.map((sample, i) => (i === seed ? makeImage(seed) : sample)))}>
              Restore this picture
            </button>
          </article>
        </div>
      )}

      {isLabTab(tab, "Build / Train") && (
        <div className="cnn-stack" data-guide="algo-params">
          <article className="cnn-card">
            <h2>Fit a TensorFlow.js CNN</h2>
            <p>
              96 synthetic 8×8 bars, same architecture as the inspector. Training updates the guess on the current
              picture. Stride / padding here also change the live inspector maps.
            </p>
            <div className="cnn-train-controls">
              <label>
                Rounds
                <select value={epochs} onChange={(e) => setEpochs(Number(e.target.value))}>
                  <option>5</option>
                  <option>18</option>
                  <option>40</option>
                </select>
              </label>
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
              <button type="button" className="cnn-train-btn" onClick={() => void trainModel()} disabled={training}>
                <Play size={16} /> {training ? "Training…" : "Train"}
              </button>
            </div>
            {history.length === 0 ? (
              <p className="cnn-empty">No training yet. Press Train — the network looks at 96 tiny pictures.</p>
            ) : (
              <svg className="cnn-chart" viewBox="0 0 480 170" aria-label="Training loss and accuracy">
                <path d="M20 10V150H470" />
                <polyline
                  className="loss"
                  points={history
                    .map((point, index) => {
                      const maxLoss = Math.max(1, ...history.map((item) => item.loss));
                      const x = 20 + (history.length < 2 ? 0 : (index / (history.length - 1)) * 450);
                      return `${x},${145 - (point.loss / maxLoss) * 125}`;
                    })
                    .join(" ")}
                />
                <polyline
                  className="acc"
                  points={history
                    .map((point, index) => {
                      const x = 20 + (history.length < 2 ? 0 : (index / (history.length - 1)) * 450);
                      return `${x},${145 - point.accuracy * 125}`;
                    })
                    .join(" ")}
                />
              </svg>
            )}
            <p>
              Round <b>{history.length} / {epochs}</b> · Loss <b>{latest ? latest.loss.toFixed(4) : "—"}</b> · Accuracy{" "}
              <b>{latest ? `${(latest.accuracy * 100).toFixed(1)}%` : "—"}</b>
            </p>
          </article>
          <article className="cnn-card">
            <h3>The guess on picture {seed + 1}</h3>
            <p>
              {guessPct}% sure this is {LABEL_PLAIN[predictedIndex]}
              {prediction.length > 0 ? " after training" : " from the untrained inspector"}
            </p>
            {LABELS.map((name, index) => (
              <p key={name} className="cnn-barline">
                {name}
                <i>
                  <span style={{ width: `${(shownProbs[index] ?? 0) * 100}%` }} />
                </i>
                <b>{`${((shownProbs[index] ?? 0) * 100).toFixed(0)}%`}</b>
              </p>
            ))}
          </article>
        </div>
      )}

      {isLabTab(tab, "Metrics") && (
        <div className="cnn-stack" data-guide="algo-metrics">
          <article className="cnn-card">
            <h2>Inspector scoreboard</h2>
            <p>
              Live forward pass on the 12 album pictures. Hits {inspectorHits} / {SAMPLE_COUNT}. Training does not
              rewrite these inspector weights — that comparison lives on Compare.
            </p>
            <table className="cnn-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Truth</th>
                  <th>Guess</th>
                  <th>Confidence</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((item) => (
                  <tr key={item.index} className={seed === item.index ? "on" : ""}>
                    <td>
                      <button type="button" onClick={() => setSeed(item.index)}>
                        {item.index + 1}
                      </button>
                    </td>
                    <td>{item.label}</td>
                    <td>{item.pred}</td>
                    <td>{(item.conf * 100).toFixed(0)}%</td>
                    <td>{item.ok ? "hit" : "miss"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {isLabTab(tab, "Compare") && (
        <div className="cnn-stack">
          <article className="cnn-card">
            <h2>Architecture vs this run</h2>
            <table className="cnn-table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Op</th>
                  <th>Output</th>
                  <th>Params</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Picture</td>
                  <td>Input</td>
                  <td>8×8×1</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Find edges</td>
                  <td>Conv2D 3×3 / s{stride} / p{padding}</td>
                  <td>{shapeOf(pass.conv1)}</td>
                  <td>{paramCounts.conv1}</td>
                </tr>
                <tr>
                  <td>Shrink</td>
                  <td>MaxPool 2×2</td>
                  <td>{shapeOf(pass.pool1)}</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Find shapes</td>
                  <td>Conv2D 3×3</td>
                  <td>{shapeOf(pass.conv2)}</td>
                  <td>{paramCounts.conv2}</td>
                </tr>
                <tr>
                  <td>Unroll</td>
                  <td>Flatten</td>
                  <td>{pass.flat.length}</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>Mix</td>
                  <td>Dense ReLU</td>
                  <td>{DENSE_UNITS}</td>
                  <td>{paramCounts.dense}</td>
                </tr>
                <tr>
                  <td>Guess</td>
                  <td>Softmax</td>
                  <td>2</td>
                  <td>{paramCounts.softmax}</td>
                </tr>
              </tbody>
            </table>
            <p>
              Total <b>{totalParams.toLocaleString()}</b> weights. Inspector hits {inspectorHits}/{SAMPLE_COUNT} on
              the album.
              {prediction.length > 0
                ? ` Trained softmax on the current picture: ${LABELS[predictedIndex]} at ${guessPct}%.`
                : " Train on Build / Train to add a fitted softmax for the current picture."}
            </p>
            {prediction.length > 0 && (
              <p>
                On this picture the inspector says{" "}
                <b>{LABELS[pass.probs[1]! >= pass.probs[0]! ? 1 : 0]}</b>, and the trained softmax says{" "}
                <b>{LABELS[predictedIndex]}</b>.
              </p>
            )}
          </article>
        </div>
      )}

      {isLabTab(tab, "Explain") && (
        <div className="cnn-stack">
          <LabLessonPanel tab="Explain" route={ROUTE} />
          <article className="cnn-card">
            <h2>
              {stage?.number}. {stage?.name} · {stage?.tech}
            </h2>
            <p>{STAGE_COPY[stageId].purpose}</p>
            <p>{STAGE_COPY[stageId].does}</p>
            <p>{STAGE_NEXT[stageId]}</p>
            <div className="cnn-pipeline cnn-pipeline-explain">
              {STAGES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={stageId === item.id ? "active" : ""}
                  onClick={() => selectStage(item.id)}
                >
                  <em>{item.number}</em>
                  {item.name}
                </button>
              ))}
            </div>
          </article>
        </div>
      )}

      {toast && (
        <button type="button" className="cnn-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
