import TimeSeriesWorkbench from "../../../features/time-series-studio/TimeSeriesWorkbench";
import { useLocation } from "react-router-dom";
import RecurrentForecastingLab from "./RecurrentForecastingLab";

export default function RNNForecastingPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get("advanced") === "1" ? (
    <RecurrentForecastingLab mode="rnn" />
  ) : (
    <TimeSeriesWorkbench kind="rnn-forecasting" />
  );
}
