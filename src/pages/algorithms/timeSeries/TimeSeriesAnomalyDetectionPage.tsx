import TimeSeriesWorkbench from "../../../features/time-series-studio/TimeSeriesWorkbench";
import RealAlgorithmMiniLab from "../shared/RealAlgorithmMiniLab";
import { useLocation } from "react-router-dom";

export default function TimeSeriesAnomalyDetectionPage() {
  const { search } = useLocation();
  return new URLSearchParams(search).has("advanced") ? (
    <RealAlgorithmMiniLab mode="anomaly-detection" />
  ) : (
    <TimeSeriesWorkbench kind="anomaly-detection" />
  );
}
