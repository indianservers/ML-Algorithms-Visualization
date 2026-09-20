import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpenText,
  Compass,
  Database,
  Home,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import {
  useGuideMode,
  usePracticeMode,
  useTeacherMode,
  useTheme,
} from "../../stores/uiStore";
import {
  getSectionProgress,
  markSectionVisited,
} from "../../stores/learningStore";
import { getAlgorithmByRoute } from "../../data/implementationStatus";
import { exportWorkspaceReport, saveCurrentView } from "../../lib/labWorkspace";
import "./LabChrome.css";

type Overlay = "none" | "settings" | "menu";

function buttonCopy(target: EventTarget | null) {
  if (!(target instanceof Element)) return { button: null, label: "" };
  const button = target.closest<HTMLElement>("button, [role='button']");
  if (!button) return { button: null, label: "" };
  const label = `${button.getAttribute("aria-label") ?? ""} ${button.textContent ?? ""}`
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return { button, label };
}

export function LabProgressMeter({
  route,
  total = 7,
}: {
  route?: string;
  total?: number;
}) {
  const location = useLocation();
  const path = route ?? location.pathname;
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("ml:learner-progress-changed", refresh);
    return () => window.removeEventListener("ml:learner-progress-changed", refresh);
  }, []);

  const { percent, visited } = getSectionProgress(path, total);
  return (
    <span className="lab-progress-meter" aria-label={`Lesson progress ${percent} percent`}>
      <i aria-hidden>
        <b style={{ width: `${percent}%` }} />
      </i>
      <strong>{percent}%</strong>
      <span className="sr-only">
        {visited.length} of {total} sections visited
      </span>
    </span>
  );
}

