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
import "./MLPPage.css";
import { LabLessonOrWork, labHide, useLabTabs } from "../../../components/common/LabTabs";

type Point = { x: number; y: number; label: number };
type Dataset = "moons" | "circles" | "xor" | "spiral" | "imported";
const color = (probability: number) =>
  probability >= 0.5 ? "#ef4960" : "#4fe0df";
const rand = (i: number, salt: number) => {
  const v = Math.sin((i + 17) * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function makeData(kind: Exclude<Dataset, "imported">, count = 240): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const label = i < count / 2 ? 0 : 1,
      j = i % (count / 2),
      t = (j / (count / 2 - 1)) * Math.PI,
      noise = (rand(i, 2) - 0.5) * 0.2;
    if (kind === "moons")
      return label
        ? {
            x: 0.9 - Math.cos(t) + noise,
            y: -0.45 - Math.sin(t) + noise,
            label,
          }
        : { x: Math.cos(t) - 0.45 + noise, y: Math.sin(t) + noise, label };
    if (kind === "circles") {
      const radius = label ? 1.25 : 0.6,
        angle = (j / (count / 2)) * Math.PI * 2;
      return {
        x: radius * Math.cos(angle) + noise,
        y: radius * Math.sin(angle) + noise,
        label,
      };
    }
    const sx = j % 2 ? 1 : -1,
      sy = Math.floor(j / 2) % 2 ? 1 : -1;
    if (kind === "xor")
      return {
        x: sx + (rand(i, 3) - 0.5) * 1.2,
        y: sy + (rand(i, 4) - 0.5) * 1.2,
        label: sx === sy ? 1 : 0,
      };
    const r = 0.25 + (j / (count / 2)) * 1.25;
    const a = (j / (count / 2)) * Math.PI * 3 + label * Math.PI;
    return { x: Math.cos(a) * r + noise, y: Math.sin(a) * r + noise, label };
  });
}
const BUILT = {
  moons: makeData("moons"),
  circles: makeData("circles"),
  xor: makeData("xor"),
  spiral: makeData("spiral"),
};
const NAMES: Record<Dataset, string> = {
  moons: "Two Moons",
  circles: "Concentric Circles",
  xor: "XOR Quadrants",
  spiral: "Two Spirals",
  imported: "Imported CSV",
};
const arrays = (points: Point[]) => ({
  X: points.map((p) => [p.x, p.y]),
  y: points.map((p) => p.label),
});
const train = (
  points: Point[],
  hidden: number[],
  activation: MLPActivation,
  optimizer: MLPOptimizer,
  learningRate: number,
  batchSize: number,
  epochs: number,
  l2: number,
  useBias: boolean,
) => {
  const { X, y } = arrays(points);
  return trainMLP(X, y, {
    hidden,
    activation,
    optimizer,
    learningRate,
    batchSize,
    epochs,
    l2,
    useBias,
    seed: 29,
  });
};

