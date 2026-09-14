import { useLocation } from 'react-router-dom';
import RealAlgorithmMiniLab from '../shared/RealAlgorithmMiniLab';
import FeatureSelectionApprovedPage from './FeatureSelectionApprovedPage';

export default function FeatureSelectionPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('advanced') === '1'
    ? <RealAlgorithmMiniLab mode="feature-selection" />
    : <FeatureSelectionApprovedPage />;
}
