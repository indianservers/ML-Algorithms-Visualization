(function(root,factory){const api=factory(typeof module==='object'?require('./gridworld.js'):root.Gridworld);if(typeof module==='object')module.exports=api;else root.MdpEngine=api})(typeof globalThis!=='undefined'?globalThis:this,G=>{
  function engine(config={}){const c={gamma:.9,threshold:.001,...config},env=G.environment(c),values=Array(env.size**2).fill(0);let iteration=0,delta=0,done=false,history=[],event='Select a state to inspect its transition model. Run or Step applies one synchronous Bellman sweep.';
    function actionValues(s,v=values){return G.expectedReturns(env,s,v,c.gamma)}
    function snapshot(){const policy=values.map((_,s)=>env.walls.includes(s)||env.terminal(s)?null:actionValues(s).indexOf(Math.max(...actionValues(s))));return {values:[...values],policy,iteration,delta,done,history:[...history],event,phase:done?'converged':iteration?'iterate':'setup',config:{...c}}}
    function step(){if(done)return snapshot();const previous=[...values];delta=0;for(const s of env.states){if(env.terminal(s))continue;values[s]=Math.max(...actionValues(s,previous));delta=Math.max(delta,Math.abs(values[s]-previous[s]))}iteration++;history.push(delta);done=delta<c.threshold;event=`Sweep ${iteration}: max |ΔV| = ${delta.toFixed(5)}. ${done?'Converged at the selected threshold.':'Values used the previous sweep; policy is greedy with respect to the new values.'}`;return snapshot()}
    return {env,step,snapshot,actionValues};
  }
  return {engine};
});
