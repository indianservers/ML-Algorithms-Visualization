(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.AlphaBeta=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const defaults=[3,2,2,5,5,6,1,4,7,9];
  function engine(config={}){
    const c={depth:3,maximizing:true,pruning:true,order:'left',mode:'fixed',seed:2026,...config};let serial=0,leafIndex=0,seed=c.seed>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    const nodes=[];
    function node(level,label,shape){const leaf=shape===0,n={id:serial++,label,level,type:leaf?'Leaf':((level%2===0)===c.maximizing?'MAX':'MIN'),children:[],alpha:-Infinity,beta:Infinity,value:null,status:'Pending',best:null,bound:null};nodes.push(n);if(leaf){n.utility=c.mode==='random'?Math.floor(random()*19)-9:(c.leaves||defaults)[leafIndex%(c.leaves||defaults).length];leafIndex++}else{const children=Array.isArray(shape)?shape:Array.from({length:level===0?3:2},()=>shape-1);n.children=children.map((s,i)=>node(level+1,level===0?String.fromCharCode(65+i):label+(i+1),s))}return n}
    // A supplied game tree shares the same search, backup and pruning implementation.
    function supplied(data,level=0){const leaf=!data.children?.length,n={...data,id:serial++,level,type:leaf?'Leaf':((level%2===0)===c.maximizing?'MAX':'MIN'),children:[],alpha:-Infinity,beta:Infinity,value:null,status:'Pending',best:null,bound:null};nodes.push(n);if(leaf)leafIndex++;else n.children=data.children.map(x=>supplied(x,level+1));return n}
    const root=c.tree?supplied(c.tree):node(0,'Root',c.depth===3?[[[0,0],[0,0]],[0,0],[[0,0],[0,0]]]:c.depth);
    const minimax=n=>n.type==='Leaf'?n.utility:(n.type==='MAX'?Math.max:Math.min)(...n.children.map(minimax));
    function order(n){if(c.order==='right')n.children.reverse();if(c.order==='best')n.children.sort((a,b)=>(n.type==='MAX'?-1:1)*(minimax(a)-minimax(b)));n.children.forEach(order)}order(root);
    let current=root.id,event='Initialize α = −∞ and β = +∞ at the root.',phase='initialize',branches=0,evaluated=0,skipped=0,done=false,cutoff=null;
    const markPruned=n=>{n.status='Pruned';if(n.type==='Leaf')skipped++;n.children.forEach(markPruned)};
    function* visit(n,alpha,beta){current=n.id;n.alpha=alpha;n.beta=beta;n.status='Evaluating';phase='enter';event=`Enter ${n.label} (${n.type}).`;yield;
      if(n.type==='Leaf'){n.value=n.utility;n.status='Evaluated';evaluated++;phase='evaluate';event=`Evaluate ${n.label}: utility ${n.value}.`;yield;return n.value}
      let value=n.type==='MAX'?-Infinity:Infinity;
      for(let i=0;i<n.children.length;i++){const child=n.children[i],v=yield* visit(child,alpha,beta);current=n.id;phase='return';event=`${child.label} returns ${v} to ${n.label}.`;yield;
        if(n.best===null||(n.type==='MAX'?v>value:v<value))n.best=child.id;
        value=n.type==='MAX'?Math.max(value,v):Math.min(value,v);n.value=value;
        if(n.type==='MAX')alpha=Math.max(alpha,value);else beta=Math.min(beta,value);n.alpha=alpha;n.beta=beta;phase='bounds';event=`${n.label}: ${n.type==='MAX'?'α':'β'} becomes ${n.type==='MAX'?alpha:beta}. Current value ${value}.`;yield;
        phase='check';event=`Check cutoff at ${n.label}: α ${alpha>=beta?'≥':'<'} β${c.pruning?'':'; pruning is disabled'}.`;yield;
        if(c.pruning&&alpha>=beta&&i<n.children.length-1){const remaining=n.children.slice(i+1),before=skipped;remaining.forEach(markPruned);branches+=remaining.length;n.bound=n.type==='MAX'?'lower':'upper';cutoff={node:n.label,alpha,beta,skipped:skipped-before};phase='prune';event=`${n.label}: α = ${alpha}, β = ${beta}. ${n.type==='MAX'?'α ≥ β':'β ≤ α'}; skip ${skipped-before} unvisited leaves.`;yield;break}
      }
      n.status='Evaluated';current=n.id;phase='backup';event=`Back up ${value}${n.bound?' ('+n.bound+' bound)':''} from ${n.label}.`;yield;return value;
    }
    function* run(){yield* visit(root,-Infinity,Infinity);done=true;phase='finish';current=root.id;event=root.best===null?`Root is terminal: utility ${root.value}.`:`Best root move ${nodes[root.best].label}: minimax value ${root.value}. Evaluated ${evaluated} of ${leafIndex} leaves.`;yield}
    const iterator=run();
    function snapshot(){const pv=[];if(done){let n=root;while(n){pv.push(n.id);n=nodes[n.best]}}return {nodes:nodes.map(n=>({...n,children:n.children.map(x=>x.id)})),root:root.id,current,event,phase,branches,evaluated,skipped,total:leafIndex,done,cutoff:cutoff?{...cutoff}:null,pv,value:root.value,best:root.best,config:{...c}}}
    return {step(){if(!done)iterator.next();return snapshot()},snapshot,referenceValue:()=>minimax(root)};
  }
  return {engine,defaults};
});
