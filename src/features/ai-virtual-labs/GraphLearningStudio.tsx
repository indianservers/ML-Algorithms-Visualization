import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FastForward, Flag, Pause, Play, Plus, RotateCcw, Save, SkipBack, SkipForward, Sparkles, Trash2 } from 'lucide-react';
import './GraphLearningStudio.css';

type Algorithm = 'BFS' | 'DFS' | 'UCS' | 'A*' | 'Greedy' | 'Beam';
type Node = { id: string; x: number; y: number; h: number };
type Edge = { id: string; from: string; to: string; weight: number };
type Graph = { name: string; nodes: Node[]; edges: Edge[]; start: string; goal: string; directed: boolean };
type Step = { current: string; frontier: string[]; visited: string[]; parents: Record<string, string>; distances: Record<string, number>; inspected: number; narration: string; path: string[] };
type Run = { algorithm: Algorithm; graph: Graph; steps: Step[]; savedAt: number };

const GRAPH_LABS = new Set([
  'uniform-cost-search',
  'a-star-search',
  'ai-depth-first-search',
  'greedy-best-first-search',
  'breadth-first-search',
  'beam-search',
]);

export function isGraphLearningLab(slug: string) { return GRAPH_LABS.has(slug); }

export const graphLearningPresets: Record<string, Graph> = {
  'City routes': {
    name: 'City routes', start: 'A', goal: 'H', directed: false,
    nodes: [
      {id:'A',x:76,y:180,h:8},{id:'B',x:190,y:76,h:7},{id:'C',x:205,y:268,h:6},{id:'D',x:340,y:122,h:5},
      {id:'E',x:356,y:260,h:4},{id:'F',x:495,y:72,h:4},{id:'G',x:505,y:242,h:2},{id:'H',x:650,y:160,h:0},
    ],
    edges: [['A','B',3],['A','C',2],['B','D',4],['B','E',7],['C','E',2],['D','F',3],['D','G',5],['E','G',2],['F','H',5],['G','H',2],['C','D',6]].map(([from,to,weight],i)=>({id:`e${i}`,from:String(from),to:String(to),weight:Number(weight)})),
  },
  'Social network': {
    name:'Social network',start:'A',goal:'H',directed:false,
    nodes:[{id:'A',x:80,y:165,h:6},{id:'B',x:205,y:70,h:5},{id:'C',x:200,y:250,h:5},{id:'D',x:355,y:55,h:4},{id:'E',x:350,y:170,h:3},{id:'F',x:360,y:280,h:4},{id:'G',x:520,y:90,h:2},{id:'H',x:635,y:190,h:0}],
    edges:[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['C','F'],['D','G'],['E','G'],['E','H'],['F','H'],['G','H']].map(([from,to],i)=>({id:`s${i}`,from:String(from),to:String(to),weight:1})),
  },
  'Dependency DAG': {
    name:'Dependency DAG',start:'A',goal:'H',directed:true,
    nodes:[{id:'A',x:72,y:165,h:7},{id:'B',x:205,y:75,h:6},{id:'C',x:205,y:255,h:5},{id:'D',x:350,y:75,h:4},{id:'E',x:350,y:255,h:3},{id:'F',x:500,y:75,h:3},{id:'G',x:500,y:255,h:2},{id:'H',x:650,y:165,h:0}],
    edges:[['A','B',2],['A','C',3],['B','D',2],['C','D',4],['C','E',1],['D','F',2],['D','G',3],['E','G',2],['F','H',3],['G','H',1]].map(([from,to,weight],i)=>({id:`d${i}`,from:String(from),to:String(to),weight:Number(weight)})),
  },
};
const presets = graphLearningPresets;

const algorithmNotes: Record<Algorithm, { rule: string; structure: string; complexity: string }> = {
  BFS: { rule: 'Expand the oldest discovered node first.', structure: 'FIFO queue', complexity: 'O(V + E)' },
  DFS: { rule: 'Expand the most recently discovered node first.', structure: 'LIFO stack', complexity: 'O(V + E)' },
  UCS: { rule: 'Expand the frontier node with the smallest accumulated path cost g(n).', structure: 'Cost priority queue', complexity: 'O((V + E) log V)' },
  'A*': { rule: 'Expand the frontier node with the smallest g(n) + h(n).', structure: 'f-cost priority queue', complexity: 'O((V + E) log V)' },
  Greedy: { rule: 'Expand the frontier node with the smallest heuristic h(n).', structure: 'Heuristic priority queue', complexity: 'O((V + E) log V)' },
  Beam: { rule: 'Keep only the best k candidates after each expansion level.', structure: 'Width-limited frontier', complexity: 'O(b · k · d)' },
};
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const adjacency = (graph: Graph, node: string) => graph.edges.flatMap((edge) => edge.from === node ? [{id:edge.to,w:edge.weight}] : !graph.directed && edge.to === node ? [{id:edge.from,w:edge.weight}] : []).sort((a,b)=>a.id.localeCompare(b.id));
const pathTo = (parents: Record<string,string>, current: string) => { const path=[current]; while(parents[path[0]]) path.unshift(parents[path[0]]); return path; };

