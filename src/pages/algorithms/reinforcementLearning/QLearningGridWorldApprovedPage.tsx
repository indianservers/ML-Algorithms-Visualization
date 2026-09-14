import { useMemo, useState } from "react";
import {
  qLearning,
  type Action,
  type Cell,
  type GridConfig,
} from "../../../lib/algorithms/reinforcement/qLearning";
import "./QLearningGridWorldApprovedPage.css";

const arrows: Record<Action, string> = {
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
};
const labels: Record<Cell, string> = {
  empty: "",
  wall: "▦",
  goal: "+10",
  start: "S",
  penalty: "−5",
};

function initialGrid(): GridConfig {
  const cells: Cell[][] = Array.from({ length: 6 }, () =>
    Array<Cell>(7).fill("empty"),
  );
  cells[0][0] = "start";
  cells[0][3] = "wall";
  cells[1][1] = "wall";
  cells[1][3] = "wall";
  cells[2][3] = "wall";
  cells[3][1] = "penalty";
  cells[3][3] = "wall";
  cells[4][5] = "penalty";
  cells[5][3] = "wall";
  cells[5][6] = "goal";
  return {
    rows: 6,
    cols: 7,
    cells,
    rewards: { "3,1": -5, "4,5": -5, "5,6": 10 },
    startPos: [0, 0],
    goalPos: [5, 6],
  };
}

