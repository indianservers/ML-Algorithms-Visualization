import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Moon } from "lucide-react";
import { runAttention } from "../../../lib/algorithms/neural/attention";
import "./TransformerAttentionPage.css";

const sequences = [
  "The cat sat on the mat and looked at the moon",
  "Attention connects every relevant token across the entire sequence",
  "Transformers learn contextual representations without recurrent hidden states",
];
const shown = (vector: number[]) => [
  ...vector.slice(0, 3),
  NaN,
  ...vector.slice(-4),
];

export default function TransformerAttentionPage() {
  const [sequence, setSequence] = useState(sequences[0]),
    [selected, setSelected] = useState(2),
    [layer, setLayer] = useState(5),
    [head, setHead] = useState(3),
    [temperature, setTemperature] = useState(1),
    [causal, setCausal] = useState(false),
    [toast, setToast] = useState("Attention ready");
  const tokens = sequence.split(/\s+/).slice(0, 12),
    index = Math.min(selected, tokens.length - 1),
    result = runAttention(tokens, layer, head, temperature, causal),
    weights = result.weights[index],
    reset = () => {
      setSequence(sequences[0]);
      setSelected(2);
      setLayer(5);
      setHead(3);
      setTemperature(1);
      setCausal(false);
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
        {[
          "⌘ Overview",
          "⚙ Attention",
          "◉ Feed Forward",
          "▱ Layers",
          "♨ Playground",
          "⌘ Comparisons",
          "▤ Notes",
        ].map((item) => (
          <button
            className={item.includes("Attention") ? "active" : ""}
            onClick={() => setToast(item)}
            key={item}
          >
            {item}
          </button>
        ))}
        <button onClick={() => setToast("Theme toggled")}>
          <Moon /> Theme⌄
        </button>
        <button onClick={() => setToast("Help opened")}>
          <HelpCircle /> Help⌄
        </button>
      </aside>
      <header className="attention-head">
        <h1>Transformer Attention ✦</h1>
        <p>
          Explore how a token attends to others. Click any token to see its
          attention flow.
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
            <small>(rows: query position, columns: key position) ⓘ</small>
          </h2>
          <div className="matrix-head">
            {tokens.map((_, i) => (
              <span key={i}>{i}</span>
            ))}
          </div>
          <div className="attention-matrix">
            {result.weights.map((row, r) =>
              row.map((weight, c) => (
                <button
                  aria-label={`query ${r} key ${c}: ${(weight * 100).toFixed(1)}%`}
                  onClick={() => setSelected(r)}
                  className={r === index ? "selected" : ""}
                  style={{
                    background: `rgba(120,70,255,${Math.min(1, weight * 4.5)})`,
                  }}
                  key={`${r}-${c}`}
                />
              )),
            )}
          </div>
        </section>
        <section className="attention-how panel">
          <h2>How Attention Works ⓘ</h2>
          <div className="formula">
            Attention(Q, K, V) = <b>softmax</b>( QKᵀ / √dₖ ) V
          </div>
          {[
            ["1. Embed", "Tokens → Q, K, V"],
            ["2. Score", "QKᵀ / √dₖ"],
            ["3. Softmax", "Normalize rows"],
            ["4. Mix", "Weight V by attention"],
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
          <h3>
            Query Vector — Q₂ <small>(d_model = 768)</small>
          </h3>
          <Vector values={shown(result.query[index])} />
          <h3>
            Key Vectors — Kᵢ <small>(d_model = 768)</small>
          </h3>
          {result.key.map((vector, i) => (
            <div
              className={`vector-row ${i === index ? "active" : ""}`}
              key={i}
            >
              <b>{tokens[i]}</b>
              <Vector values={shown(vector)} />
            </div>
          ))}
          <h3>
            Value Vectors — Vᵢ <small>(d_model = 768)</small>
          </h3>
          <Vector values={shown(result.value[index])} value />
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
            z₂ <small>(for token “{tokens[index]}”)</small>
          </h3>
          <Vector values={shown(result.output[index])} value />
          <p>
            This vector is the weighted sum of all value vectors using the
            attention weights from the selected query.
          </p>
          <button onClick={switchDataset}>Switch Sequence</button>
        </section>
      </aside>
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
