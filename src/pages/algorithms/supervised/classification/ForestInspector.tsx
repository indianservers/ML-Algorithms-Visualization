import type { ClassificationTreeNode, RandomForestClassificationModel } from '../../../../lib/algorithms/classification/randomForestClassification';

export const FOREST_COLORS = ['#0072B2', '#D55E00', '#7B4AB5'];
export const FOREST_SYMBOLS = ['●', '▲', '◆'];

export function ForestInspector({ model, query, treeIndex, setTreeIndex, names, features }: {
  model: RandomForestClassificationModel; query: number[]; treeIndex: number;
  setTreeIndex: (index: number) => void; names: string[]; features: string[];
}) {
  const index = Math.min(treeIndex, model.trees.length - 1);
  const tree = model.trees[index];
  const path: { node: ClassificationTreeNode; description: string }[] = [];
  let node = tree.root;
  while (node.left && node.right && node.featureIndex !== undefined && node.threshold !== undefined) {
    const left = query[node.featureIndex] <= node.threshold;
    path.push({ node, description: `${features[node.featureIndex]}: ${query[node.featureIndex].toFixed(2)} ${left ? '≤' : '>'} ${node.threshold.toFixed(2)} → ${left ? 'left' : 'right'}` });
    node = left ? node.left : node.right;
  }
  return <section className="forest-inspector">
    <h3>Follow one tree’s decision</h3>
    <label>Inspect tree <select aria-label="Inspect tree" value={index} onChange={event => setTreeIndex(Number(event.target.value))}>{model.trees.map((_, i) => <option key={i} value={i}>Tree {i + 1}</option>)}</select></label>
    <p>Bootstrap sampling draws rows with replacement. This tree used {new Set(tree.inBagIndices).size} distinct training samples; {tree.oobIndices.length} were left out.</p>
    <ol>{path.map((entry, i) => <li key={i}>{entry.description} <small>({entry.node.samples} training draws)</small></li>)}<li><strong style={{ color: FOREST_COLORS[node.prediction] }}>{FOREST_SYMBOLS[node.prediction]} Vote: {names[node.prediction]}</strong></li></ol>
    <p>Other trees can take different paths because they receive different samples and candidate features.</p>
  </section>;
}
