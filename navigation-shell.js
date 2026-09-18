/* Cognitive Care NER — canonical navigation shell.
 * One navigation owner for Home, Progress, Play, Reminders and You.
 * Drawer behavior follows accessible disclosure/drawer patterns: aria-expanded,
 * Escape-to-close, focus restoration and inert background while open.
 */
(()=>{'use strict';
if(window.__CCNER_NAV_SHELL__)return;window.__CCNER_NAV_SHELL__=true;
const $=s=>document.querySelector(s);
let returnFocus=null;
function mount(){
 if($('#ccnerDrawer'))return;
 const d=document.createElement('aside');
 d.id='ccnerDrawer';d.className='ccner-drawer';d.hidden=true;
 d.setAttribute('aria-labelledby','ccnerDrawerTitle');
 d.innerHTML=`<div class="ccner-drawer-backdrop" data-drawer-close></div>
 <section class="ccner-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="ccnerDrawerTitle">
  <header class="ccner-drawer-head"><div><p class="eyebrow">COGNITIVE CARE NER</p><h2 id="ccnerDrawerTitle">You</h2></div><button type="button" class="ccner-drawer-close" data-drawer-close aria-label="Close menu">×</button></header>
  <nav class="ccner-drawer-nav" aria-label="Account and app navigation">
   <button type="button" data-drawer-action="home">⌂ <span>Home</span></button>
   <button type="button" data-drawer-action="progress">▣ <span>Progress</span></button>
   <button type="button" data-drawer-action="reminders">◷ <span>Reminders</span></button>
   <button type="button" data-drawer-action="settings">⚙ <span>Settings</span></button>
   <button type="button" data-drawer-action="security">🔐 <span>Privacy & security</span></button>
  </nav>
  <div class="ccner-drawer-foot"><span>Training performance only</span><small>Not a diagnosis or clinical stage.</small></div>
 </section>`;
 document.body.appendChild(d);
 d.addEventListener('click',e=>{const action=e.target.closest('[data-drawer-action]')?.dataset.drawerAction;if(action)activate(action);if(e.target.closest('[data-drawer-close]'))close()});
}
function open(){
 mount();const d=$('#ccnerDrawer'),panel=d?.querySelector('.ccner-drawer-panel');if(!d||!panel)return;
 returnFocus=document.activeElement;d.hidden=false;const trigger=document.querySelector('.bottom-nav [data-nav="settings"]');trigger?.setAttribute('aria-expanded','true');trigger?.setAttribute('aria-controls','ccnerDrawer');document.body.classList.add('ccner-drawer-open');
 const app=$('.app-shell');if(app)app.inert=true;
 requestAnimationFrame(()=>panel.querySelector('button')?.focus());
}
function close(){
 const d=$('#ccnerDrawer');if(!d)return;d.hidden=true;const trigger=document.querySelector('.bottom-nav [data-nav="settings"]');trigger?.setAttribute('aria-expanded','false');document.body.classList.remove('ccner-drawer-open');
 const app=$('.app-shell');if(app)app.inert=false;
 if(returnFocus?.focus)returnFocus.focus();returnFocus=null;
}
function activate(action){
 close();
 if(action==='home')return window.CCNERNavigation?.home?.();
 if(action==='progress')return window.CCNERNavigation?.progress?.();
 if(action==='reminders')return window.CCNERNavigation?.reminders?.();
 if(action==='settings')return window.CCNERNavigation?.settings?.();
 if(action==='security')return window.CCNERSecurity?.open?.();
}
window.CCNERNavigation={open,close,home:()=>window.CCNERUI?.home?.(),progress:()=>window.CCNERUI?.progress?.(),reminders:()=>window.CCNERUI?.reminders?.(),settings:()=>window.CCNERUI?.settings?.()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#ccnerDrawer')?.hidden)close()});
document.addEventListener('DOMContentLoaded',mount,{once:true});
if(document.readyState!=='loading')mount();
})();