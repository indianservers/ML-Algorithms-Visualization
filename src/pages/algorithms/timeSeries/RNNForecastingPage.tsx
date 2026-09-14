import { useLocation } from "react-router-dom";
import RecurrentForecastingLab from "./RecurrentForecastingLab";
import RNNForecastingApprovedPage from "./RNNForecastingApprovedPage";

export default function RNNForecastingPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get("advanced") === "1" ? (
    <RecurrentForecastingLab mode="rnn" />
  ) : (
    <RNNForecastingApprovedPage />
  );
}
