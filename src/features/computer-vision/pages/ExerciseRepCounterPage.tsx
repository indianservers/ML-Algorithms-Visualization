import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { PoseOverlay } from "../components/PoseOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createPoseLandmarker, formatVisionError } from "../runtime/mediapipeRuntime";
import { DEFAULT_REP_SESSION_ID, loadRepSession, saveRepSession } from "../storage/visionProjectStore";
import { emaPoints, meanVisibility, poseJointAngles, type Xyz } from "../utils/landmarkGeometry";
import {
  blankMachine,
  EXERCISE_META,
  primaryAngle,
  tickExercise,
  type ExerciseId,
  type MachineState,
  type RepRecord,
} from "../utils/repMachines";
import type { LandmarkPoint } from "../types";

type Mode = "camera" | "image" | "video";

function mapPose(result: Awaited<ReturnType<PoseLandmarker["detect"]>>) {
  const pose = result.landmarks[0] ?? [];
  return pose.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, visibility: point.visibility ?? 1 }));
}

export default function ExerciseRepCounterPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const machineRef = useRef<MachineState>(blankMachine());
  const sessionStart = useRef<number | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const smoothRef = useRef<Xyz[] | null>(null);

  const [exercise, setExercise] = useState<ExerciseId>("squat");
  const [mode, setMode] = useState<Mode>("camera");
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Pick an exercise, then start the camera. Reps count from pose geometry, not a timer.");
  const [phase, setPhase] = useState("idle");
  const [reps, setReps] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [angle, setAngle] = useState<number | null>(null);
  const [history, setHistory] = useState<RepRecord[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    void loadRepSession().then((saved) => {
      if (saved?.reps.length) setHistory(saved.reps);
    });
    return () => {
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus("Loading MediaPipe Pose Landmarker…");
    landmarkerRef.current = await createPoseLandmarker(false);
    setStatus("Pose ready. Move through a full cycle to count a rep.");
    return landmarkerRef.current;
  };

  const resetMachine = () => {
    machineRef.current = blankMachine();
    sessionStart.current = null;
    setPhase("idle");
    setReps(0);
    setElapsed(0);
    setNotes([]);
  };

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const landmarker = await ensure();
      const started = performance.now();
      const points = emaPoints(smoothRef.current, mapPose(landmarker.detectForVideo(source, now)), 0.4);
      smoothRef.current = points;
      if (!sessionStart.current) sessionStart.current = now;
      const record = tickExercise(exercise, machineRef.current, points, now);
      if (record) {
        setHistory((current) => {
          const next = [...current, record].slice(-40);
          void saveRepSession({ id: DEFAULT_REP_SESSION_ID, exercise, updatedAt: Date.now(), reps: next });
          return next;
        });
        setNotes(record.notes);
      }
      if (now - lastUi.current > 90) {
        lastUi.current = now;
        setLandmarks(points as LandmarkPoint[]);
        setPhase(machineRef.current.phase);
        setReps(machineRef.current.reps);
        setAngle(primaryAngle(exercise, points));
        setElapsed(sessionStart.current ? now - sessionStart.current : 0);
        setLatency(performance.now() - started);
        setSize({ w: source.videoWidth || 640, h: source.videoHeight || 360 });
        fpsRef.current.frames += 1;
        if (now - fpsRef.current.stamp > 500) {
          setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
          fpsRef.current = { frames: 0, stamp: now };
        }
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "Rep tracking failed."));
    }
  });

  const tempo = history.length >= 2
    ? (history[history.length - 1]!.at - history[history.length - 2]!.at) / 1000
    : null;
  const detectStill = async (file: File) => {
    const url = URL.createObjectURL(file);
    setMode("image");
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      const landmarker = await ensure();
      await landmarker.setOptions({ runningMode: "IMAGE" });
      const points = emaPoints(null, mapPose(landmarker.detect(image)), 1);
      await landmarker.setOptions({ runningMode: "VIDEO" });
      lastUi.current = 0;
      setLandmarks(points as LandmarkPoint[]);
      setAngle(primaryAngle(exercise, points));
      setSize({ w: image.width, h: image.height });
      setStatus("Still image: pose is measured, but reps only count on live or video cycles.");
    };
    image.src = url;
  };

  const highlight = exercise === "curl" || exercise === "pushup" ? [13, 14, 11, 12, 15, 16] : [23, 24, 25, 26, 27, 28];
  const overlay = (
    <PoseOverlay
      landmarks={landmarks}
      width={size.w}
      height={size.h}
      showSkeleton
      showLabels
      highlights={highlight}
      angles={poseJointAngles(landmarks).filter((item) => highlight.includes(item.b) && item.deg != null)}
    />
  );

  return (
    <VisionPageShell pathname={pathname} kicker="Count reps from pose cycles with hysteresis. Form notes are geometric, not medical advice.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            {(Object.keys(EXERCISE_META) as ExerciseId[]).map((id) => (
              <button key={id} type="button" className={exercise === id ? "cv-btn-primary" : "cv-btn"} onClick={() => { setExercise(id); resetMachine(); }}>{EXERCISE_META[id].label}</button>
            ))}
          </div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void detectStill(file);
            }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setVideoUrl(URL.createObjectURL(file));
              setMode("video");
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
              extra={<><span>{landmarks.length ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{EXERCISE_META[exercise].label} · stage {phase} · {reps} reps</p>
          <p>{status}</p>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Session</h2>
            <div className="cv-metrics">
              <div><b>{reps}</b><span>Reps</span></div>
              <div><b>{setNo}</b><span>Set</span></div>
              <div><b>{elapsed ? `${(elapsed / 1000).toFixed(0)}s` : "—"}</b><span>Elapsed</span></div>
              <div><b>{phase}</b><span>Stage</span></div>
              <div><b>{angle == null ? "—" : `${angle.toFixed(0)}°`}</b><span>{EXERCISE_META[exercise].metric}</span></div>
              <div><b>{tempo == null ? "—" : `${tempo.toFixed(1)}s`}</b><span>Tempo</span></div>
            </div>
            <p>Pose visibility {landmarks.length ? meanVisibility(landmarks, highlight).toFixed(2) : "—"} on the joints used by this exercise.</p>
            <div className="cv-class-actions">
              <button type="button" onClick={resetMachine}>Reset reps</button>
              <button type="button" onClick={() => { setSetNo((value) => value + 1); resetMachine(); }}>New set</button>
              <button type="button" onClick={() => { setHistory([]); void saveRepSession({ id: DEFAULT_REP_SESSION_ID, exercise, updatedAt: Date.now(), reps: [] }); }}>Clear history</button>
            </div>
            {notes.map((note) => <p key={note} className="cv-warn">{note}</p>)}
          </article>
        </aside>
        <section className="cv-panel cv-pose-table">
          <h2>Completed reps</h2>
          <table className="cv-table">
            <thead><tr><th>#</th><th>Duration</th><th>Min</th><th>Max</th><th>Notes</th></tr></thead>
            <tbody>
              {history.map((item) => (
                <tr key={`${item.n}-${item.at}`}>
                  <td>{item.n}</td>
                  <td>{(item.durationMs / 1000).toFixed(2)}s</td>
                  <td>{item.minAngle.toFixed(0)}</td>
                  <td>{item.maxAngle.toFixed(0)}</td>
                  <td>{item.notes.join("; ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </VisionPageShell>
  );
}
