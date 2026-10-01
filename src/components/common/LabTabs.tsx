import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, BarChart3, Lightbulb, Play, Scale, Target } from "lucide-react";
import {
  getAlgorithmByRoute,
  getAllAlgorithms,
} from "../../data/implementationStatus";
import { getAlgorithmGuideSteps } from "../../data/algorithmGuides";
import { getLearnPageContent } from "../../data/algorithmLearnTheory";
import { getGuideTour } from "../../data/guideMode";
import { getLearningContent } from "../../data/learningContent";
import { termRoute } from "../../data/termsStudio";
import {
  getSectionProgress,
  markSectionVisited,
} from "../../stores/learningStore";
import { LabSectionEmpty } from "./LabChrome";
import { AlgorithmGlyph } from "./AlgorithmGlyph";
import { TopicQuickQuiz } from "./TopicQuickQuiz";
import { deepLearningQuestions } from "../../data/topicQuizQuestions";
import "./LabTabs.css";

export const LAB_TABS = [
  "Learn",
  "Visualize",
  "Dataset",
  "Build / Train",
  "Metrics",
  "Compare",
  "Explain",
] as const;

export const DEEP_LEARNING_TABS = [...LAB_TABS, "Inference", "Quick Quiz"] as const;

export type LabTabView = {
  tab: string;
  setTab: (next: string) => void;
  /** Extra class for a panel: hides it unless the active tab is listed. */
  panel: (...tabs: string[]) => string;
  /** Extra class for the panel container so hidden panels leave no gaps. */
  layout: string;
  /** True when the shared lesson panel should stand in for missing content. */
  lesson: boolean;
  progress: number;
  visited: string[];
};

function canonTab(tab: string) {
  const text = tab
    .trim()
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "");
  if (
    text === "build / train" ||
    text === "build/train" ||
    text === "train" ||
    text === "transform"
  ) {
    return "train";
  }
  if (text === "quick quiz") return "quiz";
  return text;
}

/** True when `current` matches any of the listed tab names (Train aliases included). */
export function isLabTab(current: string, ...names: string[]) {
  const now = canonTab(current);
  return names.some((name) => canonTab(name) === now);
}

/** Append to a className to hide a block unless the active tab is listed. */
export function labHide(current: string, ...showOn: string[]) {
  return (isLabTab(current, ...showOn) || (isLabTab(current, "Inference") && showOn.some((name) => isLabTab(name, "Visualize")))) ? "" : " lab-tab-hidden";
}

export function isLessonTab(tab: string) {
  return isLabTab(tab, "Learn", "Compare", "Explain");
}

/**
 * Tab state for lesson pages. Each tab shows only its own panels.
 * `dashboard` is ignored (kept so existing call sites still type-check).
 * Section state is synced to `?tab=` so Back / Forward / reload restore it.
 */
