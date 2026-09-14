import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, MoreHorizontal, RotateCcw } from "lucide-react";
import {
  classDistribution,
  threeWaySplit,
} from "../../../lib/preprocessing/threeWaySplit";
import "./TrainTestSplitPage.css";

type Row = {
  id: number;
  label: number;
  pclass: number;
  sex: number;
  age: number;
};
const makeRows = (count: number, seed: number): Row[] =>
  Array.from({ length: count }, (_, id) => ({
    id,
    label: (id * 17 + seed) % 100 < 39 ? 1 : 0,
    pclass: 1 + ((id * 7 + seed) % 3),
    sex: (id * 13 + seed) % 2,
    age: 8 + ((id * 29 + seed) % 66),
  }));
const catalogs = [
  {
    name: "Titanic Survival v2",
    rows: makeRows(887, 7),
    columns: 12,
    target: "Survived",
  },
  {
    name: "Customer Churn",
    rows: makeRows(7043, 29),
    columns: 18,
    target: "Churn",
  },
  {
    name: "Iris Species",
    rows: makeRows(150, 41),
    columns: 5,
    target: "Species",
  },
];
const distributionCards: {
  title: string;
  field: "label" | "pclass" | "sex";
}[] = [
  { title: "Target", field: "label" },
  { title: "Pclass (3 classes)", field: "pclass" },
  { title: "Sex (binary)", field: "sex" },
];

