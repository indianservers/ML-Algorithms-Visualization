import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { VISION_HOME_ROUTE, getVisionLab } from "../catalog";
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
          <p className="cv-crumb">
            <Link to={VISION_HOME_ROUTE}>Computer Vision</Link>
            <span>/</span>
            {lab?.label ?? "Studio"}
          </p>
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
