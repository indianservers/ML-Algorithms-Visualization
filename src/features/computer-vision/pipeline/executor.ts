import { formatVisionError } from "../runtime/mediapipeRuntime";
import { ObjectTracker, type Track } from "../tracker/ObjectTracker";
import { acquireModels, releaseModels } from "./modelCache";
import { NODE_DEFS } from "./nodes";
import type { ExecContext, GraphNode, ModelKind, NodeRuntime, OverlayOp, Packet, PipelineGraph } from "./types";
import { topoSort, validateGraph } from "./validate";

export interface PipelineRunState {
  running: boolean;
  paused: boolean;
  order: string[];
  kinds: ModelKind[];
  ctx: ExecContext;
  metrics: Record<string, NodeRuntime>;
}

export class PipelineExecutor {
  private state: PipelineRunState | null = null;
  private graph: PipelineGraph = { nodes: [], edges: [] };

  metrics() {
    return this.state?.metrics ?? {};
  }

  overlays() {
    return this.state?.ctx.overlays ?? [];
  }

  events() {
    return this.state?.ctx.events ?? [];
  }

  counters() {
    return this.state?.ctx.counters ?? {};
  }

  get running() {
    return Boolean(this.state?.running && !this.state.paused);
  }

  get paused() {
    return Boolean(this.state?.paused);
  }

  issues() {
    return validateGraph(this.graph);
  }

  async start(graph: PipelineGraph, snapshot: () => HTMLCanvasElement | null) {
    if (this.state) await this.stop();
    const issues = validateGraph(graph).filter((item) => item.level === "error");
    if (issues.length) throw new Error(issues.map((item) => item.message).join(" "));
    const { order, cycle } = topoSort(graph);
    if (cycle) throw new Error("Graph contains a cycle.");
    const kinds = graph.nodes.flatMap((node) => NODE_DEFS[node.type]?.models ?? []);
    const models = await acquireModels(kinds);
    this.graph = graph;
    this.state = {
      running: true,
      paused: false,
      order,
      kinds,
      metrics: {},
      ctx: {
        now: performance.now(),
        video: null,
        w: 640,
        h: 360,
        models,
        tracker: new ObjectTracker(),
        prevTracks: [],
        counters: {},
        events: [],
        overlays: [],
        nodeState: {},
        snapshot,
      },
    };
  }

  pause() {
    if (this.state) this.state.paused = true;
  }

  resume() {
    if (this.state) this.state.paused = false;
  }

  async stop() {
    if (!this.state) return;
    await releaseModels(this.state.kinds);
    this.state.running = false;
    this.state.paused = false;
    this.state.ctx.tracker.reset();
    this.state = null;
  }

  resetCounts() {
    if (!this.state) return;
    this.state.ctx.counters = {};
    this.state.ctx.events = [];
    this.state.ctx.tracker.reset();
    this.state.ctx.prevTracks = [];
    this.state.ctx.nodeState = {};
  }

  tick(now: number, video: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null, w: number, h: number) {
    const run = this.state;
    if (!run || !run.running || run.paused) return;
    run.ctx.now = now;
    run.ctx.video = video;
    run.ctx.w = w;
    run.ctx.h = h;
    run.ctx.overlays = [];
    const packets = new Map<string, Packet>();
    const byId = new Map(this.graph.nodes.map((node) => [node.id, node]));

    for (const id of run.order) {
      const node = byId.get(id);
      const def = node ? NODE_DEFS[node.type] : undefined;
      if (!node || !def) continue;
      const started = performance.now();
      const inputs: Record<string, Packet | undefined> = {};
      for (const port of def.inputs) {
        const edge = this.graph.edges.find((item) => item.to === id && item.toPort === port.id);
        inputs[port.id] = edge ? packets.get(`${edge.from}.${edge.fromPort}`) : undefined;
      }
      try {
        const outputs = def.process(run.ctx, node, inputs);
        for (const [port, packet] of Object.entries(outputs)) {
          if (packet) packets.set(`${id}.${port}`, packet);
        }
        const count = outputs.dets?.detections?.length
          ?? outputs.tracks?.tracks?.length
          ?? outputs.landmarks?.landmarks?.length
          ?? (outputs.gesture?.gesture ? 1 : outputs.value?.value != null ? 1 : outputs.event?.text ? 1 : 0);
        run.metrics[id] = {
          active: true,
          ms: performance.now() - started,
          count,
          label: outputs.event?.text ?? outputs.gesture?.gesture?.name ?? (outputs.value?.value != null ? String(outputs.value.value) : undefined),
        };
      } catch (caught) {
        run.metrics[id] = {
          active: false,
          ms: performance.now() - started,
          count: 0,
          error: formatVisionError(caught, "Block failed"),
        };
      }
    }
    run.ctx.prevTracks = this.graph.nodes.flatMap((node) => {
      const packet = packets.get(`${node.id}.tracks`);
      return packet?.tracks ?? [];
    }) as Track[];
    run.ctx.events = run.ctx.events.slice(0, 40);
  }
}

export function generateJs(graph: PipelineGraph) {
  const titles = graph.nodes.map((node) => NODE_DEFS[node.type]?.title ?? node.type);
  const edges = graph.edges.map((edge) => {
    const from = graph.nodes.find((node) => node.id === edge.from);
    const to = graph.nodes.find((node) => node.id === edge.to);
    return `// ${NODE_DEFS[from?.type ?? ""]?.title ?? edge.from} [${edge.fromPort}] -> ${NODE_DEFS[to?.type ?? ""]?.title ?? edge.to} [${edge.toPort}]`;
  });
  return [
    `// Generated from Vision Pipeline Builder`,
    `// ${titles.join(" → ")}`,
    `// Runs in-browser with MediaPipe Tasks / TensorFlow.js. Not a standalone script.`,
    ...edges,
    `const graph = ${JSON.stringify({ nodes: graph.nodes, edges: graph.edges }, null, 2)};`,
    `export default graph;`,
  ].join("\n");
}

export type { OverlayOp, GraphNode };
