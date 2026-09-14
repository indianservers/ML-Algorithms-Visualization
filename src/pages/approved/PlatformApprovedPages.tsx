import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { navigationData } from "../../data/navigation";
import "./PlatformApprovedPages.css";

type PlatformPage =
  "home" | "documentation" | "datasets" | "sitemap" | "matrix";
const sideGroups: Record<PlatformPage, Array<[string, string[]]>> = {
  home: [
    [
      "",
      [
        "⌂ Home",
        "▧ Curriculum",
        "♧ Experiments",
        "⌁ Visualizations",
        "▣ Playground",
        "▤ Datasets",
        "▮ Bookmarks",
        "♜ Achievements",
      ],
    ],
    [
      "RECENT",
      [
        "● Gradient Boosting",
        "● LSTM Networks",
        "● K-Means Clustering",
        "● Linear Regression",
        "● SVM Classification",
      ],
    ],
  ],
  documentation: [
    [
      "",
      [
        "⌂ Overview",
        "♧ Experiments",
        "▤ Datasets",
        "⌘ Algorithms",
        "◇ Models",
        "⬡ Deployments",
        "◉ Monitoring",
        "⚙ Settings",
      ],
    ],
    ["", ["▧ Documentation"]],
  ],
  datasets: [
    [
      "DATA",
      [
        "▤ Dataset Library",
        "▣ My Collections",
        "☆ Favorites",
        "⌁ Data Sources",
      ],
    ],
    [
      "PROJECTS",
      [
        "♧ Customer Churn",
        "♧ Fraud Detection",
        "♧ Market Basket",
        "♧ Medical Imaging",
        "♧ Text Analytics",
        "＋ New Project",
      ],
    ],
    [
      "RECENT DATASETS",
      [
        "▤ Customer Churn Dataset",
        "▤ Heart Disease Dataset",
        "▤ Titanic Survival Dataset",
        "▤ House Prices Dataset",
        "▤ Iris Dataset",
      ],
    ],
  ],
  sitemap: [
    ["", ["⌂ Home"]],
    [
      "LEARN",
      ["⌘ Sitemap", "▧ Curriculum", "▥ Roadmaps", "▮ Bookmarks", "▤ Notes"],
    ],
    ["LAB", ["▣ Notebooks", "♧ Experiments", "◇ Playground"]],
    [
      "RESOURCES",
      ["▤ Datasets", "⌘ Models", "▧ Cheatsheets", "▣ Glossary", "▥ Papers"],
    ],
    ["COMMUNITY", ["▱ Discussions", "♧ Mentors", "▦ Events"]],
  ],
  matrix: [
    ["", ["⌂ Home"]],
    [
      "LEARN",
      ["♧ Roadmap", "▧ Lessons", "⌘ Implementation Matrix", "⌁ Playground"],
    ],
    ["DISCOVER", ["◇ Models", "▤ Datasets", "▥ Papers", "♧ Benchmarks"]],
    ["BUILD", ["⌘ Train", "⌁ Evaluate", "⬡ Deploy"]],
    ["MONITOR", ["▥ Experiments", "⌁ Drift", "♢ Alerts"]],
    ["SETTINGS", ["♙ Profile", "♧ Team", "▤ Billing"]],
  ],
};
const algorithms = [
  "Linear Regression",
  "Logistic Regression",
  "Decision Tree",
  "Random Forest",
  "XGBoost",
  "LightGBM",
  "CatBoost",
  "SVM (RBF)",
  "K-Nearest Neighbors",
  "Naïve Bayes",
  "Neural Network (MLP)",
  "CNN",
  "RNN (LSTM)",
  "Transformer",
  "Autoencoder",
];
const datasets = [
  "Customer Churn Dataset",
  "Heart Disease Dataset",
  "Titanic Survival Dataset",
  "House Prices Dataset",
  "Iris Flower Dataset",
  "Market Sales Dataset",
  "Credit Card Fraud Dataset",
  "Energy Efficiency Dataset",
  "Employee Attrition Dataset",
  "Text Sentiment Dataset",
];

function Side({
  page,
  active,
  onAction,
}: {
  page: PlatformPage;
  active: string;
  onAction: (x: string) => void;
}) {
  return (
    <aside className="pp-side">
      <a href="/" className="pp-brand">
        <i>∞</i>
        <span>
          <b>Mega ML</b>
          <small>
            {page === "home" ? "ALGORITHMS SUITE" : "AI OBSERVATORY"}
          </small>
        </span>
      </a>
      {sideGroups[page].map(([group, items], groupIndex) => (
        <section className="pp-sidegroup" key={`${group}-${groupIndex}`}>
          {group && <p>{group}</p>}
          {items.map((x) => (
            <button
              className={x.includes(active) ? "active" : ""}
              key={x}
              onClick={() => onAction(x.slice(2))}
            >
              {x}
              {page === "home" && group === "RECENT" && (
                <small>{x.includes("Linear") ? "Beginner" : x.includes("K-Means") ? "Intermediate" : "Advanced"} <span>›</span></small>
              )}
            </button>
          ))}
        </section>
      ))}
      <div className="pp-side-footer">
        {page === "home" && (
          <article className="pp-upgrade">
            <b>★ Upgrade to Pro</b>
            <p>Unlock advanced labs, more algorithms, and priority support.</p>
            <button onClick={() => onAction("Upgrade")}>Upgrade Now</button>
          </article>
        )}
        {page === "datasets" && (
          <article className="pp-storage">
            <small>STORAGE</small>
            <b>412 GB / 1 TB</b>
            <progress value="41" max="100" />
            <a>Manage Storage</a>
          </article>
        )}
        {page === "documentation" && (
          <article className="pp-account">
            <b>MA</b>
            <span>
              Mega Analytics<small>Enterprise Plan</small>
            </span>
          </article>
        )}
        <button onClick={() => onAction("Collapse")}>« Collapse</button>
      </div>
    </aside>
  );
}
function Header({
  title,
  subtitle,
  onAction,
}: {
  title: string;
  subtitle: string;
  onAction: (x: string) => void;
}) {
  return (
    <header className="pp-head">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <input
        aria-label="Global Search"
        placeholder={`Search ${title.toLowerCase()}...`}
      />
      <button onClick={() => onAction("Theme")}>◔</button>
      <button onClick={() => onAction("Profile")}>ML</button>
    </header>
  );
}

