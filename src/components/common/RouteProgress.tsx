import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import "./RouteProgress.css";

/**
 * Global route transition progress bar.
 *
 * Dynamic `import()` gives no byte-level progress, so the percentage is an
 * easing ramp that approaches a ceiling while work is outstanding and only
 * reaches 100% once the new page actually commits. Concurrent sources are
 * tracked with a pending count, so a suspended chunk keeps the bar alive
 * past the cheap per-navigation pulse.
 */

type Snapshot = { value: number; active: boolean };

const CEILING = 92;
const TICK_MS = 90;
/** Keeps instant, cache-hit navigations from flashing a single frame. */
const MIN_VISIBLE_MS = 380;
const FADE_MS = 280;
const SCENE_MS = 780;

let snapshot: Snapshot = { value: 0, active: false };
const listeners = new Set<() => void>();

let pending = 0;
let ramp: number | undefined;
let settle: number | undefined;
let fade: number | undefined;
let failsafe: number | undefined;
let startedAt = 0;

function emit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function clearTimers() {
  if (ramp !== undefined) window.clearInterval(ramp);
  if (settle !== undefined) window.clearTimeout(settle);
  if (fade !== undefined) window.clearTimeout(fade);
  if (failsafe !== undefined) window.clearTimeout(failsafe);
  ramp = undefined;
  settle = undefined;
  fade = undefined;
  failsafe = undefined;
}

function startRamp() {
  if (ramp !== undefined) return;
  ramp = window.setInterval(() => {
    const remaining = CEILING - snapshot.value;
    if (remaining <= 0.5) return;
    emit({ value: snapshot.value + Math.max(0.6, remaining * 0.18), active: true });
  }, TICK_MS);
}

/** Begin a new navigation. Resets the pending count so a stale hold cannot leak. */
function startNavigation() {
  clearTimers();
  pending = 1;
  startedAt = performance.now();
  emit({ value: 12, active: true });
  startRamp();
  failsafe = window.setTimeout(() => {
    pending = 0;
    if (ramp !== undefined) window.clearInterval(ramp);
    ramp = undefined;
    emit({ value: 100, active: true });
    fade = window.setTimeout(() => emit({ value: 100, active: false }), FADE_MS);
  }, 4000);
}

function hold() {
  pending += 1;
}

function release() {
  if (pending === 0) return;
  pending -= 1;
  if (pending > 0) return;

  const holdMs = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
  settle = window.setTimeout(() => {
    if (ramp !== undefined) window.clearInterval(ramp);
    ramp = undefined;
    emit({ value: 100, active: true });
    fade = window.setTimeout(() => emit({ value: 100, active: false }), FADE_MS);
  }, holdMs);
}

/** Rendered inside a Suspense fallback: holds the bar open while a chunk loads. */
export function RouteProgressTrigger() {
  useEffect(() => {
    hold();
    return release;
  }, []);
  return null;
}

/** Commits only after the lazy page is ready, then lets the bar finish. */
export function RouteProgressDone({ children }: { children: ReactNode }) {
  useEffect(() => {
    release();
  }, []);
  return children;
}

/**
 * Call once in the root layout. Starts the bar synchronously on pathname
 * change so a child `RouteProgressDone` effect can release after paint.
 */
export function useRouteProgress(pathname: string) {
  useEffect(() => {
    startNavigation();
  }, [pathname]);
}

const SCENES = [
  { id: "scatter", label: "Seeding points" },
  { id: "neural", label: "Wiring the graph" },
  { id: "tree", label: "Splitting features" },
  { id: "descent", label: "Converging" },
] as const;

type SceneId = (typeof SCENES)[number]["id"];

function IconScatter() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="rp-glyph">
      <circle className="rp-dot d1" cx="8" cy="11" r="2.2" />
      <circle className="rp-dot d2" cx="13" cy="8" r="2" />
      <circle className="rp-dot d3" cx="11" cy="16" r="2.1" />
      <circle className="rp-dot d4" cx="21" cy="20" r="2.2" />
      <circle className="rp-dot d5" cx="25" cy="16" r="2" />
      <circle className="rp-dot d6" cx="22" cy="25" r="2.1" />
    </svg>
  );
}

function IconNeural() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="rp-glyph">
      <path className="rp-edge e1" d="M7 8 15 12M7 16 15 12M7 16 15 20M7 24 15 20M15 12 25 16M15 20 25 16" />
      <circle className="rp-node n1" cx="7" cy="8" r="2.2" />
      <circle className="rp-node n2" cx="7" cy="16" r="2.2" />
      <circle className="rp-node n3" cx="7" cy="24" r="2.2" />
      <circle className="rp-node n4" cx="15" cy="12" r="2.4" />
      <circle className="rp-node n5" cx="15" cy="20" r="2.4" />
      <circle className="rp-node n6" cx="25" cy="16" r="2.7" />
    </svg>
  );
}

function IconTree() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="rp-glyph">
      <path className="rp-branch b1" d="M16 8v6M16 14 8 22M16 14l8 8" />
      <circle className="rp-leaf l1" cx="16" cy="7" r="2.6" />
      <circle className="rp-leaf l2" cx="8" cy="23" r="2.3" />
      <circle className="rp-leaf l3" cx="24" cy="23" r="2.3" />
    </svg>
  );
}

function IconDescent() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="rp-glyph">
      <path className="rp-curve" d="M4 8c6 1 8 16 12 16S22 8 28 10" />
      <circle className="rp-ball" cx="0" cy="0" r="2.4" />
    </svg>
  );
}

function SceneIcon({ id }: { id: SceneId }) {
  if (id === "scatter") return <IconScatter />;
  if (id === "neural") return <IconNeural />;
  if (id === "tree") return <IconTree />;
  return <IconDescent />;
}

function OrbIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="route-progress-orb-glyph">
      <circle cx="6" cy="7" r="2" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="18" cy="12" r="2.4" />
      <path d="M6 7 18 12M6 17 18 12" />
    </svg>
  );
}

export function RouteProgressBar() {
  const { value, active } = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  );
  const [sceneIndex, setSceneIndex] = useState(0);
  const percent = Math.round(value);
  const scene = SCENES[sceneIndex] ?? SCENES[0];

  useEffect(() => {
    if (!active) {
      setSceneIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % SCENES.length);
    }, SCENE_MS);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <div
      className="route-progress"
      data-active={active || undefined}
      data-scene={scene.id}
      aria-hidden={!active}
    >
      <div className="route-progress-panel">
        <div className="route-progress-hero" aria-hidden>
          <SceneIcon id={scene.id} />
        </div>
        <p className="route-progress-label">{scene.label}</p>
        <div
          className="route-progress-track"
          role="progressbar"
          aria-label="Page loading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${scene.label}, ${percent} percent`}
        >
          <div className="route-progress-fill" style={{ width: `${value}%` }}>
            <span className="route-progress-sheen" />
            <span className="route-progress-particles" aria-hidden>
              <i /><i /><i /><i /><i /><i />
            </span>
          </div>
          <span className="route-progress-orb" style={{ left: `${value}%` }}>
            <OrbIcon />
          </span>
        </div>
        <strong className="route-progress-value">{percent}%</strong>
        <div className="route-progress-scenes" aria-hidden>
          {SCENES.map((item) => (
            <span
              key={item.id}
              className="route-progress-scene"
              data-active={item.id === scene.id || undefined}
            >
              <SceneIcon id={item.id} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
