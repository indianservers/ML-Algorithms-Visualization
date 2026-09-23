import { useRef, useState } from "react";
import { NODE_DEFS } from "./nodes";
import type { GraphEdge, GraphNode, NodeRuntime, PortDef } from "./types";
import { canConnect, edgeExists, uid } from "./validate";

export function PipelineCanvas({
  nodes,
  edges,
  selected,
  metrics,
  running,
  onChange,
  onSelect,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selected: string | null;
  metrics: Record<string, NodeRuntime>;
  running: boolean;
  onChange: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  onSelect: (id: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const panDrag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const wire = useRef<{ from: string; fromPort: string; type: string } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const toLocal = (event: React.PointerEvent | React.DragEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left - pan.x) / zoom, y: (event.clientY - rect.top - pan.y) / zoom };
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData("application/cv-node");
    if (!NODE_DEFS[type]) return;
    const point = toLocal(event);
    const def = NODE_DEFS[type]!;
    onChange([...nodes, { id: uid("n"), type, x: point.x - 80, y: point.y - 24, config: { ...def.defaults } }], edges);
  };

  return (
    <div
      ref={wrapRef}
      className="cv-pipe-board"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      onWheel={(event) => {
        event.preventDefault();
        setZoom((value) => Math.min(1.8, Math.max(0.45, value + (event.deltaY > 0 ? -0.08 : 0.08))));
      }}
      onPointerDown={(event) => {
        if (event.button === 1 || event.altKey) {
          panDrag.current = { x: event.clientX, y: event.clientY, px: pan.x, py: pan.y };
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        } else if ((event.target as HTMLElement).classList.contains("cv-pipe-board") || (event.target as HTMLElement).classList.contains("cv-pipe-world")) {
          onSelect(null);
        }
      }}
      onPointerMove={(event) => {
        const point = toLocal(event);
        setCursor(point);
        if (panDrag.current) {
          setPan({ x: panDrag.current.px + (event.clientX - panDrag.current.x), y: panDrag.current.py + (event.clientY - panDrag.current.y) });
        }
        if (drag.current) {
          onChange(nodes.map((node) => node.id === drag.current?.id ? { ...node, x: point.x - drag.current.dx, y: point.y - drag.current.dy } : node), edges);
        }
      }}
      onPointerUp={() => {
        panDrag.current = null;
        drag.current = null;
        wire.current = null;
        setCursor(null);
      }}
    >
      <div className="cv-pipe-toolbar">
        <button type="button" onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}>+</button>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.45, value - 0.1))}>−</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 24, y: 24 }); }}>Fit</button>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div className="cv-pipe-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
        <svg className="cv-pipe-wires" width="2400" height="1600">
          {edges.map((edge) => {
            const from = nodes.find((node) => node.id === edge.from);
            const to = nodes.find((node) => node.id === edge.to);
            if (!from || !to) return null;
            const a = portPos(from, edge.fromPort, "out");
            const b = portPos(to, edge.toPort, "in");
            const mid = (a.x + b.x) / 2;
            const live = running && metrics[edge.from]?.active;
            return (
              <path
                key={edge.id}
                d={`M ${a.x} ${a.y} C ${mid} ${a.y}, ${mid} ${b.y}, ${b.x} ${b.y}`}
                fill="none"
                stroke={live ? "#38bdf8" : "#64748b"}
                strokeWidth={live ? 3 : 2}
                onDoubleClick={() => onChange(nodes, edges.filter((item) => item.id !== edge.id))}
              />
            );
          })}
          {wire.current && cursor ? (
            <path
              d={`M ${portPos(nodes.find((n) => n.id === wire.current!.from)!, wire.current.fromPort, "out").x} ${portPos(nodes.find((n) => n.id === wire.current!.from)!, wire.current.fromPort, "out").y} L ${cursor.x} ${cursor.y}`}
              fill="none"
              stroke="#94a3b8"
              strokeDasharray="4 3"
            />
          ) : null}
        </svg>
        {nodes.map((node) => {
          const def = NODE_DEFS[node.type];
          if (!def) return null;
          const metric = metrics[node.id];
          return (
            <article
              key={node.id}
              className={`cv-pipe-node${selected === node.id ? " is-on" : ""}${metric?.error ? " is-err" : ""}`}
              style={{ left: node.x, top: node.y }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(node.id);
                const point = toLocal(event);
                drag.current = { id: node.id, dx: point.x - node.x, dy: point.y - node.y };
              }}
            >
              <header>
                <strong>{def.title}</strong>
                <button type="button" onClick={(event) => {
                  event.stopPropagation();
                  onChange(nodes.filter((item) => item.id !== node.id), edges.filter((item) => item.from !== node.id && item.to !== node.id));
                  if (selected === node.id) onSelect(null);
                }}>×</button>
              </header>
              <div className="cv-pipe-ports">
                <div>
                  {def.inputs.map((port) => (
                    <button
                      key={port.id}
                      type="button"
                      className="cv-port in"
                      title={`${port.label} (${port.type})`}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        const pending = wire.current;
                        if (!pending) return;
                        const fromDef = NODE_DEFS[nodes.find((item) => item.id === pending.from)?.type ?? ""];
                        const out = fromDef?.outputs.find((item) => item.id === pending.fromPort);
                        if (!out || !canConnect(out.type, port.type) || pending.from === node.id) return;
                        if (edgeExists(edges, pending.from, pending.fromPort, node.id, port.id)) return;
                        onChange(nodes, [...edges, { id: uid("e"), from: pending.from, fromPort: pending.fromPort, to: node.id, toPort: port.id }]);
                        wire.current = null;
                      }}
                    >
                      {port.label}
                    </button>
                  ))}
                </div>
                <div>
                  {def.outputs.map((port) => (
                    <button
                      key={port.id}
                      type="button"
                      className="cv-port out"
                      title={`${port.label} (${port.type})`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        wire.current = { from: node.id, fromPort: port.id, type: port.type };
                      }}
                    >
                      {port.label}
                    </button>
                  ))}
                </div>
              </div>
              {metric ? <p>{metric.error ?? `${metric.ms.toFixed(0)}ms · ${metric.count}${metric.label ? ` · ${metric.label}` : ""}`}</p> : <p>{def.category}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function portPos(node: GraphNode, portId: string, side: "in" | "out") {
  const def = NODE_DEFS[node.type];
  const list: PortDef[] = side === "in" ? (def?.inputs ?? []) : (def?.outputs ?? []);
  const index = Math.max(0, list.findIndex((port) => port.id === portId));
  return {
    x: node.x + (side === "out" ? 168 : 0),
    y: node.y + 38 + index * 18,
  };
}
