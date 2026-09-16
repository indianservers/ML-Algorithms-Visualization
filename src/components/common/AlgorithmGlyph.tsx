import { useId, type ReactNode } from "react";
import "./AlgorithmGlyph.css";

type GlyphProps = {
  size?: number;
  className?: string;
};

type Draw = (id: string) => ReactNode;

function Svg({ size = 22, className, children }: GlyphProps & { children: Draw }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`ml-glyph ${className ?? ""}`.trim()}
      fill="none"
      aria-hidden
    >
      {children(id)}
    </svg>
  );
}

function grad(id: string, a: string, b: string, x2 = "32", y2 = "0") {
  return (
    <linearGradient id={id} x1="0" y1="28" x2={x2} y2={y2}>
      <stop stopColor={a} />
      <stop offset="1" stopColor={b} />
    </linearGradient>
  );
}

const drawings: Record<string, Draw> = {
  "simple-linear-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M5 23 27 9" stroke={`url(#${id}a)`} strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="21" r="2.1" fill="#2ee6ff" />
      <circle cx="16" cy="15.5" r="2.1" fill="#5ad0ff" />
      <circle cx="24" cy="11" r="2.1" fill="#8aa8ff" />
    </>
  ),
  "multiple-linear-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#4cc9ff")}
      {grad(`${id}b`, "#ff5d9c", "#c45dff")}
      <rect x="6" y="14" width="5" height="12" rx="1.4" fill={`url(#${id}a)`} />
      <rect x="13.5" y="8" width="5" height="18" rx="1.4" fill={`url(#${id}b)`} />
      <rect x="21" y="11" width="5" height="15" rx="1.4" fill="#4d8dff" />
    </>
  ),
  "polynomial-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 10 C10 28 22 28 27 10" stroke={`url(#${id}a)`} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  "ridge-regression": (id) => (
    <>
      {grad(`${id}a`, "#1ad6ff", "#3d7dff")}
      <path d="M4 24 C8 24 9 6 16 6 C23 6 24 24 28 24 Z" fill={`url(#${id}a)`} opacity=".95" />
    </>
  ),
  "lasso-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#ff8a4d")}
      <ellipse cx="16" cy="16" rx="11" ry="8" stroke={`url(#${id}a)`} strokeWidth="2.2" strokeDasharray="3 3" />
    </>
  ),
  "elastic-net-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#7a7dff")}
      {grad(`${id}b`, "#ff5d9c", "#c45dff")}
      <path d="M10 10c6-6 14 2 8 8-6 6-14-2-8-8Z" stroke={`url(#${id}a)`} strokeWidth="2.1" />
      <path d="M22 10c-6-6-14 2-8 8 6 6 14-2 8-8Z" stroke={`url(#${id}b)`} strokeWidth="2.1" />
    </>
  ),
  "decision-tree-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6c8", "#3dff9a")}
      <circle cx="16" cy="7.5" r="3.1" fill={`url(#${id}a)`} />
      <circle cx="8" cy="24" r="3.1" fill="#2ee6c8" />
      <circle cx="24" cy="24" r="3.1" fill="#3dff9a" />
      <path d="M16 11v6M16 17 8 21M16 17l8 4" stroke="#2ee6c8" strokeWidth="1.8" />
    </>
  ),
  "random-forest-regression": (id) => (
    <>
      <path d="M9 24V18L5 18 9 9l4 9H9" fill="#2ee6a8" />
      <path d="M22 24V16L17.5 16 22 6l4.5 10H22" fill="#3dff8a" />
      <rect x="8" y="23" width="3" height="4" fill="#2a6b55" />
      <rect x="20.5" y="23" width="3" height="4" fill="#2a6b55" />
    </>
  ),
  "gradient-boosting-regression": (id) => (
    <>
      {grad(`${id}a`, "#ffb347", "#ff7a2e")}
      <rect x="6" y="18" width="5.5" height="8" rx="1.2" fill="#ffb347" />
      <rect x="13.2" y="12" width="5.5" height="14" rx="1.2" fill="#ff9a3a" />
      <rect x="20.4" y="6" width="5.5" height="20" rx="1.2" fill={`url(#${id}a)`} />
    </>
  ),
  "support-vector-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 22 27 10" stroke={`url(#${id}a)`} strokeWidth="1.8" />
      <circle cx="8" cy="12" r="2" fill="#2ee6ff" />
      <circle cx="14" cy="21" r="2" fill="#d46bff" />
      <circle cx="22" cy="14" r="2" fill="#2ee6ff" />
      <circle cx="24" cy="22" r="2" fill="#d46bff" />
    </>
  ),
  "logistic-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M4 24 C10 24 12 8 16 8 C20 8 22 8 28 8" stroke={`url(#${id}a)`} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  "multinomial-logistic-regression": (id) => (
    <>
      <circle cx="8" cy="22" r="3.2" fill="#2ee6ff" />
      <circle cx="24" cy="22" r="3.2" fill="#d46bff" />
      <circle cx="16" cy="8" r="3.2" fill="#6ea8ff" />
      <path d="M16 11 8 19M16 11l8 8" stroke="#7aa8ff" strokeWidth="1.7" />
    </>
  ),
  "knn-classification": (id) => (
    <>
      <circle cx="9" cy="10" r="2.4" fill="#2ee6ff" />
      <circle cx="23" cy="9" r="2.4" fill="#d46bff" />
      <circle cx="10" cy="23" r="2.4" fill="#3dff8a" />
      <circle cx="22" cy="22" r="2.4" fill="#ffb347" />
      <path d="M9 10 23 9M23 9 22 22M22 22 10 23M10 23 9 10" stroke="#7aa8ff" strokeWidth="1.4" opacity=".7" />
    </>
  ),
  "naive-bayes": (id) => (
    <>
      {grad(`${id}a`, "#ffd84a", "#ff9a2e")}
      <path d="M4 24 C8 24 9 6 16 6 C23 6 24 24 28 24 Z" fill={`url(#${id}a)`} />
    </>
  ),
  "decision-tree-classification": (id) => (
    <>
      <circle cx="16" cy="7.5" r="3.1" fill="#3dff8a" />
      <circle cx="8" cy="24" r="3.1" fill="#2ee6c8" />
      <circle cx="24" cy="24" r="3.1" fill="#3dff8a" />
      <path d="M16 11v6M16 17 8 21M16 17l8 4" stroke="#3dff8a" strokeWidth="1.8" />
    </>
  ),
  "random-forest-classification": (id) => (
    <>
      <path d="M10 24V18L6 18 10 8l4 10h-4" fill="#2ee6a8" />
      <path d="M22 24V16L18 16 22 5l4.5 11H22" fill="#3dff8a" />
    </>
  ),
  "svm-classification": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M6 24 26 8" stroke={`url(#${id}a)`} strokeWidth="1.8" strokeDasharray="3 3" />
      <rect x="7" y="8" width="5" height="5" rx="1" fill="#2ee6ff" />
      <rect x="20" y="19" width="5" height="5" rx="1" fill="#d46bff" />
    </>
  ),
  "gradient-boosting-classification": (id) => (
    <>
      <rect x="6" y="16" width="5.5" height="10" rx="1.2" fill="#2ee6c8" />
      <rect x="13.2" y="11" width="5.5" height="15" rx="1.2" fill="#3dff9a" />
      <rect x="20.4" y="6" width="5.5" height="20" rx="1.2" fill="#4dffb0" />
    </>
  ),
  "adaboost-classification": (id) => (
    <>
      <circle cx="10" cy="12" r="3.2" fill="#2ee6ff" />
      <circle cx="22" cy="11" r="2.6" fill="#d46bff" />
      <circle cx="12" cy="23" r="2.4" fill="#ffb347" />
      <circle cx="22" cy="22" r="3" fill="#3dff8a" />
    </>
  ),
  "xgboost-concept": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M18 4 10 16h6l-2 12 10-14h-7l3-10Z" fill={`url(#${id}a)`} />
    </>
  ),
  "k-means": (id) => (
    <>
      <circle cx="11" cy="11" r="3.2" fill="#2ee6ff" />
      <circle cx="21" cy="11" r="3.2" fill="#5ad0ff" />
      <circle cx="11" cy="21" r="3.2" fill="#4cc9ff" />
      <circle cx="21" cy="21" r="3.2" fill="#2ee6ff" />
    </>
  ),
  "k-medoids": (id) => (
    <>
      <circle cx="16" cy="9" r="3.4" fill="#ff4db8" />
      <circle cx="9" cy="22" r="3.4" fill="#d46bff" />
      <circle cx="23" cy="22" r="3.4" fill="#ff7ad9" />
      <circle cx="16" cy="9" r="5.4" stroke="#ff4db8" strokeOpacity=".35" />
    </>
  ),
  "hierarchical-clustering": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M8 26v-8h8v-8h8" stroke={`url(#${id}a)`} strokeWidth="2" />
      <circle cx="8" cy="26" r="2.2" fill="#2ee6ff" />
      <circle cx="16" cy="18" r="2.2" fill="#6ea8ff" />
      <circle cx="24" cy="10" r="2.2" fill="#d46bff" />
    </>
  ),
  dbscan: (id) => (
    <>
      <circle cx="10" cy="12" r="2.4" fill="#2ee6c8" />
      <circle cx="15" cy="9" r="2.4" fill="#3dff8a" />
      <circle cx="14" cy="16" r="2.4" fill="#2ee6c8" />
      <circle cx="23" cy="20" r="2.6" fill="#3dff8a" />
      <circle cx="24" cy="13" r="2.2" fill="#2ee6c8" />
    </>
  ),
  "mean-shift": (id) => (
    <>
      <circle cx="16" cy="16" r="9" stroke="#ffb347" strokeWidth="2" />
      <circle cx="16" cy="16" r="5" fill="#ff9a2e" />
    </>
  ),
  "gaussian-mixture-model": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      {grad(`${id}b`, "#d46bff", "#ff7ad9")}
      <path d="M3 24 C7 24 8 10 13 10 C18 10 18 24 22 24Z" fill={`url(#${id}a)`} opacity=".9" />
      <path d="M12 24 C16 24 17 8 22 8 C27 8 28 24 31 24Z" fill={`url(#${id}b)`} opacity=".85" />
    </>
  ),
  "spectral-clustering": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M4 20c4-10 6 8 10 0s6 8 10 0 4-8 4-8" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  optics: (id) => (
    <>
      <rect x="6" y="8" width="3.2" height="16" rx="1" fill="#ffb347" />
      <rect x="12" y="12" width="3.2" height="12" rx="1" fill="#ff9a2e" />
      <rect x="18" y="16" width="3.2" height="8" rx="1" fill="#ffb347" />
      <rect x="24" y="20" width="3.2" height="4" rx="1" fill="#ff9a2e" />
    </>
  ),
  pca: (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M6 24 26 8M6 8h6M26 24v-6" stroke={`url(#${id}a)`} strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="18" r="2" fill="#2ee6ff" />
      <circle cx="18" cy="14" r="2" fill="#6ea8ff" />
    </>
  ),
  "kernel-pca": (id) => (
    <>
      {grad(`${id}a`, "#d46bff", "#2ee6ff")}
      <path d="M8 24c8-18 16 6 16-12" stroke={`url(#${id}a)`} strokeWidth="2.2" />
      <circle cx="10" cy="22" r="2" fill="#2ee6ff" />
      <circle cx="22" cy="10" r="2" fill="#d46bff" />
    </>
  ),
  tsne: (id) => (
    <>
      <circle cx="10" cy="12" r="2.2" fill="#2ee6ff" />
      <circle cx="13" cy="9" r="2.2" fill="#5ad0ff" />
      <circle cx="22" cy="20" r="2.2" fill="#d46bff" />
      <circle cx="24" cy="16" r="2.2" fill="#ff7ad9" />
      <circle cx="8" cy="22" r="2.2" fill="#3dff8a" />
    </>
  ),
  "umap-concept": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M6 22 C12 8 20 24 26 10" stroke={`url(#${id}a)`} strokeWidth="2" />
      <circle cx="8" cy="20" r="2" fill="#2ee6ff" />
      <circle cx="16" cy="16" r="2" fill="#d46bff" />
      <circle cx="24" cy="12" r="2" fill="#2ee6ff" />
    </>
  ),
  lda: (id) => (
    <>
      <ellipse cx="11" cy="18" rx="6" ry="7" fill="#2ee6ff" opacity=".85" />
      <ellipse cx="21" cy="14" rx="6" ry="7" fill="#d46bff" opacity=".85" />
    </>
  ),
  autoencoder: (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M6 8 16 16 6 24M26 8 16 16 26 24" stroke={`url(#${id}a)`} strokeWidth="2" />
    </>
  ),
  perceptron: (id) => (
    <>
      <circle cx="8" cy="10" r="3" fill="#2ee6ff" />
      <circle cx="8" cy="22" r="3" fill="#6ea8ff" />
      <circle cx="24" cy="16" r="3.3" fill="#d46bff" />
      <path d="M11 10 21 16M11 22 21 16" stroke="#7aa8ff" strokeWidth="1.7" />
    </>
  ),
  mlp: (id) => (
    <>
      <circle cx="7" cy="8" r="2.4" fill="#d46bff" />
      <circle cx="7" cy="16" r="2.4" fill="#d46bff" />
      <circle cx="7" cy="24" r="2.4" fill="#d46bff" />
      <circle cx="16" cy="12" r="2.4" fill="#6ea8ff" />
      <circle cx="16" cy="20" r="2.4" fill="#6ea8ff" />
      <circle cx="25" cy="16" r="2.4" fill="#2ee6ff" />
      <path d="M9 8 14 12M9 16 14 12M9 16 14 20M9 24 14 20M18 12 23 16M18 20 23 16" stroke="#7aa8ff" strokeWidth="1.2" />
    </>
  ),
  "nn-playground": (id) => (
    <>
      <rect x="6" y="8" width="20" height="16" rx="3" stroke="#2ee6c8" strokeWidth="1.8" />
      <path d="M10 13h8M10 17h12M10 21h6" stroke="#2ee6c8" strokeWidth="1.6" />
    </>
  ),
  cnn: (id) => (
    <>
      <rect x="6" y="10" width="10" height="10" rx="2" fill="#ff4db8" />
      <rect x="12" y="8" width="10" height="10" rx="2" fill="#d46bff" opacity=".9" />
      <rect x="17" y="12" width="9" height="10" rx="2" fill="#6ea8ff" opacity=".9" />
    </>
  ),
  "convolution-visualizer": (id) => (
    <>
      {grad(`${id}a`, "#ff4db8", "#ff7ad9")}
      <path d="M5 16c3-10 5 10 8 0s5 10 8 0 4-8 4-8" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  rnn: (id) => (
    <>
      {grad(`${id}a`, "#2ee6c8", "#3dff8a")}
      <path d="M8 16a8 8 0 1 1 8 8" stroke={`url(#${id}a)`} strokeWidth="2.2" />
      <path d="M24 24 20 22l4-4" stroke="#3dff8a" strokeWidth="1.8" />
    </>
  ),
  lstm: (id) => (
    <>
      <rect x="8" y="8" width="16" height="5" rx="2" fill="#2ee6ff" />
      <rect x="8" y="14" width="16" height="5" rx="2" fill="#6ea8ff" />
      <rect x="8" y="20" width="16" height="5" rx="2" fill="#4d8dff" />
    </>
  ),
  gru: (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <circle cx="16" cy="16" r="9" stroke={`url(#${id}a)`} strokeWidth="2.2" />
      <path d="M16 10v6l4 3" stroke={`url(#${id}a)`} strokeWidth="2" />
    </>
  ),
  "transformer-attention": (id) => (
    <>
      <circle cx="8" cy="22" r="3" fill="#d46bff" />
      <circle cx="24" cy="22" r="3" fill="#ff7ad9" />
      <circle cx="16" cy="8" r="3" fill="#ff4db8" />
      <path d="M16 11 8 19M16 11l8 8M8 22h16" stroke="#d46bff" strokeWidth="1.6" />
    </>
  ),
  "multi-head-attention": (id) => (
    <>
      <circle cx="8" cy="22" r="3" fill="#ffb347" />
      <circle cx="24" cy="22" r="3" fill="#ff9a2e" />
      <circle cx="16" cy="8" r="3" fill="#ffd84a" />
      <path d="M16 11 8 19M16 11l8 8" stroke="#ffb347" strokeWidth="1.6" />
    </>
  ),
  "backpropagation-visualizer": (id) => (
    <>
      <rect x="7" y="18" width="4.5" height="8" rx="1" fill="#2ee6c8" />
      <rect x="13.8" y="12" width="4.5" height="14" rx="1" fill="#3dff9a" />
      <rect x="21.5" y="7" width="4.5" height="19" rx="1" fill="#4dffb0" />
    </>
  ),
  "few-shot-learning": (id) => (
    <>
      <circle cx="16" cy="8" r="2.6" fill="#6ea8ff" />
      <circle cx="7" cy="16" r="2.6" fill="#2ee6ff" />
      <circle cx="25" cy="16" r="2.6" fill="#d46bff" />
      <circle cx="10" cy="24" r="2.6" fill="#2ee6ff" />
      <circle cx="22" cy="24" r="2.6" fill="#d46bff" />
      <path d="M16 11 7 16M16 11 25 16M7 16 10 22M25 16 22 22" stroke="#7aa8ff" strokeWidth="1.3" />
    </>
  ),
  "network-builder": (id) => (
    <>
      <path d="M16 6 26 12v8L16 26 6 20v-8Z" stroke="#2ee6ff" strokeWidth="1.8" />
      <path d="M16 6v20M6 12h20" stroke="#2ee6ff" strokeWidth="1.3" />
    </>
  ),
  "transfer-learning": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M8 12h12M20 8l4 4-4 4M24 20H12M12 16l-4 4 4 4" stroke={`url(#${id}a)`} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "image-classification": (id) => (
    <>
      <rect x="6" y="8" width="20" height="16" rx="3" stroke="#2ee6c8" strokeWidth="1.8" />
      <circle cx="12" cy="14" r="2" fill="#2ee6c8" />
      <path d="M8 22 14 16l4 4 6-6" stroke="#2ee6c8" strokeWidth="1.6" />
    </>
  ),
  "audio-classification": (id) => (
    <>
      {grad(`${id}a`, "#d46bff", "#2ee6ff")}
      <path d="M8 16v4M12 12v12M16 8v16M20 12v12M24 16v4" stroke={`url(#${id}a)`} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  "hand-gesture-recognition": (id) => (
    <>
      <path d="M12 24v-8c0-2 2-3 3-1 0-3 2-3 3-1 0-3 2-3 3 0v10c0 4-3 6-8 6-4 0-6-3-6-6v-4" stroke="#ff4db8" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "pose-detection": (id) => (
    <>
      <circle cx="16" cy="7" r="2.4" fill="#ff4db8" />
      <path d="M16 10v8M16 18 10 26M16 18l6 8M10 14h12" stroke="#ff4db8" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "person-segmentation": (id) => (
    <>
      <circle cx="16" cy="9" r="3" stroke="#2ee6ff" strokeWidth="1.8" strokeDasharray="2 2" />
      <path d="M8 26c1-7 5-10 8-10s7 3 8 10" stroke="#2ee6ff" strokeWidth="1.8" strokeDasharray="2 2" />
    </>
  ),
  "cnn-filter-explorer": (id) => (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={7 + (i % 3) * 6.2} y={7 + Math.floor(i / 3) * 6.2} width="5.2" height="5.2" rx="1" fill={i % 2 ? "#d46bff" : "#6ea8ff"} />
      ))}
    </>
  ),
  "kmeans-image-segmentation": (id) => (
    <>
      <circle cx="11" cy="12" r="2.4" fill="#2ee6ff" />
      <circle cx="16" cy="10" r="2.4" fill="#d46bff" />
      <circle cx="14" cy="17" r="2.4" fill="#3dff8a" />
      <circle cx="22" cy="20" r="2.6" fill="#ffb347" />
    </>
  ),
  "edge-detection": (id) => (
    <>
      <rect x="8" y="8" width="16" height="16" rx="3" stroke="#ffb347" strokeWidth="2" strokeDasharray="3 3" />
    </>
  ),
  "object-detection-demo": (id) => (
    <>
      <rect x="8" y="8" width="16" height="16" rx="2" stroke="#ff4db8" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" stroke="#ff4db8" strokeWidth="1.6" />
    </>
  ),
  "grad-cam": (id) => (
    <>
      <defs>
        <radialGradient id={`${id}a`} cx="40%" cy="40%">
          <stop stopColor="#ff4d4d" />
          <stop offset=".5" stopColor="#ffb347" />
          <stop offset="1" stopColor="#2ee6ff" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="9" fill={`url(#${id}a)`} />
    </>
  ),
  "train-test-split": (id) => (
    <>
      <rect x="6" y="8" width="12" height="16" rx="2" fill="#2ee6ff" />
      <rect x="18" y="8" width="8" height="16" rx="2" fill="#d46bff" />
    </>
  ),
  "cross-validation": (id) => (
    <>
      <rect x="6" y="8" width="5" height="16" rx="1" fill="#2ee6ff" />
      <rect x="13.5" y="8" width="5" height="16" rx="1" fill="#6ea8ff" />
      <rect x="21" y="8" width="5" height="16" rx="1" fill="#d46bff" />
    </>
  ),
  "confusion-matrix": (id) => (
    <>
      <rect x="7" y="7" width="8" height="8" rx="1" fill="#2ee6c8" />
      <rect x="17" y="7" width="8" height="8" rx="1" fill="#1a3a55" stroke="#2ee6c8" />
      <rect x="7" y="17" width="8" height="8" rx="1" fill="#1a3a55" stroke="#d46bff" />
      <rect x="17" y="17" width="8" height="8" rx="1" fill="#d46bff" />
    </>
  ),
  "roc-auc": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M6 24c4-1 8-16 20-18" stroke={`url(#${id}a)`} strokeWidth="2.2" />
      <path d="M6 24h20V6" stroke="#3a5270" strokeWidth="1.2" />
    </>
  ),
  "precision-recall-curve": (id) => (
    <>
      {grad(`${id}a`, "#3dff8a", "#2ee6ff")}
      <path d="M6 24c2-12 10-16 20-16" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  "regression-metrics": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M6 24 26 8M8 8v16h16" stroke={`url(#${id}a)`} strokeWidth="1.8" />
    </>
  ),
  "bias-variance-tradeoff": (id) => (
    <>
      <path d="M5 24 C12 8 20 8 27 24" stroke="#2ee6ff" strokeWidth="1.8" />
      <path d="M5 10 C12 22 20 22 27 10" stroke="#d46bff" strokeWidth="1.8" />
    </>
  ),
  "missing-values": (id) => (
    <>
      <rect x="7" y="8" width="18" height="16" rx="2" stroke="#2ee6ff" strokeWidth="1.6" />
      <path d="M12 16h8M16 12v8" stroke="#d46bff" strokeWidth="2" />
    </>
  ),
  "scaling-normalization": (id) => (
    <>
      <path d="M8 24V8M24 24V14" stroke="#2ee6ff" strokeWidth="2" />
      <path d="M8 16h16" stroke="#d46bff" strokeWidth="1.6" strokeDasharray="3 2" />
    </>
  ),
  "categorical-encoding": (id) => (
    <>
      <rect x="6" y="10" width="8" height="12" rx="2" fill="#2ee6ff" />
      <rect x="18" y="10" width="3" height="12" rx="1" fill="#d46bff" />
      <rect x="23" y="10" width="3" height="12" rx="1" fill="#6ea8ff" />
    </>
  ),
  "outlier-detection": (id) => (
    <>
      <circle cx="12" cy="18" r="2" fill="#2ee6ff" />
      <circle cx="16" cy="16" r="2" fill="#6ea8ff" />
      <circle cx="20" cy="18" r="2" fill="#2ee6ff" />
      <circle cx="24" cy="8" r="2.4" fill="#ff4db8" />
    </>
  ),
  "feature-selection": (id) => (
    <>
      <rect x="6" y="8" width="6" height="16" rx="1" fill="#2ee6ff" />
      <rect x="13" y="8" width="6" height="16" rx="1" fill="#1a3a55" stroke="#6ea8ff" />
      <rect x="20" y="8" width="6" height="16" rx="1" fill="#d46bff" />
    </>
  ),
  "polynomial-features": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 22 C12 24 14 6 27 8" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  "moving-average": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M4 22 10 12 16 18 22 8 28 14" stroke={`url(#${id}a)`} strokeWidth="2" />
    </>
  ),
  "exponential-smoothing": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M4 24c6-2 8-16 24-18" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  "holt-winters": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#3dff8a")}
      <path d="M4 20c3-8 5 8 8 0s5 8 8 0 5 8 8-2" stroke={`url(#${id}a)`} strokeWidth="2" />
    </>
  ),
  "arima-concept": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M4 18 10 14 16 20 22 8 28 12" stroke={`url(#${id}a)`} strokeWidth="2" />
      <path d="M4 22h24" stroke="#3a5270" />
    </>
  ),
  "anomaly-detection": (id) => (
    <>
      <path d="M4 20 12 16 18 18 22 10 28 14" stroke="#2ee6ff" strokeWidth="2" />
      <circle cx="22" cy="10" r="3" stroke="#ff4db8" strokeWidth="1.8" />
    </>
  ),
  "bag-of-words": (id) => (
    <>
      <rect x="6" y="8" width="8" height="6" rx="1" fill="#2ee6ff" />
      <rect x="16" y="8" width="10" height="6" rx="1" fill="#6ea8ff" />
      <rect x="6" y="18" width="20" height="6" rx="1" fill="#d46bff" />
    </>
  ),
  "tf-idf": (id) => (
    <>
      <path d="M8 24V8h6M18 24V8h6" stroke="#2ee6ff" strokeWidth="2.2" />
    </>
  ),
  "text-classification": (id) => (
    <>
      <rect x="6" y="8" width="20" height="16" rx="2" stroke="#6ea8ff" strokeWidth="1.6" />
      <path d="M10 13h12M10 18h8" stroke="#2ee6ff" strokeWidth="1.6" />
    </>
  ),
  "word-embedding-concept": (id) => (
    <>
      <circle cx="10" cy="16" r="3" fill="#2ee6ff" />
      <circle cx="22" cy="12" r="3" fill="#d46bff" />
      <circle cx="20" cy="22" r="3" fill="#6ea8ff" />
      <path d="M13 16h6M12 17l6 4" stroke="#7aa8ff" />
    </>
  ),
  "sentiment-analysis": (id) => (
    <>
      <circle cx="16" cy="16" r="10" stroke="#ffb347" strokeWidth="1.8" />
      <path d="M12 14h.01M20 14h.01M12 20c2 2 6 2 8 0" stroke="#ffb347" strokeWidth="1.8" />
    </>
  ),
  "user-based-cf": (id) => (
    <>
      <circle cx="10" cy="12" r="4" stroke="#2ee6ff" strokeWidth="1.8" />
      <circle cx="22" cy="12" r="4" stroke="#d46bff" strokeWidth="1.8" />
      <path d="M6 24c1-4 4-6 10-6s9 2 10 6" stroke="#6ea8ff" strokeWidth="1.6" />
    </>
  ),
  "item-based-cf": (id) => (
    <>
      <rect x="7" y="8" width="8" height="16" rx="2" stroke="#2ee6ff" strokeWidth="1.8" />
      <rect x="17" y="8" width="8" height="16" rx="2" stroke="#d46bff" strokeWidth="1.8" />
    </>
  ),
  "matrix-factorization": (id) => (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={8 + (i % 3) * 6} y={8 + Math.floor(i / 3) * 6} width="4.5" height="4.5" rx="1" fill={i % 2 ? "#d46bff" : "#2ee6ff"} />
      ))}
    </>
  ),
  "content-based": (id) => (
    <>
      <rect x="7" y="8" width="18" height="16" rx="2" stroke="#2ee6ff" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="4" fill="#d46bff" />
    </>
  ),
  "multi-armed-bandit": (id) => (
    <>
      <rect x="8" y="10" width="5" height="14" rx="1" fill="#2ee6ff" />
      <rect x="19" y="6" width="5" height="18" rx="1" fill="#d46bff" />
    </>
  ),
  "q-learning-grid-world": (id) => (
    <>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={7 + (i % 3) * 6.2} y={7 + Math.floor(i / 3) * 6.2} width="5.2" height="5.2" rx="1" stroke="#2ee6ff" />
      ))}
      <rect x="13.2" y="13.2" width="5.2" height="5.2" rx="1" fill="#d46bff" />
    </>
  ),
  "markov-decision-process": (id) => (
    <>
      <circle cx="8" cy="16" r="4" stroke="#2ee6ff" strokeWidth="1.8" />
      <circle cx="24" cy="16" r="4" stroke="#d46bff" strokeWidth="1.8" />
      <path d="M12 16h8" stroke="#6ea8ff" strokeWidth="1.8" markerEnd="url(#arr)" />
    </>
  ),
  "feature-importance": (id) => (
    <>
      <rect x="6" y="20" width="16" height="3" rx="1" fill="#2ee6ff" />
      <rect x="6" y="14" width="12" height="3" rx="1" fill="#6ea8ff" />
      <rect x="6" y="8" width="8" height="3" rx="1" fill="#d46bff" />
    </>
  ),
  "partial-dependence-plot": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 22 C12 24 14 8 27 10" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  "shap-concept": (id) => (
    <>
      <path d="M16 6 26 16 16 26 6 16Z" stroke="#ffb347" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="3" fill="#ffb347" />
    </>
  ),
  "lime-concept": (id) => (
    <>
      <circle cx="16" cy="16" r="9" stroke="#3dff8a" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4" fill="#3dff8a" />
    </>
  ),
  "gradient-descent": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 8 C12 8 12 24 27 24" stroke={`url(#${id}a)`} strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2.2" fill="#2ee6ff" />
    </>
  ),
  sgd: (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M5 10 12 18 18 12 27 22" stroke={`url(#${id}a)`} strokeWidth="2" />
    </>
  ),
  momentum: (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M6 22 C10 8 18 8 26 10" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  adam: (id) => (
    <>
      {grad(`${id}a`, "#ffb347", "#2ee6ff")}
      <path d="M6 22 C14 22 14 8 26 8" stroke={`url(#${id}a)`} strokeWidth="2.2" />
    </>
  ),
  bagging: (id) => (
    <>
      <circle cx="10" cy="16" r="5" fill="#2ee6ff" opacity=".85" />
      <circle cx="16" cy="16" r="5" fill="#6ea8ff" opacity=".85" />
      <circle cx="22" cy="16" r="5" fill="#d46bff" opacity=".85" />
    </>
  ),
  stacking: (id) => (
    <>
      <rect x="7" y="18" width="18" height="6" rx="1.5" fill="#2ee6ff" />
      <rect x="9" y="12" width="14" height="5" rx="1.5" fill="#6ea8ff" />
      <rect x="11" y="6" width="10" height="5" rx="1.5" fill="#d46bff" />
    </>
  ),
  "bayesian-linear-regression": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#6ea8ff")}
      <path d="M5 22 27 10" stroke={`url(#${id}a)`} strokeWidth="2" />
      <path d="M5 18 27 6M5 26 27 14" stroke={`url(#${id}a)`} strokeOpacity=".4" />
    </>
  ),
  "hidden-markov-model": (id) => (
    <>
      <circle cx="8" cy="16" r="4" fill="#2ee6ff" />
      <circle cx="24" cy="16" r="4" fill="#d46bff" />
      <path d="M12 16h8" stroke="#7aa8ff" strokeWidth="2" />
    </>
  ),
  "browser-model-loader": (id) => (
    <>
      <rect x="7" y="8" width="18" height="16" rx="2" stroke="#2ee6ff" strokeWidth="1.6" />
      <path d="M16 12v8M12 18l4 4 4-4" stroke="#2ee6ff" strokeWidth="1.8" />
    </>
  ),
  "onnx-runtime-demo": (id) => (
    <>
      <circle cx="16" cy="16" r="9" stroke="#6ea8ff" strokeWidth="1.8" />
      <path d="M12 16h8M16 12v8" stroke="#2ee6ff" strokeWidth="1.8" />
    </>
  ),
  "model-export": (id) => (
    <>
      <path d="M8 18v6h16v-6M16 6v14M12 12l4-6 4 6" stroke="#2ee6ff" strokeWidth="1.8" />
    </>
  ),
  "model-card": (id) => (
    <>
      <rect x="8" y="6" width="16" height="20" rx="2" stroke="#2ee6ff" strokeWidth="1.6" />
      <path d="M11 12h10M11 16h8M11 20h6" stroke="#6ea8ff" />
    </>
  ),
  "experiment-workspace": (id) => (
    <>
      <rect x="6" y="8" width="20" height="16" rx="2" stroke="#2ee6ff" strokeWidth="1.6" />
      <circle cx="12" cy="16" r="2" fill="#3dff8a" />
      <circle cx="20" cy="16" r="2" fill="#d46bff" />
    </>
  ),
};

