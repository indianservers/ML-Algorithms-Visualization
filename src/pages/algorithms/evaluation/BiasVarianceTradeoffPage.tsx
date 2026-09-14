import RealAlgorithmMiniLab from '../shared/RealAlgorithmMiniLab';
import { useLocation } from 'react-router-dom';
import BiasVarianceApprovedPage from './BiasVarianceApprovedPage';

export default function BiasVarianceTradeoffPage() {
  const location = useLocation();
  return new URLSearchParams(location.search).get('advanced') === '1'
    ? <RealAlgorithmMiniLab mode="bias-variance" />
    : <BiasVarianceApprovedPage />;
}
