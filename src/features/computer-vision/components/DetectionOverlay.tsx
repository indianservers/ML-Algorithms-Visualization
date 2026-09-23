import type { DetectionHit } from "../types";

export function DetectionOverlay({
  detections,
  width,
  height,
  showLabels = true,
  showConfidence = true,
}: {
  detections: DetectionHit[];
  width: number;
  height: number;
  showLabels?: boolean;
  showConfidence?: boolean;
}) {
  return (
    <svg className="cv-overlay" viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`} aria-hidden>
      {detections.map((hit) => {
        const caption = [showLabels ? hit.label : null, showConfidence ? hit.score.toFixed(2) : null]
          .filter(Boolean)
          .join(" ");
        return (
          <g key={hit.id}>
            <rect
              x={hit.box.x}
              y={hit.box.y}
              width={hit.box.w}
              height={hit.box.h}
              fill="none"
              stroke={hit.color}
              strokeWidth="3"
              rx="6"
            />
            {caption ? (
              <>
                <rect
                  x={hit.box.x}
                  y={Math.max(0, hit.box.y - 22)}
                  width={Math.max(72, caption.length * 8 + 24)}
                  height="22"
                  fill={hit.color}
                  rx="4"
                />
                <text x={hit.box.x + 8} y={Math.max(14, hit.box.y - 6)} fill="#fff" fontSize="12" fontWeight="700">
                  {caption}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
