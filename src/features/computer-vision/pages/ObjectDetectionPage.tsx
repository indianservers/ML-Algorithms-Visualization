import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { DetectionOverlay } from "../components/DetectionOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { useVisionTask } from "../hooks/useVisionTask";
import { createObjectDetector, formatVisionError } from "../runtime/mediapipeRuntime";
import { CLASS_COLORS, type DetectionHit } from "../types";
import type { ObjectDetector } from "@mediapipe/tasks-vision";

export default function ObjectDetectionPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const [threshold, setThreshold] = useState(0.35);
  const [maxDetections, setMaxDetections] = useState(8);
  const [showLabels, setShowLabels] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState("Start the camera to load EfficientDet Lite.");
  const [hits, setHits] = useState<DetectionHit[]>([]);
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [classFilter, setClassFilter] = useState("all");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const lastUi = useRef(0);
  const { taskRef: detectorRef, ensure } = useVisionTask(() => createObjectDetector(maxDetections, threshold));

  useEffect(() => {
    void detectorRef.current?.setOptions({ scoreThreshold: threshold, maxResults: maxDetections });
  }, [detectorRef, threshold, maxDetections]);

  const labels = useMemo(() => Array.from(new Set(hits.map((hit) => hit.label))).sort(), [hits]);

  const ensureDetector = async () => {
    if (detectorRef.current) return detectorRef.current;
    setStatus("Loading MediaPipe EfficientDet Lite…");
    const detector = await ensure();
    setStatus("Detector ready.");
    return detector;
  };

  const clearImage = () => {
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
  };

  useRafLoop(camera.status === "live" && !paused && !imageUrl, (now) => {
    const video = camera.videoRef.current;
    if (!video || video.readyState < 2) return;
    void (async () => {
      try {
        const detector = await ensureDetector();
        const started = performance.now();
        const result = detector.detectForVideo(video, now);
        const next: DetectionHit[] = (result.detections ?? []).map((item, index) => {
          const category = item.categories[0];
          const box = item.boundingBox;
          return {
            id: `${index}-${category?.categoryName ?? "obj"}`,
            label: category?.categoryName ?? "object",
            score: category?.score ?? 0,
            box: {
              x: box?.originX ?? 0,
              y: box?.originY ?? 0,
              w: box?.width ?? 0,
              h: box?.height ?? 0,
            },
            color: CLASS_COLORS[index % CLASS_COLORS.length],
          };
        }).filter((item) => item.score >= threshold)
          .filter((item) => classFilter === "all" || item.label === classFilter)
          .slice(0, maxDetections);
        fpsRef.current.frames += 1;
        if (now - lastUi.current > 100) {
          lastUi.current = now;
          setHits(next);
          setLatency(performance.now() - started);
          setSize({ w: video.videoWidth || 640, h: video.videoHeight || 360 });
          if (now - fpsRef.current.stamp > 500) {
            setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
            fpsRef.current = { frames: 0, stamp: now };
          }
        }
      } catch (caught) {
        setStatus(formatVisionError(caught, "Detection failed."));
      }
    })();
  });

  const detectImage = async (file: File) => {
    camera.stop();
    setHits([]);
    const url = URL.createObjectURL(file);
    if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      try {
        const detector = await ensureDetector();
        const started = performance.now();
        const still = await ObjectDetectorStill(detector, image);
        setHits(still);
        setLatency(performance.now() - started);
        setSize({ w: image.width, h: image.height });
        setStatus(`Detected ${still.length} object${still.length === 1 ? "" : "s"} in the uploaded image.`);
      } catch (caught) {
        setStatus(formatVisionError(caught, "Image detection failed."));
      }
    };
    image.src = url;
  };

  const visible = hits.filter((hit) => classFilter === "all" || hit.label === classFilter);
  const counts = visible.reduce<Record<string, number>>((acc, hit) => {
    acc[hit.label] = (acc[hit.label] ?? 0) + 1;
    return acc;
  }, {});

  const overlay = (
    <DetectionOverlay
      detections={visible}
      width={size.w}
      height={size.h}
      showLabels={showLabels}
      showConfidence={showConfidence}
    />
  );

  return (
    <VisionPageShell pathname={pathname} kicker="Detect and localize objects in real time.">
      <div className="cv-detect-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={!imageUrl ? "cv-btn-primary" : "cv-btn"} onClick={() => {
              setHits([]);
              clearImage();
              void camera.start();
            }}>
              Live camera
            </button>
            <label className="cv-btn">
              Upload image
              <input type="file" accept="image/*" hidden onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void detectImage(file);
              }} />
            </label>
          </div>
          {imageUrl ? (
            <div className="cv-camera">
              <img src={imageUrl} alt="Uploaded frame" />
              {overlay}
            </div>
          ) : (
            <VisionCamera
              videoRef={camera.videoRef}
              status={camera.status}
              permission={camera.permission}
              error={camera.error}
              mirror={false}
              onStart={() => void camera.start()}
              onStop={() => { camera.stop(); setHits([]); }}
              onSnapshot={() => {
                const frame = camera.snapshot();
                if (!frame) return;
                camera.stop();
                const url = frame.toDataURL("image/jpeg", 0.92);
                setImageUrl(url);
                const image = new Image();
                image.onload = async () => {
                  try {
                    const detector = await ensureDetector();
                    const started = performance.now();
                    const still = await ObjectDetectorStill(detector, image);
                    setHits(still);
                    setLatency(performance.now() - started);
                    setSize({ w: image.width, h: image.height });
                    setStatus(`Snapshot: ${still.length} object${still.length === 1 ? "" : "s"}.`);
                  } catch (caught) {
                    setStatus(formatVisionError(caught, "Snapshot detection failed."));
                  }
                };
                image.src = url;
              }}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => {
                camera.setDeviceId(id);
                void camera.start(id);
              }}
              extra={
                <>
                  <span className="cv-live">{fps.toFixed(0)} FPS</span>
                  <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
                </>
              }
            >
              {overlay}
            </VisionCamera>
          )}
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Detections</h2>
          <p>{visible.length} boxes · {latency.toFixed(0)} ms</p>
          <table className="cv-table">
            <thead>
              <tr><th>#</th><th>Class</th><th>Conf</th><th>Count</th></tr>
            </thead>
            <tbody>
              {Object.entries(counts).map(([label, count], index) => {
                const best = visible.find((hit) => hit.label === label);
                return (
                  <tr key={label}>
                    <td>{index + 1}</td>
                    <td>{label}</td>
                    <td>{best ? best.score.toFixed(2) : "—"}</td>
                    <td>{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <label>Confidence {threshold.toFixed(2)}
            <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
          </label>
          <label>Max detections
            <input type="number" min={1} max={25} value={maxDetections} onChange={(event) => setMaxDetections(Number(event.target.value))} />
          </label>
          <label>Class filter
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All classes</option>
              {labels.map((label) => <option key={label} value={label}>{label}</option>)}
            </select>
          </label>
          <label>
            <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
            Show labels
          </label>
          <label>
            <input type="checkbox" checked={showConfidence} onChange={(event) => setShowConfidence(event.target.checked)} />
            Show confidence
          </label>
        </aside>
      </div>
    </VisionPageShell>
  );
}

async function ObjectDetectorStill(detector: ObjectDetector, image: HTMLImageElement): Promise<DetectionHit[]> {
  await detector.setOptions({ runningMode: "IMAGE" });
  const result = detector.detect(image);
  await detector.setOptions({ runningMode: "VIDEO" });
  return (result.detections ?? []).map((item, index) => {
    const category = item.categories[0];
    const box = item.boundingBox;
    return {
      id: `img-${index}`,
      label: category?.categoryName ?? "object",
      score: category?.score ?? 0,
      box: {
        x: box?.originX ?? 0,
        y: box?.originY ?? 0,
        w: box?.width ?? 0,
        h: box?.height ?? 0,
      },
      color: CLASS_COLORS[index % CLASS_COLORS.length],
    };
  });
}
