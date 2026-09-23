import { Link, useLocation } from "react-router-dom";
import { VISION_HOME_ROUTE, getVisionLab } from "../catalog";
import { VisionPageShell } from "../components/VisionPageShell";

export default function VisionComingSoonPage() {
  const { pathname } = useLocation();
  const lab = getVisionLab(pathname);
  return (
    <VisionPageShell pathname={pathname}>
      <article className="cv-panel cv-soon">
        <h2>{lab?.label ?? "This lab"} is scheduled for a later phase</h2>
        <p>
          The menu entry is live so the studio stays complete, but this workspace is not simulated.
          Remaining labs ship in a later phase. Live studios already include detection, hands, face, pose analysis, reps, holistic tracking, and segmentation.
        </p>
        <Link to={VISION_HOME_ROUTE} className="cv-btn-primary" style={{ display: "inline-flex", alignItems: "center", marginTop: 12 }}>
          Back to Studio Home
        </Link>
      </article>
    </VisionPageShell>
  );
}
