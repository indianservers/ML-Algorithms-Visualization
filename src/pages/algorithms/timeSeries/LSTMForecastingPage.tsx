import { useLocation } from "react-router-dom";
import RecurrentForecastingLab from "./RecurrentForecastingLab";
import LSTMForecastingApprovedPage from "./LSTMForecastingApprovedPage";

export default function LSTMForecastingPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get("advanced") === "1" ? (
    <RecurrentForecastingLab mode="lstm" />
  ) : (
    <LSTMForecastingApprovedPage />
  );
}
