/*
 * SMA* for finite directed search TREES (one parent per problem node).
 * Retained ancestors count toward M. A retained expanded node carries scalar
 * successor bounds, not forgotten child records. OPEN includes physical leaves
 * and parents with a missing successor. Best: least f, deepest, oldest; eviction:
 * greatest f, shallowest, newest physical leaf. An incoming leaf participates in
 * eviction before allocation, so even intermediate snapshots use <= M records.
 * Pathmax f=max(parent bound,g+h,remembered bound). Backup raises a parent's f
 * to the minimum successor bound and propagates upward. A non-goal path filling
 * M records is infeasible (infinite bound). The immutable problem and bounded UI
 * audit are separate from resident search memory; the algorithm never reads audit.
 */
(function(root,factory){const api=factory(typeof module==='object'?require('../weighted-search/weighted-core.js'):root.WeightedSearch);if(typeof module==='object')module.exports=api;else root.MemoryBoundedSearch=api})(globalThis,W=>{
 function engine(graph,start,goal,memory=4,heuristic={}){W.validate(graph,start,goal);if(!graph.directed||!Number.isInteger(memory)||memory<1)throw Error('SMA* requires a directed tree and a positive integer memory bound.');const adj=W.neighbors(graph),incoming={};for(const [a,b]of graph.edges){if(incoming[b])throw Error('Use a tree with at most one parent per node.');incoming[b]=a}for(const n of graph.nodes){const seen=new Set();let id=n.id;while(id){if(seen.has(id))throw Error('The tree must be acyclic.');seen.add(id);id=incoming[id]}}
 const h=Object.fromEntries(graph.nodes.map(n=>[n.id,heuristic[n.id]??0]));if(Object.values(h).some(x=>!Number.isFinite(x)||x<0)||h[goal]!==0)throw Error('Use non-negative finite heuristics, with h(goal)=0.');
 let serial=0,steps=0,phase='initialize',event='Start is the only retained search node.',done=false,found=false,current=start,worst=null,changed=null,path=[],prunes=0,regenerations=0,expansions=0,pending=null;const resident=new Map(),audit=new Map();
 function record(id,parent,g,depth,bound){return {id,parent,g,h:h[id],f:Math.max(g+h[id],bound),backed:null,depth,order:serial++,expanded:false,slots:null,regenerated:false}}
 resident.set(start,record(start,null,0,0,0));
 function note(n,status){audit.set(n.id,{id:n.id,g:n.g,h:n.h,f:n.f,backed:n.backed,status,step:steps,regenerated:n.regenerated})}
 note(resident.get(start),'In Memory');
 function children(n){return [...resident.values()].filter(x=>x.parent===n.id)}
 function backup(id){let n=resident.get(id);while(n){if(n.slots&&n.slots.every(s=>s.generated)){const bound=Math.min(...n.slots.map(s=>resident.get(s.id)?.f??s.f));n.f=Math.max(n.f,bound);n.backed=n.f;note(n,n.regenerated?'Regenerated':'Expanded')}if(n.parent){const p=resident.get(n.parent),slot=p.slots.find(x=>x.id===n.id);slot.f=Math.max(slot.f,n.f)}n=resident.get(n.parent)}}
 function open(){const out=[];for(const n of resident.values()){if(!n.expanded)out.push({...n,action:'expand'});else if(n.slots?.some(x=>!resident.has(x.id)&&Number.isFinite(x.f))){const unseen=n.slots.find(x=>!x.generated),choices=n.slots.filter(x=>!resident.has(x.id)).sort((a,b)=>a.f-b.f||a.order-b.order),next=unseen||choices[0];out.push({...n,f:unseen?n.f:Math.max(n.f,next.f),action:'generate',successor:next.id})}}return out.sort((a,b)=>a.f-b.f||b.depth-a.depth||a.order-b.order)}
 function route(id){const out=[];while(id!=null){out.push(id);id=resident.get(id)?.parent??null}return out.reverse()}
 function snapshot(){return {steps,phase,event,done,found,current,worst,changed,path:[...path],activePath:route(current),cost:found?resident.get(goal)?.g:null,memory,used:resident.size,prunes,regenerations,expansions,open:open().map(n=>({id:n.id,g:n.g,h:n.h,f:n.f,depth:n.depth,action:n.action,successor:n.successor})),nodes:[...audit.values()].map(x=>({...x,inMemory:resident.has(x.id)})),retained:[...resident.values()].map(n=>({id:n.id,parent:n.parent,g:n.g,h:n.h,f:n.f,backed:n.backed,depth:n.depth,expanded:n.expanded,regenerated:n.regenerated})),pending:pending?{id:pending.id,parent:pending.parent,g:pending.g,h:pending.h,f:pending.f,regenerated:pending.regenerated}:null}}
 function step(){if(done)return snapshot();steps++;changed=null;
  if(phase==='memory'){phase='prune';prunes++;if(worst===pending.id){const p=resident.get(pending.parent),slot=p.slots.find(x=>x.id===pending.id);slot.f=Math.max(slot.f,pending.f);slot.forgotten=true;note(pending,'Pruned');event=`Forget incoming leaf ${pending.id}, f=${pending.f}; no memory slot was allocated.`;backup(p.id);pending=null}else{const n=resident.get(worst),p=resident.get(n.parent),slot=p.slots.find(x=>x.id===n.id);slot.f=Math.max(slot.f,n.f);slot.forgotten=true;note(n,'Pruned');resident.delete(n.id);backup(p.id);event=`Forget worst leaf ${n.id} (f=${n.f}); store its bound in parent ${p.id}.`}return snapshot()}
  if(phase==='prune'){phase='backup';changed=pending?.parent||current;event='Propagate minimum successor bounds upward. Backed-up f-values never decrease.';return snapshot()}
  if(pending){resident.set(pending.id,pending);current=pending.id;if(pending.regenerated)regenerations++;phase=pending.regenerated?'regenerate':'generate';note(pending,pending.regenerated?'Regenerated':'In Memory');event=`${pending.regenerated?'Regenerate':'Retain'} ${pending.id}: g=${pending.g}, h=${pending.h}, f=${pending.f}. Memory ${resident.size}/${memory}.`;pending=null;worst=null;return snapshot()}
  const next=open()[0];if(!next||!Number.isFinite(next.f)){done=true;phase='failure';event='No reachable goal fits the memory bound (or the selected goal is unreachable). Increase memory or change the goal.';return snapshot()}
  current=next.id;const n=resident.get(current);if(n.id===goal){found=true;done=true;phase='goal';path=route(goal);note(n,'Goal');event=`Goal reached: ${path.join(' → ')}; cost ${n.g}.`;return snapshot()}
  if(next.action==='expand'){expansions++;n.expanded=true;phase='expand';if(n.depth>=memory-1||!adj[n.id].length){n.slots=[];n.f=Infinity;n.backed=Infinity;backup(n.id);event=n.depth>=memory-1?`Path to ${n.id} fills all ${memory} slots without reaching the goal. Back up infinity.`:`${n.id} is a non-goal dead end. Back up infinity.`}else{n.slots=adj[n.id].map((e,i)=>({id:e.node,cost:e.cost,f:n.f,order:i,forgotten:false,generated:false}));backup(n.id);event=`Expand ${n.id}; ${n.slots.length} successor bounds. Generate one successor at a time.`}note(n,'Expanded');return snapshot()}
  const slot=n.slots.find(x=>x.id===next.successor);pending=record(slot.id,n.id,n.g+slot.cost,n.depth+1,Math.max(n.f,slot.f));pending.regenerated=slot.forgotten;
  if(pending.depth>=memory-1&&pending.id!==goal)pending.f=Infinity;slot.generated=true;slot.f=pending.f;backup(n.id);
  if(resident.size>=memory){const leaves=[...resident.values()].filter(x=>x.parent!=null&&x.id!==n.id&&children(x).length===0);leaves.push(pending);leaves.sort((a,b)=>b.f-a.f||a.depth-b.depth||b.order-a.order);worst=leaves[0].id;phase='memory';event=`Memory is full (${resident.size}/${memory}). Worst eligible leaf: ${worst}, f=${leaves[0].f}. Back up its bound before replacement.`}else{phase='prepare';event=`Generate ${pending.id}: f=max(parent f, g+h, remembered bound)=${pending.f}. A free memory slot is available.`}return snapshot()
 }
 return {step,snapshot};
 }
 function graph(){return {directed:true,nodes:[['A',370,95,7],['B',205,235,6],['C',535,235,4],['D',85,405,6],['E',300,405,3],['F',495,405,5],['G',655,405,1],['H',30,575,6],['I',145,575,5],['J',255,575,4],['K',410,575,2],['L',655,575,0]].map(([id,x,y,h])=>({id,x,y,h})),edges:[['A','B',2],['A','C',3],['B','D',2],['B','E',3],['C','F',1],['C','G',4],['D','H',3],['D','I',2],['E','J',4],['E','K',2],['G','L',1]]}}
 function heuristics(graph,goal,mode='predefined'){const distance={[goal]:0};for(let i=0;i<graph.nodes.length;i++)for(const [a,b,w]of graph.edges)if(distance[b]!=null)distance[a]=Math.min(distance[a]??Infinity,w+distance[b]);return Object.fromEntries(graph.nodes.map(n=>[n.id,mode==='zero'?0:Math.min(n.h||0,distance[n.id]??Infinity)]))}
 return {engine,graph,heuristics};
});
