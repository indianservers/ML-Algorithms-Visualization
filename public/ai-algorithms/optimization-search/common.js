const PhaseTwoUI=(()=>{
  const E=window.PhaseTwoEngines;
  const $=id=>document.getElementById(id);
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(x,n=2)=>Number.isFinite(x)?Number(x).toFixed(n):'∞';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const card=(title,body,icon='▣',cls='')=>`<section class="card ${cls}"><h2><span class="icon" aria-hidden="true">${icon}</span>${title}</h2>${body}</section>`;
  function brandIcon(kind){
    if(kind==='annealing')return '<svg viewBox="0 0 60 60" width="58" height="58" fill="none"><rect x="4" y="4" width="52" height="52" rx="12" fill="#dce8ff" stroke="#6e87fa" stroke-width="2"/><path d="M30 13a5 5 0 0 0-5 5v22a10 10 0 1 0 10 0V18a5 5 0 0 0-5-5Z" stroke="#4074ec" stroke-width="3" fill="#fff"/><path d="M30 25v20" stroke="#ef5a64" stroke-width="4"/><circle cx="30" cy="47" r="6" fill="#ef5a64"/></svg>';
    if(kind==='genetic')return '<svg viewBox="0 0 60 60" width="58" height="58" fill="none" stroke-width="4" stroke-linecap="round"><path d="M15 5C50 13 10 46 45 55" stroke="#297df1"/><path d="M45 5C10 13 50 46 15 55" stroke="#8644d9"/><path d="M19 11h22M19 22h22M19 37h22M19 49h22" stroke="#8a9bcc" stroke-width="2"/></svg>';
    return '<svg viewBox="0 0 60 60" width="58" height="58" fill="none" stroke="#1e5a9c" stroke-width="3"><path d="M30 9 16 29 8 49M16 29l13 20M30 9l14 20-14 20M44 29l8 20"/><circle cx="30" cy="9" r="7" fill="#60a9f4"/><circle cx="16" cy="29" r="6" fill="#54b69a"/><circle cx="44" cy="29" r="6" fill="#54b69a"/><circle cx="8" cy="49" r="5" fill="#5abbd0"/><circle cx="29" cy="49" r="5" fill="#5abbd0"/><circle cx="52" cy="49" r="5" fill="#5abbd0"/></svg>';
  }
  function header(title,symbol,extra){return `<header class="top"><div class="brand" aria-hidden="true">${symbol}</div><div><h1>${title}</h1><div class="subtitle">Interactive Virtual Lab &nbsp;•&nbsp; Explore &nbsp;•&nbsp; Visualize &nbsp;•&nbsp; Learn</div></div><div class="top-extra">${extra}</div></header>`}
  function progress(names,active){return `<div class="progress">${names.map((name,i)=>`<div class="stage ${i<active?'done':i===active?'active':''}"><div class="circle">${i<active?'✓':i+1}</div><b>${name}</b></div>`).join('')}</div>`}
  function chart(series,{min=null,max=null,log=false,width=420,height=160,points=true,xLabel="Step",xStart=0,xStep=1}={}){
    const pad={l:35,r:12,t:19,b:24},values=series.flatMap(s=>s.data.map(Number)).filter(Number.isFinite);
    if(!values.length)return `<div class="small">Chart updates as the simulation runs.</div>`;
    const trans=x=>log?Math.log10(Math.max(1e-6,x)):x;
    const lo=min===null?Math.min(...values):min,rawHi=max===null?Math.max(...values):max,hi=rawHi>lo?rawHi:lo+1,a=trans(lo),b=trans(hi),span=b-a||1,N=Math.max(2,...series.map(s=>s.data.length));
    const px=i=>pad.l+i*(width-pad.l-pad.r)/(N-1),py=x=>height-pad.b-(Math.max(a,Math.min(b,trans(x)))-a)/span*(height-pad.t-pad.b);
    const grid=[0,.25,.5,.75,1].map(t=>{const y=pad.t+t*(height-pad.t-pad.b),v=log?Math.pow(10,b-t*span):hi-t*(hi-lo);return `<line class="gridline" x1="${pad.l}" y1="${y}" x2="${width-pad.r}" y2="${y}"/><text x="1" y="${y+3}">${log?v.toExponential(0):fmt(v,hi-lo>10?0:1)}</text>`}).join('');
    const lines=series.map(s=>{const valid=s.data.map((v,i)=>({v:Number(v),i})).filter(p=>Number.isFinite(p.v));if(!valid.length)return '';const d=valid.map((p,j)=>`${j?'L':'M'}${px(p.i).toFixed(1)},${py(p.v).toFixed(1)}`).join(' '),last=valid[valid.length-1],stride=Math.max(1,Math.ceil(valid.length/80)),samples=valid.filter((p,j)=>j%stride===0||j===valid.length-1);return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round"/><g>${samples.map(p=>`<circle class="chart-hit" cx="${px(p.i)}" cy="${py(p.v)}" r="6" fill="transparent" data-tooltip="${esc(s.label)} · ${esc(xLabel.toLowerCase())} ${Number((xStart+p.i*xStep).toFixed(3))}: ${esc(Number(p.v.toPrecision(6)))}"/>`).join('')}</g>${points?`<circle cx="${px(last.i)}" cy="${py(last.v)}" r="3.5" fill="${s.color}" pointer-events="none"/>`:''}`}).join('');
    return `<div class="legend">${series.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div><svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(series.map(s=>s.label).join(' and '))} chart">${grid}<line class="axis" x1="${pad.l}" y1="${height-pad.b}" x2="${width-pad.r}" y2="${height-pad.b}"/>${lines}${[0,Math.floor((N-1)/2),N-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>`<text x="${px(i)}" y="${height-12}" text-anchor="middle">${Number((xStart+i*xStep).toFixed(1))}</text>`).join('')}<text x="${width/2}" y="${height-1}" text-anchor="middle">${esc(xLabel)}</text></svg>`
  }
  function speedControl(){return `<div class="field"><label>Animation Speed <span class="value" id="speedValue">1.0x</span></label><input class="range" type="range" id="speed" min="0.25" max="4" step="0.25" value="1" aria-label="Animation speed"><div class="range-ends"><span>Slow</span><span>Normal</span><span>Fast</span></div></div>`}
  function driver(create,render,{stopAfterCycle=false,cycleKey='generation'}={}){
    let engine=create(),state=engine.snapshot(),timer=null,speed=1,target=null;
    function draw(animated=false){window.LabUX?.beforeRender();render(state,animated);for(const id of ['run','step'])if($(id))$(id).disabled=!!state.done;if(state.done)pause()}
    function step(){if(state.done)return;state=engine.step();draw(true);if(stopAfterCycle&&target!==null&&state[cycleKey]>=target&&state.phase==='selection')pause()}
    function pause(){if(timer)clearInterval(timer);timer=null;const b=$('run');if(b)b.textContent=b.dataset.label||'▶ Run'}
    function run(){if(state.done)return;if(timer){pause();return}target=stopAfterCycle?state[cycleKey]+1:null;timer=setInterval(step,Math.max(120,650/speed));$('run').textContent='Ⅱ Pause'}
    function reset(){pause();engine=create();state=engine.snapshot();target=null;draw()}
    function bind(){addEventListener('pagehide',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});if($('run'))$('run').onclick=run;if($('step'))$('step').onclick=()=>{pause();step()};if($('reset'))$('reset').onclick=reset;if($('speed'))$('speed').oninput=e=>{speed=+e.target.value;$('speedValue').textContent=`${fmt(speed,2)}x`;if(timer){clearInterval(timer);timer=setInterval(step,Math.max(120,650/speed))}};draw()}
    return {bind,step,run,pause,reset,get state(){return state}}
  }
  function animate(selector,vars={}){if(!reduced&&window.gsap&&document.querySelector(selector))gsap.fromTo(selector,{opacity:0,y:10},{opacity:1,y:0,duration:.35,ease:'power2.out',...vars})}
  return {E,$,esc,fmt,reduced,card,brandIcon,header,progress,chart,speedControl,driver,animate};
})();
