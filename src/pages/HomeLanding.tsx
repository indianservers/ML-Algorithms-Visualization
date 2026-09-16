import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronDown,
  Database,
  FlaskConical,
  Gamepad2,
  Infinity as InfinityIcon,
  Layers,
  MessageSquare,
  Minimize2,
  Moon,
  Play,
  Quote,
  Search,
  Sparkles,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import { navigationData, type BadgeType, type NavItem } from "../data/navigation";
import { allSampleDatasets } from "../data/sampleDatasets";
import { searchAlgorithms } from "../lib/search/algorithmSearchIndex";
import { useTheme } from "../stores/uiStore";
import { AlgorithmArt, type ArtKey } from "../components/home/AlgorithmArt";
import { BrainVisual } from "../components/home/BrainVisual";
import "./HomeLanding.css";

type Level = "Beginner" | "Intermediate" | "Advanced";

type Card = {
  label: string;
  blurb: string;
  route: string;
  level: Level;
  artKey?: ArtKey;
  category: string;
};

type Group = {
  id: string;
  title: string;
  blurb: string;
  tone: "blue" | "green" | "purple";
  icon: React.ReactNode;
  categories: string[];
  featured: Card[];
};

const LEVEL_OF: Record<BadgeType, Level> = {
  Beginner: "Beginner",
  Intermediate: "Intermediate",
  Advanced: "Advanced",
  Concept: "Intermediate",
  "Browser Trainable": "Advanced",
  "Browser Inference": "Advanced",
  Educational: "Beginner",
  "Educational Simplified": "Beginner",
};

const items = navigationData.flatMap((group) =>
  group.items.map((item) => ({ ...item, category: group.category })),
);

const byCategory = (names: string[]) => items.filter((item) => names.includes(item.category));

function findLabel(route: string) {
  return items.find((item) => item.route === route)?.label ?? route;
}

function card(route: string, blurb: string, level: Level, label?: string, artKey?: ArtKey): Card {
  const found = items.find((item) => item.route === route);
  return {
    label: label ?? findLabel(route),
    blurb,
    route,
    level,
    artKey,
    category: found?.category ?? "",
  };
}

const groups: Group[] = [
  {
    id: "supervised",
    title: "Supervised Learning",
    blurb: "Learn from labeled data to predict outcomes",
    tone: "blue",
    icon: <Boxes />,
    categories: ["Supervised - Regression", "Supervised - Classification"],
    featured: [
      card("/ml/supervised/simple-linear-regression", "Predict continuous values", "Beginner", "Linear Regression"),
      card("/ml/supervised/logistic-regression", "Binary classification", "Beginner"),
      card("/ml/supervised/decision-tree-classification", "Tree-based learning", "Intermediate", "Decision Trees"),
      card("/ml/supervised/random-forest-classification", "Ensemble of trees", "Intermediate", "Random Forest"),
      card("/ml/supervised/svm-classification", "Optimal hyperplane", "Advanced", "Support Vector Machine"),
      card("/ml/deep-learning/perceptron", "Deep learning models", "Advanced", "Neural Networks", "neural-network"),
    ],
  },
  {
    id: "unsupervised",
    title: "Unsupervised Learning",
    blurb: "Find hidden patterns in unlabeled data",
    tone: "green",
    icon: <Layers />,
    categories: ["Clustering", "Dimensionality Reduction"],
    featured: [
      card("/ml/clustering/k-means", "Group similar data", "Beginner", "K-Means Clustering"),
      card("/ml/clustering/hierarchical-clustering", "Tree-based clustering", "Intermediate"),
      card("/ml/dimensionality-reduction/pca", "Dimensionality reduction", "Intermediate"),
      card("/ml/dimensionality-reduction/tsne", "Visualize high-dimensional data", "Advanced", "t-SNE"),
      card("/ml/clustering/dbscan", "Density-based clustering", "Advanced"),
      card("/ml/dimensionality-reduction/autoencoder", "Neural dimensionality reduction", "Advanced", "Autoencoders"),
    ],
  },
  {
    id: "deep-learning",
    title: "Deep Learning",
    blurb: "Neural networks for complex problems",
    tone: "purple",
    icon: <Sparkles />,
    categories: ["Deep Learning"],
    featured: [
      card("/ml/deep-learning/mlp", "Basic neural networks", "Beginner", "Feedforward NN", "feedforward-nn"),
      card("/ml/deep-learning/cnn", "Image classification", "Intermediate"),
      card("/ml/deep-learning/rnn", "Sequential data", "Intermediate"),
      card("/ml/deep-learning/lstm", "Long-term memory", "Intermediate"),
      card("/ml/deep-learning/transformer-attention", "Attention mechanism", "Advanced", "Transformer"),
      card("/ml/deep-learning/multi-head-attention", "Parallel attention heads", "Advanced", "Multi-Head Attention"),
    ],
  },
];