export function buildGraphTrace(graph: Graph, algorithm: Algorithm): Step[] {
  const frontier=[graph.start]; const visited:string[]=[]; const parents:Record<string,string>={}; const distances:Record<string,number>={[graph.start]:0}; const steps:Step[]=[]; let inspected=0;
  const score=(id:string)=>algorithm==='A*'?(distances[id]??Infinity)+(graph.nodes.find(n=>n.id===id)?.h??0):algorithm==='Greedy'?(graph.nodes.find(n=>n.id===id)?.h??0):(distances[id]??Infinity);
  for(let guard=0;frontier.length&&guard<200;guard++){
    if(['UCS','A*','Greedy'].includes(algorithm)) frontier.sort((a,b)=>score(a)-score(b)||a.localeCompare(b));
    const current=algorithm==='DFS'?frontier.pop()!:frontier.shift()!;
    if(visited.includes(current)) continue;
    visited.push(current);
    const neighbors=adjacency(graph,current); inspected+=neighbors.length;
    if(current!==graph.goal){
      for(const next of neighbors){
        const candidate=(distances[current]??0)+next.w;
        const unseen=!visited.includes(next.id)&&!frontier.includes(next.id);
        if(['UCS','A*'].includes(algorithm) && candidate < (distances[next.id]??Infinity)) { distances[next.id]=candidate; parents[next.id]=current; if(!frontier.includes(next.id)) frontier.push(next.id); }
        else if(unseen){ parents[next.id]=current; distances[next.id]=candidate; frontier.push(next.id); }
      }
      if(algorithm==='Beam') frontier.splice(2);
    }
    const path=current===graph.goal?pathTo(parents,current):[];
    const why=algorithm==='BFS'?'oldest queued node':algorithm==='DFS'?'top of the stack':algorithm==='Greedy'?'smallest heuristic':algorithm==='A*'?'smallest g + h':algorithm==='UCS'?'lowest accumulated cost':'best two frontier candidates';
    steps.push({current,frontier:[...frontier],visited:[...visited],parents:{...parents},distances:{...distances},inspected,narration:`Selected ${current} as the ${why}. ${neighbors.length} outgoing connection${neighbors.length===1?' was':'s were'} inspected.${path.length?` Goal reached; reconstruct ${path.join(' → ')}.`:''}`,path});
    if(current===graph.goal) break;
  }
  return steps.length?steps:[{current:graph.start,frontier:[],visited:[graph.start],parents:{},distances:{[graph.start]:0},inspected:0,narration:'No route can be expanded from the start node.',path:[]}];
}
const trace = buildGraphTrace;

function randomGraph(seed:number):Graph{
  let s=seed||1; const rand=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
  const nodes=Array.from({length:8},(_,i)=>({id:String.fromCharCode(65+i),x:65+(i%4)*190+(rand()-.5)*35,y:75+Math.floor(i/4)*190+(rand()-.5)*30,h:7-i}));
  const edges:Edge[]=[]; for(let i=0;i<7;i++)edges.push({id:`r${i}`,from:nodes[i].id,to:nodes[i+1].id,weight:1+Math.floor(rand()*8)});
  for(let i=0;i<6;i++){const a=Math.floor(rand()*7),b=a+1+Math.floor(rand()*(7-a));if(!edges.some(e=>e.from===nodes[a].id&&e.to===nodes[b].id))edges.push({id:`x${i}`,from:nodes[a].id,to:nodes[b].id,weight:1+Math.floor(rand()*8)});}
  return {name:`Puzzle #${seed}`,nodes,edges,start:'A',goal:'H',directed:false};
}

