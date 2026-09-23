import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FaceDetector } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { DetectionOverlay } from "../components/DetectionOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createFaceDetector, formatVisionError } from "../runtime/mediapipeRuntime";
import { CLASS_COLORS, type DetectionHit } from "../types";
import { cropToDataUrl } from "../utils/landmarkGeometry";

type Mode = "camera" | "image" | "video";

export default function FaceDetectionPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const detectorRef = useRef<FaceDetector | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });

  const [mode, setMode] = useState<Mode>("camera");
  const [threshold, setThreshold] = useState(0.5);
  const [maxFaces, setMaxFaces] = useState(8);
  const [showLabels, setShowLabels] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hits, setHits] = useState<DetectionHit[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to load MediaPipe Face Detector.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => () => {
    detectorRef.current?.close();
    detectorRef.current = null;
  }, []);

  useEffect(() => () => {
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => () => {
    if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    void detectorRef.current?.setOptions({ minDetectionConfidence: threshold });
  }, [threshold]);

  const ensure = async () => {
    if (detectorRef.current) return detectorRef.current;
    setStatus("Loading MediaPipe Face Detector…");
    detectorRef.current = await createFaceDetector(threshold);
    setStatus("Face detector ready.");
    return detectorRef.current;
  };

  const applyResult = (
    detections: DetectionHit[],
    source: CanvasImageSource,
    w: number,
    h: number,
    ms: number,
    now: number,
  ) => {
    const next = detections.slice(0, maxFaces);
    const thumbs = next.map((hit) => cropToDataUrl(source, hit.box));
    if (now - lastUi.current > 90) {
      lastUi.current = now;
      setHits(next);
      setCrops(thumbs);
      setLatency(ms);
      setSize({ w, h });
      fpsRef.current.frames += 1;
      if (now - fpsRef.current.stamp > 500) {
        setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
        fpsRef.current = { frames: 0, stamp: now };
      }
    }
  };

  const mapDetections = (result: { detections?: Array<{ categories: Array<{ score?: number }>; boundingBox?: { originX: number; originY: number; width: number; height: number } }> }) =>
    (result.detections ?? []).map((item, index) => ({
      id: `face-${index}`,
      label: `Face ${index + 1}`,
      score: item.categories[0]?.score ?? 0,
      box: {
        x: item.boundingBox?.originX ?? 0,
        y: item.boundingBox?.originY ?? 0,
        w: item.boundingBox?.width ?? 0,
        h: item.boundingBox?.height ?? 0,
      },
      color: CLASS_COLORS[index % CLASS_COLORS.length],
    })).filter((item) => item.score >= threshold);

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const detector = await ensure();
      const started = performance.now();
      const result = detector.detectForVideo(source, now);
      applyResult(mapDetections(result), source, source.videoWidth || 640, source.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Face detection failed."));
    }
  });

  const detectStill = async (file: File) => {
    const url = URL.createObjectURL(file);
    setMode("image");
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      try {
        const detector = await ensure();
        await detector.setOptions({ runningMode: "IMAGE" });
        const started = performance.now();
        const result = detector.detect(image);
        await detector.setOptions({ runningMode: "VIDEO" });
        lastUi.current = 0;
        applyResult(mapDetections(result), image, image.width, image.height, performance.now() - started, performance.now());
        setStatus(`Detected ${result.detections.length} face${result.detections.length === 1 ? "" : "s"}.`);
      } catch (caught) {
        setStatus(formatVisionError(caught, "Image detection failed."));
      }
    };
    image.src = url;
  };

  const overlay = (
    <DetectionOverlay detections={hits} width={size.w} height={size.h} showLabels={showLabels} showConfidence={showConfidence} />
  );

  return (
    <VisionPageShell pathname={pathname} kicker="Detect one or more faces. These IDs are frame labels, not identities.">
      <div className="cv-detect-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); setImageUrl(null); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image
              <input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} />
            </label>
            <label className="cv-btn">Video
              <input type="file" accept="video/*" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setVideoUrl(url);
                setMode("video");
                setImageUrl(null);
              }} />
            </label>
          </div>
          {mode === "image" && imageUrl ? (
            <div className="cv-camera">
              <img ref={imageRef} src={imageUrl} alt="Uploaded frame" />
              {overlay}
            </div>
          ) : mode === "video" && videoUrl ? (
            <div className="cv-camera">
              <video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay />
              {overlay}
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
              onSnapshot={() => {
                const frame = camera.snapshot();
                if (!frame) return;
                lastUi.current = 0;
                applyResult(hits, frame, frame.width, frame.height, latency, performance.now());
              }}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span className="cv-live">{fps.toFixed(0)} FPS</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{status}</p>
          <div className="cv-crops">
            {crops.map((src, index) => (
              <figure key={hits[index]?.id ?? index}>
                {src ? <img src={src} alt="" /> : null}
                <figcaption>{hits[index]?.label ?? `Face ${index + 1}`} · {(hits[index]?.score ?? 0).toFixed(2)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <aside className="cv-panel">
          <h2>Detection</h2>
          <div className="cv-metrics">
            <div><b>{hits.length}</b><span>Faces</span></div>
            <div><b>{fps.toFixed(0)}</b><span>FPS</span></div>
            <div><b>{latency.toFixed(0)}ms</b><span>Latency</span></div>
          </div>
          <label>Max faces <input type="number" min={1} max={12} value={maxFaces} onChange={(event) => setMaxFaces(Number(event.target.value))} /></label>
          <label>Confidence {threshold.toFixed(2)}
            <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          </label>
          <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Show labels</label>
          <label><input type="checkbox" checked={showConfidence} onChange={(event) => setShowConfidence(event.target.checked)} /> Show confidence</label>
          <p>IDs are numbered in the current frame only. This lab does not recognize or identify people.</p>
          <table className="cv-table">
            <thead><tr><th>ID</th><th>Conf</th></tr></thead>
            <tbody>
              {hits.map((hit, index) => (
                <tr key={hit.id}>
                  <td>
                    <span className="cv-face-row">{crops[index] ? <img src={crops[index]} alt="" /> : null}{hit.label}</span>
                  </td>
                  <td>{hit.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </div>
    </VisionPageShell>
  );
}
