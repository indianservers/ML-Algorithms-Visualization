import type { ReactNode } from 'react';

type Point = { x: number; y: number };
const blue = '#36a8ff';
const purple = '#a659ff';
const pink = '#ff65c1';
const green = '#28e3ae';
const amber = '#ffb647';

function dots(cx: number, cy: number, sx: number, sy: number, count: number, color: string, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = i * 2.399 + seed;
    const r = Math.sqrt((i + 0.5) / count);
    return <circle key={`${seed}-${i}`} className="ref-art-dot" cx={cx + Math.cos(a) * sx * r} cy={cy + Math.sin(a) * sy * r} r={i % 5 === 0 ? 2.5 : 1.7} fill={color} />;
  });
}

function line(points: Point[], color = blue, width = 2, className = 'ref-art-draw') {
  return <polyline className={className} points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />;
}

function nodes(points: Point[], color: string, radius = 5) {
  return points.map((point, i) => <circle key={i} className="ref-art-node" cx={point.x} cy={point.y} r={radius} fill={color} stroke="#b5ebff" strokeWidth="1" />);
}

function network(name: 'RNN' | 'LSTM' | 'GRU') {
  const xs = name === 'RNN' ? [28, 72, 116, 160, 204] : name === 'GRU' ? [31, 103, 194] : [31, 84, 143, 194];
  return <>
    <path d={`M${xs[0]} 48 H${xs[xs.length - 1]}`} stroke={blue} strokeWidth="2" strokeDasharray="5 4" />
    {xs.map((x, i) => <g key={x} className="ref-art-flow"><rect x={x - (name === 'RNN' ? 10 : 21)} y="32" width={name === 'RNN' ? 20 : 42} height="32" rx="8" fill="#163c89" stroke={i === 1 ? purple : blue} strokeWidth="2" /><text x={x} y="53" textAnchor="middle" fill="#e7f5ff" fontSize={name === 'RNN' ? 12 : 11} fontWeight="700">{name === 'RNN' ? `h${i}` : i === 1 ? name : i === 0 ? 'xₜ' : i === xs.length - 1 ? 'hₜ' : 'gate'}</text></g>)}
    {name !== 'RNN' && <path d="M84 28 C98 6 143 6 143 28" fill="none" stroke={purple} strokeWidth="1.5" strokeDasharray="4 4" />}
  </>;
}

function axes() {
  return <path d="M18 9 V82 H210" fill="none" stroke="#92acd788" strokeWidth="1" />;
}

function scatter(seed: number, rising = true, curve = false) {
  const pts = Array.from({ length: 29 }, (_, i) => {
    const x = 26 + i * 6.1;
    const base = rising ? 72 - i * 1.75 : 30 + i * 1.35;
    return { x, y: base + Math.sin(i * 2.13 + seed) * 10 };
  });
  return <>{axes()}{nodes(pts, blue, 2.1)}<path className="ref-art-draw" d={curve ? "M23 72 C65 67 69 18 117 43 S170 70 205 14" : rising ? "M23 76 L205 18" : "M23 23 L205 73"} fill="none" stroke={purple} strokeWidth="3" /></>;
}

function tree(ensemble = false) {
  const one = (offset: number, color: string, scale = 1) => <g className="ref-art-tree" transform={`translate(${offset} 0) scale(${scale})`}>
    <path d="M55 15 L31 42 M55 15 L79 42 M31 42 L18 70 M31 42 L43 70 M79 42 L67 70 M79 42 L92 70" stroke={color} strokeWidth="2" />
    {[[55,15],[31,42],[79,42],[18,70],[43,70],[67,70],[92,70]].map(([x,y],i)=><circle key={i} className="ref-art-node" cx={x} cy={y} r={i ? 4.5 : 6} fill={i > 2 ? (i % 2 ? pink : green) : color} />)}
  </g>;
  return <>{ensemble ? <>{one(0, blue, .78)}{one(72, purple, .78)}{one(142, green, .78)}</> : one(57, purple, 1)}</>;
}

