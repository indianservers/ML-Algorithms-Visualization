import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleHelp, Moon, Upload } from "lucide-react";
import {
  umap,
  type UMAPMetric,
} from "../../../lib/algorithms/dimensionality/umap";
import { getDimensionalityDataset } from "../../../lib/dimensionality/dimensionalityDatasets";
import {
  LAB_TABS,
  LabLessonPanel,
  useLabTabs,
} from "../../../components/common/LabTabs";
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
  digits = getDimensionalityDataset("e-digit-glyphs"),
  blobs = getDimensionalityDataset("c-hd-blobs"),
  iris = getDimensionalityDataset("d-iris"),
  swiss = getDimensionalityDataset("f-swiss-roll"),
  circles = getDimensionalityDataset("g-concentric");
const toSamples = (item: ReturnType<typeof getDimensionalityDataset>): Sample[] =>
  item.X.map((values, i) => ({ values, label: item.y?.[i] ?? 0 }));
const BUILT = {
    digits: toSamples(digits),
    fashion: toSamples(blobs),
    objects: toSamples(swiss),
    news: toSamples(circles),
    cells: toSamples(blobs),
    iris: toSamples(iris),
  },
  NAMES: Record<Dataset, string> = {
    digits: "Digit glyphs (8×8)",
    fashion: "High-D blobs",
    objects: "Swiss roll",
    news: "Concentric circles",
    cells: "High-D blobs (copy)",
    iris: "Iris",
    imported: "Imported Data",
  };
