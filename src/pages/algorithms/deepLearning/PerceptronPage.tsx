import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Moon, Play, RotateCcw, Upload } from "lucide-react";
import {
  predictPerceptron,
  trainPerceptron,
  type ActivationFn,
  type PerceptronStep,
} from "../../../lib/algorithms/neural/perceptron";
import "./PerceptronPage.css";

type Point = { x: number; y: number; label: number };
type DatasetKey = "linear" | "overlap" | "diagonal" | "imported";
type TrainingRun = { steps: PerceptronStep[] };

const random = (index: number, salt: number) => {
  const value = Math.sin((index + 31) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function makeDataset(kind: Exclude<DatasetKey, "imported">): Point[] {
  return Array.from({ length: 120 }, (_, index) => {
    const sourceLabel = index < 60 ? 0 : 1;
    const spread = kind === "overlap" ? 1.25 : 0.82;
    const center =
      kind === "diagonal" ? (sourceLabel ? 1.15 : -1.15) : sourceLabel ? 1 : -1;
    const x = center + (random(index, 1) - 0.5) * spread * 2;
    const y =
      (kind === "diagonal" ? center : sourceLabel ? 0.85 : -0.85) +
      (random(index, 2) - 0.5) * spread * 2;
    const label =
      kind === "linear" && index % 20 === 0 ? 1 - sourceLabel : sourceLabel;
    return { x, y, label };
  });
}

const BUILT_IN = {
  linear: makeDataset("linear"),
  overlap: makeDataset("overlap"),
  diagonal: makeDataset("diagonal"),
};
const DATASET_NAMES: Record<DatasetKey, string> = {
  linear: "Linearly Separable (2D)",
  overlap: "Overlapping Classes (2D)",
  diagonal: "Diagonal Margin (2D)",
  imported: "Imported CSV",
};

const fit = (
  points: Point[],
  learningRate: number,
  maxEpochs: number,
  activation: ActivationFn,
  weights: number[],
  bias: number,
  threshold: number,
): TrainingRun => ({
  steps: trainPerceptron(
    points.map((point) => [point.x, point.y]),
    points.map((point) => point.label),
    learningRate,
    maxEpochs,
    activation,
    { initialWeights: weights, initialBias: bias, threshold },
  ).steps,
});

function Plot({
  points,
  weights,
  bias,
  threshold,
}: {
  points: Point[];
  weights: number[];
  bias: number;
  threshold: number;
}) {
  const mapX = (value: number) => 44 + ((value + 3) / 6) * 442;
  const mapY = (value: number) => 330 - ((value + 3) / 6) * 300;
  const boundary = (x: number) =>
    Math.abs(weights[1]) < 1e-8
      ? 0
      : (threshold - bias - weights[0] * x) / weights[1];
  return (
    <svg
      className="pc-plot"
      viewBox="0 0 520 365"
      role="img"
      aria-label="Decision boundary plot"
    >
      <defs>
        <linearGradient id="pc-upper" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1b624c" stopOpacity=".48" />
          <stop offset="1" stopColor="#183a45" stopOpacity=".12" />
        </linearGradient>
        <linearGradient id="pc-lower" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#32245d" stopOpacity=".2" />
          <stop offset="1" stopColor="#32245d" stopOpacity=".58" />
        </linearGradient>
      </defs>
      <rect x="44" y="30" width="442" height="300" fill="url(#pc-upper)" />
      <path
        d={`M44 ${mapY(boundary(-3))} L486 ${mapY(boundary(3))} L486 330 L44 330 Z`}
        fill="url(#pc-lower)"
      />
      {[-2, -1, 0, 1, 2].map((tick) => (
        <g key={tick}>
          <line x1={mapX(tick)} x2={mapX(tick)} y1="30" y2="330" />
          <line x1="44" x2="486" y1={mapY(tick)} y2={mapY(tick)} />
          <text x={mapX(tick)} y="350">
            {tick}
          </text>
          <text x="23" y={mapY(tick) + 4}>
            {tick}
          </text>
        </g>
      ))}
      <line className="axis" x1="44" x2="486" y1={mapY(0)} y2={mapY(0)} />
      <line className="axis" x1={mapX(0)} x2={mapX(0)} y1="30" y2="330" />
      <line
        className="boundary"
        x1={mapX(-3)}
        y1={mapY(boundary(-3))}
        x2={mapX(3)}
        y2={mapY(boundary(3))}
      />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={mapX(point.x)}
          cy={mapY(point.y)}
          r="5"
          className={point.label ? "one" : "zero"}
        />
      ))}
      <text className="axis-label" x="260" y="363">
        x₁
      </text>
      <text className="axis-label" x="7" y="24">
        x₂
      </text>
    </svg>
  );
}