function denseNet(kind: 'dense' | 'cnn' | 'attention' | 'gates' = 'dense') {
  if (kind === 'cnn') return <>
    {[18,42,68,96,130,167].map((x,i)=><g key={x} className="ref-art-layer" style={{animationDelay:`${i * 140}ms`}}><rect x={x} y={18+i%2*7} width={i<3?28:22} height={58-i%2*14} fill={i%2?'#6d38dd88':'#1f78ff88'} stroke={i%2?purple:blue} transform="skewY(-8)" /><path d={`M${x+5} ${34+i%2*7} H${x+20} M${x+5} ${49+i%2*7} H${x+20}`} stroke="#8feaff88" /></g>)}
    <path className="ref-art-flow" d="M12 49 H211" stroke={green} strokeWidth="2" strokeDasharray="6 6" />
  </>;
  if (kind === 'attention') return <>
    {[16,45,74,103].map((y,i)=><g key={y}><rect x="12" y={y-7} width="24" height="14" rx="4" fill={[blue,purple,pink,amber][i]} /><path className="ref-art-flow" style={{animationDelay:`${i*.25}s`}} d={`M36 ${y} C82 ${y}, 108 ${88-y}, 150 ${88-y}`} stroke={[blue,purple,pink,amber][i]} strokeWidth="2" fill="none" /></g>)}
    <rect x="150" y="19" width="42" height="58" rx="7" fill="#5132aa88" stroke={purple} /><path d="M192 48 H213" stroke={green} strokeWidth="3" />
  </>;
  if (kind === 'gates') return <>
    <rect x="15" y="20" width="190" height="58" rx="9" fill="#112d6199" stroke={purple} />
    {[[48,'σ',pink],[94,'tanh',green],[145,'σ',amber],[183,'×',blue]].map(([x,label,color],i)=><g className="ref-art-gate" style={{animationDelay:`${i*.25}s`}} key={`${label}-${i}`}><rect x={Number(x)-17} y="37" width="34" height="25" rx="6" fill="#173b76" stroke={String(color)} /><text x={Number(x)} y="54" textAnchor="middle" fill="white" fontSize="10">{label}</text></g>)}
    <path className="ref-art-flow" d="M4 49 H214" stroke={green} strokeWidth="2" strokeDasharray="6 5" />
  </>;
  const columns = [[24,[20,40,60,80]],[81,[16,32,48,64,80]],[139,[19,39,59,79]],[198,[31,65]]] as const;
  return <>{columns.slice(0,-1).flatMap(([x,ys],c)=>ys.flatMap((y,i)=>columns[c+1][1].map((ny,j)=><line key={`${c}-${i}-${j}`} className="ref-art-signal" style={{animationDelay:`${(i+j)*.08}s`}} x1={x} y1={y} x2={columns[c+1][0]} y2={ny} stroke={c%2?purple:blue} opacity=".42" />)))}{columns.flatMap(([x,ys],c)=>ys.map((y,i)=><circle key={`${x}-${y}`} className="ref-art-node" cx={x} cy={y} r="5" fill={c===columns.length-1?amber:c%2?purple:blue} style={{animationDelay:`${(c+i)*.11}s`}} />))}</>;
}

function heatmap(kind: 'users' | 'items' | 'confusion' = 'users') {
  return <>{Array.from({length:5},(_,r)=>Array.from({length:6},(_,c)=>{const hot=kind==='confusion'?r===c:(kind==='users'?(r*3+c*2)%7:(r+c*3)%8); return <rect className="ref-art-cell" style={{animationDelay:`${(r+c)*.08}s`}} key={`${r}-${c}`} x={42+c*27} y={8+r*17} width="24" height="14" rx="2" fill={hot===true||Number(hot)>4?pink:Number(hot)>2?purple:blue} opacity={.35+((r+c)%4)*.15} />;}))}</>;
}

