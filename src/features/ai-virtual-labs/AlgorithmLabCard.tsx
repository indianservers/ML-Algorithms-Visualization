import { useState } from 'react';
import { ArrowRight, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AiVirtualLab, UpcomingAiVirtualLab } from './catalog';
import { aiVirtualLabRoute } from './catalog';
import { AiAlgorithmIllustration } from './AiAlgorithmIllustration';

type Lab = AiVirtualLab | UpcomingAiVirtualLab;

const reinforcement = new Set(['policy-iteration', 'value-iteration', 'q-learning', 'sarsa-learning', 'markov-decision-process-explorer', 'monte-carlo-control', 'deep-q-network', 'pomdp-belief-state-planning']);
const game = new Set(['minimax-search', 'alpha-beta-pruning', 'expectimax-search', 'monte-carlo-tree-search']);
const probability = new Set(['bayesian-network-construction', 'bayesian-network-inference', 'hidden-markov-model-forward-viterbi', 'variable-elimination', 'belief-propagation', 'particle-filtering']);
const constraints = new Set(['csp-backtracking', 'forward-checking', 'ac-3-arc-consistency', 'min-conflicts']);
const evolution = new Set(['hill-climbing-search', 'local-beam-search', 'simulated-annealing', 'genetic-algorithm']);

function accentFor(slug: string) {
  if (reinforcement.has(slug)) return 'emerald';
  if (game.has(slug)) return 'amber';
  if (probability.has(slug)) return 'violet';
  if (constraints.has(slug)) return 'rose';
  if (evolution.has(slug)) return 'orange';
  return 'cyan';
}

const previewState: Record<string, [string, string]> = {
  'uniform-cost-search': ['Frontier sorted by g(n)', 'Optimal cost path locked'],
  'iterative-deepening-depth-first-search': ['Depth limit = 1', 'Depth limit grows to 3'],
  'a-star-search': ['Open set expands by f(n)', 'Lowest f path reaches goal'],
  'simplified-memory-bounded-a-star-search': ['Memory frontier is full', 'Worst leaf pruned; cost backed up'],
  'hill-climbing-search': ['Inspect neighboring slopes', 'Move to the best uphill neighbor'],
  'local-beam-search': ['Parallel candidates expand', 'Only best k successors survive'],
  'ai-depth-first-search': ['Push deepest child', 'Backtrack at a dead end'],
  'greedy-best-first-search': ['Compare heuristic h(n)', 'Select node closest to goal'],
  'breadth-first-search': ['Queue the next level', 'Complete the breadth wave'],
  'bidirectional-search': ['Two frontiers expand', 'Frontiers meet; path joins'],
  'beam-search': ['Score every child', 'Prune to the top k'],
  'depth-limited-search': ['DFS descends', 'Cutoff stops deeper expansion'],
  'iterative-deepening-a-star': ['Search inside f = 6', 'Raise threshold to f = 12'],
  'recursive-best-first-search': ['Follow current best path', 'Back up cost and try alternative'],
  'ao-star-search': ['Expand an AND/OR choice', 'Mark the solved subgraph'],
  'policy-iteration': ['Evaluate the current policy', 'Improve actions greedily'],
  'value-iteration': ['Apply one Bellman backup', 'Values propagate toward reward'],
  'q-learning': ['Take exploratory action', 'Update max next-action Q value'],
  'sarsa-learning': ['Follow the current policy', 'Update from the action actually taken'],
  'markov-decision-process-explorer': ['Sample action and transition', 'Collect reward and update value'],
  'monte-carlo-control': ['Complete an episode', 'Average returns and improve policy'],
  'deep-q-network': ['Sample replay experience', 'Network updates action values'],
  'pomdp-belief-state-planning': ['State is hidden', 'Observation updates belief mass'],
  'minimax-search': ['Evaluate terminal positions', 'Back up MIN and MAX values'],
  'alpha-beta-pruning': ['Update α and β bounds', 'Fade branches that cannot matter'],
  'expectimax-search': ['Weight chance outcomes', 'Back up expected utility'],
  'monte-carlo-tree-search': ['Select and roll out', 'Backpropagate visit values'],
  'simulated-annealing': ['High temperature accepts jumps', 'Cooling settles near a minimum'],
  'genetic-algorithm': ['Select fit chromosomes', 'Crossover and mutation create offspring'],
  'bayesian-network-construction': ['Connect dependent variables', 'Factorization updates'],
  'bayesian-network-inference': ['Clamp an evidence node', 'Posterior probabilities shift'],
  'hidden-markov-model-forward-viterbi': ['Forward probabilities flow', 'Viterbi path is decoded'],
  'variable-elimination': ['Multiply related factors', 'Sum out the hidden variable'],
  'belief-propagation': ['Send local factor messages', 'Marginal beliefs converge'],
  'particle-filtering': ['Weight particles by observation', 'Resample around likely state'],
  'csp-backtracking': ['Assign the next variable', 'Conflict triggers an undo'],
  'forward-checking': ['Commit one assignment', 'Remove inconsistent future values'],
  'ac-3-arc-consistency': ['Pop an arc from the queue', 'Delete values without support'],
  'min-conflicts': ['Find an attacked queen', 'Move it to reduce conflicts'],
};

export function AlgorithmPreview({ active, onToggle, title }: { active: boolean; onToggle: () => void; title: string }) {
  return <button
    className="avl-preview-button"
    type="button"
    aria-pressed={active}
    aria-label={`${active ? 'Reset' : 'Preview'} ${title} animation`}
    onClick={onToggle}
  >
    {active ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
    <span>{active ? 'Reset' : 'Preview'}</span>
  </button>;
}

export function AlgorithmLabCard({ lab, description }: { lab: Lab; description: string }) {
  const [previewing, setPreviewing] = useState(false);
  const upcoming = 'family' in lab;
  const states = previewState[lab.slug] ?? ['Inspect the algorithm state', 'Advance to the next decision'];

  return <article className={`avl-card avl-accent-${accentFor(lab.slug)} ${previewing ? 'is-previewing' : ''}`} data-testid={`algorithm-card-${lab.slug}`}>
    <Link className="avl-card-link" to={aiVirtualLabRoute(lab.slug)} aria-label={`Launch ${lab.title} lab`}>
      <div className="avl-card-visual">
        <span className="avl-status">{upcoming ? 'Upcoming' : 'Advanced'}</span>
        <AiAlgorithmIllustration slug={lab.slug} family={upcoming ? lab.family : undefined} previewing={previewing} />
        <span className="avl-stage" aria-live="polite"><i />{previewing ? states[1] : states[0]}</span>
      </div>
      <div className="avl-card-copy">
        <div><h2>{lab.title}</h2><p>{description}</p></div>
        <span className="avl-launch">Launch Lab <ArrowRight aria-hidden="true" /></span>
      </div>
    </Link>
    <AlgorithmPreview active={previewing} title={lab.title} onToggle={() => setPreviewing(value => !value)} />
  </article>;
}

