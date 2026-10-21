import type { StateFrame } from "./neural";
import type { NeuralKind } from "./types";
import { fmt } from "./types";
import { Panel, Slider } from "./components";
export function NeuralInspector({
  kind,
  frames,
  index,
  onIndex,
}: {
  kind: NeuralKind;
  frames: StateFrame[];
  index: number;
  onIndex: (n: number) => void;
}) {
  const step = Math.min(index, frames.length - 1),
    frame = frames[step];
  return (
    <Panel
      title={`${kind.toUpperCase()} · recurrent state flow`}
      className="tsw-architecture"
    >
      <div className="tsw-flow-diagram">
        <div>
          <small>Input sequence</small>
          <strong>xₜ</strong>
          <span>{frame ? fmt(frame.input, 4) : "Scaled observation"}</span>
        </div>
        <span className="tsw-flow-arrow">→</span>
        <div className="tsw-cell-diagram">
          <small>
            {kind === "lstm"
              ? "LSTM cell state cₜ"
              : kind === "gru"
                ? "GRU hidden state hₜ"
                : "Recurrent hidden state hₜ"}
          </small>
          <div className="tsw-gate-row">
            {(kind === "lstm"
              ? ["Forget", "Input", "Candidate", "Output"]
              : kind === "gru"
                ? ["Update", "Reset", "Candidate"]
                : ["Hidden state"]
            ).map((gate, i) => (
              <div
                key={gate}
                style={{
                  borderColor: ["#f363ad", "#36baff", "#f7bd58", "#2ce3b4"][i],
                }}
              >
                <strong>{gate}</strong>
                <span>
                  {frame?.gates[gate]
                    ? fmt(
                        frame.gates[gate].reduce((a, b) => a + b, 0) /
                          frame.gates[gate].length,
                        4,
                      )
                    : frame && kind === "rnn"
                      ? fmt(
                          frame.hidden.reduce((a, b) => a + b, 0) /
                            frame.hidden.length,
                          4,
                        )
                      : "Train to inspect"}
                </span>
              </div>
            ))}
          </div>
          <p>
            {kind === "lstm"
              ? "cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ   →   hₜ = oₜ ⊙ f(cₜ)"
              : kind === "gru"
                ? "hₜ = zₜ ⊙ hₜ₋₁ + (1 − zₜ) ⊙ gₜ"
                : "hₜ = f(Wxₜ + Uhₜ₋₁ + b)"}
          </p>
        </div>
        <span className="tsw-flow-arrow">→</span>
        <div>
          <small>Readout → next input</small>
          <strong>ŷₜ₊₁</strong>
          <span>Recursive forecasting</span>
        </div>
      </div>
      {frame ? (
        <>
          <div
            className="tsw-sequence-strip"
            aria-label="Input sequence states"
          >
            {frames.map((state, i) => (
              <button
                key={i}
                className={i === step ? "is-selected" : ""}
                onClick={() => onIndex(i)}
                aria-label={`Inspect input step ${i + 1}`}
              >
                <small>xₜ₋{frames.length - i - 1}</small>
                <strong>{fmt(state.input, 3)}</strong>
                <span>
                  h̄{" "}
                  {fmt(
                    state.hidden.reduce((a, b) => a + b, 0) /
                      state.hidden.length,
                    3,
                  )}
                </span>
              </button>
            ))}
          </div>
          <p className="tsw-muted">
            Previous hidden-state mean:{" "}
            {fmt(
              step > 0
                ? frames[step - 1].hidden.reduce((a, b) => a + b, 0) /
                    frames[step - 1].hidden.length
                : 0,
              4,
            )}{" "}
            → current mean:{" "}
            {fmt(
              frame.hidden.reduce((a, b) => a + b, 0) / frame.hidden.length,
              4,
            )}
            .{" "}
            {kind === "lstm" &&
              `Cell mean: ${fmt(frame.cell.reduce((a, b) => a + b, 0) / frame.cell.length, 4)}.`}
          </p>
          <Slider
            label="Inspect recurrent time step"
            min={0}
            max={frames.length - 1}
            value={step}
            onChange={onIndex}
          />
          <p className="tsw-muted">
            Input values use training-only scaling. Exact first-layer
            computation using trained TensorFlow.js weights, activation and gate
            convention. Gate tiles show means across units. Other stacked layers
            remain in the prediction graph.
          </p>
          <div className="tsw-state-grid">
            {Object.entries({
              ...frame.gates,
              Hidden: frame.hidden,
              ...(kind === "lstm" ? { Cell: frame.cell } : {}),
            }).map(([name, values]) => (
              <div key={name}>
                <strong>{name}</strong>
                <div className="tsw-heatmap">
                  {values.map((value, j) => (
                    <span
                      key={j}
                      title={`${name} unit ${j + 1}: ${value.toFixed(6)}`}
                      style={{
                        background: `hsl(${value < 0 ? 280 : 170} 75% ${20 + Math.min(1, Math.abs(value)) * 40}%)`,
                      }}
                    >
                      {j + 1}
                    </span>
                  ))}
                </div>
                <small>
                  min {fmt(Math.min(...values), 4)} · max{" "}
                  {fmt(Math.max(...values), 4)}
                </small>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="tsw-notice">
          Train the model to inspect real activations. The architecture above
          explains the equations; no untrained gate values or forecast intervals
          are fabricated.
        </p>
      )}
    </Panel>
  );
}
