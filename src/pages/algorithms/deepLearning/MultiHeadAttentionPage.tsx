import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  FileText,
  Play,
  RotateCcw,
  Save,
  Share2,
  Sun,
  Upload,
} from "lucide-react";
import { runMultiHeadAttention } from "../../../lib/algorithms/neural/attention";
import "./MultiHeadAttentionPage.css";

const initialRows = [
  "The cat sat on the mat . <EOS>",
  "The dog chased the ball . <EOS>",
  "Transformers are powerful . <EOS>",
  "Attention is all you need . <EOS>",
  "Deep learning is fun ! <EOS>",
];
const colors = [
  "#24d7ee",
  "#73dc55",
  "#ffc13a",
  "#fb62a0",
  "#9d6dff",
  "#ff7c3c",
  "#42a2ff",
  "#48dfba",
];
const focuses = [
  "Independent projection 1",
  "Independent projection 2",
  "Independent projection 3",
  "Independent projection 4",
  "Independent projection 5",
  "Independent projection 6",
  "Independent projection 7",
  "Independent projection 8",
];

export default function MultiHeadAttentionPage() {
  const [rows, setRows] = useState(initialRows),
    [rowIndex, setRowIndex] = useState(0),
    [modelDim, setModelDim] = useState(512),
    [headCount, setHeadCount] = useState(4),
    [dropout, setDropout] = useState(0.1),
    [attentionDropout, setAttentionDropout] = useState(0.1),
    [bias, setBias] = useState(true),
    [causal, setCausal] = useState(false),
    [view, setView] = useState("All Heads"),
    [toast, setToast] = useState("All changes saved");
  const tokens = rows[rowIndex].split(/\s+/).filter(Boolean).slice(0, 10);
  let result: ReturnType<typeof runMultiHeadAttention>;
  let architectureError = "";
  try {
    result = runMultiHeadAttention(
      tokens,
      headCount,
      1,
      causal,
      attentionDropout,
      bias,
      modelDim,
      dropout,
    );
  } catch (error) {
    architectureError =
      error instanceof Error
        ? error.message
        : "Embedding dimension must be divisible by heads.";
    result = {
      heads: [],
      averageWeights: [],
      concatenated: tokens.map(() => []),
      projected: tokens.map(() => []),
      headDim: 0,
    };
  }
  const visibleHeads =
      view === "All Heads"
        ? result.heads
        : result.heads.length
          ? [
              result.heads[
                Math.min(result.heads.length - 1, Math.max(0, Number(view.split(" ")[1]) - 1))
              ],
            ]
          : [];
  const headDim = result.headDim || Math.floor(modelDim / Math.max(1, headCount));
  const outputNorm = Math.hypot(...(result.projected[0] ?? []));
  const reset = () => {
    setRows(initialRows);
    setRowIndex(0);
    setModelDim(512);
    setHeadCount(4);
    setDropout(0.1);
    setAttentionDropout(0.1);
    setBias(true);
    setCausal(false);
    setView("All Heads");
    setToast("Multi-head attention reset");
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => {
        let next: string[];
        try {
          const parsed = JSON.parse(text);
          next = (Array.isArray(parsed) ? parsed : parsed.rows).map(String);
        } catch {
          next = text.split(/\r?\n/).map((line) => line.split(",")[0]);
        }
        next = next
          .map((value) => value.trim())
          .filter(Boolean)
          .slice(0, 20);
        if (!next.length) {
          setToast("No text sequences found");
          return;
        }
        setRows(next);
        setRowIndex(0);
        setToast(`${file.name}: ${next.length} sequences loaded`);
      })
      .catch(() => setToast("Could not read dataset"));
    event.target.value = "";
  };
  return (
    <div className="mha-page">
      <aside className="mha-side">
        <Link to="/">
          ◆ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <h4>NAVIGATION</h4>
        {[
          "⌂ Home",
          "⌘ Playground",
          "◇ Models",
          "▤ Datasets",
          "▣ Lessons",
          "□ Projects",
          "♟ Experiments",
          "◉ Deployments",
        ].map((item) => (
          <button
            className={item.includes("Lessons") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <h4>RECENT LESSONS</h4>
        {[
          "● Multi-Head Attention",
          "○ Scaled Dot-Product Attention",
          "○ Positional Encoding",
          "○ Transformers Overview",
          "○ Layer Normalization",
        ].map((item) => (
          <button onClick={() => setToast(item)} key={item}>
            {item}
          </button>
        ))}
        <h4>RESOURCES</h4>
        {[
          "▤ Documentation",
          "▱ Research Library",
          "▧ Cheat Sheets",
          "⌕ Community",
        ].map((item) => (
          <button onClick={() => setToast(item)} key={item}>
            {item}
          </button>
        ))}
        <p>
          ◎ <b>Pro Plan</b>
          <small>Credits: 12,450</small>
        </p>
      </aside>
      <header className="mha-head">
        <h1>
          Multi-Head Attention <Bookmark />
        </h1>
        <p>
          See independent attention heads (separate Q/K/V slices) and the
          concatenated projection. Heads are not guaranteed to specialize as
          “syntax vs semantics.”
        </p>
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
              className={tab === "Visualize" ? "active" : ""}
              onClick={() => setToast(`${tab} selected`)}
              key={tab}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div>
          <button onClick={() => setToast("Documentation opened")}>
            <FileText /> Docs
          </button>
          <button onClick={() => setToast("Share link copied")}>
            <Share2 /> Share
          </button>
          <button onClick={() => setToast("Theme toggled")}>
            <Sun />
          </button>
          <button onClick={() => setToast("Attention run complete")}>
            <b>Run</b>
            <Play />
          </button>
        </div>
      </header>
      <main>
        <section className="mha-input panel">
          <h3>INPUT SEQUENCE ⓘ</h3>
          <div>
            {tokens.map((token, index) => (
              <span
                style={{ borderColor: colors[index % colors.length] }}
                key={`${token}-${index}`}
              >
                <small>{index}</small>
                {token}
              </span>
            ))}
          </div>
        </section>
        <section className="mha-heads panel">
          <header>
            <h3>ATTENTION HEADS ({headCount} heads)</h3>
            <label>
              View:{" "}
              <select value={view} onChange={(e) => setView(e.target.value)}>
                <option>All Heads</option>
                {result.heads.map((_, index) => (
                  <option key={index}>Head {index + 1}</option>
                ))}
              </select>
            </label>
          </header>
          <div className="head-grid">
            {visibleHeads.map((head, displayIndex) => {
              const actual =
                view === "All Heads"
                  ? displayIndex
                  : Number(view.split(" ")[1]) - 1;
              return (
                <article
                  style={{ borderColor: colors[actual % colors.length] }}
                  key={actual}
                >
                  <h3 style={{ color: colors[actual % colors.length] }}>
                    Head {actual + 1}
                  </h3>
                  <p>Focus: {focuses[actual]}</p>
                  <Heatmap
                    matrix={head.weights}
                    tokens={tokens}
                    color={colors[actual % colors.length]}
                  />
                </article>
              );
            })}
          </div>
          <h3>MULTI-HEAD ATTENTION PIPELINE</h3>
          <div className="mha-pipeline">
            <b>
              Input
              <br />X
            </b>
            <span>→</span>
            <b>
              Linear Projections
              <br />
              <i>Q₁ K₁ V₁ … Qₕ Kₕ Vₕ</i>
            </b>
            <span>→</span>
            <b>
              Scaled Dot-Product
              <br />
              Attention (per head)
            </b>
            <span>→</span>
            <b>
              Concatenate
              <br />({result.concatenated[0].length} values)
            </b>
            <span>→</span>
            <b>
              Linear Projection
              <br />
              Wₒ
            </b>
            <span>→</span>
            <b>
              Output
              <br />Z · ‖{outputNorm.toFixed(2)}‖
            </b>
          </div>
        </section>
        <section className="mha-bottom panel">
          <article>
            <h3>ATTENTION SUMMARY</h3>
            <table>
              <tbody>
                <tr>
                  <th>Head</th>
                  <th>Top Focus</th>
                  <th>Key Relations Captured</th>
                </tr>
                {result.heads.slice(0, 4).map((_, index) => (
                  <tr key={index}>
                    <td style={{ color: colors[index] }}>● {index + 1}</td>
                    <td>{focuses[index]}</td>
                    <td>
                      {
                        [
                          "Adjacent words, short contexts",
                          "Subject-object links",
                          "Distant dependencies",
                          "Phrases & grammar patterns",
                        ][index]
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article>
            <h3>HEAD COMPARISON</h3>
            <div className="radar">
              {result.heads.slice(0, 4).map((head, index) => (
                <i
                  style={{
                    width: `${50 + head.weights[0][0] * 160}px`,
                    height: `${50 + head.weights[1][1] * 160}px`,
                    borderColor: colors[index],
                    transform: `rotate(${index * 35}deg)`,
                  }}
                  key={index}
                />
              ))}
            </div>
          </article>
          <article>
            <h3>
              ATTENTION FLOW <small>(Avg. across heads)</small>
            </h3>
            <Heatmap
              matrix={result.averageWeights}
              tokens={tokens}
              color="#8c6dff"
            />
          </article>
        </section>
      </main>
      <aside className="mha-controls">
        <section className="panel">
          <header>
            <h3>PARAMETERS</h3>
            <button onClick={() => setToast("Preset selected")}>
              Presets⌄
            </button>
            <button onClick={reset}>
              <RotateCcw />
            </button>
          </header>
          <label>
            Model Dim (d_model)
            <select
              value={modelDim}
              onChange={(e) => setModelDim(Number(e.target.value))}
            >
              {[128, 256, 512, 768].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Number of Heads (h)
            <select
              value={headCount}
              onChange={(e) => {
                setHeadCount(Number(e.target.value));
                setView("All Heads");
              }}
            >
              {[2, 3, 4, 6, 8].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Head Dim (d_k = d_model / h)<b>{headDim}</b>
          </label>
          <label>
            Dropout{" "}
            <input
              aria-label="Output dropout"
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={dropout}
              onInput={(e) => setDropout(Number(e.currentTarget.value))}
            />
            <b>{dropout.toFixed(2)}</b>
          </label>
          <label>
            Attention Dropout{" "}
            <input
              aria-label="Attention dropout"
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={attentionDropout}
              onInput={(e) =>
                setAttentionDropout(Number(e.currentTarget.value))
              }
            />
            <b>{attentionDropout.toFixed(2)}</b>
          </label>
          <div className="switch-row">
            Bias
            <input
              aria-label="Bias"
              type="checkbox"
              checked={bias}
              onChange={(event) => setBias(event.target.checked)}
            />
          </div>
          <div className="switch-row">
            Causal Mask
            <input
              aria-label="Causal Mask"
              type="checkbox"
              checked={causal}
              onChange={(event) => {
                setCausal(event.target.checked);
                setToast(
                  event.target.checked
                    ? "Causal mask enabled"
                    : "Causal mask disabled",
                );
              }}
            />
          </div>
        </section>
        <section className="panel dataset">
          <label>
            DATASET
            <select>
              <option>Sample: Simple Sentences</option>
              <option>Imported Text</option>
            </select>
          </label>
          <label className="upload">
            <Upload /> Upload your dataset <small>.txt, .json, .csv</small>
            <input type="file" accept=".txt,.json,.csv" onChange={upload} />
          </label>
          <table>
            <tbody>
              {rows.slice(0, 5).map((row, index) => (
                <tr
                  className={index === rowIndex ? "active" : ""}
                  onClick={() => setRowIndex(index)}
                  key={`${row}-${index}`}
                >
                  <td>{index + 1}</td>
                  <td>{row}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Showing 1 to {Math.min(5, rows.length)} of {rows.length}
          </p>
        </section>
      </aside>
      <footer>
        <em>
          Multi-Head Attention allows the model to attend to information from
          different representation subspaces.
        </em>
        <span>{architectureError ? `Error: ${architectureError}` : toast}</span>
        <button onClick={() => setToast("Experiment saved")}>
          <Save /> Save
        </button>
      </footer>
    </div>
  );
}

function Heatmap({
  matrix,
  tokens,
  color,
}: {
  matrix: number[][];
  tokens: string[];
  color: string;
}) {
  return (
    <div
      className="mha-heatmap"
      style={{ gridTemplateColumns: `44px repeat(${tokens.length}, 1fr)` }}
    >
      <i />
      {tokens.map((token, index) => (
        <i key={index}>{token}</i>
      ))}
      {matrix.flatMap((row, r) => [
        <i key={`l-${r}`}>{tokens[r]}</i>,
        ...row.map((value, c) => (
          <span
            title={`${(value * 100).toFixed(1)}%`}
            style={{
              background: color,
              opacity: 0.08 + Math.min(0.92, value * 5),
            }}
            key={`${r}-${c}`}
          />
        )),
      ])}
    </div>
  );
}
