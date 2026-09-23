import { NODE_DEFS } from "./nodes";
import type { GraphEdge, GraphNode, PipelineGraph, PortType } from "./types";

export interface GraphIssue {
  level: "error" | "warn";
  message: string;
}

export function topoSort(graph: PipelineGraph): { order: string[]; cycle: boolean } {
  const incoming = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    incoming.set(node.id, 0);
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    if (!incoming.has(edge.from) || !incoming.has(edge.to)) continue;
    adj.get(edge.from)!.push(edge.to);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }
  const queue = graph.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj.get(id) ?? []) {
      const left = (incoming.get(next) ?? 1) - 1;
      incoming.set(next, left);
      if (left === 0) queue.push(next);
    }
  }
  return { order, cycle: order.length !== graph.nodes.length };
}

export function validateGraph(graph: PipelineGraph): GraphIssue[] {
  const issues: GraphIssue[] = [];
  if (!graph.nodes.some((node) => NODE_DEFS[node.type]?.category === "input")) {
    issues.push({ level: "error", message: "Add a Camera, Image, or Video input block." });
  }
  const { cycle } = topoSort(graph);
  if (cycle) issues.push({ level: "error", message: "The graph has a cycle. Remove a loop before running." });

  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      issues.push({ level: "error", message: "A connection points at a missing block." });
      continue;
    }
    const fromDef = NODE_DEFS[from.type];
    const toDef = NODE_DEFS[to.type];
    const out = fromDef?.outputs.find((port) => port.id === edge.fromPort);
    const inn = toDef?.inputs.find((port) => port.id === edge.toPort);
    if (!out || !inn) {
      issues.push({ level: "error", message: `Invalid port on ${fromDef?.title ?? from.type} → ${toDef?.title ?? to.type}.` });
      continue;
    }
    if (out.type !== inn.type) {
      issues.push({ level: "error", message: `Cannot connect ${out.type} to ${inn.type} (${fromDef?.title} → ${toDef?.title}).` });
    }
  }

  for (const node of graph.nodes) {
    const def = NODE_DEFS[node.type];
    if (!def) {
      issues.push({ level: "error", message: `Unknown block type: ${node.type}` });
      continue;
    }
    for (const port of def.inputs) {
      if (port.optional) continue;
      const wired = graph.edges.some((edge) => edge.to === node.id && edge.toPort === port.id);
      if (!wired) issues.push({ level: "error", message: `${def.title} is missing required ${port.label} input.` });
    }
  }

  if (!graph.nodes.some((node) => NODE_DEFS[node.type]?.category === "output")) {
    issues.push({ level: "warn", message: "No output block — add Overlay, Label, or Event Log to see results." });
  }
  return issues;
}

export function canConnect(fromType: PortType, toType: PortType) {
  return fromType === toType;
}

export function edgeExists(edges: GraphEdge[], from: string, fromPort: string, to: string, toPort: string) {
  return edges.some((edge) => edge.from === from && edge.fromPort === fromPort && edge.to === to && edge.toPort === toPort);
}

export function uid(prefix = "n") {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

export function nodeById(nodes: GraphNode[], id: string) {
  return nodes.find((node) => node.id === id);
}
