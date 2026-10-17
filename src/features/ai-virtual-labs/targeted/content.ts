import type {LabSlug} from './engines';
export const content:Record<LabSlug,{insight:string;code:string;question:string;answers:string[];answer:number;explanation:string}>={
 'depth-limited-search':{insight:'Depth-Limited Search (DLS) follows depth-first traversal to a fixed depth ℓ. A goal test comes before the cutoff test. CUTOFF means a deeper search may help; FAILURE means the explored subtree is exhausted. It uses memory proportional to the active path and its pending successors.',code:`DLS(node, goal, remaining):
  if node == goal: return SUCCESS
  if remaining == 0: return CUTOFF
  cutoff_occurred = false
  for child in successors(node):
    result = DLS(child, goal, remaining - 1)
    if result == SUCCESS: return SUCCESS
    if result == CUTOFF: cutoff_occurred = true
  if cutoff_occurred: return CUTOFF
  return FAILURE`,question:'What does CUTOFF tell us?',answers:['There is no solution','A larger depth limit may help','The goal was reached'],answer:1,explanation:'The depth bound stopped exploration; the algorithm has not ruled out deeper solutions.'},
 'iterative-deepening-a-star':{insight:'IDA* runs depth-first contours under f(n)=g(n)+h(n). Each unsuccessful pass returns the smallest f-value that exceeded the bound. With an admissible heuristic and positive costs, the first solution is optimal. This grid uses four-way unit-cost motion and Manhattan distance.',code:`IDA_STAR(start, goal):
  bound = h(start)
  while true:
    t = contour(start, 0, bound)
    if t == FOUND: return path
    if t == infinity: return FAILURE
    bound = t  # minimum exceeded f

contour(node, g, bound):
  f = g + h(node)
  if f > bound: return f
  if node == goal: return FOUND
  minimum = infinity
  for child not on current path:
    t = contour(child, g + cost, bound)
    if t == FOUND: return FOUND
    minimum = min(minimum, t)
  return minimum`,question:'How is the next contour bound chosen?',answers:['Add one unconditionally','Maximum explored g-cost','Minimum f that exceeded the previous bound'],answer:2,explanation:'The returned minimum exceeded f avoids skipping a potentially optimal contour.'},
 'recursive-best-first-search':{insight:'RBFS explores the most promising successor while retaining alternative backed-up f-costs. Successor f is max(g+h, parent f). Recursion is bounded by the minimum of the current limit and the next-best alternative. A failed branch returns an updated bound, allowing the search to switch branches.',code:`RBFS(node, g, limit):
  if goal(node): return SUCCESS, node.f
  successors = expand(node)
  if empty(successors): return FAILURE, infinity
  for s in successors:
    s.f = max(g + cost(node,s) + h(s), node.f)
  while true:
    best = lowest_f(successors)
    alternative = second_lowest_f(successors)
    if best.f > limit: return FAILURE, best.f
    result, best.f = RBFS(best, g + cost,
                          min(limit, alternative.f))
    if result == SUCCESS: return SUCCESS, best.f`,question:'Which bound is used for recursive expansion?',answers:['min(current limit, alternative f)','The heuristic alone','The largest successor f'],answer:0,explanation:'The alternative limits how much work RBFS should spend on its current best branch.'},
 'ao-star-search':{insight:'AO* searches a partial AND/OR solution graph. OR alternatives compete by minimum cost; an AND hyperedge requires all its children and sums their edge-plus-subproblem costs. Expand an unsolved leaf of the marked best partial solution, back up costs, and propagate solved flags. Zero initial estimates here are admissible.',code:`AO_STAR(root):
  mark_best_partial_solution(root)
  while not solved(root):
    leaf = unsolved_marked_leaf(root)
    expand(leaf)
    for node in reverse_dependency_order:
      for hyperedge in alternatives(node):
        cost = sum(edge_cost + child.cost)
      node.cost = min(alternative_costs)
      mark minimum_cost hyperedge
      node.solved = all(marked_children.solved)
  return marked_solution_graph`,question:'When is an AND hyperedge solved?',answers:['When any child is solved','When every child is solved','When its heuristic decreases'],answer:1,explanation:'An AND choice is a joint subproblem requiring all children.'},
 'csp-backtracking':{insight:'Backtracking assigns one variable at a time and rejects values that violate a constraint with an assigned neighbor. MRV chooses the smallest current domain; degree breaks toward highly connected variables. Least-constraining-value ordering preserves options for neighbors. Exhausting a variable restores the preceding assignment.',code:`BACKTRACK(assignment):
  if complete(assignment): return SUCCESS
  v = select_unassigned_variable()
  for value in ordered_domain(v):
    if consistent(v, value, assignment):
      assignment[v] = value
      if BACKTRACK(assignment): return SUCCESS
      remove assignment[v]
  return FAILURE`,question:'What must hold for a complete map coloring?',answers:['Every region has the same color','All domains are empty','Every adjacent pair has different colors'],answer:2,explanation:'Every variable must be assigned and every binary inequality constraint satisfied.'},
 'forward-checking':{insight:'Forward checking removes an assigned value from the domains of unassigned neighbors connected by inequality constraints. An empty domain causes immediate backtracking. A saved domain snapshot is restored when undoing an assignment. It is stronger than checking only already-assigned variables, but does not enforce all arc consistency.',code:`FORWARD_CHECK(assignment, domains):
  if complete(assignment): return SUCCESS
  v = select_unassigned_variable()
  for value in ordered_domain(v):
    if consistent(v, value):
      saved = copy(domains)
      assignment[v] = value
      prune value from unassigned_neighbors(v)
      if no_empty_domain and recurse(): return SUCCESS
      domains = saved
      remove assignment[v]
  return FAILURE`,question:'What happens when a neighboring domain becomes empty?',answers:['Backtrack and restore domains','Keep assigning other variables','Declare success'],answer:0,explanation:'No future assignment can repair the empty domain without undoing an earlier choice.'},
 'ac-3-arc-consistency':{insight:'AC-3 maintains directed arcs (Xi,Xj). REVISE removes each value in Di that has no supporting value in Dj under the actual constraint. If Di changes, incoming arcs (Xk,Xi), excluding Xj, must be reconsidered. An empty domain proves inconsistency. Queue exhaustion proves arc consistency, not global satisfiability.',code:`AC3(domains, constraints):
  Q = all_directed_arcs(constraints)
  while Q not empty:
    Xi, Xj = pop(Q)
    if REVISE(Xi, Xj):
      if empty(domain[Xi]): return FAILURE
      for Xk in neighbors(Xi) except Xj:
        enqueue(Q, (Xk, Xi))
  return SUCCESS

REVISE(Xi, Xj):
  remove x in Di if no y in Dj satisfies Cij(x,y)
  return whether Di changed`,question:'Does queue exhaustion guarantee a complete solution?',answers:['Always','Only for N-Queens','No; it guarantees arc consistency'],answer:2,explanation:'Local support on each binary arc need not imply a globally consistent complete assignment.'},
 'min-conflicts':{insight:'Min-conflicts starts with a complete N-Queens assignment, one queen per column. At each iteration choose a conflicted queen and move it to a row minimizing attacks with all other queens. Ties use seeded random choice. A step limit is inconclusive; restart changes the seed and initial board.',code:`MIN_CONFLICTS(N, max_steps):
  board = random_complete_assignment(N)
  for step in range(max_steps):
    if no_conflicts(board): return SUCCESS
    column = random_conflicted_column(board)
    scores = conflicts_for_each_row(column)
    row = random_argmin(scores)
    board[column] = row
  return STEP_LIMIT`,question:'Does reaching the step limit prove N-Queens is impossible?',answers:['Yes','No; local search may be stuck','Only if N is even'],answer:1,explanation:'Min-conflicts is incomplete. A restart can escape an unproductive assignment.'},
 'expectimax-search':{insight:'Expectimax models actions with stochastic outcomes. MAX takes the highest successor value; CHANCE computes Σ p(outcome) × utility. Outgoing probabilities are normalized and nonnegative. Adjust the first-outcome probability to change both expectation calculations and the preferred action.',code:`EXPECTIMAX(node):
  if terminal(node): return utility(node)
  if MAX(node):
    return max(EXPECTIMAX(child) for child)
  if CHANCE(node):
    return sum(probability(child) *
               EXPECTIMAX(child) for child)`,question:'How does a chance node combine utilities?',answers:['Probability-weighted sum','Maximum utility','Minimum utility'],answer:0,explanation:'Expected utility weights each outcome by its probability.'},
 'variable-elimination':{insight:'Exact Bayesian inference restricts factors to evidence, multiplies factors containing an elimination variable, then sums out that variable. Repeat until only the query remains and normalize. The burglary network uses standard binary CPTs; evidence J=true alone gives a much smaller posterior than the illustrative mockup number.',code:`VARIABLE_ELIMINATION(query, evidence):
  factors = restrict_each_CPT(evidence)
  for variable in elimination_order:
    if variable in query or evidence: continue
    selected = factors_containing(variable)
    product = multiply(selected)
    reduced = sum_out(product, variable)
    replace selected with reduced
  result = multiply(factors)
  return normalize(result)`,question:'Does elimination order change the exact posterior?',answers:['Yes, always','No, but it changes intermediate factor sizes','Only with two evidence variables'],answer:1,explanation:'Valid orders compute the same exact marginal; their time and memory costs can differ.'},
 'belief-propagation':{insight:'Sum-product alternates variable-to-factor products (excluding the recipient) and factor-to-variable sums over other variables. Messages and beliefs are normalized. On a tree the converged result is exact. On a loopy graph it is approximate, even when residuals converge. Damping retains a fraction of the previous message.',code:`SUM_PRODUCT(factor_graph):
  initialize normalized messages
  repeat:
    for variable x and adjacent factor f:
      m_xf = local(x) * product(m_gx, g != f)
    for factor f and adjacent variable x:
      m_fx = sum_other_states(f * product(m_yf))
    normalize every message
    optionally damp with previous messages
    belief[x] = normalize(local(x) * product(m_fx))
    residual = max_absolute_message_change
    if residual < tolerance: stop`,question:'Are converged loopy beliefs necessarily exact?',answers:['Yes','Only with damping','No'],answer:2,explanation:'Convergence alone does not remove the approximation introduced by loops.'},
 'particle-filtering':{insight:'Sequential Monte Carlo predicts particles using the motion model, multiplies old weights by observation likelihoods, normalizes, and estimates state with a weighted mean. ESS=1/Σw² measures degeneracy. Systematic resampling draws according to cumulative weight and resets all weights to 1/N.',code:`PARTICLE_FILTER(particles, observation):
  predict each particle from motion_model
  weight *= observation_likelihood
  normalize weights using log-sum-exp
  estimate = sum(weight * state)
  ESS = 1 / sum(weight ** 2)
  if ESS < threshold * N:
    particles = systematic_resample(particles)
    weights = 1 / N
  return estimate`,question:'What does low ESS indicate?',answers:['Weight concentrated in few particles','Uniform weights','A perfect state estimate'],answer:0,explanation:'Few particles carry most of the probability mass, making resampling useful.'},
 'pomdp-belief-state-planning':{insight:'A POMDP maintains a normalized distribution over hidden states. Prediction sums transition probabilities; correction multiplies observation likelihoods and normalizes. This planner evaluates observation-contingent action trees to a finite horizon. The sensor reports left/right half with configurable error. The true state is displayed only for evaluation.',code:`PLAN(belief, horizon):
  if horizon == 0: return 0
  for action in actions:
    Q[action] = expected_immediate_reward(belief, action)
    for observation in observations:
      posterior, p = BAYES_UPDATE(belief, action, observation)
      Q[action] += gamma * p * PLAN(posterior, horizon-1)
  return max(Q)

BAYES_UPDATE(b, a, o):
  predicted[s2] = sum(T[s,a,s2] * b[s])
  return normalize(O[o,s2] * predicted[s2])`,question:'What is the belief state?',answers:['The observed true position','A probability distribution over hidden states','A list of rewards'],answer:1,explanation:'A belief summarizes uncertainty after the complete action and observation history.'},
 'monte-carlo-control':{insight:'Model-free Monte Carlo control samples complete episodes from an ε-greedy policy. Discounted returns are computed backward after termination. First-visit updates only the earliest occurrence of each (s,a) within the episode; every-visit updates all occurrences. Incremental sample means estimate Q and improve the ε-greedy policy.',code:`MONTE_CARLO_CONTROL():
  initialize Q and counts to zero
  for episode in episodes:
    trajectory = generate_complete_episode(epsilon_greedy(Q))
    G = 0
    compute all returns backward: G = reward + gamma * G
    for transition in chronological_order:
      if every_visit or first_occurrence(s,a):
        N[s,a] += 1
        Q[s,a] += (G[s,a] - Q[s,a]) / N[s,a]
    policy = epsilon_greedy(Q)`,question:'When does a Monte Carlo update use a return?',answers:['Before any reward','After every prediction only','After the episode terminates'],answer:2,explanation:'Monte Carlo uses complete sampled returns rather than bootstrapped Q targets.'},
 'deep-q-network':{insight:'DQN approximates four action values with a trainable 25→24→16→4 ReLU network. The online network receives minibatch gradients; a frozen target network supplies Bellman targets and synchronizes periodically. Uniform replay samples are drawn without replacement. The loss and reward curves come from actual training; short runs need not converge.',code:`DQN():
  initialize online network and replay buffer
  target.copy_from(online)
  for environment step:
    action = epsilon_greedy(online(state))
    next_state, reward, done = environment.step(action)
    replay.add(state, action, reward, next_state, done)
    batch = uniform_sample_without_replacement(replay)
    y = reward if done else reward + gamma * max(target(next_state))
    loss = mean((online(state)[action] - y) ** 2)
    backpropagate loss through online network
    every C steps: target.copy_from(online)`,question:'Which network receives gradient updates?',answers:['Online network','Target network directly','Both from the same gradient'],answer:0,explanation:'The target stays frozen between explicit copies from the online network.'},
};
