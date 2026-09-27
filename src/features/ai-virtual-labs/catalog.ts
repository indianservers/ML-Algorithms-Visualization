export type AiVirtualLab = {
  slug: string;
  title: string;
  summary: string;
  bundle: string;
  sourceKey: string;
};

export const aiVirtualLabs: AiVirtualLab[] = [
  { slug: 'uniform-cost-search', title: 'Uniform Cost Search', summary: 'Find least-cost paths through weighted graphs.', bundle: 'weighted-search', sourceKey: 'ucs' },
  { slug: 'iterative-deepening-depth-first-search', title: 'Iterative Deepening Depth First Search', summary: 'Explore successive depth limits and the search stack.', bundle: 'weighted-search', sourceKey: 'iddfs' },
  { slug: 'a-star-search', title: 'A* Search', summary: 'Balance path cost and heuristic estimates.', bundle: 'weighted-search', sourceKey: 'astar' },
  { slug: 'simplified-memory-bounded-a-star-search', title: 'Simplified Memory-Bounded A* Search', summary: 'Search with a limited frontier and backed-up costs.', bundle: 'bounded-search', sourceKey: 'sma' },
  { slug: 'hill-climbing-search', title: 'Hill Climbing Search', summary: 'Inspect neighbors and local optima.', bundle: 'bounded-search', sourceKey: 'hill' },
  { slug: 'local-beam-search', title: 'Local Beam Search', summary: 'Keep the best candidates across parallel searches.', bundle: 'bounded-search', sourceKey: 'local-beam' },
  { slug: 'policy-iteration', title: 'Policy Iteration', summary: 'Evaluate and improve a gridworld policy.', bundle: 'sequential-models', sourceKey: 'policy' },
  { slug: 'value-iteration', title: 'Value Iteration', summary: 'Apply Bellman updates until values converge.', bundle: 'sequential-models', sourceKey: 'value' },
  { slug: 'q-learning', title: 'Q Learning', summary: 'Train an agent from state-action rewards.', bundle: 'heuristic-search', sourceKey: 'qlearning' },
  { slug: 'ai-depth-first-search', title: 'AI Depth First Search', summary: 'Follow stack expansion and backtracking.', bundle: 'heuristic-search', sourceKey: 'dfs' },
  { slug: 'greedy-best-first-search', title: 'Greedy Best First Search', summary: 'Prioritize nodes by estimated goal distance.', bundle: 'heuristic-search', sourceKey: 'greedy' },
  { slug: 'minimax-search', title: 'Minimax Search', summary: 'Back up game-tree values for optimal play.', bundle: 'bayesian-game-search', sourceKey: 'minimax' },
  { slug: 'bayesian-network-construction', title: 'Construction of Bayesian Network', summary: 'Edit variables, edges, and conditional probabilities.', bundle: 'bayesian-game-search', sourceKey: 'construction' },
  { slug: 'bayesian-network-inference', title: 'Inference from Bayesian Network', summary: 'Compute posteriors from evidence and saved networks.', bundle: 'bayesian-game-search', sourceKey: 'inference' },
  { slug: 'breadth-first-search', title: 'Breadth First Search', summary: 'Explore a graph level by level with a queue.', bundle: 'graph-search', sourceKey: 'bfs' },
  { slug: 'bidirectional-search', title: 'Bidirectional Search', summary: 'Meet two frontiers and reconstruct the path.', bundle: 'graph-search', sourceKey: 'bidirectional' },
  { slug: 'beam-search', title: 'Beam Search', summary: 'Keep the best puzzle successors at each iteration.', bundle: 'graph-search', sourceKey: 'beam' },
  { slug: 'simulated-annealing', title: 'Simulated Annealing', summary: 'Escape local minima with controlled randomness.', bundle: 'optimization-search', sourceKey: 'annealing' },
  { slug: 'genetic-algorithm', title: 'Genetic Algorithm', summary: 'Evolve a population with selection and mutation.', bundle: 'optimization-search', sourceKey: 'genetic' },
  { slug: 'monte-carlo-tree-search', title: 'Monte Carlo Tree Search', summary: 'Explore game trees through simulated rollouts.', bundle: 'optimization-search', sourceKey: 'mcts' },
  { slug: 'alpha-beta-pruning', title: 'Alpha-Beta Pruning', summary: 'Skip game-tree branches that cannot change the choice.', bundle: 'decision-processes', sourceKey: 'alpha-beta' },
  { slug: 'markov-decision-process-explorer', title: 'Markov Decision Process Explorer', summary: 'Inspect transitions, rewards, and Bellman updates.', bundle: 'decision-processes', sourceKey: 'mdp' },
  { slug: 'sarsa-learning', title: 'SARSA Learning', summary: 'Learn action values from the next action taken.', bundle: 'decision-processes', sourceKey: 'sarsa' },
  { slug: 'hidden-markov-model-forward-viterbi', title: 'Hidden Markov Model – Forward & Viterbi Algorithms', summary: 'Trace observation likelihoods and most likely paths.', bundle: 'sequential-models', sourceKey: 'hmm' },
];

export const aiVirtualLabRoute = (slug: string) => `/ai-algorithms/${slug}`;

export function getAiVirtualLab(slug: string) {
  return aiVirtualLabs.find((lab) => lab.slug === slug);
}
