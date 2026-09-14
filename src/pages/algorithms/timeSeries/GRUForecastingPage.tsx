import { useLocation } from "react-router-dom";
import RecurrentForecastingLab from "./RecurrentForecastingLab";
import GRUForecastingApprovedPage from "./GRUForecastingApprovedPage";

export default function GRUForecastingPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get("advanced") === "1" ? (
    <RecurrentForecastingLab mode="gru" />
  ) : (
    <GRUForecastingApprovedPage />
  );
}
