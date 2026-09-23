import { HAND_CONNECTIONS } from "../runtime/mediapipeRuntime";
import type { TrackedHand } from "../types";

const HAND_COLORS = { Left: "#22d3ee", Right: "#c084fc" };

export function LandmarkOverlay({
  hands,
  width,
  height,
  showLandmarks,
  showConnections,
}: {
  hands: TrackedHand[];
  width: number;
  height: number;
  showLandmarks: boolean;
  showConnections: boolean;
}) {
  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} aria-hidden>
      {hands.map((hand, index) => {
        const color = HAND_COLORS[hand.handedness];
        return (
          <g key={`${hand.handedness}-${index}`}>
            {showConnections
              ? HAND_CONNECTIONS.map(([a, b]) => {
                  const from = hand.landmarks[a];
                  const to = hand.landmarks[b];
                  if (!from || !to) return null;
                  return (
                    <line
                      key={`${a}-${b}`}
                      x1={from.x * width}
                      y1={from.y * height}
                      x2={to.x * width}
                      y2={to.y * height}
                      stroke={color}
                      strokeWidth="2.5"
                    />
                  );
                })
              : null}
            {showLandmarks
              ? hand.landmarks.map((point, pointIndex) => (
                  <circle
                    key={pointIndex}
                    cx={point.x * width}
                    cy={point.y * height}
                    r={pointIndex === 0 ? 5 : 3.4}
                    fill={pointIndex === 0 ? "#fff" : color}
                    stroke={color}
                  />
                ))
              : null}
          </g>
        );
      })}
    </svg>
  );
}
