import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './MobileCanvasPanels.css';

/** Adapts floating plot panels without changing the plot's event handlers or data. */
export function MobileCanvasPanels() {
  const { pathname } = useLocation();
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const entries = new Map<HTMLElement, { trigger: HTMLButtonElement; close: HTMLButtonElement; host: HTMLElement; id: string }>();
    const docks = new Map<HTMLElement, HTMLElement>();
    let active: HTMLElement | null = null;
    let frame = 0;
    let serial = 0;
    const collapse = () => {
      if (!active) return;
      active.removeAttribute('data-mobile-panel-open');
      entries.get(active)?.trigger.setAttribute('aria-expanded', 'false');
      active = null;
    };
    const remove = (panel: HTMLElement) => {
      const entry = entries.get(panel);
      if (!entry) return;
      if (active === panel) collapse();
      entry.trigger.remove(); entry.close.remove();
      panel.removeAttribute('data-mobile-canvas-panel');
      if (panel.id === entry.id) panel.removeAttribute('id');
      entries.delete(panel);
    };
    const scan = () => {
      frame = 0;
      if (!media.matches) { entries.forEach((_, panel) => remove(panel)); docks.forEach(d => d.remove()); docks.clear(); return; }
      entries.forEach((_, panel) => { if (!panel.isConnected) remove(panel); });
      const main = document.getElementById('main-content');
      if (!main) return;
      const candidates = main.querySelectorAll<HTMLElement>('[class*="tool"], [class*="legend"], [class*="hint"], [class*="tip"], [class*="note"], [class*="hud"], [class*="overlay"], [class*="control"], [class*="stat"], [data-canvas-panel]');
      candidates.forEach(panel => {
        if (entries.has(panel) || panel.closest('.mobile-canvas-panel-dock, [data-mobile-canvas-panel], nav, [role="tooltip"], .recharts-tooltip-wrapper') || panel instanceof SVGElement) return;
        const style = getComputedStyle(panel);
        if (!panel.hasAttribute('data-canvas-panel') && !['absolute','fixed'].includes(style.position)) return;
        if (style.display === 'none' || /tooltip|backdrop|modal|tour|guide|menu|cv-dataset-overlay/i.test(panel.className) || panel.closest('[role="dialog"]')) return;
        let host = panel.parentElement;
        if (panel.hasAttribute('data-canvas-panel')) {
          for (let depth=0;host&&!host.querySelector('canvas, svg.recharts-surface, svg[role="img"]')&&depth<3;depth++) host=host.parentElement;
        }
        if (!host || !host.querySelector('canvas, svg, [class*="point"], [class*="centroid"], [class*="node"]')) return;
        // A graph itself is never a collapsible panel.
        if (panel.querySelector('canvas, svg.recharts-surface') || panel.matches('svg, canvas') || panel.getBoundingClientRect().height > 450) return;
        let dock = docks.get(host);
        if (!dock) { dock = document.createElement('div'); dock.className = 'mobile-canvas-panel-dock'; dock.setAttribute('aria-label','Canvas panels'); dock.addEventListener('pointerdown',e => e.stopPropagation()); dock.addEventListener('click',e => e.stopPropagation()); host.append(dock); docks.set(host,dock); }
        const kind = /legend/i.test(panel.className) ? 'Legend' : /hint|tip|note/i.test(panel.className) ? 'Help' : /stat|hud/i.test(panel.className) ? 'Stats' : 'Tools';
        const trigger = document.createElement('button'); trigger.type='button'; trigger.className='mobile-canvas-panel-trigger';
        trigger.textContent = kind === 'Legend' ? '◉' : kind === 'Help' ? '?' : kind === 'Stats' ? '▥' : '☷';
        trigger.title = kind;
        trigger.setAttribute('aria-expanded','false'); trigger.setAttribute('aria-label',`Show canvas ${kind.toLowerCase()}`);
        const id = panel.id || `mobile-canvas-panel-${serial++}`;
        const ownedId = !panel.id ? id : '';
        panel.id=id; trigger.setAttribute('aria-controls',id);
        panel.setAttribute('data-mobile-canvas-panel',kind.toLowerCase());
        const close=document.createElement('button'); close.type='button'; close.className='mobile-canvas-panel-close'; close.textContent=`${kind} · Close ×`; close.setAttribute('aria-label',`Close canvas ${kind.toLowerCase()}`);
        close.addEventListener('click',e=>{e.stopPropagation();collapse();trigger.focus({preventScroll:true});}); panel.prepend(close);
        trigger.addEventListener('click',()=>{const wasOpen=active===panel;collapse();if(!wasOpen){active=panel;panel.setAttribute('data-mobile-panel-open','');trigger.setAttribute('aria-expanded','true');close.focus({preventScroll:true});}});
        dock.append(trigger); entries.set(panel,{trigger,close,host,id:ownedId});
      });
      docks.forEach((dock,host)=>{if(!host.isConnected || !dock.children.length){dock.remove();docks.delete(host);}});
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(scan);};
    const pointer=(event:PointerEvent)=>{const target=event.target;if(!(target instanceof Element)||!active)return;if(!active.contains(target)&&!target.closest('.mobile-canvas-panel-dock'))collapse();};
    const action=(event:Event)=>{const target=event.target;if(!(target instanceof Element)||!active||!active.contains(target))return;
      if(target.closest('[data-panel-keep-open]')) return;
      if(event.type==='click'&&target.closest('button, a')&&!target.closest('.mobile-canvas-panel-close') || event.type==='change'&&target.matches('select, input[type="checkbox"], input[type="radio"]') || event.type==='pointerup'&&target.matches('input[type="range"]')) queueMicrotask(()=>{const trigger=active?entries.get(active)?.trigger:undefined;collapse();trigger?.focus({preventScroll:true});});
    };
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&active){const trigger=entries.get(active)?.trigger;collapse();trigger?.focus();}};
    const observer=new MutationObserver(schedule); observer.observe(document.getElementById('main-content')??document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    media.addEventListener('change',schedule);document.addEventListener('pointerdown',pointer,true);document.addEventListener('click',action,true);document.addEventListener('change',action,true);document.addEventListener('pointerup',action,true);document.addEventListener('keydown',key);scan();
    return()=>{observer.disconnect();cancelAnimationFrame(frame);media.removeEventListener('change',schedule);document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('click',action,true);document.removeEventListener('change',action,true);document.removeEventListener('pointerup',action,true);document.removeEventListener('keydown',key);entries.forEach((_,p)=>remove(p));docks.forEach(d=>d.remove());};
  },[pathname]);
  return null;
}