export function VizFrame({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const host = ref.current;
    if (!host || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      host.dispatchEvent(new CustomEvent("ml:viz-resize", { bubbles: true }));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="lab-viz-frame" data-chart-container="true">
      {children}
    </div>
  );
}

export function LabSectionEmpty({
  kind,
}: {
  kind: "dataset" | "model" | "metrics" | "compare" | "loading";
}) {
  const copy = {
    loading: ["Loading this section", "The workspace is preparing this view."],
    dataset: ["No dataset yet", "Open Dataset to choose a sample or upload a CSV."],
    model: ["No trained model yet", "Open Build / Train to fit the current dataset."],
    metrics: ["No metrics yet", "Train the model first, then scores will appear here."],
    compare: ["Comparison unavailable", "Train at least one configuration to compare results."],
  }[kind];
  return (
    <div className="lab-tab-lesson" role="status">
      <header>
        <b>{copy[0]}</b>
      </header>
      <p>{copy[1]}</p>
    </div>
  );
}

export function LabChrome({
  onSearch,
}: {
  onSearch: () => void;
}) {
  const location = useLocation();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { guideMode, toggleGuideMode } = useGuideMode();
  const { practiceMode, togglePracticeMode } = usePracticeMode();
  const { teacherMode, toggleTeacherMode } = useTeacherMode();
  const [overlay, setOverlay] = React.useState<Overlay>("none");
  const [toast, setToast] = React.useState("");
  const close = React.useCallback(() => setOverlay("none"), []);

  const showToast = React.useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      showToast("Fullscreen is not available in this browser.");
    }
  }, [showToast]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (overlay !== "none") {
          event.preventDefault();
          close();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, overlay]);

  React.useEffect(() => {
    close();
  }, [close, location.pathname]);

  React.useEffect(() => {
    const onSave = () => {
      saveCurrentView(location.pathname);
      showToast("View saved on this device.");
    };
    const openSettings = () => setOverlay("settings");
    const openMenu = () => setOverlay((current) => (current === "menu" ? "none" : "menu"));
    window.addEventListener("ml:save", onSave);
    window.addEventListener("ml:open-settings", openSettings);
    window.addEventListener("ml:open-menu", openMenu);
    return () => {
      window.removeEventListener("ml:save", onSave);
      window.removeEventListener("ml:open-settings", openSettings);
      window.removeEventListener("ml:open-menu", openMenu);
    };
  }, [location.pathname, showToast]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const { button, label } = buttonCopy(event.target);
      if (!button) return;
      if (
        !button.closest(".lab-topbar, .lab-chrome-overlay") &&
        button.closest('[role="tablist"], [class*="-tabs"], .nb-tabs, .svmc-bar, .mlr-tabs, .rfc-tabs')
      ) {
        const name = (button.textContent ?? "").trim();
        if (name) markSectionVisited(location.pathname, name);
      }
      if (button.closest(".lab-topbar, .lab-chrome-overlay, .hl-theme, .hl-nav-search")) {
        return;
      }

      const intercept = (action: () => void) => {
        event.preventDefault();
        event.stopPropagation();
        action();
      };

      if (
        button.getAttribute("aria-label") === "Theme" ||
        /toggle theme|dark theme|light theme/.test(label)
      ) {
        intercept(toggleTheme);
        return;
      }
      if (/full ?screen/.test(label)) {
        intercept(() => {
          void toggleFullscreen();
        });
        return;
      }
      if (button.getAttribute("aria-label") === "Settings" || /(^|\s)settings(\s|$)/.test(label)) {
        intercept(() => setOverlay("settings"));
        return;
      }
      if (button.getAttribute("aria-label") === "Menu" || /(^|\s)menu(\s|$)/.test(label)) {
        intercept(() => setOverlay((current) => (current === "menu" ? "none" : "menu")));
        return;
      }
      if (/lesson mode/.test(label)) {
        intercept(() => {
          toggleGuideMode();
          showToast(guideMode ? "Lesson Mode closed." : "Lesson Mode opened.");
        });
        return;
      }
      if (/export report/.test(label)) {
        intercept(() => {
          const algorithm = getAlgorithmByRoute(location.pathname);
          exportWorkspaceReport({
            title: algorithm?.label ?? document.title,
            route: location.pathname,
            tab: new URLSearchParams(location.search).get("tab"),
          });
          showToast("Report downloaded.");
        });
        return;
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [guideMode, location.pathname, location.search, showToast, toggleFullscreen, toggleGuideMode, toggleTheme]);

  React.useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) markSectionVisited(location.pathname, tab);
  }, [location.pathname, location.search]);

  return (
    <div className="lab-chrome">
      {overlay !== "none" && (
        <div
          className="lab-chrome-overlay"
          role="presentation"
          onClick={close}
        >
          {overlay === "settings" ? (
            <div
              className="lab-chrome-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Settings</h2>
              <p>These options apply across algorithm pages. They do not change the active lesson section.</p>
              <label>
                Theme
                <select
                  aria-label="Colour theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value === "light" ? "light" : "dark")}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label>
                Lesson / Guide Mode
                <input
                  type="checkbox"
                  checked={guideMode}
                  onChange={toggleGuideMode}
                />
              </label>
              <label>
                Practice Mode
                <input
                  type="checkbox"
                  checked={practiceMode}
                  onChange={togglePracticeMode}
                />
              </label>
              <label>
                Larger teacher text
                <input
                  type="checkbox"
                  checked={teacherMode}
                  onChange={toggleTeacherMode}
                />
              </label>
              <button type="button" onClick={close} aria-label="Close settings">
                <X size={14} /> Close
              </button>
            </div>
          ) : (
            <div
              className="lab-chrome-panel lab-chrome-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Suite menu"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Menu</h2>
              <nav>
                <Link to="/" onClick={close}>
                  <Home size={15} /> Home
                </Link>
                <Link to="/ml/lab/dataset-manager" onClick={close}>
                  <Database size={15} /> Datasets
                </Link>
                <Link to="/ml/terms-studio" onClick={close}>
                  <BookOpenText size={15} /> Terms Studio
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onSearch();
                  }}
                >
                  <Search size={15} /> Search
                </button>
                <button type="button" onClick={toggleGuideMode} aria-pressed={guideMode}>
                  <Compass size={15} /> {guideMode ? "Close guide" : "Open guide"}
                </button>
                <button type="button" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === "dark" ? "Light theme" : "Dark theme"}
                </button>
              </nav>
            </div>
          )}
        </div>
      )}
      {toast ? (
        <div className="lab-chrome-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
