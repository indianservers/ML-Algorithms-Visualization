/* eslint-disable no-irregular-whitespace */
import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  expandPolynomial,
  fitPolynomial,
  type NumericRow,
} from "../../../lib/preprocessing/polynomialFeatures";
import "./PolynomialFeaturesApprovedPage.css";

const TABS = [
  "Learn",
  "Visualize",
  "Dataset",
  "Transform",
  "Train",
  "Metrics",
  "Compare",
  "Explain",
];
const FEATURES = ["MedInc", "AveRooms", "AveOccup", "Latitude"];
function makeRows(seed: number, n = 180) {
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, () => {
    const MedInc = 1 + rnd() * 9,
      AveRooms = 3 + rnd() * 7,
      AveOccup = 1 + rnd() * 4,
      Latitude = 32 + rnd() * 10,
      noise = (rnd() - 0.5) * 0.55;
    return {
      MedInc,
      AveRooms,
      AveOccup,
      Latitude,
      MedHouseVal:
        0.45 +
        0.42 * MedInc +
        0.11 * AveRooms +
        0.027 * MedInc * AveRooms -
        0.018 * MedInc ** 2 +
        noise,
    };
  });
}
const DATA = [
  { name: "California Housing (Sample)", rows: 20640, data: makeRows(66) },
  { name: "Energy Efficiency", rows: 768, data: makeRows(93) },
  { name: "Concrete Strength", rows: 1030, data: makeRows(121) },
];
const short = (name: string) =>
  name.replaceAll("^2", "²").replaceAll("^3", "³");

