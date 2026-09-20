import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLabNavigate } from "../../../lib/labNavigation";
import { Check, Settings, Upload } from "lucide-react";
import { fitGaussianMixture } from "../../../lib/algorithms/clustering/gaussianMixture";
import {
  datasetAWellSeparatedBlobs,
  datasetETwoMoons,
  datasetIElongated,
  datasetLHighDimensional,
  overlappingBlobs,
} from "../../../lib/clustering/clusteringDatasets";
import {
  gmmInformationCriteria,
  projectPca2d,
} from "../../../lib/clustering/clusteringEval";
import {
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
import "./GaussianMixtureModelPage.css";

type Point = { x: number; y: number };
type Dataset =
  | "anisotropic"
  | "isotropic"
  | "moons"
  | "spirals"
  | "banana"
  | "digits"
  | "imported";
const COLORS = [
  "#48d4d6",
  "#5bcb72",
  "#ffa236",
  "#ff6553",
  "#9b75ff",
  "#e963c9",
];
const rand = (i: number, salt: number) => {
  const v = Math.sin((i + 11) * 12.9898 + salt * 78.233) * 43758.5453;
  return Math.max(1e-8, v - Math.floor(v));
};
function spirals(count = 120): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const k = i % 2;
    const t = rand(i, 4) * Math.PI * 3;
    const r = 0.28 * t;
    return {
      x: Math.cos(t + k * Math.PI) * r,
      y: Math.sin(t + k * Math.PI) * r,
    };
  });
}
function banana(count = 120): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const a = Math.sqrt(-2 * Math.log(rand(i, 1))) * Math.cos(2 * Math.PI * rand(i, 9));
    const b = Math.sqrt(-2 * Math.log(rand(i, 2))) * Math.cos(2 * Math.PI * rand(i, 11));
    return { x: a * 2, y: 0.4 * (a * a - 2) + b * 0.55 };
  });
}
function highDimProjected(): Point[] {
  const source = datasetLHighDimensional();
  const projected = projectPca2d(source.map((point) => point.features!));
  return projected.map(([x, y]) => ({ x, y }));
}
const BUILT = {
  anisotropic: datasetIElongated(),
  isotropic: datasetAWellSeparatedBlobs(),
  moons: datasetETwoMoons(),
  spirals: spirals(),
  banana: overlappingBlobs().concat(banana(40)),
  digits: highDimProjected(),
};
const LABELS: Record<Dataset, string> = {
  anisotropic: "Elongated Gaussians",
  isotropic: "Well-separated blobs",
  moons: "Two moons",
  spirals: "Two spirals",
  banana: "Overlapping + banana",
  digits: "4D blobs (PCA 2D, then GMM)",
  imported: "Imported CSV",
};