const aliases: Record<string, string> = {
  svr: "support-vector-regression",
  xgboost: "xgboost-concept",
  adaboost: "adaboost-classification",
  "elastic-net": "elastic-net-regression",
  "rnn-forecasting": "rnn",
  "lstm-forecasting": "lstm",
  "gru-forecasting": "gru",
  "naive-bayes-spam": "naive-bayes",
  boosting: "gradient-boosting-classification",
  "gaussian-process-regression": "gaussian-mixture-model",
  "tensorflowjs-training": "mlp",
  "export-hub": "model-export",
  "model-zoo": "stacking",
  "automl-assistant": "gru",
  "training-visualizations": "gradient-boosting-regression",
  "inference-playground": "nn-playground",
  "model-comparison-dashboard": "multiple-linear-regression",
  "explainability-center": "shap-concept",
  "dataset-intelligence": "bag-of-words",
  "tuning-engine": "gru",
  "train-your-model": "mlp",
  "image-annotation": "object-detection-demo",
  "data-augmentation": "image-classification",
  "model-comparison": "multiple-linear-regression",
  "batch-inference": "stacking",
  "active-learning": "few-shot-learning",
  "performance-dashboard": "gradient-boosting-classification",
  "architecture-flow": "mlp",
  "algorithm-comparison": "item-based-cf",
  "hyperparameter-tuning": "adam",
  "automl-concept": "gru",
  "saved-experiments": "model-card",
  "dataset-manager": "bag-of-words",
  "report-builder": "model-card",
};

