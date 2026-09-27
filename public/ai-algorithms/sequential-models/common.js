const PhaseFourUI=(()=>{
 const U=PhaseThreeUI;
 function probability(logValue){if(logValue==null)return '—';if(logValue===-Infinity)return '0';if(logValue<-700)return `exp(${logValue.toFixed(2)})`;const p=Math.exp(logValue);return p<.0001?p.toExponential(3):p.toFixed(p<.01?6:4)}
 const mark='<svg viewBox="0 0 80 60" width="72" height="60" fill="none"><path d="M15 15h50M15 45h50M15 15v30M40 15v30M65 15v30" stroke="#9abbd8" stroke-width="2" stroke-dasharray="4 3"/><circle cx="15" cy="15" r="9" fill="#a4d9ff" stroke="#1487fb" stroke-width="2"/><circle cx="40" cy="15" r="9" fill="#ffd2da" stroke="#e94575" stroke-width="2"/><circle cx="65" cy="15" r="9" fill="#c7f4d9" stroke="#17a774" stroke-width="2"/><rect x="8" y="38" width="14" height="14" rx="5" fill="#187feb"/><rect x="33" y="38" width="14" height="14" rx="5" fill="#187feb"/><rect x="58" y="38" width="14" height="14" rx="5" fill="#187feb"/></svg>';
 function matrix(title,rows,cols,data,{id=''}={}){return `<div class="matrix" ${id?`id="${id}"`:''}><h3>${title}</h3>${U.table(['State',...cols],rows.map((r,i)=>`<tr tabindex="0" data-matrix-row="${i}"><td><b class="state-color s${i}">${U.esc(r)}</b></td>${data[i].map(v=>`<td class="num">${U.fmt(v,3)}</td>`).join('')}</tr>`).join(''))}</div>`}
 function controller(create,render,{delay=450}={}){let engine=create(),state=engine.snapshot(),timer=null,speed=1,until=null,previous=null;
  function draw(motion=false){window.LabUX?.beforeRender();render(state,engine,motion,previous);for(const id of ['run','step'])if(U.$(id))U.$(id).disabled=!!state.done}
  function pause(){if(timer)clearInterval(timer);timer=null;until=null;const b=U.$('run');if(b)b.textContent=b.dataset.label||'▶ Run'}
  function step(){previous=state;state=engine.step();if(state.done||(until&&until(state)))pause();draw(true)}
  function run(stop=null){if(timer){pause();return}if(state.done)return;until=stop;timer=setInterval(step,Math.max(25,delay/speed));U.$('run').textContent='Ⅱ Pause'}
  function reset(){pause();engine=create();state=engine.snapshot();previous=null;draw()}
  function bind(){addEventListener('pagehide',pause);U.$('run').onclick=()=>run();U.$('step').onclick=()=>{pause();step()};U.$('reset').onclick=reset;if(U.$('speed'))U.$('speed').oninput=e=>{speed=+e.target.value;U.$('speedValue').textContent=speed+'x';if(timer){clearInterval(timer);timer=setInterval(step,Math.max(25,delay/speed))}};draw();document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()})}
  return {bind,run,pause,reset,step,redraw:()=>draw(),get state(){return state},get engine(){return engine}};
 }
 function rowInteractions(){document.querySelectorAll('[data-matrix-row]').forEach(el=>{el.onclick=()=>{el.closest('tbody').querySelectorAll('tr').forEach(r=>r.classList.remove('selected'));el.classList.add('selected')};el.onkeydown=e=>{if(e.key==='Enter')el.dispatchEvent(new MouseEvent('click',{bubbles:true}))}})}
 function helpButtons(top,sections){top.insertAdjacentHTML('beforeend',`<nav class="top-actions">${sections.map(([key,label])=>`<button data-help="${key}"><span>${key==='guide'?'◫':key==='examples'?'▷':key==='settings'?'⚙':'?'}</span>${label}</button>`).join('')}</nav>`);document.body.insertAdjacentHTML('beforeend','<dialog id="helpDialog" class="learning-dialog"><h2 id="helpTitle"></h2><div id="helpBody"></div><form method="dialog"><button class="btn">Close</button></form></dialog>')}
 function showHelp(title,body){U.$('helpTitle').textContent=title;U.$('helpBody').innerHTML=body;U.$('helpDialog').showModal()}
 return {...U,probability,mark,matrix,controller,rowInteractions,helpButtons,showHelp};
})();
