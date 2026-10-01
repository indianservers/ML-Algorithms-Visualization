import React from 'react';

type Row = Record<string, unknown>;

export function EditableNumericScatter({ rows, columns, target, onChange, hint = 'Drag a point or use arrow keys to edit this dataset.' }: {
  rows: Row[];
  columns: string[];
  target?: string;
  onChange: (rows: Row[]) => void;
  hint?: string;
}) {
  const numeric = columns.filter(column => rows.some(row => row[column] !== '' && row[column] !== null && row[column] !== undefined && Number.isFinite(Number(row[column]))));
  const [xColumn, setXColumn] = React.useState('');
  const [yColumn, setYColumn] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const drag = React.useRef<{ pointerId: number; index: number; startX: number; startY: number; x: number; y: number; xMin: number; xSpan: number; yMin: number; ySpan: number } | null>(null);
  if (numeric.length < 2) return null;

  const x = numeric.includes(xColumn) ? xColumn : numeric.find(column => column !== target) ?? numeric[0];
  const y = numeric.includes(yColumn) && yColumn !== x ? yColumn : numeric.find(column => column === target && column !== x) ?? numeric.find(column => column !== x) ?? numeric[1];
  const plotted = rows.map((row, index) => ({ row, index, x: Number(row[x]), y: Number(row[y]) }))
    .filter(point => point.row[x] !== '' && point.row[y] !== '' && point.row[x] !== null && point.row[y] !== null && Number.isFinite(point.x) && Number.isFinite(point.y));
  if (plotted.length === 0) return null;
  const domain = (values: number[]) => {
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
    const padding = Math.max((max - min) * 0.08, 0.5);
    return { min: min - padding, span: max - min + padding * 2 };
  };
  const xr = domain(plotted.map(point => point.x));
  const yr = domain(plotted.map(point => point.y));
  const sx = (value: number) => 48 + (value - xr.min) / xr.span * 508;
  const sy = (value: number) => 302 - (value - yr.min) / yr.span * 266;
  const update = (index: number, values: Row) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...values } : row));
  const svgPosition = (svg: SVGSVGElement, event: React.PointerEvent<SVGElement>) => {
    const inverse = svg.getScreenCTM()?.inverse();
    return inverse ? new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse) : null;
  };

  return <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
    <div className="mb-2 flex flex-wrap items-center gap-3">
      <strong>Visual point editor</strong>
      <label className="flex items-center gap-1">X <select aria-label="Point editor X axis" className="rounded border px-2 py-1 text-inherit dark:border-gray-600 dark:bg-gray-800" value={x} onChange={event => setXColumn(event.target.value)}>{numeric.filter(column => column !== y).map(column => <option key={column}>{column}</option>)}</select></label>
      <label className="flex items-center gap-1">Y <select aria-label="Point editor Y axis" className="rounded border px-2 py-1 text-inherit dark:border-gray-600 dark:bg-gray-800" value={y} onChange={event => setYColumn(event.target.value)}>{numeric.filter(column => column !== x).map(column => <option key={column}>{column}</option>)}</select></label>
      <span className="text-gray-500 dark:text-gray-400">{hint}</span>
    </div>
    <svg className="w-full touch-none rounded bg-slate-50 dark:bg-slate-950" style={{ width: '100%', height: 280 }} viewBox="0 0 600 335" role="img" aria-label={`Editable ${x} versus ${y} dataset plot`} onPointerMove={event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const position = svgPosition(event.currentTarget, event);
      if (!position) return;
      update(current.index, {
        [x]: Math.max(current.xMin, Math.min(current.xMin + current.xSpan, current.x + (position.x - current.startX) / 508 * current.xSpan)),
        [y]: Math.max(current.yMin, Math.min(current.yMin + current.ySpan, current.y - (position.y - current.startY) / 266 * current.ySpan)),
      });
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <rect x="48" y="36" width="508" height="266" fill="transparent" stroke="#94a3b8" />
      {[0.25, 0.5, 0.75].map(tick => <g key={tick} stroke="#94a3b866"><line x1={48 + tick * 508} x2={48 + tick * 508} y1="36" y2="302" /><line x1="48" x2="556" y1={36 + tick * 266} y2={36 + tick * 266} /></g>)}
      {plotted.slice(0, 250).map(point => <circle key={point.index} cx={sx(point.x)} cy={sy(point.y)} r={selected === point.index ? 7 : 5} fill={selected === point.index ? '#f97316' : '#3b82f6'} stroke="white" strokeWidth="1.5" className="cursor-grab" role="button" tabIndex={0} aria-label={`Edit dataset point ${point.index + 1}`} onClick={() => setSelected(point.index)} onPointerDown={event => {
        const svg = event.currentTarget.ownerSVGElement;
        if (!svg) return;
        const position = svgPosition(svg, event);
        if (!position) return;
        setSelected(point.index);
        drag.current = { pointerId: event.pointerId, index: point.index, startX: position.x, startY: position.y, x: point.x, y: point.y, xMin: xr.min, xSpan: xr.span, yMin: yr.min, ySpan: yr.span };
        svg.setPointerCapture(event.pointerId);
        event.preventDefault();
      }} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        setSelected(point.index);
        update(point.index, { [x]: point.x + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0) * xr.span / 100, [y]: point.y + (event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0) * yr.span / 100 });
      }}><title>Row {point.index + 1}: {x} {point.x}, {y} {point.y}</title></circle>)}
      <text x="300" y="328" textAnchor="middle" fill="currentColor">{x}</text>
      <text x="18" y="180" textAnchor="middle" transform="rotate(-90 18 180)" fill="currentColor">{y}</text>
    </svg>
    {rows[selected] && <div className="mt-2 flex flex-wrap items-center gap-3"><strong>Row {selected + 1}</strong>{[x, y].map(column => <label key={column} className="flex items-center gap-1">{column}<input aria-label={`Selected dataset point ${column}`} type="number" step="any" className="w-28 rounded border px-2 py-1 text-inherit dark:border-gray-600 dark:bg-gray-800" value={String(rows[selected][column] ?? '')} onChange={event => update(selected, { [column]: Number(event.target.value) })} /></label>)}</div>}
  </div>;
}
