import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { FaceMeshOverlay } from "../components/FaceMeshOverlay";
import { ConfidenceBars } from "../components/ConfidenceBars";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createFaceLandmarker, formatVisionError, keepVisionStatus } from "../runtime/mediapipeRuntime";
import type { LandmarkPoint } from "../types";

function scoreOf(map: Record<string, number>, ...keys: string[]) {
  const values = keys.map((key) => map[key] ?? 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function heuristicLabels(map: Record<string, number>) {
  const happy = scoreOf(map, "mouthSmileLeft", "mouthSmileRight");
  const surprised = Math.min(1, scoreOf(map, "jawOpen") * 0.55 + scoreOf(map, "eyeWideLeft", "eyeWideRight") * 0.45);
  const sad = scoreOf(map, "mouthFrownLeft", "mouthFrownRight");
  const angry = scoreOf(map, "browDownLeft", "browDownRight");
  const fear = scoreOf(map, "eyeWideLeft", "eyeWideRight", "browInnerUp") * 0.7;
  const dominant = Math.max(happy, surprised, sad, angry, fear);
  const neutral = Math.max(0, 1 - dominant);
  return [
    { name: "Happy*", value: happy, color: "#22c55e" },
    { name: "Neutral*", value: neutral, color: "#64748b" },
    { name: "Surprised*", value: surprised, color: "#a855f7" },
    { name: "Sad*", value: sad, color: "#3b82f6" },
    { name: "Angry*", value: angry, color: "#ef4444" },
    { name: "Fear*", value: fear, color: "#f59e0b" },
  ];
}

const METRICS = [
  { id: "smile", label: "Smile", keys: ["mouthSmileLeft", "mouthSmileRight"] },
  { id: "jawOpen", label: "Jaw open", keys: ["jawOpen"] },
  { id: "blink", label: "Blink", keys: ["eyeBlinkLeft", "eyeBlinkRight"] },
  { id: "browRaise", label: "Brow raise", keys: ["browInnerUp", "browOuterUpLeft", "browOuterUpRight"] },
  { id: "eyeWide", label: "Eye wide", keys: ["eyeWideLeft", "eyeWideRight"] },
  { id: "cheek", label: "Cheek", keys: ["cheekPuff", "cheekSquintLeft", "cheekSquintRight"] },
] as const;

export default function FaceExpressionsPage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const historyRef = useRef<Array<Record<string, number>>>([]);

  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [blendMap, setBlendMap] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<Array<Record<string, number>>>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to read Face Landmarker blendshapes.");
  const [chartMetric, setChartMetric] = useState<(typeof METRICS)[number]["id"]>("smile");
  const [paused, setPaused] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus((current) => keepVisionStatus(current, "Loading MediaPipe Face Landmarker…"));
    landmarkerRef.current = await createFaceLandmarker(1);
    setStatus("Blendshape scores come from MediaPipe. Starred labels are educational heuristics, not emotion detection.");
    return landmarkerRef.current;
  };

  const ingest = (result: Awaited<ReturnType<FaceLandmarker["detect"]>>, w: number, h: number, ms: number, now: number) => {
    const face = result.faceLandmarks[0] ?? [];
    const map: Record<string, number> = {};
    for (const item of result.faceBlendshapes[0]?.categories ?? []) {
      const name = item.categoryName || item.displayName;
      if (name) map[name] = item.score;
    }
    const row: Record<string, number> = { t: now };
    for (const metric of METRICS) row[metric.id] = scoreOf(map, ...metric.keys);
    historyRef.current = [...historyRef.current, row].slice(-80);
    if (now - lastUi.current > 100) {
      lastUi.current = now;
      setLandmarks(face.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })));
      setBlendMap(map);
      setHistory([...historyRef.current]);
      setLatency(ms);
      setSize({ w, h });
      fpsRef.current.frames += 1;
      if (now - fpsRef.current.stamp > 500) {
        setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
        fpsRef.current = { frames: 0, stamp: now };
      }
    }
  };

  useRafLoop(camera.status === "live" && !paused && !imageUrl, async (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    try {
      const landmarker = await ensure();
      const started = performance.now();
      ingest(landmarker.detectForVideo(video, now), video.videoWidth || 640, video.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Blendshape inference failed."));
    }
  });

  const heuristics = useMemo(() => heuristicLabels(blendMap), [blendMap]);
  const returned = Object.entries(blendMap)
    .filter(([, value]) => value > 0.02)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, value]) => ({ name, value }));

  const exportPayload = () => ({
    at: new Date().toISOString(),
    note: "Values are MediaPipe blendshape scores. Heuristic labels are not emotion detection.",
    blendshapes: blendMap,
    heuristics: Object.fromEntries(heuristics.map((item) => [item.name, item.value])),
  });

  const download = (filename: string, text: string, type: string) => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Live MediaPipe blendshape scores. Labels describe facial actions, not diagnoses.">
      <div className="cv-expr-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={!imageUrl ? "cv-btn-primary" : "cv-btn"} onClick={() => { setImageUrl(null); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Photo
              <input type="file" accept="image/*" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setImageUrl(url);
                const image = new Image();
                image.onload = async () => {
                  const landmarker = await ensure();
                  await landmarker.setOptions({ runningMode: "IMAGE" });
                  const started = performance.now();
                  ingest(landmarker.detect(image), image.width, image.height, performance.now() - started, performance.now());
                  await landmarker.setOptions({ runningMode: "VIDEO" });
                };
                image.src = url;
              }} />
            </label>
          </div>
          {imageUrl ? (
            <div className="cv-camera">
              <img src={imageUrl} alt="" />
              <FaceMeshOverlay landmarks={landmarks} width={size.w} height={size.h} groups={{ contours: true, lips: true, leftEye: true, rightEye: true, leftBrow: true, rightBrow: true }} />
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
                frame.toBlob((blob) => {
                  if (!blob) return;
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "face-frame.jpg";
                  link.click();
                  URL.revokeObjectURL(url);
                }, "image/jpeg", 0.9);
              }}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span>{fps.toFixed(0)} FPS</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              <FaceMeshOverlay landmarks={landmarks} width={size.w} height={size.h} groups={{ contours: true, lips: true, leftEye: true, rightEye: true, leftBrow: true, rightBrow: true, leftIris: true, rightIris: true }} />
            </VisionCamera>
          )}
          <p>{status}</p>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Educational mapping*</h2>
            <p>Starred names combine blendshapes for teaching only. They are not reliable emotion detection.</p>
            {Object.keys(blendMap).length ? <ConfidenceBars rows={heuristics} /> : <p>Waiting for Face Landmarker blendshapes.</p>}
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Live actions</h2>
            <div className="cv-metrics">
              {METRICS.slice(0, 6).map((metric) => (
                <div key={metric.id}><b>{Object.keys(blendMap).length ? scoreOf(blendMap, ...metric.keys).toFixed(2) : "—"}</b><span>{metric.label}</span></div>
              ))}
            </div>
            <p>{Object.keys(blendMap).length ? `${fps.toFixed(0)} FPS · ${latency.toFixed(0)} ms` : "Waiting for scores"}</p>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h3>Returned blendshapes</h3>
            <ConfidenceBars rows={returned} />
          </article>
        </aside>
        <section className="cv-panel cv-expr-chart">
          <h2>Timeline from live scores</h2>
          <label>Metric
            <select value={chartMetric} onChange={(event) => setChartMetric(event.target.value as typeof chartMetric)}>
              {METRICS.map((metric) => <option key={metric.id} value={metric.id}>{metric.label}</option>)}
            </select>
          </label>
          <div className="cv-chart" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map((row, index) => ({ i: index, value: row[chartMetric] ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="i" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} name={chartMetric} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="cv-class-actions">
            <button type="button" onClick={() => download("blendshapes.json", JSON.stringify(exportPayload(), null, 2), "application/json")} disabled={!Object.keys(blendMap).length}>Export JSON</button>
            <button type="button" onClick={() => {
              const keys = Object.keys(blendMap);
              const csv = ["name,score", ...keys.map((key) => `${key},${blendMap[key]?.toFixed(4) ?? 0}`)].join("\n");
              download("blendshapes.csv", csv, "text/csv");
            }} disabled={!Object.keys(blendMap).length}>Export CSV</button>
          </div>
        </section>
      </div>
    </VisionPageShell>
  );
}
