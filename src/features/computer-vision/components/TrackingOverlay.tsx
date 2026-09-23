import type { Track } from "../tracker/ObjectTracker";
import { directionLabel, speedPxPerSec } from "../tracker/ObjectTracker";

export function TrackingOverlay({
  tracks,
  width,
  height,
  showIds,
  showTrails,
  showVelocity,
  classFilter,
}: {
  tracks: Track[];
  width: number;
  height: number;
  showIds: boolean;
  showTrails: boolean;
  showVelocity: boolean;
  classFilter: string;
}) {
  const visible = tracks.filter((track) => track.status !== "expired" && (classFilter === "all" || track.label === classFilter));
  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} aria-hidden>
      {visible.map((track) => {
        const caption = [
          showIds ? `#${track.id}` : null,
          track.label,
          track.score.toFixed(2),
          showVelocity ? `${speedPxPerSec(track).toFixed(0)} px/s ${directionLabel(track)}` : null,
        ].filter(Boolean).join("  ");
        const trail = track.trail;
        const d = trail.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
        return (
          <g key={track.id} opacity={track.status === "lost" ? 0.45 : 1}>
            {showTrails && trail.length > 1 ? <path d={d} fill="none" stroke={track.color} strokeWidth="2" /> : null}
            <rect x={track.box.x} y={track.box.y} width={track.box.w} height={track.box.h} fill="none" stroke={track.color} strokeWidth="3" rx="6" />
            <rect x={track.box.x} y={Math.max(0, track.box.y - 22)} width={Math.max(90, caption.length * 7)} height="22" fill={track.color} rx="4" />
            <text x={track.box.x + 6} y={Math.max(14, track.box.y - 6)} fill="#fff" fontSize="11" fontWeight="700">{caption}</text>
          </g>
        );
      })}
    </svg>
  );
}
