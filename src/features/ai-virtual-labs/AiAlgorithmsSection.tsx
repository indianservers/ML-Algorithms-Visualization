import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { allAiVirtualLabs, aiVirtualLabs, aiVirtualLabRoute } from './catalog';
import { AiAlgorithmIllustration } from './AiAlgorithmIllustration';
import './AiAlgorithmsSection.css';

const terms: Record<string, string> = {
  'uniform-cost-search': 'ucs dijkstra weighted graph least cost',
  'iterative-deepening-depth-first-search': 'iddfs ids depth limited uninformed tree',
  'a-star-search': 'astar a* heuristic f g h shortest path grid',
  'simplified-memory-bounded-a-star-search': 'sma* sma star memory heuristic graph',
  'hill-climbing-search': 'local optimization gradient peak',
  'local-beam-search': 'parallel heuristic optimization k best',
  'policy-iteration': 'reinforcement learning rl mdp bellman policy',
  'value-iteration': 'reinforcement learning rl mdp bellman heatmap',
  'q-learning': 'qlearning reinforcement learning rl temporal difference',
  'ai-depth-first-search': 'dfs graph tree stack',
  'greedy-best-first-search': 'heuristic goal search',
  'minimax-search': 'game tree adversarial decision',
  'bayesian-network-construction': 'bayes probabilistic graphical model',
  'bayesian-network-inference': 'bayes probability posterior evidence',
  'breadth-first-search': 'bfs queue graph tree level',
  'bidirectional-search': 'two frontiers meet graph bfs',
  'beam-search': 'heuristic k best candidates',
  'simulated-annealing': 'temperature optimization stochastic',
  'genetic-algorithm': 'evolution dna crossover mutation population',
  'monte-carlo-tree-search': 'mcts game rollout simulation',
  'alpha-beta-pruning': 'minimax game tree cut branch',
  'markov-decision-process-explorer': 'mdp markov reinforcement transition reward policy',
  'sarsa-learning': 'reinforcement learning rl on policy temporal difference',
  'hidden-markov-model-forward-viterbi': 'hmm viterbi markov sequence hidden states observation',
};

const cardDescriptions: Record<string, string> = {
  'uniform-cost-search': 'Find least-cost paths in weighted graphs',
  'iterative-deepening-depth-first-search': 'Depth-limited search with increasing depth',
  'a-star-search': 'Find optimal paths using heuristics',
  'simplified-memory-bounded-a-star-search': 'Search with limited memory',
  'hill-climbing-search': 'Navigate to local and global optima',
  'local-beam-search': 'Keep the best k states across search levels',
  'policy-iteration': 'Solve and improve a dynamic policy',
  'value-iteration': 'Compute optimal value functions',
  'q-learning': 'Learn optimal actions through experience',
  'ai-depth-first-search': 'Explore deep spaces systematically',
  'greedy-best-first-search': 'Prioritize nodes by estimated cost',
  'minimax-search': 'Optimal decisions in two-player games',
  'bayesian-network-construction': 'Build probabilistic models of uncertain systems',
  'bayesian-network-inference': 'Query and compute probabilities',
  'breadth-first-search': 'Explore graphs level by level',
  'bidirectional-search': 'Search from both directions',
  'beam-search': 'Keep the top k candidates at each step',
  'simulated-annealing': 'Escape local optima using probabilistic moves',
  'genetic-algorithm': 'Evolve populations with selection and mutation',
  'monte-carlo-tree-search': 'Explore game trees with simulations',
  'alpha-beta-pruning': 'Optimize tree search by pruning branches',
  'markov-decision-process-explorer': 'Inspect transitions, rewards and policies',
  'sarsa-learning': 'Learn action values from on-policy updates',
  'hidden-markov-model-forward-viterbi': 'Decode sequences from hidden states',
  'depth-limited-search': 'Stop DFS at a chosen depth',
  'iterative-deepening-a-star': 'Repeat A* with rising cost bounds',
  'recursive-best-first-search': 'Best-first search with linear memory',
  'ao-star-search': 'Solve AND/OR goal graphs',
  'csp-backtracking': 'Assign values without conflicts',
  'forward-checking': 'Prune future variable domains',
  'ac-3-arc-consistency': 'Enforce arc consistency',
  'min-conflicts': 'Repair conflicting assignments',
  'expectimax-search': 'Plan around chance outcomes',
  'variable-elimination': 'Sum out Bayesian variables',
  'belief-propagation': 'Pass probabilistic messages',
  'particle-filtering': 'Track hidden state with samples',
  'pomdp-belief-state-planning': 'Plan under partial observation',
  'monte-carlo-control': 'Improve policy from episodes',
  'deep-q-network': 'Learn action values with a neural net',
};

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9*]+/g, ' ').trim();
}

