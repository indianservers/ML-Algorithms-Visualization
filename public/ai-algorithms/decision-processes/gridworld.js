/* Shared environment only: algorithms keep their own values, policies and updates. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Gridworld=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const actions=[{name:'Up',arrow:'↑',dr:-1,dc:0},{name:'Down',arrow:'↓',dr:1,dc:0},{name:'Left',arrow:'←',dr:0,dc:-1},{name:'Right',arrow:'→',dr:0,dc:1}];
  function rng(seed=2026){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
  function environment(config={}){
    const learning=config.preset==='learning',size=config.size??(learning?7:config.preset==='small'?3:5);
    const walls=[...new Set(config.walls??(learning?[3,12,15,24,28,39]:size===5?[7,16]:[4]))];
    const goal=config.goal==null?(learning?48:size-1):+config.goal;
    const hole=config.hole===false?null:typeof config.hole==='number'?config.hole:size===5?12:size===3?8:null;
    const penalties=[...new Set(config.penalties??(learning?[9,20,30,36]:[]))];
    const slip=config.slip??(config.preset==='slippery'?.3:config.preset==='small'?0:.2);
    const stepReward=config.stepReward??-.04,goalReward=config.goalReward??1,holeReward=config.holeReward??-1,penaltyReward=config.penaltyReward??-1,wallReward=config.wallReward??stepReward;
    const start=config.start??(learning?0:(size-1)*size),states=Array.from({length:size*size},(_,i)=>i).filter(i=>!walls.includes(i));
    if(!Number.isInteger(size)||size<2||size>12||[goal,start,...walls,...(hole==null?[]:[hole])].some(i=>!Number.isInteger(i)||i<0||i>=size*size)||walls.includes(goal)||walls.includes(start)||walls.includes(hole)||goal===hole||start===goal||start===hole||slip<0||slip>1)throw new Error('Invalid Gridworld configuration');
    const terminal=s=>s===goal||s===hole;
    const coord=s=>`(${Math.floor(s/size)}, ${s%size})`;
    function move(s,a){const action=actions[a],r=Math.floor(s/size)+action.dr,c=s%size+action.dc;const next=r*size+c;return r<0||r>=size||c<0||c>=size||walls.includes(next)?s:next}
    function reward(s,next){if(terminal(s))return 0;return next===goal?goalReward:next===hole?holeReward:penalties.includes(next)?penaltyReward:next===s?wallReward:stepReward}
    function transitions(s,a){if(terminal(s))return [{next:s,p:1,reward:0}];const side=a<2?[2,3]:[0,1],moves=[[a,1-slip],[side[0],slip/2],[side[1],slip/2]],merged=new Map();for(const [direction,p]of moves){if(!p)continue;const next=move(s,direction);merged.set(next,(merged.get(next)||0)+p)}return [...merged].map(([next,p])=>({next,p,reward:reward(s,next)}))}
    function sample(s,a,random){const outcomes=transitions(s,a),draw=random();let sum=0;for(const o of outcomes){sum+=o.p;if(draw<sum)return {...o,terminal:terminal(o.next)}}const o=outcomes.at(-1);return {...o,terminal:terminal(o.next)}}
    return {size,states,walls,goal,hole,penalties,start,slip,stepReward,goalReward,holeReward,penaltyReward,wallReward,terminal,coord,move,reward,transitions,sample};
  }
  function expectedReturns(env,s,values,gamma){return actions.map((_,a)=>env.transitions(s,a).reduce((sum,o)=>sum+o.p*(o.reward+gamma*(env.terminal(o.next)?0:values[o.next])),0))}
  return {actions,rng,environment,expectedReturns};
});
