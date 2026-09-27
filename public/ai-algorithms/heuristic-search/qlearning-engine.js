/* Configure the existing temporal-difference engine; do not duplicate Q updates. */
(function(root,factory){const api=factory(typeof module==='object'?require('../decision-processes/sarsa-engine.js'):root.SarsaEngine);if(typeof module==='object')module.exports=api;else root.QLearningLab=api})(typeof globalThis!=='undefined'?globalThis:this,S=>{
 function environment(preset='classic',rewardMode='standard'){
  const simple=preset==='simple',size=simple?3:5;
  return {size,start:0,goal:size*size-1,hole:false,walls:simple?[4]:[6,17],penalties:simple?[]:[8,21],slip:0,stepReward:rewardMode==='sparse'?0:-1,wallReward:-1,goalReward:10,penaltyReward:rewardMode==='risky'?-10:-5};
 }
 function engine(config={},seed=2026){return S.engine({epsilon:.2,alpha:.5,gamma:.9,episodes:500,maxSteps:100,...config,algorithm:'qlearning',decay:false,environment:config.environment||environment(config.preset,config.rewardMode)},seed)}
 return {engine,environment};
});
