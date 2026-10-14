import { Activity, BookOpen, Boxes, BrainCircuit, Eye, FlaskConical, Gauge, Heart, Layers, Lightbulb, MessageSquare, Network, ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp } from 'lucide-react';
import { navigationData } from './navigation';

export const studios = [
  { id: 'supervised', title: 'Supervised Learning', icon: Boxes, categories: ['Supervised - Regression', 'Supervised - Classification'] },
  { id: 'unsupervised', title: 'Unsupervised Learning', icon: Layers, categories: ['Clustering'] },
  { id: 'reinforcement', title: 'Reinforcement Learning', icon: Network, categories: ['Reinforcement Learning'] },
  { id: 'computer-vision', title: 'Computer Vision', icon: Eye, categories: ['Computer Vision'] },
  { id: 'deep-learning', title: 'Deep Learning', icon: Sparkles, categories: ['Deep Learning'] },
  { id: 'ai-virtual-labs', title: 'AI Virtual Labs', icon: BrainCircuit, categories: ['AI Algorithms Virtual Labs'] },
  { id: 'dimensionality', title: 'Dimensionality Reduction', icon: Layers, categories: ['Dimensionality Reduction'] },
  { id: 'time-series', title: 'Time Series', icon: Activity, categories: ['Time Series'] },
  { id: 'nlp', title: 'NLP & Text', icon: MessageSquare, categories: ['NLP'] },
  { id: 'evaluation', title: 'Evaluation', icon: Gauge, categories: ['Evaluation'] },
  { id: 'preprocessing', title: 'Preprocessing', icon: SlidersHorizontal, categories: ['Preprocessing'] },
  { id: 'recommendation', title: 'Recommendation', icon: Heart, categories: ['Recommendation'] },
  { id: 'explainability', title: 'Explainability', icon: Lightbulb, categories: ['Explainability'] },
  { id: 'optimization', title: 'Optimization', icon: TrendingUp, categories: ['Optimization'] },
  { id: 'ensemble', title: 'Ensemble Methods', icon: Layers, categories: ['Ensemble'] },
  { id: 'probabilistic', title: 'Probabilistic Models', icon: BrainCircuit, categories: ['Probabilistic'] },
  { id: 'deployment', title: 'Deployment', icon: ShieldCheck, categories: ['Deployment'] },
  { id: 'algorithm-lab', title: 'Algorithm Lab', icon: FlaskConical, categories: ['Lab'] },
  { id: 'terms-studio', title: 'Terms Studio', icon: BookOpen, categories: ['Terms Studio'] },
];
export function studioUrl(id: string) {
  return id === 'computer-vision' ? '/ml/computer-vision' : id === 'terms-studio' ? '/ml/terms-studio' : `/studios/${id}`;
}
export function studioItems(id: string) {
  const studio = studios.find(s => s.id === id);
  return navigationData.filter(g => studio?.categories.includes(g.category)).flatMap(g => g.items.map(item => ({ ...item, category: g.category, categoryIcon: g.icon })));
}
