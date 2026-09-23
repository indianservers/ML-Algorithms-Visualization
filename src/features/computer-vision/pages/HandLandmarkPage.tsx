import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { LandmarkOverlay } from "../components/LandmarkOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createHandLandmarker, formatVisionError } from "../runtime/mediapipeRuntime";
import type { TrackedHand } from "../types";

function fingerOpen(landmarks: TrackedHand["landmarks"], tip: number, pip: number) {
  const a = landmarks[tip];
  const b = landmarks[pip];
  if (!a || !b) return false;
  return a.y < b.y - 0.02;
}

export default function HandLandmarkPage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [maxHands, setMaxHands] = useState(2);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to load MediaPipe Hands.");
  const [selected, setSelected] = useState<"Left" | "Right">("Right");
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const lastUi = useRef(0);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus("Loading MediaPipe Hand Landmarker…");
    landmarkerRef.current = await createHandLandmarker(maxHands);
    setStatus("Hand landmarker ready.");
    return landmarkerRef.current;
  };

  useRafLoop(camera.status === "live", (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    void (async () => {
      try {
        const landmarker = await ensure();
        const started = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const next: TrackedHand[] = (result.landmarks ?? []).map((points, index) => ({
          handedness: (result.handedness[index]?.[0]?.categoryName === "Left" ? "Left" : "Right") as "Left" | "Right",
          score: result.handedness[index]?.[0]?.score ?? 0,
          landmarks: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
          worldLandmarks: (result.worldLandmarks[index] ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
        }));
        if (now - lastUi.current > 80) {
          lastUi.current = now;
          setHands(next);
          setLatency(performance.now() - started);
          setSize({ w: video.videoWidth || 640, h: video.videoHeight || 360 });
          fpsRef.current.frames += 1;
          if (now - fpsRef.current.stamp > 500) {
            setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
            fpsRef.current = { frames: 0, stamp: now };
          }
        }
      } catch (caught) {
        setStatus(formatVisionError(caught, "Hand tracking failed."));
      }
    })();
  });

  const active = hands.find((hand) => hand.handedness === selected) ?? hands[0];
  const fingers = useMemo(() => {
    if (!active) return [];
    return [
      { name: "Thumb", open: fingerOpen(active.landmarks, 4, 3) },
      { name: "Index", open: fingerOpen(active.landmarks, 8, 6) },
      { name: "Middle", open: fingerOpen(active.landmarks, 12, 10) },
      { name: "Ring", open: fingerOpen(active.landmarks, 16, 14) },
      { name: "Pinky", open: fingerOpen(active.landmarks, 20, 18) },
    ];
  }, [active]);

  return (
    <VisionPageShell pathname={pathname} kicker="Track 21 hand landmarks in real time.">
      <div className="cv-hand-layout">
        <div>
          <VisionCamera
            videoRef={camera.videoRef}
            status={camera.status}
            permission={camera.permission}
            error={camera.error}
            mirror={camera.mirror}
            onStart={() => void camera.start()}
            onStop={() => { camera.stop(); setHands([]); }}
            onToggleMirror={() => camera.setMirror((value) => !value)}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => {
              camera.setDeviceId(id);
              void camera.start(id);
            }}
            extra={<span>{fps.toFixed(0)} FPS</span>}
          >
            <LandmarkOverlay
              hands={hands}
              width={size.w}
              height={size.h}
              showLandmarks={showLandmarks}
              showConnections={showConnections}
            />
          </VisionCamera>
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Live output</h2>
          <div className="cv-metrics">
            <div><b>{hands.length}</b><span>Hands</span></div>
            <div><b>{fps.toFixed(0)}</b><span>FPS</span></div>
            <div><b>{latency.toFixed(0)}ms</b><span>Latency</span></div>
          </div>
          {hands.map((hand, index) => (
            <p key={`${hand.handedness}-${index}`}>
              {hand.handedness}: {(hand.score * 100).toFixed(0)}%
            </p>
          ))}
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            {(["Right", "Left"] as const).map((side) => (
              <button key={side} type="button" className={selected === side ? "cv-btn-primary" : "cv-btn"} onClick={() => setSelected(side)}>
                {side}
              </button>
            ))}
          </div>
          <label>Max hands
            <select value={maxHands} onChange={(event) => {
              setMaxHands(Number(event.target.value));
              landmarkerRef.current?.close();
              landmarkerRef.current = null;
            }}>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
          </label>
          <label><input type="checkbox" checked={showLandmarks} onChange={(event) => setShowLandmarks(event.target.checked)} /> Landmarks</label>
          <label><input type="checkbox" checked={showConnections} onChange={(event) => setShowConnections(event.target.checked)} /> Connections</label>
          <h3>Finger states</h3>
          <table className="cv-table">
            <tbody>
              {fingers.map((finger) => (
                <tr key={finger.name}><td>{finger.name}</td><td>{finger.open ? "Open" : "Closed"}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Coordinates ({active?.handedness ?? "—"})</h3>
          <div style={{ maxHeight: 220, overflow: "auto" }}>
            <table className="cv-table">
              <thead><tr><th>#</th><th>X</th><th>Y</th><th>Z</th></tr></thead>
              <tbody>
                {(active?.landmarks ?? []).map((point, index) => (
                  <tr key={index}>
                    <td>{index}</td>
                    <td>{point.x.toFixed(3)}</td>
                    <td>{point.y.toFixed(3)}</td>
                    <td>{point.z.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </VisionPageShell>
  );
}