export default function QLearningGridWorldApprovedPage() {
  const [grid, setGrid] = useState(initialGrid);
  const [tool, setTool] = useState<Cell>("wall");
  const [alpha, setAlpha] = useState(0.1);
  const [gamma, setGamma] = useState(0.95);
  const [epsilon, setEpsilon] = useState(0.1);
  const [episodes, setEpisodes] = useState(1000);
  const [run, setRun] = useState(0);
  const [tab, setTab] = useState("Q-Table");
  const [status, setStatus] = useState("Ready to train");
  const result = useMemo(
    () =>
      run
        ? qLearning(grid, alpha, gamma, epsilon, episodes, 74097 + run)
        : null,
    [alpha, episodes, epsilon, gamma, grid, run],
  );
  const rewards = result?.episodeRewards ?? [];
  const recent = rewards.slice(-100);
  const average = recent.length
    ? recent.reduce((sum, value) => sum + value, 0) / recent.length
    : 0;

  function editCell(row: number, col: number) {
    if ((row === 0 && col === 0) || (row === 5 && col === 6)) return;
    setGrid((current) => {
      const cells = current.cells.map((line) => [...line]);
      cells[row][col] = cells[row][col] === tool ? "empty" : tool;
      const rewards = { ...current.rewards };
      delete rewards[`${row},${col}`];
      if (tool === "penalty") rewards[`${row},${col}`] = -5;
      return { ...current, cells, rewards };
    });
    setRun(0);
    setStatus(`Edited cell ${row + 1}, ${col + 1}`);
  }

  function train() {
    setRun((value) => value + 1);
    setStatus(`Trained ${episodes.toLocaleString()} episodes`);
  }

  return (
    <div className="ql-approved">
      <aside className="ql-rail">
        <a href="/" aria-label="Mega ML home">
          ✣
        </a>
        {["⌂", "▧", "◇", "⌁", "▤", "⚙"].map((icon, index) => (
          <button className={index === 2 ? "active" : ""} key={icon}>
            {icon}
          </button>
        ))}
        <button className="bottom">?</button>
      </aside>
      <header className="ql-head">
        <div>
          <small>REINFORCEMENT LEARNING / LAB</small>
          <h1>Q-Learning Grid World</h1>
        </div>
        <nav>
          <button>Docs</button>
          <button onClick={() => setStatus("Experiment saved")}>Save</button>
          <button>Share</button>
          <b>ML</b>
        </nav>
      </header>
      <main className="ql-main">
        <aside className="ql-tools">
          <h3>LEGEND</h3>
          <p>
            <i className="agent" /> Agent
          </p>
          <p>
            <i className="goal" /> Goal (+10)
          </p>
          <p>
            <i className="wall" /> Wall
          </p>
          <p>
            <i className="penalty" /> Penalty (−5)
          </p>
          <h3>GRID TOOLS</h3>
          {(["wall", "penalty", "empty"] as Cell[]).map((item) => (
            <button
              className={tool === item ? "active" : ""}
              onClick={() => setTool(item)}
              key={item}
            >
              {item === "wall"
                ? "▦ Add Wall"
                : item === "penalty"
                  ? "− Add Penalty"
                  : "⌫ Erase Cell"}
            </button>
          ))}
          <button
            onClick={() => {
              setGrid(initialGrid());
              setRun(0);
              setStatus("Grid reset");
            }}
          >
            ↻ Reset Grid
          </button>
          <div className="ql-tip">
            <b>TIP</b>
            <p>
              Choose a tool, then click any open grid cell to edit the
              environment.
            </p>
          </div>
        </aside>
        <section className="ql-world">
          <div className="ql-world-title">
            <span>
              GRID WORLD <b>7 × 6</b>
            </span>
            <span>● {result ? "TRAINED" : "READY"}</span>
          </div>
          <div className="ql-grid">
            {grid.cells.flatMap((row, r) =>
              row.map((cell, c) => {
                const policy = result?.policy[`${r},${c}`];
                const best = result
                  ? Math.max(...Object.values(result.qTable[`${r},${c}`]))
                  : 0;
                return (
                  <button
                    aria-label={`Cell ${r + 1}, ${c + 1}: ${cell}`}
                    className={cell}
                    key={`${r}-${c}`}
                    onClick={() => editCell(r, c)}
                    style={
                      result && cell === "empty"
                        ? {
                            backgroundColor: `rgba(27, 105, 255, ${Math.min(0.48, 0.08 + Math.max(0, best) / 22)})`,
                          }
                        : undefined
                    }
                  >
                    {cell === "start" ? (
                      <>
                        <i>●</i>
                        <small>START</small>
                      </>
                    ) : cell === "goal" ? (
                      <>
                        <i>★</i>
                        <small>GOAL {labels[cell]}</small>
                      </>
                    ) : cell === "empty" && policy ? (
                      <b>{arrows[policy]}</b>
                    ) : (
                      <strong>{labels[cell]}</strong>
                    )}
                  </button>
                );
              }),
            )}
          </div>
          <div className="ql-scale">
            <span>LOW VALUE</span>
            <i />
            <span>HIGH VALUE</span>
          </div>
        </section>
        <aside className="ql-controls">
          <h3>TRAINING CONTROLS</h3>
          {[
            {
              label: "Learning Rate (α)",
              value: alpha,
              set: setAlpha,
              min: 0.01,
              max: 1,
              step: 0.01,
            },
            {
              label: "Discount Factor (γ)",
              value: gamma,
              set: setGamma,
              min: 0.5,
              max: 0.99,
              step: 0.01,
            },
            {
              label: "Exploration (ε)",
              value: epsilon,
              set: setEpsilon,
              min: 0,
              max: 0.5,
              step: 0.01,
            },
          ].map(({ label, value, set, min, max, step }) => (
            <label key={label}>
              {label}
              <b>{Number(value).toFixed(2)}</b>
              <input
                aria-label={label}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => set(Number(event.target.value))}
              />
            </label>
          ))}
          <label>
            Episodes <b>{episodes.toLocaleString()}</b>
            <input
              aria-label="Episodes"
              type="range"
              min="100"
              max="3000"
              step="100"
              value={episodes}
              onChange={(event) => setEpisodes(Number(event.target.value))}
            />
          </label>
          <button className="ql-train" onClick={train}>
            ▶ Train Agent
          </button>
          <button
            onClick={() => {
              setRun(0);
              setStatus("Training cleared");
            }}
          >
            ↻ Clear Training
          </button>
          <div className="ql-formula">
            <b>UPDATE RULE</b>
            <p>Q(s,a) ← Q(s,a) + α[r + γ max Q(s′,a′) − Q(s,a)]</p>
          </div>
        </aside>
        <aside className="ql-results">
          <h3>TRAINING SUMMARY</h3>
          <div className="ql-metrics">
            <article>
              <small>EPISODES</small>
              <b>{result ? episodes.toLocaleString() : "—"}</b>
            </article>
            <article>
              <small>AVG. REWARD</small>
              <b>{result ? average.toFixed(2) : "—"}</b>
            </article>
            <article>
              <small>BEST REWARD</small>
              <b>{result ? Math.max(...rewards).toFixed(2) : "—"}</b>
            </article>
            <article>
              <small>STATES</small>
              <b>{result ? Object.keys(result.qTable).length : "42"}</b>
            </article>
          </div>
          <h3>EPISODE REWARD</h3>
          <div className="ql-chart">
            {recent.slice(-40).map((value, index) => (
              <i
                key={index}
                style={{
                  height: `${Math.max(5, Math.min(100, 46 + value * 4))}%`,
                }}
              />
            ))}
            {!result && <span>Train the agent to plot rewards</span>}
          </div>
          <div className="ql-status">● {status}</div>
        </aside>
        <section className="ql-lower">
          <nav>
            {["Q-Table", "Policy", "Episode History"].map((item) => (
              <button
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="ql-table">
            <header>
              STATE <span>↑ UP</span>
              <span>↓ DOWN</span>
              <span>← LEFT</span>
              <span>→ RIGHT</span>
              <span>BEST</span>
            </header>
            {(result
              ? Object.entries(result.qTable).slice(0, 7)
              : Array.from(
                  { length: 7 },
                  (_, i) =>
                    [
                      `${Math.floor(i / 4)},${i % 4}`,
                      { up: 0, down: 0, left: 0, right: 0 },
                    ] as const,
                )
            ).map(([state, qs]) => (
              <p key={state}>
                <b>S({state})</b>
                {Object.values(qs).map((q, i) => (
                  <span key={i}>{Number(q).toFixed(3)}</span>
                ))}
                <strong>{result ? arrows[result.policy[state]] : "—"}</strong>
              </p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