const miniCategories = [
  {
    title: "Dimensionality Reduction",
    blurb: "Reduce feature space complexity",
    tone: "amber",
    icon: <Minimize2 />,
    category: "Dimensionality Reduction",
    route: "/ml/dimensionality-reduction/pca",
  },
  {
    title: "Time Series",
    blurb: "Analyze sequential data",
    tone: "teal",
    icon: <Activity />,
    category: "Time Series",
    route: "/ml/time-series/moving-average",
  },
  {
    title: "NLP & Text",
    blurb: "Process and understand text",
    tone: "rose",
    icon: <MessageSquare />,
    category: "NLP",
    route: "/ml/nlp/tf-idf",
  },
  {
    title: "Reinforcement Learning",
    blurb: "Learn through interaction",
    tone: "indigo",
    icon: <Gamepad2 />,
    category: "Reinforcement Learning",
    route: "/ml/reinforcement-learning/q-learning-grid-world",
  },
] as const;

const FILTERS: Array<Level | "All"> = ["All", "Beginner", "Intermediate", "Advanced"];

function toCard(item: NavItem & { category: string }): Card {
  return {
    label: item.label,
    blurb: item.category.replace(" - ", " · "),
    route: item.route,
    level: LEVEL_OF[item.badge],
    category: item.category,
  };
}

/** Ranked catalogue match; empty query keeps featured-first pool order. */
function matchAlgorithms(pool: Card[], query: string, level: Level | "All"): Card[] {
  if (!query.trim()) {
    return pool.filter((item) => level === "All" || item.level === level);
  }
  const byRoute = new Map(pool.map((item) => [item.route, item]));
  const categories = [...new Set(pool.map((item) => item.category))];
  return searchAlgorithms(query, { level, categories })
    .filter((entry) => byRoute.has(entry.route))
    .map((entry) => {
      const existing = byRoute.get(entry.route);
      return existing
        ? { ...existing, blurb: entry.description || existing.blurb }
        : toCard(entry);
    });
}

/**
 * Featured cards first, then the rest of the category in catalogue order.
 * `claimed` holds routes featured by any group, so a cross-listed algorithm
 * (the perceptron is featured as "Neural Networks" under Supervised) is not
 * repeated when another group expands.
 */
function fullList(categories: string[], featured: Card[] = [], claimed?: Set<string>): Card[] {
  const skip = claimed ?? new Set(featured.map((entry) => entry.route));
  const rest = byCategory(categories)
    .filter((item) => !skip.has(item.route))
    .map(toCard);
  return [...featured, ...rest];
}

const featuredRoutes = new Set(groups.flatMap((group) => group.featured.map((entry) => entry.route)));

const groupLists: Record<string, Card[]> = Object.fromEntries(
  groups.map((group) => [group.id, fullList(group.categories, group.featured, featuredRoutes)]),
);

const miniLists: Record<string, Card[]> = Object.fromEntries(
  miniCategories.map((entry) => [entry.category, fullList([entry.category])]),
);

/** Categories already surfaced by a main group, so minis do not duplicate them. */
const groupedCategories = new Set(groups.flatMap((group) => group.categories));

