import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Moon, Share2, Upload } from "lucide-react";
import {
  tsne,
  type TSNEInitialization,
  type TSNEMetric,
} from "../../../lib/algorithms/dimensionality/tsne";
import { getDimensionalityDataset } from "../../../lib/dimensionality/dimensionalityDatasets";
import { MAX_EMBEDDING_SAMPLES, subsampleIndices } from "../../../lib/dimensionality/dimensionalityPrep";
import {
  LAB_TABS,
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
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
const iris = getDimensionalityDataset("d-iris");
const swiss = getDimensionalityDataset("f-swiss-roll");
const digits = getDimensionalityDataset("e-digit-glyphs");
const blobs = getDimensionalityDataset("c-hd-blobs");
const BUILT = {
    digits: digits.X.map((values, i) => ({ values, label: digits.y?.[i] ?? 0 })),
    fashion: blobs.X.map((values, i) => ({ values, label: blobs.y?.[i] ?? 0 })),
    iris: iris.X.map((values, i) => ({ values, label: iris.y?.[i] ?? 0 })),
    swiss: swiss.X.map((values, i) => ({ values, label: swiss.y?.[i] ?? 0 })),
  },
  NAMES: Record<Dataset, string> = {
    digits: "Digit glyphs (8×8)",
    fashion: "High-D blobs",
    iris: "Iris",
    swiss: "Swiss roll",
    imported: "Imported Data",
  };
export default function TSNEPage() {
  const { tab, setTab, panel, lesson } = useLabTabs("Visualize");
  const [dataset, setDataset] = useState<Dataset>("digits"),
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
    [toast, setToast] = useState(""),
    [status, setStatus] = useState<"NOT RUN" | "RUNNING" | "COMPLETED" | "STALE" | "ERROR">("NOT RUN"),
    [tsneResult, setTsneResult] = useState<ReturnType<typeof tsne> | null>(null),
    [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const used = useMemo(() => {
      const indices = subsampleIndices(samples.length, MAX_EMBEDDING_SAMPLES);
      return {
        X: indices.map((i) => samples[i].values),
        labels: indices.map((i) => samples[i].label),
        sampled: indices.length !== samples.length,
        n: indices.length,
      };
    }, [samples]);
  const runTsne = () => {
    abortRef.current = false;
    setStatus("RUNNING");
    setError(null);
    setPlaying(false);
    try {
      if (perplexity >= used.n) {
        throw new Error(`t-SNE perplexity must be less than N=${used.n}.`);
      }
      const computed = tsne(
        used.X,
        perplexity,
        learningRate,
        exaggeration,
        iterations,
        metric,
        initialization,
        42,
        () => abortRef.current,
      );
      if (abortRef.current) {
        setStatus("NOT RUN");
        setTsneResult(null);
        return;
      }
      setTsneResult(computed);
      setStatus("COMPLETED");
      setFrame(computed.snapshots.length - 1);
    } catch (cause) {
      setTsneResult(null);
      setStatus("ERROR");
      setError(cause instanceof Error ? cause.message : "t-SNE failed");
    }
  };
  useEffect(() => () => {
    abortRef.current = true;
    setPlaying(false);
  }, []);
  useEffect(() => {
    setStatus((current) => (current === "NOT RUN" || current === "ERROR" ? current : "STALE"));
    setPlaying(false);
  }, [used, perplexity, learningRate, exaggeration, iterations, metric, initialization]);
  const result = tsneResult ?? {
    embedding: [] as number[][],
    snapshots: [] as number[][][],
    klHistory: [] as number[],
    trustworthiness: 0,
    continuity: 0,
    incomplete: false,
    iterationsCompleted: 0,
  };
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
      Math.max(4, Math.min(96, 50 + (value / max) * 42));
  const highD = useMemo(() => {
    const xs = samples.map((sample) => sample.values[0] ?? 0);
    const ys = samples.map((sample) => sample.values[1] ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    return samples.map((sample, index) => ({
      key: index,
      left: 8 + ((sample.values[0] - minX) / spanX) * 84,
      top: 8 + ((sample.values[1] - minY) / spanY) * 84,
      color: COLORS[sample.label % COLORS.length],
    }));
  }, [samples]);
  useEffect(() => {
    runTsne();
    // First open should already show a projection. Later runs stay on the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (kind: Dataset) => {
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
    abortRef.current = true;
    setPerplexity(30);
    setLearningRate(200);
    setExaggeration(12);
    setIterations(300);
    setMetric("euclidean");
    setInitialization("pca");
    setPlaying(false);
    setTsneResult(null);
    setStatus("NOT RUN");
    setFrame(0);
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
        <nav role="tablist" aria-label="t-SNE sections">
          {LAB_TABS.map((name) => (
            <button
              role="tab"
              aria-selected={tab === name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
              key={name}
            >
              {name}
            </button>
          ))}
        </nav>
        {lesson && (
          <LabLessonPanel tab={tab} route="/ml/dimensionality-reduction/tsne" />
        )}
        <section className={`ts-work${panel("Visualize", "Build / Train")}`}>
          <header>
            <h2>Interactive t-SNE Visualization ⓘ</h2>
            {error && <p>{error}</p>}
            <p>State: {status}. Seed=42. Color is labels only — labels are not used in the t-SNE fit. Axes TSNE1/TSNE2 have no original-feature meaning.</p>
            {(result.incomplete || result.iterationsCompleted < 250) && result.iterationsCompleted > 0 && (
              <p>Optimization incomplete.</p>
            )}
            {used.sampled && (
              <p>
                Computation used {used.n} of {samples.length} samples (browser cap {MAX_EMBEDDING_SAMPLES}).
              </p>
            )}
            <p>
              t-SNE emphasizes local neighborhoods. Cluster sizes and global spacing can be misleading. Same seed + settings are repeatable here (seed=42). New points cannot be transformed with this implementation.
            </p>
            <button className="primary" onClick={runTsne} disabled={status === "RUNNING"}>
              {status === "RUNNING" ? "Running…" : "Run t-SNE"}
            </button>
            <button
              onClick={() => {
                abortRef.current = true;
                setPlaying(false);
                setStatus("NOT RUN");
                setTsneResult(null);
              }}
            >
              Cancel
            </button>
            <button className="primary" onClick={() => setPlaying(!playing)} disabled={!result.snapshots.length}>
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
                {highD.map((point) => (
                  <i
                    key={point.key}
                    style={{
                      left: `${point.left}%`,
                      top: `${point.top}%`,
                      background: point.color,
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
                      background: COLORS[used.labels[i] % COLORS.length],
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
        <section className={`ts-bottom${panel("Dataset", "Metrics")}`}>
          <article className={panel("Dataset").trim()}>
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
          <article className={panel("Dataset").trim()}>
            <h3>Upload Custom Data ⓘ</h3>
            <button onClick={() => fileRef.current?.click()}>
              <Upload /> Browse Files
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
            <small>Supports .csv</small>
          </article>
          <article className={panel("Dataset").trim()}>
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
          <article className={panel("Metrics").trim()}>
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
      <aside className={`ts-controls${panel("Visualize", "Build / Train", "Metrics")}`}>
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
