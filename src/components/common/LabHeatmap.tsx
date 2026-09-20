import "./LabHeatmap.css";

type Cell = { r: number; c: number };

function colorFor(value: number, maxAbs: number, signed: boolean) {
  const t = maxAbs > 0 ? Math.min(1, Math.abs(value) / maxAbs) : 0;
  if (signed) {
    return value >= 0
      ? `rgba(56, 189, 248, ${0.12 + t * 0.78})`
      : `rgba(248, 113, 113, ${0.12 + t * 0.78})`;
  }
  return `rgba(124, 92, 252, ${0.1 + t * 0.85})`;
}

export function LabHeatmap({
  matrix,
  rowLabels,
  colLabels,
  selected,
  onSelect,
  caption,
  signed = false,
}: {
  matrix: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  selected?: Cell | null;
  onSelect?: (cell: Cell, value: number) => void;
  caption?: string;
  signed?: boolean;
}) {
  const cols = matrix[0]?.length ?? 0;
  const maxAbs = matrix.reduce(
    (best, row) =>
      Math.max(best, ...row.map((value) => (Number.isFinite(value) ? Math.abs(value) : 0))),
    0,
  );
  const tip =
    selected && matrix[selected.r]
      ? matrix[selected.r][selected.c]
      : undefined;

  if (!matrix.length || !cols) {
    return <p className="lab-heatmap-caption">Matrix is empty.</p>;
  }

  return (
    <div className="lab-heatmap">
      {caption ? <p className="lab-heatmap-caption">{caption}</p> : null}
      <div
        className="lab-heatmap-grid"
        style={{ gridTemplateColumns: `minmax(36px,auto) repeat(${cols}, minmax(28px, 1fr))` }}
      >
        <span className="lab-heatmap-label" />
        {Array.from({ length: cols }, (_, c) => (
          <span className="lab-heatmap-label" key={`c${c}`} title={colLabels?.[c] ?? `k${c}`}>
            {colLabels?.[c] ?? c}
          </span>
        ))}
        {matrix.map((row, r) => (
          <span key={`row-${r}`} style={{ display: "contents" }}>
            <span className="lab-heatmap-label" title={rowLabels?.[r] ?? `q${r}`}>
              {rowLabels?.[r] ?? r}
            </span>
            {row.map((value, c) => (
              <button
                type="button"
                key={`${r}-${c}`}
                className={`lab-heatmap-cell${selected?.r === r && selected?.c === c ? " selected" : ""}`}
                style={{ background: colorFor(Number.isFinite(value) ? value : 0, maxAbs, signed) }}
                aria-label={`${rowLabels?.[r] ?? r} × ${colLabels?.[c] ?? c}: ${Number.isFinite(value) ? value.toFixed(3) : "masked"}`}
                onClick={() => onSelect?.({ r, c }, value)}
              />
            ))}
          </span>
        ))}
      </div>
      {tip !== undefined ? (
        <p className="lab-heatmap-tip">
          {rowLabels?.[selected!.r] ?? `row ${selected!.r}`} → {colLabels?.[selected!.c] ?? `col ${selected!.c}`}:{" "}
          {Number.isFinite(tip) ? tip.toFixed(4) : "masked"}
        </p>
      ) : null}
    </div>
  );
}
