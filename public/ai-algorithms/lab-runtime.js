/* Document-scoped presentation/lifecycle support; never reads or mutates engines. */
(()=>{
 const paths={graph:'M12 3v6M12 9L4 20M12 9l8 11M4 20h16',list:'M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1',settings:'M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',chart:'M4 20V12h3v8M11 20V4h3v16M18 20V8h3v12',play:'M7 4L20 12L7 20Z',step:'M3 5L12 12L3 19ZM12 5L21 12L12 19Z',reset:'M4 7a9 9 0 1 1-1 10M4 2v6h6',book:'M12 5C8 2 4 2 2 4v16C5 18 9 19 12 21C15 19 19 18 22 20V4C19 2 15 2 12 5ZM12 5v16',goal:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10',grid:'M3 3h18v18H3ZM3 9h18M3 15h18M9 3v18M15 3v18'};
 const svg=kind=>`<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[kind]||paths.list}"/></svg>`;
 function cleanIcons(root){if(root.nodeType!==1)return;const all=[...(root.matches('.icon,.ico')?[root]:[]),...root.querySelectorAll('.icon,.ico')];for(const el of all){if(el.querySelector('svg'))continue;const title=el.parentElement?.textContent||'',kind=/setting|control|current step/i.test(title)?'settings':/graph|tree|network|neighbor/i.test(title)?'graph':/board|matrix|grid|table/i.test(title)?'grid':/chart|trend|reward|convergence|statistic|distribution/i.test(title)?'chart':/goal|path|best move/i.test(title)?'goal':/how|guide|about/i.test(title)?'book':'list';el.innerHTML=svg(kind);el.setAttribute('aria-hidden','true');el.style.display='inline-flex';el.style.verticalAlign='middle';el.style.alignItems='center'}}
 const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)cleanIcons(node)});observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});cleanIcons(document.body);
 document.addEventListener('input',e=>{if(e.target.id==='speed'&&!document.querySelector('.phase8')&&window.gsap)gsap.globalTimeline.timeScale(Math.max(.1,+e.target.value||1))});
 function clearMotion(){if(window.gsap)gsap.globalTimeline.clear()}
 document.addEventListener('click',e=>{if(e.target.closest('#reset,#resetEnvironment'))clearMotion()},true);
 document.addEventListener('change',e=>{if(e.target.matches('select,input[type=number]'))clearMotion()},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMotion()});
 addEventListener('pagehide',()=>{clearMotion();observer.disconnect()});
 addEventListener('pageshow',e=>{if(e.persisted){observer.observe(document.getElementById('app')||document.body,{subtree:true,childList:true});cleanIcons(document.body)}});
})();
