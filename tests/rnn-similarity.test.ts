import { expect,it } from 'vitest';
import { createRnnWeights, forwardRnn } from '../src/lib/algorithms/neural/rnn';
it('uses signed cosine similarity without an artificial decay factor',()=>{
  const result=forwardRnn([[1],[-1],[1]],createRnnWeights(4,1,1,'orthogonal',0),'tanh');
  const final=result.states.at(-1)!;
  result.states.slice(1).forEach((s,i)=>{
    const cosine=s.reduce((n,v,j)=>n+v*final[j],0)/(Math.hypot(...s)*Math.hypot(...final)||1);
    expect(result.decay[i]).toBeCloseTo(cosine);
  });
});