const categoryDrawings: Record<string, Draw> = {
  "Supervised - Regression": (id) => drawings["multiple-linear-regression"](id),
  "Supervised - Classification": (id) => drawings["multinomial-logistic-regression"](id),
  Clustering: (id) => (
    <>
      <circle cx="10" cy="11" r="3.2" fill="#2ee6ff" />
      <circle cx="22" cy="11" r="3.2" fill="#d46bff" />
      <circle cx="16" cy="22" r="3.2" fill="#ffb347" />
      <path d="M10 11 22 11 16 22Z" stroke="#7aa8ff" strokeWidth="1.4" />
    </>
  ),
  "Dimensionality Reduction": (id) => drawings.pca(id),
  "Deep Learning": (id) => (
    <>
      {grad(`${id}a`, "#2ee6ff", "#d46bff")}
      <path d="M10 12c0-4 12-4 12 2 3 0 4 8-2 8H12c-6 0-5-8-2-8 0-1 0-2 0-2Z" stroke={`url(#${id}a)`} strokeWidth="1.8" />
      <circle cx="13" cy="16" r="1.2" fill="#2ee6ff" />
      <circle cx="19" cy="16" r="1.2" fill="#d46bff" />
    </>
  ),
  Evaluation: (id) => drawings["roc-auc"](id),
  Preprocessing: (id) => drawings["feature-selection"](id),
  "Time Series": (id) => drawings["moving-average"](id),
  NLP: (id) => drawings["text-classification"](id),
  "Computer Vision": (id) => (
    <>
      <ellipse cx="16" cy="16" rx="11" ry="7" stroke="#2ee6ff" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="3.5" fill="#2ee6ff" />
    </>
  ),
  Recommendation: (id) => (
    <>
      <path d="M16 6 19 13h7l-6 5 2 8-7-4-7 4 2-8-6-5h7Z" fill="#ffb347" />
    </>
  ),
  "Reinforcement Learning": (id) => drawings["q-learning-grid-world"](id),
  Explainability: (id) => drawings["shap-concept"](id),
  Optimization: (id) => drawings["gradient-descent"](id),
  Ensemble: (id) => drawings.stacking(id),
  Probabilistic: (id) => drawings["naive-bayes"](id),
  Deployment: (id) => drawings["model-export"](id),
  Lab: (id) => drawings["experiment-workspace"](id),
};

