import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import { Pause, Play, RotateCcw, Upload } from "lucide-react";
import {
  crossValidate,
  type CVMetric,
  type CVRow,
} from "../../../lib/evaluation/crossValidation";
import "./CrossValidationPage.css";

const makeData = (count: number, classes: number, seed: number): CVRow[] =>
  Array.from({ length: count }, (_, i) => {
    const label = i % classes;
    return {
      label,
      features: [
        label * 1.45 + Math.sin(i * 1.7 + seed) * 1.05,
        label * 1.15 + Math.cos(i * 1.13 + seed) * 1.08,
        label * 0.72 + Math.sin(i * 0.41) * 0.72,
        label * 0.42 + Math.cos(i * 0.77) * 0.5,
      ],
    };
  });
const datasets = [
  {
    name: "Iris Dataset",
    samples: 150,
    features: 4,
    classes: 3,
    rows: makeData(150, 3, 3),
  },
  {
    name: "Wine Classes",
    samples: 178,
    features: 4,
    classes: 3,
    rows: makeData(178, 3, 17),
  },
  {
    name: "Breast Cancer",
    samples: 569,
    features: 4,
    classes: 2,
    rows: makeData(569, 2, 31),
  },
];

export default function CrossValidationPage() {
  const [dataset, setDataset] = useState(0),
    [customRows, setCustomRows] = useState<CVRow[] | null>(null),
    [folds, setFolds] = useState(5),
    [stratify, setStratify] = useState(true),
    [shuffle, setShuffle] = useState(true),
    [seed, setSeed] = useState(42),
    [metric, setMetric] = useState<CVMetric>("accuracy"),
    [current, setCurrent] = useState(0),
    [playing, setPlaying] = useState(false),
    [tab, setTab] = useState("Visualize"),
    [message, setMessage] = useState("Rotation ready");
  const go = useLabNavigate();
  const inputRef = useRef<HTMLInputElement>(null),
    timerRef = useRef<number | null>(null),
    meta = datasets[dataset],
    rows = customRows ?? meta.rows;
  const result = useMemo(
    () => crossValidate(rows, folds, stratify, shuffle, seed, metric),
    [rows, folds, stratify, shuffle, seed, metric],
  );
  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    },
    [],
  );
  const toggle = () => {
    if (playing) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setPlaying(false);
      setMessage("Animation paused");
    } else {
      setPlaying(true);
      setMessage("Animating fold rotation");
      timerRef.current = window.setInterval(
        () => setCurrent((v) => (v + 1) % folds),
        700,
      );
    }
  };
  const reset = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setCurrent(0);
    setPlaying(false);
    setFolds(5);
    setStratify(true);
    setShuffle(true);
    setSeed(42);
    setMetric("accuracy");
    setMessage("Animation reset");
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/);
    const parsed = lines
      .slice(1)
      .map((line) => {
        const cells = line.split(",");
        return {
          features: cells.slice(0, -1).map(Number),
          label: Number(cells.at(-1)),
        };
      })
      .filter(
        (row) =>
          row.features.length &&
          row.features.every(Number.isFinite) &&
          Number.isFinite(row.label),
      );
    if (parsed.length) {
      setCustomRows(parsed);
      setCurrent(0);
      setMessage(`${file.name} · ${parsed.length} samples`);
    }
  };
  return (
    <div className="cv-page">
      <aside className="cv-side">
        <Link to="/">
          ◎ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <section>
          <h3>⌘ AI ALGORITHMS ⌄</h3>
          {[
            "♙ Overview",
            "⌁ Supervised Learning",
            "◎ Unsupervised Learning",
            "⌘ Deep Learning",
            "⌁ Time Series",
            "♧ Reinforcement Learning",
          ].map((x) => (
            <button onClick={() => go(x)} key={x}>
              {x}
            </button>
          ))}
        </section>
        <section>
          <h3>▦ WORKSPACES ⌄</h3>
          {[
            "♧ My Workspace",
            "⌁ Projects",
            "▣ Experiments",
            "⌘ Models",
            "▤ Datasets",
          ].map((x) => (
            <button onClick={() => go(x)} key={x}>
              {x}
            </button>
          ))}
        </section>
        <section>
          <h3>▣ LEARN ⌄</h3>
          <button onClick={() => go("Tutorials")}>
            Tutorials
          </button>
          <button onClick={() => go("Guides")}>Guides</button>
          <button onClick={() => go("Playground")}>
            Playground
          </button>
        </section>
        <button
          className="settings"
          onClick={() => setMessage("Settings opened")}
        >
          ⚙ Settings
        </button>
        <button onClick={() => go("Help")}>? Help & Docs</button>
        <footer>
          Ⓜ <b>Mega ML</b> <span>Pro</span>
        </footer>
      </aside>
      <header className="cv-head">
        <p>
          Algorithms › Evaluation › <b>Cross Validation</b>
        </p>
        <div className="cv-icon">▣</div>
        <h1>Cross Validation</h1>
        <small>
          Evaluate model performance by training on K-1 folds and validating on
          the remaining fold.
        </small>
        <div>
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(Number(e.target.value));
              setCustomRows(null);
              setMessage("Dataset loaded");
            }}
          >
            {datasets.map((x, i) => (
              <option value={i} key={x.name}>
                {x.name}
              </option>
            ))}
          </select>
          <button onClick={() => inputRef.current?.click()}>
            <Upload /> Upload
          </button>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".csv,.json"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Transform",
            "Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => {
                setTab(x);
                setMessage(`${x} selected`);
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <section className="cv-matrix panel">
          <h2>K-Fold Cross Validation (K = {folds}) ⓘ</h2>
          <div className="cv-play">
            <button onClick={toggle}>{playing ? <Pause /> : <Play />}</button>
            <b>{playing ? "Animating" : "Paused"}</b>
            <small>● Rotation</small>
          </div>
          <div
            className="fold-grid"
            style={{ "--folds": folds } as CSSProperties}
          >
            <header>
              <span>Folds</span>
              {result.folds.map((f) => (
                <b key={f.fold}>{f.fold}</b>
              ))}
              <strong>
                Validation Score
                <br />({metric})
              </strong>
            </header>
            {result.folds.map((fold, row) => (
              <section
                className={row === current ? "current" : ""}
                key={fold.fold}
              >
                <b>Iteration {fold.fold}</b>
                {result.folds.map((_, column) => (
                  <i
                    className={column === row ? "validation" : ""}
                    key={column}
                  >
                    {column === row ? "Validation" : "Train"}
                  </i>
                ))}
                <strong>{fold.score.toFixed(4)}</strong>
              </section>
            ))}
          </div>
          <footer>
            <span>■ Validation Fold · ■ Training Folds</span>
            <div>
              <p>
                Mean Score <b>{result.mean.toFixed(4)}</b>
              </p>
              <p>
                Variance <b>{result.variance.toFixed(4)}</b>
              </p>
              <p>
                Std. Deviation <b>{result.standardDeviation.toFixed(4)}</b>
              </p>
            </div>
          </footer>
        </section>
        <section className="cv-insights panel">
          <h2>Insights</h2>
          <p>
            ◎ <b>Stable Performance</b>
            <small>
              Low variance ({result.variance.toFixed(4)}) indicates consistent
              performance across folds.
            </small>
          </p>
          <p>
            ⌁ <b>Stratified Sampling</b>
            <small>
              Class distribution is {stratify ? "preserved" : "not constrained"}{" "}
              in each fold.
            </small>
          </p>
          <p>
            ▣ <b>Model Generalization</b>
            <small>
              Mean {metric} of {result.mean.toFixed(4)} reflects held-out
              performance.
            </small>
          </p>
        </section>
        <section className="cv-score panel">
          <h2>Score Distribution ⓘ</h2>
          <div>
            {result.folds.map((f) => (
              <i
                style={{
                  left: `${Math.max(2, Math.min(96, (f.score - 0.5) * 190))}%`,
                }}
                key={f.fold}
              />
            ))}
          </div>
          <footer>0.50 · 0.60 · 0.70 · 0.80 · 0.90 · 1.00</footer>
        </section>
        <section className="cv-bars panel">
          <h2>Per-Fold Scores ⓘ</h2>
          {result.folds.map((f) => (
            <p key={f.fold}>
              Fold {f.fold}
              <i>
                <b style={{ width: `${f.score * 100}%` }} />
              </i>
              <strong>{f.score.toFixed(4)}</strong>
            </p>
          ))}
        </section>
      </main>
      <aside className="cv-controls panel">
        <h2>Cross Validation Controls</h2>
        <label>
          K (Folds)
          <div>
            <button
              onClick={() => {
                setFolds(Math.max(2, folds - 1));
                setCurrent(0);
              }}
            >
              −
            </button>
            <b>{folds}</b>
            <button
              onClick={() => {
                setFolds(Math.min(10, folds + 1));
                setCurrent(0);
              }}
            >
              ＋
            </button>
          </div>
        </label>
        <label>
          Stratification{" "}
          <input
            aria-label="Stratification"
            type="checkbox"
            checked={stratify}
            onChange={(e) => setStratify(e.target.checked)}
          />
          <small>Preserve class distribution in each fold</small>
        </label>
        <label>
          Shuffle{" "}
          <input
            aria-label="Shuffle"
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
          />
          <small>Shuffle data before splitting</small>
        </label>
        <label>
          Random Seed{" "}
          <input
            aria-label="Random Seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
          />
        </label>
        <label>
          Scoring Metric
          <select
            aria-label="Scoring Metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value as CVMetric)}
          >
            <option value="accuracy">Accuracy</option>
            <option value="precision">Precision</option>
            <option value="recall">Recall</option>
            <option value="f1">F1 Score</option>
          </select>
        </label>
        <button onClick={reset}>
          <RotateCcw /> Reset Animation
        </button>
        <p>{message}</p>
      </aside>
      <footer className="cv-status">
        <span>
          ⌁ Model <b>Nearest Centroid Classifier</b>
        </span>
        <span>
          Hyperparameters{" "}
          <b>
            metric={metric} · seed={seed}
          </b>
        </span>
        <span>
          Features{" "}
          <b>
            {rows[0]?.features.length ?? 0} / {meta.features}
          </b>
        </span>
        <span>
          Target{" "}
          <b>Species ({new Set(rows.map((row) => row.label)).size} classes)</b>
        </span>
        <button onClick={() => setMessage("Compare opened")}>
          ⌁ Go to Compare
        </button>
      </footer>
    </div>
  );
}
