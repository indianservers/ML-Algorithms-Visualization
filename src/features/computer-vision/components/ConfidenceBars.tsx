export function ConfidenceBars({
  rows,
}: {
  rows: Array<{ name: string; value: number; color?: string; image?: string }>;
}) {
  const max = Math.max(1e-6, ...rows.map((row) => row.value));
  return (
    <ul className="cv-bars">
      {rows.map((row) => (
        <li key={row.name}>
          {row.image ? <img src={row.image} alt="" /> : null}
          <span>{row.name}</span>
          <i>
            <b style={{ width: `${(row.value / max) * 100}%`, background: row.color ?? "var(--lab-blue)" }} />
          </i>
          <em>{(row.value * 100).toFixed(1)}%</em>
        </li>
      ))}
    </ul>
  );
}
