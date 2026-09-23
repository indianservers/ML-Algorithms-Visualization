import { Outlet, useLocation } from "react-router-dom";
import { ComputerVisionSidebar } from "../../../features/computer-vision/components/ComputerVisionSidebar";
import "../../../features/computer-vision/ComputerVision.css";

export default function ComputerVisionLayout() {
  const { pathname } = useLocation();
  return (
    <div className="cv-studio">
      <ComputerVisionSidebar pathname={pathname} />
      <div className="cv-studio-main">
        <Outlet />
      </div>
    </div>
  );
}