export default function TrainTestSplitPage() {
  const [dataset, setDataset] = useState(0),
    [customRows, setCustomRows] = useState<Row[] | null>(null),
    [validationRatio, setValidationRatio] = useState(20),
    [testRatio, setTestRatio] = useState(10),
    [locked, setLocked] = useState(false),
    [stratify, setStratify] = useState(true),
    [shuffled, setShuffled] = useState(true),
    [advanced, setAdvanced] = useState(false),
    [tab, setTab] = useState("Visualize"),
    [message, setMessage] = useState("Shuffled"),
    [progress, setProgress] = useState(42);
  const fileRef = useRef<HTMLInputElement>(null);
  const catalog = catalogs[dataset],
    rows = customRows ?? catalog.rows,
    labels = rows.map((row) => row.label),
    trainRatio = 100 - validationRatio - testRatio;
  const split = useMemo(
    () =>
      threeWaySplit(
        rows,
        labels,
        validationRatio / 100,
        testRatio / 100,
        shuffled ? 42 : 0,
        stratify,
      ),
    [rows, labels, validationRatio, testRatio, shuffled, stratify],
  );
  const parts = [
    { key: "train", name: "Train", indices: split.trainIndices },
    { key: "validation", name: "Validation", indices: split.validationIndices },
    { key: "test", name: "Test", indices: split.testIndices },
  ] as const;
  const agePaths = parts.map((part) => {
    const bins = Array(12).fill(0) as number[];
    part.indices.forEach(
      (index) => bins[Math.min(11, Math.floor(rows[index].age / 7))]++,
    );
    const max = Math.max(...bins, 1);
    return bins
      .map(
        (count, index) =>
          `${index ? "L" : "M"}${index * (240 / 11)},${92 - (count / max) * 75}`,
      )
      .join(" ");
  });
  const setRatio = (kind: "validation" | "test", value: number) => {
    const safe = Math.max(5, Math.min(45, value));
    if (kind === "validation")
      setValidationRatio(Math.min(safe, 85 - testRatio));
    else setTestRatio(Math.min(safe, 85 - validationRatio));
    setMessage("Ratios updated");
  };
  const reset = () => {
    setValidationRatio(20);
    setTestRatio(10);
    setLocked(false);
    setStratify(true);
    setShuffled(true);
    setAdvanced(false);
    setMessage("Defaults restored");
  };
  const upload = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/).slice(1);
    const imported = lines.map((line, id) => {
      const values = line.split(",");
      return {
        id,
        age: Number(values[0]) || 30,
        sex: Number(values[1]) || 0,
        pclass: Number(values[2]) || 1,
        label: Number(values.at(-1)) || 0,
      };
    });
    if (imported.length) {
      setCustomRows(imported);
      setMessage(`${file.name} · ${imported.length} rows`);
    }
  };
  return (
    <div className="split-page">
      <aside className="split-side">
        <Link to="/">
          ✦ <b>Mega ML</b>
          <small>AI OBSERVATORY</small>
        </Link>
        <button>⌂ Home</button>
        <button>⚙ Playground</button>
        <button className="active">⌁ Learn ⌃</button>
        <section>
          <button>● Lessons</button>
          <button>○ Pathways</button>
          <button>○ Challenges</button>
        </section>
        {[
          "▦ Datasets",
          "♧ Experiments",
          "⌘ Models",
          "◇ Deployments",
          "⌁ Insights",
          "▤ Docs",
        ].map((x) => (
          <button key={x}>{x}</button>
        ))}
        <button className="settings">⚙ Settings</button>
        <button>? Help</button>
      </aside>
      <header className="split-head">
        <div className="split-icon">▤</div>
        <h1>Train-Test Split</h1>
        <p>
          Partition your dataset into Train, Validation, and Test sets to build
          reliable models.
        </p>
        <div className="split-actions">
          <select
            aria-label="Dataset"
            value={dataset}
            onChange={(e) => {
              setDataset(Number(e.target.value));
              setCustomRows(null);
              setMessage("Dataset loaded");
            }}
          >
            {catalogs.map((x, i) => (
              <option value={i} key={x.name}>
                {x.name}
              </option>
            ))}
          </select>
          <button onClick={() => fileRef.current?.click()}>
            <CloudUpload /> Upload
          </button>
          <button onClick={() => setMessage("More actions opened")}>
            <MoreHorizontal />
          </button>
          <label>
            Lesson Progress <progress max="100" value={progress} />{" "}
            <b>{progress}%</b>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            hidden
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
        <nav>
          {[
            "Learn",
            "Visualize",
            "Dataset",
            "Transform",
            "Train",
            "Metrics",
            "Compare",
            "Explain",
          ].map((x) => (
            <button
              className={tab === x ? "active" : ""}
              onClick={() => {
                setTab(x);
                setProgress(Math.min(100, progress + 2));
                setMessage(`${x} selected`);
              }}
              key={x}
            >
              {x}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <h3>
          <i>1</i> Drag to split your data
        </h3>
        <section className="split-flow">
          <article>
            <span>Dataset</span>
            <b>▤ {customRows ? "Uploaded Dataset" : catalog.name}</b>
            <small>
              {rows.length} rows • {catalog.columns} columns
            </small>
          </article>
          <div className="streams">
            {parts.map((part, p) => {
              const ratio =
                p === 0 ? trainRatio : p === 1 ? validationRatio : testRatio;
              return (
                <section className={part.key} key={part.key}>
                  <header>
                    <b>{part.name} ✓</b>
                    <strong>
                      {part.indices.length}
                      <small>
                        {" "}
                        (
                        {((part.indices.length / rows.length) * 100).toFixed(1)}
                        %)
                      </small>
                    </strong>
                  </header>
                  <div>
                    {part.indices.slice(0, 126).map((index) => (
                      <i
                        style={{
                          left: `${4 + ((index * 37) % 92)}%`,
                          top: `${10 + ((index * 23) % 78)}%`,
                        }}
                        key={index}
                      />
                    ))}
                  </div>
                  <input
                    aria-label={`${part.name} ratio`}
                    type="range"
                    min="5"
                    max="90"
                    value={ratio}
                    disabled={p === 0 || locked}
                    onChange={(e) =>
                      setRatio(
                        p === 1 ? "validation" : "test",
                        Number(e.target.value),
                      )
                    }
                  />
                </section>
              );
            })}
            <footer>0% · 25% · 50% · 75% · 100%</footer>
          </div>
        </section>
        <p className="split-total">
          Total <b>{rows.length} rows</b> · ⌘{" "}
          <button
            onClick={() => {
              setShuffled(!shuffled);
              setMessage(shuffled ? "Original order" : "Shuffled");
            }}
          >
            {shuffled ? "Shuffled ✓" : "Original order"}
          </button>
        </p>
        <h3>
          <i>2</i> Distribution Check{" "}
          <span>{stratify ? "Good balance" : "Unstratified"}</span>
        </h3>
        <section className="distribution">
          {distributionCards.map((card) => (
            <article className="panel" key={card.title}>
              <header>
                {card.field === "label"
                  ? `Target: ${catalog.target}`
                  : card.title}{" "}
                ⓘ
              </header>
              <div className="bars">
                {parts.map((part) => (
                  <section key={part.key}>
                    <div>
                      {classDistribution(
                        rows.map((row) => row[card.field]),
                        part.indices,
                      ).map((item) => (
                        <i
                          title={`${item.label}: ${(item.share * 100).toFixed(0)}%`}
                          style={{ height: `${20 + item.share * 80}%` }}
                          key={item.label}
                        />
                      ))}
                    </div>
                    <small>
                      {part.name === "Validation" ? "Val" : part.name}
                    </small>
                  </section>
                ))}
              </div>
            </article>
          ))}
          <article className="panel age">
            <header>Age (distribution) ⓘ</header>
            <svg viewBox="0 0 240 100">
              {agePaths.map((path, index) => (
                <path d={path} key={parts[index].key} />
              ))}
            </svg>
          </article>
        </section>
        <section className="linked panel">
          <h3>Linked Insights</h3>
          <div>
            {[
              "✈ Why It Matters|A proper split prevents overfitting and gives you an unbiased estimate of model performance.",
              "☑ Best Practices|Stratify when target is imbalanced. Keep test set untouched until final evaluation.",
              "⚠ Common Pitfalls|Data leakage from IDs or target proxies. Changing the test set during iteration.",
              "◎ What's Next|You're ready to train a baseline model.",
            ].map((x) => {
              const [title, body] = x.split("|");
              return (
                <article key={title}>
                  <b>{title}</b>
                  <p>{body}</p>
                  <button onClick={() => setMessage(title)}>
                    Learn more →
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <aside className="split-controls">
        <section className="panel ratios">
          <h3>
            Split Ratios <button onClick={reset}>Reset</button>
          </h3>
          <label>
            <i /> Train <input value={trainRatio} readOnly />%
          </label>
          <label>
            <i /> Validation{" "}
            <input
              aria-label="Validation percent"
              type="number"
              value={validationRatio}
              disabled={locked}
              onChange={(e) => setRatio("validation", Number(e.target.value))}
            />
            %
          </label>
          <label>
            <i /> Test{" "}
            <input
              aria-label="Test percent"
              type="number"
              value={testRatio}
              disabled={locked}
              onChange={(e) => setRatio("test", Number(e.target.value))}
            />
            %
          </label>
          <label>
            <input
              aria-label="Lock ratios"
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
            />{" "}
            Lock ratios
          </label>
          <label>
            Stratify by
            <select
              aria-label="Stratify by"
              value={stratify ? "label" : "none"}
              onChange={(e) => setStratify(e.target.value !== "none")}
            >
              <option value="label">{catalog.target}</option>
              <option value="none">None</option>
            </select>
          </label>
          <p>
            Preserves class balance across splits based on the selected column.
          </p>
          <button onClick={() => setAdvanced(!advanced)}>
            Advanced Options ›
          </button>
          {advanced && (
            <div className="advanced">
              Random seed 42 · deterministic shuffle
            </div>
          )}
        </section>
        <section className="leak panel">
          <b>
            ⚠ Potential Data Leakage <span>2 issues detected</span>
          </b>
          <p>
            • Column 'PassengerId' looks like an identifier.
            <br />• Column 'Name' may contain target leakage.
          </p>
          <button onClick={() => setMessage("Leakage review opened")}>
            Review & Fix
          </button>
        </section>
        <section className="stats panel">
          <h3>⌁ Quick Stats</h3>
          <p>
            Total Rows <b>{rows.length}</b>
            <br />
            Total Columns <b>{catalog.columns}</b>
            <br />
            Target Column <b>{catalog.target}</b>
            <br />
            Classes <b>{new Set(labels).size}</b>
            <br />
            Missing Values <b>6.3%</b>
            <br />
            Duplicate Rows <b>0 (0%)</b>
          </p>
        </section>
        <p className="split-message">
          <RotateCcw /> {message}
        </p>
      </aside>
    </div>
  );
}
