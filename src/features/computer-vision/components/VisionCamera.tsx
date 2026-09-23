import type { ReactNode, RefObject } from "react";
import { Aperture, Camera, FlipHorizontal2, Pause, Play } from "lucide-react";
import type { CameraPermission, CameraStatus } from "../types";

export function VisionCamera({
  videoRef,
  status,
  permission,
  error,
  mirror,
  onStart,
  onStop,
  onSnapshot,
  onToggleMirror,
  devices,
  deviceId,
  onDevice,
  extra,
  children,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  permission: CameraPermission;
  error: string | null;
  mirror: boolean;
  onStart: () => void;
  onStop: () => void;
  onSnapshot?: () => void;
  onToggleMirror?: () => void;
  devices: MediaDeviceInfo[];
  deviceId: string;
  onDevice: (id: string) => void;
  extra?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="cv-camera">
      <video ref={videoRef} className={mirror ? "is-mirror" : undefined} playsInline muted autoPlay />
      {children}
      {status !== "live" ? (
        <div className="cv-camera-empty">
          <Camera size={22} />
          <p>
            {permission === "denied"
              ? "Camera permission was denied. Enable it in the browser and try again."
              : error ?? "Start the camera to run live inference in this browser."}
          </p>
          <button type="button" className="cv-btn-primary" onClick={onStart}>
            <Play size={14} /> Start camera
          </button>
        </div>
      ) : null}
      <div className="cv-camera-bar">
        <span className={status === "live" ? "cv-live" : "cv-idle"}>{status === "live" ? "Live" : status}</span>
        {devices.length > 1 ? (
          <select value={deviceId} onChange={(event) => onDevice(event.target.value)} aria-label="Camera device">
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        ) : null}
        <button type="button" onClick={status === "live" ? onStop : onStart} aria-label={status === "live" ? "Stop camera" : "Start camera"}>
          {status === "live" ? <Pause size={14} /> : <Play size={14} />}
        </button>
        {onToggleMirror ? (
          <button type="button" onClick={onToggleMirror} aria-label="Mirror camera">
            <FlipHorizontal2 size={14} />
          </button>
        ) : null}
        {onSnapshot ? (
          <button type="button" onClick={onSnapshot} aria-label="Snapshot" disabled={status !== "live"}>
            <Aperture size={14} />
          </button>
        ) : null}
        {extra}
      </div>
    </div>
  );
}
