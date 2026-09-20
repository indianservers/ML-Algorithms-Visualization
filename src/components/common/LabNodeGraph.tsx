import { useMemo, useState } from "react";
import "./LabNodeGraph.css";

export type LabGraphPoint = { x: number; y: number };
export type LabGraphEdge = { from: number; to: number; weight: number };

function bounds(points: LabGraphPoint[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = (maxX - minX || 1) * 0.08;
  const padY = (maxY - minY || 1) * 0.08;
  return {
    minX: minX - padX,
    spanX: maxX - minX + padX * 2 || 1,
    minY: minY - padY,
    spanY: maxY - minY + padY * 2 || 1,
  };
}

export function LabNodeGraph({
  points,
  edges,
  colors,
  labels,
  selected,
  onSelect,
  showEdges = true,
  maxEdges = 80,
}: {
  points: LabGraphPoint[];
  edges: LabGraphEdge[];
  colors?: string[];
  labels?: number[];
  selected?: number | null;
  onSelect?: (index: number) => void;
  showEdges?: boolean;
  maxEdges?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const frame = useMemo(() => bounds(points), [points]);
  const pct = (value: number, axis: "x" | "y") =>
    axis === "x"
      ? ((value - frame.minX) / frame.spanX) * 100
      : (1 - (value - frame.minY) / frame.spanY) * 100;
  const shown = showEdges ? edges.slice(0, maxEdges) : [];
  const active = hover ?? selected ?? null;

  if (!points.length) return <p className="lab-node-graph-tip">No points to plot.</p>;

  return (
    <div className="lab-node-graph">
      <svg className="lab-node-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {shown.map((edge, i) => {
          const a = points[edge.from];
          const b = points[edge.to];
          if (!a || !b) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}-${i}`}
              x1={pct(a.x, "x")}
              y1={pct(a.y, "y")}
              x2={pct(b.x, "x")}
              y2={pct(b.y, "y")}
              stroke="currentColor"
              strokeOpacity={0.12 + Math.min(0.55, edge.weight)}
              strokeWidth={0.35}
            />
          );
        })}
      </svg>
      {points.map((point, i) => (
        <button
          type="button"
          key={i}
          className={active === i ? "selected" : ""}
          title={`Point ${i}`}
          style={{
            left: `${pct(point.x, "x")}%`,
            top: `${pct(point.y, "y")}%`,
            background: colors?.[((labels?.[i] ?? 0) % colors.length + colors.length) % colors.length] ?? "var(--lab-cyan, #4be8ea)",
          }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onSelect?.(i)}
        />
      ))}
      {active != null ? (
        <p className="lab-node-graph-tip">
          Point {active}
          {labels?.[active] != null ? ` · cluster ${labels[active]}` : ""}
        </p>
      ) : null}
    </div>
  );
}
