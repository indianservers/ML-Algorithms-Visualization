import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { visionLabFilters, visionLabs } from "../catalog";
import { VisionPageShell } from "../components/VisionPageShell";
import type { VisionLabFilter } from "../catalog";

export default function ComputerVisionHome() {
  const { pathname } = useLocation();
  const [filter, setFilter] = useState<VisionLabFilter>("All");
  const cards = useMemo(
    () => visionLabs.filter((lab) => lab.id !== "home" && (filter === "All" || lab.filters.includes(filter))),
    [filter],
  );
  const ready = visionLabs.filter((lab) => lab.status === "ready" && lab.id !== "home").length;

  return (
    <VisionPageShell pathname={pathname} kicker="Pick a lab. Camera, upload, train, and infer all stay on one page.">
      <div className="cv-home-stats">
        <article>
          <b>{visionLabs.length - 1}</b>
          <span>Built-in labs</span>
        </article>
        <article>
          <b>{ready}</b>
          <span>Ready labs</span>
        </article>
        <article>
          <b>Live camera</b>
          <span>Browser inference</span>
        </article>
        <article>
          <b>WebGL</b>
          <span>TensorFlow.js / MediaPipe</span>
        </article>
      </div>
      <div className="cv-filters" role="tablist" aria-label="Lab filters">
        {visionLabFilters.map((item) => (
          <button key={item} type="button" className={item === filter ? "is-on" : undefined} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="cv-home-grid">
        {cards.map((lab) => {
          const Icon = lab.icon;
          return (
            <Link key={lab.id} to={lab.route} className="cv-home-card">
              <span>
                <Icon size={18} />
              </span>
              <strong>{lab.label}</strong>
              <em>{lab.blurb}</em>
              <small>Open lab</small>
            </Link>
          );
        })}
      </div>
    </VisionPageShell>
  );
}
