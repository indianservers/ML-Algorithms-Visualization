import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Play, Share2, Upload } from "lucide-react";
import { irisDataset } from "../../../data/sampleDatasets";
import {
  linearDiscriminantAnalysis,
  type LDACenter,
  type LDAPriors,
} from "../../../lib/algorithms/dimensionality/lda";
import "./LDAPage.css";

type Sample = { values: number[]; label: number };
type Dataset = "iris" | "wine" | "medical" | "imported";
const COLORS = ["#3375ed", "#49cbbd", "#ff693a"],
  CLASS_NAMES = ["setosa", "versicolor", "virginica"],
  FEATURES = ["Sepal length", "Sepal width", "Petal length", "Petal width"];
const rand = (i: number, salt: number) => {
  const value = Math.sin((i + 17) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};
function irisSamples(): Sample[] {
  const rows = irisDataset.data.map((row) => ({
    values: [
      Number(row.sepal_length),
      Number(row.sepal_width),
      Number(row.petal_length),
      Number(row.petal_width),
    ],
    label: CLASS_NAMES.indexOf(String(row.species)),
  }));
  return CLASS_NAMES.flatMap((_, label) => {
    const group = rows.filter((row) => row.label === label);
    return Array.from({ length: 50 }, (_, i) => {
      const base = group[i % group.length];
      return {
        label,
        values: base.values.map(
          (value, j) => value + (rand(i + label * 53, j + 1) - 0.5) * 0.12,
        ),
      };
    });
  });
}
function synthetic(kind: "wine" | "medical", n = 180): Sample[] {
  const classes = 3,
    dimensions = kind === "wine" ? 6 : 4;
  return Array.from({ length: n }, (_, i) => {
    const label = i % classes;
    return {
      label,
      values: Array.from(
        { length: dimensions },
        (_, j) =>
          label * (1.2 + j * 0.15) +
          Math.sin(i * 1.7 + j) * 0.35 +
          (rand(i, j + 3) - 0.5) * 0.35,
      ),
    };
  });
}
const BUILT = {
    iris: irisSamples(),
    wine: synthetic("wine"),
    medical: synthetic("medical"),
  },
  NAMES: Record<Dataset, string> = {
    iris: "Iris (Fisher 1936)",
    wine: "Wine Chemistry",
    medical: "Medical Risk",
    imported: "Imported Data",
  };
export default function LDAPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("iris"),
    [samples, setSamples] = useState<Sample[]>(BUILT.iris),
    [imported, setImported] = useState<Sample[]>([]),
    [featureX, setFeatureX] = useState(2),
    [featureY, setFeatureY] = useState(3),
    [regularization, setRegularization] = useState(0),
    [priors, setPriors] = useState<LDAPriors>("empirical"),
    [standardize, setStandardize] = useState(true),
    [centerMode, setCenterMode] = useState<LDACenter>("class"),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    y = samples.map((sample) => sample.label),
    result = useMemo(
      () =>
        linearDiscriminantAnalysis(
          samples.map((sample) => sample.values),
          samples.map((sample) => sample.label),
          regularization,
          priors,
          standardize,
          centerMode,
        ),
      [samples, regularization, priors, standardize, centerMode],
    );
  const classes = [...new Set(y)].sort((a, b) => a - b),
    choose = (kind: Dataset) => {
      const next = kind === "imported" ? imported : BUILT[kind];
      if (!next.length) return;
      setDataset(kind);
      setSamples(next);
      setFeatureX(Math.min(2, next[0].values.length - 1));
      setFeatureY(Math.min(3, next[0].values.length - 1));
      setToast(`${NAMES[kind]} loaded`);
    },
    upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const rows = (await file.text())
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((row) => row.split(",").map(Number))
        .filter((row) => row.length >= 3 && row.every(Number.isFinite))
        .map((row) => ({ values: row.slice(0, -1), label: row.at(-1) || 0 }));
      if (rows.length < 3 || new Set(rows.map((row) => row.label)).size < 2)
        return setToast("CSV needs features and at least two classes");
      setImported(rows);
      setDataset("imported");
      setSamples(rows);
      setFeatureX(0);
      setFeatureY(1);
      setToast(`Imported ${rows.length} samples`);
      event.target.value = "";
    },
    reset = () => {
      setRegularization(0);
      setPriors("empirical");
      setStandardize(true);
      setCenterMode("class");
    };
  const range = (values: number[]) => {
      const min = Math.min(...values),
        max = Math.max(...values);
      return { min, span: max - min || 1 };
    },
    rx = range(samples.map((s) => s.values[featureX])),
    ry = range(samples.map((s) => s.values[featureY])),
    rs = range(result.scores),
    confusion = classes.map((actual) =>
      classes.map(
        (predicted) =>
          result.predictions.filter(
            (value, i) => y[i] === actual && value === predicted,
          ).length,
      ),
    );
  return (
    <div className="ld-page">
      <aside className="ld-side">
        <Link to="/">
          ⠿{" "}
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <h4>NAVIGATION</h4>
        {[
          "⌂ Home",
          "♧ Models",
          "▤ Datasets",
          "⌘ Playground",
          "⌘ Experiments",
          "▣ Notebooks",
          "◇ Deployments",
        ].map((name) => (
          <button onClick={() => setToast(name)} key={name}>
            {name}
          </button>
        ))}
        <h4>CURRENT</h4>
        <button className="active">Linear Discriminant Analysis</button>
        <h4>RECENT</h4>
        {[
          "› Logistic Regression",
          "› PCA",
          "› SVM",
          "› k-Nearest Neighbors",
        ].map((name) => (
          <button onClick={() => setToast(name)} key={name}>
            {name}
          </button>
        ))}
        <footer>≪ Collapse</footer>
      </aside>
      <header className="ld-head">
        <h1>Linear Discriminant Analysis</h1>
        <p>
          Finds the projection that maximizes between-class separation relative
          to within-class scatter.
        </p>
        <div>
          <button onClick={() => setToast("Help opened")}>
            <HelpCircle />
          </button>
          <button onClick={() => setToast("Docs opened")}>Docs</button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button
            className="primary"
            onClick={() => setToast("LDA recomputed")}
          >
            <Play /> Run
          </button>
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
        <section className="ld-data">
          <b>Dataset</b>
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
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
          <button onClick={() => setToast("Dataset shuffled")}>⌘</button>
          <span>
            Samples <b>{samples.length}</b>
          </span>
          <span>
            Classes <b>{classes.length}</b>
          </span>
          <span>
            Features <b>{samples[0].values.length}</b>
          </span>
          <em>● Ready</em>
        </section>
        <section className="ld-visual">
          <article>
            <h3>Feature Space (Original)</h3>
            <select
              value={`${featureX}:${featureY}`}
              onChange={(e) => {
                const [a, b] = e.target.value.split(":").map(Number);
                setFeatureX(a);
                setFeatureY(b);
              }}
            >
              {Array.from({ length: samples[0].values.length }, (_, a) =>
                Array.from(
                  { length: samples[0].values.length },
                  (_, b) =>
                    a < b && (
                      <option value={`${a}:${b}`} key={`${a}:${b}`}>
                        {FEATURES[a] || `Feature ${a + 1}`} vs{" "}
                        {FEATURES[b] || `Feature ${b + 1}`}
                      </option>
                    ),
                ),
              )}
            </select>
            <div className="ld-scatter">
              {samples.map((sample, i) => (
                <i
                  key={i}
                  style={{
                    left: `${7 + ((sample.values[featureX] - rx.min) / rx.span) * 86}%`,
                    top: `${93 - ((sample.values[featureY] - ry.min) / ry.span) * 86}%`,
                    background: COLORS[sample.label % COLORS.length],
                  }}
                />
              ))}
            </div>
            <footer>
              {classes.map((label) => (
                <span key={label}>
                  <i style={{ background: COLORS[label % COLORS.length] }} />{" "}
                  {CLASS_NAMES[label] || `Class ${label}`}
                </span>
              ))}
            </footer>
          </article>
          <strong>Project →</strong>
          <article>
            <h3>Projection: w (LDA direction)</h3>
            <code>
              w = [{result.direction.map((v) => v.toFixed(3)).join(", ")}]
            </code>
            <div className="ld-projection">
              {samples.map((sample, i) => (
                <i
                  key={i}
                  style={{
                    left: `${5 + ((result.scores[i] - rs.min) / rs.span) * 90}%`,
                    top: `${23 + (sample.label / Math.max(1, classes.length - 1)) * 55 + (rand(i, 19) - 0.5) * 4}%`,
                    background: COLORS[sample.label % COLORS.length],
                  }}
                />
              ))}
            </div>
            <footer>
              Explained (between/total scatter):{" "}
              <b>{(result.explained * 100).toFixed(1)}%</b>
            </footer>
          </article>
        </section>
        <section className="ld-results">
          <article>
            <h3>Class Statistics (Original Space)</h3>
            {classes.map((label, ci) => (
              <p key={label}>
                <i style={{ background: COLORS[label % COLORS.length] }} />{" "}
                {CLASS_NAMES[label] || `Class ${label}`}{" "}
                <b>{y.filter((v) => v === label).length}</b>
                <code>
                  [{" "}
                  {result.classMeans[ci]
                    .slice(0, 2)
                    .map((v) => v.toFixed(3))
                    .join(", ")}{" "}
                  ]
                </code>
              </p>
            ))}
          </article>
          <article>
            <h3>Separation (1D Projection)</h3>
            <p>
              Between-class scatter (S<sub>B</sub>){" "}
              <b>{result.betweenValue.toFixed(3)}</b>
            </p>
            <p>
              Within-class scatter (S<sub>W</sub>){" "}
              <b>{result.withinValue.toFixed(3)}</b>
            </p>
            <p>
              J (S<sub>B</sub> / S<sub>W</sub>){" "}
              <b>
                {(
                  result.betweenValue / Math.max(1e-9, result.withinValue)
                ).toFixed(2)}
              </b>
            </p>
            <p>
              Explained <b>{(result.explained * 100).toFixed(1)}%</b>
            </p>
          </article>
          <article>
            <h3>Projection Histogram</h3>
            <div className="ld-hist">
              {samples.map((_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${((result.scores[i] - rs.min) / rs.span) * 96}%`,
                    height: `${12 + (i % 13) * 4}px`,
                    background: COLORS[y[i] % COLORS.length],
                  }}
                />
              ))}
            </div>
          </article>
          <article>
            <h3>Confusion Matrix (1-NN in 1D)</h3>
            <table>
              <thead>
                <tr>
                  <th>True \ Pred</th>
                  {classes.map((c) => (
                    <th key={c}>{CLASS_NAMES[c] || c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusion.map((row, i) => (
                  <tr key={i}>
                    <th>{CLASS_NAMES[classes[i]] || classes[i]}</th>
                    {row.map((value, j) => (
                      <td key={j}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <strong>Accuracy {(result.accuracy * 100).toFixed(1)}%</strong>
          </article>
        </section>
        <footer>
          ⓘ LDA finds w that maximizes J(w) = wᵀS<sub>B</sub>w / wᵀS
          <sub>W</sub>w. Project data onto w to achieve maximal class separation
          in 1D.
        </footer>
      </main>
      <aside className="ld-controls">
        <h2>Discriminant Controls</h2>
        <label>
          Solver
          <select>
            <option>Eigen Decomposition</option>
            <option>SVD</option>
          </select>
        </label>
        <label>
          Regularization (shrinkage) ⓘ{" "}
          <input
            aria-label="Regularization numeric"
            type="number"
            min="0"
            max="1"
            step=".01"
            value={regularization}
            onChange={(e) => setRegularization(Number(e.target.value))}
          />
          <input
            aria-label="Regularization"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={regularization}
            onChange={(e) => setRegularization(Number(e.target.value))}
          />
        </label>
        <label>
          Prior Probabilities ⓘ{" "}
          <select
            value={priors}
            onChange={(e) => setPriors(e.target.value as LDAPriors)}
          >
            <option value="empirical">Empirical</option>
            <option value="uniform">Uniform</option>
          </select>
        </label>
        <label>
          Standardize features{" "}
          <input
            type="checkbox"
            checked={standardize}
            onChange={(e) => setStandardize(e.target.checked)}
          />
        </label>
        <fieldset>
          <legend>Center data ⓘ</legend>
          <label>
            <input
              type="radio"
              checked={centerMode === "class"}
              onChange={() => setCenterMode("class")}
            />{" "}
            By class mean
          </label>
          <label>
            <input
              type="radio"
              checked={centerMode === "overall"}
              onChange={() => setCenterMode("overall")}
            />{" "}
            By overall mean
          </label>
        </fieldset>
        <label>
          Components ⓘ{" "}
          <select>
            <option>1 (LDA)</option>
          </select>
        </label>
        <section>
          <h2>Scatter Matrices ⓘ</h2>
          <h4>
            Within-class scatter (S<sub>W</sub>)
          </h4>
          <pre>
            {result.withinScatter
              .slice(0, 4)
              .map(
                (row) =>
                  `[ ${row
                    .slice(0, 4)
                    .map((v) => v.toFixed(3).padStart(7))
                    .join(" ")} ]`,
              )
              .join("\n")}
          </pre>
          <h4>
            Between-class scatter (S<sub>B</sub>)
          </h4>
          <pre>
            {result.betweenScatter
              .slice(0, 4)
              .map(
                (row) =>
                  `[ ${row
                    .slice(0, 4)
                    .map((v) => v.toFixed(3).padStart(7))
                    .join(" ")} ]`,
              )
              .join("\n")}
          </pre>
          <h4>Eigenvalues (desc)</h4>
          <pre>
            [ {result.eigenvalues.map((v) => v.toFixed(3)).join(", ")} ]
          </pre>
        </section>
        <button onClick={reset}>Reset Controls</button>
      </aside>
      {toast && (
        <button className="ld-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