export function GraphLearningStudio({ slug }: { slug: string }) {
  const pageAlgorithm: Algorithm = slug === 'ai-depth-first-search' ? 'DFS' : slug === 'breadth-first-search' ? 'BFS' : slug === 'greedy-best-first-search' ? 'Greedy' : slug === 'beam-search' ? 'Beam' : slug === 'a-star-search' ? 'A*' : 'UCS';
  const algorithm = pageAlgorithm;
  const pageNote = algorithmNotes[algorithm];
  const [graph,setGraph]=useState<Graph>(()=>clone(presets['City routes']));
  const [index,setIndex]=useState(0); const [playing,setPlaying]=useState(false); const [speed,setSpeed]=useState(700); const [mode,setMode]=useState<'Guided'|'Practice'|'Challenge'|'Sandbox'>('Guided');
  const [prediction,setPrediction]=useState(''); const [feedback,setFeedback]=useState(''); const [selected,setSelected]=useState(''); const [edgeStart,setEdgeStart]=useState(''); const [tool,setTool]=useState<'move'|'node'|'edge'|'delete'>('move');
  const [score,setScore]=useState(0); const [streak,setStreak]=useState(0); const [seed,setSeed]=useState(17); const [runs,setRuns]=useState<Run[]>(()=>{try{return (JSON.parse(localStorage.getItem('graph-learning-runs')||'[]') as Run[]).filter(run=>run.graph&&typeof run.graph==='object')}catch{return[]}}); const drag=useRef<string|null>(null);
  const steps=useMemo(()=>trace(graph,algorithm),[graph,algorithm]); const step=steps[Math.min(index,steps.length-1)]; const finished=index===steps.length-1; const next=steps[index+1]?.current;
  useEffect(()=>setIndex(0),[graph,algorithm]);
  useEffect(()=>{if(!playing||finished)return;const id=window.setTimeout(()=>setIndex(v=>Math.min(v+1,steps.length-1)),speed);return()=>window.clearTimeout(id)},[playing,index,finished,speed,steps.length]);
  useEffect(()=>{if(finished)setPlaying(false)},[finished]);
  const choose=(id:string)=>{if(tool==='edge'){if(!edgeStart)setEdgeStart(id);else if(edgeStart!==id){setGraph(g=>({...g,edges:[...g.edges,{id:crypto.randomUUID(),from:edgeStart,to:id,weight:1}]}));setEdgeStart('')}return}if(tool==='delete'){setGraph(g=>({...g,nodes:g.nodes.filter(n=>n.id!==id),edges:g.edges.filter(e=>e.from!==id&&e.to!==id)}));return}setSelected(id)};
  const canvasPoint=(event:{currentTarget:SVGSVGElement;clientX:number;clientY:number})=>{const box=event.currentTarget.getBoundingClientRect();return{x:(event.clientX-box.left)*720/box.width,y:(event.clientY-box.top)*340/box.height}};
  const checkPrediction=()=>{const ok=prediction===next;setFeedback(ok?`Correct — ${next} is selected next.`:`Not quite. Recheck the ${algorithm==='DFS'?'stack':algorithm==='BFS'?'queue':'priority score'} before continuing.`);setScore(v=>v+(ok?100:0));setStreak(v=>ok?v+1:0)};
  const save=()=>{const nextRuns=[{algorithm,graph:clone(graph),steps,savedAt:Date.now()},...runs].slice(0,12);setRuns(nextRuns);localStorage.setItem('graph-learning-runs',JSON.stringify(nextRuns));};
  const download=()=>{const blob=new Blob([JSON.stringify({graph,algorithm,steps,score},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`graph-${algorithm.toLowerCase().replace('*','star')}.json`;a.click();URL.revokeObjectURL(url)};

  return <section className="gls" aria-labelledby="gls-title">
    <header className="gls-head"><div><span><Sparkles size={16}/> Page-specific graph explorer</span><h2 id="gls-title">{pageAlgorithm} Graph Explorer</h2><p>Edit the graph and predict each {pageAlgorithm} execution step without leaving this lesson.</p></div><div className="gls-score"><b>{score}</b><span>XP · {streak} streak</span></div></header>
    <nav className="gls-modes" aria-label="Learning mode">{(['Guided','Practice','Challenge','Sandbox'] as const).map(item=><button className={mode===item?'active':''} onClick={()=>setMode(item)} key={item}>{item}</button>)}</nav>
    <div className="gls-toolbar">
      <label>Algorithm<select value={algorithm} aria-label="Page algorithm" disabled><option>{pageAlgorithm}</option></select></label>
      <label>Scenario<select value={Object.keys(presets).includes(graph.name)?graph.name:''} onChange={e=>e.target.value&&setGraph(clone(presets[e.target.value]))}><option value="">Custom / puzzle</option>{Object.keys(presets).map(name=><option key={name}>{name}</option>)}</select></label>
      <div className="gls-tools" aria-label="Graph editor">{(['move','node','edge','delete'] as const).map(item=><button className={tool===item?'active':''} onClick={()=>{setTool(item);setEdgeStart('')}} key={item}>{item==='node'?<Plus/>:item==='delete'?<Trash2/>:item}</button>)}</div>
      <button onClick={()=>setGraph(g=>({...g,directed:!g.directed}))}>{graph.directed?'Directed':'Undirected'}</button>
      <button onClick={()=>{setSeed(s=>s+1);setGraph(randomGraph(seed+1));setScore(0)}}><Sparkles/> New puzzle</button>
    </div>
    <div className="gls-layout">
      <div className="gls-stage">
        <svg viewBox="0 0 720 340" role="img" aria-label={`${algorithm} editable graph`} onPointerMove={e=>{if(!drag.current)return;const p=canvasPoint(e);setGraph(g=>({...g,nodes:g.nodes.map(n=>n.id===drag.current?{...n,x:p.x,y:p.y}:n)}))}} onPointerUp={()=>drag.current=null} onDoubleClick={e=>{if(tool!=='node')return;const p=canvasPoint(e);const id=String.fromCharCode(65+graph.nodes.length);setGraph(g=>({...g,nodes:[...g.nodes,{id,x:p.x,y:p.y,h:Math.max(0,8-g.nodes.length)}]}))}}>
          <defs><marker id="gls-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z"/></marker></defs>
          {graph.edges.map(edge=>{const a=graph.nodes.find(n=>n.id===edge.from)!,b=graph.nodes.find(n=>n.id===edge.to)!;const onPath=step.path.some((id,i)=>id===edge.from&&step.path[i+1]===edge.to)||(!graph.directed&&step.path.some((id,i)=>id===edge.to&&step.path[i+1]===edge.from));return <g key={edge.id} className={onPath?'path':''} onClick={()=>tool==='delete'?setGraph(g=>({...g,edges:g.edges.filter(x=>x.id!==edge.id)})):setSelected(edge.id)}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} markerEnd={graph.directed?'url(#gls-arrow)':undefined}/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-7}>{edge.weight}</text></g>})}
          {graph.nodes.map(node=>{const state=step.current===node.id?'current':step.path.includes(node.id)?'path':step.visited.includes(node.id)?'visited':step.frontier.includes(node.id)?'frontier':'';return <g key={node.id} className={`node ${state} ${selected===node.id?'selected':''}`} transform={`translate(${node.x} ${node.y})`} onPointerDown={()=>{if(tool==='move')drag.current=node.id}} onClick={()=>choose(node.id)}><circle r="25"/><text y="5">{node.id}</text><text className="heuristic" y="42">h={node.h}</text></g>})}
        </svg>
        <div className="gls-legend"><span className="frontier">Frontier</span><span className="visited">Visited</span><span className="current">Current</span><span className="path">Final path</span></div>
        <div className="gls-playback"><button onClick={()=>{setPlaying(false);setIndex(0)}} aria-label="Restart"><RotateCcw/></button><button onClick={()=>setIndex(v=>Math.max(0,v-1))} aria-label="Previous step"><SkipBack/></button><button className="primary" onClick={()=>setPlaying(v=>!v)}>{playing?<Pause/>:<Play/>}{playing?'Pause':'Play'}</button><button onClick={()=>setIndex(v=>Math.min(steps.length-1,v+1))} aria-label="Next step"><SkipForward/></button><button onClick={()=>setIndex(steps.length-1)} aria-label="Finish"><FastForward/></button><label>Speed<input type="range" min="180" max="1400" step="100" value={1580-speed} onChange={e=>setSpeed(1580-Number(e.target.value))}/></label><span>Step {index+1}/{steps.length}</span></div>
      </div>
      <aside className="gls-side">
        <section className="gls-narration"><h3>Why this step?</h3><p>{mode==='Challenge'?'Explain the choice before revealing the hint.':step.narration}</p>{mode==='Challenge'&&<button onClick={()=>setMode('Guided')}>Reveal explanation</button>}</section>
        <section><h3>Live data structures</h3><dl><div><dt>Current</dt><dd>{step.current}</dd></div><div><dt>{algorithm==='DFS'?'Stack':'Frontier'}</dt><dd>{step.frontier.join(' · ')||'empty'}</dd></div><div><dt>Visited</dt><dd>{step.visited.join(' · ')}</dd></div><div><dt>Distances</dt><dd>{Object.entries(step.distances).map(([id,d])=>`${id}:${d}`).join(' ')}</dd></div></dl></section>
        {next&&mode!=='Guided'&&<section className="gls-predict"><h3>Predict the next node</h3><div><select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">Choose…</option>{graph.nodes.map(n=><option key={n.id}>{n.id}</option>)}</select><button onClick={checkPrediction}>Check</button></div>{feedback&&<p>{feedback}</p>}</section>}
        <section className="gls-metrics"><h3>Complexity meter</h3><div><b>{step.visited.length}</b><span>visited</span><b>{step.inspected}</b><span>edges</span><b>{Math.max(...steps.slice(0,index+1).map(s=>s.frontier.length))}</b><span>frontier peak</span><b>{step.path.length?step.distances[graph.goal]:'—'}</b><span>path cost</span></div><small>{algorithm==='BFS'||algorithm==='DFS'?'Time O(V + E)':algorithm==='Beam'?'Time O(b · k · d)':'Time O((V + E) log V)'}</small></section>
      </aside>
    </div>
    <div className="gls-labs">
      <section><h3>Cost & heuristic laboratory</h3><p>Select a node or edge, then change its value and watch the trace recompute.</p>{graph.nodes.some(n=>n.id===selected)?<label>Heuristic<input type="number" value={graph.nodes.find(n=>n.id===selected)?.h??0} onChange={e=>setGraph(g=>({...g,nodes:g.nodes.map(n=>n.id===selected?{...n,h:Number(e.target.value)}:n)}))}/></label>:graph.edges.some(e=>e.id===selected)?<label>Edge weight<input type="number" value={graph.edges.find(e=>e.id===selected)?.weight??1} onChange={e=>setGraph(g=>({...g,edges:g.edges.map(x=>x.id===selected?{...x,weight:Number(e.target.value)}:x)}))}/></label>:<p className="muted">Select a node or edge in the graph.</p>}<button onClick={()=>setGraph(g=>({...g,edges:g.edges.map((e,i)=>i===0?{...e,weight:-2}:e)}))}>Inject negative-weight mistake</button></section>
      <section><h3>{algorithm} selection rule</h3><p>{pageNote.rule}</p><dl><div><dt>Data structure</dt><dd>{pageNote.structure}</dd></div><div><dt>Complexity</dt><dd>{pageNote.complexity}</dd></div></dl></section>
      <section><h3>Challenge cards</h3><button onClick={()=>{setMode('Challenge');setFeedback('Challenge: make DFS inspect more nodes than BFS, then run the race.')}}><Flag/> Make DFS lose</button><button onClick={()=>{setMode('Challenge');setFeedback('Challenge: edit a heuristic so Greedy returns a costlier route than UCS.')}}><Flag/> Mislead Greedy</button><button onClick={()=>{setMode('Challenge');setFeedback('Challenge: create two disconnected components using the delete tool.')}}><Flag/> Break reachability</button>{feedback&&<p>{feedback}</p>}</section>
        <section><h3>Experiment notebook</h3><div className="gls-notebook-actions"><button onClick={save}><Save/> Save run</button><button onClick={download}><Download/> Export JSON</button></div>{runs.some(run=>run.algorithm===pageAlgorithm)?<ul>{runs.filter(run=>run.algorithm===pageAlgorithm).slice(0,4).map(run=><li key={run.savedAt}><button onClick={()=>{setGraph(clone(run.graph));setIndex(run.steps.length-1)}}>{run.algorithm} · {run.graph.name}<span>{new Date(run.savedAt).toLocaleTimeString()}</span></button></li>)}</ul>:<p className="muted">No {pageAlgorithm} runs saved on this device.</p>}</section>
    </div>
    <footer className="gls-feature-strip">15 learning tools active: editor · playback · inspector · predictions · races · challenges · presets · narration · heuristics · mistake lab · path reconstruction · complexity · learning modes · puzzles · notebook</footer>
  </section>;
}
