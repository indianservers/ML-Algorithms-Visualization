import { useCallback, useEffect, useRef, useState } from "react";
import { stopMediaElementStream, stopMediaStream } from "../../../lib/media/streams";
import type { CameraPermission, CameraStatus } from "../types";

export interface UseCameraOptions {
  mirror?: boolean;
  width?: number;
  height?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generationRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [permission, setPermission] = useState<CameraPermission>("unknown");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [mirror, setMirror] = useState(options.mirror ?? true);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const list = (await navigator.mediaDevices.enumerateDevices()).filter((item) => item.kind === "videoinput");
    setDevices(list);
    if (!deviceId && list[0]?.deviceId) setDeviceId(list[0].deviceId);
  }, [deviceId]);

  const stop = useCallback(() => {
    generationRef.current += 1;
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    stopMediaElementStream(videoRef.current);
    setStatus("idle");
  }, []);

  const start = useCallback(async (nextDeviceId = deviceId) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission("unavailable");
      setStatus("error");
      setError("This browser does not expose a camera API.");
      return;
    }
    const generation = ++generationRef.current;
    setStatus("starting");
    setError(null);
    try {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: nextDeviceId ? { exact: nextDeviceId } : undefined,
          width: { ideal: options.width ?? 1280 },
          height: { ideal: options.height ?? 720 },
          facingMode: nextDeviceId ? undefined : "user",
        },
      });
      if (generation !== generationRef.current) {
        stopMediaStream(stream);
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopMediaStream(stream);
        streamRef.current = null;
        setStatus("error");
        setError("Camera element is not ready.");
        return;
      }
      video.srcObject = stream;
      await video.play();
      if (generation !== generationRef.current) {
        stopMediaStream(stream);
        stopMediaElementStream(video);
        streamRef.current = null;
        return;
      }
      setPermission("granted");
      setStatus("live");
      await refreshDevices();
    } catch (caught) {
      if (generation !== generationRef.current) return;
      const message = caught instanceof Error ? caught.message : "Unable to start the camera.";
      const denied = /denied|notallowed|permission/i.test(message);
      setPermission(denied ? "denied" : "unavailable");
      setStatus("error");
      setError(denied ? "Camera permission was denied." : message);
    }
  }, [deviceId, options.height, options.width, refreshDevices]);

  const snapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, [mirror]);

  useEffect(() => () => stop(), [stop]);

  return {
    videoRef,
    streamRef,
    status,
    permission,
    error,
    devices,
    deviceId,
    setDeviceId,
    mirror,
    setMirror,
    start,
    stop,
    snapshot,
    refreshDevices,
  };
}
