import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { PoseOverlay } from "../components/PoseOverlay";
import { Skeleton3D } from "../components/Skeleton3D";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createPoseLandmarker, formatVisionError, POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import {
  angleAt,
  emaPoints,
  POSE_NAMES,
  poseJointAngles,
  postureEstimate,
  segmentTiltDeg,
  torsoLeanDeg,
  type Xyz,
} from "../utils/landmarkGeometry";
import type { LandmarkPoint } from "../types";

type Mode = "camera" | "image" | "video";
type View = "front" | "side" | "top";
type Preset = "squat" | "lunge" | "curl" | "raise" | "custom";

const PRESETS: Record<Preset, { label: string; joint: string; target: number; tol: number }> = {
  squat: { label: "Squat", joint: "leftKnee", target: 90, tol: 10 },
  lunge: { label: "Lunge", joint: "leftKnee", target: 90, tol: 15 },
  curl: { label: "Bicep Curl", joint: "leftElbow", target: 45, tol: 15 },
  raise: { label: "Shoulder Raise", joint: "leftShoulder", target: 150, tol: 15 },
  custom: { label: "Custom", joint: "leftKnee", target: 90, tol: 10 },
};

const CHART_KEYS = [
  { id: "leftKnee", label: "Left knee" },
  { id: "rightKnee", label: "Right knee" },
  { id: "leftElbow", label: "Left elbow" },
  { id: "rightElbow", label: "Right elbow" },
  { id: "leftHip", label: "Left hip" },
  { id: "rightHip", label: "Right hip" },
  { id: "leftShoulder", label: "Left shoulder" },
  { id: "rightShoulder", label: "Right shoulder" },
  { id: "torso", label: "Torso lean" },
] as const;

function mapPose(result: Awaited<ReturnType<PoseLandmarker["detect"]>>) {
  const pose = result.landmarks[0] ?? [];
  const points = pose.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, visibility: point.visibility ?? 1 }));
  const world = (result.worldLandmarks[0] ?? points).map((point, index) => ({
    x: point.x, y: point.y, z: point.z ?? 0, visibility: points[index]?.visibility ?? 1,
  }));
  return { points, world };
}

export default function PoseAngleAnalyzerPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const smoothRef = useRef<Xyz[] | null>(null);
  const historyRef = useRef<Array<Record<string, number>>>([]);

  const [mode, setMode] = useState<Mode>("camera");
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [world, setWorld] = useState<Xyz[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to measure live joint angles.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [preset, setPreset] = useState<Preset>("squat");
  const [target, setTarget] = useState(90);
  const [tol, setTol] = useState(10);
  const [jointId, setJointId] = useState("leftKnee");
  const [custom, setCustom] = useState({ a: 23, b: 25, c: 27 });
  const [chartKey, setChartKey] = useState<(typeof CHART_KEYS)[number]["id"]>("leftKnee");
  const [history, setHistory] = useState<Array<Record<string, number>>>([]);
  const [view, setView] = useState<View>("front");
  const [yaw, setYaw] = useState(0);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  useEffect(() => {
    const next = PRESETS[preset];
    setJointId(next.joint);
    setTarget(next.target);
    setTol(next.tol);
  }, [preset]);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus("Loading MediaPipe Pose Landmarker…");
    landmarkerRef.current = await createPoseLandmarker(false);
    setStatus("Angles use 3-point geometry. Posture lines are estimates, not a medical assessment.");
    return landmarkerRef.current;
  };

  const publish = (points: LandmarkPoint[], worldPoints: Xyz[], w: number, h: number, ms: number, now: number) => {
    const smoothed = emaPoints(smoothRef.current, points, 0.45);
    smoothRef.current = smoothed;
    const joints = poseJointAngles(smoothed);
    const row: Record<string, number> = { t: now };
    for (const joint of joints) row[joint.id] = joint.deg ?? Number.NaN;
    row.torso = torsoLeanDeg(smoothed) ?? Number.NaN;
    historyRef.current = [...historyRef.current, row].slice(-90);
    if (now - lastUi.current > 90) {
      lastUi.current = now;
      setLandmarks(smoothed as LandmarkPoint[]);
      setWorld(worldPoints);
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

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const landmarker = await ensure();
      const started = performance.now();
      const parsed = mapPose(landmarker.detectForVideo(source, now));
      publish(parsed.points, parsed.world, source.videoWidth || 640, source.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Pose angle analysis failed."));
    }
  });

  const detectStill = async (file: File) => {
    const url = URL.createObjectURL(file);
    setMode("image");
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      const landmarker = await ensure();
      await landmarker.setOptions({ runningMode: "IMAGE" });
      const parsed = mapPose(landmarker.detect(image));
      await landmarker.setOptions({ runningMode: "VIDEO" });
      lastUi.current = 0;
      publish(parsed.points, parsed.world, image.width, image.height, 0, performance.now());
    };
    image.src = url;
  };

  const joints = useMemo(() => poseJointAngles(world.length ? world : landmarks), [world, landmarks]);
  const posture = useMemo(() => postureEstimate(world.length ? world : landmarks), [world, landmarks]);
  const selected = jointId === "custom"
    ? { id: "custom", label: "Custom", a: custom.a, b: custom.b, c: custom.c, deg: angleAt((world.length ? world : landmarks)[custom.a], (world.length ? world : landmarks)[custom.b], (world.length ? world : landmarks)[custom.c]) }
    : joints.find((item) => item.id === jointId) ?? joints[0];
  const inRange = selected?.deg != null && Math.abs(selected.deg - target) <= tol;
  const segmentTilt = selected ? segmentTiltDeg((world.length ? world : landmarks)[selected.a], (world.length ? world : landmarks)[selected.c]) : null;
  const overlay = (
    <PoseOverlay
      landmarks={landmarks}
      width={size.w}
      height={size.h}
      showSkeleton
      showLabels
      highlights={selected ? [selected.a, selected.b, selected.c] : []}
      angles={[
        ...joints.filter((item) => item.deg != null).slice(0, 8),
        ...(selected && selected.id === "custom" && selected.deg != null ? [selected] : []),
      ]}
    />
  );

  return (
    <VisionPageShell pathname={pathname} kicker="Live joint angles from pose landmarks. Posture indicators are geometric estimates, not a diagnosis.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setVideoUrl(URL.createObjectURL(file)); setMode("video"); }} /></label>
          </div>
          {mode === "image" && imageUrl ? (
            <div className="cv-camera"><img src={imageUrl} alt="" />{overlay}</div>
          ) : mode === "video" && videoUrl ? (
            <div className="cv-camera"><video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay />{overlay}</div>
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
              extra={<><span>{landmarks.length ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{status}</p>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Joint angles</h2>
            <div className="cv-angle-grid">
              {joints.map((joint) => (
                <button key={joint.id} type="button" className={jointId === joint.id ? "cv-btn-primary" : "cv-btn"} onClick={() => { setJointId(joint.id); setPreset("custom"); }}>
                  <b>{joint.deg == null ? "—" : `${joint.deg.toFixed(0)}°`}</b>
                  <span>{joint.label}</span>
                </button>
              ))}
              <div><b>{posture.torsoLean == null ? "—" : `${posture.torsoLean.toFixed(0)}°`}</b><span>Torso lean</span></div>
            </div>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Target range</h2>
            <label>Activity
              <select value={preset} onChange={(event) => setPreset(event.target.value as Preset)}>
                {Object.entries(PRESETS).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
              </select>
            </label>
            <p>Target {target}° ± {tol}° · selected {selected?.deg == null ? "—" : `${selected.deg.toFixed(0)}°`} · {selected?.deg == null ? "waiting" : inRange ? "inside range" : "outside range"}</p>
            <label>Target <input type="range" min={20} max={170} value={target} onChange={(event) => setTarget(Number(event.target.value))} /></label>
            <label>Tolerance <input type="range" min={2} max={30} value={tol} onChange={(event) => setTol(Number(event.target.value))} /></label>
            {preset === "custom" ? (
              <div className="cv-toggles">
                {(["a", "b", "c"] as const).map((key) => (
                  <label key={key}>{key}
                    <select value={custom[key]} onChange={(event) => setCustom((current) => ({ ...current, [key]: Number(event.target.value) }))}>
                      {POSE_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ) : null}
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Alignment indicators</h2>
            <p>Geometric estimates only.</p>
            <div className="cv-metrics">
              <div><b>{posture.shoulderTilt == null ? "—" : `${posture.shoulderTilt.toFixed(0)}°`}</b><span>Shoulder tilt</span></div>
              <div><b>{posture.hipTilt == null ? "—" : `${posture.hipTilt.toFixed(0)}°`}</b><span>Hip tilt</span></div>
              <div><b>{posture.symmetry == null ? "—" : `${(posture.symmetry * 100).toFixed(0)}%`}</b><span>Knee symmetry</span></div>
              <div><b>{segmentTilt == null ? "—" : `${segmentTilt.toFixed(0)}°`}</b><span>Selected segment</span></div>
            </div>
            {posture.notes.map((note) => <p key={note} className="cv-warn">{note}</p>)}
            <div className="cv-class-actions">
              {(["front", "side", "top"] as View[]).map((item) => (
                <button key={item} type="button" className={view === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setView(item)}>{item}</button>
              ))}
            </div>
            {world.length || landmarks.length ? <Skeleton3D points={world.length ? world : landmarks} view={view} yaw={yaw} connections={POSE_CONNECTIONS} /> : null}
            <label>Rotate {yaw}°<input type="range" min={-180} max={180} value={yaw} onChange={(event) => setYaw(Number(event.target.value))} /></label>
            <p>{landmarks.length ? `${fps.toFixed(0)} FPS · ${latency.toFixed(0)} ms` : "Waiting for pose"}</p>
          </article>
        </aside>
        <section className="cv-panel cv-expr-chart">
          <h2>Angle history</h2>
          <label>Metric
            <select value={chartKey} onChange={(event) => setChartKey(event.target.value as typeof chartKey)}>
              {CHART_KEYS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <div className="cv-chart" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history.map((row, index) => ({ i: index, value: Number.isFinite(row[chartKey]) ? row[chartKey] : null }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="i" />
                <YAxis domain={[0, 180]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </VisionPageShell>
  );
}