export default function GaussianMixtureModelPage() {
  const { tab, setTab, panel, layout, lesson } = useLabTabs("Learn"),
    [sideTab, setSideTab] = useState("EM Algorithm"),
    [dataset, setDataset] = useState<Dataset>("anisotropic"),
    [points, setPoints] = useState<Point[]>(BUILT.anisotropic),
    [imported, setImported] = useState<Point[]>([]),
    [components, setComponents] = useState(3),
    [maxIterations, setMaxIterations] = useState(24),
    [tolerance, setTolerance] = useState(0.0001),
    [regularization, setRegularization] = useState(0.001),
    [iteration, setIteration] = useState(6),
    [playing, setPlaying] = useState(false),
    [seed, setSeed] = useState(42),
    [selected, setSelected] = useState(0),
    [toast, setToast] = useState("");
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const safeK = Math.max(1, Math.min(components, Math.max(1, X.length)));
  const model = useMemo(
    () =>
      fitGaussianMixture(
        X,
        safeK,
        maxIterations,
        tolerance,
        regularization,
        seed,
      ),
    [X, safeK, maxIterations, tolerance, regularization, seed],
  );
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIteration((current) => {
        if (current >= model.iteration) {
          setPlaying(false);
          return model.iteration;
        }
        return current + 1;
      });
    }, 380);
    return () => window.clearInterval(timer);
  }, [playing, model.iteration]);
  const criteria = gmmInformationCriteria(
    model.logLikelihood,
    X.length,
    safeK,
  );
  const modelSweep = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6]
        .filter((k) => k <= X.length)
        .map((k) => {
          const fitted = fitGaussianMixture(
            X,
            k,
            Math.min(12, maxIterations),
            tolerance,
            regularization,
            seed,
          );
          return {
            k,
            logLikelihood: fitted.logLikelihood,
            ...gmmInformationCriteria(fitted.logLikelihood, X.length, k),
          };
        }),
    [X, maxIterations, tolerance, regularization, seed],
  );
  const state =
      model.history[Math.min(iteration, model.history.length) - 1] || model,
    assignments = state.responsibilities.map((row) =>
      row.reduce((best, value, index) => (value > row[best] ? index : best), 0),
    );
  const choose = (value: Dataset) => {
    const next = value === "imported" ? imported : BUILT[value];
    if (!next.length) return;
    setDataset(value);
    setPoints(next);
    setIteration(1);
    setPlaying(false);
    setToast(`${LABELS[value]} loaded`);
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text())
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .map((row) => row.split(",").map(Number))
      .filter((row) => row.length >= 2 && row.every(Number.isFinite))
      .map((row) => ({ x: row[0], y: row[1] }));
    if (rows.length < components)
      return setToast("CSV needs at least K numeric rows");
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setIteration(1);
    setToast(`Imported ${rows.length} points`);
    event.target.value = "";
  };
  const reset = () => {
    setComponents(3);
    setSeed(42);
    setSelected(0);
    setMaxIterations(24);
    setTolerance(0.0001);
    setRegularization(0.001);
    setIteration(6);
    setPlaying(false);
    setDataset("anisotropic");
    setPoints(BUILT.anisotropic);
  };
  const xPct = (x: number) => ((x + 9) / 18) * 100,
    yPct = (y: number) => ((6 - y) / 12) * 100;
  return (
    <div className="gm-page">
      <aside className="gm-side">
        <Link to="/">
          <i>◉</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </Link>
        <h3>
          LESSON NAVIGATION <span>6 / 18</span>
        </h3>
        <progress value="6" max="18" />
        <button>1. Foundations ✓</button>
        <section>
          <h4>2. Model Deep Dive ⌃</h4>
          {[
            "Overview",
            "Gaussian Distribution",
            "Gaussian Mixture Model",
            "EM Algorithm",
            "Covariance Types",
            "Model Selection",
          ].map((name, index) => (
            <button
              className={index === 2 ? "active" : ""}
              onClick={() => setToast(name)}
              key={name}
            >
              ♧ {name}
            </button>
          ))}
        </section>
        {[
          "3. Training & Inference",
          "4. Evaluation",
          "5. Applications",
          "6. Advanced Topics",
        ].map((name) => (
          <button onClick={() => setToast(name)} key={name}>
            {name} ⌄
          </button>
        ))}
        <article>
          <b>Need a refresher?</b>
          <p>
            Review prerequisites: probability, multivariate Gaussians, and EM.
          </p>
          <button onClick={() => go("Prerequisites")}>
            Open Prerequisites
          </button>
        </article>
      </aside>
      <header className="gm-top">
        <div>
          <h1>
            Gaussian Mixture Model <em>GMM</em>
          </h1>
          <p>
            Model complex, multi-modal data as a mixture of K Gaussian
            distributions estimated with EM.
          </p>
        </div>
        <section>
          Lesson Progress{" "}
          <i>
            <b />
          </i>
          <strong>42%</strong>
        </section>
        <button onClick={() => setToast("Lesson marked complete")}>
          <Check />
          Mark Complete
        </button>
        <button onClick={() => setToast("Settings opened")}>
          <Settings />
        </button>
      </header>
      <main className={layout.trim()}>
        <header className={panel("Visualize", "Dataset", "Train", "Metrics").trim()}>
          <b>♙ Objective</b>
          <span>
            Understand how GMM represents data as a weighted sum of Gaussians
            and how EM learns the parameters.
          </span>
        </header>
        <nav role="tablist" aria-label="Gaussian Mixture Model sections">
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((name) => (
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
          <LabLessonPanel
            tab={tab}
            route="/ml/clustering/gaussian-mixture-model"
          />
        )}
        <section className={`gm-viz${panel("Visualize", "Train")}`}>
          <header>
            <h2>Mixture Visualization ⓘ</h2>
            <select>
              <option>2D Projection</option>
              <option>Density View</option>
            </select>
            {state.means.map((_, k) => (
              <span key={k}>
                <i style={{ background: COLORS[k] }} />
                Component {k + 1}
              </span>
            ))}
            <span>
              <i />
              Data Points
            </span>
          </header>
          <div className="gm-plot">
            {points.map((point, index) => {
              const k = assignments[index],
                confidence = state.responsibilities[index]?.[k] || 0;
              return (
                <i
                  key={index}
                  onClick={() => setSelected(index)}
                  style={{
                    left: `${xPct(point.x)}%`,
                    top: `${yPct(point.y)}%`,
                    background: COLORS[k],
                    opacity: 0.2 + confidence * 0.8,
                    outline: selected === index ? "2px solid #fff" : undefined,
                  }}
                />
              );
            })}
            {state.means.map((mean, k) => {
              const c = state.covariances[k],
                angle =
                  (Math.atan2(2 * c[0][1], c[0][0] - c[1][1]) * 90) / Math.PI;
              return (
                <b
                  key={k}
                  style={{
                    left: `${xPct(mean[0])}%`,
                    top: `${yPct(mean[1])}%`,
                    width: `${Math.sqrt(c[0][0]) * 95}px`,
                    height: `${Math.sqrt(c[1][1]) * 95}px`,
                    borderColor: COLORS[k],
                    color: COLORS[k],
                    transform: `translate(-50%,-50%) rotate(${angle}deg)`,
                  }}
                >
                  <i />
                  <i />
                  <i />
                </b>
              );
            })}
            <aside>
              Membership
              <br />
              P(z=k | x)
              <i />
              1.0
              <br />
              <br />
              <br />
              <br />
              0.0
            </aside>
          </div>
          <footer>
            ⓘ Color intensity shows soft membership (responsibility) of each
            point for the nearest component.
          </footer>
        </section>
        <section className={`gm-cards${panel("Metrics")}`}>
          <article>
            <h3>Component Parameters (θ)</h3>
            <div className="head">
              k · Weight · Mean (μ) · Covariance (Σ) · det(Σ) · Color
            </div>
            {state.means.map((mean, k) => {
              const c = state.covariances[k];
              return (
                <p key={k}>
                  <i style={{ background: COLORS[k] }} />
                  <b>{state.weights[k].toFixed(3)}</b>
                  <span>{mean.map((v) => v.toFixed(2)).join(", ")}</span>
                  <span>
                    {c[0][0].toFixed(2)} {c[0][1].toFixed(2)}{" "}
                    {c[1][1].toFixed(2)}
                  </span>
                  <b>{(c[0][0] * c[1][1] - c[0][1] ** 2).toFixed(2)}</b>
                  <i style={{ background: COLORS[k] }} />
                </p>
              );
            })}
          </article>
          <article>
            <h3>Model Summary</h3>
            <p>
              Components (K)<b>{components}</b>
              <br />
              Data Points (n)<b>{points.length}</b>
              <br />
              Parameters<b>{criteria.parameters}</b>
              <br />
              AIC<b>{criteria.aic.toFixed(1)}</b>
              <br />
              BIC<b>{criteria.bic.toFixed(1)}</b>
              <br />
              Covariance Type<b>Full</b>
              <br />
              Initialization<b>Seeded farthest-point</b>
              <br />
              Converged<b>{model.converged ? "Yes" : "Iterating"}</b>
              <br />
              Iterations<b>{model.iteration}</b>
              <br />
              Final Log Likelihood<b>{model.logLikelihood.toFixed(2)}</b>
            </p>
            <table>
              <caption>Component sweep (same data; BIC/AIC penalize complexity)</caption>
              <thead>
                <tr>
                  <th>K</th>
                  <th>LL</th>
                  <th>AIC</th>
                  <th>BIC</th>
                </tr>
              </thead>
              <tbody>
                {modelSweep.map((row) => (
                  <tr key={row.k}>
                    <td>{row.k}</td>
                    <td>{row.logLikelihood.toFixed(1)}</td>
                    <td>{row.aic.toFixed(1)}</td>
                    <td>{row.bic.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Point {selected} P(k)
              <b>
                {(state.responsibilities[selected] || [])
                  .map((value, k) => `${k + 1}:${value.toFixed(2)}`)
                  .join(" ")}
              </b>
              <br />
              Hard assignment{" "}
              <b>
                argmax ={" "}
                {(state.responsibilities[selected] || []).reduce(
                  (best, value, index, row) =>
                    value > row[best] ? index : best,
                  0,
                ) + 1}
              </b>
              · sum{" "}
              <b>
                {(state.responsibilities[selected] || [])
                  .reduce((sum, value) => sum + value, 0)
                  .toFixed(3)}
              </b>
            </p>
          </article>
          <article>
            <h3>What to Observe</h3>
            {[
              "Ellipses show learned means and covariances.",
              "Colors indicate soft membership, not hard assignment.",
              "Log likelihood should increase and then plateau.",
              "EM alternates between E-step and M-step until convergence.",
            ].map((text, index) => (
              <p key={text}>
                <i style={{ color: COLORS[index] }}>♧</i>
                {text}
              </p>
            ))}
          </article>
        </section>
      </main>
      <aside className={`gm-em${panel("Visualize", "Train")}`}>
        <nav>
          <button
            className={sideTab === "EM Algorithm" ? "active" : ""}
            onClick={() => setSideTab("EM Algorithm")}
          >
            EM Algorithm
          </button>
          <button
            className={sideTab === "Model Controls" ? "active" : ""}
            onClick={() => setSideTab("Model Controls")}
          >
            Model Controls
          </button>
        </nav>
        {sideTab === "EM Algorithm" ? (
          <>
            <section>
              <b>E-step</b>
              <span>Compute responsibilities</span> ↻ <b>M-step</b>
              <span>Update parameters</span>
            </section>
            <label>
              Iteration{" "}
              <b>
                {Math.min(iteration, model.iteration)} / {maxIterations}
              </b>
            </label>
            <input
              aria-label="EM iteration"
              type="range"
              min="1"
              max={model.iteration}
              value={Math.min(iteration, model.iteration)}
              onChange={(event) => setIteration(Number(event.target.value))}
            />
            <div>
              <button onClick={() => setIteration(1)}>↤ First</button>
              <button onClick={() => setIteration(Math.max(1, iteration - 1))}>
                ‹ Prev
              </button>
              <button
                onClick={() => {
                  setPlaying(!playing);
                  setIteration(Math.min(model.iteration, iteration + 1));
                }}
              >
                {playing ? "Ⅱ Pause" : "▷ Play"}
              </button>
              <button
                onClick={() =>
                  setIteration(Math.min(model.iteration, iteration + 1))
                }
              >
                Next ›
              </button>
              <button onClick={() => setIteration(model.iteration)}>
                Last ↦
              </button>
            </div>
            <h3>
              Log Likelihood <b>{state.logLikelihood.toFixed(2)}</b>
            </h3>
            <svg viewBox="0 0 260 120">
              <polyline
                points={model.history
                  .map(
                    (s, i) =>
                      `${8 + (i / Math.max(1, model.history.length - 1)) * 244},${110 - ((s.logLikelihood - model.history[0].logLikelihood) / Math.max(1, model.logLikelihood - model.history[0].logLikelihood)) * 95}`,
                  )
                  .join(" ")}
              />
            </svg>
            <h3>
              Convergence{" "}
              <em>{model.converged ? "Converged" : "Converging"}</em>
            </h3>
            <p>
              Δ Log Likelihood
              <b>
                {Math.abs(
                  model.logLikelihood -
                    (model.history.at(-2)?.logLikelihood ||
                      model.logLikelihood),
                ).toFixed(3)}
              </b>
            </p>
            <table>
              <caption>EM history (actual fitted states)</caption>
              <thead>
                <tr>
                  <th>Iter</th>
                  <th>LL</th>
                  <th>ΔLL</th>
                </tr>
              </thead>
              <tbody>
                {model.history.slice(-6).map((step, index, rows) => {
                  const previous =
                    index === 0
                      ? model.history[
                          Math.max(0, model.history.length - 7)
                        ]?.logLikelihood
                      : rows[index - 1].logLikelihood;
                  const delta =
                    previous === undefined
                      ? 0
                      : step.logLikelihood - previous;
                  return (
                    <tr key={step.iteration}>
                      <td>{step.iteration}</td>
                      <td>{step.logLikelihood.toFixed(2)}</td>
                      <td>{delta.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p>
              Stop when |ΔLL| ≤ tolerance·n, or max iterations. Covariance is
              full 2×2 with diagonal regularization (diag/tied/spherical are not
              implemented).
            </p>
            <p>
              Tolerance<b>{tolerance}</b>
            </p>
          </>
        ) : (
          <>
            <label>
              Components (K)
              <input
                aria-label="Components"
                type="number"
                min="2"
                max="6"
                value={components}
                onChange={(event) => setComponents(Number(event.target.value) || 1)}
              />
            </label>
            <label>
              Seed
              <input
                aria-label="GMM seed"
                type="number"
                value={seed}
                onChange={(event) => setSeed(Number(event.target.value) || 0)}
              />
            </label>
            <label>
              Max Iterations
              <input
                aria-label="GMM maximum iterations"
                type="number"
                min="5"
                max="100"
                value={maxIterations}
                onChange={(event) =>
                  setMaxIterations(Number(event.target.value))
                }
              />
            </label>
            <label>
              Tolerance
              <input
                aria-label="GMM tolerance"
                type="number"
                min=".00001"
                max=".1"
                step=".00001"
                value={tolerance}
                onChange={(event) => setTolerance(Number(event.target.value))}
              />
            </label>
            <label>
              Regularization
              <input
                aria-label="GMM regularization"
                type="number"
                min=".0001"
                max=".1"
                step=".0001"
                value={regularization}
                onChange={(event) =>
                  setRegularization(Number(event.target.value))
                }
              />
            </label>
            <button onClick={reset}>Reset Model</button>
          </>
        )}
      </aside>
      <aside className={`gm-data${panel("Dataset")}`}>
        <h2>Dataset</h2>
        <small>Active Dataset</small>
        <article>
          <b>
            {LABELS[dataset]} <em>Sample</em>
          </b>
          <p>
            {components} mixture components; GMM uses the plotted 2D coordinates
            {dataset === "digits"
              ? " after PCA (high-D clustering is not run in original 4D)."
              : "."}
            <br />n = {points.length}
          </p>
        </article>
        <small>Switch Dataset</small>
        <select
          value={dataset}
          onChange={(event) => choose(event.target.value as Dataset)}
        >
          {Object.entries(LABELS).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        {Object.entries(LABELS)
          .filter(([value]) => value !== "imported")
          .map(([value, label]) => (
            <button
              className={dataset === value ? "active" : ""}
              onClick={() => choose(value as Dataset)}
              key={value}
            >
              {label}
              {dataset === value && "✓"}
            </button>
          ))}
        <hr />
        <small>Upload Custom</small>
        <button className="upload" onClick={() => fileRef.current?.click()}>
          <Upload />
          Drop CSV file here
          <br />
          or click to browse
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
      </aside>
      {toast && (
        <button className="gm-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
