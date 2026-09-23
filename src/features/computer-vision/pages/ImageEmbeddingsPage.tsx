import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { acquireMobileNet, ensureTfBackend } from "../runtime/tensorflowRuntime";
import { DEFAULT_EMBED_ID, loadEmbedSet, saveEmbedSet, type StoredEmbedItem } from "../storage/visionProjectStore";
import { project2d, topK } from "../embeddings/similarity";

const INPUT = 224;

export default function ImageEmbeddingsPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const netRef = useRef<Awaited<ReturnType<typeof acquireMobileNet>> | null>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);

  const [items, setItems] = useState<StoredEmbedItem[]>([]);
  const [query, setQuery] = useState<StoredEmbedItem | null>(null);
  const [status, setStatus] = useState("Load MobileNet, then add a query image and a dataset.");
  const [label, setLabel] = useState("unlabeled");
  const [metric, setMetric] = useState<"cosine" | "euclidean">("cosine");
  const [k, setK] = useState(5);
  const [latency, setLatency] = useState(0);
  const [progress, setProgress] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void loadEmbedSet().then((saved) => {
      if (saved?.items.length) setItems(saved.items);
    });
  }, []);

  const persist = (next: StoredEmbedItem[]) => {
    setItems(next);
    void saveEmbedSet({ id: DEFAULT_EMBED_ID, updatedAt: Date.now(), items: next });
  };

  const ensure = async () => {
    await ensureTfBackend();
    if (!netRef.current) {
      setStatus("Loading MobileNet v2 embeddings…");
      netRef.current = await acquireMobileNet();
      setStatus("MobileNet v2 ready. Embeddings are real 1024-d vectors from infer(image, true).");
    }
    return netRef.current;
  };

  const embed = async (source: CanvasImageSource, previewSource?: HTMLCanvasElement | HTMLImageElement) => {
    const net = await ensure();
    const canvas = scratch.current ?? document.createElement("canvas");
    scratch.current = canvas;
    canvas.width = INPUT;
    canvas.height = INPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not draw the image.");
    ctx.drawImage(source, 0, 0, INPUT, INPUT);
    const started = performance.now();
    const tensor = net.infer(canvas, true) as tf.Tensor;
    const vector = Array.from(await tensor.data());
    tensor.dispose();
    setLatency(performance.now() - started);
    const preview = previewSource instanceof HTMLCanvasElement
      ? previewSource.toDataURL("image/jpeg", 0.7)
      : canvas.toDataURL("image/jpeg", 0.7);
    return { vector, preview };
  };

  const addFiles = async (files: FileList | File[], asQuery = false) => {
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const next = [...items];
    for (let i = 0; i < images.length; i += 1) {
      const file = images[i]!;
      setProgress(`Embedding ${i + 1}/${images.length}`);
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = async () => {
          try {
            const { vector, preview } = await embed(image, image);
            const item: StoredEmbedItem = { id: `${Date.now()}_${i}_${file.name}`, label: asQuery ? "query" : label, preview, vector, at: Date.now() };
            if (asQuery) setQuery(item);
            else next.push(item);
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        image.onerror = () => reject(new Error("Could not read image"));
        image.src = url;
      });
    }
    setProgress(null);
    if (!asQuery) persist(next);
  };

  const captureQuery = async () => {
    const frame = camera.snapshot();
    if (!frame) {
      setStatus("Start the camera to snapshot a query.");
      return;
    }
    const { vector, preview } = await embed(frame, frame);
    setQuery({ id: `query_${Date.now()}`, label: "query", preview, vector, at: Date.now() });
  };

  const matches = useMemo(() => {
    if (!query) return [];
    return topK(query.vector, items.map((item) => ({ id: item.id, vector: item.vector })), metric, k);
  }, [query, items, metric, k]);

  const points = useMemo(() => {
    const vectors = [...(query ? [query.vector] : []), ...items.map((item) => item.vector)];
    if (vectors.length < 2) return [];
    return project2d(vectors);
  }, [query, items]);

  const exportJson = (kind: "json" | "csv") => {
    if (kind === "json") {
      const blob = new Blob([JSON.stringify({ model: "mobilenet-v2-0.5", items }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "embeddings.json";
      link.click();
      URL.revokeObjectURL(url);
      return;
    }
    const dim = items[0]?.vector.length ?? 0;
    const header = ["id", "label", ...Array.from({ length: dim }, (_, i) => `f${i}`)].join(",");
    const rows = items.map((item) => [item.id, item.label, ...item.vector.map((value) => value.toFixed(6))].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "embeddings.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VisionPageShell pathname={pathname} kicker="MobileNet v2 embeddings, cosine/Euclidean search, and a PCA map of the actual vectors.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className="cv-btn" onClick={() => void camera.start()}>Camera</button>
            <button type="button" className="cv-btn-primary" onClick={() => void captureQuery()}>Snapshot query</button>
            <label className="cv-btn">Query image
              <input type="file" accept="image/*" hidden onChange={(event) => { if (event.target.files) void addFiles(event.target.files, true); }} />
            </label>
            <label className="cv-btn">Add dataset
              <input type="file" accept="image/*" multiple hidden onChange={(event) => { if (event.target.files) void addFiles(event.target.files); }} />
            </label>
          </div>
          <div className="cv-embed-query" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files, true); }}>
            {query ? <img src={query.preview} alt="Query" /> : <VisionCamera videoRef={camera.videoRef} status={camera.status} permission={camera.permission} error={camera.error} mirror={camera.mirror} onStart={() => void camera.start()} onStop={camera.stop} devices={camera.devices} deviceId={camera.deviceId} onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }} />}
            <div>
              <p>Model: MobileNet v2 α=0.5 · {query ? `${query.vector.length}-d` : "—"} · {latency ? `${latency.toFixed(0)} ms` : "—"}</p>
              <p className="cv-embed-preview">{query ? query.vector.slice(0, 12).map((value) => value.toFixed(3)).join("  ") + " …" : "No query vector yet."}</p>
            </div>
          </div>
          <p>{progress ?? status}</p>
          <section className="cv-panel" style={{ marginTop: 10 }}>
            <h2>PCA map</h2>
            <p>2D PCA of stored embeddings (randomized projection to 48-d first if needed). Not random clusters.</p>
            <svg className="cv-pca" viewBox="0 0 320 200">
              <rect width="320" height="200" fill="#0b1328" rx="10" />
              {(() => {
                if (points.length < 2) return null;
                const xs = points.map((p) => p.x);
                const ys = points.map((p) => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);
                const sx = 280 / (maxX - minX || 1);
                const sy = 160 / (maxY - minY || 1);
                const ids = query ? ["query", ...items.map((item) => item.id)] : items.map((item) => item.id);
                return points.map((point, index) => {
                  const id = ids[index];
                  const x = 20 + (point.x - minX) * sx;
                  const y = 20 + (point.y - minY) * sy;
                  return (
                    <circle key={id} cx={x} cy={y} r={id === "query" || id === selected ? 7 : 4} fill={id === "query" ? "#fbbf24" : "#38bdf8"} onClick={() => setSelected(id ?? null)} />
                  );
                });
              })()}
            </svg>
          </section>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Dataset</h2>
            <label>Label for new images<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
            <label>Metric
              <select value={metric} onChange={(event) => setMetric(event.target.value as "cosine" | "euclidean")}>
                <option value="cosine">Cosine similarity</option>
                <option value="euclidean">Euclidean distance</option>
              </select>
            </label>
            <label>Top-K {k}<input type="range" min={1} max={12} value={k} onChange={(event) => setK(Number(event.target.value))} /></label>
            <p>{items.length} indexed images</p>
            <div className="cv-class-actions">
              <button type="button" disabled={!items.length} onClick={() => exportJson("json")}>Export JSON</button>
              <button type="button" disabled={!items.length} onClick={() => exportJson("csv")}>Export CSV</button>
              <button type="button" onClick={() => persist([])}>Clear dataset</button>
            </div>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Nearest neighbors</h2>
            <div className="cv-crops">
              {matches.map((match, index) => {
                const item = items.find((row) => row.id === match.id);
                if (!item) return null;
                return (
                  <figure key={item.id} className={selected === item.id ? "is-on" : undefined} onClick={() => setSelected(item.id)}>
                    <img src={item.preview} alt="" />
                    <figcaption>#{index + 1} {item.label}<br />{metric === "cosine" ? match.raw.toFixed(3) : match.raw.toFixed(2)}</figcaption>
                  </figure>
                );
              })}
            </div>
          </article>
        </aside>
      </div>
    </VisionPageShell>
  );
}
