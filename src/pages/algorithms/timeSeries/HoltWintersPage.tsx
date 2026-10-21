import TimeSeriesWorkbench from "../../../features/time-series-studio/TimeSeriesWorkbench";
import { useLocation } from 'react-router-dom';
import RealAlgorithmMiniLab from '../shared/RealAlgorithmMiniLab';

export default function HoltWintersPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('advanced') === '1'
    ? <RealAlgorithmMiniLab mode="holt-winters" />
    : <TimeSeriesWorkbench kind="holt-winters" />;
}
