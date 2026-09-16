import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Compass, X } from "lucide-react";
import { getGuideTour, trainTabAliases, type GuideStep } from "../../data/guideMode";
import { useGuideMode } from "../../stores/uiStore";
import "./GuideMode.css";

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function findTarget(step: GuideStep): HTMLElement | null {
  if (step.spot) {
    const marked = document.querySelector(`[data-guide="${step.spot}"]`);
    if (marked instanceof HTMLElement) return marked;
    const fallback =
      step.spot === "algo-visualize"
        ? document.querySelector("[data-chart-container='true']")
        : step.spot === "algo-params"
          ? document.querySelector("[data-control-panel='true']")
          : step.spot === "algo-metrics"
            ? document.querySelector("[data-guide='algo-metrics']")
            : null;
    if (fallback instanceof HTMLElement) return fallback;
  }
  const labels = step.tab ? trainTabAliases(step.tab) : [];
  if (!labels.length) return null;
  const wanted = labels.map(normalize);
  const nodes = document.querySelectorAll('button, [role="tab"], a');
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const label = normalize(node.textContent ?? "");
    if (wanted.some((item) => label === item || label.startsWith(`${item} `))) return node;
  }
  return null;
}

function GuideSpotlight({ target }: { target: HTMLElement | null }) {
  const [box, setBox] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) {
      setBox(null);
      return;
    }
    const update = () => setBox(target.getBoundingClientRect());
    update();
    target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  if (!box) return null;
  return (
    <div
      className="guide-spot"
      style={{
        top: Math.max(8, box.top - 8),
        left: Math.max(8, box.left - 8),
        width: box.width + 16,
        height: box.height + 16,
      }}
    />
  );
}

export function GuideMode() {
  const location = useLocation();
  const { guideMode, toggleGuideMode } = useGuideMode();
  const tour = useMemo(() => getGuideTour(location.pathname), [location.pathname]);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [location.pathname]);

  const step = tour.steps[Math.min(index, tour.steps.length - 1)];

  useEffect(() => {
    if (!guideMode || !step) {
      setTarget(null);
      return;
    }
    const sync = () => setTarget(findTarget(step));
    sync();
    const timer = window.setTimeout(sync, 220);
    return () => window.clearTimeout(timer);
  }, [guideMode, step, location.pathname, index]);

  const go = (next: number) => {
    setIndex(Math.max(0, Math.min(tour.steps.length - 1, next)));
  };

  return (
    <>
      <button
        type="button"
        className="guide-launch"
        aria-pressed={guideMode}
        aria-label={guideMode ? "Close guide mode" : "Open guide mode"}
        onClick={toggleGuideMode}
      >
        <Compass size={15} />
        Guide
      </button>

      {guideMode && step && (
        <div className="guide-layer" role="dialog" aria-label="Guide mode">
          <GuideSpotlight target={target} />
          <aside className="guide-card">
            <header>
              <b>
                <BookOpen size={14} />
                {tour.title}
              </b>
              <button type="button" aria-label="Close guide" onClick={toggleGuideMode}>
                <X size={14} />
              </button>
            </header>
            <p className="guide-pitch">{tour.pitch}</p>
            <ol className="guide-toc">
              {tour.steps.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={i === index ? "active" : ""}
                    onClick={() => go(i)}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ol>
            <article>
              <small>
                Step {index + 1} of {tour.steps.length}
              </small>
              <h2>{step.title}</h2>
              <section>
                <h3>Purpose</h3>
                <p>{step.purpose}</p>
              </section>
              <section>
                <h3>What you do</h3>
                <p>{step.does}</p>
              </section>
              <section>
                <h3>How to teach it</h3>
                <p>{step.teach}</p>
              </section>
            </article>
            <footer>
              <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>
                <ChevronLeft size={14} />
                Back
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => (index === tour.steps.length - 1 ? toggleGuideMode() : go(index + 1))}
              >
                {index === tour.steps.length - 1 ? "Finish" : "Next"}
                <ChevronRight size={14} />
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
