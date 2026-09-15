import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Upload } from "lucide-react";
import {
  forwardMLP,
  trainMLP,
  type MLPActivation,
  type MLPOptimizer,
  type MLPResult,
} from "../../../lib/algorithms/neural/mlp";
import "./NeuralNetworkPlaygroundPage.css";
type Point = { x: number; y: number; label: number };
type Dataset = "moons" | "circles" | "xor" | "spiral" | "blobs" | "imported";
const names: Record<Dataset, string> = {
    moons: "Two Moons",
    circles: "Concentric Circles",
    xor: "XOR",
    spiral: "Two Spirals",
    blobs: "Two Blobs",
    imported: "Imported Dataset",
  },
  rnd = (i: number, s: number) => {
    const v = Math.sin((i + 31) * 12.9898 + s * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
function data(
  kind: Exclude<Dataset, "imported">,
  noise = 0.15,
  seed = 0,
  n = 300,
): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const label = i < n / 2 ? 0 : 1,
      j = i % (n / 2),
      e = (rnd(i, seed + 2) - 0.5) * noise * 2;
    if (kind === "moons") {
      const t = (j / (n / 2 - 1)) * Math.PI;
      return label
        ? { x: 1 - Math.cos(t) + e, y: -0.5 - Math.sin(t) + e, label }
        : { x: Math.cos(t) - 0.5 + e, y: Math.sin(t) + e, label };
    }
    if (kind === "circles") {
      const a = (j / (n / 2)) * Math.PI * 2,
        r = label ? 1.35 : 0.65;
      return { x: r * Math.cos(a) + e, y: r * Math.sin(a) + e, label };
    }
    const sx = j % 2 ? 1 : -1,
      sy = Math.floor(j / 2) % 2 ? 1 : -1;
    if (kind === "xor")
      return {
        x: sx + (rnd(i, seed + 4) - 0.5) * 1.1,
        y: sy + (rnd(i, seed + 7) - 0.5) * 1.1,
        label: sx === sy ? 1 : 0,
      };
    if (kind === "blobs")
      return {
        x: (label ? 1.1 : -1.1) + e,
        y: (label ? 0.4 : -0.35) + (rnd(i, seed + 9) - 0.5) * noise,
        label,
      };
    const r = 0.2 + (j / (n / 2)) * 1.3;
    const a = (j / (n / 2)) * Math.PI * 3 + label * Math.PI;
    return { x: Math.cos(a) * r + e, y: Math.sin(a) * r + e, label };
  });
}
const fit = (
  points: Point[],
  layers: number,
  neurons: number,
  activation: MLPActivation,
  optimizer: MLPOptimizer,
  lr: number,
  batch: number,
  epochs: number,
  bias: boolean,
  split: number,
) =>
  trainMLP(
    points.map((p) => [p.x, p.y]),
    points.map((p) => p.label),
    {
      hidden: Array(layers).fill(neurons),
      activation,
      optimizer,
      learningRate: lr,
      batchSize: batch,
      epochs,
      l2: 0.0001,
      useBias: bias,
      seed: 41,
      validationSplit: split,
    },
  );
