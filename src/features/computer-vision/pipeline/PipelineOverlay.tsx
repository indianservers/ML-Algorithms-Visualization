import { TrackingOverlay } from "../components/TrackingOverlay";
import { DetectionOverlay } from "../components/DetectionOverlay";
import { CLASS_COLORS, type DetectionHit } from "../types";
import type { OverlayOp } from "./types";

export function PipelineOverlay({
  ops,
  width,
  height,
}: {
  ops: OverlayOp[];
  width: number;
  height: number;
}) {
  const labels = ops.filter((op) => op.kind === "label" && op.text).map((op) => op.text!);
  const boxes: DetectionHit[] = [];
  ops.filter((op) => op.kind === "boxes" && op.detections).forEach((op) => {
    op.detections!.forEach((item, index) => {
      boxes.push({
        id: `${item.label}-${index}`,
        label: item.label,
        score: item.score,
        box: item.box,
        color: CLASS_COLORS[index % CLASS_COLORS.length],
      });
    });
  });
  const tracks = ops.flatMap((op) => op.kind === "tracks" ? (op.tracks ?? []) : []);
  const skeletons = ops.filter((op) => op.kind === "skeleton");
  const masks = ops.filter((op) => op.kind === "mask" && op.mask);

  return (
    <>
      {masks.map((op, index) => (
        <MaskCanvas key={`m-${index}`} mask={op.mask!} w={op.maskW ?? width} h={op.maskH ?? height} />
      ))}
      {boxes.length ? <DetectionOverlay detections={boxes} width={width} height={height} showLabels showConfidence /> : null}
      {tracks.length ? <TrackingOverlay tracks={tracks} width={width} height={height} showIds showTrails showVelocity={false} classFilter="all" /> : null}
      {skeletons.length ? (
        <svg className="cv-overlay" viewBox={`0 0 ${width} ${height}`}>
          {skeletons.map((op, si) =>
            (op.connections ?? []).map(([a, b]) => {
              const from = op.landmarks?.[a];
              const to = op.landmarks?.[b];
              if (!from || !to) return null;
              return <line key={`${si}-${a}-${b}`} x1={from.x * width} y1={from.y * height} x2={to.x * width} y2={to.y * height} stroke="#38bdf8" strokeWidth="3" />;
            }),
          )}
        </svg>
      ) : null}
      {labels.length ? <div className="cv-pipe-banner">{labels.join(" · ")}</div> : null}
    </>
  );
}

function MaskCanvas({ mask, w, h }: { mask: Uint8Array; w: number; h: number }) {
  return (
    <canvas
      className="cv-overlay"
      width={w}
      height={h}
      ref={(node) => {
        if (!node) return;
        const ctx = node.getContext("2d");
        if (!ctx) return;
        const image = ctx.createImageData(w, h);
        for (let i = 0; i < mask.length; i += 1) {
          if (!mask[i]) continue;
          const px = i * 4;
          image.data[px] = 34;
          image.data[px + 1] = 197;
          image.data[px + 2] = 94;
          image.data[px + 3] = 120;
        }
        ctx.putImageData(image, 0, 0);
      }}
    />
  );
}
