/* Immutable one-queen-per-column states; rows are zero-based from the bottom. */
(function(root,factory){const api=factory(typeof module==='object'?require('../optimization-search/engines.js'):root.PhaseTwoEngines);if(typeof module==='object')module.exports=api;else root.NQueens=api})(globalThis,E=>{
 function validate(a){if(!Array.isArray(a)||a.length<4||a.length>10||a.some(r=>!Number.isInteger(r)||r<0||r>=a.length))throw Error('Use 4–10 queens with one valid row per column.');return a}
 function pairs(a){const out=[];for(let c=0;c<a.length;c++)for(let d=c+1;d<a.length;d++)if(a[c]===a[d]||Math.abs(a[c]-a[d])===d-c)out.push([c,d]);return out}
 const conflicts=a=>pairs(a).length,key=a=>a.join(','),move=(a,c,r)=>a.map((v,i)=>i===c?r:v);
 function neighbors(a){validate(a);const out=[];for(let c=0;c<a.length;c++)for(let r=0;r<a.length;r++)if(r!==a[c]){const rows=move(a,c,r);out.push({rows,col:c,from:a[c],to:r,h:conflicts(rows),key:key(rows),order:out.length})}return out}
 function initial(n=8,mode='random',seed=2026){const random=E.rng(seed||1);return Array.from({length:n},(_,i)=>mode==='diagonal'?i:Math.floor(random()*n))}
 function diversity(states){let sum=0,count=0;for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++){sum+=states[i].filter((r,c)=>r!==states[j][c]).length;count++}return count?sum/count:0}
 return {validate,pairs,conflicts,key,move,neighbors,initial,diversity,rng:E.rng};
});