function drawing(slug: string): ReactNode {
  switch (slug) {
    case 'simple-linear-regression': return scatter(1);
    case 'multiple-linear-regression': return <>{scatter(2)}<path className="ref-art-plane" d="M30 67 L137 28 L204 43 L96 83 Z" fill="#3b82f633" stroke={pink} /></>;
    case 'polynomial-regression': return scatter(3, true, true);
    case 'ridge-regression': return <>{axes()}{[9,16,24,33].map((r,i)=><ellipse className="ref-art-contour" style={{animationDelay:`${i*.15}s`}} key={r} cx="119" cy="48" rx={r*2.2} ry={r} fill="none" stroke={i%2?blue:purple} />)}<circle className="ref-art-pulse" cx="119" cy="48" r="5" fill={pink}/></>;
    case 'lasso-regression': return <>{axes()}{[11,20,30,40].map((r,i)=><rect className="ref-art-contour" style={{animationDelay:`${i*.15}s`}} key={r} x={119-r} y={48-r*.62} width={r*2} height={r*1.24} fill="none" stroke={i%2?blue:purple} transform="rotate(45 119 48)"/>)}<circle className="ref-art-pulse" cx="119" cy="48" r="5" fill={pink}/></>;
    case 'elastic-net-regression': return <>{axes()}<path className="ref-art-contour" d="M55 48 L88 18 H150 L184 48 L150 78 H88 Z" fill="#a659ff22" stroke={purple}/><path className="ref-art-contour" d="M76 48 L99 28 H140 L162 48 L140 68 H99 Z" fill="#36a8ff22" stroke={blue}/><circle className="ref-art-pulse" cx="119" cy="48" r="6" fill={pink}/></>;
    case 'decision-tree-regression': case 'decision-tree-classification': return tree();
    case 'random-forest-regression': case 'random-forest-classification': return tree(true);
    case 'gradient-boosting-regression': case 'gradient-boosting-classification': case 'adaboost-classification': case 'xgboost-concept': return <>{tree(true)}<path className="ref-art-flow" d="M16 88 H205" stroke={amber} strokeWidth="2" strokeDasharray="8 5"/><text x="110" y="94" textAnchor="middle" fill="#dcecff" fontSize="8">WEAK LEARNERS → STRONG MODEL</text></>;
    case 'support-vector-regression': case 'svm-classification': return <>{scatter(8)}<path d="M22 65 L198 13 M31 78 L207 26" stroke="#dcecff" strokeDasharray="5 4"/><path className="ref-art-margin" d="M27 72 L203 20" stroke={pink} strokeWidth="3"/></>;
    case 'logistic-regression': return <>{axes()}{dots(63,63,37,20,20,pink,1)}{dots(168,28,37,20,20,blue,3)}<path className="ref-art-draw" d="M21 76 C75 76 83 75 110 47 S145 19 207 18" fill="none" stroke="#f3f7ff" strokeWidth="3"/></>;
    case 'multinomial-logistic-regression': return <>{axes()}<path d="M20 80 L104 42 L64 8 Z" fill="#286dff66"/><path d="M64 8 L104 42 L204 8 Z" fill="#ff4b7a66"/><path d="M20 80 L104 42 L205 82 Z" fill="#23dc9a66"/>{dots(59,48,32,18,13,blue,1)}{dots(141,24,31,13,13,pink,2)}{dots(151,66,33,13,13,green,3)}</>;
    case 'knn-classification': return <>{dots(58,48,38,29,24,blue,1)}{dots(161,49,38,29,24,pink,4)}<circle className="ref-art-pulse" cx="108" cy="49" r="22" fill="none" stroke={amber}/><circle cx="108" cy="49" r="5" fill={amber}/><text x="108" y="17" fill="white" textAnchor="middle" fontSize="9">k = 5</text></>;
    case 'naive-bayes': return <>{axes()}{[blue,pink,green].map((c,i)=><path key={c} className="ref-art-draw" style={{animationDelay:`${i*.18}s`}} d={`M${25+i*47} 80 C${42+i*47} 80 ${42+i*47} 16 ${61+i*47} 16 S${79+i*47} 80 ${96+i*47} 80`} fill={`${c}22`} stroke={c} strokeWidth="2"/>)}</>;
    case 'perceptron': case 'mlp': case 'nn-playground': case 'network-builder': return denseNet();
    case 'cnn': case 'convolution-visualizer': return denseNet('cnn');
    case 'rnn': return network('RNN');
    case 'lstm': case 'gru': return denseNet('gates');
    case 'transformer-attention': case 'multi-head-attention': return denseNet('attention');
    case 'backpropagation-visualizer': return <>{denseNet()}<path className="ref-art-backward" d="M205 88 H17" stroke={pink} strokeWidth="3" strokeDasharray="7 5"/><text x="111" y="95" fill={pink} textAnchor="middle" fontSize="8">GRADIENTS</text></>;
    case 'few-shot-learning': return <>{dots(115,49,58,32,37,blue,2)}<circle className="ref-art-pulse" cx="187" cy="22" r="12" fill={amber}/><path className="ref-art-flow" d="M174 28 L146 40" stroke={amber} strokeWidth="2" strokeDasharray="4 4"/></>;
    case 'transfer-learning': return <>{denseNet('cnn')}<rect x="151" y="8" width="58" height="18" rx="6" fill="#156c50" stroke={green}/><text x="180" y="20" textAnchor="middle" fill="white" fontSize="8">FINE-TUNE</text></>;
    case 'k-means': return <><g className="ref-art-cluster ref-art-cluster-a">{dots(51,31,29,23,25,blue,1)}</g><g className="ref-art-cluster ref-art-cluster-b">{dots(109,68,27,20,23,pink,3)}</g><g className="ref-art-cluster ref-art-cluster-c">{dots(177,35,26,22,23,amber,5)}</g>{[[51,31,blue],[109,68,pink],[177,35,amber]].map(([x,y,c])=><path className="ref-art-centroid" key={String(x)} d={`M${Number(x)-6} ${Number(y)} H${Number(x)+6} M${x} ${Number(y)-6} V${Number(y)+6}`} stroke={String(c)} strokeWidth="3"/>)}</>;
    case 'k-medoids': return <>{dots(57,35,31,25,25,blue,1)}{dots(161,55,34,25,29,pink,3)}{[[57,35,blue],[161,55,pink]].map(([x,y,c])=><polygon className="ref-art-pulse" key={String(x)} points={`${Number(x)},${Number(y)-8} ${Number(x)+8},${Number(y)-2} ${Number(x)+5},${Number(y)+8} ${Number(x)-5},${Number(y)+8} ${Number(x)-8},${Number(y)-2}`} fill="#0d2047" stroke={String(c)} strokeWidth="2"/>)}</>;
    case 'hierarchical-clustering': return <><path className="ref-art-draw" d="M24 82 V69 H50 V82 M37 69 V55 H77 M64 82 V55 M96 82 V43 H132 V82 M114 43 V27 H170 M154 82 V57 H190 V82 M172 57 V27 M104 27 V10 H172" stroke="#bad2ff" strokeWidth="2" fill="none"/>{[24,50,64,96,132,154,190].map((x,i)=><circle key={x} cx={x} cy="83" r="4" fill={[amber,pink,blue,green,purple][i%5]}/>)}</>;
    case 'dbscan': return <>{dots(55,30,28,22,28,blue,1)}{dots(151,55,34,27,31,green,3)}{[[104,16],[201,29],[112,82],[18,76]].map(([x,y],i)=><circle className="ref-art-pulse" key={i} cx={x} cy={y} r="4" fill="none" stroke={pink}/>)}</>;
    case 'mean-shift': return <>{[35,24,14].map((r,i)=><circle className="ref-art-contour" key={r} cx="65" cy="54" r={r} fill={`${blue}${i===0?'12':'22'}`} stroke={blue}/>) }{[40,28,16].map((r,i)=><ellipse className="ref-art-contour" key={r} cx="160" cy="45" rx={r} ry={r*.72} fill={`${amber}${i===0?'12':'22'}`} stroke={amber}/>)}<path className="ref-art-flow" d="M22 80 L62 58 M109 79 L157 49" stroke="white" strokeWidth="2" strokeDasharray="5 4"/></>;
    case 'gaussian-mixture-model': return <>{axes()}{[blue,pink,amber].map((c,i)=><path key={c} className="ref-art-draw" style={{animationDelay:`${i*.15}s`}} d={`M${15+i*48} 78 C${35+i*48} 78 ${42+i*48} 16 ${64+i*48} 16 S${93+i*48} 78 ${111+i*48} 78`} fill={`${c}24`} stroke={c} strokeWidth="2"/>)}</>;
    case 'spectral-clustering': return <>{[0,1,2].map((ring)=><path key={ring} className="ref-art-orbit" d={`M${21+ring*10} ${65-ring*7} C${59+ring*7} ${14+ring*4}, ${111+ring*9} ${89-ring*7}, ${204-ring*7} ${24+ring*11}`} fill="none" stroke={[blue,pink,green][ring]} strokeWidth="8" strokeLinecap="round" strokeDasharray="2 6"/>)}</>;
    case 'optics': return <>{axes()}{Array.from({length:38},(_,i)=><rect className="ref-art-bar" style={{animationDelay:`${i*.025}s`}} key={i} x={22+i*4.7} y={82-(8+Math.abs(Math.sin(i*.29))*44)} width="3" height={8+Math.abs(Math.sin(i*.29))*44} fill={i<13?pink:i<26?purple:blue}/>)}</>;
    case 'user-based-cf': return heatmap('users');
    case 'item-based-cf': return heatmap('items');
    case 'matrix-factorization': return <>{heatmap('users')}<text x="15" y="54" fill="white" fontSize="19">R</text><text x="111" y="54" fill="white" fontSize="18">≈</text><path className="ref-art-flow" d="M137 9 V87 M164 9 V87 M191 9 V87" stroke={amber} strokeWidth="12" opacity=".55"/></>;
    case 'content-based': return <><rect x="13" y="15" width="65" height="66" rx="6" fill="#18396e" stroke={blue}/>{['Sci-Fi','Space','Action'].map((t,i)=><g key={t}><rect x="89" y={15+i*24} width="50" height="18" rx="9" fill={i%2?blue:purple}/><text x="114" y={27+i*24} textAnchor="middle" fill="white" fontSize="8">{t}</text></g>)}<path className="ref-art-flow" d="M143 47 H170" stroke={pink} strokeWidth="2" strokeDasharray="5 4"/>{[18,43,68].map((y,i)=><rect key={y} x="176" y={y} width="36" height="17" rx="4" fill={i? '#156c50':'#4d2b87'} stroke={i?green:purple}/>)}</>;
    case 'feature-importance': return <>{['Age','Income','Credit','Loan','Length'].map((t,i)=><g key={t}><text x="8" y={17+i*17} fill="#dcecff" fontSize="8">{t}</text><rect className="ref-art-bar" style={{animationDelay:`${i*.12}s`}} x="52" y={8+i*17} width={140-i*23} height="11" rx="3" fill={[blue,purple,pink,amber,green][i]}/></g>)}</>;
    case 'partial-dependence-plot': return <>{axes()}<path className="ref-art-draw" d="M20 70 C52 81 77 64 96 51 S127 35 146 39 S176 27 207 31" fill="none" stroke={blue} strokeWidth="3"/><path d="M20 62 C52 73 77 56 96 43 S127 27 146 31 S176 19 207 23 L207 40 C176 36 162 48 146 47 S122 51 96 60 S52 90 20 79Z" fill="#36a8ff25"/></>;
    case 'shap-concept': return <>{[14,31,48,65,82].map((y,i)=><g key={y}><path className="ref-art-bar" style={{animationDelay:`${i*.1}s`}} d={`M110 ${y} H${110+(i%2?-1:1)*(25+i*9)}`} stroke={i%2?blue:pink} strokeWidth="10"/><text x="7" y={y+3} fill="#dcecff" fontSize="8">{['Age','Income','Credit','Loan','Length'][i]}</text></g>)}<path d="M110 5 V91" stroke="#fff8"/></>;
    case 'lime-concept': return <><rect x="12" y="12" width="78" height="72" rx="7" fill="#15366b" stroke={blue}/><path className="ref-art-flow" d="M95 48 H129" stroke={blue} strokeWidth="2" strokeDasharray="5 4"/><rect x="135" y="12" width="73" height="72" rx="7" fill="#15366b" stroke={purple}/>{[27,45,63].map((y,i)=><rect className="ref-art-bar" key={y} x="146" y={y} width={45-i*8} height="8" rx="3" fill={i===1?blue:pink}/>)}</>;
    case 'gradient-descent': case 'sgd': case 'momentum': case 'adam': return <>{axes()}<path d="M25 16 C67 17 73 78 113 78 S161 17 205 15" fill="none" stroke={purple} strokeWidth="2"/>{[36,59,78,94,108].map((x,i)=><circle className="ref-art-step" style={{animationDelay:`${i*.22}s`}} key={x} cx={x} cy={17+i*13} r="5" fill={i===4?green:amber}/>)}</>;
    case 'pca': return <>
      <path d="M22 78 L192 24 M36 82 L45 18" stroke={blue} strokeWidth="2" className="ref-art-draw" />
      <path d="M33 74 L170 28 L204 47 L66 89Z" fill="#4d7bff26" stroke="#7d84ff" strokeWidth="1" />
      {dots(93, 52, 62, 25, 31, blue, 1)}{dots(147, 40, 48, 22, 21, purple, 3)}
      <path d="M117 44 L117 71 M145 31 L145 62" stroke={pink} strokeWidth="1" strokeDasharray="3 3" />
    </>;
    case 'kernel-pca': return <>
      <path d="M14 75 C58 5 98 100 148 30 S200 25 212 33" stroke="#417bff55" strokeWidth="22" fill="none" />
      <path d="M14 75 C58 5 98 100 148 30 S200 25 212 33" className="ref-art-draw" stroke={purple} strokeWidth="2" fill="none" />
      {Array.from({ length: 34 }, (_, i) => { const x = 20 + i * 5.7; const y = 51 - 22 * Math.sin(x / 18) + (i % 4 - 1.5) * 5; return <circle key={i} className="ref-art-dot" cx={x} cy={y} r="2.3" fill={i % 3 ? blue : pink} />; })}
    </>;
    case 'tsne': return <><g className="ref-art-cluster ref-art-cluster-a">{dots(49, 56, 29, 27, 27, blue, 1)}</g><g className="ref-art-cluster ref-art-cluster-b">{dots(137, 28, 28, 23, 25, pink, 2)}</g><g className="ref-art-cluster ref-art-cluster-c">{dots(133, 73, 23, 16, 19, green, 4)}</g></>;
    case 'umap-concept': return <>
      <path d="M24 52 C51 12 89 89 114 54 S173 18 202 49" stroke={blue} strokeWidth="1.4" strokeDasharray="3 4" fill="none" className="ref-art-orbit" />
      <path d="M28 72 C60 31 91 64 124 24 S175 96 201 66" stroke={purple} strokeWidth="1.2" strokeDasharray="3 4" fill="none" />
      {dots(58, 53, 23, 18, 20, blue, 1)}{dots(125, 30, 21, 15, 18, purple, 3)}{dots(172, 68, 26, 15, 17, amber, 5)}
    </>;
    case 'lda': return <>
      <ellipse cx="62" cy="42" rx="43" ry="24" fill="#246bff1e" stroke="#487aff66" transform="rotate(22 62 42)" />
      <ellipse cx="152" cy="43" rx="39" ry="22" fill="#19d99818" stroke="#19d99877" transform="rotate(-19 152 43)" />
      {dots(65, 44, 31, 15, 22, blue, 1)}{dots(154, 44, 29, 15, 21, green, 4)}{dots(110, 74, 23, 12, 13, pink, 2)}
      <path d="M27 80 L197 14" stroke="#fff" strokeWidth="1.5" strokeDasharray="7 5" className="ref-art-draw" />
    </>;
    case 'autoencoder': return <>
      {[23, 58, 107, 156, 194].map((x, col) => { const ys = col === 2 ? [48] : col === 1 || col === 3 ? [29, 48, 67] : [17, 37, 58, 79]; return <g key={x}>{ys.map((y, i) => <circle key={i} className="ref-art-flow" cx={x} cy={y} r={col === 2 ? 9 : 4.8} fill={col === 2 ? purple : blue} />)}</g>; })}
      <path d="M29 48 H98 M116 48 H188" stroke={purple} strokeWidth="2" strokeDasharray="5 5" className="ref-art-flow" />
      <text x="107" y="18" fill="#dbbaff" textAnchor="middle" fontSize="9">LATENT</text>
    </>;
    case 'moving-average': return <>
      {line(Array.from({ length: 30 }, (_, i) => ({ x: 9 + i * 7, y: 73 - i * 1.3 + Math.sin(i * 1.37) * 10 + Math.sin(i * 2.2) * 4 })), blue, 1.6)}
      {line(Array.from({ length: 30 }, (_, i) => ({ x: 9 + i * 7, y: 71 - i * 1.25 + Math.sin(i * .38) * 4 })), purple, 2.5)}
    </>;
    case 'exponential-smoothing': return <>
      {line(Array.from({ length: 10 }, (_, i) => ({ x: 13 + i * 21, y: 66 - i * 3 + Math.sin(i * 1.6) * 15 })), '#488bff99', 1.5)}
      {line(Array.from({ length: 30 }, (_, i) => ({ x: 13 + i * 6.6, y: 64 - i * 1.05 + Math.sin(i * .32) * 4 })), blue, 2.5)}
      {nodes(Array.from({ length: 10 }, (_, i) => ({ x: 13 + i * 21, y: 66 - i * 3 + Math.sin(i * 1.6) * 15 })), purple, 2.7)}
    </>;
    case 'holt-winters': return <>
      {line(Array.from({ length: 43 }, (_, i) => ({ x: 5 + i * 5, y: 66 - i * .55 + Math.sin(i * .72) * 11 })), blue, 1.8)}
      {line(Array.from({ length: 43 }, (_, i) => ({ x: 5 + i * 5, y: 61 - i * .6 + Math.sin(i * .72 + .25) * 12 })), purple, 1.8)}
      <path d="M10 72 L209 42" stroke="#71b6ff88" strokeDasharray="4 4" />
    </>;
    case 'arima-concept': return <>
      {line(Array.from({ length: 22 }, (_, i) => ({ x: 8 + i * 6.5, y: 66 - i * .8 + Math.sin(i * 1.5) * 12 })), blue, 1.8)}
      <path d="M145 46 L210 18 L210 75 Z" fill="#367aff2b" stroke="#377dff66" />
      <path d="M145 46 C168 43 187 48 209 47" stroke="#9b69ff" strokeWidth="2" strokeDasharray="5 4" fill="none" />
      <path d="M145 10 V82" stroke="#8ab2ff77" strokeDasharray="3 4" />
    </>;
    case 'anomaly-detection': return <>
      {line(Array.from({ length: 40 }, (_, i) => ({ x: 5 + i * 5.3, y: i === 28 ? 10 : 59 + Math.sin(i * 1.2) * 7 + Math.sin(i * 2.7) * 4 })), blue, 1.9)}
      <circle className="ref-art-pulse" cx="153" cy="10" r="12" fill="none" stroke={pink} strokeWidth="2" /><circle cx="153" cy="10" r="4" fill={pink} />
    </>;
    case 'rnn-forecasting': return network('RNN');
    case 'lstm-forecasting': return network('LSTM');
    case 'gru-forecasting': return network('GRU');
    case 'bag-of-words': return <>
      {[['data', 20, 33, blue], ['learning', 90, 26, purple], ['model', 64, 70, blue], ['AI', 146, 65, pink], ['NLP', 175, 29, purple]].map(([word, x, y, color]) => <g key={word} className="ref-art-float"><rect x={Number(x)-5} y={Number(y)-17} width={String(word).length * 8 + 12} height="26" rx="5" fill="#173c84" stroke={String(color)} /><text x={Number(x)+2} y={Number(y)} fill="#f1f7ff" fontSize="11" fontWeight="700">{word}</text></g>)}
    </>;
    case 'tf-idf': return <>{[['machine', .92], ['learning', .7], ['data', .47], ['algorithm', .31]].map(([word, amount], i) => <g key={word}><text x="9" y={20+i*20} fill="#dceaff" fontSize="10">{word}</text><rect x="78" y={10+i*20} width={Number(amount)*115} height="9" rx="5" fill={i % 2 ? purple : blue} className="ref-art-bar" /><text x="203" y={20+i*20} textAnchor="end" fill="#b7c9ef" fontSize="9">{[.42,.28,.18,.12][i]}</text></g>)}</>;
    case 'text-classification': return <>
      <path d="M15 12 H65 L76 24 V81 H15 Z" fill="#19366e" stroke={blue} strokeWidth="2" />
      {[30,42,54,66].map(y=><path key={y} d={`M25 ${y} H61`} stroke={purple} strokeWidth="2" />)}
      <path d="M81 47 H118" stroke={pink} strokeDasharray="4 4" />
      {['Sports','Politics','Technology','Science'].map((word,i)=><g key={word}><rect x="125" y={5+i*22} width={word.length*8+17} height="18" rx="6" fill={['#06785e','#334c9b','#6c2789','#90591e'][i]} /><text x="133" y={18+i*22} fill="white" fontSize="10">{word}</text></g>)}
    </>;
    case 'word-embedding-concept': return <>
      <path d="M20 80 L80 18 M20 80 H203" stroke="#4187ff77" />
      <path d="M58 52 L124 28 M58 52 L133 72 M124 28 L194 38" stroke={purple} strokeDasharray="3 3" />
      {[[58,52,'king'],[124,28,'queen'],[133,72,'man'],[194,38,'woman']].map(([x,y,name],i)=><g key={name}><circle className="ref-art-pulse" cx={Number(x)} cy={Number(y)} r="4" fill={i%2?pink:blue} /><text x={Number(x)+5} y={Number(y)-7} fill="#dbe9ff" fontSize="10">{name}</text></g>)}
    </>;
    case 'sentiment-analysis': return <>
      {[38,108,178].map((x,i)=><g key={x}><circle cx={x} cy="37" r="17" fill={i===0?'#a02e6a':i===1?'#a47b21':'#087b66'} stroke={i===0?pink:i===1?amber:green} strokeWidth="2" /><circle cx={x-5} cy="33" r="1.5" fill="white" /><circle cx={x+5} cy="33" r="1.5" fill="white" /><path d={i===0?`M${x-7} 46 Q${x} 39 ${x+7} 46`:i===1?`M${x-7} 44 H${x+7}`:`M${x-7} 42 Q${x} 51 ${x+7} 42`} fill="none" stroke="white" strokeWidth="2" /></g>)}
      <path className="ref-art-draw" d="M12 85 C40 58 68 88 97 80 S154 52 207 77" fill="none" stroke={blue} strokeWidth="2" />
    </>;
    case 'naive-bayes-spam': return <>
      <rect x="12" y="24" width="64" height="49" rx="5" fill="#133f81" stroke={blue} strokeWidth="2" /><path d="M13 27 L44 51 L75 27" stroke="#7ad7ff" strokeWidth="2" fill="none" />
      <path className="ref-art-flow" d="M80 48 H126 M126 48 L145 26 M126 48 L145 70" stroke={pink} strokeWidth="2" strokeDasharray="4 4" />
      <rect x="148" y="12" width="66" height="26" rx="5" fill="#71305c" stroke={pink} /><text x="181" y="30" textAnchor="middle" fill="white" fontSize="10">Spam</text>
      <rect x="148" y="58" width="66" height="26" rx="5" fill="#075d51" stroke={green} /><text x="181" y="76" textAnchor="middle" fill="white" fontSize="10">Not spam</text>
    </>;
    case 'audio-classification': return <>
      {line(Array.from({ length: 42 },(_,i)=>({x:5+i*3.6,y:48+Math.sin(i*1.7)*((i%8)+5)})),blue,1.6)}
      {[0,1,2,3].map((row)=><g key={row}>{Array.from({length:14},(_,i)=><rect className="ref-art-bar" key={i} x={155+i*4.2} y={17+row*16} width="3" height="12" fill={i%3===row%3?pink:i%2?purple:blue} opacity={.3+((i+row)%4)*.18} />)}</g>)}
    </>;
    case 'multi-armed-bandit': return <>
      {['🍒','🔔','◆'].map((symbol,i)=><g key={i}><rect x={12+i*72} y="18" width="57" height="62" rx="7" fill="#143777" stroke={i===2?pink:blue} strokeWidth="2" /><text x={40+i*72} y="58" textAnchor="middle" fontSize="25" fill={i===2?purple:'white'}>{symbol}</text><circle cx={60+i*72} cy="70" r="3" fill={amber} /></g>)}
    </>;
    case 'q-learning-grid-world': return <>
      {Array.from({length:6},(_,col)=>Array.from({length:3},(_,row)=><rect key={`${col}-${row}`} x={19+col*31} y={5+row*29} width="30" height="28" fill={col===5&&row===0?'#796216':col===3&&row===1?'#263557':'#17396c'} stroke="#568ff888" />))}
      <path className="ref-art-flow" d="M34 75 H95 V47 H157 V18 H190" fill="none" stroke={amber} strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="34" cy="75" r="7" fill={purple} /><text x="190" y="25" textAnchor="middle" fill={amber} fontSize="17">★</text>
    </>;
    case 'markov-decision-process': return <>
      <path d="M51 49 H97 M123 49 H171 M109 64 C94 91 50 88 42 66" fill="none" stroke={purple} strokeWidth="2" markerEnd="none" />
      {[[37,'S₀',blue],[110,'S₁',purple],[183,'S₂',green]].map(([x,label,color])=><g key={label}><circle className="ref-art-pulse" cx={Number(x)} cy="49" r="20" fill="#14315f" stroke={String(color)} strokeWidth="2" /><text x={Number(x)} y="54" fill="white" textAnchor="middle" fontSize="15">{label}</text></g>)}
      <text x="74" y="38" fill={pink} fontSize="10">a₀</text><text x="144" y="38" fill={pink} fontSize="10">a₁</text>
    </>;
    case 'train-test-split': return <>
      <path d="M135 10 V86" stroke={pink} strokeDasharray="5 4" /><text x="56" y="19" fill={blue} fontSize="11">TRAIN</text><text x="159" y="19" fill={pink} fontSize="11">TEST</text>
      {dots(69, 55, 47, 27, 28, blue, 2)}{dots(171, 55, 28, 26, 12, pink, 4)}
    </>;
    case 'cross-validation': return <>{Array.from({length:5},(_,row)=><g key={row}>{Array.from({length:5},(_,col)=><rect key={col} x={11+col*41} y={10+row*17} width="37" height="13" rx="2" fill={row===col?pink:blue} opacity={row===col?1:.62} />)}</g>)}</>;
    case 'confusion-matrix': return <>
      {[[34,13,green,'TP'],[115,13,pink,'FP'],[34,52,pink,'FN'],[115,52,green,'TN']].map(([x,y,color,label])=><g key={label}><rect x={Number(x)} y={Number(y)} width="72" height="31" rx="5" fill={String(color)} opacity=".32" stroke={String(color)} /><text x={Number(x)+36} y={Number(y)+21} fill="white" textAnchor="middle" fontSize="12" fontWeight="700">{label}</text></g>)}
    </>;
    case 'roc-auc': return <><path d="M19 9 V80 H205" stroke="#99bbeb" /><path d="M19 80 L198 12" stroke="#8796c4" strokeDasharray="5 4" /><path className="ref-art-draw" d="M19 80 C22 39 53 28 99 19 S170 12 201 10" fill="none" stroke={green} strokeWidth="3" /><path d="M19 80 C22 39 53 28 99 19 S170 12 201 10 V80 Z" fill="#1edbb327" /></>;
    case 'precision-recall-curve': return <><path d="M19 9 V80 H205" stroke="#99bbeb" /><path className="ref-art-draw" d="M20 17 C56 20 57 26 83 29 S112 45 143 46 S178 69 203 76" fill="none" stroke={purple} strokeWidth="3" /><text x="23" y="15" fill={pink} fontSize="9">precision</text><text x="163" y="91" fill={blue} fontSize="9">recall</text></>;
    case 'regression-metrics': return <><path d="M18 51 H207" stroke="#9fbae5" strokeDasharray="4 4" />{Array.from({length:11},(_,i)=><path key={i} d={`M${29+i*17} 51 V${51+Math.sin(i*1.7)*27}`} stroke={i%3?blue:pink} strokeWidth="3" />)}<text x="113" y="15" textAnchor="middle" fill="#dcecff" fontSize="10">MAE · RMSE · R²</text></>;
    case 'bias-variance-tradeoff': return <><path d="M18 10 V82 H207" stroke="#9fbae5" /><path d="M25 16 Q80 30 120 77" fill="none" stroke={blue} strokeWidth="2.5" /><path d="M25 77 Q130 65 197 15" fill="none" stroke={pink} strokeWidth="2.5" /><circle className="ref-art-pulse" cx="116" cy="51" r="7" fill={purple} /><text x="55" y="15" fill={blue} fontSize="9">bias</text><text x="166" y="15" fill={pink} fontSize="9">variance</text></>;
    case 'missing-values': return <>{Array.from({length:5},(_,row)=>Array.from({length:7},(_,col)=><rect key={`${row}-${col}`} x={15+col*28} y={8+row*17} width="22" height="12" rx="2" fill={(row+col*3)%6===0?'#1a2a4a':row%2?purple:blue} stroke={(row+col*3)%6===0?pink:'none'} opacity=".8" />))}</>;
    case 'scaling-normalization': return <><text x="32" y="13" fill="#bfd7ff" fontSize="10">raw</text><text x="151" y="13" fill="#bfd7ff" fontSize="10">scaled</text>{[12,25,38,60,76].map((h,i)=><g key={i}><rect x={20+i*17} y={88-h} width="12" height={h} rx="2" fill={blue} /><rect x={126+i*17} y={88-(31+i*3)} width="12" height={31+i*3} rx="2" fill={purple} /></g>)}<path d="M107 49 H120" stroke={green} strokeWidth="2" /></>;
    case 'categorical-encoding': return <>{['red','blue','green'].map((label,i)=><g key={label}><text x="15" y={24+i*27} fill={[pink,blue,green][i]} fontSize="12">{label}</text><path d={`M58 ${20+i*27} H98`} stroke={purple} strokeDasharray="4 4" /><text x="118" y={24+i*27} fill="#e5edff" fontSize="13" fontFamily="monospace">{i===0?'1 0 0':i===1?'0 1 0':'0 0 1'}</text></g>)}</>;
    case 'outlier-detection': return <>{dots(87, 54, 58, 28, 37, blue, 2)}<circle cx="187" cy="18" r="5" fill={pink} /><circle className="ref-art-pulse" cx="187" cy="18" r="14" fill="none" stroke={pink} strokeWidth="2" /><path d="M145 43 L178 23" stroke={pink} strokeDasharray="3 4" /></>;
    case 'feature-selection': return <>{['age','income','noise','score','region'].map((label,i)=><g key={label}><rect x={12+i*40} y="20" width="31" height="52" rx="4" fill={i===2?'#18274c':'#19437c'} stroke={i===2?'#526287':green} /><text x={27+i*40} y="51" textAnchor="middle" fill={i===2?'#74829f':'#e9f8ff'} fontSize="13">{i===2?'×':'✓'}</text><text x={27+i*40} y="85" textAnchor="middle" fill="#b5c9ec" fontSize="7">{label}</text></g>)}</>;
    case 'polynomial-features': return <><path d="M15 80 H210 M23 10 V84" stroke="#9fbae5" /><path d="M23 72 Q92 78 111 49 T199 13" fill="none" stroke={purple} strokeWidth="3" className="ref-art-draw" /><text x="28" y="17" fill={blue} fontSize="11">x → x²</text>{[38,61,87,112,139,166,190].map((x,i)=><circle key={x} cx={x} cy={72-((x-23)/177)**2*57+(i%2?6:-5)} r="2.8" fill={blue} />)}</>;
    default: return <path d="M10 75 Q75 10 112 48 T210 24" fill="none" stroke={blue} strokeWidth="2" />;
  }
}

export function ReferenceLabArt({ route }: { route: string }) {
  const slug = route.split('/').pop() ?? '';
  return <svg className="ref-lab-art" viewBox="0 0 220 96" role="img" aria-label={`${slug.replaceAll('-', ' ')} diagram`} preserveAspectRatio="xMidYMid meet">{drawing(slug)}</svg>;
}
