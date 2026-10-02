import type { ReactNode } from "react";
import { getVisionLab } from "../catalog";
import { useTfBackend } from "../hooks/useTfBackend";

export function VisionPageShell({
  pathname,
  children,
  kicker,
  title,
}: {
  pathname: string;
  children: ReactNode;
  kicker?: string;
  title?: string;
}) {
  const lab = getVisionLab(pathname);
  const { backend, ready } = useTfBackend();
  return (
    <section className="cv-page">
      <header className="cv-page-head">
        <div>
          <h1>{title ?? lab?.label ?? "Computer Vision Studio"}</h1>
          <p>{kicker ?? lab?.blurb}</p>
        </div>
        <p className="cv-runtime" title="Active TensorFlow.js backend">
          {ready ? backend.toUpperCase() : "TF.js…"}
        </p>
      </header>
      {children}
    </section>
  );
}