const lucideToCategory: Record<string, string> = {
  TrendingUp: "Supervised - Regression",
  GitBranch: "Supervised - Classification",
  Network: "Clustering",
  Minimize2: "Dimensionality Reduction",
  Brain: "Deep Learning",
  BarChart2: "Evaluation",
  Filter: "Preprocessing",
  Activity: "Time Series",
  MessageSquare: "NLP",
  Eye: "Computer Vision",
  Star: "Recommendation",
  Play: "Reinforcement Learning",
  Lightbulb: "Explainability",
  Zap: "Optimization",
  Layers: "Ensemble",
  Sigma: "Probabilistic",
  Upload: "Deployment",
  FlaskConical: "Lab",
};

function slugFromRoute(route: string) {
  return route.split("/").filter(Boolean).pop() ?? "";
}

function fallbackDraw(seed: string): Draw {
  const hue = Array.from(seed).reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  const a = `hsl(${hue} 90% 62%)`;
  const b = `hsl(${(hue + 50) % 360} 90% 62%)`;
  return (id) => (
    <>
      {grad(`${id}a`, a, b)}
      <circle cx="16" cy="16" r="8" stroke={`url(#${id}a)`} strokeWidth="2" />
      <path d="M12 16h8M16 12v8" stroke={`url(#${id}a)`} strokeWidth="1.8" />
    </>
  );
}

