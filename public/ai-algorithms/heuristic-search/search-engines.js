/* Separate search state machines, sharing Phase 1 graph and path primitives. */
(function(root,factory){const api=factory(typeof module==='object'?require('../graph-search/engines.js'):root.SearchEngines);if(typeof module==='object')module.exports=api;else root.PhaseFiveSearch=api})(typeof globalThis!=='undefined'?globalThis:this,S=>{
 function dfsGraph(preset='tree'){
  const nodes=Array.from({length:15},(_,i)=>{const depth=Math.floor(Math.log2(i+1)),index=i-(2**depth-1),count=2**depth;return {id:String.fromCharCode(65+i),x:85+(index+.5)*600/count,y:65+depth*118,depth}});
  let edges=nodes.slice(1).map((n,i)=>[nodes[Math.floor(i/2)].id,n.id,1]);
  if(preset==='cyclic')edges.push(['J','B',1],['M','A',1],['F','D',1]);
  if(preset==='disconnected')edges=edges.filter(e=>!(e[0]==='A'&&e[1]==='C'));
  return {nodes,edges,adj:S.adjacency(edges,true),directed:true};
 }
 function greedyGraph(preset='classic'){
  const nodes=[['A',80,220,14],['B',300,110,12],['C',230,325,11],['D',550,110,6],['E',435,275,7],['F',345,470,9],['G',660,255,4],['H',690,465,0]].map(([id,x,y,h])=>({id,x,y,h}));
  let edges=[['A','B',4],['A','C',3],['B','D',5],['B','E',4],['C','E',2],['C','F',4],['D','E',2],['E','F',3],['E','G',3],['E','H',6],['G','H',2]];
  if(preset==='trap')edges=edges.map(e=>e[0]==='E'&&e[1]==='H'?[e[0],e[1],25]:e);
  if(preset==='disconnected')edges=edges.filter(e=>!e.includes('H'));
  return {nodes,edges,adj:S.adjacency(edges),directed:false};
 }
 function dfs(graph,start='A',goal='G',limit=10,order='left',options={}){
  if(!graph.nodes.some(n=>n.id===start)||!graph.nodes.some(n=>n.id===goal))throw new Error('Unknown search node');
  if(limit==null)limit=Infinity;if(limit<0||Number.isNaN(limit))throw new Error('Invalid depth limit');
  let stack=[{node:start,index:0,depth:0,entered:false}],visited=[],seen=new Set(),finished=[],backtracked=[],current=null,phase='initialize',done=false,found=false,path=[],event='Start is on the stack. Visit it first.',lastEdge=null,steps=0;
  function step(){if(done)return snapshot();steps++;lastEdge=null;if(found){done=true;phase='done';event=`Goal path has ${path.length-1} edges. DFS does not guarantee the shortest path.`;return snapshot()}if(!stack.length){done=true;phase='done';event='Stack empty. No goal was found within the explored depth limit.';return snapshot()}
   const f=stack.at(-1);current=f.node;
   if(!f.entered){f.entered=true;seen.add(f.node);visited.push(f.node);phase='visit';event=`Visit ${f.node} at depth ${f.depth}.`;if(current===goal){found=true;path=stack.map(x=>x.node);phase='goal';event=`Goal ${goal} found. The stack contains the path from ${start}.`}return snapshot()}
   if(options.reportCutoff&&f.depth>=limit&&!f.cutoffReported){f.cutoffReported=true;phase='limit';event=`${f.node} is at depth ${f.depth}, equal to the limit ${limit}. Visit it, but do not expand its children.`;return snapshot()}
   const children=[...(graph.adj[f.node]||[])];if(order==='right')children.reverse();
   let child=null;if(f.depth<limit)while(f.index<children.length){const candidate=children[f.index++];if(!seen.has(candidate)){child=candidate;break}}
   if(child){stack.push({node:child,index:0,depth:f.depth+1,entered:false});current=child;phase='push';lastEdge=[f.node,child];event=`Push ${child}; go deeper from ${f.node}. The top of the LIFO stack is ${child}.`}
   else{stack.pop();if(options.pathCycles)seen.delete(f.node);finished.push(f.node);current=stack.at(-1)?.node??null;phase='backtrack';if(current){lastEdge=[f.node,current];backtracked.push([f.node,current])}event=`${f.node}${f.depth>=limit?' reached the depth limit':' has no unvisited child'}. Pop ${f.node}${current?`; backtrack to ${current}`:'; the stack is empty'}.`}return snapshot();
  }
  function snapshot(){return {stack:stack.map(x=>({...x})),visited:[...visited],finished:[...finished],backtracked:backtracked.map(x=>[...x]),current,phase,done,found,path:[...path],currentPath:stack.map(x=>x.node),event,lastEdge:lastEdge?[...lastEdge]:null,steps}}
  return {step,snapshot};
 }
 function heuristics(graph,goal,mode='predefined'){const target=graph.nodes.find(n=>n.id===goal);return Object.fromEntries(graph.nodes.map(n=>[n.id,n.id===goal?0:mode==='predefined'?n.h:Math.round((mode==='manhattan'?Math.abs(n.x-target.x)+Math.abs(n.y-target.y):Math.hypot(n.x-target.x,n.y-target.y))/45*10)/10]))}
 function greedy(graph,start='A',goal='H',mode='predefined'){
  const h=heuristics(graph,goal,mode);let open=[start],seen=new Set(open),expanded=[],parent={[start]:null},current=null,path=[],phase='initialize',done=false,found=false,steps=0,event='Initialize the frontier with the start node.',added=[],candidates=[];
  const rank=()=>open.sort((a,b)=>h[a]-h[b]||a.localeCompare(b));
  function step(){if(done)return snapshot();steps++;added=[];
   if(phase==='goal'){path=S.pathTo(parent,goal);done=true;phase='done';event=`Reconstruct ${path.join(' → ')}. Greedy used h only; this path is not guaranteed optimal.`}
   else if(phase==='select'){if(current===goal){found=true;phase='goal';event=`Reached ${goal}. Reconstruct the parent chain next.`}else{for(const next of graph.adj[current]||[])if(!seen.has(next)){seen.add(next);parent[next]=current;open.push(next);added.push(next)}expanded.push(current);phase='expand';event=`Expand ${current}; add ${added.join(', ')||'no new nodes'} to the frontier.`}}
   else if(phase==='expand'){rank();phase='rank';event='Rank the frontier by h(n), with alphabetical tie-breaking. Edge weights do not affect selection.'}
   else{rank();if(!open.length){done=true;phase='done';event='Frontier exhausted. The goal is unreachable.'}else{candidates=[...open];current=open.shift();phase='select';event=`Select ${current}: h(${current}) = ${h[current]}, the smallest heuristic in the frontier.`}}
   return snapshot();
  }
  function snapshot(){const route=current?S.pathTo(parent,current):[start],cost=p=>p.slice(1).reduce((sum,n,i)=>sum+(graph.edges.find(e=>(e[0]===p[i]&&e[1]===n)||(!graph.directed&&e[1]===p[i]&&e[0]===n))?.[2]??0),0);return {open:[...open].sort((a,b)=>h[a]-h[b]||a.localeCompare(b)),expanded:[...expanded],parent:{...parent},current,path:[...path],route,routeCost:cost(route),h:{...h},phase,done,found,steps,event,added:[...added],candidates:[...candidates]}}
  return {step,snapshot};
 }
 return {dfsGraph,greedyGraph,dfs,greedy,heuristics};
});
