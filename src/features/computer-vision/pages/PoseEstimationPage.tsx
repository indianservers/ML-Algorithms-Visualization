import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { PoseOverlay } from "../components/PoseOverlay";
import { Skeleton3D } from "../components/Skeleton3D";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createPoseLandmarker, formatVisionError, POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { emaPoints, POSE_NAMES, poseJointAngles, type Xyz } from "../utils/landmarkGeometry";
import type { LandmarkPoint } from "../types";

type Mode = "camera" | "image" | "video";
type View = "front" | "side" | "top";

export default function PoseEstimationPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const smoothRef = useRef<Xyz[] | null>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [world, setWorld] = useState<Xyz[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to load MediaPipe Pose Landmarker.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [fullModel, setFullModel] = useState(false);
  const [view, setView] = useState<View>("front");
  const [yaw, setYaw] = useState(0);
  const [smoothing, setSmoothing] = useState(0.35);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus(fullModel ? "Loading Pose Landmarker (full)…" : "Loading Pose Landmarker (lite)…");
    landmarkerRef.current = await createPoseLandmarker(fullModel);
    setStatus("Pose landmarker ready. Angles use 3-point geometry; 3D view uses world landmarks when present.");
    return landmarkerRef.current;
  };

  const publish = (points: LandmarkPoint[], worldPoints: Xyz[], w: number, h: number, ms: number, now: number) => {
    const smoothed = emaPoints(smoothRef.current, points, 1 - smoothing);
    smoothRef.current = smoothed;
    if (now - lastUi.current > 80) {
      lastUi.current = now;
      setLandmarks(smoothed as LandmarkPoint[]);
      setWorld(worldPoints);
      setLatency(ms);
      setSize({ w, h });
      fpsRef.current.frames += 1;
      if (now - fpsRef.current.stamp > 500) {
        setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
        fpsRef.current = { frames: 0, stamp: now };
      }
    }
  };

  const fromResult = (result: Awaited<ReturnType<PoseLandmarker["detect"]>>) => {
    const pose = result.landmarks[0] ?? [];
    const points = pose.map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z ?? 0,
      visibility: point.visibility ?? 1,
    }));
    const worldPoints = (result.worldLandmarks[0] ?? points).map((point, index) => ({
      x: point.x,
      y: point.y,
      z: point.z ?? 0,
      visibility: points[index]?.visibility ?? 1,
    }));
    return { points, worldPoints };
  };

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const landmarker = await ensure();
      const started = performance.now();
      const parsed = fromResult(landmarker.detectForVideo(source, now));
      publish(parsed.points, parsed.worldPoints, source.videoWidth || 640, source.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Pose estimation failed."));
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
      const started = performance.now();
      const parsed = fromResult(landmarker.detect(image));
      await landmarker.setOptions({ runningMode: "VIDEO" });
      lastUi.current = 0;
      publish(parsed.points, parsed.worldPoints, image.width, image.height, performance.now() - started, performance.now());
    };
    image.src = url;
  };

  const overlay = (
    <PoseOverlay landmarks={landmarks} width={size.w} height={size.h} showSkeleton={showSkeleton} showLabels={showLabels} />
  );
  const angles = useMemo(() => poseJointAngles(world.length ? world : landmarks), [world, landmarks]);
  const tablePoints = landmarks;

  return (
    <VisionPageShell pathname={pathname} kicker="33 MediaPipe body landmarks, skeleton, world-space 3D, and joint angles.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); setImageUrl(null); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setVideoUrl(URL.createObjectURL(file));
              setMode("video");
              setImageUrl(null);
            }} /></label>
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
              extra={<><span>{fps.toFixed(0)} FPS</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{status}</p>
          <div className="cv-toggles">
            <label><input type="checkbox" checked={showSkeleton} onChange={(event) => setShowSkeleton(event.target.checked)} /> Skeleton</label>
            <label><input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} /> Joint labels</label>
            <label><input type="checkbox" checked={fullModel} onChange={(event) => {
              setFullModel(event.target.checked);
              landmarkerRef.current?.close();
              landmarkerRef.current = null;
            }} /> Full model</label>
          </div>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>3D pose</h2>
            <p>{world.length ? "World landmarks from MediaPipe" : "Waiting for world landmarks"}</p>
            <div className="cv-class-actions">
              {(["front", "side", "top"] as View[]).map((item) => (
                <button key={item} type="button" className={view === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setView(item)}>{item}</button>
              ))}
            </div>
            {world.length || landmarks.length ? (
              <Skeleton3D points={world.length ? world : landmarks} view={view} yaw={yaw} connections={POSE_CONNECTIONS} />
            ) : null}
            <label>Rotate {yaw}°
              <input type="range" min={-180} max={180} value={yaw} onChange={(event) => setYaw(Number(event.target.value))} />
            </label>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Live</h2>
            <div className="cv-metrics">
              <div><b>{landmarks.length || "—"}</b><span>Landmarks</span></div>
              <div><b>{landmarks.length ? fps.toFixed(0) : "—"}</b><span>FPS</span></div>
              <div><b>{landmarks.length ? `${latency.toFixed(0)}ms` : "—"}</b><span>Latency</span></div>
            </div>
            <label>Smoothing {smoothing.toFixed(2)}
              <input type="range" min={0} max={0.85} step={0.05} value={smoothing} onChange={(event) => setSmoothing(Number(event.target.value))} />
            </label>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Joint angles</h2>
            <p>Interior angle at each joint from 3-point geometry.</p>
            <div className="cv-angle-grid">
              {angles.map((joint) => (
                <div key={joint.id}>
                  <b>{joint.deg == null ? "—" : `${joint.deg.toFixed(0)}°`}</b>
                  <span>{joint.label}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
        <section className="cv-panel cv-pose-table">
          <h2>Landmark table</h2>
          <table className="cv-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>x</th><th>y</th><th>z</th><th>vis</th></tr>
            </thead>
            <tbody>
              {tablePoints.map((point, index) => (
                <tr key={index}>
                  <td>{index}</td>
                  <td>{POSE_NAMES[index] ?? `pt ${index}`}</td>
                  <td>{point.x.toFixed(3)}</td>
                  <td>{point.y.toFixed(3)}</td>
                  <td>{point.z.toFixed(3)}</td>
                  <td>{(point.visibility ?? 1).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </VisionPageShell>
  );
}