const panelId = (category: string) => `hl-mini-panel-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

function AlgorithmCard({ item, enterIndex = -1 }: { item: Card; enterIndex?: number }) {
  return (
    <Link
      to={item.route}
      className={enterIndex >= 0 ? "hl-card hl-card-enter" : "hl-card"}
      style={enterIndex >= 0 ? { animationDelay: `${Math.min(enterIndex, 11) * 22}ms` } : undefined}
    >
      <p className="hl-card-name">{item.label}</p>
      <p className="hl-card-blurb">{item.blurb}</p>
      <span className="hl-card-art">
        <AlgorithmArt route={item.route} category={item.category} artKey={item.artKey} />
      </span>
      <span className="hl-card-foot">
        <span className={`hl-level lvl-${item.level.toLowerCase()}`}>{item.level}</span>
        <span className="hl-card-go" aria-hidden>
          <ArrowRight />
        </span>
      </span>
    </Link>
  );
}

export default function HomeLanding() {
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = React.useState("");
  const [level, setLevel] = React.useState<Level | "All">("All");

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});
  const [openMinis, setOpenMinis] = React.useState<Record<string, boolean>>({});

  const filtering = query.trim().length > 0 || level !== "All";

  const toggle = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) =>
    setter((prev) => ({ ...prev, [key]: !prev[key] }));

  // While filtering we always search the whole category, so an algorithm that is
  // collapsed away still surfaces; the expand control is replaced by a match count.
  const visible = React.useMemo(
    () =>
      groups.map((group) => {
        const full = groupLists[group.id];
        if (filtering) {
          return { group, cards: matchAlgorithms(full, query, level), total: full.length, expanded: true, forced: true };
        }
        const expanded = Boolean(openGroups[group.id]);
        return { group, cards: expanded ? full : group.featured, total: full.length, expanded, forced: false };
      }),
    [filtering, level, query, openGroups],
  );

  const minis = React.useMemo(
    () =>
      miniCategories.map((entry) => {
        const full = miniLists[entry.category];
        // A mini whose category is already inside a main group would duplicate
        // those results during a search, so it only opens on explicit request.
        if (filtering && !groupedCategories.has(entry.category)) {
          const cards = matchAlgorithms(full, query, level);
          return { entry, cards, total: full.length, open: cards.length > 0, forced: true };
        }
        const open = !filtering && Boolean(openMinis[entry.category]);
        return { entry, cards: open ? full : [], total: full.length, open, forced: filtering };
      }),
    [filtering, level, query, openMinis],
  );

  const totalMatches =
    visible.reduce((sum, entry) => sum + entry.cards.length, 0) +
    minis.reduce((sum, entry) => sum + (entry.forced ? entry.cards.length : 0), 0);

  const stats = [
    { value: `${items.length}+`, label: "Algorithms", icon: <BookOpen />, tone: "blue" },
    { value: `${allSampleDatasets.length}+`, label: "Datasets", icon: <Database />, tone: "indigo" },
    { value: "Interactive", label: "Experiments", icon: <FlaskConical />, tone: "violet" },
    { value: `${navigationData.length}`, label: "Categories", icon: <Users />, tone: "purple" },
  ];

  return (
    <div className="home-landing">
      <header className="hl-nav">
        <Link to="/" className="hl-brand">
          <span className="hl-brand-mark">
            <InfinityIcon />
          </span>
          <span className="hl-brand-text">
            <strong>Mega ML</strong>
            <em>Algorithms Suite</em>
          </span>
        </Link>

        <label className="hl-nav-search">
          <Search />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search algorithms, topics, or experiment..."
            aria-label="Search algorithms, topics, or experiments"
          />
        </label>

        <nav className="hl-nav-links" aria-label="Primary">
          <Link to="/documentation">
            <BookOpen />
            Learn
          </Link>
          <Link to="/ml/lab/algorithm-comparison">
            <Zap />
            Practice
          </Link>
          <Link to="/dataset-library">
            <Database />
            Datasets
          </Link>
          <Link to="/ml/deep-learning/nn-playground">
            <Gamepad2 />
            Playground
          </Link>
        </nav>

        <div className="hl-theme" role="group" aria-label="Colour theme">
          <button
            type="button"
            className={theme === "light" ? "is-on" : ""}
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <Sun />
            <span className="hl-sr">Light theme</span>
          </button>
          <button
            type="button"
            className={theme === "dark" ? "is-on" : ""}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <Moon />
            <span className="hl-sr">Dark theme</span>
          </button>
        </div>

        <Link to="/ml/lab/saved-experiments" className="hl-account">
          <span className="hl-avatar">ML</span>
          <span className="hl-account-text">
            <strong>My Workspace</strong>
            <em>Learner</em>
          </span>
        </Link>
      </header>

      <section className="hl-hero">
        <div className="hl-hero-copy">
          <h1>Explore Machine Learning</h1>
          <p className="hl-hero-tag">Learn. Visualize. Experiment. Build Intuition.</p>
          <p className="hl-hero-lede">
            Interactive implementations of {items.length}+ machine learning algorithms with real-time
            visualizations, datasets and hands-on experiments.
          </p>
          <div className="hl-hero-cta">
            <Link to="/ml/supervised/simple-linear-regression" className="hl-btn-primary">
              <Play />
              Start Learning
            </Link>
            <Link to="/sitemap" className="hl-btn-ghost">
              Explore All Algorithms
              <ArrowRight />
            </Link>
          </div>
        </div>

        <div className="hl-hero-mid">
          <div className="hl-stats">
            {stats.map((stat) => (
              <div key={stat.label} className={`hl-stat tone-${stat.tone}`}>
                <span className="hl-stat-icon">{stat.icon}</span>
                <strong>{stat.value}</strong>
                <em>{stat.label}</em>
              </div>
            ))}
          </div>
          <figure className="hl-quote">
            <Quote />
            <blockquote>“The best way to learn machine learning is to play with it.”</blockquote>
            <figcaption>— Hands-on Learning</figcaption>
          </figure>
        </div>

        <div className="hl-hero-art">
          <BrainVisual className="hl-brain" />
          <span className="hl-pill hl-pill-data">Data</span>
          <span className="hl-pill hl-pill-model">Model</span>
          <span className="hl-pill hl-pill-train">Train</span>
          <span className="hl-pill hl-pill-predict">Predict</span>
        </div>
      </section>

      <section className="hl-catalog">
        <div className="hl-catalog-head">
          <h2>Machine Learning Algorithms</h2>
          <div className="hl-catalog-tools">
            <label className="hl-search" data-guide="home-search">
              <Search />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search algorithms..."
                aria-label="Filter algorithms by name"
              />
            </label>
            <div className="hl-filters" role="group" aria-label="Filter by difficulty">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={option === level ? "is-on" : ""}
                  aria-pressed={option === level}
                  onClick={() => setLevel(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtering && totalMatches === 0 && (
          <p className="hl-no-results">
            No algorithms match “{query.trim() || level}”.{" "}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLevel("All");
              }}
            >
              Clear filters
            </button>
          </p>
        )}

        {visible.map(({ group, cards, total, expanded, forced }) => {
          if (filtering && cards.length === 0) return null;
          return (
            <section key={group.id} className={`hl-group tone-${group.tone}`}>
              <header className="hl-group-head">
                <span className="hl-group-icon">{group.icon}</span>
                <span className="hl-group-title">
                  <h3>{group.title}</h3>
                  <p>{group.blurb}</p>
                </span>
                {forced ? (
                  <span className="hl-view-all is-static">
                    {cards.length} of {total}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="hl-view-all"
                    aria-expanded={expanded}
                    aria-controls={`hl-cards-${group.id}`}
                    onClick={() => toggle(setOpenGroups, group.id)}
                  >
                    {expanded ? "Collapse" : "Expand"} ({total})
                    <ChevronDown className="hl-chev" aria-hidden />
                  </button>
                )}
              </header>
              <div className="hl-cards" id={`hl-cards-${group.id}`}>
                {cards.map((item, i) => (
                  <AlgorithmCard
                    key={`${group.id}-${item.route}`}
                    item={item}
                    enterIndex={!forced && expanded && i >= group.featured.length ? i - group.featured.length : -1}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <div className="hl-mini-row">
          {minis.map(({ entry, total, open, forced }) => (
            <div key={entry.title} className={`hl-mini tone-${entry.tone}`}>
              <Link to={entry.route} className="hl-mini-link">
                <span className="hl-mini-icon">{entry.icon}</span>
                <span className="hl-mini-text">
                  <strong>{entry.title}</strong>
                  <em>{entry.blurb}</em>
                </span>
              </Link>
              <button
                type="button"
                className="hl-mini-all"
                aria-expanded={open}
                aria-controls={panelId(entry.category)}
                disabled={forced}
                onClick={() => toggle(setOpenMinis, entry.category)}
              >
                {open ? "Collapse" : "Expand"} ({total})
                <ChevronDown className="hl-chev" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {minis.map(({ entry, cards, open }) => (
          <section
            key={entry.category}
            id={panelId(entry.category)}
            className={`hl-mini-panel tone-${entry.tone}`}
            hidden={!open || cards.length === 0}
          >
            <h4>{entry.title}</h4>
            <div className="hl-cards">
              {cards.map((item, i) => (
                <AlgorithmCard key={`${entry.category}-${item.route}`} item={item} enterIndex={i} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