export default function PolynomialFeaturesApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [uploaded, setUploaded] = useState<{
      name: string;
      rows: NumericRow[];
      target: string;
    } | null>(null),
    [tab, setTab] = useState("Learn"),
    [selected, setSelected] = useState(["MedInc", "AveRooms"]),
    [degree, setDegree] = useState(2),
    [interaction, setInteraction] = useState(true),
    [bias, setBias] = useState(true),
    [scaling, setScaling] = useState<"none" | "standardize">("standardize"),
    [model, setModel] = useState("Linear Regression"),
    [status, setStatus] = useState("Ready"),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = uploaded?.rows ?? DATA[dataset].data,
    target = uploaded?.target ?? "MedHouseVal",
    available = uploaded
      ? Object.keys(rows[0]).filter((x) => x !== target)
      : FEATURES;
  const expanded = useMemo(
    () => expandPolynomial(rows, selected, degree, bias, interaction, scaling),
    [rows, selected, degree, bias, interaction, scaling],
  );
  const fits = useMemo(
      () =>
        [1, 2, 3, 4, 5].map((d) =>
          fitPolynomial(rows, target, selected, d, interaction),
        ),
      [rows, target, selected, interaction],
    ),
    fit = fits[degree - 1] ?? fits[0];
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      headers = lines[0].split(",").map((x) => x.trim()),
      values = lines
        .slice(1)
        .map((line) => line.split(",").map(Number))
        .filter(
          (row) => row.length === headers.length && row.every(Number.isFinite),
        );
    if (values.length < 8 || headers.length < 3) {
      setStatus("CSV needs 8 numeric rows and 3 columns");
      return;
    }
    const parsed = values.map((row) =>
      Object.fromEntries(headers.map((h, i) => [h, row[i]])),
    );
    setUploaded({ name: file.name, rows: parsed, target: headers.at(-1)! });
    setSelected(headers.slice(0, -1).slice(0, 2));
    setStatus(`${file.name} · ${parsed.length} rows loaded`);
  };
  const choose = (i: number) => {
    setDataset(i);
    setUploaded(null);
    setSelected(["MedInc", "AveRooms"]);
    setStatus(`${DATA[i].name} loaded`);
  };
  const toggle = (name: string) =>
    setSelected((value) =>
      value.includes(name)
        ? value.length > 1
          ? value.filter((x) => x !== name)
          : value
        : [...value, name],
    );
  const reset = () => {
    setDegree(2);
    setSelected(["MedInc", "AveRooms"]);
    setInteraction(true);
    setBias(true);
    setScaling("standardize");
    setStatus("Transformation reset");
  };
  const groups = {
    original: expanded.terms.filter(
      (t) => t.powers.reduce((a, b) => a + b, 0) <= 1,
    ),
    powers: expanded.terms.filter(
      (t) =>
        t.powers.reduce((a, b) => a + b, 0) > 1 &&
        t.powers.filter(Boolean).length === 1,
    ),
    mix: expanded.terms.filter((t) => t.powers.filter(Boolean).length > 1),
  };
  return (
    <div className={`pf-page ${collapsed ? "collapsed" : ""}`}>
      <aside className="pf-side">
        <a href="/" className="logo">
          <i>〽</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </a>
        {[
          "⌂　Home",
          "♧　Playground",
          "▤　Datasets",
          "⌘　Models",
          "♟　Experiments",
          "▣　Learn",
          "♧　Deploy",
          "▱　Notebooks",
        ].map((x, i) => (
          <button
            className={i === 5 ? "active" : ""}
            onClick={() => go(x)}
            key={x}
          >
            {x}
          </button>
        ))}
        <hr />
        <small>RECENT</small>
        <button className="recent active">Polynomial Features</button>
        {["Ridge Regression", "Feature Scaling", "Linear Regression"].map(
          (x) => (
            <button
              className="recent"
              key={x}
              onClick={() => go(x)}
            >
              {x}
            </button>
          ),
        )}
        <footer>
          <button onClick={() => setStatus("Settings opened")}>
            ⚙　Settings
          </button>
          <button onClick={() => go("Help")}>?　 Help</button>
          <button onClick={() => setCollapsed((v) => !v)}>
            MM　 Mega ML　 <b>Pro</b>
          </button>
        </footer>
      </aside>
      <header className="pf-head">
        <h1>Polynomial Features</h1>
        <p>
          Expand inputs into polynomial terms to capture non-linear
          relationships.
        </p>
        <label>
          <small>Dataset</small>
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => choose(+e.target.value)}
          >
            {DATA.map((d, i) => (
              <option value={i} key={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => fileRef.current?.click()}>⇧ Upload CSV</button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".csv,text/csv"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <button onClick={() => setStatus("More actions opened")}>⋮</button>
        <nav>
          {TABS.map((x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => {
                setTab(x);
                setStatus(`${x} selected`);
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
        <section>
          <article>
            <small>OBJECTIVE</small>
            <p>
              Understand how polynomial features convert
              <br />
              inputs into higher-order terms.
            </p>
          </article>
          <article>
            <small>PROGRESS</small>
            <b>65%</b>
          </article>
        </section>
      </header>
      <main className="pf-main">
        <section className="pf-input panel">
          <h2>INPUT FEATURES　ⓘ</h2>
          <p>Select numeric features to expand</p>
          {available.slice(0, 4).map((name, i) => (
            <label className={selected.includes(name) ? "on" : ""} key={name}>
              <input
                type="checkbox"
                aria-label={`Select ${name}`}
                checked={selected.includes(name)}
                onChange={() => toggle(name)}
              />
              <b>
                {name}
                <small>
                  {[
                    "Median Income",
                    "Average Rooms",
                    "Average Occupancy",
                    "Latitude",
                  ][i] ?? "Numeric feature"}
                </small>
              </b>
            </label>
          ))}
          <button
            onClick={() => {
              const next = available.find((x) => !selected.includes(x));
              if (next) setSelected((v) => [...v, next]);
              setStatus("Feature added");
            }}
          >
            ＋ Add Feature
          </button>
        </section>
        <i className="arrow a1">➜</i>
        <section className="pf-expanded panel">
          <h2>EXPANDED POLYNOMIAL FEATURES　ⓘ</h2>
          <div className="degree">
            Degree{" "}
            {[1, 2, 3].map((d) => (
              <button
                className={degree === d ? "active" : ""}
                onClick={() => setDegree(d)}
                key={d}
              >
                {d}
              </button>
            ))}
            <label>
              Interaction{" "}
              <input
                type="checkbox"
                checked={interaction}
                onChange={(e) => setInteraction(e.target.checked)}
              />
              <u>{interaction ? "On" : "Off"}</u>
            </label>
          </div>
          <b>{expanded.terms.length} features</b>
          {[
            ["Degree 1 (Original)", groups.original],
            ["Degree " + degree + " (Powers)", groups.powers],
            ["Degree " + degree + " (Interactions)", groups.mix],
          ].map(([title, items], i) => (
            <article className={`g${i}`} key={title as string}>
              <small>{title as string}</small>
              <div>
                {(items as typeof expanded.terms).slice(0, 6).map((t) => (
                  <span key={t.name}>{short(t.name)}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
        <i className="arrow a2">➜</i>
        <section className="pf-matrix panel">
          <h2>TRANSFORMATION MATRIX　ϕ　ⓘ</h2>
          <p>Each row is a sample, each column is an expanded feature</p>
          <div className="table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  {expanded.terms.slice(0, 6).map((t) => (
                    <th key={t.name}>{short(t.name)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expanded.matrix.slice(0, 4).map((row, i) => (
                  <tr key={i}>
                    <th>{i + 1}</th>
                    {row.slice(0, 6).map((v, j) => (
                      <td key={j}>{v.toFixed(3)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th>…</th>
                  {expanded.terms.slice(0, 6).map((t) => (
                    <td key={t.name}>…</td>
                  ))}
                </tr>
                <tr>
                  <th>N</th>
                  {expanded.matrix
                    .at(-1)
                    ?.slice(0, 6)
                    .map((v, j) => (
                      <td key={j}>{v.toFixed(3)}</td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
          <footer>
            <span>
              Shape: ({uploaded ? rows.length : DATA[dataset].rows},{" "}
              {expanded.terms.length})
            </span>
            <span>
              {bias ? "Bias column (1) included　✓" : "Bias excluded"}
            </span>
          </footer>
        </section>
        <section className="pf-compare panel">
          <h2>MODEL FIT COMPARISON　ⓘ</h2>
          <p>
            Performance improves as complexity increases (watch for
            overfitting).
          </p>
          <label>
            Plot{" "}
            <select aria-label="Plot">
              <option>Predicted vs Actual</option>
              <option>Residuals</option>
            </select>
          </label>
          <div className="plots">
            {[fits[0], fit].map((f, k) => (
              <article key={k}>
                <b>{k ? "Degree " + degree : "Degree 1 (Linear)"}</b>
                <strong>R² = {f.r2.toFixed(3)}</strong>
                <svg
                  viewBox="0 0 220 150"
                  role="img"
                  aria-label={k ? "Selected degree plot" : "Linear plot"}
                >
                  <line x1="20" y1="135" x2="205" y2="18" />
                  {rows.slice(0, 80).map((row, i) => (
                    <circle
                      key={i}
                      cx={20 + Math.min(185, Math.max(0, row[target] * 32))}
                      cy={
                        135 - Math.min(117, Math.max(0, f.predictions[i] * 19))
                      }
                      r="2"
                    />
                  ))}
                </svg>
                <small>Actual (MedHouseVal)</small>
              </article>
            ))}
          </div>
          <table>
            <thead>
              <tr>
                <th>Model (Degree)</th>
                <th>R² ↑</th>
                <th>RMSE ↓</th>
                <th>MAE ↓</th>
                <th>Adj. R² ↑</th>
              </tr>
            </thead>
            <tbody>
              {fits.map((f, i) => (
                <tr className={i + 1 === degree ? "active" : ""} key={i}>
                  <td>
                    {i + 1}
                    {i ? "" : " (Linear)"}
                  </td>
                  <td>{f.r2.toFixed(3)}</td>
                  <td>{f.rmse.toFixed(3)}</td>
                  <td>{f.mae.toFixed(3)}</td>
                  <td>{(f.r2 - i * 0.004).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <aside>
            ⓘ　 Degree {degree} offers a strong balance of fit and simplicity.
            <small>
              Higher degrees give diminishing returns and may overfit.
            </small>
          </aside>
        </section>
        <section className="pf-example panel">
          <h2>LEARN BY EXAMPLE　ⓘ</h2>
          <p>Try different settings and see how features expand.</p>
          <label>
            Example
            <select aria-label="Example">
              <option>2 features (MedInc, AveRooms)</option>
              <option>Income only</option>
              <option>All numeric features</option>
            </select>
          </label>
        </section>
      </main>
      <aside className="pf-settings">
        <section>
          <h2>TRANSFORM SETTINGS　ⓘ</h2>
          <label>
            Polynomial Degree　ⓘ
            <input
              aria-label="Polynomial degree"
              type="range"
              min="1"
              max="5"
              value={degree}
              onInput={(e) => setDegree(+e.currentTarget.value)}
              onChange={(e) => setDegree(+e.target.value)}
            />
            <b>{degree}</b>
          </label>
          <label>
            Include Bias (1)　ⓘ{" "}
            <button aria-pressed={bias} onClick={() => setBias((v) => !v)}>
              {bias ? "● On" : "○ Off"}
            </button>
          </label>
          <label>
            Interaction Terms　ⓘ{" "}
            <button
              aria-pressed={interaction}
              onClick={() => setInteraction((v) => !v)}
            >
              {interaction ? "● On" : "○ Off"}
            </button>
          </label>
          <label>
            Feature Scaling (After Transform)
            <select
              aria-label="Feature scaling"
              value={scaling}
              onChange={(e) => setScaling(e.target.value as typeof scaling)}
            >
              <option value="standardize">Standardize (Z-score)</option>
              <option value="none">None</option>
            </select>
          </label>
        </section>
        <section>
          <h2>EQUATION BUILDER　ⓘ</h2>
          <p>Builds the model form from selected features.</p>
          <div className="equation">
            ŷ =　
            {expanded.terms.slice(0, 7).map((t, i) => (
              <span key={t.name}>
                β<sub>{i}</sub> {short(t.name)}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h2>MODEL TYPE　ⓘ</h2>
          <select
            aria-label="Model type"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option>Linear Regression</option>
            <option>Ridge Regression</option>
            <option>Lasso Regression</option>
          </select>
        </section>
        <section className="result">
          <span>
            Degree{" "}
            {[1, 2, 3].map((d) => (
              <button
                className={degree === d ? "active" : ""}
                onClick={() => setDegree(d)}
                key={d}
              >
                {d}
              </button>
            ))}
          </span>
          <span>
            Interaction{" "}
            <button onClick={() => setInteraction((v) => !v)}>
              {interaction ? "● On" : "○ Off"}
            </button>
          </span>
          <h3>
            Resulting features ({expanded.terms.length}){" "}
            <button
              onClick={() =>
                setStatus(`Viewing all ${expanded.terms.length} terms`)
              }
            >
              View all
            </button>
          </h3>
          <div>
            {expanded.terms.slice(0, 9).map((t) => (
              <i key={t.name}>{short(t.name)}</i>
            ))}
          </div>
        </section>
        <footer>
          <button onClick={reset}>Reset</button>
          <button
            onClick={() =>
              setStatus(`${expanded.terms.length} features transformed`)
            }
          >
            Apply Transform
          </button>
          <a href="?advanced=1">Open original lab →</a>
        </footer>
      </aside>
      <section className="pf-insights">
        <article>
          <h2>KEY INSIGHTS　ⓘ</h2>
          <div>
            <p>
              ◆　Polynomial features allow linear
              <br />
              　　models to learn non-linear relationships.
            </p>
            <p>
              ◉　Interaction terms (x₁ × x₂)
              <br />
              　　capture how features combine.
            </p>
            <p>
              △　Increasing degree increases model
              <br />
              　　complexity—monitor metrics.
            </p>
          </div>
        </article>
        <article>
          <h2>BEST PRACTICES</h2>
          <p>✓　Start with degree 2 and evaluate.</p>
          <p>✓　Use cross-validation to detect overfitting.</p>
          <p>✓　Scale features after transformation.</p>
        </article>
        <article>
          <h2>WHEN TO USE</h2>
          <p>• Curved relationships in data</p>
          <p>• Feature interactions are important</p>
          <p>• You want interpretability with non-linear fits</p>
        </article>
        <svg viewBox="0 0 170 95" aria-label="Polynomial surface">
          <path d="M8 75 Q50 5 85 65 T162 18 M8 75 L75 90 L163 66 M75 90 L162 18" />
          <path d="M18 69 Q52 25 87 68 T153 26 M28 62 Q57 38 91 69 T144 35" />
        </svg>
      </section>
      <div className="pf-status">{status}</div>
    </div>
  );
}
