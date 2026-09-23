import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { FaceMeshOverlay, type FaceMeshGroupId } from "../components/FaceMeshOverlay";
import { HeadAxes } from "../components/Skeleton3D";
import { ConfidenceBars } from "../components/ConfidenceBars";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createFaceLandmarker, formatVisionError, keepVisionStatus } from "../runtime/mediapipeRuntime";
import { emaPoints, poseFromMatrix, type Xyz } from "../utils/landmarkGeometry";
import type { LandmarkPoint } from "../types";

type Mode = "camera" | "image" | "video";

const DEFAULT_GROUPS: Record<FaceMeshGroupId, boolean> = {
  tesselation: true,
  landmarks: false,
  contours: true,
  oval: true,
  leftEye: true,
  rightEye: true,
  leftBrow: true,
  rightBrow: true,
  leftIris: true,
  rightIris: true,
  lips: true,
};

function blendRows(categories: Array<{ categoryName?: string; displayName?: string; score: number }>) {
  return [...categories]
    .filter((item) => item.categoryName || item.displayName)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => ({
      name: item.categoryName || item.displayName || "blendshape",
      value: item.score,
    }));
}

export default function FaceMeshPage() {
  const { pathname } = useLocation();
  const camera = useCamera();
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const smoothRef = useRef<Xyz[] | null>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [groups, setGroups] = useState(DEFAULT_GROUPS);
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [blendshapes, setBlendshapes] = useState<Array<{ name: string; value: number }>>([]);
  const [pose, setPose] = useState<{ yaw: number; pitch: number; roll: number } | null>(null);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera to load MediaPipe Face Landmarker.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [smoothing, setSmoothing] = useState(0.4);
  const [numFaces, setNumFaces] = useState(1);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  const ensure = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setStatus((current) => keepVisionStatus(current, "Loading MediaPipe Face Landmarker…"));
    landmarkerRef.current = await createFaceLandmarker(numFaces);
    setStatus("Face landmarker ready. Head pose is estimated from the facial transform matrix.");
    return landmarkerRef.current;
  };

  const publish = (points: LandmarkPoint[], blends: Array<{ name: string; value: number }>, nextPose: { yaw: number; pitch: number; roll: number } | null, w: number, h: number, ms: number, now: number) => {
    const smoothed = emaPoints(smoothRef.current, points, 1 - smoothing);
    smoothRef.current = smoothed;
    if (now - lastUi.current > 80) {
      lastUi.current = now;
      setLandmarks(smoothed as LandmarkPoint[]);
      setBlendshapes(blends);
      setPose(nextPose);
      setLatency(ms);
      setSize({ w, h });
      fpsRef.current.frames += 1;
      if (now - fpsRef.current.stamp > 500) {
        setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
        fpsRef.current = { frames: 0, stamp: now };
      }
    }
  };

  const fromResult = (result: Awaited<ReturnType<FaceLandmarker["detect"]>>) => {
    const face = result.faceLandmarks[0] ?? [];
    const points = face.map((point) => ({ x: point.x, y: point.y, z: point.z ?? 0 }));
    const blends = blendRows(result.faceBlendshapes[0]?.categories ?? []);
    const matrix = result.facialTransformationMatrixes[0];
    const nextPose = poseFromMatrix(matrix?.data ?? (matrix as { packedData?: number[] } | undefined)?.packedData);
    return { points, blends, nextPose };
  };

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const landmarker = await ensure();
      const started = performance.now();
      const result = landmarker.detectForVideo(source, now);
      const parsed = fromResult(result);
      publish(parsed.points, parsed.blends, parsed.nextPose, source.videoWidth || 640, source.videoHeight || 360, performance.now() - started, now);
    } catch (caught) {
      setStatus(formatVisionError(caught, "Face mesh failed."));
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
      const result = landmarker.detect(image);
      await landmarker.setOptions({ runningMode: "VIDEO" });
      lastUi.current = 0;
      const parsed = fromResult(result);
      publish(parsed.points, parsed.blends, parsed.nextPose, image.width, image.height, performance.now() - started, performance.now());
    };
    image.src = url;
  };

  const overlay = <FaceMeshOverlay landmarks={landmarks} width={size.w} height={size.h} groups={groups} />;
  const counts = useMemo(() => ({
    points: landmarks.length,
    tesselation: groups.tesselation,
  }), [landmarks.length, groups.tesselation]);

  return (
    <VisionPageShell pathname={pathname} kicker="Dense facial landmarks, mesh, and estimated head pose in the browser.">
      <div className="cv-mesh-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} /></label>
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
              extra={<><span>{fps.toFixed(0)} FPS</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{status}</p>
          <div className="cv-toggles">
            {(Object.keys(DEFAULT_GROUPS) as FaceMeshGroupId[]).map((key) => (
              <label key={key}>
                <input type="checkbox" checked={groups[key]} onChange={(event) => setGroups((current) => ({ ...current, [key]: event.target.checked }))} />
                {{
                  tesselation: "Full Mesh",
                  landmarks: "Landmarks",
                  contours: "Contours",
                  oval: "Face Oval",
                  leftEye: "Left Eye",
                  rightEye: "Right Eye",
                  leftBrow: "Left Brow",
                  rightBrow: "Right Brow",
                  leftIris: "Left Iris",
                  rightIris: "Right Iris",
                  lips: "Lips",
                }[key]}
              </label>
            ))}
          </div>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Head pose</h2>
            <p title="Estimated from the Face Landmarker transformation matrix, not an IMU.">Estimate from facial landmarks</p>
            {pose ? <HeadAxes yaw={pose.yaw} pitch={pose.pitch} roll={pose.roll} /> : <p>Waiting for a face transform.</p>}
            <div className="cv-metrics">
              <div><b>{pose ? `${pose.yaw.toFixed(1)}°` : "—"}</b><span>Yaw</span></div>
              <div><b>{pose ? `${pose.pitch.toFixed(1)}°` : "—"}</b><span>Pitch</span></div>
              <div><b>{pose ? `${pose.roll.toFixed(1)}°` : "—"}</b><span>Roll</span></div>
            </div>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Live output</h2>
            <p>{counts.points} landmarks · {fps.toFixed(0)} FPS · {latency.toFixed(0)} ms</p>
            <label>Smoothing {smoothing.toFixed(2)}
              <input type="range" min={0} max={0.85} step={0.05} value={smoothing} onChange={(event) => setSmoothing(Number(event.target.value))} />
            </label>
            <label>Faces
              <select value={numFaces} onChange={(event) => {
                setNumFaces(Number(event.target.value));
                landmarkerRef.current?.close();
                landmarkerRef.current = null;
              }}>
                <option value={1}>1</option>
                <option value={2}>2</option>
              </select>
            </label>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h3>Blendshapes from MediaPipe</h3>
            <ConfidenceBars rows={blendshapes} />
          </article>
        </aside>
      </div>
    </VisionPageShell>
  );
}
