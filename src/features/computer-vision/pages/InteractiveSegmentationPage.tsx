import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { downloadCanvas, drawChecker } from "../utils/maskRender";
import {
  cropOpaque,
  extractObject,
  maskToImage,
  regionGrow,
  type GrowBox,
  type Seed,
} from "../interactive/regionGrow";

type Mode = "pos" | "neg" | "box";
type Display = "original" | "overlay" | "extract" | "split";

export default function InteractiveSegmentationPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const extractRef = useRef<HTMLCanvasElement | null>(null);
  const sourceData = useRef<ImageData | null>(null);
  const last = useRef<ReturnType<typeof regionGrow> | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("pos");
  const [display, setDisplay] = useState<Display>("overlay");
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [box, setBox] = useState<GrowBox | null>(null);
  const [tolerance, setTolerance] = useState(36);
  const [opacity, setOpacity] = useState(0.55);
  const [feather, setFeather] = useState(2);
  const [status, setStatus] = useState("Upload an image or snapshot the camera. Clicks seed a real region-growing mask.");
  const [stats, setStats] = useState<{ pixels: number; coverage: number; contours: number; ms: number } | null>(null);
  const [size, setSize] = useState({ w: 640, h: 360 });

  const paint = (result: ReturnType<typeof regionGrow>, overlayOpacity = opacity, edge = feather) => {
    last.current = result;
    const overlay = overlayRef.current;
    const extracted = extractRef.current;
    const source = sourceData.current;
    if (overlay) {
      overlay.width = result.width;
      overlay.height = result.height;
      const ctx = overlay.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        ctx.putImageData(maskToImage(result.mask, result.width, result.height, [37, 99, 235, Math.round(overlayOpacity * 255)]), 0, 0);
      }
    }
    if (extracted && source) {
      const cut = extractObject(source, result.mask, edge);
      extracted.width = cut.width;
      extracted.height = cut.height;
      const ctx = extracted.getContext("2d");
      if (ctx) {
        drawChecker(ctx, cut.width, cut.height);
        ctx.drawImage(cut, 0, 0);
      }
    }
    setStats({ pixels: result.pixels, coverage: result.coverage, contours: result.contours, ms: result.ms });
  };

  const run = (nextSeeds = seeds, nextBox = box, nextTol = tolerance) => {
    const source = sourceData.current;
    if (!source) {
      setStatus("Load an image first.");
      return;
    }
    if (!nextSeeds.some((seed) => seed.kind === "pos")) {
      setStatus("Add at least one positive point on the object.");
      return;
    }
    paint(regionGrow(source, nextSeeds, nextTol, nextBox));
    setStatus("Mask is from color region growing around your seeds. Not MediaPipe Interactive Segmenter (unavailable in this tasks-vision 1.0.1 build).");
  };

  useEffect(() => {
    if (last.current) paint(last.current);
  }, [opacity, feather, display]);

  const loadFromUrl = (url: string) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      sourceData.current = ctx.getImageData(0, 0, image.width, image.height);
      setSize({ w: image.width, h: image.height });
      setSeeds([]);
      setBox(null);
      last.current = null;
      setStats(null);
      setStatus("Add a positive click on the object. Negative clicks exclude similar colors.");
    };
    image.src = url;
    setImageUrl(url);
  };

  const toLocal = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * size.w;
    const y = ((event.clientY - rect.top) / rect.height) * size.h;
    return { x, y };
  };

  const onPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    const point = toLocal(event);
    if (mode === "box") {
      drag.current = point;
      return;
    }
    const next = [...seeds, { ...point, kind: mode }];
    setSeeds(next);
    if (next.some((seed) => seed.kind === "pos")) run(next, box, tolerance);
  };

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "box" || !drag.current) return;
    const point = toLocal(event);
    const x = Math.min(drag.current.x, point.x);
    const y = Math.min(drag.current.y, point.y);
    setBox({ x, y, w: Math.abs(point.x - drag.current.x), h: Math.abs(point.y - drag.current.y) });
  };

  const onUp = () => {
    drag.current = null;
    if (mode === "box" && box && seeds.some((seed) => seed.kind === "pos")) run(seeds, box, tolerance);
  };

  const snapshot = () => {
    const canvas = camera.snapshot();
    if (!canvas) {
      setStatus("Start the camera first, then snapshot.");
      return;
    }
    loadFromUrl(canvas.toDataURL("image/jpeg", 0.92));
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) loadFromUrl(URL.createObjectURL(file));
  }, []);

  return (
    <VisionPageShell pathname={pathname} kicker="Click-seeded region growing on a still image. Camera is for snapshots only — this task is not live video segmentation.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <label className="cv-btn">Image
              <input type="file" accept="image/*" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) loadFromUrl(URL.createObjectURL(file));
              }} />
            </label>
            <button type="button" className="cv-btn" onClick={() => void camera.start()}>Open camera</button>
            <button type="button" className="cv-btn-primary" onClick={snapshot}>Snapshot</button>
            {(["pos", "neg", "box"] as Mode[]).map((item) => (
              <button key={item} type="button" className={mode === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setMode(item)}>
                {item === "pos" ? "Positive point" : item === "neg" ? "Negative point" : "Box"}
              </button>
            ))}
          </div>
          {imageUrl ? (
            <div className={display === "split" ? "cv-seg-split" : undefined} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
              <div
                className="cv-camera"
                onMouseDown={onPointer}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                style={{ cursor: "crosshair", display: display === "extract" ? "none" : undefined }}
              >
                <img src={imageUrl} alt="" />
                <canvas ref={overlayRef} className={display === "original" ? "cv-overlay is-hidden" : "cv-overlay"} />
                <svg className="cv-overlay" viewBox={`0 0 ${size.w} ${size.h}`} style={{ pointerEvents: "none" }}>
                  {seeds.map((seed, index) => (
                    <circle key={`${seed.x}-${seed.y}-${index}`} cx={seed.x} cy={seed.y} r="7" fill={seed.kind === "pos" ? "#22c55e" : "#ef4444"} stroke="#fff" />
                  ))}
                  {box ? <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="none" stroke="#fbbf24" strokeWidth="2" /> : null}
                </svg>
              </div>
              <div className="cv-camera cv-checker" style={{ display: display === "extract" || display === "split" ? undefined : "none" }}>
                <canvas ref={extractRef} className="cv-overlay cv-has-alpha" />
              </div>
            </div>
          ) : (
            <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
              <VisionCamera
                videoRef={camera.videoRef}
                status={camera.status}
                permission={camera.permission}
                error={camera.error}
                mirror={camera.mirror}
                onStart={() => void camera.start()}
                onStop={camera.stop}
                onToggleMirror={() => camera.setMirror((value) => !value)}
                onSnapshot={snapshot}
                devices={camera.devices}
                deviceId={camera.deviceId}
                onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              />
            </div>
          )}
          <div className="cv-class-actions" style={{ marginTop: 8 }}>
            {(["original", "overlay", "extract", "split"] as Display[]).map((item) => (
              <button key={item} type="button" className={display === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setDisplay(item)}>{item}</button>
            ))}
            <button type="button" className="cv-btn-primary" onClick={() => run()}>Segment</button>
            <button type="button" onClick={() => { setSeeds([]); setBox(null); last.current = null; setStats(null); const overlay = overlayRef.current; overlay?.getContext("2d")?.clearRect(0, 0, overlay.width, overlay.height); }}>Clear points</button>
          </div>
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Mask</h2>
          <div className="cv-metrics">
            <div><b>{stats ? stats.pixels.toLocaleString() : "—"}</b><span>Pixels</span></div>
            <div><b>{stats ? `${(stats.coverage * 100).toFixed(1)}%` : "—"}</b><span>Coverage</span></div>
            <div><b>{stats ? stats.contours : "—"}</b><span>Contours</span></div>
            <div><b>{stats ? `${stats.ms.toFixed(0)}ms` : "—"}</b><span>Grow time</span></div>
          </div>
          <p>No model confidence — this mask is deterministic region growing, not a neural interactive segmenter.</p>
          <label>Color tolerance {tolerance}<input type="range" min={8} max={90} value={tolerance} onChange={(event) => { const value = Number(event.target.value); setTolerance(value); if (seeds.some((seed) => seed.kind === "pos")) run(seeds, box, value); }} /></label>
          <label>Overlay opacity {opacity.toFixed(2)}<input type="range" min={0.15} max={1} step={0.05} value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label>
          <label>Edge feather {feather}px<input type="range" min={0} max={10} value={feather} onChange={(event) => setFeather(Number(event.target.value))} /></label>
          <div className="cv-class-actions">
            <button type="button" disabled={!last.current} onClick={() => extractRef.current && downloadCanvas(extractRef.current, "object-alpha.png")}>Transparent PNG</button>
            <button type="button" disabled={!last.current} onClick={() => {
              const held = last.current;
              if (!held) return;
              const canvas = document.createElement("canvas");
              canvas.width = held.width;
              canvas.height = held.height;
              canvas.getContext("2d")?.putImageData(maskToImage(held.mask, held.width, held.height, [255, 255, 255, 255]), 0, 0);
              downloadCanvas(canvas, "mask.png");
            }}>Mask PNG</button>
            <button type="button" disabled={!last.current} onClick={() => {
              if (!extractRef.current) return;
              downloadCanvas(cropOpaque(extractRef.current), "object-crop.png");
            }}>Cropped object</button>
            <button type="button" disabled={!last.current} onClick={() => {
              const held = last.current;
              if (!held) return;
              const blob = new Blob([JSON.stringify({ pixels: held.pixels, coverage: held.coverage, contours: held.contours, seeds, box, tolerance, at: new Date().toISOString() }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "interactive-mask.json";
              link.click();
              URL.revokeObjectURL(url);
            }}>Metadata JSON</button>
          </div>
        </aside>
      </div>
    </VisionPageShell>
  );
}
