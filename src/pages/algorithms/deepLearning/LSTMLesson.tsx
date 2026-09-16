import { Link } from "react-router-dom";
import type { LSTMStep, SequenceModelRow } from "../../../lib/algorithms/neural/lstm";
import {
  LSTM_BEATS,
  LSTM_QUIZ,
  LSTM_WHEN_NOT,
  type LSTMBeat,
  type LSTMLabSequence,
} from "../../../lib/algorithms/neural/lstmLab";

export function LSTMLearnPanel({
  active,
  previous,
  step,
  sequence,
  beat,
  quizIndex,
  quizChoice,
  onBeat,
  onOpenVisualize,
  onQuiz,
}: {
  active: LSTMStep;
  previous?: LSTMStep;
  step: number;
  sequence: LSTMLabSequence;
  beat: LSTMBeat;
  quizIndex: number;
  quizChoice: number | null;
  onBeat: (beat: LSTMBeat) => void;
  onOpenVisualize: (beat: LSTMBeat, gate?: "forget" | "write" | "output") => void;
  onQuiz: (choice: number) => void;
}) {
  const question = LSTM_QUIZ[quizIndex] ?? LSTM_QUIZ[0];
  const prevCell = previous?.cell ?? 0;
  return (
    <section className="lstm-lesson-panel panel" role="tabpanel">
      <header>
        <b>Learn</b>
        <span>LSTM cell at t = {step}</span>
      </header>
      <article className="lstm-walk">
        <h2>Watch this timestep, not a generic story</h2>
        <p>
          On <b>{sequence.name}</b> at <b>t={step}</b>, xₜ = {active.input.toFixed(2)}
          {sequence.featureNames[1]
            ? ` and ${sequence.featureNames[1]} = ${active.extra.toFixed(2)}`
            : ""}
          . Forget <b>{active.forget.toFixed(2)}</b> keeps{" "}
          {(active.forget * 100).toFixed(0)}% of Cₜ₋₁ = {prevCell.toFixed(2)}, so{" "}
          <b>{active.retained.toFixed(2)}</b> survives. Write{" "}
          <b>{active.write.toFixed(2)}</b> lets in {active.written.toFixed(2)} of
          candidate {active.candidate.toFixed(2)}. The cell becomes{" "}
          <b>{active.cell.toFixed(2)}</b>; output <b>{active.output.toFixed(2)}</b>{" "}
          reveals hₜ = {active.hidden.toFixed(2)}.
        </p>
        <p className="lstm-stress">{sequence.stress}</p>
      </article>
      <div className="lstm-beats">
        {LSTM_BEATS.map((item) => (
          <button
            key={item.id}
            className={beat === item.id ? "active" : ""}
            onClick={() => onBeat(item.id)}
          >
            <b>{item.title}</b>
            <span>{item.body}</span>
          </button>
        ))}
        <button
          className="lstm-see-cell"
          onClick={() =>
            onOpenVisualize(
              beat,
              beat === 0 ? "forget" : beat === 1 ? "write" : beat === 3 ? "output" : undefined,
            )
          }
        >
          See this beat on the cell →
        </button>
      </div>
      <div className="lstm-when">
        <h3>When not to use LSTM</h3>
        {LSTM_WHEN_NOT.map((card) => (
          <article key={card.title}>
            <b>{card.title}</b>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
      {question && (
        <div className="lstm-quiz">
          <h3>
            Quiz {quizIndex + 1} / {LSTM_QUIZ.length}
          </h3>
          <p>{question.question}</p>
          <div>
            {question.options.map((option, index) => {
              const chosen = quizChoice !== null;
              const correct = index === question.answer;
              return (
                <button
                  key={option}
                  className={
                    chosen && correct
                      ? "correct"
                      : chosen && quizChoice === index
                        ? "wrong"
                        : ""
                  }
                  onClick={() => onQuiz(index)}
                  disabled={chosen}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {quizChoice !== null && <p className="lstm-tip">{question.explanation}</p>}
        </div>
      )}
    </section>
  );
}

export function LSTMComparePanel({
  rows,
  onOpenDataset,
}: {
  rows: SequenceModelRow[];
  onOpenDataset: () => void;
}) {
  return (
    <section className="lstm-lesson-panel panel" role="tabpanel">
      <header>
        <b>Compare</b>
        <span>Same sequence, five sequence models</span>
      </header>
      <p>
        Next-step MAE uses hidden (or the model’s readout) versus xₜ₊₁. Persist is
        how much of an early clue theoretically survives to the end. Last error
        is |readout − last target| — the copy / XOR / add score when a teaching
        task is loaded.
      </p>
      <table className="lstm-compare">
        <thead>
          <tr>
            <th>Model</th>
            <th>Params</th>
            <th>Next MAE</th>
            <th>Last |err|</th>
            <th>Persist</th>
            <th>Why it differs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className={row.name === "LSTM" ? "active" : ""}>
              <td>{row.name}</td>
              <td>{row.params.toLocaleString()}</td>
              <td>{row.nextMae.toFixed(3)}</td>
              <td>{row.lastError.toFixed(3)}</td>
              <td>{row.persist.toFixed(3)}</td>
              <td>{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Peers in this suite:{" "}
        <Link to="/ml/deep-learning/rnn">RNN</Link>,{" "}
        <Link to="/ml/deep-learning/gru">GRU</Link>,{" "}
        <Link to="/ml/deep-learning/transformer-attention">Transformer attention</Link>.
      </p>
      <button onClick={onOpenDataset}>Open a teaching task on Dataset →</button>
    </section>
  );
}

export function LSTMExplainPanel({
  active,
  previous,
  step,
  onFocus,
}: {
  active: LSTMStep;
  previous?: LSTMStep;
  step: number;
  onFocus: (gate: "forget" | "write" | "output") => void;
}) {
  const cPrev = previous?.cell ?? 0;
  return (
    <section className="lstm-lesson-panel panel" role="tabpanel">
      <header>
        <b>Explain</b>
        <span>Live substitution at t = {step}</span>
      </header>
      <p className="lab-tab-formula">
        Vanilla RNN is just{" "}
        <code>hₜ = tanh(W xₜ + U hₜ₋₁ + b)</code> — one squash, no cell highway.
      </p>
      <ol className="lstm-eq">
        <li>
          <button onClick={() => onFocus("forget")}>fₜ</button> = σ(W<sub>f</sub> x
          + U<sub>f</sub> h + b<sub>f</sub> + peephole) ={" "}
          <b>{active.forget.toFixed(3)}</b>
        </li>
        <li>
          <button onClick={() => onFocus("write")}>iₜ</button> = σ(W<sub>i</sub> x
          + U<sub>i</sub> h + b<sub>i</sub>) = <b>{active.write.toFixed(3)}</b>
          {" · "}
          c̃ₜ = tanh(W<sub>g</sub> x + U<sub>g</sub> h + b<sub>g</sub>) ={" "}
          <b>{active.candidate.toFixed(3)}</b>
        </li>
        <li>
          Cₜ = fₜ ⊙ Cₜ₋₁ + iₜ ⊙ c̃ₜ = {active.forget.toFixed(2)} ⊙ {cPrev.toFixed(2)} +{" "}
          {active.write.toFixed(2)} ⊙ {active.candidate.toFixed(2)} ={" "}
          <b>{active.cell.toFixed(3)}</b>
        </li>
        <li>
          <button onClick={() => onFocus("output")}>oₜ</button> = σ(W<sub>o</sub> x
          + U<sub>o</sub> h + b<sub>o</sub>) = <b>{active.output.toFixed(3)}</b>
          {" · "}
          hₜ = oₜ ⊙ tanh(Cₜ) = {active.output.toFixed(2)} ⊙ tanh(
          {active.cell.toFixed(2)}) = <b>{active.hidden.toFixed(3)}</b>
        </li>
      </ol>
      <p>
        Click a gate symbol to jump to Visualize with that node highlighted. Click
        a Dataset card to land on the memory-stress timestep.
      </p>
    </section>
  );
}
