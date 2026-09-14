import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Moon, Share2, Upload } from "lucide-react";
import {
  tsne,
  type TSNEInitialization,
  type TSNEMetric,
} from "../../../lib/algorithms/dimensionality/tsne";
import "./TSNEPage.css";
type Sample = { values: number[]; label: number };
type Dataset = "digits" | "fashion" | "iris" | "swiss" | "imported";
const COLORS = [
  "#13d6d3",
  "#ff9d00",
  "#964ee8",
  "#cc42ee",
  "#ec3f70",
  "#2f70ef",
];
const rand = (i: number, s: number) => {
  const v = Math.sin((i + 9) * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function makeData(kind: Exclude<Dataset, "imported">, n = 180): Sample[] {
  const classes = kind === "iris" ? 3 : 6;
  return Array.from({ length: n }, (_, i) => {
    const label = i % classes,
      angle = (label / classes) * Math.PI * 2,
      spread = kind === "swiss" ? 1.4 : 0.9;
    return {
      label,
      values: Array.from(
        { length: kind === "iris" ? 4 : 8 },
        (_, d) =>
          Math.cos(angle + d * 0.7) * 2 + (rand(i, d + 1) - 0.5) * spread,
      ),
    };
  });
}
const BUILT = {
    digits: makeData("digits"),
    fashion: makeData("fashion"),
    iris: makeData("iris", 150),
    swiss: makeData("swiss"),
  },
  NAMES: Record<Dataset, string> = {
    digits: "Digit Embeddings",
    fashion: "Fashion Embeddings",
    iris: "Iris",
    swiss: "Swiss Roll Features",
    imported: "Imported Data",
  };
export default function TSNEPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("digits"),
    [samples, setSamples] = useState<Sample[]>(BUILT.digits),
    [imported, setImported] = useState<Sample[]>([]),
    [perplexity, setPerplexity] = useState(30),
    [learningRate, setLearningRate] = useState(200),
    [exaggeration, setExaggeration] = useState(12),
    [iterations, setIterations] = useState(300),
    [metric, setMetric] = useState<TSNEMetric>("euclidean"),
    [initialization, setInitialization] = useState<TSNEInitialization>("pca"),
    [frame, setFrame] = useState(12),
    [playing, setPlaying] = useState(false),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => samples.map((s) => s.values), [samples]);
  const result = useMemo(
    () =>
      tsne(
        X,
        Math.min(perplexity, samples.length - 1),
        learningRate,
        exaggeration,
        iterations,
        metric,
        initialization,
        42,
      ),
    [
      X,
      perplexity,
      learningRate,
      exaggeration,
      iterations,
      metric,
      initialization,
      samples.length,
    ],
  );
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setFrame((value) =>
          value >= result.snapshots.length - 1 ? 0 : value + 1,
        ),
      350,
    );
    return () => window.clearInterval(timer);
  }, [playing, result.snapshots.length]);
  const embedding =
      result.snapshots[Math.min(frame, result.snapshots.length - 1)] ||
      result.embedding,
    magnitudes = embedding
      .flat()
      .map(Math.abs)
      .sort((a, b) => a - b),
    max = magnitudes[Math.floor(magnitudes.length * 0.9)] || 1,
    plot = (value: number) =>
      Math.max(4, Math.min(96, 50 + (value / max) * 42)),
    choose = (kind: Dataset) => {
      const next = kind === "imported" ? imported : BUILT[kind];
      if (!next.length) return;
      setDataset(kind);
      setSamples(next);
      setToast(`${NAMES[kind]} loaded`);
    };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.split(",").map(Number))
      .filter((row) => row.length >= 3 && row.every(Number.isFinite))
      .map((row) => ({ values: row.slice(0, -1), label: row.at(-1) || 0 }));
    if (rows.length < 3)
      return setToast("File needs features plus a final label column");
    setImported(rows);
    setDataset("imported");
    setSamples(rows);
    setPerplexity(Math.min(30, rows.length - 1));
    setToast(`Imported ${rows.length} samples`);
    event.target.value = "";
  };
  const reset = () => {
    setPerplexity(30);
    setLearningRate(200);
    setExaggeration(12);
    setIterations(300);
    setMetric("euclidean");
    setInitialization("pca");
    setPlaying(false);
  };
  const numericControls = [
    {
      name: "Perplexity",
      value: perplexity,
      min: 5,
      max: 100,
      set: setPerplexity,
    },
    {
      name: "Learning Rate (η)",
      value: learningRate,
      min: 10,
      max: 1000,
      set: setLearningRate,
    },
    {
      name: "Early Exaggeration",
      value: exaggeration,
      min: 4,
      max: 50,
      set: setExaggeration,
    },
    {
      name: "Iterations",
      value: iterations,
      min: 100,
      max: 1000,
      set: setIterations,
    },
  ];
  return (
    <div className="ts-page">
      <aside className="ts-side">
        <Link to="/">
          〽{" "}
          <b>
            Mega ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        {[
          "▣ Overview",
          "DATA",
          "▤ Datasets",
          "▤ Experiments",
          "MODELS",
          "▧ Model Lab",
          "✣ Training Center",
          "◇ Model Registry",
          "OBSERVABILITY",
          "▥ Metrics",
          "◎ Drift Monitor",
          "▤ Model Logs",
          "LEARN",
          "▣ Concepts",
          "◇ Playgrounds",
          "◉ Guides",
        ].map((name) =>
          name === name.toUpperCase() ? (
            <h4 key={name}>{name}</h4>
          ) : (
            <button
              className={name.includes("Concepts") ? "active" : ""}
              onClick={() => setToast(name)}
              key={name}
            >
              {name}
            </button>
          ),
        )}
        <footer>
          ⚙ Workspace <em>Pro</em>
        </footer>
      </aside>
      <header className="ts-head">
        <h1>t-SNE</h1>
        <p>
          Visualize high-dimensional data by preserving local neighborhoods in
          2D. <a>How t-SNE works →</a>
        </p>
        <div>
          <button onClick={() => setToast("Theme changed")}>
            <Moon /> Dark⌄
          </button>
          <button onClick={() => setToast("Help opened")}>
            <HelpCircle /> Help
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button>⋮</button>
        </div>
      </header>
      <main>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((name) => (
            <button
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        <section className="ts-work">
          <header>
            <h2>Interactive t-SNE Visualization ⓘ</h2>
            <button className="primary" onClick={() => setPlaying(!playing)}>
              {playing ? "Ⅱ Pause" : "▶ Animate"}
            </button>
            <button
              onClick={() => {
                reset();
                setFrame(result.snapshots.length - 1);
              }}
            >
              ↶ Reset View
            </button>
          </header>
          <div className="ts-flow">
            <article>
              <h3>
                <i>1</i> High-Dimensional Space
              </h3>
              <p>Original space (P)</p>
              <div className="ts-cube">
                {samples.map((sample, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${15 + ((sample.values[0] + 3) / 6) * 70}%`,
                      top: `${15 + ((sample.values[1] + 3) / 6) * 70}%`,
                      background: COLORS[sample.label % COLORS.length],
                    }}
                  />
                ))}
              </div>
              <small>
                Each point connects to its nearest neighbors{" "}
                <b>(perplexity-based)</b>
              </small>
            </article>
            <div className="ts-machine">t-SNE</div>
            <article>
              <h3>
                <i>2</i> Mapping in Progress
              </h3>
              <p>
                Optimization minimizes <b>KL</b> divergence
              </p>
              <div className="ts-map">
                {embedding.map((point, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${plot(point[0])}%`,
                      top: `${plot(-point[1])}%`,
                      background: COLORS[samples[i].label % COLORS.length],
                    }}
                  />
                ))}
              </div>
            </article>
          </div>
          <footer>
            <div>
              <span>Initialize ✓</span>
              <span>Compute Neighbors ✓</span>
              <b>③ Optimize Layout</b>
              <span>④ Converged</span>
            </div>
            <p>
              Minimizing KL divergence...{" "}
              <i
                style={{
                  width: `${(frame / Math.max(1, result.snapshots.length - 1)) * 100}%`,
                }}
              />
              <strong>
                {Math.round(
                  (frame / Math.max(1, result.snapshots.length - 1)) * 100,
                )}
                %
              </strong>
            </p>
          </footer>
        </section>
        <section className="ts-bottom">
          <article>
            <h3>Dataset ⓘ</h3>
            <select
              value={dataset}
              onChange={(e) => choose(e.target.value as Dataset)}
            >
              {Object.entries(NAMES)
                .filter(([key]) => key !== "imported" || imported.length)
                .map(([key, name]) => (
                  <option value={key} key={key}>
                    {name}
                  </option>
                ))}
            </select>
            <p>{samples.length} samples</p>
            <p>{samples[0].values.length} dimensions</p>
            <button onClick={() => setToast("Dataset switched")}>
              Switch Dataset
            </button>
          </article>
          <article>
            <h3>Upload Custom Data ⓘ</h3>
            <button onClick={() => fileRef.current?.click()}>
              <Upload /> Browse Files
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
            <small>Supports .csv</small>
          </article>
          <article>
            <h3>Legend</h3>
            {Array.from(new Set(samples.map((s) => s.label)))
              .slice(0, 10)
              .map((label) => (
                <span key={label}>
                  <i style={{ background: COLORS[label % COLORS.length] }} />{" "}
                  {label}
                </span>
              ))}
          </article>
          <article>
            <h3>Projection Quality ⓘ</h3>
            <p>
              KL Divergence (↓)
              <b>{(result.klHistory.at(-1) || 0).toFixed(3)}</b>
            </p>
            <p>
              Trustworthiness (↑)<b>{result.trustworthiness.toFixed(3)}</b>
            </p>
            <p>
              Continuity (↑)<b>{result.continuity.toFixed(3)}</b>
            </p>
          </article>
        </section>
      </main>
      <aside className="ts-controls">
        <h2>
          Parameters <button onClick={reset}>↶</button>
        </h2>
        {numericControls.map((control) => (
          <label key={control.name}>
            {control.name} ⓘ{" "}
            <input
              aria-label={`${control.name} numeric`}
              type="number"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={(e) => control.set(Number(e.target.value))}
            />
            <input
              aria-label={control.name}
              type="range"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={(e) => control.set(Number(e.target.value))}
            />
          </label>
        ))}
        <label>
          Distance Metric
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as TSNEMetric)}
          >
            <option value="euclidean">Euclidean</option>
            <option value="manhattan">Manhattan</option>
          </select>
        </label>
        <label>
          Initialization
          <select
            value={initialization}
            onChange={(e) =>
              setInitialization(e.target.value as TSNEInitialization)
            }
          >
            <option value="pca">PCA</option>
            <option value="random">Random</option>
          </select>
        </label>
        <button className="advanced">Advanced⌄</button>
        <section>
          <h3>
            KL Divergence ⓘ <b>{(result.klHistory.at(-1) || 0).toFixed(3)}</b>
          </h3>
          <svg viewBox="0 0 300 140">
            <polyline
              points={result.klHistory
                .filter(
                  (_, i) =>
                    i %
                      Math.max(1, Math.floor(result.klHistory.length / 40)) ===
                    0,
                )
                .map(
                  (value, i, arr) =>
                    `${(i / (arr.length - 1)) * 290 + 5},${130 - Math.min(1, value / Math.max(...result.klHistory, 1)) * 115}`,
                )
                .join(" ")}
            />
          </svg>
          <p>Iteration (log scale)</p>
        </section>
      </aside>
      {toast && (
        <button className="ts-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
