import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronUp, CircleDot, LoaderCircle, X } from "lucide-react";
import { getAlgorithmByRoute } from "../../data/implementationStatus";
import type { TrainingActivityEvent } from "../../lib/trainingActivity";
import "./TrainingActivityPanel.css";

type Entry = { text: string; at: number };
type Run = {
  title: string;
  state: "running" | "complete" | "error";
  startedAt: number;
  endedAt?: number;
  entries: Entry[];
  current?: number;
  total?: number;
};

function isTrainingAction(button: HTMLButtonElement) {
  if (button.disabled || button.closest('nav, [role="tablist"], [role="tab"], [data-ml-lesson-tabs], [class*="-tabs"]')) return false;
  if (button.closest(".training-activity")) return false;
  const label = `${button.getAttribute("aria-label") ?? ""} ${button.textContent ?? ""}`.replace(/\s+/g, " ").trim().toLowerCase();
  return (/\b(train|retrain|fit|optimi[sz]e)\b/.test(label) && !/train\s*[\/]\s*test|training log|training speed/.test(label))
    || /\b(start training|run training|run model|run optimizer|run algorithm)\b/.test(label)
    || /^train$/.test(label)
    || (new URLSearchParams(window.location.search).get("tab") === "train" && /^(start|run|fit|train)$/i.test(label));
}

function configuredWork() {
  const host = document.getElementById("main-content");
  const inputs = Array.from(host?.querySelectorAll<HTMLInputElement>("input[aria-label]") ?? []).filter((item) =>
    /\b(epochs?|iterations?|forest size|number of trees|estimators?|batch size)\b/i.test(item.getAttribute("aria-label") ?? "") && Number(item.value) > 0,
  );
  const unique = new Map<string, string>();
  for (const input of inputs) {
    const label = (input.getAttribute("aria-label") ?? "").replace(/\s+(numeric|slider|value)$/i, "").toLowerCase();
    unique.set(label, input.value);
  }
  return Array.from(unique.entries()).slice(0, 2).map(([label, value]) => `${label}: ${value}`).join(" · ");
}

export function TrainingActivityPanel() {
  const location = useLocation();
  const [run, setRun] = useState<Run | null>(null);
  const [open, setOpen] = useState(true);
  const monitor = useRef<number | null>(null);
  const explicit = useRef(false);
  const started = useRef(0);

  useEffect(() => {
    if (monitor.current !== null) window.clearInterval(monitor.current);
    monitor.current = null;
    explicit.current = false;
    setRun(null);
    if (!location.pathname.startsWith("/ml/")) return;

    const append = (detail: TrainingActivityEvent) => {
      explicit.current = true;
      if (monitor.current !== null) window.clearInterval(monitor.current);
      monitor.current = null;
      const at = performance.now();
      setRun((previous) => {
        const base = previous ?? {
          title: getAlgorithmByRoute(location.pathname)?.label ?? "Model",
          state: "running" as const,
          startedAt: at,
          entries: [{ text: "Training started", at }],
        };
        if (detail.kind === "start") {
          return { ...base, state: "running", startedAt: at, endedAt: undefined, entries: [{ text: detail.message, at }], current: 0, total: detail.total };
        }
        return {
          ...base,
          state: detail.kind === "error" ? "error" : detail.kind === "complete" ? "complete" : "running",
          endedAt: detail.kind === "complete" || detail.kind === "error" ? at : undefined,
          entries: [...base.entries, { text: detail.message, at }].slice(-24),
          current: detail.current ?? base.current,
          total: detail.total ?? base.total,
        };
      });
      setOpen(true);
    };

    const onDetail = (event: Event) => append((event as CustomEvent<TrainingActivityEvent>).detail);
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("button");
      if (!button?.closest("#main-content") || !isTrainingAction(button)) return;
      if (monitor.current !== null) window.clearInterval(monitor.current);
      explicit.current = false;
      const at = performance.now();
      started.current = at;
      const entries: Entry[] = [{ text: "Training started", at }];
      const config = configuredWork();
      if (config) entries.push({ text: `Configured work · ${config}`, at });
      entries.push({ text: "Applying the current dataset and model settings", at });
      setRun({
        title: getAlgorithmByRoute(location.pathname)?.label ?? "Model",
        state: "running",
        startedAt: at,
        entries,
      });
      setOpen(true);

      let sawBusy = false;
      let fittingLogged = false;
      monitor.current = window.setInterval(() => {
        if (explicit.current) return;
        const elapsed = performance.now() - started.current;
        const label = button.textContent?.toLowerCase() ?? "";
        const busy = button.isConnected && (button.disabled || /training…|training\.\.\.|fitting…|fitting\.\.\.|optimizing…|optimizing\.\.\./.test(label));
        if (busy) sawBusy = true;
        if (!fittingLogged && elapsed >= 90) {
          fittingLogged = true;
          setRun((previous) => previous?.state === "running" ? {
            ...previous,
            entries: [...previous.entries, { text: busy ? "Model fitting in progress" : "Model fit or update processed", at: performance.now() }],
          } : previous);
        }
        if ((sawBusy && !busy) || (!sawBusy && elapsed >= 450) || elapsed >= 120_000) {
          if (monitor.current !== null) window.clearInterval(monitor.current);
          monitor.current = null;
          const doneAt = performance.now();
          const timedOut = elapsed >= 120_000;
          setRun((previous) => previous?.state === "running" ? {
            ...previous,
            state: timedOut ? "error" : "complete",
            endedAt: doneAt,
            entries: [...previous.entries, { text: timedOut ? "Training is still busy; check this page for an error" : sawBusy ? "Training completed" : "Training action completed; inspect the model results", at: doneAt }],
          } : previous);
        }
      }, 90);
    };

    window.addEventListener("ml:training-activity", onDetail);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("ml:training-activity", onDetail);
      if (monitor.current !== null) window.clearInterval(monitor.current);
      monitor.current = null;
    };
  }, [location.pathname]);

  if (!run) return null;
  const duration = run.endedAt === undefined ? null : Math.max(0, Math.round(run.endedAt - run.startedAt));
  const progress = run.state === "complete" ? 100 : run.total && run.current !== undefined ? Math.min(99, Math.round(run.current / run.total * 100)) : undefined;
  return (
    <aside className="training-activity" aria-label="Training activity">
      <header>
        {run.state === "running" ? <LoaderCircle className="training-activity-spin" /> : run.state === "complete" ? <CheckCircle2 /> : <CircleDot />}
        <span><strong>Training activity</strong><small>{run.title}</small></span>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Collapse training activity" : "Expand training activity"} aria-expanded={open}>{open ? <ChevronDown /> : <ChevronUp />}</button>
        <button type="button" onClick={() => setRun(null)} aria-label="Close training activity"><X /></button>
      </header>
      {open && <div className="training-activity-body">
        <div className={`training-activity-progress${progress === undefined ? " training-activity-indeterminate" : ""}`} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-valuetext={progress === undefined ? "Training in progress" : undefined} aria-label="Training progress"><span style={{ width: `${progress ?? 32}%` }} /></div>
        <ol role="log" aria-live="polite" aria-label="Training log">
          {run.entries.map((entry, index) => <li key={`${entry.at}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{entry.text}</li>)}
        </ol>
        <footer>{run.state === "running" ? "Training in progress" : run.state === "error" ? "Training failed" : `Training complete${duration === null ? "" : ` · ${duration < 1000 ? `${duration} ms` : `${(duration / 1000).toFixed(1)} s`}`}`}</footer>
      </div>}
    </aside>
  );
}
