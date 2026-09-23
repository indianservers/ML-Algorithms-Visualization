import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { GestureRecognizer } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { LandmarkOverlay } from "../components/LandmarkOverlay";
import { ConfidenceBars } from "../components/ConfidenceBars";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createGestureRecognizer, formatVisionError } from "../runtime/mediapipeRuntime";
import type { GestureHit, TrackedHand } from "../types";

const BUILTIN = ["Closed_Fist", "Open_Palm", "Pointing_Up", "Thumb_Down", "Thumb_Up", "Victory", "ILoveYou"];

function pretty(name: string) {
  return name.replaceAll("_", " ");
}

export default function HandGesturePage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [scores, setScores] = useState(BUILTIN.map((name) => ({ name: pretty(name), value: 0 })));
  const [current, setCurrent] = useState<GestureHit | null>(null);
  const [history, setHistory] = useState<GestureHit[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to load MediaPipe Gesture Recognizer.");
  const [debounceMs, setDebounceMs] = useState(280);
  const lastName = useRef("");
  const lastEmit = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const lastUi = useRef(0);

  useEffect(() => () => {
    recognizerRef.current?.close();
    recognizerRef.current = null;
  }, []);

  const ensure = async () => {
    if (recognizerRef.current) return recognizerRef.current;
    setStatus("Loading MediaPipe Gesture Recognizer…");
    recognizerRef.current = await createGestureRecognizer(2);
    setStatus("Gesture recognizer ready.");
    return recognizerRef.current;
  };

  useRafLoop(camera.status === "live", (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    void (async () => {
      try {
        const recognizer = await ensure();
        const started = performance.now();
        const result = recognizer.recognizeForVideo(video, now);
        const tracked: TrackedHand[] = (result.landmarks ?? []).map((points, index) => ({
          handedness: (result.handedness[index]?.[0]?.categoryName === "Left" ? "Left" : "Right") as "Left" | "Right",
          score: result.handedness[index]?.[0]?.score ?? 0,
          landmarks: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
          worldLandmarks: [],
        }));
        const gestures = result.gestures[0] ?? [];
        const top = gestures[0];
        const alternatives = gestures.map((item) => ({ name: pretty(item.categoryName), score: item.score }));
        const hit: GestureHit | null = top
          ? {
              name: pretty(top.categoryName),
              score: top.score,
              handedness: tracked[0]?.handedness ?? "Right",
              alternatives,
              at: Date.now(),
            }
          : null;
        if (now - lastUi.current > 80) {
          lastUi.current = now;
          setHands(tracked);
          setScores(BUILTIN.map((name) => ({
            name: pretty(name),
            value: gestures.find((item) => item.categoryName === name)?.score ?? 0,
          })));
          setCurrent(hit);
          setLatency(performance.now() - started);
          setSize({ w: video.videoWidth || 640, h: video.videoHeight || 360 });
          fpsRef.current.frames += 1;
          if (now - fpsRef.current.stamp > 500) {
            setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
            fpsRef.current = { frames: 0, stamp: now };
          }
          if (hit && hit.name !== lastName.current && now - lastEmit.current > debounceMs) {
            lastName.current = hit.name;
            lastEmit.current = now;
            setHistory((currentLog) => [hit, ...currentLog].slice(0, 12));
          }
        }
      } catch (caught) {
        setStatus(formatVisionError(caught, "Gesture recognition failed."));
      }
    })();
  });

  return (
    <VisionPageShell pathname={pathname} kicker="Recognize built-in MediaPipe hand gestures in real time.">
      <div className="cv-gesture-layout">
        <div>
          <VisionCamera
              videoRef={camera.videoRef}
              status={camera.status}
              permission={camera.permission}
              error={camera.error}
              mirror={camera.mirror}
              onStart={() => void camera.start()}
              onStop={() => { camera.stop(); setHands([]); setCurrent(null); }}
              onToggleMirror={() => camera.setMirror((value) => !value)}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => {
                camera.setDeviceId(id);
                void camera.start(id);
              }}
              extra={<span>{fps.toFixed(0)} FPS</span>}
            >
              <LandmarkOverlay hands={hands} width={size.w} height={size.h} showLandmarks showConnections />
            </VisionCamera>
          <p>{status}</p>
          <section className="cv-panel" style={{ marginTop: 10 }}>
            <h3>Recent gestures</h3>
            <table className="cv-table">
              <thead><tr><th>Gesture</th><th>Conf</th><th>Hand</th><th>Time</th></tr></thead>
              <tbody>
                {history.map((item) => (
                  <tr key={`${item.at}-${item.name}`}>
                    <td>{item.name}</td>
                    <td>{(item.score * 100).toFixed(0)}%</td>
                    <td>{item.handedness}</td>
                    <td>{new Date(item.at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Recognition</h2>
            <p>{current ? `${current.name} · ${(current.score * 100).toFixed(0)}% · ${current.handedness}` : "No gesture yet"}</p>
            <p>{fps.toFixed(0)} FPS · {latency.toFixed(0)} ms</p>
            <label>Debounce {debounceMs}ms
              <input type="range" min={80} max={800} value={debounceMs} onChange={(event) => setDebounceMs(Number(event.target.value))} />
            </label>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h3>Gesture probabilities</h3>
            <ConfidenceBars rows={scores} />
          </article>
        </aside>
      </div>
    </VisionPageShell>
  );
}
