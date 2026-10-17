import { describe, expect, it } from 'vitest';
import { buildGraphTrace, graphLearningPresets, isGraphLearningLab } from '../src/features/ai-virtual-labs/GraphLearningStudio';

describe('Graph Learning Studio trace engine', () => {
  it('runs BFS in queue order and reconstructs a valid goal path', () => {
    const graph = graphLearningPresets['City routes'];
    const steps = buildGraphTrace(graph, 'BFS');

    expect(steps.slice(0, 3).map(step => step.current)).toEqual(['A', 'B', 'C']);
    expect(steps.at(-1)?.current).toBe(graph.goal);
    expect(steps.at(-1)?.path[0]).toBe(graph.start);
    expect(steps.at(-1)?.path.at(-1)).toBe(graph.goal);
  });

  it('uses weighted costs for UCS and A*', () => {
    const graph = graphLearningPresets['City routes'];
    const ucs = buildGraphTrace(graph, 'UCS').at(-1)!;
    const astar = buildGraphTrace(graph, 'A*').at(-1)!;

    expect(ucs.distances[graph.goal]).toBe(8);
    expect(astar.distances[graph.goal]).toBe(8);
    expect(ucs.path).toEqual(['A', 'C', 'E', 'G', 'H']);
  });

  it('respects one-way edges in the dependency preset', () => {
    const graph = graphLearningPresets['Dependency DAG'];
    const result = buildGraphTrace({ ...graph, start: 'H', goal: 'A' }, 'BFS').at(-1)!;

    expect(result.path).toEqual([]);
    expect(result.visited).toEqual(['H']);
  });

  it('appears only on pages implemented by its graph-search engine', () => {
    expect(['uniform-cost-search', 'a-star-search', 'ai-depth-first-search', 'greedy-best-first-search', 'breadth-first-search', 'beam-search'].every(isGraphLearningLab)).toBe(true);
    expect(['minimax-search', 'bayesian-network-construction', 'bayesian-network-inference', 'monte-carlo-tree-search', 'alpha-beta-pruning', 'markov-decision-process-explorer', 'hidden-markov-model-forward-viterbi'].some(isGraphLearningLab)).toBe(false);
  });
});
