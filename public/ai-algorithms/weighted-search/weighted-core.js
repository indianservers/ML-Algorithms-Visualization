(function(root,factory){const api=factory(typeof module==='object'?require('../graph-search/engines.js'):root.SearchEngines);if(typeof module==='object')module.exports=api;else root.WeightedSearch=api})(globalThis,S=>{
 function validate(graph,start,goal){const ids=graph.nodes.map(n=>n.id);if(new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(id)||['constructor','prototype','__proto__'].includes(id)))throw Error('Node identifiers must be unique safe strings.');if(!ids.includes(start)||!ids.includes(goal))throw Error('Choose existing start and goal nodes.');for(const e of graph.edges)if(!ids.includes(e[0])||!ids.includes(e[1])||!Number.isFinite(e[2])||e[2]<0)throw Error('Every edge needs existing endpoints and a finite, non-negative cost.');return true}
 function neighbors(graph){const adj=Object.fromEntries(graph.nodes.map(n=>[n.id,[]]));for(const [a,b,w]of graph.edges){adj[a].push({node:b,cost:w});if(!graph.directed)adj[b].push({node:a,cost:w})}return adj}
 function context(graph,start,goal,h,priority){validate(graph,start,goal);for(const n of graph.nodes)if(!Number.isFinite(h[n.id])||h[n.id]<0)throw Error('Heuristics must be finite and non-negative.');if(h[goal]!==0)throw Error('The goal heuristic must be zero.');const adj=neighbors(graph),g=Object.fromEntries(graph.nodes.map(n=>[n.id,Infinity])),parent={[start]:null},open=new Map([[start,0]]),closed=new Set(),expanded=[];g[start]=0;let serial=1;
  const s={current:null,phase:'initialize',event:'Initialize the start node in the priority queue.',steps:0,done:false,found:false,path:[],edge:null,tentative:null,previousCost:null,changed:null,operation:null};
  const row=id=>({node:id,g:g[id],h:h[id],f:g[id]+h[id],parent:parent[id]??null,order:open.get(id)??-1});
  const queue=()=>[...open.keys()].map(row).sort(priority);
  function emit(phase,event,details={}){Object.assign(s,{phase,event,changed:null,operation:null},details)}
  function pop(){const next=queue()[0];if(!next){s.done=true;emit('failure','The frontier is empty. The goal is unreachable.');return false}s.current=next.node;open.delete(s.current);s.edge=null;return true}
  function close(){closed.add(s.current);expanded.push(s.current)}
  function inspect(next){s.edge=[s.current,next.node];s.tentative=null;s.previousCost=g[next.node]}
  function calculate(next){s.tentative=g[s.current]+next.cost;return s.tentative}
  function relax(next){const id=next.node;if(s.tentative>=g[id])return {changed:false,operation:'skip'};const existed=open.has(id),reopened=closed.delete(id);g[id]=s.tentative;parent[id]=s.current;if(!existed)open.set(id,serial++);return {changed:id,operation:reopened?'reopen':existed?'decrease':'insert'}}
  function snapshot(){const route=s.current?S.pathTo(parent,s.current):[start],bestPath=Number.isFinite(g[goal])?S.pathTo(parent,goal):route;return {...s,edge:s.edge?[...s.edge]:null,path:[...s.path],open:queue(),closed:[...closed],expanded:[...expanded],g:{...g},h:{...h},f:Object.fromEntries(graph.nodes.map(n=>[n.id,g[n.id]+h[n.id]])),parent:{...parent},route,bestPath,bestCost:bestPath.slice(1).reduce((total,id,i)=>total+Math.min(...adj[bestPath[i]].filter(e=>e.node===id).map(e=>e.cost)),0),goalCost:g[goal],start,goal}}
  function finish(){s.found=true;emit('goal',`Goal ${goal} was removed from the minimum-priority frontier. Reconstruct its parent chain next.`)}
  function reconstruct(){s.path=S.pathTo(parent,goal);s.done=true;emit('complete',`Shortest path: ${s.path.join(' → ')}. Total cost ${g[goal]}.`)}
  return {s,g,h,parent,adj,queue,pop,close,inspect,calculate,relax,emit,finish,reconstruct,snapshot};
 }
 function drive(ctx,iterator){return {snapshot:ctx.snapshot,step(){if(!ctx.s.done){ctx.s.steps++;iterator.next()}return ctx.snapshot()}}}
 return {validate,neighbors,context,drive};
});
