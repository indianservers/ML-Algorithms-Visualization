export type AiVirtualLab = {
  slug: string;
  title: string;
  summary: string;
  bundle: string;
  sourceKey: string;
};

export type UpcomingAiVirtualLab = {
  slug: string;
  title: string;
  summary: string;
  family: 'Search' | 'Constraint Solving' | 'Game Search' | 'Probabilistic Reasoning' | 'Reinforcement Learning';
  concepts: [string, string, string];
  plannedInteraction: string;
  relatedSlug: string;
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

export const upcomingAiVirtualLabs: UpcomingAiVirtualLab[] = [
  { slug: 'depth-limited-search', title: 'Depth-Limited Search', summary: 'See how a depth cutoff prevents an unbounded DFS search.', family: 'Search', concepts: ['Depth cutoff', 'Cutoff versus failure', 'Completeness'], plannedInteraction: 'Change the limit and trace each stack expansion.', relatedSlug: 'iterative-deepening-depth-first-search' },
  { slug: 'iterative-deepening-a-star', title: 'Iterative Deepening A*', summary: 'Repeat depth-first passes under increasing f-cost bounds.', family: 'Search', concepts: ['f-cost bound', 'Heuristic', 'Memory use'], plannedInteraction: 'Raise the cost bound and compare explored nodes with A*.', relatedSlug: 'a-star-search' },
  { slug: 'recursive-best-first-search', title: 'Recursive Best-First Search', summary: 'Follow best-first paths while backing up alternative costs.', family: 'Search', concepts: ['f-limit', 'Backtracking', 'Linear memory'], plannedInteraction: 'Step through recursive calls and watch f-limits change.', relatedSlug: 'a-star-search' },
  { slug: 'ao-star-search', title: 'AO* Search', summary: 'Solve AND/OR graphs where some goals require multiple subgoals.', family: 'Search', concepts: ['AND/OR graph', 'Heuristic revision', 'Solution subgraph'], plannedInteraction: 'Expand AND and OR nodes and update the chosen solution graph.', relatedSlug: 'a-star-search' },
  { slug: 'csp-backtracking', title: 'Constraint Satisfaction Backtracking', summary: 'Assign variables while avoiding conflicts with earlier choices.', family: 'Constraint Solving', concepts: ['Variables and domains', 'Constraints', 'Backtracking'], plannedInteraction: 'Color a map step by step and inspect the search tree.', relatedSlug: 'ai-depth-first-search' },
  { slug: 'forward-checking', title: 'Forward Checking', summary: 'Prune future variable domains after each assignment.', family: 'Constraint Solving', concepts: ['Domain pruning', 'Dead ends', 'Constraint propagation'], plannedInteraction: 'Watch remaining values disappear as variables are assigned.', relatedSlug: 'ai-depth-first-search' },
  { slug: 'ac-3-arc-consistency', title: 'AC-3 Arc Consistency', summary: 'Revise constraint arcs until every value has support.', family: 'Constraint Solving', concepts: ['Arc queue', 'Revise operation', 'Arc consistency'], plannedInteraction: 'Inspect the arc queue and each domain revision.', relatedSlug: 'ai-depth-first-search' },
  { slug: 'min-conflicts', title: 'Min-Conflicts', summary: 'Repair a complete assignment by reducing violated constraints.', family: 'Constraint Solving', concepts: ['Conflicted variable', 'Local repair', 'Restarts'], plannedInteraction: 'Move queens on a board and graph the conflict count.', relatedSlug: 'hill-climbing-search' },
  { slug: 'expectimax-search', title: 'Expectimax Search', summary: 'Choose actions in game trees that include chance outcomes.', family: 'Game Search', concepts: ['Chance node', 'Expected utility', 'Decision node'], plannedInteraction: 'Change outcome probabilities and back up expected values.', relatedSlug: 'minimax-search' },
  { slug: 'variable-elimination', title: 'Variable Elimination', summary: 'Answer Bayesian queries by multiplying and summing factors.', family: 'Probabilistic Reasoning', concepts: ['Factor', 'Elimination order', 'Marginalization'], plannedInteraction: 'Eliminate variables and inspect intermediate factor tables.', relatedSlug: 'bayesian-network-inference' },
  { slug: 'belief-propagation', title: 'Belief Propagation', summary: 'Pass local messages to estimate beliefs in a graphical model.', family: 'Probabilistic Reasoning', concepts: ['Messages', 'Factor graph', 'Marginal belief'], plannedInteraction: 'Trace messages and compare beliefs before and after evidence.', relatedSlug: 'bayesian-network-inference' },
  { slug: 'particle-filtering', title: 'Particle Filtering', summary: 'Track hidden state with weighted samples over time.', family: 'Probabilistic Reasoning', concepts: ['Particles', 'Weights', 'Resampling'], plannedInteraction: 'Advance observations and watch particles move and resample.', relatedSlug: 'hidden-markov-model-forward-viterbi' },
  { slug: 'pomdp-belief-state-planning', title: 'POMDP Belief-State Planning', summary: 'Plan actions when the true state is only partly observed.', family: 'Probabilistic Reasoning', concepts: ['Belief state', 'Observation model', 'Policy'], plannedInteraction: 'Update a belief distribution after actions and observations.', relatedSlug: 'markov-decision-process-explorer' },
  { slug: 'monte-carlo-control', title: 'Monte Carlo Control', summary: 'Improve a policy from returns at the end of complete episodes.', family: 'Reinforcement Learning', concepts: ['Episode return', 'Action value', 'Policy improvement'], plannedInteraction: 'Run episodes and compare first-visit returns with TD updates.', relatedSlug: 'q-learning' },
  { slug: 'deep-q-network', title: 'Deep Q-Network', summary: 'Approximate action values with a neural network and replay buffer.', family: 'Reinforcement Learning', concepts: ['Q-network', 'Experience replay', 'Target network'], plannedInteraction: 'Inspect replay samples, target updates, and changing Q estimates.', relatedSlug: 'q-learning' },
];

export const allAiVirtualLabs = [...aiVirtualLabs, ...upcomingAiVirtualLabs];

export const aiVirtualLabRoute = (slug: string) => `/ai-algorithms/${slug}`;

export function getAiVirtualLab(slug: string) {
  return allAiVirtualLabs.find((lab) => lab.slug === slug);
}