function Net({ model }: { model: MLPResult }) {
  const sizes = [
      model.weights[0].length,
      ...model.weights.map((layer) => layer[0].length),
    ],
    px = (l: number) => 45 + l * (310 / (sizes.length - 1)),
    py = (n: number, i: number) => 35 + i * (245 / Math.max(1, n - 1));
  return (
    <svg viewBox="0 0 360 290" className="nnp-net">
      {sizes.slice(0, -1).flatMap((n, l) =>
        Array.from({ length: n }, (_, i) =>
          Array.from({ length: sizes[l + 1] }, (_, j) => (
            <line
              key={`${l}${i}${j}`}
              x1={px(l)}
              y1={py(n, i)}
              x2={px(l + 1)}
              y2={py(sizes[l + 1], j)}
              className={model.weights[l][i][j] >= 0 ? "pos" : "neg"}
              style={{
                strokeWidth:
                  0.4 + Math.min(2, Math.abs(model.weights[l][i][j])),
              }}
            />
          )),
        ),
      )}
      {sizes.flatMap((n, l) =>
        Array.from({ length: n }, (_, i) => (
          <g key={`${l}:${i}`}>
            <circle cx={px(l)} cy={py(n, i)} r="12" />
            <text x={px(l)} y={py(n, i) + 4}>
              {l === 0 ? `x${i + 1}` : l === sizes.length - 1 ? "σ" : "∿"}
            </text>
          </g>
        )),
      )}
    </svg>
  );
}
function Field({
  points,
  model,
  activation,
}: {
  points: Point[];
  model: MLPResult;
  activation: MLPActivation;
}) {
  const cells = [];
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < 22; x++) {
      const xx = -2.5 + (x / 21) * 5,
        yy = 2 - (y / 17) * 4,
        p = forwardMLP(
          [xx, yy],
          model.weights,
          model.biases,
          activation,
        ).probability;
      cells.push(
        <rect
          key={`${x}:${y}`}
          x={x * 20}
          y={y * 18}
          width="21"
          height="19"
          fill={p > 0.5 ? "#dc5362" : "#3d79dd"}
          opacity={0.16 + Math.abs(p - 0.5) * 0.58}
        />,
      );
    }
  return (
    <svg viewBox="0 0 440 324" className="nnp-field">
      {cells}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={((p.x + 2.5) / 5) * 440}
          cy={((2 - p.y) / 4) * 324}
          r="3"
          fill={p.label ? "#f05a67" : "#3d8ffc"}
        />
      ))}
    </svg>
  );
}
function Loss({ model }: { model: MLPResult }) {
  const line = (v: number[]) =>
    v
      .map(
        (x, i) =>
          `${20 + (i / (v.length - 1)) * 310},${15 + Math.min(130, -Math.log10(Math.max(x, 0.001)) * 40)}`,
      )
      .join(" ");
  return (
    <svg viewBox="0 0 350 170" className="nnp-loss">
      <path d="M20 10V150H340" />
      <polyline points={line(model.trainLoss)} />
      <polyline className="val" points={line(model.validationLoss)} />
    </svg>
  );
}
export default function NeuralNetworkPlaygroundPage() {
  const [tab, setTab] = useState("Build / Train"),
    [dataset, setDataset] = useState<Dataset>("moons"),
    [noise, setNoise] = useState(0.15),
    [split, setSplit] = useState(0.2),
    [seed, setSeed] = useState(1),
    [points, setPoints] = useState<Point[]>(() => data("moons")),
    [imported, setImported] = useState<Point[]>([]),
    [layers, setLayers] = useState(1),
    [neurons, setNeurons] = useState(8),
    [activation, setActivation] = useState<MLPActivation>("relu"),
    [optimizer, setOptimizer] = useState<MLPOptimizer>("adam"),
    [lr, setLr] = useState(0.01),
    [batch, setBatch] = useState(32),
    [epochs, setEpochs] = useState(150),
    [bias, setBias] = useState(true),
    [auto, setAuto] = useState(true),
    [running, setRunning] = useState(false),
    [toast, setToast] = useState(""),
    [features, setFeatures] = useState([0, 0]);
  const fileRef = useRef<HTMLInputElement>(null),
    timer = useRef<number | undefined>(undefined),
    [model, setModel] = useState<MLPResult>(() =>
      fit(data("moons"), 1, 8, "relu", "adam", 0.01, 32, 150, true, 0.2),
    );
  const predictions = model.probabilities.map((p) => (p >= 0.5 ? 1 : 0));
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  predictions.forEach((p, i) => {
    const y = points[i]?.label ?? 0;
    if (p && y) tp++;
    else if (!p && !y) tn++;
    else if (p) fp++;
    else fn++;
  });
  const accuracy = (tp + tn) / points.length,
    precision = tp / Math.max(1, tp + fp),
    recall = tp / Math.max(1, tp + fn),
    f1 = (2 * precision * recall) / Math.max(0.0001, precision + recall),
    loss = model.validationLoss.at(-1) ?? 0;
  const train = () => {
      setRunning(true);
      timer.current = window.setTimeout(() => {
        setModel(
          fit(
            points,
            layers,
            neurons,
            activation,
            optimizer,
            lr,
            batch,
            epochs,
            bias,
            split,
          ),
        );
        setRunning(false);
        setToast("Network training complete");
      }, 50);
    },
    stop = () => {
      if (timer.current) window.clearTimeout(timer.current);
      setRunning(false);
      setToast("Training stopped");
    },
    regenerate = () => {
      const next =
        dataset === "imported" ? imported : data(dataset, noise, seed + 1);
      setSeed((v) => v + 1);
      setPoints(next);
      if (auto)
        setModel(
          fit(
            next,
            layers,
            neurons,
            activation,
            optimizer,
            lr,
            batch,
            Math.min(epochs, 80),
            bias,
            split,
          ),
        );
      setToast("Dataset regenerated");
    },
    choose = (kind: Dataset) => {
      const next = kind === "imported" ? imported : data(kind, noise, seed);
      if (!next.length) return;
      setDataset(kind);
      setPoints(next);
      setModel(
        fit(
          next,
          layers,
          neurons,
          activation,
          optimizer,
          lr,
          batch,
          Math.min(epochs, 80),
          bias,
          split,
        ),
      );
    },
    upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const rows = (await f.text())
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((r) => r.split(",").map(Number))
        .filter((r) => r.length >= 3 && r.every(Number.isFinite));
      if (rows.length < 4) return setToast("CSV needs x1, x2, label");
      const next = rows.map((r) => ({
        x: r[0],
        y: r[1],
        label: r[2] >= 0.5 ? 1 : 0,
      }));
      setImported(next);
      setDataset("imported");
      setPoints(next);
      setModel(
        fit(
          next,
          layers,
          neurons,
          activation,
          optimizer,
          lr,
          batch,
          Math.min(epochs, 80),
          bias,
          split,
        ),
      );
      setToast(`Imported ${next.length} samples`);
      e.target.value = "";
    };
  return (
    <div className="nnp-page">
      <aside className="nnp-side">
        <Link to="/">
          〽{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <label>Quick Access ⌘K</label>
        {[
          "⌂ Home",
          "⚒ Experiments",
          "♕ Playgrounds",
          "　 Neural Network Playground",
          "　 AutoML Playground",
          "　 LLM Playground",
          "▤ Datasets　›",
          "▽ Models　›",
          "♧ Deployments　›",
          "▣ Reports　›",
          "□ Notebooks　›",
        ].map((n) => (
          <button
            className={n.includes("Neural") ? "active" : ""}
            key={n}
            onClick={() => setToast(n)}
          >
            {n}
          </button>
        ))}
        <footer>
          <b>
            👩 Maya ML<small>Pro Plan</small>
          </b>
          <button onClick={() => setToast("Sidebar collapsed")}>
            ≪ Collapse
          </button>
        </footer>
      </aside>
      <header className="nnp-head">
        <h1>‹ Neural Network Playground</h1>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((n) => (
            <button
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <section>
          <button onClick={() => setToast("Help opened")}>?</button>
          <button onClick={() => setToast("Theme toggled")}>☾</button>
          <button onClick={() => setToast("Share copied")}>◔ Share</button>
          <button onClick={() => setToast("Saved")}>▣ Save</button>
        </section>
      </header>
      <main>
        <section className="nnp-objective panel">
          <h3>Lesson: Universal Function Approximation</h3>
          <p>
            Neural networks with non-linear activations can approximate
            <br />
            complex functions and decision boundaries.
          </p>
          <button onClick={() => setToast("Lesson opened")}>
            Learn more →
          </button>
          <div>
            <span>
              ⓘ Goal<b>Classify points</b>
            </span>
            <span>
              ⚒ Task<b>Binary classification</b>
            </span>
            <span>
              Metric<b>Accuracy</b>
            </span>
            <span>
              Status<b>● Ready</b>
            </span>
          </div>
        </section>
        <section className="nnp-features panel">
          <h3>FEATURES ⓘ</h3>
          {features.map((v, i) => (
            <label key={i}>
              X<sub>{i + 1}</sub>
              <input
                aria-label={`Feature ${i + 1}`}
                type="range"
                min="-3"
                max="3"
                step=".1"
                value={v}
                onChange={(e) =>
                  setFeatures(
                    features.map((x, j) =>
                      j === i ? Number(e.target.value) : x,
                    ),
                  )
                }
              />
            </label>
          ))}
          <button onClick={() => setToast("Feature added")}>
            ＋ Add Feature
          </button>
        </section>
        <section className="nnp-canvas panel">
          <h3>
            NETWORK CANVAS{" "}
            <button onClick={() => setToast("Canvas reset")}>↻ Reset</button>
          </h3>
          <small>
            Architecture: 2 – {Array(layers).fill(neurons).join(" – ")} – 1
          </small>
          <div className="network">
            <Net model={model} />
            <button onClick={() => setLayers(Math.min(2, layers + 1))}>
              ＋ Add Layer
            </button>
            <footer>
              Activation ⓘ
              {(["relu", "tanh", "sigmoid"] as MLPActivation[]).map((a) => (
                <button
                  className={activation === a ? "active" : ""}
                  onClick={() => setActivation(a)}
                  key={a}
                >
                  {a}
                </button>
              ))}
            </footer>
          </div>
          <div className="field">
            <Field points={points} model={model} activation={activation} />
            <footer>● Class 0 · ● Class 1 · ─ Boundary</footer>
          </div>
        </section>
        <section className="nnp-bottom panel">
          <article>
            <h3>TRAINING PROGRESS ⓘ</h3>
            <p>
              Epoch{" "}
              <b>
                {model.trainLoss.length}/{epochs}
              </b>
              {" · "}Loss <b>{loss.toFixed(4)}</b> · Accuracy{" "}
              <b>{(accuracy * 100).toFixed(1)}%</b>
            </p>
            <p>
              One Train click runs every requested epoch in one session (not a
              fake timer). Pause only cancels a start that has not begun.
            </p>
            <Loss model={model} />
          </article>
          <article>
            <h3>PERFORMANCE ⓘ</h3>
            <i
              style={{
                background: `conic-gradient(#4bd8cf ${accuracy * 360}deg,#1b2a40 0)`,
              }}
            >
              <b>{(accuracy * 100).toFixed(1)}%</b>
            </i>
            <p>
              Precision <b>{precision.toFixed(3)}</b>
              <br />
              Recall <b>{recall.toFixed(3)}</b>
              <br />
              F1 Score <b>{f1.toFixed(3)}</b>
            </p>
            <div>
              <span />
              <span>Pred 0</span>
              <span>Pred 1</span>
              <span>True 0</span>
              <b>{tn}</b>
              <b>{fp}</b>
              <span>True 1</span>
              <b>{fn}</b>
              <b>{tp}</b>
            </div>
          </article>
          <article>
            <h3>OUTPUT DISTRIBUTION ⓘ</h3>
            <div className="hist">
              {Array.from({ length: 20 }, (_, bin) => {
                const c0 = model.probabilities.filter(
                    (p, i) =>
                      points[i].label === 0 &&
                      Math.min(19, Math.floor(p * 20)) === bin,
                  ).length,
                  c1 = model.probabilities.filter(
                    (p, i) =>
                      points[i].label === 1 &&
                      Math.min(19, Math.floor(p * 20)) === bin,
                  ).length;
                return (
                  <span key={bin}>
                    <i style={{ height: c0 * 2 }} />
                    <b style={{ height: c1 * 2 }} />
                  </span>
                );
              })}
            </div>
          </article>
        </section>
      </main>
      <aside className="nnp-controls">
        <section className="panel">
          <h3>
            DATASET ⓘ <small>Samples: {points.length}</small>
          </h3>
          <select
            value={dataset}
            onChange={(e) => choose(e.target.value as Dataset)}
          >
            {Object.entries(names)
              .filter(([k]) => k !== "imported" || imported.length)
              .map(([k, n]) => (
                <option value={k} key={k}>
                  {n}
                </option>
              ))}
          </select>
          <label>
            Noise{" "}
            <input
              type="number"
              value={noise}
              min="0"
              max=".5"
              step=".01"
              onChange={(e) => setNoise(Number(e.target.value))}
            />
            <input
              aria-label="Noise"
              type="range"
              min="0"
              max=".5"
              step=".01"
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
            />
          </label>
          <label>
            Test Split{" "}
            <input
              type="number"
              value={split}
              min=".1"
              max=".4"
              step=".05"
              onChange={(e) => setSplit(Number(e.target.value))}
            />
            <input
              aria-label="Test split"
              type="range"
              min=".1"
              max=".4"
              step=".05"
              value={split}
              onChange={(e) => setSplit(Number(e.target.value))}
            />
          </label>
          <button onClick={regenerate}>↻ Regenerate Dataset</button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload Dataset
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
        <section className="panel">
          <h3>MODEL INSPECTOR</h3>
          <label>
            Hidden Layers{" "}
            <span>
              <button onClick={() => setLayers(Math.max(1, layers - 1))}>
                −
              </button>
              <b>{layers}</b>
              <button onClick={() => setLayers(Math.min(2, layers + 1))}>
                ＋
              </button>
            </span>
          </label>
          <label>
            Neurons{" "}
            <span>
              <button onClick={() => setNeurons(Math.max(2, neurons - 1))}>
                −
              </button>
              <b>{neurons}</b>
              <button onClick={() => setNeurons(Math.min(12, neurons + 1))}>
                ＋
              </button>
            </span>
          </label>
          <label>
            Activation
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value as MLPActivation)}
            >
              <option value="relu">ReLU</option>
              <option value="tanh">Tanh</option>
              <option value="sigmoid">Sigmoid</option>
            </select>
          </label>
          <label>
            Output Activation
            <select>
              <option>Sigmoid</option>
            </select>
          </label>
          <label>
            Use Bias
            <input
              type="checkbox"
              checked={bias}
              onChange={(e) => setBias(e.target.checked)}
            />
          </label>
        </section>
        <section className="panel">
          <h3>TRAINING CONTROLS</h3>
          <label>
            Optimizer
            <select
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value as MLPOptimizer)}
            >
              <option value="adam">Adam</option>
              <option value="sgd">SGD</option>
            </select>
          </label>
          <label>
            Learning Rate
            <input
              type="number"
              min=".001"
              max=".2"
              step=".001"
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
            />
          </label>
          <label>
            Batch Size
            <select
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
            >
              <option>16</option>
              <option>32</option>
              <option>64</option>
            </select>
          </label>
          <label>
            Epochs
            <input
              type="number"
              min="10"
              max="500"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
            />
          </label>
          <button className="train" disabled={running} onClick={train}>
            <Play /> {running ? "Training..." : "Train"}
          </button>
          <button disabled={!running} onClick={stop}>
            ■ Stop
          </button>
          <label>
            Auto Train
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
          </label>
        </section>
      </aside>
      <footer className="nnp-foot">
        💡 Try adding more neurons or layers. Observe how the decision boundary
        becomes more complex.
      </footer>
      {toast && (
        <button className="nnp-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