export function useLabTabs(
  initial: string = "Learn",
  _dashboard: string = "",
  lessonTabs: string[] = ["Learn", "Compare", "Explain"],
): LabTabView {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const [tab, setTabState] = useState(() => {
    if (!urlTab) return initial;
    return DEEP_LEARNING_TABS.find((name) => canonTab(name) === canonTab(urlTab)) ?? urlTab;
  });

  useEffect(() => {
    if (!urlTab) return;
    setTabState((current) => {
      if (canonTab(current) === canonTab(urlTab)) return current;
      return DEEP_LEARNING_TABS.find((name) => canonTab(name) === canonTab(urlTab)) ?? urlTab;
    });
  }, [urlTab]);

  const setTab = (next: string) => {
    setTabState(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", canonTab(next));
    setParams(nextParams, { replace: true });
    markSectionVisited(location.pathname, next);
  };

  useEffect(() => {
    markSectionVisited(location.pathname, tab);
  }, [location.pathname, tab]);

  const lesson = lessonTabs.some((item) => isLabTab(item, tab));
  const { percent, visited } = getSectionProgress(location.pathname);
  return {
    tab,
    setTab,
    panel: (...tabs) => {
      if (lesson) return " lab-tab-hidden";
      if (tabs.some((item) => isLabTab(item, tab)) || (isLabTab(tab, "Inference") && tabs.some((item) => isLabTab(item, "Visualize")))) return "";
      return " lab-tab-hidden";
    },
    layout: " lab-tab-focus",
    lesson,
    progress: percent,
    visited,
  };
}

/**
 * Local page tabs that still honor `?tab=` and write it back on click.
 * Use this when the page keeps its own tab ids instead of `useLabTabs`.
 */
export function useUrlTab<T extends string>(initial: T): [T, (next: T) => void] {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const titled = initial !== initial.toLowerCase();

  const coerce = (raw: string | null): T => {
    if (!raw) return initial;
    const now = canonTab(raw);
    if (titled) {
      return (LAB_TABS.find((name) => canonTab(name) === now) ?? initial) as T;
    }
    return (now || initial) as T;
  };

  const [tab, setTabState] = useState<T>(() => coerce(urlTab));

  useEffect(() => {
    if (!urlTab) return;
    setTabState((current) => {
      const next = coerce(urlTab);
      return canonTab(current) === canonTab(next) ? current : next;
    });
  }, [urlTab]);

  const setTab = (next: T) => {
    setTabState(next);
    const nextParams = new URLSearchParams(params);
    nextParams.set("tab", canonTab(next));
    setParams(nextParams, { replace: true });
    markSectionVisited(location.pathname, next);
  };

  return [tab, setTab];
}

function LessonList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function GuideLearnBody({ route, heroMedia, learnActions }: { route: string; heroMedia?: ReactNode; learnActions?: ReactNode }) {
  const tour = useMemo(() => getGuideTour(route), [route]);
  const steps = useMemo(() => getAlgorithmGuideSteps(route), [route]);
  const learn = useMemo(() => getLearnPageContent(route), [route]);
  const idea = steps[0];
  const rest = steps.slice(1);

  return (
    <div className="lab-guide-learn">
      <section className="lab-guide-hero">
        <div className="lab-guide-hero-copy">
          <h3>The idea, in plain words</h3>
          <p>{learn.idea || idea?.purpose || tour.pitch}</p>
          {learn.story ? <p>{learn.story}</p> : null}
          {idea?.teach ? <p className="lab-tab-tip">{idea.teach}</p> : null}
        </div>
        {heroMedia ?? (
          <div className="lab-guide-art" aria-label={`${learn.label} in three steps`}>
            <div className="lab-guide-art-mark"><AlgorithmGlyph route={route} label={learn.label} size={94} /></div>
            <ol>
              {learn.howItThinks.slice(0, 3).map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
        )}
      </section>

      {learn.important.length ? (
        <section className="lab-guide-important">
          <h3>Important points</h3>
          <ul>
            {learn.important.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {learnActions ?? (
        <div className="lab-guide-actions" aria-label="Continue learning">
          <Link to={`${route}?tab=visualize`} className="lab-guide-action-try"><Target /><span><b>Try it yourself</b><small>Explore the live visualization.</small></span><ArrowRight /></Link>
          <Link to={`${route}?tab=train`} className="lab-guide-action-watch"><Play /><span><b>Watch it work</b><small>Run the algorithm step by step.</small></span><ArrowRight /></Link>
          <Link to={`${route}?tab=metrics`} className="lab-guide-action-numbers"><BarChart3 /><span><b>Check the numbers</b><small>Inspect the results and measures.</small></span><ArrowRight /></Link>
          <Link to={`${route}?tab=compare`} className="lab-guide-action-compare"><Scale /><span><b>Compare models</b><small>See how related methods differ.</small></span><Lightbulb /></Link>
        </div>
      )}

      {learn.theory.length ? (
        <section className="lab-guide-theory">
          <h3>Theory</h3>
          {learn.theory.map((para) => (
            <p key={para}>{para}</p>
          ))}
          {learn.formula ? (
            <p className="lab-tab-formula">{learn.formula}</p>
          ) : null}
        </section>
      ) : null}

      <div className="lab-guide-grid" aria-label="Reasoning about the algorithm">
        <article>
          <h3>Assumptions and inputs</h3>
          <p>{learn.assumptions}</p>
        </article>
        <article>
          <h3>How to judge the result</h3>
          <p>{learn.evaluation}</p>
        </article>
        <article>
          <h3>Test your understanding</h3>
          <p>{learn.experiment}</p>
        </article>
      </div>

      {learn.howItThinks.length ? (
        <section>
          <h3>How {learn.label} thinks</h3>
          <ol className="lab-guide-steps">
            {learn.howItThinks.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {learn.parameters.length ? (
        <section>
          <h3>Key parameters</h3>
          <ul>
            {learn.parameters.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {learn.miniExample ? (
        <section className="lab-guide-example">
          <h3>Mini example</h3>
          <p>{learn.miniExample}</p>
        </section>
      ) : null}

      <div className="lab-guide-split">
        <section>
          <h3>When it works well</h3>
          <p>{learn.useWhen}</p>
        </section>
        <section>
          <h3>Limitations</h3>
          <p>{learn.watchFor}</p>
        </section>
      </div>

      {learn.applications.length ? (
        <section>
          <h3>Where people use it</h3>
          <p>{learn.applications.join(" · ")}</p>
        </section>
      ) : null}

      {rest.length ? (
        <div className="lab-guide-grid">
          {rest.slice(0, 3).map((step) => (
            <article key={step.id}>
              <h3>{step.title}</h3>
              <p>{step.purpose}</p>
              {step.teach ? <p className="lab-tab-tip">{step.teach}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      <LessonList title="Common mistakes" items={learn.mistakes} />
      {learn.terms.length ? (
        <section className="lab-guide-terms">
          <h3>Related terms</h3>
          <div>
            {learn.terms.map((item) => (
              <Link key={item.slug} to={termRoute(item.slug)}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Learn / Compare / Explain show GUIDE theory; Visualize and work tabs keep the lab. */
export function LabLessonOrWork({
  tab,
  route,
  learn,
  visualize,
  children,
}: {
  tab: string;
  route: string;
  learn?: ReactNode;
  visualize?: ReactNode;
  children: ReactNode;
}) {
  if (isLabTab(tab, "Quick Quiz")) {
    return <TopicQuickQuiz title={getAlgorithmByRoute(route)?.label ?? "Deep Learning"} questions={deepLearningQuestions[route] ?? []} />;
  }
  if (isLabTab(tab, "Learn")) {
    return <>{learn ?? <LabLessonPanel tab="Learn" route={route} />}</>;
  }
  if (isLabTab(tab, "Visualize")) {
    return <>{visualize ?? children}</>;
  }
  if (isLabTab(tab, "Inference")) {
    return <section className="lab-inference-stage"><h2>Live test / inference</h2><p>Use the current inputs and fitted model to inspect the output. Train the model first when this lab requires fitted weights.</p>{visualize ?? children}</section>;
  }
  if (isLessonTab(tab)) {
    return <LabLessonPanel tab={tab} route={route} />;
  }
  return <>{children}</>;
}

export function LabWorkOrEmpty({
  ready,
  kind,
  children,
}: {
  ready: boolean;
  kind: "dataset" | "model" | "metrics" | "compare";
  children: ReactNode;
}) {
  if (!ready) return <LabSectionEmpty kind={kind} />;
  return <>{children}</>;
}

/**
 * Route-driven content for the Learn / Compare / Explain tabs.
 * Learn is the GUIDE theory, written in simple English.
 */
export function LabLessonPanel({
  tab,
  route,
  className = "",
  heroMedia,
  learnActions,
}: {
  tab: string;
  route: string;
  className?: string;
  heroMedia?: ReactNode;
  learnActions?: ReactNode;
}) {
  const content = useMemo(() => getLearningContent(route), [route]);
  const algorithm = getAlgorithmByRoute(route);
  const peers = useMemo(
    () =>
      algorithm
        ? getAllAlgorithms()
            .filter(
              (item) =>
                item.category === algorithm.category &&
                item.route !== algorithm.route,
            )
            .slice(0, 8)
        : [],
    [algorithm],
  );
  const label = algorithm?.label ?? "This algorithm";
  const kind = canonTab(tab);

  let body: ReactNode = null;
  if (kind === "compare") {
    body = (
      <>
        <section>
          <h3>Where {label} sits in {algorithm?.category ?? "the suite"}</h3>
          <p>{content.challenge}</p>
          <div className="lab-tab-peers">
            {peers.map((peer) => (
              <Link key={peer.route} to={peer.route}>
                {peer.label}
              </Link>
            ))}
          </div>
        </section>
        <LessonList title="Common mistakes when comparing" items={content.mistakes} />
      </>
    );
  } else if (kind === "explain") {
    body = (
      <>
        <section>
          <h3>Core rule</h3>
          <p className="lab-tab-formula">{content.formula}</p>
        </section>
        <LessonList title="Step by step" items={content.pseudocode} />
        <section>
          <h3>Conceptual pseudocode</h3>
          <pre>{content.python}</pre>
        </section>
        <LessonList title="Watch out for" items={content.mistakes} />
      </>
    );
  } else {
    body = <GuideLearnBody route={route} heroMedia={heroMedia} learnActions={learnActions} />;
  }

  return (
    <div
      className={`lab-tab-lesson${kind === "learn" ? " lab-tab-guide" : ""} ${className}`.trim()}
      role="tabpanel"
      data-guide={kind === "learn" ? "algo-idea" : `tab-${kind}`}
    >
      <header>
        <b>{tab.replace(/^[^A-Za-z]+/, "") || "Learn"}</b>
        <span>{label}</span>
      </header>
      {body}
    </div>
  );
}
