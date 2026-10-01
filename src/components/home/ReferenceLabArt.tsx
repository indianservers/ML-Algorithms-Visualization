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

function drawing(slug: string): ReactNode {
  switch (slug) {
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
