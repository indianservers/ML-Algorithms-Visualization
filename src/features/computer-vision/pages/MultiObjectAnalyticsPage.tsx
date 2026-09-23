import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ObjectDetector } from "@mediapipe/tasks-vision";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VisionPageShell } from "../components/VisionPageShell";
import { VisionCamera } from "../components/VisionCamera";
import { TrackingOverlay } from "../components/TrackingOverlay";
import { useCamera } from "../hooks/useCamera";
import { useRafLoop } from "../hooks/useRafLoop";
import { createObjectDetector, formatVisionError } from "../runtime/mediapipeRuntime";
import { ObjectTracker, type Track } from "../tracker/ObjectTracker";
import { mapDetections } from "../tracker/mapDetections";
import { meanDwell, tickLines, tickZones, type AnalyticEvent, type CountLine, type Zone } from "../tracker/analytics";

type Draw = "none" | "line" | "zone";

export default function MultiObjectAnalyticsPage() {
  const { pathname } = useLocation();
  const camera = useCamera({ mirror: false });
  const detectorRef = useRef<ObjectDetector | null>(null);
  const trackerRef = useRef(new ObjectTracker({ confirmHits: 2, maxMisses: 14 }));
  const prevRef = useRef<Track[]>([]);
  const linesRef = useRef<CountLine[]>([]);
  const zonesRef = useRef<Zone[]>([]);
  const lastUi = useRef(0);
  const fpsRef = useRef({ frames: 0, stamp: performance.now() });
  const pendingLine = useRef<{ x: number; y: number } | null>(null);
  const pendingZone = useRef<{ x: number; y: number } | null>(null);
  const seriesRef = useRef<Array<{ t: number; occ: number; entries: number; exits: number }>>([]);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [events, setEvents] = useState<AnalyticEvent[]>([]);
  const [lines, setLines] = useState<CountLine[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [series, setSeries] = useState<Array<{ t: number; occ: number; entries: number; exits: number }>>([]);
  const [draw, setDraw] = useState<Draw>("none");
  const [fps, setFps] = useState(0);
  const [size, setSize] = useState({ w: 640, h: 360 });
  const [status, setStatus] = useState("Analytics reuse the same IoU tracker. Draw a line or zone on the video.");
  const [threshold, setThreshold] = useState(0.4);
  const [classFilter, setClassFilter] = useState("all");
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  useEffect(() => () => {
    detectorRef.current?.close();
    detectorRef.current = null;
  }, []);

  const ensure = async () => {
    if (detectorRef.current) return detectorRef.current;
    detectorRef.current = await createObjectDetector(12, threshold);
    setStatus("Tracker ready. Crossings use trajectory side-of-line with 700ms hysteresis.");
    return detectorRef.current;
  };

  useRafLoop(camera.status === "live" && !paused, async (now) => {
    const source = camera.videoRef.current;
    if (!source || source.readyState < 2) return;
    try {
      const detector = await ensure();
      const dets = mapDetections(detector.detectForVideo(source, now), threshold, 12)
        .filter((item) => classFilter === "all" || item.label === classFilter);
      const prev = prevRef.current;
      const next = trackerRef.current.update(dets, now);
      const lineEvents = tickLines(linesRef.current, prev, next, now);
      const zoneEvents = tickZones(zonesRef.current, prev, next, now);
      prevRef.current = next;
      if (lineEvents.length || zoneEvents.length) {
        setEvents((current) => [...lineEvents, ...zoneEvents, ...current].slice(0, 80));
      }
      if (now - lastUi.current > 120) {
        lastUi.current = now;
        setTracks(next);
        setLines(linesRef.current.map((line) => ({ ...line })));
        setZones(zonesRef.current.map((zone) => ({ ...zone, dwellMs: { ...zone.dwellMs }, enteredAt: { ...zone.enteredAt } })));
        setSize({ w: source.videoWidth || 640, h: source.videoHeight || 360 });
        setSeen((current) => {
          const copy = new Set(current);
          next.forEach((track) => copy.add(track.id));
          return copy;
        });
        const occ = zonesRef.current.reduce((sum, zone) => sum + zone.occupancy, 0);
        const entries = zonesRef.current.reduce((sum, zone) => sum + zone.entries, 0) + linesRef.current.reduce((sum, line) => sum + line.ab, 0);
        const exits = zonesRef.current.reduce((sum, zone) => sum + zone.exits, 0) + linesRef.current.reduce((sum, line) => sum + line.ba, 0);
        seriesRef.current = [...seriesRef.current, { t: now, occ, entries, exits }].slice(-60);
        setSeries([...seriesRef.current]);
        fpsRef.current.frames += 1;
        if (now - fpsRef.current.stamp > 500) {
          setFps((fpsRef.current.frames * 1000) / (now - fpsRef.current.stamp));
          fpsRef.current = { frames: 0, stamp: now };
        }
      }
    } catch (caught) {
      setStatus(formatVisionError(caught, "Analytics failed."));
    }
  });

  const toLocal = (event: React.MouseEvent<Element>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * size.w,
      y: ((event.clientY - rect.top) / rect.height) * size.h,
    };
  };

  const onDown = (event: React.MouseEvent<Element>) => {
    const point = toLocal(event);
    if (draw === "line") {
      if (!pendingLine.current) pendingLine.current = point;
      else {
        const a = pendingLine.current;
        const line: CountLine = { id: `L${linesRef.current.length + 1}`, name: `Line ${linesRef.current.length + 1}`, line: { ax: a.x, ay: a.y, bx: point.x, by: point.y }, ab: 0, ba: 0, lastByTrack: {} };
        linesRef.current = [...linesRef.current, line];
        setLines(linesRef.current);
        pendingLine.current = null;
        setDraw("none");
      }
    }
    if (draw === "zone") pendingZone.current = point;
  };

  const onUp = (event: React.MouseEvent<Element>) => {
    if (draw !== "zone" || !pendingZone.current) return;
    const point = toLocal(event);
    const x = Math.min(pendingZone.current.x, point.x);
    const y = Math.min(pendingZone.current.y, point.y);
    const zone: Zone = {
      id: `Z${zonesRef.current.length + 1}`,
      name: `Zone ${String.fromCharCode(65 + zonesRef.current.length)}`,
      kind: "rect",
      rect: { x, y, w: Math.abs(point.x - pendingZone.current.x), h: Math.abs(point.y - pendingZone.current.y) },
      occupancy: 0,
      entries: 0,
      exits: 0,
      dwellMs: {},
      enteredAt: {},
      classFilter: "all",
    };
    zonesRef.current = [...zonesRef.current, zone];
    setZones(zonesRef.current);
    pendingZone.current = null;
    setDraw("none");
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const track of tracks) {
      if (track.status !== "active") continue;
      map[track.label] = (map[track.label] ?? 0) + 1;
    }
    return map;
  }, [tracks]);

  const exportCsv = () => {
    const header = "time,kind,track,class,target,dwellMs";
    const rows = events.map((item) => [new Date(item.at).toISOString(), item.kind, item.trackId, item.label, item.target, item.dwellMs ?? ""].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics-events.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VisionPageShell pathname={pathname} kicker="Line crossing and zone dwell on persistent tracks. Counts are from trajectories, not placeholders.">
      <div className="cv-pose-layout">
        <div>
          <div className="cv-class-actions" style={{ marginBottom: 8 }}>
            <button type="button" className="cv-btn-primary" onClick={() => void camera.start()}>Live camera</button>
            <button type="button" className={draw === "line" ? "cv-btn-primary" : "cv-btn"} onClick={() => setDraw("line")}>Draw line A→B</button>
            <button type="button" className={draw === "zone" ? "cv-btn-primary" : "cv-btn"} onClick={() => setDraw("zone")}>Draw zone</button>
            <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
          </div>
          <VisionCamera
            videoRef={camera.videoRef}
            status={camera.status}
            permission={camera.permission}
            error={camera.error}
            mirror={camera.mirror}
            onStart={() => void camera.start()}
            onStop={() => { camera.stop(); trackerRef.current.reset(); setTracks([]); }}
            devices={camera.devices}
            deviceId={camera.deviceId}
            onDevice={(id) => { camera.setDeviceId(id); void camera.start(id); }}
            extra={<span>{tracks.length ? `${fps.toFixed(0)} FPS` : "—"}</span>}
          >
            <TrackingOverlay tracks={tracks} width={size.w} height={size.h} showIds showTrails showVelocity={false} classFilter="all" />
            <svg
              className="cv-overlay"
              viewBox={`0 0 ${size.w} ${size.h}`}
              style={{ pointerEvents: draw === "none" ? "none" : "auto" }}
              onMouseDown={onDown}
              onMouseUp={onUp}
            >
              {lines.map((line) => (
                <g key={line.id}>
                  <line x1={line.line.ax} y1={line.line.ay} x2={line.line.bx} y2={line.line.by} stroke="#fbbf24" strokeWidth="3" />
                  <text x={line.line.ax} y={line.line.ay - 6} fill="#fbbf24" fontSize="12">{line.name} A→B {line.ab} / B→A {line.ba}</text>
                </g>
              ))}
              {zones.map((zone) => zone.rect ? (
                <g key={zone.id}>
                  <rect x={zone.rect.x} y={zone.rect.y} width={zone.rect.w} height={zone.rect.h} fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth="2" />
                  <text x={zone.rect.x + 6} y={zone.rect.y + 16} fill="#38bdf8" fontSize="12">{zone.name} occ {zone.occupancy}</text>
                </g>
              ) : null)}
            </svg>
          </VisionCamera>
          <p>{status}</p>
        </div>
        <aside>
          <article className="cv-panel">
            <h2>Counts</h2>
            <div className="cv-metrics">
              <div><b>{tracks.filter((track) => track.status === "active").length}</b><span>Current</span></div>
              <div><b>{seen.size}</b><span>Cumulative IDs</span></div>
              <div><b>{Object.values(counts).reduce((sum, n) => sum + n, 0)}</b><span>Visible</span></div>
            </div>
            {Object.entries(counts).map(([name, n]) => <p key={name}>{name}: {n}</p>)}
            <label>Confidence {threshold.toFixed(2)}<input type="range" min={0.15} max={0.8} step={0.05} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></label>
            <label>Class filter
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="all">All</option>
                {Array.from(new Set(tracks.map((track) => track.label))).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
          </article>
          <article className="cv-panel" style={{ marginTop: 10 }}>
            <h2>Zones / lines</h2>
            {lines.map((line) => <p key={line.id}>{line.name}: IN {line.ab} · OUT {line.ba}</p>)}
            {zones.map((zone) => (
              <p key={zone.id}>{zone.name}: occ {zone.occupancy} · in {zone.entries} · out {zone.exits} · dwell {meanDwell(zone) == null ? "—" : `${(meanDwell(zone)! / 1000).toFixed(1)}s`}</p>
            ))}
            <div className="cv-class-actions">
              <button type="button" disabled={!events.length} onClick={exportCsv}>CSV events</button>
              <button type="button" disabled={!events.length} onClick={() => {
                const blob = new Blob([JSON.stringify({ lines, zones, events, at: new Date().toISOString() }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "analytics-session.json";
                link.click();
                URL.revokeObjectURL(url);
              }}>JSON session</button>
            </div>
          </article>
        </aside>
        <section className="cv-panel cv-expr-chart">
          <h2>Occupancy / crossings over time</h2>
          <div className="cv-chart" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.map((row, index) => ({ i: index, occ: row.occ, entries: row.entries, exits: row.exits }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="i" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="occ" stroke="#2563eb" dot={false} name="Occupancy" />
                <Line type="monotone" dataKey="entries" stroke="#16a34a" dot={false} name="Entries" />
                <Line type="monotone" dataKey="exits" stroke="#dc2626" dot={false} name="Exits" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ul className="cv-event-list">
            {events.slice(0, 12).map((item) => (
              <li key={`${item.at}-${item.trackId}-${item.kind}`}>{new Date(item.at).toLocaleTimeString()} · ID {item.trackId} {item.label} · {item.kind} · {item.target}{item.dwellMs != null ? ` · ${(item.dwellMs / 1000).toFixed(1)}s` : ""}</li>
            ))}
          </ul>
        </section>
      </div>
    </VisionPageShell>
  );
}
