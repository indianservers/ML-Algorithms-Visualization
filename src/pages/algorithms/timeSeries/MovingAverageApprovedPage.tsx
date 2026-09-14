/* eslint-disable no-irregular-whitespace */
import { useRef, useState } from "react";
import {
  movingAverageAnalysis,
  type MovingAverageAlignment,
} from "../../../lib/timeSeries/movingAverage";
import "./MovingAverageApprovedPage.css";

type Point = { time: string; value: number };
const TABS = [
  "Learn",
  "Visualize",
  "Dataset",
  "Transform",
  "Metrics",
  "Compare",
  "Explain",
];
function series(seed: number, n = 720) {
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => ({
    time: `2024-05-${String(4 + Math.floor(i / 24)).padStart(2, "0")} ${String(i % 24).padStart(2, "0")}:00`,
    value:
      2200 +
      1.05 * i +
      260 * Math.sin((i * Math.PI) / 12) +
      180 * Math.sin((i * Math.PI) / 84) +
      (rnd() - 0.5) * 520,
  }));
}
const DATA = [
  { name: "Metro Energy Load (Hourly)", rows: 2160, points: series(67) },
  {
    name: "Retail Demand (Hourly)",
    rows: 1488,
    points: series(93).map((p, i) => ({
      ...p,
      value: p.value * 0.72 + 320 * Math.sin(i / 30),
    })),
  },
  {
    name: "Server Traffic (Hourly)",
    rows: 4320,
    points: series(121).map((p, i) => ({
      ...p,
      value: p.value * 1.18 + (i % 96 === 0 ? 700 : 0),
    })),
  },
];
function path(
  values: number[],
  w: number,
  h: number,
  min: number,
  max: number,
) {
  const step = Math.max(1, Math.ceil(values.length / 260)),
    pts = values
      .map((v, i) => ({ v, i }))
      .filter((_, i) => i % step === 0)
      .filter((x) => Number.isFinite(x.v));
  return pts
    .map(
      (x, j) =>
        `${j ? "L" : "M"} ${(x.i / (values.length - 1)) * w} ${h - ((x.v - min) / (max - min || 1)) * h}`,
    )
    .join(" ");
}

