import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ObjectDetector } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { TrackingOverlay } from "../components/TrackingOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createObjectDetector, formatVisionError } from "../runtime/mediapipeRuntime";
import { ObjectTracker, directionLabel, speedPxPerSec, type Track } from "../tracker/ObjectTracker";
import { mapDetections } from "../tracker/mapDetections";

type InputMode = "camera" | "video";

export default function ObjectTrackingPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const detectorRef = useRef<ObjectDetector | null>(null);
  const trackerRef = useRef(new ObjectTracker());
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });

  const [mode, setMode] = useState<InputMode>("camera");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Start the camera. IDs come from IoU association, not per-frame detection index.");
  const [threshold, setThreshold] = useState(0.4);
  const [iou, setIou] = useState(0.3);
  const [maxMiss, setMaxMiss] = useState(12);
  const [trail, setTrail] = useState(24);
  const [classFilter, setClassFilter] = useState("all");
  const [showIds, setShowIds] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showVelocity, setShowVelocity] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => () => {
    detectorRef.current?.close();
    detectorRef.current = null;
  }, []);

  useEffect(() => {
    trackerRef.current.setOptions({ iouThreshold: iou, maxMisses: maxMiss, trailLength: trail });
  }, [iou, maxMiss, trail]);

  const ensure = async () => {
    if (detectorRef.current) return detectorRef.current;
    setStatus("Loading EfficientDet Lite…");
    detectorRef.current = await createObjectDetector(12, threshold);
    setStatus("Detector + centroid/IoU tracker ready.");
    return detectorRef.current;
  };

  const live = (mode === "camera" && camera.status === "live" && !paused) || (mode === "video" && !paused);
  useRafLoop(live, async (now) => {
    const source = mode === "video" ? fileVideoRef.current : camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const detector = await ensure();
      const started = performance.now();
      const dets = mapDetections(detector.detectForVideo(source, now), threshold, 12);
      const next = trackerRef.current.update(dets, now);
      if (now - lastUi.current > 90) {
        lastUi.current = now;
        setTracks(next);
        setLatency(performance.now() - started);
        setSize({ w: source.videoWidth || 640, h: source.videoHeight || 360 });
        fpsRef.current.frames += 1;
        if (now - fpsRef.current.stamp > 500) {
          setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
          fpsRef.current = { frames: 0, stamp: now };
        }
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "Tracking failed."));
    }
  });

  const labels = Array.from(new Set(tracks.map((track) => track.label))).sort();
  const visible = tracks.filter((track) => classFilter === "all" || track.label === classFilter);

  return (
    <VisionPageShell pathname={pathname} kicker="Persistent track IDs from detection + IoU matching. Speeds are pixels/sec, not calibrated km/h.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => {
              if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
              setVideoUrl(null);
              setMode("camera");
              trackerRef.current.reset();
              setTracks([]);
              void camera.start();
            }}>Live camera</button>
            <label className="cv-btn">Video
              <input type="file" accept="video/*" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                camera.stop();
                if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
                setVideoUrl(URL.createObjectURL(file));
                setMode("video");
                trackerRef.current.reset();
                setTracks([]);
              }} />
            </label>
            <button type="button" onClick={() => { trackerRef.current.reset(); setTracks([]); }}>Reset IDs</button>
          </div>
          {mode === "video" && videoUrl ? (
            <div className="cv-camera">
              <video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay />
              <TrackingOverlay tracks={tracks} width={size.w} height={size.h} showIds={showIds} showTrails={showTrails} showVelocity={showVelocity} classFilter={classFilter} />
            </div>
          ) : (
            <VisionCamera
              videoRef={camera.videoRef}
              status={camera.status}
              permission={camera.permission}
              error={camera.error}
              mirror={camera.mirror}
              onStart={() => void camera.start()}
              onStop={() => { camera.stop(); trackerRef.current.reset(); setTracks([]); }}
              onToggleMirror={() => camera.setMirror((value) => !value)}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span>{tracks.length ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              <TrackingOverlay tracks={tracks} width={size.w} height={size.h} showIds={showIds} showTrails={showTrails} showVelocity={showVelocity} classFilter={classFilter} />
            </VisionCamera>
          )}
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Tracker</h2>
          <div className="cv-metrics">
            <div><b>{visible.filter((track) => track.status === "active").length}</b><span>Active</span></div>
            <div><b>{visible.filter((track) => track.status === "lost").length}</b><span>Lost</span></div>
            <div><b>{latency ? `${latency.toFixed(0)}ms` : "—"}</b><span>Latency</span></div>
          </div>
          <label>Confidence {threshold.toFixed(2)}<input type="range" min={0.15} max={0.85} step={0.05} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
          <label>IoU {iou.toFixed(2)}<input type="range" min={0.1} max={0.8} step={0.05} value={iou} onChange={(event) => setIou(Number(event.target.value))} /></label>
          <label>Max missing frames {maxMiss}<input type="range" min={3} max={40} value={maxMiss} onChange={(event) => setMaxMiss(Number(event.target.value))} /></label>
          <label>Trail length {trail}<input type="range" min={4} max={60} value={trail} onChange={(event) => setTrail(Number(event.target.value))} /></label>
          <label>Class
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All classes</option>
              {labels.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <div className="cv-toggles">
            <label><input type="checkbox" checked={showIds} onChange={(event) => setShowIds(event.target.checked)} /> IDs</label>
            <label><input type="checkbox" checked={showTrails} onChange={(event) => setShowTrails(event.target.checked)} /> Trails</label>
            <label><input type="checkbox" checked={showVelocity} onChange={(event) => setShowVelocity(event.target.checked)} /> Velocity</label>
          </div>
        </aside>
        <section className="cv-panel cv-pose-table">
          <h2>Tracks</h2>
          <table className="cv-table">
            <thead><tr><th>ID</th><th>Class</th><th>Conf</th><th>Duration</th><th>Path px</th><th>Last seen</th><th>Status</th></tr></thead>
            <tbody>
              {visible.map((track) => (
                <tr key={track.id}>
                  <td>{track.id}</td>
                  <td>{track.label}</td>
                  <td>{track.score.toFixed(2)}</td>
                  <td>{((track.lastSeen - track.born) / 1000).toFixed(1)}s</td>
                  <td>{track.pathPx.toFixed(0)}</td>
                  <td>{((performance.now() - track.lastSeen) / 1000).toFixed(1)}s ago</td>
                  <td>{track.status} · {speedPxPerSec(track).toFixed(0)} px/s {directionLabel(track)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </VisionPageShell>
  );
}
