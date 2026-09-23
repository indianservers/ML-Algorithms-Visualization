import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FaceLandmarker, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createFaceLandmarker, createHandLandmarker, createPoseLandmarker, formatVisionError } from "../runtime/mediapipeRuntime";
import { AR_EFFECTS, ArOverlay } from "../ar/ArOverlay";
import { DEFAULT_AR_ID, loadArConfig, saveArConfig } from "../storage/visionProjectStore";
import { downloadCanvas } from "../utils/maskRender";
import type { LandmarkPoint, TrackedHand } from "../types";

export default function CameraEffectsPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const faceRef = useRef<FaceLandmarker | null>(null);
  const handsRef = useRef<HandLandmarker | null>(null);
  const poseRef = useRef<PoseLandmarker | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const trailRef = useRef<Array<Array<{ x: number; y: number }>>>([[], []]);
  const aliveRef = useRef(true);

  const [face, setFace] = useState<LandmarkPoint[]>([]);
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [pose, setPose] = useState<LandmarkPoint[]>([]);
  const [trails, setTrails] = useState<Array<Array<{ x: number; y: number }>>>([]);
  const [enabled, setEnabled] = useState<string[]>(["glasses", "sparkles"]);
  const [custom, setCustom] = useState<Array<{ id: string; anchor: string; dataUrl: string }>>([]);
  const [opacity, setOpacity] = useState(0.95);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [anchor, setAnchor] = useState("face");
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Effects follow live Face, Hand, and Pose landmarks. No depth/occlusion.");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    void loadArConfig().then((saved) => {
      if (!saved) return;
      setEnabled(saved.enabled);
      setOpacity(saved.opacity);
      setScale(saved.scale);
      setCustom(saved.custom);
    });
  }, []);

  useEffect(() => () => {
    aliveRef.current = false;
    faceRef.current?.close();
    handsRef.current?.close();
    poseRef.current?.close();
    faceRef.current = null;
    handsRef.current = null;
    poseRef.current = null;
  }, []);

  const persist = (nextEnabled = enabled, nextCustom = custom, nextOpacity = opacity, nextScale = scale) => {
    void saveArConfig({
      id: DEFAULT_AR_ID,
      updatedAt: Date.now(),
      enabled: nextEnabled,
      opacity: nextOpacity,
      scale: nextScale,
      custom: nextCustom,
    });
  };

  const ensure = async () => {
    if (!faceRef.current) {
      setStatus("Loading face, hand, and pose landmarkers…");
      const face = await createFaceLandmarker(1);
      if (!aliveRef.current) { face.close(); throw new Error("Lab unmounted"); }
      faceRef.current = face;
    }
    if (!handsRef.current) {
      const hands = await createHandLandmarker(2);
      if (!aliveRef.current) { hands.close(); throw new Error("Lab unmounted"); }
      handsRef.current = hands;
    }
    if (!poseRef.current) {
      const pose = await createPoseLandmarker(false);
      if (!aliveRef.current) { pose.close(); throw new Error("Lab unmounted"); }
      poseRef.current = pose;
    }
    setStatus("Landmarkers ready. Effects are SVG overlays on real keypoints.");
    return { face: faceRef.current, hands: handsRef.current, pose: poseRef.current };
  };

  useRafLoop(camera.status === "live" && !paused, async (now) => {
    const source = camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const models = await ensure();
      const started = performance.now();
      const faceResult = models.face.detectForVideo(source, now);
      const handResult = models.hands.detectForVideo(source, now);
      const poseResult = models.pose.detectForVideo(source, now);
      const w = source.videoWidth || 640;
      const h = source.videoHeight || 360;
      const facePts = (faceResult.faceLandmarks[0] ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 }));
      const posePts = (poseResult.landmarks[0] ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, visibility: point.visibility ?? 1 }));
      const tracked: TrackedHand[] = (handResult.landmarks ?? []).map((points, index) => ({
        handedness: handResult.handedness[index]?.[0]?.categoryName === "Left" ? "Left" : "Right",
        score: handResult.handedness[index]?.[0]?.score ?? 0,
        landmarks: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
        worldLandmarks: [],
      }));
      const nextTrails = trailRef.current.map((path, index) => {
        const palm = tracked[index]?.landmarks[9];
        if (!palm) return path.slice(-40);
        return [...path, { x: palm.x * w, y: palm.y * h }].slice(-40);
      });
      trailRef.current = nextTrails;
      if (now - lastUi.current > 50) {
        lastUi.current = now;
        setFace(facePts);
        setPose(posePts);
        setHands(tracked);
        setTrails(nextTrails);
        setLatency(performance.now() - started);
        setSize({ w, h });
        fpsRef.current.frames += 1;
        if (now - fpsRef.current.stamp > 500) {
          setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
          fpsRef.current = { frames: 0, stamp: now };
        }
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "AR pipeline failed."));
    }
  });

  const toggle = (id: string) => {
    const next = enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id];
    setEnabled(next);
    persist(next);
  };

  const move = (id: string, dir: -1 | 1) => {
    const index = enabled.indexOf(id);
    if (index < 0) return;
    const next = [...enabled];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const held = next[index]!;
    next[index] = next[swap]!;
    next[swap] = held;
    setEnabled(next);
    persist(next);
  };

  const capture = () => {
    const shot = camera.snapshot();
    if (!shot) {
      setStatus("Start the camera first.");
      return;
    }
    downloadCanvas(shot, "ar-snapshot.png");
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Bundled SVG effects follow live Face / Hand / Pose landmarks. No fake depth or occlusion.">
      <div className="cv-pose-layout">
        <div>
          <VisionCamera
            videoRef={camera.videoRef}
            status={camera.status}
            permission={camera.permission}
            error={camera.error}
            mirror={camera.mirror}
            onStart={() => void camera.start()}
            onStop={() => { camera.stop(); setFace([]); setHands([]); setPose([]); }}
            onToggleMirror={() => camera.setMirror((value) => !value)}
            onSnapshot={capture}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
            extra={<span>{face.length || hands.length || pose.length ? `${fps.toFixed(0)} FPS · ${latency.toFixed(0)}ms` : "—"}</span>}
          >
            <ArOverlay
              face={face}
              hands={hands}
              pose={pose}
              width={size.w}
              height={size.h}
              enabled={enabled}
              opacity={opacity}
              scale={scale}
              rotation={rotation}
              trails={trails}
              custom={custom}
            />
          </VisionCamera>
          <div className="cv-class-actions" style={{ marginTop: 8 }}>
            <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
            <button type="button" onClick={capture}>Snapshot</button>
          </div>
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Effect gallery</h2>
          {AR_EFFECTS.map((effect) => (
            <label key={effect.id} className="cv-check-row">
              <input type="checkbox" checked={enabled.includes(effect.id)} onChange={() => toggle(effect.id)} />
              {effect.label} <span>{effect.group}</span>
            </label>
          ))}
          <h3>Layer order</h3>
          {enabled.map((id) => (
            <div key={id} className="cv-class-actions">
              <span>{AR_EFFECTS.find((item) => item.id === id)?.label ?? id}</span>
              <button type="button" onClick={() => move(id, -1)}>Up</button>
              <button type="button" onClick={() => move(id, 1)}>Down</button>
            </div>
          ))}
          <label>Opacity {opacity.toFixed(2)}<input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(event) => { const value = Number(event.target.value); setOpacity(value); persist(enabled, custom, value, scale); }} /></label>
          <label>Scale {scale.toFixed(2)}<input type="range" min={0.5} max={1.8} step={0.05} value={scale} onChange={(event) => { const value = Number(event.target.value); setScale(value); persist(enabled, custom, opacity, value); }} /></label>
          <label>Rotation offset {rotation}°<input type="range" min={-30} max={30} value={rotation} onChange={(event) => setRotation(Number(event.target.value))} /></label>
          <h3>Custom PNG</h3>
          <label>Anchor
            <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
              <option value="face">Face / eyes</option>
              <option value="palm">Palm</option>
              <option value="shoulder">Shoulder</option>
              <option value="head">Head</option>
            </select>
          </label>
          <label className="cv-btn">Upload PNG/WebP
            <input type="file" accept="image/png,image/webp" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const next = [...custom, { id: `c${Date.now()}`, anchor, dataUrl: String(reader.result) }];
                setCustom(next);
                persist(enabled, next);
              };
              reader.readAsDataURL(file);
            }} />
          </label>
          {custom.map((item) => (
            <button key={item.id} type="button" onClick={() => {
              const next = custom.filter((row) => row.id !== item.id);
              setCustom(next);
              persist(enabled, next);
            }}>Remove custom {item.anchor}</button>
          ))}
        </aside>
      </div>
    </VisionPageShell>
  );
}
