import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CircleHelp, Settings, Star, Upload } from "lucide-react";
import {
  kernelPCA,
  type KernelPCAKernel,
} from "../../../lib/algorithms/dimensionality/kernelPCA";
import "./KernelPCAPage.css";
type Point = { x: number; y: number; label: number };
type Dataset = "rings" | "moons" | "spiral" | "blobs" | "imported";
const rand = (i: number, s: number) => {
  const v = Math.sin((i + 5) * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
function makeData(kind: Exclude<Dataset, "imported">, n = 240): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const label = i % 2,
      t = rand(i, 1) * Math.PI * 2;
    if (kind === "rings") {
      const r = label ? 1 : 2;
      return {
        x: Math.cos(t) * r + (rand(i, 2) - 0.5) * 0.12,
        y: Math.sin(t) * r + (rand(i, 3) - 0.5) * 0.12,
        label,
      };
    }
    if (kind === "moons")
      return {
        x: Math.cos(t / 2 + label * Math.PI) * 1.5 + label,
        y: Math.sin(t / 2 + label * Math.PI) * 1.5 + label * 0.5,
        label,
      };
    if (kind === "spiral") {
      const r = rand(i, 2) * 2;
      return {
        x: Math.cos(r * 3 + label * Math.PI) * r,
        y: Math.sin(r * 3 + label * Math.PI) * r,
        label,
      };
    }
    return {
      x: (label ? 1 : -1) * 1.1 + (rand(i, 2) - 0.5),
      y: (rand(i, 3) - 0.5) * 1.4,
      label,
    };
  });
}
const BUILT = {
  rings: makeData("rings"),
  moons: makeData("moons"),
  spiral: makeData("spiral"),
  blobs: makeData("blobs"),
};
const NAMES: Record<Dataset, string> = {
  rings: "Concentric Rings",
  moons: "Two Moons",
  spiral: "Interlocking Spirals",
  blobs: "Gaussian Blobs",
  imported: "Imported Data",
};
const COLORS = ["#18cad8", "#ff6134"];
export default function KernelPCAPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("rings"),
    [points, setPoints] = useState<Point[]>(BUILT.rings),
    [imported, setImported] = useState<Point[]>([]),
    [kernel, setKernel] = useState<KernelPCAKernel>("rbf"),
    [gamma, setGamma] = useState(5),
    [degree, setDegree] = useState(3),
    [coef0, setCoef0] = useState(0),
    [center, setCenter] = useState(true),
    [normalize, setNormalize] = useState(true),
    [components, setComponents] = useState(6),
    [pointSize, setPointSize] = useState(5),
    [opacity, setOpacity] = useState(0.85),
    [colorBy, setColorBy] = useState("class"),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    X = useMemo(() => points.map((p) => [p.x, p.y]), [points]);
  const result = useMemo(
    () =>
      kernelPCA(X, components, kernel, gamma, degree, coef0, center, normalize),
    [X, components, kernel, gamma, degree, coef0, center, normalize],
  );
  const choose = (kind: Dataset) => {
    const next = kind === "imported" ? imported : BUILT[kind];
    if (!next.length) return;
    setDataset(kind);
    setPoints(next);
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
      .filter(
        (row) => row.length >= 2 && row.slice(0, 2).every(Number.isFinite),
      )
      .map((row, i) => ({
        x: row[0],
        y: row[1],
        label: Number.isFinite(row[2]) ? row[2] : i % 2,
      }));
    if (rows.length < 2)
      return setToast("File needs two numeric feature columns");
    setImported(rows);
    setDataset("imported");
    setPoints(rows);
    setComponents(Math.min(6, rows.length));
    setToast(`Imported ${rows.length} samples`);
    event.target.value = "";
  };
  const pct = (value: number) => 50 + value * 20,
    matrixOrder = Array.from({ length: 1024 }, (_, i) => {
      const row = Math.round((Math.floor(i / 32) / 31) * (points.length - 1)),
        col = Math.round(((i % 32) / 31) * (points.length - 1));
      return result.centeredKernel[row][col];
    }),
    matrixMax = Math.max(...matrixOrder.map(Math.abs), 1e-9),
    cumulative = result.explainedVariance.reduce<number[]>(
      (all, value) => all.concat((all.at(-1) || 0) + value),
      [],
    ),
    pairVariance =
      (result.explainedVariance[0] || 0) + (result.explainedVariance[1] || 0);
  return (
    <div className="kp-page">
      <aside className="kp-side">
        <Link to="/">
          ◉{" "}
          <b>
            MEGA ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        <h4>NAVIGATION</h4>
        {[
          "⌂ Home",
          "◉ Explore",
          "▦ Models",
          "▱ Datasets",
          "♧ Playground",
          "◉ Observatory",
          "▣ Notebooks",
          "◇ Deployments",
        ].map((name) => (
          <button
            className={name.includes("Observatory") ? "active" : ""}
            onClick={() => setToast(name)}
            key={name}
          >
            {name}
          </button>
        ))}
        <h4>RESOURCES</h4>
        {["▤ Docs", "⌁ API Reference", "▣ Changelog"].map((name) => (
          <button onClick={() => setToast(name)} key={name}>
            {name}
          </button>
        ))}
        <footer>
          <small>ACTIVE WORKSPACE</small>
          <button>Kernel Lab⌄</button>
          <p>
            AC <b>Aya Chen</b>
            <small>Pro Plan</small>
          </p>
        </footer>
      </aside>
      <header className="kp-head">
        <h1>
          Kernel PCA <Star />
        </h1>
        <p>
          Discover nonlinear structure by projecting data into a
          high-dimensional space.
        </p>
        <button onClick={() => setToast("Tour resumed")}>▶ Resume Tour</button>
        <BookOpen />
        <CircleHelp />
        <Settings />
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
        <section className="kp-data">
          <label>
            Dataset
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
          </label>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload / Switch Dataset
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
          <span>● {points.length} samples · 2 features</span>
        </section>
        <section className="kp-panels">
          <article>
            <h3>1. Original Space (R²)</h3>
            <div className="kp-scatter axes">
              {points.map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${pct(p.x)}%`,
                    top: `${100 - pct(p.y)}%`,
                    width: pointSize,
                    height: pointSize,
                    opacity,
                    background:
                      colorBy === "class" ? COLORS[p.label % 2] : "#33b7ed",
                  }}
                />
              ))}
            </div>
            <b>x₁</b>
            <em>x₂</em>
          </article>
          <strong>→</strong>
          <article>
            <h3>2. Nonlinear Mapping (ϕ)</h3>
            <div className="kp-bowl">
              <i></i>
              {points.slice(0, 160).map((p, i) => (
                <span
                  key={i}
                  style={{
                    left: `${pct(p.x)}%`,
                    top: `${62 - (p.x * p.x + p.y * p.y) * 7 + p.y * 7}%`,
                    background: COLORS[p.label % 2],
                  }}
                />
              ))}
            </div>
            <b>ϕ₂ / ϕ₂</b>
            <em>ϕ₃</em>
          </article>
          <strong>→</strong>
          <article>
            <h3>3. Kernel PCA Projection (PC₁ vs PC₂)</h3>
            <div className="kp-scatter axes">
              {result.projection.map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${50 + (p[0] || 0) * 30}%`,
                    top: `${50 - (p[1] || 0) * 30}%`,
                    width: pointSize,
                    height: pointSize,
                    opacity,
                    background: COLORS[points[i].label % 2],
                  }}
                />
              ))}
            </div>
            <b>PC₁</b>
            <em>PC₂</em>
          </article>
        </section>
        <section className="kp-results">
          <article>
            <h3>Kernel (Gram) Matrix K</h3>
            <p>Preview (first 200 samples)</p>
            <div className="kp-matrix">
              {matrixOrder.map((value, i) => (
                <i
                  key={i}
                  style={{
                    background: `hsl(${285 - (value / matrixMax) * 220} 85% ${35 + Math.abs(value / matrixMax) * 35}%)`,
                  }}
                />
              ))}
            </div>
          </article>
          <article>
            <h3>Eigenvalue Spectrum</h3>
            <p>Explained variance by component</p>
            <div className="kp-bars">
              {result.eigenvalues.map((value, i) => (
                <i
                  key={i}
                  style={{
                    height: `${Math.max(3, (value / (result.eigenvalues[0] || 1)) * 120)}px`,
                  }}
                >
                  <span>{i + 1}</span>
                </i>
              ))}
              <svg viewBox="0 0 300 130">
                <polyline
                  points={cumulative
                    .map((value, i) => `${15 + i * 45},${120 - value * 105}`)
                    .join(" ")}
                />
              </svg>
            </div>
          </article>
          <article>
            <h3>Explained Variance</h3>
            <div
              className="kp-donut"
              style={{
                background: `conic-gradient(#3155ee 0 ${result.explainedVariance[0] * 100}%,#29b6b9 0 ${pairVariance * 100}%,#ff773c 0 100%)`,
              }}
            >
              <span>
                PC₁ + PC₂
                <br />
                <b>{(pairVariance * 100).toFixed(1)}%</b>
              </span>
            </div>
            <p>
              ■ PC₁ {((result.explainedVariance[0] || 0) * 100).toFixed(1)}%
            </p>
            <p>
              ■ PC₂ {((result.explainedVariance[1] || 0) * 100).toFixed(1)}%
            </p>
          </article>
        </section>
        <footer>
          ✧ Kernel PCA with {kernel.toUpperCase()} kernel recomputed from{" "}
          {points.length} live samples.
          <span>
            <b>Tip:</b> Try varying γ to see under/over-fitting in the
            embedding.
          </span>
        </footer>
      </main>
      <aside className="kp-controls">
        <h4>PARAMETER INSPECTOR</h4>
        <h3>Kernel</h3>
        <div className="kernel-tabs">
          {(
            [
              "rbf",
              "polynomial",
              "sigmoid",
              "laplacian",
              "linear",
            ] as KernelPCAKernel[]
          ).map((name) => (
            <button
              className={kernel === name ? "active" : ""}
              onClick={() => setKernel(name)}
              key={name}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
        <hr />
        <label>
          Gamma (γ) ⓘ{" "}
          <input
            aria-label="Gamma numeric"
            type="number"
            min="0.01"
            max="20"
            step=".1"
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Gamma"
          type="range"
          min=".01"
          max="20"
          step=".1"
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
        />
        <label>
          Degree (d) ⓘ{" "}
          <input
            type="number"
            min="1"
            max="5"
            value={degree}
            onChange={(e) => setDegree(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Degree"
          type="range"
          min="1"
          max="5"
          value={degree}
          onChange={(e) => setDegree(Number(e.target.value))}
        />
        <label>
          Coef. (c₀) ⓘ{" "}
          <input
            type="number"
            min="-5"
            max="5"
            step=".1"
            value={coef0}
            onChange={(e) => setCoef0(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Coefficient"
          type="range"
          min="-5"
          max="5"
          step=".1"
          value={coef0}
          onChange={(e) => setCoef0(Number(e.target.value))}
        />
        <label>
          Center Kernel Matrix{" "}
          <input
            type="checkbox"
            checked={center}
            onChange={(e) => setCenter(e.target.checked)}
          />
        </label>
        <label>
          Normalize Features{" "}
          <input
            type="checkbox"
            checked={normalize}
            onChange={(e) => setNormalize(e.target.checked)}
          />
        </label>
        <label>
          n_components{" "}
          <input
            aria-label="Components"
            type="number"
            min="2"
            max={Math.min(12, points.length)}
            value={components}
            onChange={(e) => setComponents(Number(e.target.value))}
          />
        </label>
        <input
          aria-label="Component count"
          type="range"
          min="2"
          max={Math.min(12, points.length)}
          value={components}
          onChange={(e) => setComponents(Number(e.target.value))}
        />
        <hr />
        <h3>⌃ VIEW OPTIONS</h3>
        <label>
          Point Size{" "}
          <input
            type="number"
            min="2"
            max="9"
            value={pointSize}
            onChange={(e) => setPointSize(Number(e.target.value))}
          />
        </label>
        <label>
          Opacity{" "}
          <input
            type="number"
            min=".1"
            max="1"
            step=".05"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </label>
        <label>
          Color By
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
            <option value="class">Class</option>
            <option value="uniform">Uniform</option>
          </select>
        </label>
        <button
          className="recompute"
          onClick={() => setToast("Kernel PCA recomputed")}
        >
          ⟳ Recompute
        </button>
      </aside>
      {toast && (
        <button className="kp-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
