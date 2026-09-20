import { useState } from "react";
import { Link } from "react-router-dom";
import { runAttention } from "../../../lib/algorithms/neural/attention";
import { LAB_TABS, LabLessonOrWork, labHide, useLabTabs } from "../../../components/common/LabTabs";
import { LabHeatmap } from "../../../components/common/LabHeatmap";
import { LabPipeline } from "../../../components/common/LabPipeline";
import "./TransformerAttentionPage.css";

const sequences = [
  "The cat sat on the mat and looked at the moon",
  "Attention connects every relevant token across the entire sequence",
  "Transformers learn contextual representations without recurrent hidden states",
];
const EMBED_DIM = 8;

export default function TransformerAttentionPage() {
  const { tab, setTab } = useLabTabs("Learn");
  const [sequence, setSequence] = useState(sequences[0]),
    [selected, setSelected] = useState(2),
    [layer, setLayer] = useState(5),
    [head, setHead] = useState(3),
    [temperature, setTemperature] = useState(1),
    [causal, setCausal] = useState(false),
    [selectedKey, setSelectedKey] = useState(2),
    [stage, setStage] = useState(3),
    [toast, setToast] = useState("Attention ready");
  const tokens = sequence.split(/\s+/).slice(0, 12),
    index = Math.min(selected, tokens.length - 1),
    keyIndex = Math.min(selectedKey, tokens.length - 1),
    result = runAttention(tokens, layer, head, temperature, causal, EMBED_DIM),
    weights = result.weights[index] ?? [],
    scaleFactor = Math.sqrt(EMBED_DIM) * Math.max(0.1, temperature),
    cellScore = result.scores[index]?.[keyIndex] ?? 0,
    cellWeight = result.weights[index]?.[keyIndex] ?? 0,
    reset = () => {
      setSequence(sequences[0]);
      setSelected(2);
      setLayer(5);
      setHead(3);
      setTemperature(1);
      setCausal(false);
      setSelectedKey(2);
      setToast("View reset");
    },
    switchDataset = () => {
      const next = (sequences.indexOf(sequence) + 1) % sequences.length;
      setSequence(sequences[next]);
      setSelected(0);
      setToast(`Sequence ${next + 1} loaded`);
    };
  return (
    <div className="attention-page">
      <aside className="attention-side">
        <Link to="/">⚛</Link>
        <p className="attention-chrome-note">
          Single-view lab. Layer/head change hashed projection matrices, not a
          pretrained 768-D model.
        </p>
      </aside>
      <header className="attention-head">
        <h1>Transformer Attention ✦</h1>
        <p>
          Educational scaled-dot-product attention on hashed {EMBED_DIM}-D
          embeddings. Click a heatmap cell to inspect that query row. Attention
          weights are similarities, not an explanation of “why” a model decided.
        </p>
        <div>
          <label>
            Layer
            <select
              value={layer}
              onChange={(e) => setLayer(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Head
            <select
              value={head}
              onChange={(e) => setHead(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <nav role="tablist" aria-label="Transformer sections">
          {LAB_TABS.map((name) => (
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
        <nav>
          {tokens.map((token, i) => (
            <button
              className={i === index ? "active" : ""}
              onClick={() => setSelected(i)}
              key={`${token}-${i}`}
            >
              <small>{i}</small>
              {token}
            </button>
          ))}
        </nav>
      </header>
      <LabLessonOrWork tab={tab} route="/ml/deep-learning/transformer-attention">
      <div className={labHide(tab, "Visualize", "Train", "Dataset", "Metrics")}>
      <LabPipeline
        stages={[
          "Tokens",
          "Embeddings",
          "Positional Information",
          "Attention",
          "Feed-Forward",
          "Residual + Norm",
          "Output",
        ]}
        active={stage}
        onSelect={setStage}
        note="Educational scaled-dot-product on hashed 8-D embeddings — not a pretrained Transformer."
      />
      </div>
      <main>
        <section className="attention-flow panel">
          <h2>
            Attention Flow <small>(from selected query token) ⓘ</small>
          </h2>
          <div className="flow-tokens">
            {tokens.map((token, i) => (
              <span
                className={i === index ? "active" : ""}
                key={`${token}-${i}`}
              >
                {token}
              </span>
            ))}
          </div>
          <div className="flow-graph">
            <b>
              Query:<strong>{tokens[index]}</strong>
            </b>
            {weights.map((weight, i) => (
              <i
                style={{
                  height: `${50 + weight * 160}px`,
                  opacity: 0.3 + weight * 2.7,
                  borderColor: `hsl(${250 + weight * 90} 90% 65%)`,
                }}
                key={i}
              />
            ))}
          </div>
          <div className="weight-labels">
            {weights.map((weight, i) => (
              <span key={i}>{(weight * 100).toFixed(1)}%</span>
            ))}
          </div>
          <p>Attention Weight — Low ▬▬▬ High</p>
          <hr />
          <h2>
            Attention Matrix{" "}
            <small>(rows: query token, columns: key token)</small>
          </h2>
          <LabHeatmap
            matrix={result.weights}
            rowLabels={tokens}
            colLabels={tokens}
            selected={{ r: index, c: keyIndex }}
            onSelect={(cell) => {
              setSelected(cell.r);
              setSelectedKey(cell.c);
            }}
            caption="Click a cell: highlight the query row and the attended key. Weights are hashed-embedding similarities."
          />
        </section>
        <section className="attention-how panel">
          <h2>How Attention Works ⓘ</h2>
          <div className="formula">
            Attention(Q, K, V) = <b>softmax</b>( QKᵀ / √dₖ ) V
          </div>
          {[
            ["1. Embed", "Tokens → hashed 8-D Q, K, V (not pretrained)"],
            ["2. Position", "Index is shown; no trained positional encoding in this lab"],
            ["3. Score", "QKᵀ / √dₖ"],
            ["4. Softmax", "Normalize rows"],
            ["5. Mix / FFN / residual", "Output here is attention(V). FFN + residual are conceptual stages in the pipeline."],
          ].map((item) => (
            <article key={item[0]}>
              <b>{item[0]}</b>
              <i>▦ → ▦</i>
              <span>{item[1]}</span>
            </article>
          ))}
        </section>
      </main>
      <aside className="attention-inspector">
        <section className="panel">
          <header>
            <h2>Inspector ⓘ</h2>
            <button onClick={reset}>Reset View</button>
          </header>
          <label>
            Selected Token <small>Index {index}</small>
            <strong>{tokens[index]}</strong>
          </label>
          <p className="cell-inspector">
            Query “{tokens[index]}” × key “{tokens[keyIndex]}”
            <br />
            Raw Q·K {Number.isFinite(cellScore) ? (cellScore * scaleFactor).toFixed(4) : "masked"}
            <br />
            Scale √dₖ·τ {scaleFactor.toFixed(4)}
            <br />
            Scaled score{" "}
            {Number.isFinite(cellScore) ? cellScore.toFixed(4) : "−∞"}
            <br />
            Softmax weight {cellWeight.toFixed(4)}
          </p>
          <h3>
            Query Vector — Q{index}{" "}
            <small>(d_model = {EMBED_DIM})</small>
          </h3>
          <Vector values={result.query[index] ?? []} />
          <h3>
            Key Vectors — Kᵢ <small>(d_model = {EMBED_DIM})</small>
          </h3>
          {result.key.map((vector, i) => (
            <div
              className={`vector-row ${i === index ? "active" : ""}`}
              key={i}
            >
              <b>{tokens[i]}</b>
              <Vector values={vector} />
            </div>
          ))}
          <h3>
            Value Vectors — Vᵢ <small>(d_model = {EMBED_DIM})</small>
          </h3>
          <Vector values={result.value[index] ?? []} value />
          <hr />
          <div className="head-step">
            <label>
              Head
              <button onClick={() => setHead(Math.max(1, head - 1))}>‹</button>
              <b>{head} / 12</b>
              <button onClick={() => setHead(Math.min(12, head + 1))}>›</button>
            </label>
            <label>
              Temperature τ <b>{temperature.toFixed(1)}</b>
              <input
                aria-label="Attention temperature"
                type="range"
                min="0.2"
                max="2"
                step="0.1"
                value={temperature}
                onInput={(e) => setTemperature(Number(e.currentTarget.value))}
              />
            </label>
          </div>
          <label className="mask">
            Causal Mask ⓘ{" "}
            <input
              type="checkbox"
              checked={causal}
              onChange={(e) => setCausal(e.target.checked)}
            />
          </label>
        </section>
        <section className="panel output">
          <h2>
            Output <small>(contextualized embedding) ⓘ</small>
          </h2>
          <h3>
            z{index} <small>(for token “{tokens[index]}”)</small>
          </h3>
          <Vector values={result.output[index] ?? []} value />
          <p>
            This vector is the weighted sum of all value vectors using the
            attention weights from the selected query.
          </p>
          <button onClick={switchDataset}>Switch Sequence</button>
        </section>
      </aside>
      </LabLessonOrWork>
      <footer>{toast}</footer>
    </div>
  );
}

function Vector({
  values,
  value = false,
}: {
  values: number[];
  value?: boolean;
}) {
  return (
    <div className={`vector ${value ? "value" : ""}`}>
      {values.map((number, index) => (
        <span key={index}>
          {Number.isNaN(number) ? "…" : number.toFixed(2)}
        </span>
      ))}
    </div>
  );
}