function findDraw(route?: string, label?: string): Draw {
  const slug = route ? slugFromRoute(route) : "";
  const fromLabel = (label ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const parts = (route ?? "").split("/").filter(Boolean);
  const lastTwo = parts.slice(-2).join("/");
  const key = [route, lastTwo, slug, fromLabel].find((item) => item && (drawings[item] || aliases[item]));
  if (!key) return fallbackDraw(slug || fromLabel || "algo");
  const resolved = aliases[key] ?? key;
  return drawings[resolved] ?? fallbackDraw(resolved);
}

export function AlgorithmGlyph({
  route,
  label,
  size = 22,
  className,
}: GlyphProps & { route?: string; label?: string }) {
  return <Svg size={size} className={className}>{findDraw(route, label)}</Svg>;
}

export function CategoryGlyph({
  category,
  icon,
  size = 22,
  className,
}: GlyphProps & { category?: string; icon?: string }) {
  const key = category ?? (icon ? lucideToCategory[icon] : undefined);
  const draw = (key && categoryDrawings[key]) || fallbackDraw(key ?? "cat");
  return <Svg size={size} className={className}>{draw}</Svg>;
}

export function GlyphTile({
  children,
  size = "md",
}: {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const cls = size === "lg" ? "ml-glyph-tile ml-glyph-tile-lg" : size === "sm" ? "ml-glyph-tile ml-glyph-tile-sm" : "ml-glyph-tile";
  return <span className={cls}>{children}</span>;
}
