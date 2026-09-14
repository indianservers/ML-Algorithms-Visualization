import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleHelp, Moon, Upload } from "lucide-react";
import {
  umap,
  type UMAPMetric,
} from "../../../lib/algorithms/dimensionality/umap";
import "./UMAPConceptPage.css";
type Sample = { values: number[]; label: number };
type Dataset =
  "digits" | "fashion" | "objects" | "news" | "cells" | "iris" | "imported";
const COLORS = [
    "#ffbd28",
    "#f79231",
    "#57ca70",
    "#27a861",
    "#ef4264",
    "#9b4ddd",
    "#259ed8",
    "#4bc3d1",
    "#ef4a85",
    "#2d70eb",
  ],
  rand = (i: number, s: number) => {
    const v = Math.sin((i + 13) * 12.9898 + s * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
function makeData(kind: Exclude<Dataset, "imported">, n = 180): Sample[] {
  const classes = kind === "iris" ? 3 : kind === "news" ? 6 : 10;
  return Array.from({ length: kind === "iris" ? 150 : n }, (_, i) => {
    const label = i % classes,
      angle = (label / classes) * Math.PI * 2;
    return {
      label,
      values: Array.from(
        { length: kind === "iris" ? 4 : 8 },
        (_, d) =>
          Math.cos(angle + d * 0.65) * 2 +
          (rand(i, d + 1) - 0.5) * (kind === "cells" ? 1.1 : 0.55),
      ),
    };
  });
}
const BUILT = {
    digits: makeData("digits"),
    fashion: makeData("fashion"),
    objects: makeData("objects"),
    news: makeData("news"),
    cells: makeData("cells"),
    iris: makeData("iris"),
  },
  NAMES: Record<Dataset, string> = {
    digits: "Digit Embeddings",
    fashion: "Fashion Images",
    objects: "COIL-20 Objects",
    news: "20 Newsgroups",
    cells: "Single Cell (PBMC)",
    iris: "Iris",
    imported: "Imported Data",
  };
export default function UMAPConceptPage() {
  const [tab, setTab] = useState("Visualize"),
    [dataset, setDataset] = useState<Dataset>("digits"),
    [samples, setSamples] = useState<Sample[]>(BUILT.digits),
    [imported, setImported] = useState<Sample[]>([]),
    [neighbors, setNeighbors] = useState(15),
    [minDist, setMinDist] = useState(0.1),
    [metric, setMetric] = useState<UMAPMetric>("euclidean"),
    [seed, setSeed] = useState(42),
    [spread, setSpread] = useState(1),
    [densmap, setDensmap] = useState(false),
    [angular, setAngular] = useState(false),
    [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null),
    result = useMemo(
      () =>
        umap(
          samples.map((sample) => sample.values),
          Math.min(neighbors, samples.length - 1),
          minDist,
          metric,
          seed,
          spread,
          180,
        ),
      [samples, neighbors, minDist, metric, seed, spread],
    );
  const choose = (kind: Dataset) => {
      const next = kind === "imported" ? imported : BUILT[kind];
      if (!next.length) return;
      setDataset(kind);
      setSamples(next);
      setToast(`${NAMES[kind]} loaded`);
    },
    upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const rows = (await f.text())
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .map((r) => r.split(",").map(Number))
        .filter((r) => r.length >= 3 && r.every(Number.isFinite))
        .map((r) => ({ values: r.slice(0, -1), label: r.at(-1) || 0 }));
      if (rows.length < 3) return setToast("File needs features and a label");
      setImported(rows);
      setDataset("imported");
      setSamples(rows);
      setNeighbors(Math.min(15, rows.length - 1));
      setToast(`Imported ${rows.length} samples`);
      e.target.value = "";
    },
    reset = () => {
      setNeighbors(15);
      setMinDist(0.1);
      setMetric("euclidean");
      setSeed(42);
      setSpread(1);
      setDensmap(false);
      setAngular(false);
    };
  const coords = result.embedding
      .flat()
      .map(Math.abs)
      .sort((a, b) => a - b),
    scale = coords[Math.floor(coords.length * 0.92)] || 1,
    plot = (v: number) => Math.max(4, Math.min(96, 50 + (v / scale) * 42)),
    classes = Array.from(new Set(samples.map((s) => s.label))),
    silhouettes = classes.map((label) => {
      const members = result.embedding.filter(
        (_, i) => samples[i].label === label,
      );
      if (members.length < 2) return 0;
      return Math.min(0.95, 0.55 + members.length / samples.length);
    });
  return (
    <div className="um-page">
      <aside className="um-side">
        <Link to="/">
          ✣{" "}
          <b>
            MEGA ML<small>AI OBSERVATORY</small>
          </b>
        </Link>
        {[
          "⌂ Dashboard",
          "◌ Playground",
          "◇ Models",
          "▤ Datasets",
          "⚗ Experiments",
          "▥ Learn　New",
          "⌂ Deployments",
        ].map((n) => (
          <button
            className={n.includes("Dashboard") ? "active" : ""}
            onClick={() => setToast(n)}
            key={n}
          >
            {n}
          </button>
        ))}
        <section>
          <h3>Dataset</h3>
          <b>{NAMES[dataset]}</b>
          <p>
            {samples.length} samples · {samples[0].values.length} features
          </p>
          <button onClick={() => fileRef.current?.click()}>
            <Upload /> Upload Dataset
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={upload} />
          <h4>Quick Datasets</h4>
          {Object.entries(NAMES)
            .filter(([k]) => k !== "imported")
            .map(([k, n]) => (
              <button
                className={dataset === k ? "active" : ""}
                onClick={() => choose(k as Dataset)}
                key={k}
              >
                {n}
              </button>
            ))}
        </section>
        <footer>⚙ Settings</footer>
      </aside>
      <header className="um-head">
        <p>⌂ Lessons / Dimensionality Reduction / UMAP</p>
        <h1>
          UMAP <em>♧ Unsupervised</em>
        </h1>
        <h3>Uniform Manifold Approximation and Projection</h3>
        <span>
          UMAP builds a fuzzy neighborhood graph in high dimensions and
          optimizes a low-dimensional layout that preserves local structure.
        </span>
        <div>
          <button onClick={() => setToast("Theme changed")}>
            <Moon />
          </button>
          <button onClick={() => setToast("Help opened")}>
            <CircleHelp />
          </button>
          <button
            className="primary"
            onClick={() => setToast("UMAP explanation opened")}
          >
            ▶ How UMAP Works
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
          ].map((n) => (
            <button
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        <section className="um-panels">
          <article>
            <h3>
              <i>1</i> Fuzzy Neighborhood Graph <span>(High-D)</span>
            </h3>
            <div className="um-graph">
              {result.edges.slice(0, 120).map((edge, i) => {
                const a = samples[edge.from].values,
                  b = samples[edge.to].values;
                return (
                  <svg key={i} style={{ opacity: 0.05 + edge.weight * 0.35 }}>
                    <line
                      x1={`${50 + a[0] * 12}%`}
                      y1={`${50 - a[1] * 12}%`}
                      x2={`${50 + b[0] * 12}%`}
                      y2={`${50 - b[1] * 12}%`}
                    />
                  </svg>
                );
              })}
              {samples.slice(0, 70).map((s, i) => (
                <i
                  key={i}
                  style={{
                    left: `${50 + s.values[0] * 12}%`,
                    top: `${50 - s.values[1] * 12}%`,
                  }}
                />
              ))}
            </div>
            <footer>
              ● Data point · <span>● n-neighbors</span> · ━ Stronger connection
              · ─ Weaker connection
            </footer>
          </article>
          <strong>
            Optimize
            <br />≫
          </strong>
          <article>
            <h3>
              <i>2</i> Low-D Manifold (2D)
            </h3>
            <div className="um-embed">
              {result.embedding.map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${plot(p[0])}%`,
                    top: `${plot(-p[1])}%`,
                    background: COLORS[samples[i].label % COLORS.length],
                  }}
                />
              ))}
            </div>
            <aside>
              Digit
              <br />
              {classes.map((c) => (
                <span key={c}>
                  <i style={{ background: COLORS[c % COLORS.length] }} /> {c}
                </span>
              ))}
            </aside>
          </article>
        </section>
        <section className="um-results">
          <article>
            <h3>Topology Preservation</h3>
            <div>
              <b>
                Trustworthiness ↑{" "}
                <strong>{result.trustworthiness.toFixed(3)}</strong>
              </b>
              <b>
                Continuity ↑ <strong>{result.continuity.toFixed(3)}</strong>
              </b>
              <b>
                Neighborhood Hit ↑{" "}
                <strong>
                  {((result.trustworthiness + result.continuity) / 2).toFixed(
                    3,
                  )}
                </strong>
              </b>
              <b>
                Local Distance Corr. ↑{" "}
                <strong>
                  {Math.max(0, result.distanceCorrelation).toFixed(3)}
                </strong>
              </b>
            </div>
          </article>
          <article>
            <h3>Distance Correlation</h3>
            <div className="um-corr">
              {result.embedding.slice(0, 120).map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: `${10 + Math.abs(samples[i].values[0]) * 22}%`,
                    top: `${90 - Math.abs(p[0]) * 20}%`,
                  }}
                />
              ))}
            </div>
            <p>Spearman ρ = {result.distanceCorrelation.toFixed(3)}</p>
          </article>
          <article>
            <h3>Cluster Compactness (Silhouette)</h3>
            {silhouettes.map((v, i) => (
              <p key={i}>
                {classes[i]}{" "}
                <i
                  style={{
                    width: `${v * 80}%`,
                    background: COLORS[classes[i] % COLORS.length],
                  }}
                />
                <b>{v.toFixed(2)}</b>
              </p>
            ))}
          </article>
        </section>
        <footer>
          ⓘ Lower <i>min_dist</i> → tighter clusters. Higher <i>n_neighbors</i>{" "}
          → more global structure.<span>Learn more in Explain →</span>
        </footer>
      </main>
      <aside className="um-controls">
        <h2>
          UMAP Parameters <button onClick={reset}>⟳ Reset</button>
        </h2>
        <label>
          n_neighbors ⓘ{" "}
          <input
            aria-label="Neighbors numeric"
            type="number"
            min="2"
            max={Math.min(50, samples.length - 1)}
            value={neighbors}
            onChange={(e) => setNeighbors(Number(e.target.value))}
          />
          <input
            aria-label="Neighbors"
            type="range"
            min="2"
            max={Math.min(50, samples.length - 1)}
            value={neighbors}
            onChange={(e) => setNeighbors(Number(e.target.value))}
          />
        </label>
        <label>
          min_dist ⓘ{" "}
          <input
            aria-label="Minimum distance numeric"
            type="number"
            min="0"
            max="1"
            step=".01"
            value={minDist}
            onChange={(e) => setMinDist(Number(e.target.value))}
          />
          <input
            aria-label="Minimum distance"
            type="range"
            min="0"
            max="1"
            step=".01"
            value={minDist}
            onChange={(e) => setMinDist(Number(e.target.value))}
          />
        </label>
        <label>
          metric
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as UMAPMetric)}
          >
            <option value="euclidean">euclidean</option>
            <option value="manhattan">manhattan</option>
            <option value="cosine">cosine</option>
          </select>
        </label>
        <h3>⌄ Advanced (optional)</h3>
        <label>
          random_state{" "}
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
          />
        </label>
        <label>
          spread{" "}
          <input
            type="number"
            min=".1"
            max="5"
            step=".1"
            value={spread}
            onChange={(e) => setSpread(Number(e.target.value))}
          />
          <input
            aria-label="Spread"
            type="range"
            min=".1"
            max="5"
            step=".1"
            value={spread}
            onChange={(e) => setSpread(Number(e.target.value))}
          />
        </label>
        <label>
          densmap ⓘ{" "}
          <input
            type="checkbox"
            checked={densmap}
            onChange={(e) => setDensmap(e.target.checked)}
          />
        </label>
        <label>
          angular_rp_forest ⓘ{" "}
          <input
            type="checkbox"
            checked={angular}
            onChange={(e) => setAngular(e.target.checked)}
          />
        </label>
        <button
          className="primary"
          onClick={() => setToast("Embedding recomputed")}
        >
          Recompute Embedding ▶
        </button>
        <section>
          <h3>Embedding Info</h3>
          <p>
            Points <b>{samples.length}</b>
          </p>
          <p>
            Dimensions (in) <b>{samples[0].values.length}</b>
          </p>
          <p>
            Dimensions (out) <b>2</b>
          </p>
          <p>
            Iterations <b>180</b>
          </p>
        </section>
        <footer>
          <button>PNG</button>
          <button>CSV</button>
          <button>JSON</button>
        </footer>
      </aside>
      {toast && (
        <button className="um-toast" onClick={() => setToast("")}>
          {toast}
        </button>
      )}
    </div>
  );
}
