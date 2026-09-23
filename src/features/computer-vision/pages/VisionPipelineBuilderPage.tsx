import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { downloadCanvas } from "../utils/maskRender";
import { generateJs, PipelineExecutor } from "../pipeline/executor";
import { formatVisionError } from "../runtime/mediapipeRuntime";
import { NODE_DEFS, NODE_GROUPS, NODE_LIST } from "../pipeline/nodes";
import { PipelineCanvas } from "../pipeline/PipelineCanvas";
import { PipelineOverlay } from "../pipeline/PipelineOverlay";
import { samplePipelines } from "../pipeline/templates";
import type { GraphEdge, GraphNode, OverlayOp } from "../pipeline/types";
import { validateGraph } from "../pipeline/validate";
import { deletePipeline, listPipelines, savePipeline, type StoredPipeline } from "../storage/visionProjectStore";

export default function VisionPipelineBuilderPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const execRef = useRef(new PipelineExecutor());
  const lastUi = useRef(0);
  const samples = useMemo(() => samplePipelines(), []);

  const [nodes, setNodes] = useState<GraphNode[]>(samples[0]!.graph.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(samples[0]!.graph.edges);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("Object Detection");
  const [saved, setSaved] = useState<StoredPipeline[]>([]);
  const [status, setStatus] = useState("Connect blocks, then Run. Invalid graphs will not start.");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [metrics, setMetrics] = useState(execRef.current.metrics());
  const [overlays, setOverlays] = useState<OverlayOp[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [propsOpen, setPropsOpen] = useState(true);

  useEffect(() => {
    void listPipelines().then(setSaved);
    return () => { void execRef.current.stop(); };
  }, []);

  const graph = { nodes, edges };
  const issues = validateGraph(graph);
  const selectedNode = nodes.find((node) => node.id === selected);
  const selectedDef = selectedNode ? NODE_DEFS[selectedNode.type] : undefined;

  const applyGraph = (nextNodes: GraphNode[], nextEdges: GraphEdge[]) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
  };

  const start = async () => {
    try {
      setStatus("Initializing models…");
      await execRef.current.start(graph, () => {
        const shot = camera.snapshot();
        if (shot) downloadCanvas(shot, "pipeline-snapshot.png");
        return shot;
      });
      if (camera.status !== "live") await camera.start();
      setRunning(true);
      setPaused(false);
      setStatus("Pipeline running.");
    } catch (caught) {
      setStatus(formatVisionError(caught, "Could not start pipeline."));
    }
  };

  useRafLoop(running && !paused && camera.status === "live", (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    execRef.current.tick(now, video, video.videoWidth || 640, video.videoHeight || 360);
    if (now - lastUi.current > 80) {
      lastUi.current = now;
      setMetrics({ ...execRef.current.metrics() });
      setOverlays([...execRef.current.overlays()]);
      setEvents([...execRef.current.events()]);
      setSize({ w: video.videoWidth || 640, h: video.videoHeight || 360 });
    }
  });

  const persist = async (id?: string) => {
    const record: StoredPipeline = {
      id: id ?? `pipe-${Date.now()}`,
      name,
      updatedAt: Date.now(),
      graph: { nodes, edges },
    };
    await savePipeline(record);
    setSaved(await listPipelines());
    setStatus(`Saved “${name}”.`);
  };

  const loadSaved = (item: StoredPipeline) => {
    const stored = item.graph as { nodes: GraphNode[]; edges: GraphEdge[] };
    setNodes(stored.nodes);
    setEdges(stored.edges);
    setName(item.name);
    setStatus(`Loaded “${item.name}”.`);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ name, nodes, edges }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.pipeline.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJs = () => {
    const blob = new Blob([generateJs(graph)], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}.pipeline.js`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Drag blocks, connect typed ports, then Run. The graph executes live MediaPipe / TensorFlow.js nodes.">
      <div className={`cv-pipe${paletteOpen ? "" : " no-palette"}${propsOpen ? "" : " no-props"}`}>
        {paletteOpen ? (
          <aside className="cv-pipe-palette">
            <div className="cv-class-actions">
              <button type="button" className="cv-btn-primary" onClick={() => void start()}>Run</button>
              <button type="button" onClick={() => { execRef.current.pause(); setPaused(true); }} disabled={!running}>Pause</button>
              <button type="button" onClick={async () => { await execRef.current.stop(); camera.stop(); setRunning(false); setPaused(false); setOverlays([]); setMetrics({}); setStatus("Pipeline stopped."); }}>Stop</button>
              <button type="button" onClick={() => execRef.current.resetCounts()}>Reset</button>
            </div>
            {NODE_GROUPS.map((group) => (
              <section key={group.id}>
                <p>{group.label}</p>
                {NODE_LIST.filter((item) => item.category === group.id).map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("application/cv-node", item.type)}
                  >
                    {item.title}
                  </button>
                ))}
              </section>
            ))}
          </aside>
        ) : null}
        <PipelineCanvas
          nodes={nodes}
          edges={edges}
          selected={selected}
          metrics={metrics}
          running={running && !paused}
          onChange={applyGraph}
          onSelect={setSelected}
        />
        {propsOpen ? (
          <aside className="cv-pipe-props">
            <label>Name <input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <div className="cv-class-actions">
              <button type="button" onClick={() => {
                if (!window.confirm("Clear the current graph?")) return;
                setNodes([]);
                setEdges([]);
                setName("Untitled");
              }}>New</button>
              <button type="button" onClick={() => void persist()}>Save</button>
              <button type="button" onClick={exportJson}>Export JSON</button>
              <button type="button" onClick={exportJs}>Export JS</button>
              <label className="cv-btn">Import JSON
                <input type="file" accept="application/json,.json" hidden onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  try {
                    const parsed = JSON.parse(await file.text()) as { name?: string; nodes?: GraphNode[]; edges?: GraphEdge[] };
                    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
                      setStatus("JSON is not a pipeline graph.");
                      return;
                    }
                    setNodes(parsed.nodes);
                    setEdges(parsed.edges);
                    if (parsed.name) setName(parsed.name);
                    setStatus(`Imported “${parsed.name ?? file.name}”.`);
                  } catch {
                    setStatus("Could not parse that JSON file.");
                  }
                }} />
              </label>
            </div>
            <p>Samples</p>
            {samples.map((item) => (
              <button key={item.id} type="button" onClick={() => { setNodes(item.graph.nodes); setEdges(item.graph.edges); setName(item.name); }}>{item.name}</button>
            ))}
            {saved.length ? <p>Saved</p> : null}
            {saved.map((item) => (
              <div key={item.id} className="cv-class-actions">
                <button type="button" onClick={() => loadSaved(item)}>{item.name}</button>
                <button type="button" onClick={() => { const copy = { ...item, id: `pipe-${Date.now()}`, name: `${item.name} copy`, updatedAt: Date.now() }; void savePipeline(copy).then(async () => setSaved(await listPipelines())); }}>Dup</button>
                <button type="button" onClick={() => {
                  if (!window.confirm(`Delete saved pipeline “${item.name}”?`)) return;
                  void deletePipeline(item.id).then(async () => setSaved(await listPipelines()));
                }}>Del</button>
              </div>
            ))}
            {selectedDef && selectedNode ? (
              <>
                <h2>{selectedDef.title}</h2>
                {selectedDef.fields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    {field.kind === "select" ? (
                      <select value={String(selectedNode.config[field.key] ?? "")} onChange={(event) => setNodes(nodes.map((node) => node.id === selectedNode.id ? { ...node, config: { ...node.config, [field.key]: event.target.value } } : node))}>
                        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    ) : field.kind === "bool" ? (
                      <input type="checkbox" checked={Boolean(selectedNode.config[field.key])} onChange={(event) => setNodes(nodes.map((node) => node.id === selectedNode.id ? { ...node, config: { ...node.config, [field.key]: event.target.checked } } : node))} />
                    ) : field.kind === "number" ? (
                      <input type="number" min={field.min} max={field.max} step={field.step} value={Number(selectedNode.config[field.key] ?? 0)} onChange={(event) => setNodes(nodes.map((node) => node.id === selectedNode.id ? { ...node, config: { ...node.config, [field.key]: Number(event.target.value) } } : node))} />
                    ) : (
                      <input value={String(selectedNode.config[field.key] ?? "")} onChange={(event) => setNodes(nodes.map((node) => node.id === selectedNode.id ? { ...node, config: { ...node.config, [field.key]: event.target.value } } : node))} />
                    )}
                  </label>
                ))}
              </>
            ) : <p>Select a block to configure it.</p>}
            {issues.length ? (
              <ul className="cv-event-list">
                {issues.map((item) => <li key={item.message}>{item.level === "error" ? "Error" : "Warn"}: {item.message}</li>)}
              </ul>
            ) : <p>Graph is valid.</p>}
          </aside>
        ) : null}
        <section className="cv-pipe-preview">
          <div className="cv-class-actions" style={{ marginBottom: 6 }}>
            <button type="button" onClick={() => setPaletteOpen((value) => !value)}>{paletteOpen ? "Hide palette" : "Palette"}</button>
            <button type="button" onClick={() => setPropsOpen((value) => !value)}>{propsOpen ? "Hide properties" : "Properties"}</button>
          </div>
          <VisionCamera
            videoRef={camera.videoRef}
            status={camera.status}
            permission={camera.permission}
            error={camera.error}
            mirror={camera.mirror}
            onStart={() => void camera.start()}
            onStop={camera.stop}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
          >
            <PipelineOverlay ops={overlays} width={size.w} height={size.h} />
          </VisionCamera>
          <p>{status}</p>
          <ul className="cv-event-list">
            {events.slice(0, 8).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
          </ul>
        </section>
      </div>
    </VisionPageShell>
  );
}
