import RealAlgorithmMiniLab from "../shared/RealAlgorithmMiniLab";
import { useLocation } from "react-router-dom";
import TimeSeriesAnomalyDetectionApprovedPage from "./TimeSeriesAnomalyDetectionApprovedPage";

export default function TimeSeriesAnomalyDetectionPage() {
  const { search } = useLocation();
  return new URLSearchParams(search).has("advanced") ? (
    <RealAlgorithmMiniLab mode="anomaly-detection" />
  ) : (
    <TimeSeriesAnomalyDetectionApprovedPage />
  );
}
