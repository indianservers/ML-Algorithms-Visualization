import { useLocation } from 'react-router-dom';
import RealAlgorithmMiniLab from '../shared/RealAlgorithmMiniLab';
import HoltWintersApprovedPage from './HoltWintersApprovedPage';

export default function HoltWintersPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('advanced') === '1'
    ? <RealAlgorithmMiniLab mode="holt-winters" />
    : <HoltWintersApprovedPage />;
}
