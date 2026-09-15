import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { normalizeNavLabel, resolveNavRoute } from "../../lib/labNavigation";
import { navigationData } from "../../data/navigation";
import DatasetLibrary from "./DatasetLibraryApproved";
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
const categoryCatalogFilters: Record<string, string[]> = {
  "Supervised Learning": [
    "Supervised - Regression",
    "Supervised - Classification",
  ],
  "Unsupervised Learning": ["Clustering"],
  "Deep Learning": ["Deep Learning"],
  "Dimensionality Reduction": ["Dimensionality Reduction"],
  "Time Series": ["Time Series"],
  "NLP & Text": ["NLP"],
};

function sideItemLabel(raw: string) {
  return normalizeNavLabel(raw);
}

function Side({
  page,
  active,
  collapsed,
  onAction,
}: {
  page: PlatformPage;
  active: string;
  collapsed?: boolean;
  onAction: (x: string) => void;
}) {
  const activeKey = normalizeNavLabel(active);
  return (
    <aside className="pp-side">
      <Link to="/" className="pp-brand" onClick={() => onAction("Home")}>
        <i>∞</i>
        <span>
          <b>Mega ML</b>
          <small>
            {page === "home" ? "ALGORITHMS SUITE" : "AI OBSERVATORY"}
          </small>
        </span>
      </Link>
      {sideGroups[page].map(([group, items], groupIndex) => (
        <section className="pp-sidegroup" key={`${group}-${groupIndex}`}>
          {group && <p>{group}</p>}
          {items.map((x) => {
            const label = sideItemLabel(x);
            const route = resolveNavRoute(label);
            const className = label === activeKey || x.includes(active) ? "active" : "";
            const body = (
              <>
                {x}
                {page === "home" && group === "RECENT" && (
                  <small>
                    {x.includes("Linear")
                      ? "Beginner"
                      : x.includes("K-Means")
                        ? "Intermediate"
                        : "Advanced"}{" "}
                    <span>›</span>
                  </small>
                )}
              </>
            );
            return route ? (
              <Link
                className={className}
                key={x}
                to={route}
                onClick={() => onAction(label)}
              >
                {body}
              </Link>
            ) : (
              <button
                type="button"
                className={className}
                key={x}
                onClick={() => onAction(label)}
              >
                {body}
              </button>
            );
          })}
        </section>
      ))}
      <div className="pp-side-footer">
        {page === "datasets" && (
          <article className="pp-storage">
            <small>STORAGE</small>
            <b>412 GB / 1 TB</b>
            <progress value="41" max="100" />
            <button type="button" className="pp-storage-link" onClick={() => onAction("Manage Storage")}>
              Manage Storage
            </button>
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
        <button type="button" onClick={() => onAction("Collapse")}>
          {collapsed ? "» Expand" : "« Collapse"}
        </button>
      </div>
    </aside>
  );
}
function Header({
  title,
  subtitle,
  onAction,
  search,
  onSearch,
}: {
  title: string;
  subtitle: string;
  onAction: (x: string) => void;
  search?: string;
  onSearch?: (value: string) => void;
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
        value={search ?? ""}
        onChange={(event) => onSearch?.(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onAction("Search");
        }}
      />
      <button onClick={() => onAction("Theme")} aria-label="Toggle theme">
        ◔
      </button>
      <button onClick={() => onAction("Profile")} aria-label="Open profile">
        ML
      </button>
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
          ["63", "Completed"],
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
    Datasets: "/dataset-library",
    "Dataset Library": "/dataset-library",
    Demo: "/ml/deep-learning/nn-playground",
    "Resume Lesson": "/ml/supervised/svm-classification",
  };
  const [catalogFilter, setCatalogFilter] = useState<string | null>(null);
  const [headerSearch, setHeaderSearch] = useState("");
  const [datasetCommand, setDatasetCommand] = useState<string | null>(null);
  const [datasetShelf, setDatasetShelf] = useState("Dataset Library");
  const [collapsed, setCollapsed] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const openCatalog = (filter: string | null) => {
    setCatalogFilter(filter);
    setCatalogOpen(true);
  };
  const catalogGroups = catalogFilter
    ? navigationData.filter((group) =>
        categoryCatalogFilters[catalogFilter]?.includes(group.category),
      )
    : navigationData;
  const datasetCommands = new Set([
    "Browse",
    "Preview",
    "Profile",
    "Versions",
    "Dataset Library",
    "My Collections",
    "Favorites",
    "Data Sources",
    "Import from Source",
    "Upload Dataset",
    "Manage Storage",
    "New Project",
    "Customer Churn",
    "Fraud Detection",
    "Market Basket",
    "Medical Imaging",
    "Text Analytics",
    "Customer Churn Dataset",
    "Heart Disease Dataset",
    "Titanic Survival Dataset",
    "House Prices Dataset",
    "Iris Dataset",
    "Open Dataset",
    "Add to Collection",
    "Download Parquet",
  ]);
  const act = (x: string) => {
    if (x === "Collapse") {
      setCollapsed((open) => !open);
      return;
    }
    if (x === "Theme") {
      setLightTheme((value) => !value);
      return;
    }
    if (x === "Profile" || x === "Search") {
      setStatus(x === "Profile" ? "Signed in as Alex Morgan · Explorer" : `Search: ${headerSearch || "type a query"}`);
      return;
    }
    if (x === "All algorithms" || x === "Learning Paths") {
      openCatalog(null);
      return;
    }
    if (x in categoryCatalogFilters) {
      openCatalog(x);
      return;
    }
    if (page === "datasets" && datasetCommands.has(x)) {
      setDatasetCommand(x);
      return;
    }
    const route = actionRoutes[x] ?? resolveNavRoute(x);
    if (route) navigate(route);
    else setStatus(x);
  };
  useEffect(() => {
    if (!sideOpen && !catalogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSideOpen(false);
      setCatalogOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sideOpen, catalogOpen]);
  return (
    <div className={`pp-page pp-${page}${sideOpen ? " side-open" : ""}${collapsed ? " side-collapsed" : ""}${lightTheme ? " pp-light" : ""}`}>
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
              collapsed={collapsed}
              active={
                page === "home"
                  ? "Home"
                  : page === "datasets"
                    ? datasetShelf
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
        collapsed={collapsed}
        active={
          page === "home"
            ? "Home"
            : page === "datasets"
              ? datasetShelf
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
          search={page === "datasets" ? headerSearch : undefined}
          onSearch={page === "datasets" ? setHeaderSearch : undefined}
        />
      )}
      {page === "home" && (
        <header className="pp-homehead">
          <input
            aria-label="Search algorithms"
            placeholder="Search algorithms, topics, experiments..."
            onKeyDown={(event) => { if (event.key === "Enter") openCatalog(null); }}
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
          <DatasetLibrary
            act={act}
            command={datasetCommand}
            onCommandHandled={() => setDatasetCommand(null)}
            headerSearch={headerSearch}
            onShelfChange={setDatasetShelf}
          />
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
      {catalogOpen && (
        <section
          className="pp-catalog"
          role="dialog"
          aria-label={catalogFilter ?? "All algorithms"}
        >
          <header>
            <div>
              <small>MEGA ML CATALOG</small>
              <h2>
                {catalogFilter
                  ? `${catalogFilter} algorithms`
                  : "All Algorithms, Lessons, Labs & Tools"}
              </h2>
            </div>
            <button onClick={() => setCatalogOpen(false)}>Close ×</button>
          </header>
          <div className={catalogGroups.length <= 2 ? "pp-catalog-narrow" : undefined}>
            {catalogGroups.map((group) => (
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
