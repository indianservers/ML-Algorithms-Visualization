import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  getAlgorithmByRoute,
  getAllAlgorithms,
} from "../../data/implementationStatus";
import { getLearningContent } from "../../data/learningContent";
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
};

const DATASET_TABS = new Set(["dataset"]);
const DATA_VIEW_TABS = new Set([
  "dataset",
  "visualize",
  "build / train",
  "train",
]);

function isDatasetTab(tab: string) {
  return DATASET_TABS.has(tab.trim().toLowerCase());
}

function showsOnDatasetTab(tabs: string[]) {
  return tabs.some((item) => DATA_VIEW_TABS.has(item.trim().toLowerCase()));
}

/**
 * Tab state for the lesson dashboards. `dashboard` is the tab that shows every
 * panel at once; `lessonTabs` are the ones with no page-specific panel, which
 * fall back to `LabLessonPanel`.
 */
export function useLabTabs(
  initial: string,
  dashboard: string = initial,
  lessonTabs: string[] = [],
): LabTabView {
  const [tab, setTab] = useState(initial);
  const lesson = lessonTabs.includes(tab);
  return {
    tab,
    setTab,
    panel: (...tabs) =>
      tab === dashboard ||
      (!lesson && tabs.includes(tab)) ||
      (isDatasetTab(tab) && !lesson && showsOnDatasetTab(tabs))
        ? ""
        : " lab-tab-hidden",
    layout: tab === dashboard ? "" : " lab-tab-focus",
    lesson,
  };
}

function LessonList({ title, items }: { title: string; items: string[] }) {
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

/**
 * Route-driven content for the Learn / Compare / Explain tabs, so every lesson
 * page renders something real instead of repeating its dashboard.
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

  let body: ReactNode = null;
  if (tab === "Compare") {
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
  } else if (tab === "Explain") {
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
    const lesson = content.lessons[0];
    body = (
      <>
        <LessonList title="Learning objectives" items={content.objectives} />
        <section>
          <h3>{lesson.title}</h3>
          <p>{lesson.story}</p>
          <p>{lesson.simpleExplanation}</p>
        </section>
        <section>
          <h3>Where it shows up</h3>
          <p>{lesson.realtimeExample}</p>
          <div className="lab-tab-peers">
            {lesson.realtimeApplications.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
        <section>
          <h3>Intuition</h3>
          <p>{content.intuition}</p>
          <p className="lab-tab-tip">{lesson.teacherTip}</p>
        </section>
      </>
    );
  }

  return (
    <div className={`lab-tab-lesson ${className}`.trim()} role="tabpanel" data-guide={tab === "Learn" ? "algo-idea" : `tab-${tab.toLowerCase().split(" / ")[0]}`}>
      <header>
        <b>{tab}</b>
        <span>{label}</span>
      </header>
      {body}
    </div>
  );
}