function Title({ title, query }: { title: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{title}</>;
  const at = title.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (at < 0) return <>{title}</>;
  return <>{title.slice(0, at)}<mark>{title.slice(at, at + needle.length)}</mark>{title.slice(at + needle.length)}</>;
}

export function AiAlgorithmsSection({ globalRoutes }: { globalRoutes?: string[] }) {
  const [query, setQuery] = React.useState('');
  const [collapsed, setCollapsed] = React.useState(true);
  const navigate = useNavigate();
  const routeSet = React.useMemo(() => globalRoutes ? new Set(globalRoutes) : null, [globalRoutes]);
  const words = normalized(query).split(/\s+/).filter(Boolean);
  const labs = allAiVirtualLabs.filter((lab) => {
    if (routeSet && !routeSet.has(aiVirtualLabRoute(lab.slug))) return false;
    const text = normalized(`${lab.title} ${lab.summary} ${'family' in lab ? `${lab.family} ${lab.concepts.join(' ')}` : terms[lab.slug] ?? ''}`);
    return words.every((word) => text.includes(word));
  });
  const isCollapsed = collapsed && !query && !globalRoutes;
  const featuredSlugs = ['a-star-search', 'hill-climbing-search', 'q-learning', 'minimax-search'];
  const visibleLabs = isCollapsed ? featuredSlugs.flatMap(slug => labs.filter(lab => lab.slug === slug)) : labs;

  return <section className="hl-ai-section" aria-labelledby="hl-ai-title">
    <header className="hl-ai-header">
      <span className="hl-ai-mark" aria-hidden="true"><BrainCircuit /></span>
      <div className="hl-ai-heading"><h3 id="hl-ai-title">AI Algorithms Virtual Labs</h3><p>Explore · Visualize · Experiment · Master popular AI algorithms</p></div>
      <div className="hl-ai-tools">
        {!isCollapsed && <label className="hl-ai-search"><Search aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search algorithms..." aria-label="Search AI algorithms" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear AI algorithm search"><X /></button>}</label>}
        {isCollapsed && <span className="hl-ai-count">{aiVirtualLabs.length} Labs · {allAiVirtualLabs.length - aiVirtualLabs.length} Upcoming</span>}
        <button className="hl-ai-toggle" type="button" onClick={() => setCollapsed(!collapsed)} aria-expanded={!isCollapsed} aria-controls="hl-ai-grid-body">{isCollapsed ? 'Expand' : 'Collapse'}<ChevronDown aria-hidden="true" /></button>
      </div>
    </header>
    <div className="hl-ai-body-wrap" id="hl-ai-grid-body">
      <div className="hl-ai-body">
        {labs.length ? <div className="hl-ai-grid">{visibleLabs.map((lab) => <Link className={`hl-ai-card hl-ai-card-${'family' in lab ? 'upcoming' : lab.sourceKey}`} key={lab.slug} to={aiVirtualLabRoute(lab.slug)} aria-label={`${'family' in lab ? 'View upcoming' : 'Open'} ${lab.title} lab`} onKeyDown={(event) => { if (event.key === ' ') { event.preventDefault(); navigate(aiVirtualLabRoute(lab.slug)); } }}>
          <span className="hl-ai-copy"><strong><Title title={lab.title} query={query} /></strong><span>{cardDescriptions[lab.slug] ?? lab.summary}</span></span>
          <AiAlgorithmIllustration slug={lab.slug} family={'family' in lab ? lab.family : undefined} />
          <span className="hl-ai-card-actions" aria-hidden="true"><span className="hl-ai-open">{'family' in lab ? 'Upcoming' : 'Open Lab'}</span><span className="hl-ai-arrow"><ChevronRight /></span></span>
          {'family' in lab && <span className="hl-ai-upcoming-tag">{lab.family}</span>}
          {'sourceKey' in lab && lab.sourceKey === 'astar' && <span className="hl-ai-hint">✦ Try different heuristics and see the path change!</span>}
        </Link>)}</div> : <div className="hl-ai-empty"><Search aria-hidden="true" /><strong>No algorithms found</strong><span>Try another algorithm name, concept, or category.</span><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
      </div>
    </div>
  </section>;
}
