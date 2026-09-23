import type { LandmarkPoint } from "../types";
import { FACE_MESH_GROUPS } from "../runtime/mediapipeRuntime";
import { pairsOf } from "../utils/landmarkGeometry";

export type FaceMeshGroupId = keyof typeof FACE_MESH_GROUPS | "landmarks";

const GROUP_COLOR: Record<string, string> = {
  tesselation: "rgba(148,163,184,0.28)",
  contours: "#38bdf8",
  oval: "#22d3ee",
  leftEye: "#34d399",
  rightEye: "#34d399",
  leftBrow: "#a78bfa",
  rightBrow: "#a78bfa",
  leftIris: "#facc15",
  rightIris: "#facc15",
  lips: "#fb7185",
};

export function FaceMeshOverlay({
  landmarks,
  width,
  height,
  groups,
}: {
  landmarks: LandmarkPoint[];
  width: number;
  height: number;
  groups: Partial<Record<FaceMeshGroupId, boolean>>;
}) {
  if (!landmarks.length) return null;
  const lines = (Object.keys(FACE_MESH_GROUPS) as Array<keyof typeof FACE_MESH_GROUPS>)
    .filter((key) => groups[key])
    .flatMap((key) =>
      pairsOf(FACE_MESH_GROUPS[key]).map(([a, b]) => ({ a, b, color: GROUP_COLOR[key] ?? "#94a3b8" })),
    );
  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} aria-hidden>
      {lines.map((line, index) => {
        const from = landmarks[line.a];
        const to = landmarks[line.b];
        if (!from || !to) return null;
        return (
          <line
            key={`${line.a}-${line.b}-${index}`}
            x1={from.x * width}
            y1={from.y * height}
            x2={to.x * width}
            y2={to.y * height}
            stroke={line.color}
            strokeWidth={line.color.includes("0.28") ? 0.6 : 1.5}
          />
        );
      })}
      {groups.landmarks
        ? landmarks.map((point, index) => (
            <circle key={index} cx={point.x * width} cy={point.y * height} r={1.4} fill="#e2e8f0" />
          ))
        : null}
    </svg>
  );
}
