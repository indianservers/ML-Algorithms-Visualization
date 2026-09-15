import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Share2, Upload } from "lucide-react";
import {
  createFewShotEpisode,
  type FewShotMetric,
} from "../../../lib/algorithms/neural/fewShot";
import FewShotMobileNetLab from "./FewShotMobileNetLab";
import "./FewShotLearningPage.css";

const names = [
    "bird",
    "frog",
    "ship",
    "car",
    "dog",
    "cat",
    "plane",
    "deer",
    "horse",
    "truck",
  ],
  colors = [
    "#26c3d6",
    "#8bdd43",
    "#f39122",
    "#8c5bea",
    "#ef5060",
    "#43a6ff",
    "#ffd13c",
    "#56d19c",
    "#d870dc",
    "#ff7d52",
  ],
  glyphs = ["🐦", "🐸", "⛵", "🚗", "🐶", "🐱", "✈️", "🦌", "🐴", "🚚"];
export default function FewShotLearningPage() {
  const [advanced, setAdvanced] = useState(false),
    [nWay, setNWay] = useState(5),
    [kShot, setKShot] = useState(5),
    [batch, setBatch] = useState(false),
    [metric, setMetric] = useState<FewShotMetric>("euclidean"),
    [embedding, setEmbedding] = useState("hash-a"),
    [datasetFamily, setDatasetFamily] = useState(3),
    [boundaries, setBoundaries] = useState(true),
    [distances, setDistances] = useState(true),
    [seed, setSeed] = useState(3),
    [toast, setToast] = useState("Ready");
  const episode = createFewShotEpisode(
      nWay,
      kShot,
      batch ? 5 : 1,
      metric,
      seed +
        datasetFamily +
        (embedding === "hash-b" ? 17 : embedding === "hash-c" ? 29 : 0),
    ),
    query = episode.queries[0],
    prediction = episode.predictions[0],
    world = (v: number, axis: "x" | "y") =>
      axis === "x" ? 50 + (v / 8) * 100 : 50 - (v / 7) * 100;
  const reset = () => {
    setNWay(5);
    setKShot(5);
    setBatch(false);
    setMetric("euclidean");
    setEmbedding("hash-a");
    setBoundaries(true);
    setDistances(true);
    setDatasetFamily(3);
    setSeed(3);
    setToast("Parameters reset");
  };
  if (advanced)
    return (
      <div className="few-advanced">
        <button onClick={() => setAdvanced(false)}>
          ← Return to Episode Visualizer
        </button>
        <FewShotMobileNetLab />
      </div>
    );
  return (
    <div className="few-page">
      <aside className="few-side">
        <Link to="/">
          ⌘ <b>Mega ML</b>
          <small>AI Observatory</small>
        </Link>
        <h4>NAVIGATION</h4>
        {[
          "⌂ Home",
          "☷ Topics",
          "⌘ Playground",
          "♧ Experiments",
          "◇ Models",
          "▤ Datasets",
          "⌂ Uploads",
        ].map((item) => (
          <button onClick={() => setToast(item)} key={item}>
            {item}
          </button>
        ))}
        <h4>RECENT</h4>
        {[
          "▣ Few-Shot Learning",
          "⌘ Prototypical Networks",
          "◇ Metric Learning",
          "♧ Image Classification",
          "ⓘ Cluster Analysis",
        ].map((item) => (
          <button
            className={item.includes("Few-Shot") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <h4>SHORTCUTS</h4>
        <button>◉ New Experiment</button>
        <button>⌑ Saved Views</button>
        <button>⇩ Export Report</button>
        <p>
          Active Model
          <br />
          <b>Prototypical Net</b>
          <small>● Ready</small>
        </p>
      </aside>
      <header className="few-head">
        <h3>
          ◉ Learn › <b>Few-Shot Learning</b>
        </h3>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Build / Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((tab) => (
            <button
              className={tab === "Learn" ? "active" : ""}
              onClick={() =>
                tab === "Build / Train"
                  ? setAdvanced(true)
                  : setToast(`${tab} selected`)
              }
              key={tab}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div>
          <button>?</button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button onClick={() => setToast("Theme toggled")}>
            <Moon />
          </button>
          <b>MM</b>
        </div>
      </header>
      <main>
        <section className="few-title panel">
          <h1>⚙ Few-Shot Learning</h1>
          <p>
            Explore how few-shot learning classifies queries by comparing them
            to class prototypes in an embedding space.
          </p>
          <label>
            DATASET
            <select
              value={datasetFamily}
              onChange={(e) => setDatasetFamily(Number(e.target.value))}
            >
              <option value={3}>Synthetic 2-D class blobs A</option>
              <option value={9}>Synthetic 2-D class blobs B</option>
            </select>
          </label>
          <button onClick={() => setAdvanced(true)}>
            <Upload /> Upload / Switch
          </button>
        </section>
        <section className="few-plot panel">
          <header>
            <h3>EMBEDDING SPACE (first 2 dimensions)</h3>
            <span>
              <i /> Support (K-shot) — ○ Query — × Prototype —
              {boundaries ? "--- Decision Boundary" : ""}
            </span>
          </header>
          <svg viewBox="0 0 900 420">
            {boundaries &&
              episode.prototypes.map((p, i) => (
                <line
                  className="boundary"
                  x1="450"
                  y1="210"
                  x2={world(p.x, "x") * 9}
                  y2={world(p.y, "y") * 4.2}
                  key={i}
                />
              ))}
            {distances &&
              episode.prototypes.map((p, i) => (
                <line
                  className="distance"
                  x1={world(query.x, "x") * 9}
                  y1={world(query.y, "y") * 4.2}
                  x2={world(p.x, "x") * 9}
                  y2={world(p.y, "y") * 4.2}
                  style={{ stroke: colors[i] }}
                  key={i}
                />
              ))}
            {episode.points
              .filter((p) => p.support)
              .map((p, i) => (
                <circle
                  cx={world(p.x, "x") * 9}
                  cy={world(p.y, "y") * 4.2}
                  r="5"
                  fill={colors[p.classIndex]}
                  key={i}
                />
              ))}
            {episode.prototypes.map((p, i) => (
              <text
                x={world(p.x, "x") * 9 - 7}
                y={world(p.y, "y") * 4.2 + 8}
                fill={colors[i]}
                fontSize="25"
                key={i}
              >
                ×
              </text>
            ))}
            {episode.queries.map((p, i) => (
              <circle
                className="query"
                cx={world(p.x, "x") * 9}
                cy={world(p.y, "y") * 4.2}
                r="8"
                key={i}
              />
            ))}
          </svg>
          <aside>
            <h3>CLASSES (N)</h3>
            {names.slice(0, nWay).map((name, i) => (
              <p style={{ color: colors[i] }} key={name}>
                ● {name}
              </p>
            ))}
            <hr />
            <h3>Nearest Prototype</h3>
            <b style={{ color: colors[prediction.classIndex] }}>
              ★ {names[prediction.classIndex]}
            </b>
            <p>
              Distance
              <br />
              {prediction.distance.toFixed(2)}
            </p>
          </aside>
          <div className="plot-tools">
            <button>⌁</button>
            <button>✥</button>
            <button>−</button>
            <button>＋</button>
          </div>
        </section>
        <section className="few-results panel">
          <h3>CURRENT EPISODE RESULTS</h3>
          <div>
            <article>
              <small>Query ({episode.queries.length})</small>
              <b className="photo">{glyphs[query.classIndex]}</b>
            </article>
            <article>
              <small>Predicted Class</small>
              <b style={{ color: colors[prediction.classIndex] }}>
                ★ {names[prediction.classIndex]}
              </b>
              <p>Softmax of exp(−distance)</p>
              <strong>{prediction.probability.toFixed(2)}</strong>
              <meter min="0" max="1" value={prediction.probability} />
            </article>
            <article>
              <small>Nearest Prototype</small>
              <b style={{ color: colors[prediction.classIndex] }}>
                × {names[prediction.classIndex]}
              </b>
              <p>Distance</p>
              <strong>{prediction.distance.toFixed(2)}</strong>
            </article>
            <article>
              <small>All Distances</small>
              {prediction.distances.map((d, i) => (
                <p key={i}>
                  <b style={{ color: colors[i] }}>★ {names[i]}</b>
                  <meter
                    min="0"
                    max={Math.max(...prediction.distances)}
                    value={d}
                  />
                  {d.toFixed(2)}
                </p>
              ))}
            </article>
            <article>
              <small>Episode Summary</small>
              <p>
                N-way <b>{nWay}</b>
              </p>
              <p>
                K-shot <b>{kShot}</b>
              </p>
              <p>
                Total Support <b>{nWay * kShot}</b>
              </p>
              <p>
                Total Queries <b>{episode.queries.length}</b>
              </p>
            </article>
          </div>
        </section>
        <section className="few-prototypes panel">
          <h3>CLASS PROTOTYPES ⓘ</h3>
          <div>
            {episode.prototypes.map((p, i) => (
              <article style={{ borderColor: colors[i] }} key={i}>
                <b style={{ color: colors[i] }}>× {names[i]}</b>
                <span>{glyphs[i]}</span>
                <small>
                  ({p.x.toFixed(1)}, {p.y.toFixed(1)})
                </small>
              </article>
            ))}
          </div>
        </section>
      </main>
      <aside className="few-controls">
        <section className="panel">
          <header>
            <h3>PARAMETERS</h3>
            <button onClick={reset}>Reset</button>
          </header>
          <label>
            N-way ⓘ <b>{nWay}</b>
            <input
              aria-label="N-way"
              type="range"
              min="2"
              max="10"
              value={nWay}
              onInput={(e) => setNWay(Number(e.currentTarget.value))}
            />
          </label>
          <label>
            K-shot ⓘ <b>{kShot}</b>
            <input
              aria-label="K-shot"
              type="range"
              min="1"
              max="10"
              value={kShot}
              onInput={(e) => setKShot(Number(e.currentTarget.value))}
            />
          </label>
          <h4>QUERY MODE</h4>
          <div>
            <button
              className={!batch ? "active" : ""}
              onClick={() => setBatch(false)}
            >
              Single Query
            </button>
            <button
              className={batch ? "active" : ""}
              onClick={() => setBatch(true)}
            >
              Batch Queries
            </button>
          </div>
          <label>
            DISTANCE METRIC
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as FewShotMetric)}
            >
              <option value="euclidean">Euclidean (L2)</option>
              <option value="cosine">Cosine</option>
            </select>
          </label>
          <label>
            EMBEDDING
            <select
              value={embedding}
              onChange={(e) => {
                setEmbedding(e.target.value);
                setToast("Embedding seed family changed");
              }}
            >
              <option value="hash-a">Hashed 2-D features A</option>
              <option value="hash-b">Hashed 2-D features B</option>
              <option value="hash-c">Hashed 2-D features C</option>
            </select>
          </label>
          <label className="toggle">
            Show Decision Boundaries
            <input
              type="checkbox"
              checked={boundaries}
              onChange={(e) => setBoundaries(e.target.checked)}
            />
          </label>
          <label className="toggle">
            Show Distances
            <input
              type="checkbox"
              checked={distances}
              onChange={(e) => setDistances(e.target.checked)}
            />
          </label>
          <button className="episode" onClick={() => setSeed(seed + 1)}>
            ⟳ New Episode
          </button>
          <p className="tip">
            ⓘ An episode samples N classes and K examples per class as support.
            The model classifies query examples by nearest prototype.
          </p>
        </section>
      </aside>
      <footer>
        <span>
          ⓘ Tip: Try increasing N-way or K-shot and observe how the decision
          boundaries and accuracy change.
        </span>
        <label>
          Auto New Episode{" "}
          <input
            type="checkbox"
            onChange={(e) => e.target.checked && setSeed(seed + 1)}
          />
        </label>
        <button onClick={() => setSeed(seed + 1)}>Next Episode ›</button>
        <em>{toast}</em>
      </footer>
    </div>
  );
}