const heroNodes = [
  [18, 58], [48, 42], [82, 66], [116, 30], [148, 52], [184, 18],
  [214, 75], [252, 42], [286, 88], [320, 31], [356, 61], [390, 15],
  [426, 47], [462, 82], [500, 28], [534, 62], [568, 40], [604, 76],
  [642, 21], [676, 55], [712, 34], [744, 70], [782, 42], [818, 61],
] as const;

function HeroNetwork() {
  return (
    <svg viewBox="0 0 840 120" role="img" aria-label="Connected machine-learning network">
      <defs>
        <linearGradient id="network-line" x1="0" x2="1"><stop stopColor="#136dff" /><stop offset=".55" stopColor="#0bcfff" /><stop offset="1" stopColor="#8b36ff" /></linearGradient>
        <filter id="network-glow"><feGaussianBlur stdDeviation="2.2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx="428" cy="47" r="34" fill="#315dff" opacity=".08" />
      <g stroke="url(#network-line)" strokeOpacity=".34" strokeWidth="1">
        {heroNodes.slice(0, -2).map((node, index) => (
          <g key={index}>
            <line x1={node[0]} y1={node[1]} x2={heroNodes[index + 1][0]} y2={heroNodes[index + 1][1]} />
            <line x1={node[0]} y1={node[1]} x2={heroNodes[index + 2][0]} y2={heroNodes[index + 2][1]} />
            {index % 3 === 0 && <line x1={node[0]} y1={node[1]} x2={heroNodes[Math.min(index + 5, heroNodes.length - 1)][0]} y2={heroNodes[Math.min(index + 5, heroNodes.length - 1)][1]} />}
            {index % 2 === 0 && <line x1={node[0]} y1={node[1]} x2={heroNodes[Math.min(index + 4, heroNodes.length - 1)][0]} y2={heroNodes[Math.min(index + 4, heroNodes.length - 1)][1]} />}
          </g>
        ))}
      </g>
      <g filter="url(#network-glow)">{heroNodes.map(([x, y], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={index % 5 === 0 ? 3.2 : 2.2} fill={index % 6 === 0 ? "#bd4cff" : "#10dcff"} />)}</g>
    </svg>
  );
}

function ContinueGraphic() {
  return (
    <svg viewBox="0 0 200 150" aria-hidden="true">
      <g opacity=".75">{heroNodes.slice(0, 18).map(([x, y], index) => <circle key={index} cx={(x % 176) + 12} cy={(y * 1.45) % 125 + 10} r="2.2" fill={index % 3 ? "#14dcff" : "#cf3dff"} />)}</g>
      <path d="M22 126 L172 24 M35 142 L185 40" stroke="#1d87ff" strokeOpacity=".28" />
      <path d="M54 123 C80 101 92 67 122 49 C139 39 153 37 174 35" fill="#2085ff" fillOpacity=".16" stroke="#32bfff" />
      <path d="M78 134 L119 35 L128 35 L88 138 Z" fill="#5d62ff" fillOpacity=".3" stroke="#7f82ff" />
    </svg>
  );
}

function CategoryGraphic({ index }: { index: number }) {
  if (index === 2) return <svg viewBox="0 0 160 82" aria-hidden="true"><g stroke="#8a7dfc" strokeOpacity=".7">{[18, 41, 64].flatMap((y, a) => [94, 120, 146].map((x, b) => <line key={`${a}-${b}`} x1="30" y1={y} x2={x} y2={b * 23 + 18} />))}</g>{[18,41,64].map(y=><circle key={y} cx="30" cy={y} r="7" fill="#58a9ff" />)}{[18,41,64].map(y=><circle key={y} cx="94" cy={y} r="7" fill="#856cff" />)}{[18,41,64].map(y=><circle key={y} cx="146" cy={y} r="7" fill="#a47dff" />)}</svg>;
  if (index === 4) return <svg viewBox="0 0 160 82" aria-hidden="true"><path d="M4 60 16 45 27 70 41 18 54 61 68 36 82 65 96 14 109 55 121 32 134 66 147 42 158 58" fill="none" stroke="#09d6e9" strokeWidth="2" /><path d="M0 72H160M0 48H160M0 24H160" stroke="#1c6876" strokeOpacity=".4" /></svg>;
  if (index === 5) return <div className="pp-wordcloud" aria-hidden="true"><b>learning</b><strong>model</strong><span>training</span><i>neural</i><small>text · words · classification</small></div>;
  if (index === 3) return <svg viewBox="0 0 160 82" aria-hidden="true"><path d="M18 70V10M18 70H150M22 63 139 18" stroke="#f4f6ff" /><path d="m133 18 7 0-2 7" fill="none" stroke="#ff9f35" />{heroNodes.slice(0,12).map(([x,y],i)=><circle key={i} cx={(x%110)+28} cy={(y%48)+20} r="2.5" fill={i%2?"#468cff":"#bc4cff"}/>)}</svg>;
  return <svg viewBox="0 0 160 82" aria-hidden="true"><path d="M18 67 C52 28 84 68 140 18" fill="none" stroke="#a78bfa" strokeWidth="1.5" />{heroNodes.slice(0,16).map(([x,y],i)=><circle key={i} cx={(x%136)+10} cy={(y%60)+10} r="2.6" fill={index===1?(i<8?"#21dea8":"#ffb129"):(i%3?"#348eff":"#a03dff")}/>)}</svg>;
}

function Home({ act }: { act: (x: string) => void }) {
  return (
    <>
      <section className="pp-hero">
        <div>
          <h1>
            Machine Learning, <em>Visualized</em>
          </h1>
          <p>
            Learn, experiment, and compare 100+ ML algorithms with interactive
            visualizations—all running in your browser.
          </p>
          <button onClick={() => act("Curriculum")}>
            Explore Curriculum →
          </button>
          <button onClick={() => act("Demo")}>▷ Watch Demo</button>
        </div>
        <div className="pp-network"><HeroNetwork /></div>
      </section>
      <section className="pp-homegrid">
        <article className="card">
          <h3>Your Progress</h3>
          <b className="ring">
            62%<small>Course Progress</small>
          </b>
          <p>
            Completed <strong>84/135</strong>
            <br />
            Achievements <strong>18/45</strong>
            <br />
            Points <strong>2,450</strong>
          </p>
        </article>
        <article className="card">
          <h3>🔥 Learning Streak</h3>
          <strong className="days">
            14 <small>days</small>
          </strong>
          <p className="pp-keep">Keep it up! 🔥</p>
          <div className="pp-week">
            {"MTWTFSS".split("").map((day, index) => (
              <small key={`${day}-${index}`}>{day}</small>
            ))}
            {["✓", "✓", "✓", "✓", "✓", "✓", "🔥"].map((day, index) => (
              <i key={`${day}-${index}`}>{day}</i>
            ))}
          </div>
        </article>
        <article className="card continue">
          <div className="thumb"><ContinueGraphic /></div>
          <span>
            <small>
              Continue Learning <em>IN PROGRESS</em>
            </small>
            <h2>Support Vector Machine (SVM)</h2>
            <p>
              Find the optimal hyperplane that best separates classes with
              maximum margin.
            </p>
            <div className="pp-progress">
              <progress value="67" max="100" />
              <small>67% Complete</small>
            </div>
            <button onClick={() => act("Resume Lesson")}>
              ▷ Resume Lesson
            </button>
          </span>
        </article>
      </section>
      <h3 className="pp-sectiontitle">
        Learning Paths{" "}
        <button onClick={() => act("Learning Paths")}>View all →</button>
      </h3>
      <section className="pp-paths">
        {[
          [
            "♧",
            "Beginner Path",
            "Start your ML journey with foundational concepts.",
            "12 / 28 lessons",
          ],
          [
            "➤",
            "Intermediate Path",
            "Level up with classical algorithms and techniques.",
            "16 / 32 lessons",
          ],
          [
            "➤",
            "Advanced Path",
            "Master complex models and real-world applications.",
            "10 / 24 lessons",
          ],
          [
            "♧",
            "Data Scientist Track",
            "End-to-end skills for data science professionals.",
            "18 / 40 lessons",
          ],
        ].map((x) => (
          <button type="button" className="card" key={x[1]} onClick={() => act(x[1])}>
            <i>{x[0]}</i>
            <b>{x[1]}</b>
            <p>{x[2]}</p>
            <small>{x[3]}</small>
            <progress value={+x[3].split(" ")[0]} max={+x[3].split(" ")[2]} />
          </button>
        ))}
      </section>
      <h3 className="pp-sectiontitle">
        Explore Algorithms by Category{" "}
        <button onClick={() => act("All algorithms")}>
          View all algorithms →
        </button>
      </h3>
      <section className="pp-categories">
        {[
          "Supervised Learning",
          "Unsupervised Learning",
          "Deep Learning",
          "Dimensionality Reduction",
          "Time Series",
          "NLP & Text",
        ].map((x, i) => (
          <button type="button" key={x} onClick={() => act(x)}>
            <h3>{x}</h3>
            <small>{[28, 19, 15, 8, 12, 11][i]} algorithms</small>
            <div className={`pp-mini pp-mini-${i}`}><CategoryGraphic index={i} /></div>
          </button>
        ))}
      </section>
      <section className="card pp-recent">
        <h3>
          Recent Experiments{" "}
          <span>
            <button onClick={() => act("Experiments")}>All Experiments⌄</button>
            <button onClick={() => act("Recent Experiments")}>Last 7 days⌄</button>
          </span>
        </h3>
        <header>
          RECENT EXPERIMENTS <span>ALGORITHM</span>
          <span>DATASET</span>
          <span>ACCURACY</span>
          <span>LAST MODIFIED</span>
        </header>
        <p>
          <b>
            Customer Churn Prediction
            <small>Predicting customer churn using ensemble methods</small>
          </b>
          <span>Random Forest</span>
          <span>
            Churn Dataset<small>5.2k samples</small>
          </span>
          <strong>
            92.4%<small>↑ 3.2%</small>
          </strong>
          <span>2h ago</span>
          <button onClick={() => act("Experiments")} aria-label="Run recent experiment">▷</button>
          <button onClick={() => act("Experiments")} aria-label="View recent experiment metrics">▥</button>
          <button onClick={() => act("Experiments")} aria-label="Recent experiment options">⋮</button>
        </p>
      </section>
    </>
  );
}
function Documentation({ act }: { act: (x: string) => void }) {
  return (
    <>
      <nav className="pp-tabs">
        {[
          "Getting Started",
          "Algorithms",
          "Datasets",
          "Experiments",
          "API",
        ].map((x) => (
          <button key={x} onClick={() => act(x)}>
            {x}
          </button>
        ))}
      </nav>
      <section className="pp-docgrid">
        <aside className="card toc">
          <h3>☷ On this page</h3>
          {[
            "Quick Start",
            "Installation",
            "Your First Experiment",
            "Work with Datasets",
            "Train a Model",
            "Evaluate & Compare",
            "Next Steps",
            "Resources",
            "Concepts",
            "Best Practices",
            "Troubleshooting",
            "FAQ",
            "Reference",
            "CLI Reference",
            "SDK Reference",
            "API Reference",
          ].map((x) => (
            <button key={x} onClick={() => act(x)}>
              {x}
            </button>
          ))}
        </aside>
        <main className="card quick">
          <h2>🚀 Quick Start</h2>
          <p>Go from zero to your first model in three simple steps.</p>
          <div className="steps">
            {[
              ["1", "Prepare Data"],
              ["2", "Train Model"],
              ["3", "Evaluate"],
            ].map((x) => (
              <article key={x[0]}>
                <i>{x[0]}</i>
                <b>{x[1]}</b>
                <p>Select your data and follow recommended defaults.</p>
              </article>
            ))}
          </div>
          <nav>
            <button>Python (SDK)</button>
            <button>CLI</button>
            <button>REST API</button>
            <button onClick={() => act("Playground")}>
              Open in Playground
            </button>
          </nav>
          <pre>
            <button onClick={() => act("Copy")}>▣ Copy</button>
            {`from mega import Client\nclient = Client(api_key="YOUR_API_KEY")\n\ndataset = client.datasets.get("customer_churn_v2")\nexperiment = client.experiments.create(name="Churn Prediction")\nrun = experiment.train(algorithm="xgboost", target="churn")\nmetrics = run.evaluate()\nprint(metrics.summary())`}
          </pre>
        </main>
        <aside className="pp-guides">
          <article className="card">
            <h2>☆ Popular Guides</h2>
            {[
              "Hyperparameter Optimization",
              "Feature Engineering Best Practices",
              "Model Evaluation Guide",
              "Working with Time Series Data",
              "Deploy Your Model to Production",
            ].map((x) => (
              <p key={x}>› {x}</p>
            ))}
          </article>
          <article className="card">
            <h2>▦ Keyboard Shortcuts</h2>
            <p>⌘ K Search documentation</p>
            <p>⌘ / Toggle command palette</p>
            <p>⌘ Enter Run in playground</p>
          </article>
          <article className="card">
            <h2>♢ Current Version</h2>
            <b className="days">v2.7.0</b>
            <p>Released May 12, 2025</p>
          </article>
        </aside>
      </section>
      <section className="card pp-algoref">
        <h2>♧ Algorithm Reference</h2>
        {[
          "XGBoost",
          "LightGBM",
          "Neural Network",
          "Logistic Regression",
          "Random Forest",
        ].map((x) => (
          <article key={x}>
            <b>{x}</b>
            <div>⌁ ◇ ⌁</div>
            <p>High performance model for structured data.</p>
            <small>Default Metric: AUC</small>
          </article>
        ))}
      </section>
    </>
  );
}
function DatasetLibrary({ act }: { act: (x: string) => void }) {
  const [selected, setSelected] = useState(0);
  const uploadRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <nav className="pp-tabs">
        {["Browse", "Preview", "Profile", "Versions"].map((x) => (
          <button key={x} onClick={() => act(x)}>
            {x}
          </button>
        ))}
        <span className="pp-dataset-actions">
          <button onClick={() => act("Import from Source")}>
            ＋ Import from Source
          </button>
          <button onClick={() => uploadRef.current?.click()}>
            ↑ Upload Dataset
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept=".csv,.json,.tsv"
            aria-label="Upload dataset file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) act(`Uploaded ${file.name}`);
            }}
          />
        </span>
      </nav>
      <section className="pp-dataset-tools">
        <input aria-label="Search datasets" placeholder="Search datasets..." />
        {[
          "Task: All",
          "Data Type: All",
          "Rows: Any",
          "Columns: Any",
          "More Filters",
        ].map((x) => (
          <button key={x} onClick={() => act(x)}>
            {x}⌄
          </button>
        ))}
      </section>
      <section className="pp-library">
        <article className="card pp-dataset-list">
          <header>
            <span>DATASET</span>
            <span>TASK</span>
            <span>ROWS</span>
            <span>COLUMNS</span>
            <span>ADDED</span>
          </header>
          {datasets.map((x, i) => (
            <button
              className={selected === i ? "selected" : ""}
              key={x}
              onClick={() => setSelected(i)}
            >
              {x}
              <span>
                {
                  [
                    "Classification",
                    "Classification",
                    "Classification",
                    "Regression",
                    "Classification",
                    "Regression",
                    "Classification",
                    "Regression",
                    "Classification",
                    "Classification",
                  ][i]
                }
              </span>
              <b>
                {[
                  10000, 1024, 891, 14560, 150, 50000, 284807, 7680, 1470,
                  20000,
                ][i].toLocaleString()}
              </b>
              <small>{[21, 14, 12, 18, 5, 24, 31, 10, 35, 8][i]}</small>
              <em>
                {
                  [
                    "25 min",
                    "2 hrs",
                    "5 hrs",
                    "1 day",
                    "2 days",
                    "2 days",
                    "3 days",
                    "4 days",
                    "5 days",
                    "6 days",
                  ][i]
                }{" "}
                ago
              </em>
            </button>
          ))}
          <footer>
            <span>1–10 of 24 datasets</span>
            <button>‹</button>
            <button>1</button>
            <button>2</button>
            <button>3</button>
            <button>›</button>
          </footer>
        </article>
        <article className="card pp-preview">
          <h3>
            Preview: {datasets[selected]} <small>Classification</small>
          </h3>
          <div className="table">
            <header>
              {[
                "customer_id",
                "tenure_months",
                "monthly_charges",
                "total_charges",
                "contract_type",
                "churn",
              ].map((x, i) => (
                <b key={x}>
                  {x}
                  <small>
                    {i < 2 ? "int64" : i < 4 ? "float64" : "object"}
                  </small>
                </b>
              ))}
            </header>
            {[
              [10001, 34, "56.05", "1905.70", "Month-to-month", "No"],
              [10002, 2, "20.15", "39.70", "Month-to-month", "Yes"],
              [10003, 45, "71.20", "3204.00", "One year", "No"],
              [10004, 2, "72.10", "72.10", "Month-to-month", "Yes"],
              [10005, 8, "28.50", "213.40", "Month-to-month", "No"],
            ].map((row, i) => (
              <p key={i}>
                {row.map((value, j) => (
                  <span
                    className={j === 5 && value === "Yes" ? "danger" : ""}
                    key={j}
                  >
                    {value}
                  </span>
                ))}
              </p>
            ))}
          </div>
          <footer>
            <span>Showing first 5 rows</span>
            <span>10,000 rows × 21 columns</span>
          </footer>
        </article>
        <aside>
          <section className="card">
            <h3>Dataset Actions</h3>
            {[
              "↗ Open in New Tab",
              "☆ Add to Collection",
              "▣ Create New Version",
              "↓ Download CSV",
              "↓ Download Parquet",
              "♜ Delete Dataset",
            ].map((x) => (
              <button
                className={x.includes("Delete") ? "danger" : ""}
                key={x}
                onClick={() => act(x)}
              >
                {x}
              </button>
            ))}
          </section>
          <section className="card pp-dataset-info">
            <h3>Dataset Info</h3>
            <p>
              Created <b>May 20, 2025, 10:15 AM</b>
            </p>
            <p>
              Source <b>Uploaded</b>
            </p>
            <p>
              File Format <b>CSV</b>
            </p>
            <p>
              Size <b>2.4 MB</b>
            </p>
            <p>
              Rows × Columns <b>10,000 × 21</b>
            </p>
            <p>
              Target Column <b>churn</b>
            </p>
            <p>
              Task <b>Classification</b>
            </p>
          </section>
        </aside>
      </section>
      <section className="pp-profile">
        {[
          "Schema Overview",
          "Missing Values",
          "Class Balance (churn)",
          "Feature Types",
        ].map((x, i) => (
          <article className="card" key={x}>
            <h3>{x}</h3>
            <div className={i % 2 ? "bars" : "ring"}>
              {i % 2 ? (
                <>
                  {[57, 29, 10, 5].map((v, j) => (
                    <i key={j}>
                      <span style={{ width: `${v}%` }} />
                    </i>
                  ))}
                </>
              ) : i === 0 ? (
                "21"
              ) : (
                "73.5%"
              )}
            </div>
            <p>
              {i === 0 ? (
                <>
                  ● Numeric <b>12 (57.1%)</b>
                  <br />● Categorical <b>6 (28.6%)</b>
                  <br />● Boolean <b>2 (9.5%)</b>
                  <br />● Date/Time <b>1 (4.8%)</b>
                </>
              ) : i === 1 ? (
                <>
                  Overall Missing <b>325 / 10,000</b>
                  <br />
                  total_charges <b>1.20%</b>
                  <br />
                  last_contact_date <b>18.40%</b>
                </>
              ) : i === 2 ? (
                <>
                  ● No <b>7,353</b>
                  <br />● Yes <b>2,647</b>
                  <br />
                  Imbalance Ratio <b>2.78:1</b>
                </>
              ) : (
                <>
                  Numeric <b>12 (57.1%)</b>
                  <br />
                  Categorical <b>6 (28.6%)</b>
                  <br />
                  Boolean <b>2 (9.5%)</b>
                </>
              )}
            </p>
          </article>
        ))}
      </section>
      <section className="card pp-insights">
        <h3>Insights</h3>
        <p>
          {[
            ["✓", "Dataset is clean", "No duplicate rows detected."],
            ["⚠", "Missing values", "2 columns have > 10% missing values."],
            ["ⓘ", "Class imbalance", "Target ratio is 2.78:1 (No:Yes)."],
            [
              "♧",
              "High cardinality",
              "2 categorical columns with high cardinality.",
            ],
            ["ϟ", "Ready to model", "Dataset is ready for training."],
          ].map((x) => (
            <span key={x[1]}>
              <i>{x[0]}</i>
              <b>{x[1]}</b>
              <small>{x[2]}</small>
            </span>
          ))}
        </p>
      </section>
    </>
  );
}
function Sitemap({ act }: { act: (x: string) => void }) {
  const groups = [
    [
      "⌁",
      "Supervised Learning",
      "12 / 18",
      [
        "Linear Regression",
        "Logistic Regression",
        "Decision Trees",
        "Random Forests",
        "Gradient Boosting",
        "SVM",
      ],
      "+ 12 more",
    ],
    [
      "◌",
      "Unsupervised Learning",
      "8 / 12",
      [
        "K-Means Clustering",
        "Hierarchical Clustering",
        "DBSCAN",
        "PCA",
        "t-SNE",
      ],
      "+ 7 more",
    ],
    [
      "♧",
      "Deep Learning",
      "15 / 24",
      ["Neural Networks", "CNNs", "RNNs", "Transformers", "Autoencoders"],
      "+ 19 more",
    ],
    [
      "▣",
      "Reinforcement Learning",
      "6 / 10",
      ["MDPs", "Q-Learning", "Policy Gradients", "Actor–Critic"],
      "+ 6 more",
    ],
    [
      "⌁",
      "Probabilistic Models",
      "7 / 11",
      ["Bayes Theorem", "Naive Bayes", "HMMs", "GMM"],
      "+ 7 more",
    ],
    [
      "∞",
      "MLOps & Deployment",
      "9 / 14",
      [
        "Model Evaluation",
        "Feature Engineering",
        "Model Serving",
        "Monitoring",
        "CI/CD for ML",
      ],
      "+ 9 more",
    ],
  ];
  return (
    <>
      <nav className="pp-tabs">
        {[
          "Learn",
          "Visualize",
          "Dataset",
          "Train",
          "Metrics",
          "Compare",
          "Explain",
        ].map((x) => (
          <button key={x} onClick={() => act(x)}>
            {x}
          </button>
        ))}
      </nav>
      <section className="pp-maptools">
        <span>● Not Started ● In Progress ● Review ● Completed ● Expert</span>
        <label>
          <input type="checkbox" defaultChecked /> Show Prerequisites
        </label>
        <button onClick={() => act("Zoom Out")}>−</button>
        <b>100%</b>
        <button onClick={() => act("Zoom In")}>＋</button>
      </section>
      <section className="pp-sitemap-grid">
        <main>
          <article className="foundation">
            ✣ <b>Foundations</b>
            <small>0 / 7</small>
          </article>
          <div className="branches">
            {groups.map((x) => (
              <section key={String(x[1])}>
                <h3>
                  <i>{String(x[0])}</i>
                  {String(x[1])}
                  <small>{String(x[2])}</small>
                </h3>
                {(x[3] as string[]).map((n, j) => (
                  <button key={n} onClick={() => act(n)}>
                    {n}
                    <i>{j < 2 ? "✓" : j === 2 ? "◐" : "○"}</i>
                  </button>
                ))}
                <button onClick={() => act(String(x[4]))}>
                  {String(x[4])}
                </button>
              </section>
            ))}
          </div>
        </main>
        <aside className="card">
          <h3>♧ Filters</h3>
          {["ML Family", "Difficulty", "Status", "Key Topics"].map((x) => (
            <label key={x}>
              {x}
              <select aria-label={x}>
                <option>All {x}</option>
              </select>
            </label>
          ))}
          <article>
            <b>Learning Path</b>
            <p>Select a goal or path...</p>
          </article>
          <article>
            <b>Dataset</b>
            <h3>Titanic Passenger Data</h3>
            <p>891 rows 12 features</p>
            <button onClick={() => act("Open Dataset")}>Open in Dataset</button>
            <button onClick={() => act("Upload Dataset")}>
              ↑ Upload Your Dataset
            </button>
          </article>
        </aside>
      </section>
      <section className="card pp-learning">
        <h3>Learning Insights</h3>
        {[
          ["42%", "Overall Progress"],
          ["56", "Completed"],
          ["32", "In Progress"],
          ["18", "To Review"],
          ["78h 24m", "Time Invested"],
        ].map((x) => (
          <article
            key={x[1]}
            className={x[1] === "Overall Progress" ? "overall" : ""}
          >
            <b>{x[0]}</b>
            <span>{x[1]}</span>
          </article>
        ))}
        <aside>
          <small>Recommended Next</small>
          <b>♧ Transformers</b>
          <span>Deep Learning · 65% match</span>
          <button onClick={() => act("Transformers")}>Start Lesson →</button>
        </aside>
      </section>
    </>
  );
}
function Matrix({ act }: { act: (x: string) => void }) {
  return (
    <>
      <nav className="pp-tabs">
        {[
          "Learn",
          "Visualize",
          "Dataset",
          "Train",
          "Metrics",
          "Compare",
          "Explain",
        ].map((x) => (
          <button key={x} onClick={() => act(x)}>
            {x}
          </button>
        ))}
      </nav>
      <section className="pp-stats">
        {[
          ["Algorithms", "135"],
          ["Implementations", "482"],
          ["Datasets", "24"],
          ["Overall Readiness", "78%"],
        ].map((x) => (
          <article className="card" key={x[0]}>
            {x[0]}
            <b>{x[1]}</b>
          </article>
        ))}
      </section>
      <section className="pp-matrix-grid">
        <main className="card">
          <div className="pp-filters">
            <input
              aria-label="Search algorithms"
              placeholder="Search algorithms..."
            />
            {[
              "All Paradigms",
              "All Readiness",
              "All Datasets",
              "All Licenses",
              "Browser: All",
            ].map((x) => (
              <button key={x} onClick={() => act(x)}>
                {x}⌄
              </button>
            ))}
            <button onClick={() => act("Clear filters")}>Clear</button>
          </div>
          <header>
            {[
              "Algorithm",
              "Paradigm",
              "Readiness",
              "Dataset Coverage",
              "Training Support",
              "Key Metrics (Top 3)",
              "Browser Support",
              "Actions",
            ].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </header>
          {algorithms.map((x, i) => (
            <p key={x}>
              <b>{x}</b>
              <span>{i < 10 ? "Classical ML" : "Deep Learning"}</span>
              <em>● {80 + i}%</em>
              <i>▮▮▮▮▮▮▮▮ {18 + (i % 7)}/24</i>
              <small>{i > 9 ? "GPU" : "CPU"}</small>
              <span>
                <small>Acc {(0.87 + i * 0.008).toFixed(2)}</small>
                <small>F1 {(0.86 + i * 0.007).toFixed(2)}</small>
                <small>AUC {(0.9 + i * 0.006).toFixed(2)}</small>
              </span>
              <strong>◎ ◎ ◎ ◎</strong>
              <button onClick={() => act(`${x} actions`)}>•••</button>
            </p>
          ))}
        </main>
        <aside className="card">
          <h3>
            Dataset <small>24 available</small>
          </h3>
          <article>
            <b>Titanic Survival</b>
            <p>◉ Classification · ▣ Tabular</p>
            <p>
              7,130 rows · 14 features · <span>● Active</span>
            </p>
            <button onClick={() => act("Open Dataset")}>Open Dataset</button>
            <button onClick={() => act("Upload Dataset")}>
              ↑ Upload Dataset
            </button>
          </article>
          <h3>Filters</h3>
          {[
            "Readiness",
            "Paradigm",
            "Training Support",
            "Browser Support",
            "License",
            "Metrics",
          ].map((x) => (
            <button key={x} onClick={() => act(x)}>
              {x}⌄
            </button>
          ))}
        </aside>
      </section>
      <section className="pp-matrix-bottom">
        {[
          [
            "Implementation Readiness",
            "78%",
            "Production Ready 56%\nGood 22%\nExperimental 14%\nLimited 8%",
          ],
          [
            "Insights",
            "ⓘ",
            "Tree-based models show the highest cross-browser compatibility.\nDeep learning models benefit most from GPU training.\nTransformer models require more data.",
          ],
          [
            "Top Performers (by AUC)",
            "0.99",
            "1. Transformer　0.99\n2. CNN　0.99\n3. XGBoost　0.98\n4. Neural Network　0.98",
          ],
          [
            "Browser Compatibility",
            "92%",
            "Full Support 92%\nPartial Support 6%\nNo Support 2%",
          ],
        ].map((x, i) => (
          <article className="card" key={x[0]}>
            <h3>{x[0]}</h3>
            <b className={i % 3 === 0 ? "ring" : "days"}>{x[1]}</b>
            <p>
              {x[2].split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}

export default function PlatformApprovedPage({ page }: { page: PlatformPage }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Ready");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const titles = {
    home: ["", ""],
    documentation: [
      "Documentation",
      "Your guide to the Mega ML platform. Learn, build, and scale with confidence.",
    ],
    datasets: [
      "Dataset Library",
      "Discover, preview, and profile datasets. Upload your own data or connect to sources.",
    ],
    sitemap: [
      "Sitemap",
      "Visual map of the learning platform organized by ML families",
    ],
    matrix: [
      "Implementation Matrix",
      "Comprehensive algorithm implementation landscape across datasets, training, metrics and browser support.",
    ],
  };
  const actionRoutes: Record<string, string> = {
    Home: "/", Curriculum: "/sitemap", Experiments: "/ml/lab/saved-experiments",
    Visualizations: "/ml/lab/interactive-training-visualizations", Playground: "/ml/deep-learning/nn-playground",
    Datasets: "/dataset-library", Bookmarks: "/sitemap", Achievements: "/implementation-matrix",
    "Gradient Boosting": "/ml/supervised/gradient-boosting-classification", "LSTM Networks": "/ml/deep-learning/lstm",
    "K-Means Clustering": "/ml/clustering/k-means", "Linear Regression": "/ml/supervised/simple-linear-regression",
    "SVM Classification": "/ml/supervised/svm-classification", Practice: "/ml/lab/algorithm-comparison",
    Teacher: "/documentation", Demo: "/ml/deep-learning/nn-playground", "Resume Lesson": "/ml/supervised/svm-classification",
    "Beginner Path": "/ml/supervised/simple-linear-regression", "Intermediate Path": "/ml/supervised/ridge-regression",
    "Advanced Path": "/ml/deep-learning/transformer-attention", "Data Scientist Track": "/ml/lab/algorithm-comparison",
    "Supervised Learning": "/ml/supervised/simple-linear-regression", "Unsupervised Learning": "/ml/clustering/k-means",
    "Deep Learning": "/ml/deep-learning/perceptron", "Dimensionality Reduction": "/ml/dimensionality-reduction/pca",
    "Time Series": "/ml/time-series/moving-average", "NLP & Text": "/ml/nlp/tf-idf",
  };
  const act = (x: string) => {
    if (x === "All algorithms" || x === "Learning Paths") {
      setCatalogOpen(true);
      return;
    }
    const route = actionRoutes[x];
    if (route) navigate(route);
    else setStatus(`${x} opened`);
  };
  useEffect(() => {
    if (!sideOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSideOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sideOpen]);
  return (
    <div className={`pp-page pp-${page}${sideOpen ? " side-open" : ""}`}>
      <button
        className="pp-mobile-menu"
        aria-label={sideOpen ? "Close menu" : "Open menu"}
        aria-expanded={sideOpen}
        onClick={() => setSideOpen((open) => !open)}
      >
        {sideOpen ? "×" : "☰"}
      </button>
      {sideOpen && (
        <div
          className="pp-mobile-drawer"
          role="dialog"
          aria-label="Navigation menu"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSideOpen(false);
          }}
        >
          <div>
            <div className="pp-mobile-nav-tools">
              <input placeholder="Search algorithms..." />
              <a href="/ml/lab/dataset-manager">Dataset Manager</a>
            </div>
            <Side
              page={page}
              active={
                page === "home"
                  ? "Home"
                  : page === "datasets"
                    ? "Dataset Library"
                    : page === "sitemap"
                      ? "Curriculum"
                      : page === "documentation"
                        ? "Documentation"
                        : "Implementation Matrix"
              }
              onAction={(action) => {
                act(action);
                setSideOpen(false);
              }}
            />
          </div>
        </div>
      )}
      <Side
        page={page}
        active={
          page === "home"
            ? "Home"
            : page === "datasets"
              ? "Dataset Library"
              : page === "sitemap"
                ? "Curriculum"
                : page === "documentation"
                  ? "Documentation"
                  : "Implementation Matrix"
        }
        onAction={(action) => {
          act(action);
          setSideOpen(false);
        }}
      />
      {page !== "home" && (
        <Header
          title={titles[page][0]}
          subtitle={titles[page][1]}
          onAction={act}
        />
      )}
      {page === "home" && (
        <header className="pp-homehead">
          <input
            aria-label="Search algorithms"
            placeholder="Search algorithms, topics, experiments..."
            onKeyDown={(event) => { if (event.key === "Enter") setCatalogOpen(true); }}
          />
          <button onClick={() => act("Datasets")}>▤ Datasets</button>
          <button onClick={() => act("Practice")}>▧ Practice</button>
          <button onClick={() => act("Teacher")}>♧ Teacher</button>
          <b>
            🔥 14 <small>day streak</small>
          </b>
          <span className="pp-avatar" aria-hidden="true">AM</span>
          <button onClick={() => act("Profile")}>Alex Morgan <small>Explorer</small>⌄</button>
        </header>
      )}
      <div className="pp-content">
        {page === "home" ? (
          <Home act={act} />
        ) : page === "documentation" ? (
          <Documentation act={act} />
        ) : page === "datasets" ? (
          <DatasetLibrary act={act} />
        ) : page === "sitemap" ? (
          <Sitemap act={act} />
        ) : (
          <Matrix act={act} />
        )}
      </div>
      <footer className="pp-status">
        {status}
        <span className="pp-legal">
          www.AimerSociety.com · AI Learning Tools
        </span>
      </footer>
      {page === "home" && catalogOpen && (
        <section
          className="pp-catalog"
          role="dialog"
          aria-label="All algorithms"
        >
          <header>
            <div>
              <small>MEGA ML CATALOG</small>
              <h2>All Algorithms, Lessons, Labs & Tools</h2>
            </div>
            <button onClick={() => setCatalogOpen(false)}>Close ×</button>
          </header>
          <div>
            {navigationData.map((group) => (
              <article key={group.category}>
                <h3>{group.category}</h3>
                {group.items.map((item) => (
                  <a href={item.route} key={item.route}>
                    <span>{item.label}</span>
                    <small>{item.badge}</small>
                  </a>
                ))}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
