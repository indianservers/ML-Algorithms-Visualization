import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
  return text;
}

/** True when `current` matches any of the listed tab names (Train aliases included). */
export function isLabTab(current: string, ...names: string[]) {
  const now = canonTab(current);
  return names.some((name) => canonTab(name) === now);
}

/** Append to a className to hide a block unless the active tab is listed. */
export function labHide(current: string, ...showOn: string[]) {
  return isLabTab(current, ...showOn) ? "" : " lab-tab-hidden";
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
  const [tab, setTabState] = useState(urlTab || initial);

  useEffect(() => {
    if (!urlTab) return;
    setTabState((current) => {
      if (canonTab(current) === canonTab(urlTab)) return current;
      return LAB_TABS.find((name) => canonTab(name) === canonTab(urlTab)) ?? urlTab;
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
      if (tabs.some((item) => isLabTab(item, tab))) return "";
      return " lab-tab-hidden";
    },
    layout: " lab-tab-focus",
    lesson,
    progress: percent,
    visited,
  };
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

function GuideLearnBody({ route }: { route: string }) {
  const tour = useMemo(() => getGuideTour(route), [route]);
  const steps = useMemo(() => getAlgorithmGuideSteps(route), [route]);
  const learn = useMemo(() => getLearnPageContent(route), [route]);
  const idea = steps[0];
  const rest = steps.slice(1);

  return (
    <div className="lab-guide-learn">
      <section className="lab-guide-hero">
        <h3>The idea, in plain words</h3>
        <p>{learn.idea || idea?.purpose || tour.pitch}</p>
        {learn.story ? <p>{learn.story}</p> : null}
        {idea?.teach ? <p className="lab-tab-tip">{idea.teach}</p> : null}
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
  if (isLabTab(tab, "Learn")) {
    return <>{learn ?? <LabLessonPanel tab="Learn" route={route} />}</>;
  }
  if (isLabTab(tab, "Visualize")) {
    return <>{visualize ?? children}</>;
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
}: {
  tab: string;
  route: string;
  className?: string;
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
          <h3>What the model optimizes</h3>
          <p className="lab-tab-formula">{content.formula}</p>
        </section>
        <LessonList title="Step by step" items={content.pseudocode} />
        <section>
          <h3>Equivalent code</h3>
          <pre>{content.python}</pre>
        </section>
        <LessonList title="Watch out for" items={content.mistakes} />
      </>
    );
  } else {
    body = <GuideLearnBody route={route} />;
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