function MiniPlot({ points }: { points: Point[] }) {
  return (
    <svg className="pc-mini-plot" viewBox="0 0 280 112">
      {points.map((point, index) => (
        <circle
          key={index}
          cx={140 + point.x * 34}
          cy={56 - point.y * 28}
          r="2.5"
          className={point.label ? "one" : "zero"}
        />
      ))}
      <line x1="78" y1="10" x2="190" y2="105" />
    </svg>
  );
}

export default function PerceptronPage() {
  const [tab, setTab] = useState("Visualize");
  const [dataset, setDataset] = useState<DatasetKey>("linear");
  const [points, setPoints] = useState<Point[]>(BUILT_IN.linear);
  const [imported, setImported] = useState<Point[]>([]);
  const [manualWeights, setManualWeights] = useState([1.2, -0.8]);
  const [manualBias, setManualBias] = useState(1);
  const [threshold, setThreshold] = useState(0);
  const [learningRate, setLearningRate] = useState(0.1);
  const [maxEpochs, setMaxEpochs] = useState(25);
  const [activation, setActivation] = useState<ActivationFn>("step");
  const [run, setRun] = useState<TrainingRun | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!playing || !run) return;
    const timer = window.setInterval(() => {
      setStepIndex((current) => {
        if (current >= run.steps.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 430);
    return () => window.clearInterval(timer);
  }, [playing, run]);

  const active = run?.steps[Math.min(stepIndex, run.steps.length - 1)];
  const weights = active?.weights ?? manualWeights;
  const bias = active?.bias ?? manualBias;
  const predictions = points.map((point) =>
    predictPerceptron([point.x, point.y], weights, bias, threshold),
  );
  const confusion = useMemo(() => {
    let tp = 0,
      tn = 0,
      fp = 0,
      fn = 0;
    predictions.forEach((prediction, index) => {
      const actual = points[index].label;
      if (prediction === 1 && actual === 1) tp++;
      else if (prediction === 0 && actual === 0) tn++;
      else if (prediction === 1) fp++;
      else fn++;
    });
    const accuracy = (tp + tn) / points.length;
    const precision = tp / Math.max(1, tp + fp);
    const recall = tp / Math.max(1, tp + fn);
    return {
      tp,
      tn,
      fp,
      fn,
      accuracy,
      precision,
      recall,
      f1: (2 * precision * recall) / Math.max(1e-9, precision + recall),
    };
  }, [points, predictions]);
  const sample = points[Math.min(stepIndex * 5, points.length - 1)];
  const net = sample.x * weights[0] + sample.y * weights[1] + bias;
  const totalSteps = Math.max(1, run?.steps.length ?? maxEpochs);
  const recent =
    run?.steps.slice(Math.max(0, stepIndex - 2), stepIndex + 1) ?? [];

  const clearRun = () => {
    setRun(null);
    setStepIndex(0);
    setPlaying(false);
  };
  const setWeight = (index: number, value: number) => {
    setManualWeights((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
    clearRun();
  };
  const train = () => {
    const next = fit(
      points,
      learningRate,
      maxEpochs,
      activation,
      manualWeights,
      manualBias,
      threshold,
    );
    setRun(next);
    setStepIndex(animate ? 0 : next.steps.length - 1);
    setPlaying(animate && next.steps.length > 1);
    setToast(
      `Training prepared ${next.steps.length} epoch${next.steps.length === 1 ? "" : "s"}`,
    );
  };
  const reset = () => {
    setManualWeights([1.2, -0.8]);
    setManualBias(1);
    setThreshold(0);
    setLearningRate(0.1);
    setMaxEpochs(25);
    setActivation("step");
    clearRun();
    setToast("Parameters reset");
  };
  const chooseDataset = (kind: DatasetKey) => {
    const next = kind === "imported" ? imported : BUILT_IN[kind];
    if (!next.length) return;
    setDataset(kind);
    setPoints(next);
    clearRun();
    setToast(`${DATASET_NAMES[kind]} loaded`);
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.split(",").map(Number))
      .filter((row) => row.length >= 3 && row.every(Number.isFinite));
    if (rows.length < 2) {
      setToast("CSV needs x1, x2, and label columns");
      return;
    }
    const next = rows.map((row) => ({
      x: row[0],
      y: row[1],
      label: row[2] >= 0.5 ? 1 : 0,
    }));
    setImported(next);
    setDataset("imported");
    setPoints(next);
    clearRun();
    setToast(`Imported ${next.length} samples`);
    event.target.value = "";
  };

  return (
    <div className="pc-page">
      <aside className="pc-side">
        <Link to="/">
          ◆{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        {[
          "⌂ Home",
          "♧ Perceptron",
          "⌘ Algorithms",
          "▣ Datasets",
          "♙ Experiments",
          "⌬ Models",
          "◉ Observatory",
        ].map((item) => (
          <button
            key={item}
            className={item.includes("Perceptron") ? "active" : ""}
            onClick={() => setToast(item)}
          >
            {item}
          </button>
        ))}
        <button className="settings" onClick={() => setToast("Settings")}>
          ⚙ Settings
        </button>
      </aside>
      <header className="pc-head">
        <div>
          <small>Supervised Learning</small>
          <h1>
            Perceptron <em>Beginner</em>
          </h1>
          <p>
            Linear binary classifier. Adjust weights and threshold to separate
            the classes.
          </p>
        </div>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <section>
          <button onClick={() => setToast("Help opened")}>?</button>
          <button onClick={() => setToast("Theme toggled")}>
            <Moon />
          </button>
          <button onClick={() => setToast("Export ready")}>
            <Download /> Export
          </button>
        </section>
      </header>
      <main>
        <section className="pc-model panel">
          <h3>PERCEPTRON MODEL ⓘ</h3>
          <label>
            Activation:{" "}
            <select
              value={activation}
              onChange={(event) => {
                setActivation(event.target.value as ActivationFn);
                clearRun();
              }}
            >
              <option value="step">Step (Hard Limit)</option>
              <option value="sigmoid">Sigmoid (Rounded)</option>
              <option value="tanh">Tanh (Rounded)</option>
            </select>
          </label>
          <div className="pc-model-flow">
            <div className="inputs">
              <p>
                <i>x₁</i>
                <b>{sample.x.toFixed(2)}</b>
                <span />
              </p>
              <p>
                <i>x₂</i>
                <b>{sample.y.toFixed(2)}</b>
                <span />
              </p>
              <p>
                <i>b</i>
                <b>{bias.toFixed(2)}</b>
                <span />
              </p>
            </div>
            <svg viewBox="0 0 570 280">
              <line className="w1" x1="95" y1="42" x2="300" y2="130" />
              <line className="w2" x1="95" y1="140" x2="300" y2="140" />
              <line className="wb" x1="95" y1="238" x2="300" y2="150" />
              <circle cx="330" cy="140" r="30" />
              <text x="320" y="150">
                Σ
              </text>
              <line x1="360" y1="140" x2="430" y2="140" />
              <circle cx="460" cy="140" r="28" />
              <path d="M447 150h15v-22h14" />
              <line x1="488" y1="140" x2="535" y2="140" />
              <text x="159" y="35">
                w₁ {weights[0].toFixed(2)}
              </text>
              <text x="159" y="130">
                w₂ {weights[1].toFixed(2)}
              </text>
              <text x="155" y="220">
                b (bias) {bias.toFixed(2)}
              </text>
              <text className="net" x="300" y="195">
                z = w·x + b = {net.toFixed(2)}
              </text>
              <text x="435" y="205">
                Threshold (θ)
              </text>
              <text className="output" x="545" y="150">
                ŷ {net >= threshold ? 1 : 0}
              </text>
            </svg>
            <p className="formula">ŷ = 1 if (w·x + b) ≥ θ, else 0</p>
          </div>
        </section>
        <section className="pc-decision panel">
          <h3>DECISION BOUNDARY ⓘ</h3>
          <div className="legend">
            <i /> Class 0 <i /> Class 1 <i /> Boundary
          </div>
          <Plot
            points={points}
            weights={weights}
            bias={bias}
            threshold={threshold}
          />
          <footer>
            <button onClick={() => setPlaying((value) => !value)}>
              {playing ? "Ⅱ" : <Play />}
            </button>
            <input
              aria-label="Training step"
              type="range"
              min="0"
              max={totalSteps - 1}
              value={Math.min(stepIndex, totalSteps - 1)}
              onChange={(event) => {
                setStepIndex(Number(event.target.value));
                setPlaying(false);
              }}
            />
            <span>
              Step {Math.min(stepIndex + 1, totalSteps)} / {totalSteps}
            </span>
            <label>
              <input
                type="checkbox"
                checked={animate}
                onChange={(event) => setAnimate(event.target.checked)}
              />{" "}
              Animate Training
            </label>
          </footer>
        </section>
        <aside className="pc-controls panel">
          <nav>
            <button className="active">Parameters</button>
            <button onClick={() => setToast("Dataset controls below")}>
              Dataset
            </button>
          </nav>
          <section>
            <h3>WEIGHTS ⓘ</h3>
            {[
              ["w₁", manualWeights[0]],
              ["w₂", manualWeights[1]],
            ].map(([name, value], index) => (
              <label key={String(name)}>
                {name}
                <input
                  type="number"
                  min="-5"
                  max="5"
                  step=".1"
                  value={value}
                  onChange={(event) =>
                    setWeight(index, Number(event.target.value))
                  }
                />
                <input
                  aria-label={`Weight ${index + 1}`}
                  type="range"
                  min="-5"
                  max="5"
                  step=".1"
                  value={value}
                  onChange={(event) =>
                    setWeight(index, Number(event.target.value))
                  }
                />
              </label>
            ))}
            <label>
              Bias (b)
              <input
                type="number"
                min="-5"
                max="5"
                step=".1"
                value={manualBias}
                onChange={(event) => {
                  setManualBias(Number(event.target.value));
                  clearRun();
                }}
              />
              <input
                aria-label="Bias"
                type="range"
                min="-5"
                max="5"
                step=".1"
                value={manualBias}
                onChange={(event) => {
                  setManualBias(Number(event.target.value));
                  clearRun();
                }}
              />
            </label>
          </section>
          <section>
            <h3>THRESHOLD (θ) ⓘ</h3>
            <label>
              <input
                type="number"
                min="-5"
                max="5"
                step=".1"
                value={threshold}
                onChange={(event) => {
                  setThreshold(Number(event.target.value));
                  clearRun();
                }}
              />
              <input
                aria-label="Threshold"
                type="range"
                min="-5"
                max="5"
                step=".1"
                value={threshold}
                onChange={(event) => {
                  setThreshold(Number(event.target.value));
                  clearRun();
                }}
              />
            </label>
          </section>
          <section>
            <h3>LEARNING SETTINGS ⓘ</h3>
            <label>
              Learning Rate (η)
              <input
                type="number"
                min=".001"
                max="1"
                step=".01"
                value={learningRate}
                onChange={(event) =>
                  setLearningRate(Number(event.target.value))
                }
              />
              <input
                aria-label="Learning rate"
                type="range"
                min=".001"
                max="1"
                step=".001"
                value={learningRate}
                onChange={(event) =>
                  setLearningRate(Number(event.target.value))
                }
              />
            </label>
            <label>
              Update Rule
              <select>
                <option>Perceptron (Online)</option>
              </select>
            </label>
            <label>
              Max Epochs
              <input
                type="number"
                min="1"
                max="100"
                value={maxEpochs}
                onChange={(event) => setMaxEpochs(Number(event.target.value))}
              />
            </label>
          </section>
          <footer>
            <b>TRAINING CONTROLS</b>
            <button onClick={reset}>
              <RotateCcw /> Reset
            </button>
            <button className="train" onClick={train}>
              <Play /> Train
            </button>
          </footer>
        </aside>
        <section className="pc-dataset panel">
          <h3>DATASET PREVIEW ⓘ</h3>
          <select
            value={dataset}
            onChange={(event) =>
              chooseDataset(event.target.value as DatasetKey)
            }
          >
            {Object.entries(DATASET_NAMES)
              .filter(([key]) => key !== "imported" || imported.length)
              .map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
          </select>
          <span>{points.length} samples</span>
          <MiniPlot points={points} />
          <button
            onClick={() =>
              chooseDataset(
                dataset === "linear"
                  ? "overlap"
                  : dataset === "overlap"
                    ? "diagonal"
                    : "linear",
              )
            }
          >
            Switch Dataset
          </button>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
        </section>
        <section className="pc-progress panel">
          <h3>TRAINING PROGRESS ⓘ</h3>
          <div className="progress-stats">
            <p>
              Epoch{" "}
              <b>
                {active ? active.epoch + 1 : 0} / {totalSteps}
              </b>
            </p>
            <p>
              Misclassifications{" "}
              <b>
                {
                  predictions.filter(
                    (value, index) => value !== points[index].label,
                  ).length
                }{" "}
                ({((1 - confusion.accuracy) * 100).toFixed(1)}%)
              </b>
            </p>
            <p>
              Converged <b>{active?.errors === 0 ? "Yes" : "No"}</b>
            </p>
          </div>
          <i className="bar">
            <span
              style={{
                width: `${run ? ((stepIndex + 1) / totalSteps) * 100 : 0}%`,
              }}
            />
          </i>
          <h4>WEIGHT UPDATES (Latest) ⓘ</h4>
          {recent.length ? (
            recent.map((item) => (
              <p key={item.epoch}>
                Epoch {item.epoch + 1}
                <span>
                  Errors: <b>{item.errors}</b>
                </span>
                <em>
                  w = [
                  {item.weights.map((value) => value.toFixed(2)).join(", ")}]
                </em>
              </p>
            ))
          ) : (
            <p>Train the model to inspect genuine epoch updates.</p>
          )}
        </section>
        <section className="pc-metrics panel">
          <h3>METRICS ⓘ</h3>
          <div className="metric-cards">
            {[
              ["Accuracy", confusion.accuracy],
              ["Precision (Class 1)", confusion.precision],
              ["Recall (Class 1)", confusion.recall],
              ["F1 Score (Class 1)", confusion.f1],
            ].map(([name, value]) => (
              <p key={String(name)}>
                {name}
                <b>{(Number(value) * 100).toFixed(1)}%</b>
              </p>
            ))}
          </div>
          <h4>CONFUSION MATRIX ⓘ</h4>
          <div className="matrix">
            <span />
            <span>Predicted 0</span>
            <span>Predicted 1</span>
            <span>Actual 0</span>
            <b>{confusion.tn}</b>
            <b>{confusion.fp}</b>
            <span>Actual 1</span>
            <b>{confusion.fn}</b>
            <b>{confusion.tp}</b>
          </div>
        </section>
        <section className="pc-summary panel">
          <h3>MODEL SUMMARY ⓘ</h3>
          <p>w = [ {weights.map((value) => value.toFixed(2)).join(", ")} ]</p>
          <p>b = {bias.toFixed(2)}</p>
          <p>θ = {threshold.toFixed(2)}</p>
          <p>
            Activation:{" "}
            {activation === "step" ? "Step (Hard Limit)" : activation}
          </p>
          <button onClick={() => setToast("Explanation opened")}>
            ▤ View Explanation
          </button>
        </section>
      </main>
      <footer className="pc-foot">
        ⓘ Tip: Adjust weights or use Train to find a boundary that separates the
        classes.<b>● Ready</b>
      </footer>
      {toast && (
        <button className="pc-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
