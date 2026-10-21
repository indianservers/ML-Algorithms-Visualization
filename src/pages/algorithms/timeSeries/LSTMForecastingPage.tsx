import TimeSeriesWorkbench from "../../../features/time-series-studio/TimeSeriesWorkbench";
import { useLocation } from "react-router-dom";
import RecurrentForecastingLab from "./RecurrentForecastingLab";

export default function LSTMForecastingPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get("advanced") === "1" ? (
    <RecurrentForecastingLab mode="lstm" />
  ) : (
    <TimeSeriesWorkbench kind="lstm-forecasting" />
  );
}