function Network({
  result,
  hidden,
  selected,
  onSelect,
}: {
  result: MLPResult;
  hidden: number[];
  selected: [number, number];
  onSelect: (v: [number, number]) => void;
}) {
  const sizes = [2, ...hidden, 1],
    ys = (size: number, index: number) =>
      65 + index * (320 / Math.max(1, size - 1));
  return (
    <svg className="mlp-network" viewBox="0 0 770 420">
      {sizes.slice(0, -1).flatMap((size, layer) =>
        Array.from({ length: size }, (_, a) =>
          Array.from({ length: sizes[layer + 1] }, (_, b) => {
            const weight = result.weights[layer][a][b],
              stroke = weight >= 0 ? "#36a7ef" : "#b45ee8";
            return (
              <line
                key={`${layer}-${a}-${b}`}
                x1={75 + layer * (620 / (sizes.length - 1))}
                y1={ys(size, a)}
                x2={75 + (layer + 1) * (620 / (sizes.length - 1))}
                y2={ys(sizes[layer + 1], b)}
                stroke={stroke}
                strokeWidth={0.4 + Math.min(2.5, Math.abs(weight))}
                opacity={0.25 + Math.min(0.65, Math.abs(weight))}
              />
            );
          }),
        ),
      )}
      {sizes.flatMap((size, layer) =>
        Array.from({ length: size }, (_, index) => (
          <g
            key={`${layer}:${index}`}
            onClick={() =>
              layer > 0 &&
              layer < sizes.length - 1 &&
              onSelect([layer - 1, index])
            }
            className={
              selected[0] === layer - 1 && selected[1] === index
                ? "selected"
                : ""
            }
          >
            <circle
              cx={75 + layer * (620 / (sizes.length - 1))}
              cy={ys(size, index)}
              r={layer === 0 || layer === sizes.length - 1 ? 18 : 16}
            />
            <text
              x={75 + layer * (620 / (sizes.length - 1))}
              y={ys(size, index) + 4}
            >
              {layer === 0
                ? `x${index + 1}`
                : layer === sizes.length - 1
                  ? "ŷ"
                  : `h${layer}${index + 1}`}
            </text>
          </g>
        )),
      )}
      <text x="38" y="28">
        Input Layer · 2 features
      </text>
      {hidden.map((size, i) => (
        <text key={i} x={75 + (i + 1) * (620 / (sizes.length - 1))} y="28">
          Hidden {i + 1} · {size} neurons
        </text>
      ))}
      <text x="660" y="28">
        Output · 1 neuron
      </text>
    </svg>
  );
}
function Boundary({
  points,
  result,
  activation,
}: {
  points: Point[];
  result: MLPResult;
  activation: MLPActivation;
}) {
  const cells = [];
  for (let gy = 0; gy < 20; gy++)
    for (let gx = 0; gx < 24; gx++) {
      const x = -2.5 + (gx / 23) * 5,
        y = 1.8 - (gy / 19) * 3.6,
        p = forwardMLP(
          [x, y],
          result.weights,
          result.biases,
          activation,
        ).probability;
      cells.push(
        <rect
          key={`${gx}:${gy}`}
          x={gx * 20}
          y={gy * 17}
          width="21"
          height="18"
          fill={color(p)}
          opacity={0.08 + Math.abs(p - 0.5) * 0.55}
        />,
      );
    }
  return (
    <svg className="mlp-boundary" viewBox="0 0 480 340">
      {cells}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={((p.x + 2.5) / 5) * 480}
          cy={((1.8 - p.y) / 3.6) * 340}
          r="2.4"
          fill={p.label ? "#ef4960" : "#53e1e1"}
        />
      ))}
    </svg>
  );
}
function Curves({ result }: { result: MLPResult }) {
  const points = (values: number[]) =>
    values
      .map(
        (v, i) =>
          `${(i / (values.length - 1)) * 430},${12 + Math.min(155, Math.max(0, -Math.log10(Math.max(1e-4, v)) * 42))}`,
      )
      .join(" ");
  return (
    <svg className="mlp-curves" viewBox="0 0 460 190">
      <path d="M20 10V168H450" />
      {[0, 1, 2, 3, 4].map((n) => (
        <g key={n}>
          <line x1="20" x2="450" y1={12 + n * 38} y2={12 + n * 38} />
          <text x="9" y={16 + n * 38}>
            10⁻{n}
          </text>
        </g>
      ))}
      <polyline className="train" points={points(result.trainLoss)} />
      <polyline className="valid" points={points(result.validationLoss)} />
      <text x="350" y="22">
        Training Loss
      </text>
      <text x="350" y="39">
        Validation Loss
      </text>
    </svg>
  );
}

