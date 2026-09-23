import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ImageSegmenter } from "@mediapipe/tasks-vision";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createImageSegmenter, formatVisionError } from "../runtime/mediapipeRuntime";
import {
  bundledBackgrounds,
  compositePerson,
  confidenceToAlpha,
  downloadCanvas,
  featherMask,
  type CompositeMode,
} from "../utils/maskRender";

type Mode = "camera" | "image" | "video";

export default function PersonBackgroundSegmentationPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: true });
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const outRef = useRef<HTMLCanvasElement | null>(null);
  const origRef = useRef<HTMLCanvasElement | null>(null);
  const fileVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });

  const [mode, setMode] = useState<Mode>("camera");
  const [effect, setEffect] = useState<CompositeMode>("blur");
  const [blur, setBlur] = useState(12);
  const [threshold, setThreshold] = useState(0.5);
  const [feather, setFeather] = useState(4);
  const [solid, setSolid] = useState("#00ff00");
  const [fps, setFps] = useState(0);
  const [latency, setLatency] = useState(0);
  const [coverage, setCoverage] = useState<number | null>(null);
  const [status, setStatus] = useState("Start the camera to load MediaPipe selfie segmenter.");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [split, setSplit] = useState(50);
  const backgrounds = bundledBackgrounds();

  useEffect(() => () => {
    segmenterRef.current?.close();
    segmenterRef.current = null;
  }, []);

  const ensure = async () => {
    if (segmenterRef.current) return segmenterRef.current;
    setStatus("Loading MediaPipe selfie segmenter…");
    segmenterRef.current = await createImageSegmenter("selfie", false);
    setStatus("Person mask ready. Effects use the confidence mask, not a fake cutout.");
    return segmenterRef.current;
  };

  const run = (
    source: CanvasImageSource,
    conf: Float32Array,
    w: number,
    h: number,
    srcW: number,
    srcH: number,
    ms: number,
    now: number,
  ) => {
    const maskData = confidenceToAlpha(conf, w, h, threshold);
    const maskCanvas = featherMask(maskData, feather);
    const dest = outRef.current;
    const orig = origRef.current;
    if (dest) {
      compositePerson({
        source,
        width: srcW,
        height: srcH,
        maskCanvas,
        mode: effect,
        blur,
        solid,
        background: bgImageRef.current,
        dest,
      });
    }
    if (orig) {
      orig.width = srcW;
      orig.height = srcH;
      orig.getContext("2d")?.drawImage(source, 0, 0, srcW, srcH);
    }
    let on = 0;
    for (let i = 0; i < conf.length; i += 1) if ((conf[i] ?? 0) >= threshold) on += 1;
    if (now - lastUi.current > 120) {
      lastUi.current = now;
      setCoverage(conf.length ? on / conf.length : null);
      setLatency(ms);
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
      const segmenter = await ensure();
      const started = performance.now();
      const result = segmenter.segmentForVideo(source, now);
      const conf = result.confidenceMasks?.[0];
      if (conf) {
        run(source, conf.getAsFloat32Array(), conf.width, conf.height, source.videoWidth || conf.width, source.videoHeight || conf.height, performance.now() - started, now);
        result.close();
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "Person segmentation failed."));
    }
  });

  const detectStill = async (file: File) => {
    const url = URL.createObjectURL(file);
    setMode("image");
    setImageUrl(url);
    const image = new Image();
    image.onload = async () => {
      const segmenter = await ensure();
      await segmenter.setOptions({ runningMode: "IMAGE" });
      const result = segmenter.segment(image);
      const conf = result.confidenceMasks?.[0];
      if (conf) {
        lastUi.current = 0;
        run(image, conf.getAsFloat32Array(), conf.width, conf.height, image.width, image.height, 0, performance.now());
        result.close();
      }
      await segmenter.setOptions({ runningMode: "VIDEO" });
    };
    image.src = url;
  };

  const preview = (
    <div className={coverage == null ? "cv-compare is-idle" : "cv-compare"}>
      <canvas ref={origRef} className="cv-compare-base" />
      <div className="cv-compare-clip" style={{ width: `${split}%` }}>
        <canvas ref={outRef} />
      </div>
      <input type="range" min={0} max={100} value={split} onChange={(event) => setSplit(Number(event.target.value))} aria-label="Before after split" />
    </div>
  );

  return (
    <VisionPageShell pathname={pathname} kicker="Person isolation with a real selfie segmenter. Live preview is RGB; PNG capture can include alpha.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className={mode === "camera" ? "cv-btn-primary" : "cv-btn"} onClick={() => { setMode("camera"); void camera.start(); }}>Live camera</button>
            <label className="cv-btn">Image<input type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void detectStill(file); }} /></label>
            <label className="cv-btn">Video<input type="file" accept="video/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setVideoUrl(URL.createObjectURL(file)); setMode("video"); }} /></label>
          </div>
          {mode === "image" && imageUrl ? (
            <div className="cv-camera cv-camera-stack">
              <img src={imageUrl} alt="" />
              {preview}
            </div>
          ) : mode === "video" && videoUrl ? (
            <div className="cv-camera cv-camera-stack">
              <video ref={fileVideoRef} src={videoUrl} playsInline muted loop autoPlay />
              {preview}
            </div>
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
              onSnapshot={() => outRef.current && downloadCanvas(outRef.current, effect === "transparent" ? "person-alpha.png" : "person-composite.png")}
              devices={camera.devices}
              deviceId={camera.deviceId}
              onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
              extra={<><span>{coverage != null ? `${fps.toFixed(0)} FPS` : "—"}</span><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button></>}
            >
              {preview}
            </VisionCamera>
          )}
          <p>{status}</p>
        </div>
        <aside className="cv-panel">
          <h2>Background</h2>
          <div className="cv-class-actions">
            {([
              ["original", "Original"],
              ["blur", "Blur"],
              ["solid", "Solid"],
              ["transparent", "Transparent"],
              ["replace", "Replace"],
              ["green", "Green screen"],
            ] as Array<[CompositeMode, string]>).map(([id, label]) => (
              <button key={id} type="button" className={effect === id ? "cv-btn-primary" : "cv-btn"} onClick={() => { setEffect(id); if (id === "green") setSolid("#00ff00"); }}>{label}</button>
            ))}
          </div>
          <div className="cv-metrics">
            <div><b>{coverage == null ? "—" : `${(coverage * 100).toFixed(1)}%`}</b><span>Person pixels</span></div>
            <div><b>{latency ? `${latency.toFixed(0)}ms` : "—"}</b><span>Latency</span></div>
            <div><b>{coverage != null ? fps.toFixed(0) : "—"}</b><span>FPS</span></div>
          </div>
          {effect === "blur" ? <label>Blur {blur}px<input type="range" min={2} max={28} value={blur} onChange={(event) => setBlur(Number(event.target.value))} /></label> : null}
          {effect === "solid" || effect === "green" ? <label>Color <input type="color" value={solid} onChange={(event) => setSolid(event.target.value)} /></label> : null}
          <label>Threshold {threshold.toFixed(2)}<input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
          <label>Edge feather {feather}px<input type="range" min={0} max={12} value={feather} onChange={(event) => setFeather(Number(event.target.value))} /></label>
          {effect === "replace" ? (
            <>
              <p>Local backgrounds (generated in-browser, no remote URLs).</p>
              <div className="cv-class-actions">
                {backgrounds.map((item) => (
                  <button key={item.id} type="button" onClick={() => {
                    setBgUrl(item.url);
                    const image = new Image();
                    image.onload = () => { bgImageRef.current = image; };
                    image.src = item.url;
                  }}>{item.name}</button>
                ))}
                <label className="cv-btn">Upload background
                  <input type="file" accept="image/*" hidden onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setBgUrl(url);
                    const image = new Image();
                    image.onload = () => { bgImageRef.current = image; };
                    image.src = url;
                  }} />
                </label>
              </div>
              {bgUrl ? <img src={bgUrl} alt="" className="cv-frame" /> : null}
            </>
          ) : null}
          <div className="cv-class-actions">
            <button type="button" className="cv-btn-primary" disabled={!outRef.current} onClick={() => outRef.current && downloadCanvas(outRef.current, "person.png")}>Capture PNG</button>
          </div>
          <p>Live video preview cannot export alpha video. PNG capture of the current frame can.</p>
        </aside>
      </div>
    </VisionPageShell>
  );
}
