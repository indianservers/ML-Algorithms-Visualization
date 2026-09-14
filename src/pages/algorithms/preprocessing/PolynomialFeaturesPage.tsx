import { useLocation } from 'react-router-dom';
import RealAlgorithmMiniLab from '../shared/RealAlgorithmMiniLab';
import PolynomialFeaturesApprovedPage from './PolynomialFeaturesApprovedPage';

export default function PolynomialFeaturesPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('advanced') === '1'
    ? <RealAlgorithmMiniLab mode="polynomial-features" />
    : <PolynomialFeaturesApprovedPage />;
}