export default function MovingAverageApprovedPage() {
  const [dataset, setDataset] = useState(0),
    [uploaded, setUploaded] = useState<{
      name: string;
      points: Point[];
    } | null>(null),
    [tab, setTab] = useState("Visualize"),
    [windowSize, setWindowSize] = useState(24),
    [alignment, setAlignment] = useState<MovingAverageAlignment>("trailing"),
    [lag, setLag] = useState(0),
    [range, setRange] = useState("30D"),
    [visible, setVisible] = useState([true, true, true, true]),
    [theme, setTheme] = useState(0),
    [status, setStatus] = useState("View synced across tabs"),
    [collapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const source = uploaded?.points ?? DATA[dataset].points,
    limit =
      { "7D": 168, "30D": 720, "90D": 2160, "1Y": 8760, All: source.length }[
        range
      ] ?? source.length,
    points = source.slice(-Math.min(source.length, limit)),
    values = points.map((p) => p.value),
    analysis = movingAverageAnalysis(values, windowSize, alignment, lag),
    min = Math.min(...values) * 0.88,
    max = Math.max(...values) * 1.05,
    resMin = Math.min(...analysis.residual.filter(Number.isFinite), -1),
    resMax = Math.max(...analysis.residual.filter(Number.isFinite), 1),
    absMax = Math.max(...analysis.absoluteResidual.filter(Number.isFinite), 1),
    expected = alignment === "trailing" ? (windowSize - 1) / 2 : 0;
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/),
      headers = lines[0].split(",").map((x) => x.trim()),
      rows = lines.slice(1).map((line) => line.split(","));
    const parsed = rows
      .map((row, i) => ({
        time: row[0] || String(i),
        value: Number(row.at(-1)),
      }))
      .filter((x) => Number.isFinite(x.value));
    if (parsed.length < 12 || headers.length < 2) {
      setStatus("CSV needs time and numeric value columns");
      return;
    }
    setUploaded({ name: file.name, points: parsed });
    setStatus(`${file.name} · ${parsed.length} points loaded`);
  };
  const reset = () => {
    setWindowSize(24);
    setAlignment("trailing");
    setLag(0);
    setVisible([true, true, true, true]);
    setTheme(0);
    setStatus("View reset");
  };
  return (
    <div className={`ma-page t${theme} ${collapsed ? "collapsed" : ""}`}>
      <aside className="ma-side">
        <a className="logo" href="/">
          <i>〽</i>
          <b>
            Mega ML<small>AI Observatory</small>
          </b>
        </a>
        <button className="ma-collapse" onClick={() => setCollapsed((v) => !v)}>
          ≪
        </button>
        {[
          "⌂　Home",
          "▣　Learn",
          "▤　Datasets",
          "⌘　Models",
          "◇　Playground",
          "△　Experiments",
          "▣　Deployments",
          "▤　Reports",
          "⚙　Settings",
        ].map((x, i) => (
          <button
            className={i === 1 ? "active" : ""}
            key={x}
            onClick={() => setStatus(`${x.slice(2)} opened`)}
          >
            {x}
          </button>
        ))}
        <footer>
          <button onClick={() => setStatus("Upgrade opened")}>
            🚀　Upgrade
          </button>
          <span>
            <b>M</b>　Megan M.
          </span>
        </footer>
      </aside>
      <header className="ma-head">
        <p>
          Lesson · Time Series　›　<b>Moving Average</b>
        </p>
        <div>
          <button onClick={() => setStatus("Help opened")}>?</button>
          <button onClick={() => setTheme((v) => (v + 1) % 5)}>☀</button>
          <b>MM</b>
        </div>
        <button onClick={() => setStatus("View exported")}>⇧ Export</button>
        <button onClick={() => setStatus("View saved")}>Save View</button>
      </header>
      <section className="ma-title">
        <h1>
          <i>⌁</i> Moving Average <b>Time Series</b>
        </h1>
        <p>
          Smooth short-term noise to reveal longer-term trends using a sliding
          average window.
        </p>
        <article>
          <small>OBJECTIVE</small>
          <span>
            Understand how the window size (n) affects smoothing,
            <br />
            lag, and how residuals capture what the average misses.
          </span>
        </article>
        <article>
          <small>PROGRESS</small>
          <span>4 / 6 steps</span>
          <progress max="6" value="4" />
          <b>67%</b>
        </article>
      </section>
      <nav className="ma-tabs">
        {TABS.map((x, i) => (
          <button
            className={tab === x ? "active" : ""}
            key={x}
            onClick={() => {
              setTab(x);
              setStatus(`${x} selected`);
            }}
          >
            {["⌁", "🚀", "▤", "▣", "▥", "▦", "⌾"][i]}　{x}
          </button>
        ))}
      </nav>
      <section className="ma-toolbar">
        <label>
          Dataset{" "}
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(+e.target.value);
              setUploaded(null);
              setStatus(`${DATA[+e.target.value].name} loaded`);
            }}
          >
            {DATA.map((d, i) => (
              <option value={i} key={d.name}>
                ●　{d.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => fileRef.current?.click()}>⇧ Upload CSV</button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
        <div>
          {["7D", "30D", "90D", "1Y", "All"].map((x) => (
            <button
              className={range === x ? "active" : ""}
              key={x}
              onClick={() => setRange(x)}
            >
              {x}
            </button>
          ))}
          <button onClick={() => setStatus("Calendar opened")}>▣</button>
          <button onClick={() => setStatus("Charts expanded")}>⛶</button>
        </div>
      </section>
      <main className="ma-main">
        <section className="chart raw">
          <h2>Raw Signal & Moving Average　ⓘ</h2>
          <div className="legend">
            <span>— Raw Load</span>
            <span>— Moving Average (n={windowSize})</span>
            <span>▱ Window</span>
          </div>
          <svg
            viewBox="0 0 920 190"
            role="img"
            aria-label="Raw load and moving average chart"
          >
            <g>
              {[25, 70, 115, 160].map((y) => (
                <line key={y} x1="45" x2="910" y1={y} y2={y} />
              ))}
            </g>
            {visible[0] && (
              <path
                className="signal"
                d={path(values, 865, 155, min, max)}
                transform="translate(45 15)"
              />
            )}
            {visible[1] && (
              <path
                className="average"
                d={path(analysis.average, 865, 155, min, max)}
                transform="translate(45 15)"
              />
            )}
            {visible[2] && (
              <rect
                className="window"
                x="470"
                y="16"
                width="165"
                height="154"
              />
            )}
            <text x="535" y="154">
              n = {windowSize}
            </text>
          </svg>
        </section>
        <section className="chart residual">
          <h2>Residual (Raw − Moving Average)</h2>
          <svg viewBox="0 0 920 95" role="img" aria-label="Residual chart">
            <line x1="45" x2="910" y1="48" y2="48" />
            {visible[3] && (
              <path
                d={path(analysis.residual, 865, 76, resMin, resMax)}
                transform="translate(45 10)"
              />
            )}
          </svg>
        </section>
        <section className="chart abs-residual">
          <h2>Absolute Residual</h2>
          <svg
            viewBox="0 0 920 95"
            role="img"
            aria-label="Absolute residual chart"
          >
            <line x1="45" x2="910" y1="82" y2="82" />
            <path
              d={path(analysis.absoluteResidual, 865, 72, 0, absMax)}
              transform="translate(45 10)"
            />
          </svg>
        </section>
      </main>
      <aside className="ma-controls">
        <label>
          WINDOW (n)
          <span>
            <input
              aria-label="Window size"
              type="range"
              min="1"
              max="168"
              value={windowSize}
              onInput={(e) => setWindowSize(+e.currentTarget.value)}
              onChange={(e) => setWindowSize(+e.target.value)}
            />
            <b>{windowSize}</b> hours
          </span>
          <small>1　　　　　　　　　　　　　　　　　168</small>
        </label>
        <label>
          ALIGNMENT
          <div>
            <button
              className={alignment === "trailing" ? "active" : ""}
              onClick={() => setAlignment("trailing")}
            >
              Trailing
            </button>
            <button
              className={alignment === "centered" ? "active" : ""}
              onClick={() => setAlignment("centered")}
            >
              Centered
            </button>
          </div>
        </label>
        <label>
          LAG (for comparison)
          <span>
            <input
              aria-label="Lag"
              type="range"
              min="-48"
              max="48"
              value={lag}
              onInput={(e) => setLag(+e.currentTarget.value)}
              onChange={(e) => setLag(+e.target.value)}
            />
            <b>{lag}</b> hours
          </span>
          <small>-48　　　　　　　　　　　　　　　　　48</small>
        </label>
        <label>
          DISPLAY
          {[
            "Raw Signal",
            "Moving Average",
            "Window",
            "Residual (Raw − MA)",
          ].map((x, i) => (
            <span className="check" key={x}>
              <input
                type="checkbox"
                aria-label={x}
                checked={visible[i]}
                onChange={() =>
                  setVisible((v) => v.map((z, j) => (j === i ? !z : z)))
                }
              />
              {x}
            </span>
          ))}
        </label>
        <label>
          THEME
          <div className="themes">
            {[0, 1, 2, 3, 4].map((i) => (
              <button
                aria-label={`Theme ${i + 1}`}
                className={theme === i ? "active" : ""}
                key={i}
                onClick={() => setTheme(i)}
              />
            ))}
          </div>
        </label>
        <button onClick={reset}>↻　Reset</button>
        <a href="?advanced=1">Open original lab →</a>
      </aside>
      <section className="ma-insights">
        <article>
          <h2>✥　Key Insight</h2>
          <p>
            A window of {windowSize} hours smooths daily fluctuations while
            preserving weekly patterns.
          </p>
        </article>
        <article>
          <h2>♨　Window Effect</h2>
          <div>
            <span>
              Less Smooth
              <br />
              (n small)
            </span>
            <b>{windowSize}</b>
            <span>
              More Smooth
              <br />
              (n large)
            </span>
          </div>
          <progress max="168" value={windowSize} />
        </article>
        <article>
          <h2>♧　Lag Guide</h2>
          <p>
            {alignment === "trailing" ? "Trailing" : "Centered"} MA{" "}
            {alignment === "trailing" ? "lags" : "aligns with"} the raw signal
            by{" "}
            {alignment === "trailing"
              ? "~ (n−1)/2 hours."
              : "using observations around each point."}
            <br />
            For n={windowSize}, expected lag ≈ {expected.toFixed(1)} hours.
          </p>
          <b>Expected Lag ≈ {expected.toFixed(1)}h</b>
        </article>
        <article>
          <h2>▣　When to Use</h2>
          <p>
            Use moving average to reduce noise, identify trends, and as a
            baseline for forecasting.
          </p>
        </article>
      </section>
      <footer className="ma-foot">
        Dataset:　{uploaded?.name ?? DATA[dataset].name}　　 Rows:　
        {uploaded
          ? points.length.toLocaleString()
          : DATA[dataset].rows.toLocaleString()}
        　　 Range:　May 4 – Jun 2, 2024　　 Freq:　1 hour{" "}
        <span>●　{status}</span>
      </footer>
    </div>
  );
}