export default function MLPPage() {
  const { tab, setTab } = useLabTabs("Learn");
  const [dataset, setDataset] = useState<Dataset>("moons"),
    [points, setPoints] = useState<Point[]>(BUILT.moons),
    [imported, setImported] = useState<Point[]>([]),
    [hiddenLayers, setHiddenLayers] = useState(2),
    [neurons, setNeurons] = useState([8, 6]),
    [activation, setActivation] = useState<MLPActivation>("relu"),
    [optimizer, setOptimizer] = useState<MLPOptimizer>("adam"),
    [learningRate, setLearningRate] = useState(0.01),
    [batchSize, setBatchSize] = useState(32),
    [epochs, setEpochs] = useState(120),
    [l2, setL2] = useState(0.0001),
    [useBias, setUseBias] = useState(true),
    [selected, setSelected] = useState<[number, number]>([0, 0]),
    [running, setRunning] = useState(false),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    hidden = neurons.slice(0, hiddenLayers),
    [result, setResult] = useState<MLPResult>(() =>
      train(BUILT.moons, [8, 6], "relu", "adam", 0.01, 32, 16, 0.0001, true),
    );
  const predictions = result.probabilities.map((p) => (p >= 0.5 ? 1 : 0)),
    labels = points.map((p) => p.label);
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  predictions.forEach((p, i) => {
    if (p && labels[i]) tp++;
    else if (!p && !labels[i]) tn++;
    else if (p) fp++;
    else fn++;
  });
  const accuracy = (tp + tn) / points.length,
    precision = tp / Math.max(1, tp + fp),
    recall = tp / Math.max(1, tp + fn),
    f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall),
    loss = result.validationLoss.at(-1) ?? 0,
    sample = points[Math.min(17, points.length - 1)],
    pass = forwardMLP(
      [sample.x, sample.y],
      result.weights,
      result.biases,
      activation,
    ),
    pre = pass.preActivations[selected[0]]?.[selected[1]] ?? 0,
    act = pass.activations[selected[0] + 1]?.[selected[1]] ?? 0;
  const runTraining = () => {
    setRunning(true);
    window.setTimeout(() => {
      try {
        setResult(
          train(
            points,
            hidden,
            activation,
            optimizer,
            learningRate,
            batchSize,
            epochs,
            l2,
            useBias,
          ),
        );
        setToast("MLP training complete");
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Training failed");
      } finally {
        setRunning(false);
      }
    }, 40);
  };
  const choose = (kind: Dataset) => {
    const next = kind === "imported" ? imported : BUILT[kind];
    if (!next.length) return;
    setDataset(kind);
    setPoints(next);
    setResult(
      train(
        next,
        hidden,
        activation,
        optimizer,
        learningRate,
        batchSize,
        Math.min(epochs, 60),
        l2,
        useBias,
      ),
    );
    setToast(`${NAMES[kind]} loaded and fitted`);
  };
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rows = (await f.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((r) => r.split(",").map(Number))
      .filter((r) => r.length >= 3 && r.every(Number.isFinite));
    if (rows.length < 4) return setToast("CSV needs x1, x2, and label columns");
    const next = rows.map((r) => ({
      x: r[0],
      y: r[1],
      label: r[2] >= 0.5 ? 1 : 0,
    }));
    setImported(next);
    setDataset("imported");
    setPoints(next);
    setResult(
      train(
        next,
        hidden,
        activation,
        optimizer,
        learningRate,
        batchSize,
        Math.min(epochs, 80),
        l2,
        useBias,
      ),
    );
    setToast(`Imported and trained ${next.length} samples`);
    e.target.value = "";
  };
  const reset = () => {
    setHiddenLayers(2);
    setNeurons([8, 6]);
    setActivation("relu");
    setOptimizer("adam");
    setLearningRate(0.01);
    setBatchSize(32);
    setEpochs(120);
    setL2(0.0001);
    setUseBias(true);
    setResult(
      train(points, [8, 6], "relu", "adam", 0.01, 32, 120, 0.0001, true),
    );
    setToast("Model reset");
  };
  return (
    <div className="mlp-page">
      <aside className="mlp-side">
        <Link to="/">
          ⬡{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <button className="active">⌘ Multilayer Perceptron</button>
        {[
          "⌂ Home",
          "▱ Playground",
          "♧ Experiments",
          "◇ Models",
          "▤ Datasets",
          "□ Notebooks",
          "⌑ Snippets",
          "⚙ Settings",
        ].map((n) => (
          <button key={n} onClick={() => setToast(n)}>
            {n}
          </button>
        ))}
        <footer>
          <h4>Quick Actions</h4>
          <button onClick={() => setToast("New experiment")}>
            ⇧ New Experiment
          </button>
          <button onClick={() => setToast("Import model")}>
            ⇩ Import Model
          </button>
          <button onClick={() => fileRef.current?.click()}>
            ↥ Upload Dataset
          </button>
          <b>
            ◉ Alex Morgan<small>Pro Plan</small>
          </b>
        </footer>
      </aside>
      <header className="mlp-head">
        <h1>Multilayer Perceptron ⓘ</h1>
        <p>
          Explore how signals flow through a multilayer network and learn
          non-linear patterns.
        </p>
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
        <section className={labHide(tab, "Dataset").trim()}>
          <label>
            Dataset
            <select
              value={dataset}
              onChange={(e) => choose(e.target.value as Dataset)}
            >
              {Object.entries(NAMES)
                .filter(([k]) => k !== "imported" || imported.length)
                .map(([k, n]) => (
                  <option value={k} key={k}>
                    {n}
                  </option>
                ))}
            </select>
          </label>
          <button
            onClick={() =>
              choose(
                dataset === "moons"
                  ? "circles"
                  : dataset === "circles"
                    ? "xor"
                    : "moons",
              )
            }
          >
            ↻ Switch
          </button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload
          </button>
          <button onClick={() => setToast("More options")}>⋮</button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
      </header>
      <main>
        <LabLessonOrWork tab={tab} route="/ml/deep-learning/mlp">
        <section className={`mlp-diagram panel${labHide(tab, "Visualize", "Train")}`}>
          <h3>Network Diagram</h3>
          <small>→ Signal Flow</small>
          <Network
            result={result}
            hidden={hidden}
            selected={selected}
            onSelect={setSelected}
          />
          <footer>
            <button onClick={() => setToast("Signal animation toggled")}>
              <Play />
            </button>
            <label>
              Animate <input type="checkbox" defaultChecked />
            </label>
            <label>
              Flow Speed <input type="range" min="1" max="5" defaultValue="3" />
            </label>
            <button onClick={() => setSelected([0, 0])}>Reset View</button>
          </footer>
        </section>
        <section className={`mlp-activation panel${labHide(tab, "Visualize", "Train")}`}>
          <h3>Activation Inspector ⓘ</h3>
          <label>
            Select a neuron
            <select
              value={`${selected[0]}:${selected[1]}`}
              onChange={(e) =>
                setSelected(
                  e.target.value.split(":").map(Number) as [number, number],
                )
              }
            >
              {hidden.flatMap((size, l) =>
                Array.from({ length: size }, (_, i) => (
                  <option key={`${l}:${i}`} value={`${l}:${i}`}>
                    Hidden {l + 1} → h{i + 1}
                  </option>
                )),
              )}
            </select>
          </label>
          <h4>Activation ({activation})</h4>
          <svg viewBox="0 0 300 165">
            <path d="M20 145H290M150 10V150" />
            {activation === "relu" ? (
              <polyline points="20,145 150,145 290,15" />
            ) : activation === "tanh" ? (
              <path className="curve" d="M20 142 C105 142 110 18 290 18" />
            ) : (
              <path className="curve" d="M20 138 C105 138 195 20 290 20" />
            )}
          </svg>
          <p>
            Pre-activation (z) <b>{pre.toFixed(3)}</b>
          </p>
          <p>
            Activation f(z) <b>{act.toFixed(3)}</b>
          </p>
          <code>
            {activation === "relu"
              ? "f(z) = max(0, z)"
              : activation === "tanh"
                ? "f(z) = tanh(z)"
                : "f(z) = 1 / (1 + e⁻ᶻ)"}
          </code>
        </section>
        <section className={`mlp-boundary-card panel${labHide(tab, "Visualize", "Train")}`}>
          <h3>Decision Boundary ⓘ</h3>
          <Boundary points={points} result={result} activation={activation} />
          <footer>
            <i /> Class 0 <i /> Class 1 ─ Decision Boundary
          </footer>
        </section>
        <section className={`mlp-curves-card panel${labHide(tab, "Metrics", "Train")}`}>
          <h3>Training Curves ⓘ</h3>
          <select>
            <option>Loss</option>
          </select>
          <Curves result={result} />
          <footer>Epoch</footer>
        </section>
        <section className={`mlp-performance panel${labHide(tab, "Metrics")}`}>
          <h3>Performance ⓘ</h3>
          {[
            ["Accuracy", accuracy],
            ["Loss (Test)", loss],
            ["Precision", precision],
            ["Recall", recall],
            ["F1 Score", f1],
          ].map(([n, v]) => (
            <p key={String(n)}>
              {n}
              <b>
                {n === "Loss (Test)"
                  ? Number(v).toFixed(4)
                  : `${(Number(v) * 100).toFixed(1)}%`}
              </b>
            </p>
          ))}
          <h4>Confusion Matrix</h4>
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
        </section>
        </LabLessonOrWork>
      </main>
      <aside className={`mlp-inspector panel${labHide(tab, "Train", "Transform", "Visualize")}`}>
        <h2>⌘ Model Inspector</h2>
        <h3>Architecture</h3>
        <label>
          Hidden Layers{" "}
          <span>
            <button
              onClick={() => setHiddenLayers(Math.max(1, hiddenLayers - 1))}
            >
              −
            </button>
            <b>{hiddenLayers}</b>
            <button
              onClick={() => setHiddenLayers(Math.min(2, hiddenLayers + 1))}
            >
              ＋
            </button>
          </span>
        </label>
        <label>
          Neurons per Layer{" "}
          <span>
            <input
              type="number"
              min="2"
              max="12"
              value={neurons[0]}
              onChange={(e) => setNeurons([Number(e.target.value), neurons[1]])}
            />
            <input
              type="number"
              min="2"
              max="12"
              value={neurons[1]}
              disabled={hiddenLayers < 2}
              onChange={(e) => setNeurons([neurons[0], Number(e.target.value)])}
            />
          </span>
        </label>
        <label>
          Activation (Hidden)
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
          Activation (Output)
          <select>
            <option>Sigmoid</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={useBias}
            onChange={(e) => setUseBias(e.target.checked)}
          />{" "}
          Use Bias
        </label>
        <h3>Training Settings</h3>
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
            min=".0001"
            max=".2"
            step=".001"
            value={learningRate}
            onChange={(e) => setLearningRate(Number(e.target.value))}
          />
        </label>
        <label>
          Batch Size
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
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
        <label>
          L2 Regularization
          <input
            type="number"
            min="0"
            max=".1"
            step=".0001"
            value={l2}
            onChange={(e) => setL2(Number(e.target.value))}
          />
        </label>
        <button className="train" disabled={running} onClick={runTraining}>
          <Play /> {running ? "Training..." : "Train Model"}
        </button>
        <button onClick={reset}>↻ Reset Model</button>
      </aside>
      <footer className="mlp-foot">
        <b>● Model Trained</b> · Best Val Loss:{" "}
        {Math.min(...result.validationLoss).toFixed(4)} · Epoch:{" "}
        {result.trainLoss.length}/{result.trainLoss.length} · Dataset:{" "}
        {NAMES[dataset]} ({points.length} samples) · Model: MLP (2-
        {hidden.join("-")}-1)
      </footer>
      {toast && (
        <button className="mlp-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
