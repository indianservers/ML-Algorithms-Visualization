import { aiVirtualLabs } from './catalog';

export type LabTheory = {
  idea: string;
  how: string[];
  rule: string;
  example: string;
  observe: string;
  caution: string;
};

const theory: Record<string, LabTheory> = {
  'uniform-cost-search': {
    idea: 'The cheapest route discovered so far gets explored next. A path with fewer edges can lose to a longer but cheaper path.',
    how: ['Start with cost 0 and put the start node in a priority queue.', 'Remove the node with the smallest total path cost, then relax each outgoing edge.', 'Stop when the goal is removed from the queue; with nonnegative edge costs, its cost is optimal.'],
    rule: 'priority(n) = g(n), the total cost from start to n',
    example: 'If Start → A → Goal costs 2 + 9 = 11 and Start → B → C → Goal costs 3 + 2 + 2 = 7, uniform-cost search returns the three-edge route costing 7.',
    observe: 'Change an edge weight, then compare the queue order and the final route. Which node has the lowest g value before each expansion?',
    caution: 'The optimality guarantee assumes nonnegative edge costs. Expanding a goal when first generated can be too early; wait until it is removed from the queue.',
  },
  'iterative-deepening-depth-first-search': {
    idea: 'Repeat depth-first search with limits 0, 1, 2, … until the goal appears. This combines shallowest-solution behavior with a small search stack.',
    how: ['Run depth-limited DFS at the current limit.', 'If the goal is absent, raise the limit and restart from the root.', 'Record the first limit that reaches the goal and trace that pass.'],
    rule: 'space ≈ O(bd); time ≈ O(bᵈ) for branching factor b and solution depth d',
    example: 'A goal at depth 3 is not reached at limits 0, 1, or 2. The depth-3 pass visits it and returns a shallowest path when edges have equal cost.',
    observe: 'Step through two successive limits. Notice which upper-level nodes are revisited and how the stack stays bounded by depth.',
    caution: 'Repeated visits are expected. Iterative deepening minimizes depth, not weighted path cost, and needs cycle handling in graph search.',
  },
  'a-star-search': {
    idea: 'A* balances the cost already paid with an estimate of the cost still to go.',
    how: ['Maintain g for the best known route to each node.', 'Estimate remaining cost with h and expand the smallest f = g + h.', 'Update a node if a cheaper route reaches it; finish when the goal is selected under the heuristic assumptions.'],
    rule: 'f(n) = g(n) + h(n)',
    example: 'Node A has g = 4 and h = 3, so f = 7. Node B has g = 2 and h = 8, so f = 10. A is expanded first even though B was cheaper to reach.',
    observe: 'Compare A* with uniform-cost and greedy search on the same graph. Set h to zero to see A* behave like uniform-cost search.',
    caution: 'An admissible heuristic never overestimates the remaining cost. In graph search, consistency makes closed-node handling simpler; an inflated heuristic can sacrifice optimality.',
  },
  'simplified-memory-bounded-a-star-search': {
    idea: 'SMA* uses A*-like priorities while keeping only as many search nodes as memory allows.',
    how: ['Expand the most promising frontier leaf by f cost.', 'When memory fills, discard the least promising leaf.', 'Back up its best forgotten cost to the parent so the branch can be regenerated later.'],
    rule: 'f(child) = max(g(child) + h(child), f(parent)); back up forgotten f values',
    example: 'With room for only three leaves, the worst leaf is forgotten. If the remaining branches later look worse, its parent may regenerate that forgotten route.',
    observe: 'Lower the memory bound and watch which frontier branch disappears and whether it returns.',
    caution: 'A tight memory limit can force repeated work. The algorithm can only find a solution if enough memory exists to retain a solution path.',
  },
  'hill-climbing-search': {
    idea: 'Move to a better neighboring state until no neighbor improves the current score.',
    how: ['Evaluate the current state and its neighbors.', 'Choose an improving neighbor, often the best one.', 'Repeat until a goal, plateau, or local optimum stops progress.'],
    rule: 'next = argmax score(neighbor) when maximizing',
    example: 'At a hill of height 8, nearby states score 7, 6, and 5. The search stops, even if a taller hill of height 12 lies beyond a short downhill move.',
    observe: 'Change the starting point and compare the final peak. Can you identify a plateau or a local optimum?',
    caution: 'A local optimum is not necessarily the global optimum. Random restarts or simulated annealing can help explore other basins.',
  },
  'local-beam-search': {
    idea: 'Keep several promising states at once, then let all of them propose successors.',
    how: ['Begin with k candidate states.', 'Generate neighbors of all current candidates.', 'Keep the best k successors for the next round.'],
    rule: 'beamₜ₊₁ = best k states from successors(beamₜ)',
    example: 'With beam width 2, four candidate scores 9, 7, 5, and 4 leave only 9 and 7 for the next iteration.',
    observe: 'Increase beam width and see whether diversity or solution quality improves.',
    caution: 'All candidates can collapse into one region. Keeping only k states makes the search incomplete, even when a solution exists.',
  },
  'policy-iteration': {
    idea: 'Alternate asking “How good is this policy?” and “Can an action improve it?” until the policy stops changing.',
    how: ['Choose an initial action for each state.', 'Evaluate expected return when following those actions.', 'Replace each action with one that maximizes expected one-step return plus future value; repeat.'],
    rule: 'Vπ(s) = Σ P(s′|s,π(s))[R(s,π(s),s′) + γVπ(s′)]',
    example: 'If going right yields expected return 6 while going down yields 8 under the current values, improvement changes that state’s action to down.',
    observe: 'Step through evaluation and improvement separately. Count how many cells change policy after each pass.',
    caution: 'Evaluation estimates the current policy; improvement chooses a better one. A single evaluation sweep is usually only an approximation.',
  },
  'value-iteration': {
    idea: 'Update each state toward the return of its best action, then derive a policy from the resulting values.',
    how: ['Initialize state values.', 'For each state, compute the expected return for every available action.', 'Keep the maximum action return and repeat until values change very little.'],
    rule: 'Vₖ₊₁(s) = maxₐ Σ P(s′|s,a)[R(s,a,s′) + γVₖ(s′)]',
    example: 'If two actions have expected one-step-plus-future returns 4.2 and 5.1, the next value for that state is 5.1.',
    observe: 'Watch reward information spread backward from the goal across successive sweeps.',
    caution: 'A discount factor near 1 can slow convergence. Values and the derived policy may stabilize at different times.',
  },
  'q-learning': {
    idea: 'Learn the value of each state-action pair from experience without knowing transition probabilities in advance.',
    how: ['Choose an action, often with ε-greedy exploration.', 'Observe the reward and next state.', 'Move the chosen Q value toward reward plus the largest next-state Q value.'],
    rule: 'Q(s,a) ← Q(s,a) + α[r + γ maxₐ′ Q(s′,a′) − Q(s,a)]',
    example: 'With old Q = 0, reward = −1, γ = 0.9, max next Q = 2, and α = 0.5, the target is 0.8 and the new Q is 0.4.',
    observe: 'Predict an action, step the agent, and match the reward, target, and updated table cell.',
    caution: 'The max term describes the greedy target even when the agent actually explores. Sparse rewards and low exploration can leave useful routes unvisited.',
  },
  'ai-depth-first-search': {
    idea: 'Explore one branch as far as possible before backtracking to try alternatives.',
    how: ['Push the start node onto a stack.', 'Pop the newest node and add an unvisited successor.', 'Backtrack when the branch ends; continue until the goal is found or the stack is empty.'],
    rule: 'frontier = LIFO stack',
    example: 'From A with neighbors B and C, DFS may follow A → B → D all the way down before it ever visits C.',
    observe: 'Trace the stack and the backtrack point. Change neighbor order to see how traversal order changes.',
    caution: 'DFS does not generally return the shortest path. Mark visited states or impose a depth bound to avoid cycles.',
  },
  'greedy-best-first-search': {
    idea: 'Follow the node that appears closest to the goal according to a heuristic.',
    how: ['Estimate h for every frontier node.', 'Expand the node with the smallest h.', 'Insert newly discovered neighbors and repeat.'],
    rule: 'priority(n) = h(n)',
    example: 'A node estimated 2 steps from the goal is chosen before one estimated 5 steps away, regardless of the route cost already paid.',
    observe: 'Compare the order with A* after adding an expensive edge near the goal.',
    caution: 'Ignoring g can produce an expensive route. A misleading heuristic may draw the search into a dead end.',
  },
  'minimax-search': {
    idea: 'Choose a move assuming the opponent will choose the reply least favorable to you.',
    how: ['Generate a game tree to terminal states or a chosen depth.', 'Score leaves from the maximizing player’s viewpoint.', 'Back up maxima at MAX turns and minima at MIN turns.'],
    rule: 'V(MAX) = max child V; V(MIN) = min child V',
    example: 'Move A allows replies worth 3 and 8, so its worst case is 3. Move B allows 4 and 5, so its worst case is 4. MAX chooses B.',
    observe: 'Step from leaves to root and identify the opponent reply responsible for each backed-up value.',
    caution: 'Minimax assumes an adversarial opponent and accurate leaf scores. Depth-limited evaluation can miss tactics beyond the horizon.',
  },
  'bayesian-network-construction': {
    idea: 'Represent a joint probability distribution with a directed acyclic graph and a conditional table for each variable.',
    how: ['Choose variables and draw arrows for direct dependencies.', 'Ensure the arrows form no directed cycle.', 'Fill each variable’s conditional probability table for every parent configuration.'],
    rule: 'P(X₁,…,Xₙ) = ∏ᵢ P(Xᵢ | Parents(Xᵢ))',
    example: 'Rain → Wet Grass and Sprinkler → Wet Grass say that wet grass depends directly on both causes; a table gives P(Wet Grass | Rain, Sprinkler).',
    observe: 'Add an edge and inspect how the required probability table grows.',
    caution: 'An arrow describes a modeled dependence, not proof of causation. Every row of a conditional distribution must sum to 1.',
  },
  'bayesian-network-inference': {
    idea: 'Update a query probability after observing evidence in a Bayesian network.',
    how: ['Select a query variable and observed evidence.', 'Multiply the relevant conditional probabilities.', 'Sum over hidden variables and normalize the query outcomes.'],
    rule: 'P(Query | Evidence) = P(Query, Evidence) / P(Evidence)',
    example: 'If wet grass is observed, the probability of rain can increase, but the exact posterior depends on sprinkler behavior and the network tables.',
    observe: 'Toggle one observation and compare prior and posterior probabilities.',
    caution: 'Do not confuse P(Evidence | Query) with P(Query | Evidence). Explaining away can change one cause’s probability after observing another.',
  },
  'breadth-first-search': {
    idea: 'Visit all states at one depth before moving to the next depth.',
    how: ['Enqueue the start state.', 'Remove the oldest frontier state and enqueue its unvisited neighbors.', 'Continue until the goal is reached.'],
    rule: 'frontier = FIFO queue',
    example: 'If A connects to B and C, BFS processes B and C before their children at depth 2.',
    observe: 'Watch the queue and color the depth layers as they expand.',
    caution: 'BFS finds a shortest path in number of edges when edges are equally weighted. It can use substantial memory on wide graphs.',
  },
  'bidirectional-search': {
    idea: 'Grow one search from the start and one from the goal until the frontiers meet.',
    how: ['Initialize forward and backward frontiers.', 'Expand each side while recording parent links.', 'At a shared state, join the forward path with the reversed backward path.'],
    rule: 'two balanced frontiers can reduce work from roughly O(bᵈ) to O(b^(d/2))',
    example: 'A six-edge route can be found when each side has explored about three layers and reaches the same middle node.',
    observe: 'Identify the meeting state and reconstruct both halves of the route.',
    caution: 'Reverse search requires a way to generate predecessors. Meeting at the first arbitrary contact is not sufficient for every weighted-search variant.',
  },
  'beam-search': {
    idea: 'At each depth, retain only the best k candidate states according to a ranking function.',
    how: ['Expand the current layer.', 'Score all resulting candidates.', 'Discard all but the best k and continue to the next layer.'],
    rule: 'next layer = top-k successors by evaluation score',
    example: 'If k = 2 and successor scores are 4, 7, 9, and 3, only candidates 9 and 7 remain.',
    observe: 'Run the same puzzle with beam widths 1 and 4. Notice changes in memory and route quality.',
    caution: 'A discarded state cannot be recovered in ordinary beam search. It is fast and memory-limited but neither complete nor necessarily optimal.',
  },
  'simulated-annealing': {
    idea: 'Search for a low-energy solution while sometimes accepting a worse move. Early randomness helps escape local minima; cooling gradually favors refinement.',
    how: ['Start at a point with an initial temperature T and propose a nearby point.', 'Always accept a lower-energy proposal. For an uphill change ΔE > 0, accept with probability exp(−ΔE/T).', 'Lower T according to the cooling schedule; retain the best point seen, even if the current point later worsens.'],
    rule: 'P(accept) = 1 if ΔE ≤ 0; otherwise exp(−ΔE/T)',
    example: 'A proposal raising energy by 2 at T = 10 has acceptance probability e^(−0.2) ≈ 0.82. At T = 0.5 it falls to e^(−4) ≈ 0.018.',
    observe: 'Keep the objective and seed fixed. Compare a high and low initial temperature, then inspect ΔE, acceptance probability, random decision, and best-energy curve.',
    caution: 'The best solution is not guaranteed in a finite run. Cooling too fast can freeze the search in a local minimum; cooling too slowly spends more computation.',
  },
  'genetic-algorithm': {
    idea: 'Evolve a population of candidate solutions using selection, crossover, and mutation.',
    how: ['Evaluate each candidate with a fitness function.', 'Prefer better candidates as parents and recombine their genes.', 'Mutate some genes, form a new generation, and keep track of the best solution.'],
    rule: 'new population = selection → crossover → mutation → fitness evaluation',
    example: 'For bit strings, parents 111000 and 000111 cut after bit 3 can produce 111111. Mutation may flip one bit and add variation.',
    observe: 'Watch the leaderboard and diversity as mutation rate changes.',
    caution: 'High fitness does not prove global optimality. Too little variation can cause premature convergence; too much mutation can destroy useful structure.',
  },
  'monte-carlo-tree-search': {
    idea: 'Choose game actions by repeatedly exploring promising branches and sampling possible continuations.',
    how: ['Select a path through the tree using a score that balances value and exploration.', 'Expand a new action and simulate a rollout.', 'Backpropagate the rollout result through visited nodes.'],
    rule: 'UCT ≈ average reward + c√(ln(parent visits) / child visits)',
    example: 'An action with few visits may be explored despite a lower average reward; more rollouts refine its estimate.',
    observe: 'Run several simulations and compare visit counts, mean values, and the recommended root action.',
    caution: 'Rollout estimates are noisy, especially with few simulations. The exploration constant changes the balance between known strong moves and uncertain ones.',
  },
  'alpha-beta-pruning': {
    idea: 'Compute the same minimax choice while skipping branches proven unable to change it.',
    how: ['Track α, MAX’s best guaranteed value so far, and β, MIN’s best guaranteed value so far.', 'Update the bounds as child values return.', 'When α ≥ β, stop exploring remaining children of that branch.'],
    rule: 'prune when α ≥ β',
    example: 'MAX already has a move worth 5. At another move, MIN finds a reply worth 3; more replies cannot make that move preferable to 5, so they can be skipped.',
    observe: 'Reorder moves and count visited leaves while confirming the selected move stays the same.',
    caution: 'Pruning improves search work, not the chosen minimax value. Better move ordering usually creates more cutoffs.',
  },
  'markov-decision-process-explorer': {
    idea: 'An MDP models decisions when actions have uncertain next states and rewards.',
    how: ['Define states, actions, transition probabilities, and rewards.', 'Choose a policy that maps each state to an action.', 'Use Bellman expectations to value outcomes now and in the future.'],
    rule: 'Vπ(s) = Σₛ′ P(s′|s,π(s))[R + γVπ(s′)]',
    example: 'A move right may reach the goal with probability 0.8 and slip sideways with probability 0.2; its value averages both outcomes.',
    observe: 'Change a transition probability or reward and inspect which policy arrow changes.',
    caution: 'The Markov assumption says the current state contains the information needed to model the next outcome. An incomplete state description can break that assumption.',
  },
  'sarsa-learning': {
    idea: 'Learn action values from the action the agent actually takes next, including its exploratory behavior.',
    how: ['Take action a in state s and observe reward r and next state s′.', 'Choose the actual next action a′ under the current policy.', 'Update Q(s,a) toward r + γQ(s′,a′), then continue with a′.'],
    rule: 'Q(s,a) ← Q(s,a) + α[r + γQ(s′,a′) − Q(s,a)]',
    example: 'If the chosen next action has Q = 1 while the best possible next action has Q = 4, SARSA uses 1 in its target; Q-learning uses 4.',
    observe: 'Use the same risky grid and seed for SARSA and Q-learning. Compare routes near penalties while exploration is active.',
    caution: 'SARSA is on-policy: changing the behavior policy changes the target it learns. A cautious route is possible, but not guaranteed by the name alone.',
  },
  'hidden-markov-model-forward-viterbi': {
    idea: 'Infer hidden states from a sequence of noisy observations. Forward sums over possible paths; Viterbi finds the single most likely path.',
    how: ['Set initial hidden-state probabilities, transitions, and observation likelihoods.', 'For Forward, accumulate probability mass from every preceding state at each time.', 'For Viterbi, keep the best preceding state and backtrack after the last observation.'],
    rule: 'Forward: αₜ(j) = emissionⱼ(oₜ) Σᵢ αₜ₋₁(i) transitionᵢⱼ; Viterbi replaces Σ with max',
    example: 'A rainy observation can favor a rainy hidden state, but several observations and transition persistence can change the most likely sequence.',
    observe: 'Change one observation and compare total sequence likelihood with the highlighted Viterbi path.',
    caution: 'The most likely complete path is not the same as choosing the most likely state independently at each time. Very small probabilities may need scaling or log space.',
  },
};

export function theoryContent(slug: string): LabTheory {
  const item = theory[slug];
  if (!item) throw new Error(`Missing theory content for ${slug}`);
  return item;
}

export const theorySlugs = aiVirtualLabs.map((lab) => lab.slug);
