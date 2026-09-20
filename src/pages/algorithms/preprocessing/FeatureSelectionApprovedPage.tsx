/* eslint-disable no-irregular-whitespace, react-hooks/preserve-manual-memoization */
import { useMemo, useRef, useState } from "react";
import { useLabNavigate } from "../../../lib/labNavigation";
import {
  pearson,
  rankNumericFeatures,
  selectedPerformance,
} from "../../../lib/preprocessing/featureSelection";
import "./FeatureSelectionApprovedPage.css";
import "./FeatureSelectionApprovedOverrides.css";
import { LabLessonOrWork, labHide } from "../../../components/common/LabTabs";

type Row = Record<string, number>;
type RankMode = "importance" | "correlation" | "variance";
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
const INITIAL_SELECTED = [
  "Contract_Month_to_month",
  "Tech_Support_Yes",
  "Tenure",
  "Online_Security_Yes",
  "Internet_Service_Fiber_optic",
  "Monthly_Charges",
  "Total_Charges",
  "Streaming_Movies",
  "Payment_Method_Electronic_check",
  "Senior_Citizen",
  "Partner_Yes",
  "Paperless_Billing",
  "Dependents_Yes",
  "Phone_Service",
];
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
function makeRows(seed: number, n = 260) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const tenure = r(),
      monthly = r(),
      contract = r() > 0.62 ? 1 : 0,
      fiber = r() > 0.55 ? 1 : 0,
      support = r() > 0.58 ? 1 : 0,
      security = r() > 0.55 ? 1 : 0,
      score =
        1.9 * contract -
        1.25 * tenure +
        0.72 * monthly +
        0.55 * fiber -
        0.48 * support -
        0.38 * security +
        (r() - 0.5) * 0.8;
    const row: Row = {
      Contract_Month_to_month: contract,
      Tenure: tenure,
      Monthly_Charges: monthly,
      Total_Charges: tenure * monthly + 0.08 * r(),
      Internet_Service_Fiber_optic: fiber,
      Online_Security_Yes: security,
      Tech_Support_Yes: support,
      Payment_Method_Electronic_check: r() > 0.5 ? 1 : 0,
      Senior_Citizen: r() > 0.83 ? 1 : 0,
      Partner_Yes: r() > 0.5 ? 1 : 0,
      Paperless_Billing: r() > 0.38 ? 1 : 0,
      Dependents_Yes: r() > 0.62 ? 1 : 0,
      Multiple_Lines: r() > 0.5 ? 1 : 0,
      Streaming_TV: r() > 0.5 ? 1 : 0,
      Streaming_Movies: r() > 0.52 ? 1 : 0,
      Phone_Service: r() > 0.08 ? 1 : 0,
      Device_Protection: r() > 0.5 ? 1 : 0,
      Online_Backup: r() > 0.55 ? 1 : 0,
      Gender_Male: r() > 0.5 ? 1 : 0,
      Payment_Auto: r() > 0.65 ? 1 : 0,
      Churn: score > 0 ? 1 : 0,
    };
    return row;
  });
}
const DATA = [
  {
    name: "Telco Customer Churn",
    rows: 7043,
    target: "Churn",
    data: makeRows(65),
  },
  {
    name: "Loan Approval Risk",
    rows: 4269,
    target: "Approved",
    data: makeRows(91).map(({ Churn, ...features }) => ({
      ...features,
      Approved: 1 - Churn,
    })),
  },
  {
    name: "Medical Risk Cohort",
    rows: 3200,
    target: "High_Risk",
    data: makeRows(118).map(({ Churn, ...features }) => ({
      ...features,
      High_Risk: Churn,
    })),
  },
];
const label = (x: string) => x.replaceAll("_", "_");