export default function UMAPConceptPage() {
  const { tab, setTab, panel, lesson } = useLabTabs("Visualize");
  const [dataset, setDataset] = useState<Dataset>("digits"),
    [samples, setSamples] = useState<Sample[]>(BUILT.digits),
    [imported, setImported] = useState<Sample[]>([]),
    [neighbors, setNeighbors] = useState(15),
    [minDist, setMinDist] = useState(0.1),
    [metric, setMetric] = useState<UMAPMetric>("euclidean"),
    [seed, setSeed] = useState(42),
    [spread, setSpread] = useState(1),
    [densmap, setDensmap] = useState(false),
    [angular, setAngular] = useState(false),
    [toast, setToast] = useState(""),
    [status, setStatus] = useState<"NOT RUN" | "RUNNING" | "COMPLETED" | "STALE" | "ERROR">("NOT RUN"),
    [umapResult, setUmapResult] = useState<ReturnType<typeof umap> | null>(null),
    [inspectIndex, setInspectIndex] = useState(0);
  const abortRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const runUmap = () => {
    abortRef.current = false;
    setStatus("RUNNING");
    try {
      const n = samples.length;
      const k = Math.min(Math.max(2, neighbors), n - 1);
      const usedMetric: UMAPMetric = angular ? "cosine" : metric;
      const computed = umap(
        samples.map((sample) => sample.values),
        k,
        minDist,
        usedMetric,
        seed,
        spread,
        180,
        () => abortRef.current,
      );
      if (abortRef.current) {
        setStatus("NOT RUN");
        setUmapResult(null);
        return;
      }
      setUmapResult(computed);
      setStatus("COMPLETED");
      setToast("UMAP-like embedding computed");
    } catch (cause) {
      setUmapResult(null);
      setStatus("ERROR");
      setToast(cause instanceof Error ? cause.message : "UMAP failed");
    }
  };
  useEffect(() => {
    runUmap();
    return () => {
      abortRef.current = true;
    };
    // First educational embedding only; later runs require Recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skipStale = useRef(true);
  useEffect(() => {
    setStatus((current) => {
      if (skipStale.current) {
        skipStale.current = false;
        return current;
      }
      return current === "NOT RUN" || current === "ERROR" ? current : "STALE";
    });
  }, [samples, neighbors, minDist, metric, seed, spread, angular]);
  const result = umapResult ?? {
    embedding: [] as number[][],
    edges: [],
    neighbors: [] as ReturnType<typeof umap>["neighbors"],
    trustworthiness: 0,
    continuity: 0,
    distanceCorrelation: 0,
    incomplete: false,
  };
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
      abortRef.current = true;
      setNeighbors(15);
      setMinDist(0.1);
      setMetric("euclidean");
      setSeed(42);
      setSpread(1);
      setDensmap(false);
      setAngular(false);
      setUmapResult(null);
      setStatus("NOT RUN");
    };
  const coords = result.embedding
      .flat()
      .map(Math.abs)
      .sort((a, b) => a - b),
    scale = coords[Math.floor(coords.length * 0.92)] || 1,
    plot = (v: number) => Math.max(4, Math.min(96, 50 + (v / scale) * 42)),
    classes = Array.from(new Set(samples.map((s) => s.label))),
    silhouettes = classes.map(() => result.trustworthiness);
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
        <nav role="tablist" aria-label="UMAP sections">
          {LAB_TABS.map((n) => (
            <button
              role="tab"
              aria-selected={tab === n}
              className={tab === n ? "active" : ""}
              onClick={() => setTab(n)}
              key={n}
            >
              {n}
            </button>
          ))}
        </nav>
        {lesson && (
          <LabLessonPanel
            tab={tab}
            route="/ml/dimensionality-reduction/umap-concept"
          />
        )}
        {status === "RUNNING" ? (
          <p className="um-busy">Recomputing embedding…</p>
        ) : status === "STALE" ? (
          <p className="um-busy">Parameters changed — click Recompute Embedding.</p>
        ) : null}
        <section
          className={`um-panels${panel("Visualize", "Dataset", "Build / Train")}`}
        >
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
        <section
          className={`um-results${panel("Visualize", "Build / Train", "Metrics")}`}
        >
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
            <p>Sampled pair distance correlation = {result.distanceCorrelation.toFixed(3)}</p>
          </article>
          <article>
            <h3>Neighborhood trustworthiness (same value per class; not silhouette)</h3>
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
          n_neighbors — how local vs global the embedding behaves
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
          {neighbors >= samples.length ? (
            <small>n_neighbors must be &lt; n. Using {Math.max(2, samples.length - 1)}.</small>
          ) : null}
        </label>
        <label>
          min_dist — packing tightness in the 2D picture
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
          densmap ⓘ (not implemented in this browser UMAP-like optimizer)
          <input type="checkbox" checked={densmap} disabled />
        </label>
        <label>
          angular_rp_forest ⓘ (switches neighbor metric to cosine)
          <input
            type="checkbox"
            checked={angular}
            onChange={(e) => setAngular(e.target.checked)}
          />
        </label>
        <button
          className="primary"
          onClick={runUmap}
        >
          Recompute Embedding ▶
        </button>
        <p>State: {status}. New-sample UMAP transform is not supported (no official UMAP transform API here). Do not approximate by nearest plotted point.</p>
        {result.incomplete && <p>Optimization incomplete.</p>}
        <label>
          Neighbor inspect sample
          <input
            type="number"
            min={0}
            max={Math.max(0, samples.length - 1)}
            value={inspectIndex}
            onChange={(e) => setInspectIndex(Number(e.target.value))}
          />
        </label>
        <table>
          <thead>
            <tr><th>Rank</th><th>ID</th><th>Distance</th></tr>
          </thead>
          <tbody>
            {(result.neighbors[inspectIndex] ?? []).slice(0, 8).map((row) => (
              <tr key={row.id}>
                <td>{row.rank}</td>
                <td>{row.id}</td>
                <td>{row.distance.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            Trustworthiness <b>{result.trustworthiness.toFixed(3)}</b>
          </p>
          <p>
            Continuity <b>{result.continuity.toFixed(3)}</b>
          </p>
          <p>
            This page runs a real neighbor-graph + attraction/repulsion optimizer in the browser. It is UMAP-like, not the official umap-js package. Out-of-sample transform is not supported.
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
