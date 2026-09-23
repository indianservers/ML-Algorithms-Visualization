import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FaceLandmarker, GestureRecognizer, PoseLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { FaceMeshOverlay } from "../components/FaceMeshOverlay";
import { LandmarkOverlay } from "../components/LandmarkOverlay";
import { PoseOverlay } from "../components/PoseOverlay";
import { Skeleton3D } from "../components/Skeleton3D";
import { HeadAxes } from "../components/Skeleton3D";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createFaceLandmarker, createGestureRecognizer, createPoseLandmarker, formatVisionError, HAND_CONNECTIONS, POSE_CONNECTIONS } from "../runtime/mediapipeRuntime";
import { emaPoints, poseFromMatrix, poseJointAngles, type Xyz } from "../utils/landmarkGeometry";
import type { LandmarkPoint, TrackedHand } from "../types";

type Mode = "camera" | "image" | "video";
type View = "front" | "side" | "top";

function pretty(name: string) {
  return name.replaceAll("_", " ");
}

export default function HolisticBodyTrackerPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const faceRef = useRef<FaceLandmarker | null>(null);
  const poseRef = useRef<PoseLandmarker | null>(null);
  const gestureRef = useRef<GestureRecognizer | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const smoothPose = useRef<Xyz[] | null>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [face, setFace] = useState<LandmarkPoint[]>([]);
  const [pose, setPose] = useState<LandmarkPoint[]>([]);
  const [world, setWorld] = useState<Xyz[]>([]);
  const [hands, setHands] = useState<TrackedHand[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [head, setHead] = useState<{ yaw: number; pitch: number; roll: number } | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("This lab combines Face Landmarker + Gesture Recognizer + Pose Landmarker on one frame. It is not a single Holistic MediaPipe task.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showFace, setShowFace] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [showPose, setShowPose] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [view, setView] = useState<View>("front");
  const [yaw, setYaw] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => () => {
    aliveRef.current = false;
    faceRef.current?.close();
    poseRef.current?.close();
    gestureRef.current?.close();
    faceRef.current = null;
    poseRef.current = null;
    gestureRef.current = null;
  }, []);

  const ensure = async () => {
    if (!faceRef.current) {
      setStatus("Loading face, pose, and gesture models…");
      const face = await createFaceLandmarker(1);
      if (!aliveRef.current) { face.close(); throw new Error("Lab unmounted"); }
      faceRef.current = face;
    }
    if (!poseRef.current) {
      const pose = await createPoseLandmarker(false);
      if (!aliveRef.current) { pose.close(); throw new Error("Lab unmounted"); }
      poseRef.current = pose;
    }
    if (!gestureRef.current) {
      const gesture = await createGestureRecognizer(2);
      if (!aliveRef.current) { gesture.close(); throw new Error("Lab unmounted"); }
      gestureRef.current = gesture;
    }
    setStatus("Combined Face + Hands/Gestures + Pose pipeline ready. 3D mixes pose world landmarks with hand world landmarks at the wrists.");
    return { face: faceRef.current, pose: poseRef.current, gesture: gestureRef.current };
  };

  const ingest = (
    faceResult: Awaited<ReturnType<FaceLandmarker["detect"]>>,
    poseResult: Awaited<ReturnType<PoseLandmarker["detect"]>>,
    gestureResult: Awaited<ReturnType<GestureRecognizer["recognize"]>>,
    w: number,
    h: number,
    ms: number,
    now: number,
  ) => {
    const facePts = (faceResult.faceLandmarks[0] ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 }));
    const posePts = (poseResult.landmarks[0] ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0, visibility: point.visibility ?? 1 }));
    const worldPts = (poseResult.worldLandmarks[0] ?? posePts).map((point, index) => ({
      x: point.x, y: point.y, z: point.z ?? 0, visibility: posePts[index]?.visibility ?? 1,
    }));
    const smoothed = emaPoints(smoothPose.current, posePts, 0.4);
    smoothPose.current = smoothed;
    const tracked: TrackedHand[] = (gestureResult.landmarks ?? []).map((points, index) => ({
      handedness: gestureResult.handedness[index]?.[0]?.categoryName === "Left" ? "Left" : "Right",
      score: gestureResult.handedness[index]?.[0]?.score ?? 0,
      landmarks: points.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
      worldLandmarks: (((gestureResult as { worldLandmarks?: Array<Array<{ x: number; y: number; z?: number }>> }).worldLandmarks?.[index]) ?? []).map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 })),
    }));
    const nextEvents: string[] = [];
    if (facePts.length) nextEvents.push("Face: detected");
    tracked.forEach((hand, index) => {
      const name = pretty(gestureResult.gestures[index]?.[0]?.categoryName ?? "None");
      nextEvents.push(`${hand.handedness} hand: ${name} (${(hand.score * 100).toFixed(0)}%)`);
    });
    const lk = smoothed[25];
    const rk = smoothed[26];
    const lean = Math.abs(((smoothed[11]?.x ?? 0) + (smoothed[12]?.x ?? 0)) / 2 - ((smoothed[23]?.x ?? 0) + (smoothed[24]?.x ?? 0)) / 2);
    if (lk && rk) {
      const vis = ((lk.visibility ?? 1) + (rk.visibility ?? 1)) / 2;
      if (vis > 0.4) {
        const leftKnee = poseJointAngles(smoothed).find((item) => item.id === "leftKnee")?.deg ?? null;
        const rightKnee = poseJointAngles(smoothed).find((item) => item.id === "rightKnee")?.deg ?? null;
        const knees = leftKnee != null && rightKnee != null ? (leftKnee + rightKnee) / 2 : null;
        if (knees != null && knees > 155 && lean < 0.08) nextEvents.push("Pose: standing");
        else if (knees != null && knees < 120) nextEvents.push("Pose: crouched");
        else nextEvents.push("Pose: body detected");
      }
    }
    const matrix = faceResult.facialTransformationMatrixes[0];
    const nextHead = poseFromMatrix(matrix?.data ?? (matrix as { packedData?: number[] } | undefined)?.packedData);
    if (now - lastUi.current > 90) {
      lastUi.current = now;
      setFace(facePts);
      setPose(smoothed as LandmarkPoint[]);
      setWorld(worldPts);
      setHands(tracked);
      setEvents(nextEvents);
      setHead(nextHead);
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
      const models = await ensure();
      const started = performance.now();
      ingest(models.face.detectForVideo(source, now), models.pose.detectForVideo(source, now), models.gesture.recognizeForVideo(source, now), source.videoWidth || 640, source.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Holistic pipeline failed."));
    }
  });

  const left = hands.filter((hand) => hand.handedness === "Left");
  const right = hands.filter((hand) => hand.handedness === "Right");
  const combinedWorld = useMemo(() => {
    const points = [...world];
    const connections: Array<{ start: number; end: number }> = [...POSE_CONNECTIONS];
    const place = (hand: TrackedHand | undefined, wristIndex: number) => {
      const wrist = world[wristIndex];
      if (!hand || !wrist || !hand.worldLandmarks.length) return;
      const base = points.length;
      for (const point of hand.worldLandmarks) {
        points.push({ x: wrist.x + point.x, y: wrist.y + point.y, z: (wrist.z ?? 0) + (point.z ?? 0), visibility: 1 });
      }
      for (const [a, b] of HAND_CONNECTIONS) connections.push({ start: base + a, end: base + b });
    };
    place(left[0], 15);
    place(right[0], 16);
    return { points, connections };
  }, [world, left, right]);

  const visibleHands = [
    ...(showLeft ? left : []),
    ...(showRight ? right : []),
  ];

  return (
    <VisionPageShell pathname={pathname} kicker="Face, both hands, and body on one frame via three MediaPipe Tasks — not a single Holistic model.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              setImageUrl(url);
              setMode("image");
              const image = new Image();
              image.onload = async () => {
                const models = await ensure();
                await models.face.setOptions({ runningMode: "IMAGE" });
                await models.pose.setOptions({ runningMode: "IMAGE" });
                await models.gesture.setOptions({ runningMode: "IMAGE" });
                lastUi.current = 0;
                ingest(models.face.detect(image), models.pose.detect(image), models.gesture.recognize(image), image.width, image.height, 0, performance.now());
                await models.face.setOptions({ runningMode: "VIDEO" });
                await models.pose.setOptions({ runningMode: "VIDEO" });
                await models.gesture.setOptions({ runningMode: "VIDEO" });
              };
              image.src = url;
            }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setVideoUrl(URL.createObjectURL(file));
              setMode("video");
            }} /></label>
          </div>
          {mode === "image" && imageUrl ? (
            <div className="cv-camera">
              <img src={imageUrl} alt="" />
              {showPose ? <PoseOverlay landmarks={pose} width={size.w} height={size.h} showSkeleton={showConnections} showLabels={false} /> : null}
              {showFace ? <FaceMeshOverlay landmarks={face} width={size.w} height={size.h} groups={{ tesselation: showMesh, contours: true, lips: true, leftEye: true, rightEye: true }} /> : null}
              <LandmarkOverlay hands={visibleHands} width={size.w} height={size.h} showLandmarks showConnections={showConnections} />
            </div>
          ) : mode === "video" && videoUrl ? (
            <div className="cv-camera">
              <video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay />
              {showPose ? <PoseOverlay landmarks={pose} width={size.w} height={size.h} showSkeleton={showConnections} showLabels={false} /> : null}
              {showFace ? <FaceMeshOverlay landmarks={face} width={size.w} height={size.h} groups={{ tesselation: showMesh, contours: true }} /> : null}
              <LandmarkOverlay hands={visibleHands} width={size.w} height={size.h} showLandmarks showConnections={showConnections} />
            </div>
          ) : (
            <VisionCamera
              videoRef={camera.videoRef}
              status={camera.status}
              permission={camera.permission}
              error={camera.error}
              mirror={camera.mirror}
              onStart={() => void camera.start()}
              onStop={() => { camera.stop(); setFace([]); setPose([]); setHands([]); }}
              onToggleMirror={() => camera.setMirror((value) => !value)}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span>{pose.length || face.length ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {showPose ? <PoseOverlay landmarks={pose} width={size.w} height={size.h} showSkeleton={showConnections} showLabels={false} /> : null}
              {showFace ? <FaceMeshOverlay landmarks={face} width={size.w} height={size.h} groups={{ tesselation: showMesh, contours: true, lips: true, leftEye: true, rightEye: true, leftIris: true, rightIris: true }} /> : null}
              <LandmarkOverlay hands={visibleHands} width={size.w} height={size.h} showLandmarks showConnections={showConnections} />
            </VisionCamera>
          )}
          <div className="cv-toggles">
            <label><input type="checkbox" checked={showFace} onChange={(event) => setShowFace(event.target.checked)} /> Face</label>
            <label><input type="checkbox" checked={showLeft} onChange={(event) => setShowLeft(event.target.checked)} /> Left hand</label>
            <label><input type="checkbox" checked={showRight} onChange={(event) => setShowRight(event.target.checked)} /> Right hand</label>
            <label><input type="checkbox" checked={showPose} onChange={(event) => setShowPose(event.target.checked)} /> Pose</label>
            <label><input type="checkbox" checked={showConnections} onChange={(event) => setShowConnections(event.target.checked)} /> Connections</label>
            <label><input type="checkbox" checked={showMesh} onChange={(event) => setShowMesh(event.target.checked)} /> Mesh</label>
          </div>
          <p>{status}</p>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Tracking summary</h2>
            <div className="cv-metrics">
              <div><b>{face.length || "no"}</b><span>Face pts</span></div>
              <div><b>{left[0]?.landmarks.length || "no"}</b><span>Left hand</span></div>
              <div><b>{right[0]?.landmarks.length || "no"}</b><span>Right hand</span></div>
              <div><b>{pose.length || "no"}</b><span>Pose pts</span></div>
              <div><b>{(face.length ? 1 : 0) + hands.length + (pose.length ? 1 : 0)}</b><span>Parts</span></div>
              <div><b>{latency ? `${latency.toFixed(0)}ms` : "—"}</b><span>Latency</span></div>
            </div>
            <ul className="cv-event-list">
              {events.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Combined 3D view</h2>
            <p>Visualization only. Pose world landmarks plus hand world landmarks offset to the pose wrists. Not a metric-scale reconstruction.</p>
            <div className="cv-class-actions">
              {(["front", "side", "top"] as View[]).map((item) => (
                <button key={item} type="button" className={view === item ? "cv-btn-primary" : "cv-btn"} onClick={() => setView(item)}>{item}</button>
              ))}
            </div>
            {combinedWorld.points.length ? <Skeleton3D points={combinedWorld.points} view={view} yaw={yaw} connections={combinedWorld.connections} /> : null}
            {head ? <HeadAxes yaw={head.yaw} pitch={head.pitch} roll={head.roll} /> : <p>Waiting for a face transform.</p>}
            <label>Rotate {yaw}°<input type="range" min={-180} max={180} value={yaw} onChange={(event) => setYaw(Number(event.target.value))} /></label>
          </article>
        </aside>
      </div>
    </VisionPageShell>
  );
}
