import { useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Link } from "react-router-dom";
import { Play, RotateCcw } from "lucide-react";
import TensorFlowDeepLearningLab from "../shared/TensorFlowDeepLearningLab";
import {
  buildModel,
  imageSample,
  makeTrainingData,
} from "../../../lib/algorithms/neural/tensorflowDeepLearning";
import {
  convolve2d,
  maxPool2d,
  normalizeFeatureMap,
  reluMatrix,
  type ImageMatrix,
} from "../../../lib/algorithms/neural/cnn";
import "./CNNPage.css";

const KERNELS: ImageMatrix[] = [
  [
    [-1, 0, 1],
    [-1, 1, 0],
    [0, -1, 1],
  ],
  [
    [1, 0, -1],
    [2, 0, -2],
    [1, 0, -1],
  ],
  [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0],
  ],
  [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
];
const labels = ["horizontal bar", "vertical bar"];
function makeImage(seed = 0): ImageMatrix {
  const values = imageSample(101 + seed).values;
  return Array.from({ length: 8 }, (_, row) =>
    values.slice(row * 8, row * 8 + 8),
  );
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
  const normalized = normalizeFeatureMap(matrix),
    colors: Record<string, (v: number) => string> = {
      green: (v) =>
        `rgb(${Math.round(v * 30)} ${Math.round(65 + v * 185)} ${Math.round(55 + v * 90)})`,
      blue: (v) =>
        `rgb(${Math.round(v * 55)} ${Math.round(75 + v * 105)} ${Math.round(110 + v * 145)})`,
      purple: (v) =>
        `rgb(${Math.round(55 + v * 145)} ${Math.round(35 + v * 60)} ${Math.round(90 + v * 160)})`,
      gray: (v) =>
        `rgb(${Math.round(v * 225)} ${Math.round(v * 205)} ${Math.round(v * 175)})`,
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
export default function CNNPage() {
  const [advanced, setAdvanced] = useState(false),
    [layer, setLayer] = useState("Conv2D (32 Filters)"),
    [filter, setFilter] = useState(0),
    [kernel, setKernel] = useState<ImageMatrix>(KERNELS[0].map((r) => [...r])),
    [stride, setStride] = useState(1),
    [padding, setPadding] = useState(1),
    [bias, setBias] = useState(true),
    [batchNorm, setBatchNorm] = useState(false),
    [overlay, setOverlay] = useState(true),
    [grid, setGrid] = useState(true),
    [epochs, setEpochs] = useState(18),
    [seed, setSeed] = useState(0),
    [toast, setToast] = useState(""),
    [training, setTraining] = useState(false),
    [history, setHistory] = useState<
      Array<{ epoch: number; loss: number; accuracy: number }>
    >([]),
    [prediction, setPrediction] = useState<number[]>([]);
  const image = makeImage(seed),
    conv = convolve2d(image, kernel, stride, padding),
    relu = reluMatrix(conv),
    pool = maxPool2d(relu),
    second = reluMatrix(
      convolve2d(pool, KERNELS[(filter + 1) % KERNELS.length], 1, 1),
    );
  const edit = (r: number, c: number, value: number) =>
    setKernel((current) =>
      current.map((row, y) =>
        row.map((item, x) => (y === r && x === c ? value : item)),
      ),
    );
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
      const input = tf.tensor4d(imageSample(101).values, [1, 8, 8, 1]);
      const output = model.predict(input) as tf.Tensor;
      setPrediction(Array.from(await output.data()));
      input.dispose();
      output.dispose();
      setToast("Training complete — held-out prediction updated");
    } catch (error) {
      setToast(
        error instanceof Error
          ? `Training failed: ${error.message}`
          : "Training failed",
      );
    } finally {
      data.xs.dispose();
      data.ys.dispose();
      model.dispose();
      setTraining(false);
    }
  };
  const latest = history[history.length - 1],
    predictedIndex =
      prediction.length > 0 && prediction[1] >= prediction[0] ? 1 : 0,
    maxLoss = Math.max(1, ...history.map((point) => point.loss)),
    chartX = (index: number) =>
      20 + (history.length < 2 ? 0 : (index / (history.length - 1)) * 450),
    lossPoints = history
      .map(
        (point, index) =>
          `${chartX(index)},${145 - (point.loss / maxLoss) * 125}`,
      )
      .join(" "),
    accuracyPoints = history
      .map((point, index) => `${chartX(index)},${145 - point.accuracy * 125}`)
      .join(" ");
  if (advanced)
    return (
      <div className="cnn-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to Layer Inspector
        </button>
        <TensorFlowDeepLearningLab mode="cnn" />
      </div>
    );
  return (
    <div className="cnn-page">
      <aside className="cnn-side">
        <Link to="/">◉</Link>
        {[
          "⌂ Overview",
          "▤ Data",
          "⌘ Model",
          "▷ Train",
          "▥ Evaluate",
          "♧ Deploy",
          "⚙ Settings",
        ].map((n) => (
          <button
            className={n.includes("Overview") ? "active" : ""}
            onClick={() => setToast(n)}
            key={n}
          >
            {n}
          </button>
        ))}
        <section>
          <h4>DATASET</h4>
          <p>
            ▦ Synthetic Patterns · ●<small>96 images</small>
          </p>
          <h4>MODEL</h4>
          <p>
            ⌘ CNN v1.0 · ●<small>7 Layers</small>
          </p>
          <h4>TRAINING</h4>
          <p>
            ● 80% Train
            <br />● 10% Val
            <br />● 10% Test
          </p>
        </section>
        <select>
          <option>☾ Theme</option>
        </select>
      </aside>
      <header className="cnn-head">
        <h1>⌘ Convolutional Neural Network</h1>
        <div>
          <button
            onClick={() => {
              setSeed(0);
              setLayer("Conv2D (32 Filters)");
              setFilter(0);
              setKernel(KERNELS[0].map((r) => [...r]));
              setStride(1);
              setPadding(1);
              setBias(true);
              setBatchNorm(false);
              setOverlay(true);
              setGrid(true);
              setHistory([]);
              setPrediction([]);
              setToast("Inspector reset");
            }}
          >
            <RotateCcw /> Reset
          </button>
          <button
            className="train"
            onClick={() => void trainModel()}
            disabled={training}
          >
            <Play /> {training ? "Training…" : "Train"}
          </button>
          <label>
            Epochs
            <select
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
            >
              <option>5</option>
              <option>18</option>
              <option>40</option>
            </select>
          </label>
          <span>
            ● Model Status{" "}
            <b>{training ? "Training" : latest ? "Trained" : "Ready"}</b>
          </span>
        </div>
      </header>
      <main>
        <section className="cnn-pipeline panel">
          {[
            ["▧", "Input", "8×8×1"],
            ["▣", "Conv2D", "32 Filters"],
            ["⌁", "ReLU", ""],
            ["▦", "MaxPool", "2×2"],
            ["▣", "Conv2D", "64 Filters"],
            ["⌁", "ReLU", ""],
            ["▦", "MaxPool", "2×2"],
            ["⠿", "Flatten", "256"],
            ["⌘", "Dense", "128"],
            ["◇", "Softmax", "2 Classes"],
          ].map((p, i) => (
            <button
              className={i === 1 ? "active" : ""}
              onClick={() => setLayer(String(p[1]))}
              key={`${p[1]}-${i}`}
            >
              <b>{p[0]}</b>
              {p[1]}
              <small>{p[2]}</small>
              <i>{i + 1}</i>
            </button>
          ))}
        </section>
        <section className="cnn-flow panel">
          <article>
            <h4>INPUT IMAGE</h4>
            <Matrix matrix={image} tone="gray" grid={grid} />
            <p>8 × 8 × 1</p>
            <div className="kernel-card">
              <h4>3×3 KERNEL (Filter {filter + 1})</h4>
              {kernel.map((row, r) =>
                row.map((v, c) => (
                  <input
                    key={`${r}:${c}`}
                    type="number"
                    value={v}
                    step=".1"
                    onChange={(e) => edit(r, c, Number(e.target.value))}
                  />
                )),
              )}
            </div>
          </article>
          <article>
            <h4>CONV2D (32 FILTERS)</h4>
            <Matrix matrix={conv} tone="green" grid={grid} />
            <p>
              {conv[0].length} × {conv.length} × 32
            </p>
          </article>
          <article>
            <h4>RELU</h4>
            <Matrix matrix={relu} tone="green" />
            <p>
              {relu[0].length} × {relu.length} × 32
            </p>
          </article>
          <article>
            <h4>MAXPOOL</h4>
            <Matrix matrix={pool} tone="blue" />
            <p>
              {pool[0].length} × {pool.length} × 32
            </p>
          </article>
          <article>
            <h4>CONV2D (64 FILTERS)</h4>
            <Matrix matrix={second} tone="purple" />
            <p>
              {second[0].length} × {second.length} × 64
            </p>
          </article>
          <article className="dense">
            <h4>FLATTEN · DENSE · SOFTMAX</h4>
            {Array.from({ length: 2 }, (_, i) => (
              <i key={i} />
            ))}
            <div>
              {labels.map((name, index) => (
                <p
                  className={
                    prediction.length > 0 && index === predictedIndex
                      ? "active"
                      : ""
                  }
                  key={name}
                >
                  {name}
                  <b>
                    {prediction.length > 0 ? prediction[index].toFixed(3) : "—"}
                  </b>
                </p>
              ))}
            </div>
            <strong>
              {prediction.length > 0
                ? `Predicted: ${labels[predictedIndex]}`
                : "Train model to predict"}
            </strong>
          </article>
        </section>
        <section className="cnn-layers panel">
          <h3>LAYERS</h3>
          {[
            "Input",
            "Conv2D",
            "ReLU",
            "MaxPool",
            "Conv2D",
            "ReLU",
            "MaxPool",
            "Flatten",
            "Dense",
            "Softmax",
          ].map((n, i) => (
            <button
              className={i === 1 ? "active" : ""}
              onClick={() => setLayer(n)}
              key={`${n}${i}`}
            >
              <small>{i + 1}</small>
              <b>{n}</b>
              <span>
                {i === 0
                  ? "8×8×1"
                  : i === 1
                    ? "32 Filters"
                    : i === 4
                      ? "64 Filters"
                      : i === 8
                        ? "128"
                        : ""}
              </span>
            </button>
          ))}
        </section>
        <section className="cnn-bottom panel">
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
            <button onClick={() => setAdvanced(true)}>
              Open live training metrics →
            </button>
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
              Accuracy{" "}
              <b>{latest ? `${(latest.accuracy * 100).toFixed(1)}%` : "—"}</b>
            </p>
            <p>
              Feature mean{" "}
              <b>
                {(
                  second.flat().reduce((a, b) => a + b, 0) /
                  second.flat().length
                ).toFixed(3)}
              </b>
            </p>
          </article>
          <article>
            <h3>PREDICTIONS</h3>
            {labels.map((name, index) => (
              <p key={name}>
                {name}
                <i>
                  <span
                    style={{
                      width: `${prediction.length > 0 ? prediction[index] * 100 : 0}%`,
                    }}
                  />
                </i>
                <b>
                  {prediction.length > 0
                    ? `${(prediction[index] * 100).toFixed(1)}%`
                    : "—"}
                </b>
              </p>
            ))}
          </article>
        </section>
      </main>
      <aside className="cnn-inspector panel">
        <h2>
          LAYER INSPECTOR
          <button onClick={() => setToast("Inspector closed")}>×</button>
        </h2>
        <label>
          Layer
          <select value={layer} onChange={(e) => setLayer(e.target.value)}>
            <option>Conv2D (32 Filters)</option>
            <option>Input</option>
            <option>ReLU</option>
            <option>MaxPool</option>
          </select>
        </label>
        <label>
          Filter{" "}
          <span>
            <button onClick={() => setFilter(Math.max(0, filter - 1))}>
              ‹
            </button>
            <b>{filter + 1} / 32</b>
            <button onClick={() => setFilter(Math.min(31, filter + 1))}>
              ›
            </button>
          </span>
        </label>
        <h3>
          Kernel (3×3) <small>Edit values</small>
        </h3>
        <div className="kernel-grid">
          {kernel.map((row, r) =>
            row.map((v, c) => (
              <input
                key={`${r}:${c}`}
                value={v}
                type="number"
                step=".1"
                onChange={(e) => edit(r, c, Number(e.target.value))}
              />
            )),
          )}
        </div>
        <label>
          Stride
          <select
            value={stride}
            onChange={(e) => setStride(Number(e.target.value))}
          >
            <option>1</option>
            <option>2</option>
          </select>
        </label>
        <label>
          Padding
          <select
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
          >
            <option>0</option>
            <option>1</option>
          </select>
        </label>
        <label>
          Activation
          <select>
            <option>ReLU</option>
          </select>
        </label>
        <label>
          Bias
          <input
            type="checkbox"
            checked={bias}
            onChange={(e) => setBias(e.target.checked)}
          />
        </label>
        <label>
          Batch Norm
          <input
            type="checkbox"
            checked={batchNorm}
            onChange={(e) => setBatchNorm(e.target.checked)}
          />
        </label>
        <section>
          <h3>Feature Map Visualization</h3>
          <select>
            <option>All Filters</option>
            <option>Selected Filter</option>
          </select>
          <input
            type="range"
            min="0"
            max="31"
            value={filter}
            onChange={(e) => setFilter(Number(e.target.value))}
          />
          <label>
            Receptive Field
            <input
              type="checkbox"
              checked={overlay}
              onChange={(e) => setOverlay(e.target.checked)}
            />
          </label>
          <label>
            Grid
            <input
              type="checkbox"
              checked={grid}
              onChange={(e) => setGrid(e.target.checked)}
            />
          </label>
        </section>
        <button onClick={() => setAdvanced(true)}>
          Open TensorFlow.js Training Lab
        </button>
      </aside>
      {toast && (
        <button className="cnn-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
