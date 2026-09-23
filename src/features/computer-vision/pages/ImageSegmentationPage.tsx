import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createImageSegmenter, formatVisionError, type SegmenterKind } from "../runtime/mediapipeRuntime";
import { colorizeCategory, countClasses, downloadCanvas, SEG_PALETTE, VOC_FALLBACK } from "../utils/maskRender";

type Mode = "camera" | "image" | "video";
type Display = "original" | "mask" | "overlay" | "split";

export default function ImageSegmentationPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const lastMask = useRef<{ data: Uint8Array; w: number; h: number } | null>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [display, setDisplay] = useState<Display>("overlay");
  const [model, setModel] = useState<Exclude<SegmenterKind, "selfie">>("deeplab");
  const [labels, setLabels] = useState<string[]>([]);
  const [counts, setCounts] = useState<number[]>([]);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [opacity, setOpacity] = useState(0.55);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [status, setStatus] = useState("Start the camera or upload an image to run MediaPipe Image Segmenter.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => () => {
    segmenterRef.current?.close();
    segmenterRef.current = null;
  }, []);

  const ensure = async () => {
    if (segmenterRef.current) return segmenterRef.current;
    setStatus(model === "deeplab" ? "Loading DeepLab v3…" : "Loading selfie multiclass segmenter…");
    segmenterRef.current = await createImageSegmenter(model, true);
    const names = segmenterRef.current.getLabels();
    setLabels(names.length ? names : VOC_FALLBACK);
    setStatus("Segmenter ready. Classes come from the model label map.");
    return segmenterRef.current;
  };

  const paint = (mask: Uint8Array, w: number, h: number, names: string[], updateCounts = false) => {
    lastMask.current = { data: mask, w, h };
    const overlay = overlayRef.current;
    const maskCanvas = maskRef.current;
    const overlayOpacity = display === "mask" ? 1 : opacity;
    const image = colorizeCategory(mask, w, h, hidden, overlayOpacity);
    if (overlay) {
      overlay.width = w;
      overlay.height = h;
      overlay.getContext("2d")?.putImageData(image, 0, 0);
    }
    if (maskCanvas) {
      maskCanvas.width = w;
      maskCanvas.height = h;
      const ctx = maskCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0b1328";
        ctx.fillRect(0, 0, w, h);
        ctx.putImageData(colorizeCategory(mask, w, h, hidden, 1), 0, 0);
      }
    }
    if (updateCounts) setCounts(countClasses(mask, names.length || 21));
  };

  useEffect(() => {
    const held = lastMask.current;
    if (!held) return;
    paint(held.data, held.w, held.h, labels);
    // display/opacity/hidden only recolor the last mask
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, opacity, display]);

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const segmenter = await ensure();
      const started = performance.now();
      const result = segmenter.segmentForVideo(source, now);
      const cat = result.categoryMask;
      if (cat) {
        const data = cat.getAsUint8Array();
        const names = labels.length ? labels : (segmenter.getLabels().length ? segmenter.getLabels() : VOC_FALLBACK);
        if (!labels.length) setLabels(names);
        paint(data, cat.width, cat.height, names);
        result.close();
      }
      if (now - lastUi.current > 120) {
        lastUi.current = now;
        const held = lastMask.current;
        if (held) setCounts(countClasses(held.data, labels.length || 21));
        setLatency(performance.now() - started);
        fpsRef.current.frames += 1;
        if (now - fpsRef.current.stamp > 500) {
          setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
          fpsRef.current = { frames: 0, stamp: now };
        }
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "Segmentation failed."));
    }
  });

  const detectStill = async (file: File) => {
    const url = URL.createObjectURL(file);
    setMode("image");
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      const segmenter = await ensure();
      await segmenter.setOptions({ runningMode: "IMAGE" });
      const result = segmenter.segment(image);
      const cat = result.categoryMask;
      if (cat) {
        const names = segmenter.getLabels().length ? segmenter.getLabels() : VOC_FALLBACK;
        setLabels(names);
        paint(cat.getAsUint8Array(), cat.width, cat.height, names, true);
        result.close();
      }
      await segmenter.setOptions({ runningMode: "VIDEO" });
    };
    image.src = url;
  };

  const switchModel = (next: Exclude<SegmenterKind, "selfie">) => {
    setModel(next);
    segmenterRef.current?.close();
    segmenterRef.current = null;
    setLabels([]);
    setCounts([]);
  };

  const total = counts.reduce((sum, value) => sum + value, 0);
  const overlayCanvas = <canvas ref={overlayRef} className={display === "original" ? "cv-overlay is-hidden" : "cv-overlay"} />;

  return (
    <VisionPageShell pathname={pathname} kicker="Pixel-level semantic masks from MediaPipe Image Segmenter. Classes are whatever the loaded model returns.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setVideoUrl(URL.createObjectURL(file)); setMode("video"); }} /></label>
          </div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            {(["original", "mask", "overlay", "split"] as Display[]).map((item) => (
              <button key={item} type="button" className={display === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setDisplay(item)}>{item}</button>
            ))}
          </div>
          {mode === "image" && imageUrl ? (
            <div className="cv-camera">
              <img src={imageUrl} alt="" style={{ opacity: display === "mask" ? 0 : 1 }} />
              {overlayCanvas}
            </div>
          ) : mode === "video" && videoUrl ? (
            <div className="cv-camera">
              <video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay style={{ opacity: display === "mask" ? 0 : 1 }} />
              {overlayCanvas}
            </div>
          ) : (
            <VisionCamera
              videoRef={camera.videoRef}
              status={camera.status}
              permission={camera.permission}
              error={camera.error}
              mirror={camera.mirror}
              onStart={() => void camera.start()}
              onStop={camera.stop}
              onToggleMirror={() => camera.setMirror((value) => !value)}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span>{counts.length ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlayCanvas}
            </VisionCamera>
          )}
          {display === "split" ? <canvas ref={maskRef} className="cv-split-mask" /> : <canvas ref={maskRef} hidden />}
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Segmentation</h2>
          <label>Model
            <select value={model} onChange={(event) => switchModel(event.target.value as Exclude<SegmenterKind, "selfie">)}>
              <option value="deeplab">DeepLab v3 (Pascal VOC)</option>
              <option value="selfieMulti">Selfie multiclass</option>
            </select>
          </label>
          <label>Opacity {opacity.toFixed(2)}
            <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
          </label>
          <p>{latency ? `${latency.toFixed(0)} ms` : "—"} · {total ? `${total} pixels` : "no mask yet"}</p>
          <div className="cv-class-actions">
            <button type="button" disabled={!maskRef.current && !overlayRef.current} onClick={() => overlayRef.current && downloadCanvas(overlayRef.current, "overlay.png")}>Save overlay PNG</button>
            <button type="button" disabled={!lastMask.current} onClick={() => {
              const held = lastMask.current;
              if (!held) return;
              const canvas = document.createElement("canvas");
              canvas.width = held.w;
              canvas.height = held.h;
              canvas.getContext("2d")?.putImageData(colorizeCategory(held.data, held.w, held.h, new Set(), 1), 0, 0);
              downloadCanvas(canvas, "class-mask.png");
            }}>Save class mask</button>
            <button type="button" disabled={!lastMask.current} onClick={() => {
              const held = lastMask.current;
              if (!held) return;
              const payload = {
                model,
                labels,
                counts,
                coverage: counts.map((count) => total ? count / total : 0),
                at: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "segmentation.json";
              link.click();
              URL.revokeObjectURL(url);
            }}>Export metadata</button>
          </div>
          <table className="cv-table">
            <thead><tr><th></th><th>Class</th><th>Pixels</th><th>%</th></tr></thead>
            <tbody>
              {labels.map((name, index) => {
                const count = counts[index] ?? 0;
                if (!count && hidden.has(index)) return (
                  <tr key={name}>
                    <td><input type="checkbox" checked={false} onChange={() => setHidden((current) => { const next = new Set(current); next.delete(index); return next; })} /></td>
                    <td>{name}</td><td>0</td><td>—</td>
                  </tr>
                );
                if (!count) return null;
                return (
                  <tr key={name}>
                    <td>
                      <label>
                        <input type="checkbox" checked={!hidden.has(index)} onChange={() => setHidden((current) => {
                          const next = new Set(current);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        })} />
                        <i style={{ display: "inline-block", width: 10, height: 10, background: SEG_PALETTE[index % SEG_PALETTE.length], marginLeft: 4 }} />
                      </label>
                    </td>
                    <td>{name}</td>
                    <td>{count}</td>
                    <td>{total ? `${((count / total) * 100).toFixed(1)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </aside>
      </div>
    </VisionPageShell>
  );
}