export default function FeatureSelectionApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [uploaded, setUploaded] = useState<{
      name: string;
      rows: Row[];
      target: string;
    } | null>(null),
    [tab, setTab] = useState("Learn"),
    [rankMode, setRankMode] = useState<RankMode>("importance"),
    [selector, setSelector] = useState("Model-based (XGBoost)"),
    [selected, setSelected] = useState<string[]>(INITIAL_SELECTED),
    [selectionMode, setSelectionMode] = useState("Manual"),
    [status, setStatus] = useState("Saved just now"),
    [collapsed, setCollapsed] = useState(false);
  const go = useLabNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = uploaded?.rows ?? DATA[dataset].data,
    target = uploaded?.target ?? DATA[dataset].target,
    base = useMemo(() => rankNumericFeatures(rows, target), [rows, target]),
    ranking = useMemo(
      () =>
        [...base].sort((a, b) =>
          rankMode === "variance"
            ? b.variance - a.variance
            : rankMode === "correlation"
              ? Math.abs(b.correlation) - Math.abs(a.correlation)
              : b.importance - a.importance,
        ),
      [base, rankMode],
    ),
    selectedSet = new Set(selected),
    perf = selectedPerformance(base, selected.length),
    featureKeys = base.map((x) => x.feature);
  const curve = featureKeys.map((_, i) => selectedPerformance(base, i + 1)),
    top = ranking.slice(0, 10),
    nodes = ranking.slice(0, 10),
    edges = [] as { a: number; b: number; c: number }[];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const c = pearson(
        rows.map((r) => r[nodes[i].feature]),
        rows.map((r) => r[nodes[j].feature]),
      );
      if (Math.abs(c) > 0.12) edges.push({ a: i, b: j, c });
    }
  const positions = nodes.map((_, i) => ({
    x: 255 + Math.cos((i / 10) * Math.PI * 2) * 175,
    y: 200 + Math.sin((i / 10) * Math.PI * 2) * 135,
  }));
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      hs = lines[0].split(",").map((x) => x.trim()),
      vals = lines
        .slice(1)
        .map((l) => l.split(",").map(Number))
        .filter((v) => v.length === hs.length && v.every(Number.isFinite)),
      parsed = vals.map((v) => Object.fromEntries(hs.map((h, i) => [h, v[i]])));
    if (parsed.length < 8 || hs.length < 4) {
      setStatus("CSV needs at least 8 numeric rows and 4 columns");
      return;
    }
    setUploaded({ name: file.name, rows: parsed, target: hs.at(-1)! });
    setSelected(hs.slice(0, -1));
    setStatus(`${file.name} · ${parsed.length} rows loaded`);
  };
  const chooseDataset = (i: number) => {
    setDataset(i);
    setUploaded(null);
    setSelected(
      Object.keys(DATA[i].data[0])
        .filter((x) => x !== DATA[i].target)
        .slice(0, 14),
    );
    setStatus(`${DATA[i].name} loaded`);
  };
  const toggle = (f: string) =>
    setSelected((v) => (v.includes(f) ? v.filter((x) => x !== f) : [...v, f]));
  const reset = () => {
    setSelected(featureKeys.slice(0, 14));
    setRankMode("importance");
    setSelectionMode("Manual");
    setStatus("Selection reset");
  };
  const bulk = (value: string) => {
    if (value === "all") setSelected(featureKeys);
    if (value === "none") setSelected([]);
    if (value === "top10") setSelected(base.slice(0, 10).map((x) => x.feature));
    setStatus(`Bulk action: ${value}`);
  };
  return (
    <div className={`fs-page ${collapsed ? "collapsed" : ""}`}>
      <aside className="fs-side">
        <a href="/" className="brand">
          <i>↻</i>
          <b>
            Mega ML<small>AI OBSERVATORY</small>
          </b>
        </a>
        <button className="home" onClick={() => go("Home")}>
          ⌂　Home
        </button>
        <small>PROJECT</small>
        <select aria-label="Project">
          <option>Churn Prediction</option>
        </select>
        {["♙　Overview", "▤　Data", "⌘　Features"].map((x, i) => (
          <button
            className={i === 2 ? "active" : ""}
            key={x}
            onClick={() => go(x)}
          >
            {x}
          </button>
        ))}
        <button className="sub active">Feature Selection</button>
        <button
          className="sub"
          onClick={() => go("Feature Engineering")}
        >
          Feature Engineering
        </button>
        {["⌘　Train", "⌁　Evaluate", "◇　Deploy"].map((x) => (
          <button key={x} onClick={() => go(x)}>
            {x}
          </button>
        ))}
        <small>RESOURCES</small>
        {[
          "◇　Notebooks",
          "ⓘ　Experiments",
          "▣　Models",
          "▣　Data Registry",
        ].map((x) => (
          <button key={x} onClick={() => go(x)}>
            {x}
          </button>
        ))}
        <section>
          <b>SA　 Sarah A.</b>
          <small>Data Scientist</small>
          <button onClick={() => go("Help")}>?</button>
          <button onClick={() => setStatus("Settings opened")}>⚙</button>
          <button onClick={() => setStatus("Theme toggled")}>☼</button>
          <button
            className="fs-collapse"
            onClick={() => setCollapsed((v) => !v)}
          >
            ≪　Collapse
          </button>
        </section>
      </aside>
      <header className="fs-head">
        <h1>Feature Selection</h1>
        <p>
          Select the most predictive features and reduce noise to improve model
          performance.
        </p>
        <label>
          <small>DATASET</small>
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => chooseDataset(+e.target.value)}
          >
            {DATA.map((d, i) => (
              <option value={i} key={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setStatus("Dataset switcher opened")}>
          ↕ Switch Dataset
        </button>
        <button onClick={() => fileRef.current?.click()}>
          ⇧ Upload Dataset
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".csv,text/csv"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </header>
      <nav className="fs-tabs">
        {TABS.map((x) => (
          <button
            className={tab === x ? "active" : ""}
            key={x}
            onClick={() => {
              setTab(x);
              setStatus(`${x} view selected`);
            }}
          >
            {x}
          </button>
        ))}
      </nav>
      <section className="fs-summary">
        <article>
          <i>◎</i>
          <div>
            <small>OBJECTIVE</small>
            <p>
              Identify and keep features that improve prediction and remove
              redundant or noisy features.
            </p>
          </div>
        </article>
        <article>
          <small>PROGRESS</small>
          <b>
            {selected.length} / {featureKeys.length} features selected
          </b>
          <progress
            max={Math.max(1, featureKeys.length)}
            value={selected.length}
          />
          <span>
            {Math.round(
              (selected.length / Math.max(1, featureKeys.length)) * 100,
            )}
            %
          </span>
        </article>
      </section>
      <main className="fs-main">
        <LabLessonOrWork tab={tab} route="/ml/preprocessing/feature-selection">
        <section className={`ranking panel${labHide(tab, "Visualize", "Train")}`}>
          <h2>FEATURE RANKING (BY {rankMode.toUpperCase()})　ⓘ</h2>
          <div className="rank-tools">
            <span>
              <button
                className={rankMode === "importance" ? "active" : ""}
                onClick={() => setRankMode("importance")}
              >
                Importance
              </button>
              <button
                className={rankMode === "correlation" ? "active" : ""}
                onClick={() => setRankMode("correlation")}
              >
                Correlation
              </button>
            </span>
            <select
              aria-label="Ranking model"
              value={selector}
              onChange={(e) => {
                const value = e.target.value;
                setSelector(value);
                setRankMode(
                  value === "Variance Filter"
                    ? "variance"
                    : value === "Point-Biserial Filter"
                      ? "correlation"
                      : "importance",
                );
              }}
            >
              <option>Model-based (XGBoost)</option>
              <option>Point-Biserial Filter</option>
              <option>Variance Filter</option>
            </select>
          </div>
          <header>#　　FEATURE　　　　　　　　　　　　 IMPORTANCE</header>
          {top.map((f, i) => {
            const v =
                rankMode === "variance"
                  ? f.variance
                  : rankMode === "correlation"
                    ? Math.abs(f.correlation)
                    : f.importance,
              max = Math.max(
                ...top.map((x) =>
                  rankMode === "variance"
                    ? x.variance
                    : rankMode === "correlation"
                      ? Math.abs(x.correlation)
                      : x.importance,
                ),
                0.001,
              );
            return (
              <label key={f.feature}>
                <b>{i + 1}</b>
                <span>{label(f.feature)}</span>
                <i>
                  <em style={{ width: `${(v / max) * 100}%` }} />
                </i>
                <small>{v.toFixed(3)}</small>
                <input
                  aria-label={`Select ${f.feature}`}
                  type="checkbox"
                  checked={selectedSet.has(f.feature)}
                  onChange={() => toggle(f.feature)}
                />
                <u />
              </label>
            );
          })}
          <button
            className="view"
            onClick={() =>
              setStatus(`Viewing all ${featureKeys.length} features`)
            }
          >
            View all {featureKeys.length} features
          </button>
        </section>
        <section className={`network panel${labHide(tab, "Visualize", "Dataset")}`}>
          <h2>FEATURE CORRELATION NETWORK　ⓘ</h2>
          <div className="network-tools">
            <select aria-label="Correlation metric">
              <option>Correlation (|r|)</option>
              <option>Signed correlation</option>
            </select>
            <span>−1.0　　0　　1.0</span>
            <button onClick={() => setStatus("Network view reset")}>
              Reset
            </button>
            <button onClick={() => setStatus("Network expanded")}>⛶</button>
          </div>
          <svg
            viewBox="0 0 510 420"
            role="img"
            aria-label="Feature correlation network"
          >
            {edges.map((e, i) => (
              <line
                className={e.c < 0 ? "neg" : "pos"}
                key={i}
                x1={positions[e.a].x}
                y1={positions[e.a].y}
                x2={positions[e.b].x}
                y2={positions[e.b].y}
                style={{ opacity: 0.2 + Math.abs(e.c) * 0.7 }}
              />
            ))}
            {nodes.map((node, i) => (
              <g key={node.feature}>
                <circle
                  className={selectedSet.has(node.feature) ? "selected" : ""}
                  cx={positions[i].x}
                  cy={positions[i].y}
                  r="38"
                />
                <text x={positions[i].x} y={positions[i].y - 3}>
                  {node.feature.split("_").slice(0, 2).join("_")}
                </text>
                <text x={positions[i].x} y={positions[i].y + 11}>
                  {node.feature.split("_").slice(2).join("_")}
                </text>
              </g>
            ))}
          </svg>
          <footer>
            STRONG NEGATIVE　　　　　　　　 NO CORRELATION　　　　　　　　
            STRONG POSITIVE
          </footer>
        </section>
        </LabLessonOrWork>
      </main>
      <aside className={`fs-controls${labHide(tab, "Train", "Transform", "Visualize")}`}>
        <section>
          <h2>
            SELECTION CONTROLS{" "}
            <select
              aria-label="Bulk actions"
              defaultValue="bulk"
              onChange={(e) => bulk(e.target.value)}
            >
              <option value="bulk" disabled>
                Bulk actions
              </option>
              <option value="all">Select all</option>
              <option value="none">Clear all</option>
              <option value="top10">Top 10</option>
            </select>
          </h2>
          <label>
            Selection mode
            <select
              aria-label="Selection mode"
              value={selectionMode}
              onChange={(e) => {
                setSelectionMode(e.target.value);
                if (e.target.value === "Automatic")
                  setSelected(base.slice(0, 14).map((x) => x.feature));
              }}
            >
              <option>Manual</option>
              <option>Automatic</option>
              <option>Threshold</option>
            </select>
            <span>
              {selected.length} of {featureKeys.length} features selected
            </span>
          </label>
        </section>
        <section className="validation">
          <h2>VALIDATION PERFORMANCE　ⓘ</h2>
          <div>
            <article>
              <small>ROC AUC</small>
              <b>{perf.auc.toFixed(3)}</b>
              <span>↑ {(perf.auc - 0.886).toFixed(3)} vs baseline</span>
            </article>
            <article>
              <small>Log Loss</small>
              <b>{perf.logLoss.toFixed(3)}</b>
              <span>↓ {(0.353 - perf.logLoss).toFixed(3)} vs baseline</span>
            </article>
          </div>
          <h3>Performance vs Number of Selected Features</h3>
          <svg
            viewBox="0 0 350 205"
            role="img"
            aria-label="Feature count performance"
          >
            <g>
              {[30, 70, 110, 150].map((y) => (
                <line key={y} x1="28" x2="335" y1={y} y2={y} />
              ))}
            </g>
            <polyline
              className="auc"
              points={curve
                .map(
                  (p, i) =>
                    `${30 + (i / (curve.length - 1)) * 300},${170 - ((p.auc - 0.65) / 0.35) * 135}`,
                )
                .join(" ")}
            />
            <polyline
              className="loss"
              points={curve
                .map(
                  (p, i) =>
                    `${30 + (i / (curve.length - 1)) * 300},${20 + ((p.logLoss - 0.18) / 0.55) * 150}`,
                )
                .join(" ")}
            />
            <line
              className="marker"
              x1={
                30 +
                ((Math.max(1, selected.length) - 1) /
                  Math.max(1, curve.length - 1)) *
                  300
              }
              x2={
                30 +
                ((Math.max(1, selected.length) - 1) /
                  Math.max(1, curve.length - 1)) *
                  300
              }
              y1="18"
              y2="174"
            />
          </svg>
          <p>
            ◎ Good balance
            <br />
            <span>Adding more features has less impact on performance.</span>
          </p>
          <footer>
            <button onClick={reset}>Reset Selection</button>
            <button
              onClick={() =>
                setStatus(`Saved ${selected.length} selected features`)
              }
            >
              Save Selection
            </button>
          </footer>
          <a href="?advanced=1">Open original feature-selection lab →</a>
        </section>
        <section className="activity">
          <h2>
            RECENT ACTIVITY{" "}
            <button onClick={() => setStatus("All activity opened")}>
              View all
            </button>
          </h2>
          {[
            "⊖　Total_Charges removed　　　　 2m ago",
            "⊕　Tech_Support_Yes added　　　 5m ago",
            "⊕　Payment_Method_Electronic check added　7m ago",
            "⊙　Selection reset　　　　　　 12m ago",
          ].map((x) => (
            <p key={x}>{x}</p>
          ))}
        </section>
      </aside>
      <section className={`fs-insights${labHide(tab, "Metrics")}`}>
        <h2>LINKED INSIGHTS　ⓘ</h2>
        <div>
          {[
            [
              "Redundant Pair",
              "Total_Charges is highly correlated with Monthly_Charges and Tenure. Consider keeping one.",
            ],
            [
              "Strong Predictors",
              "Contract_Month-to-month and Tenure are among the strongest predictors of churn.",
            ],
            [
              "Leakage Check",
              "No data leakage detected with selected features.",
            ],
            [
              "Recommendations",
              "You can try removing 2–3 low impact features with minimal performance loss.",
            ],
          ].map((x, i) => (
            <article key={x[0]} className={`c${i}`}>
              <b>{x[0]}</b>
              <p>{x[1]}</p>
              <button onClick={() => setStatus(`${x[0]} insight opened`)}>
                View insight　→
              </button>
            </article>
          ))}
        </div>
      </section>
      <div className="fs-status">{status}</div>
    </div>
  );
}
