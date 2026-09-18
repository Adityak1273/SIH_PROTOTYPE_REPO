(()=>{'use strict';const $=s=>document.querySelector(s),read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch(_){return f}},avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;function monthly(){const h=read('ccner-history',[]).filter(x=>Date.now()-new Date(x.date).getTime()<2592e6),score=Math.round(avg(h.map(x=>+x.score||0))),acc=Math.round(avg(h.map(x=>+x.accuracy||0))*100),rt=h.length>1?(+h.at(-1).avgTime||0)-(+h.at(-2).avgTime||0):0,trend=rt<-.2?'Response time is improving ↓':rt>.2?'Response time is a little slower ↗':'Response time is broadly steady →',e=$('#l3Monthly');if(e)e.innerHTML=`<div><span class="l3-kicker">MONTHLY PERFORMANCE</span><h3>${score}% average score</h3><p>${acc}% average accuracy · ${h.length} sessions in the last 30 days</p><small style="display:block;margin-top:5px;color:#756a61">${trend}</small></div><strong style="border-radius:999px;background:#eadff5;color:#5d437f;padding:8px 12px;font-size:.72rem;letter-spacing:.08em">30 DAYS</strong>`}function boot(){
  // The old floating Mino FAB duplicated the canonical bottom navigation.
  // Keep the monthly performance card, but let navigation-shell own Mino entry.
  document.querySelector('#l3MinoFab')?.remove();
  const home=$('#homeView');
  if(home&&!$('#l3Monthly')){
    const d=document.createElement('section');d.id='l3Monthly';d.className='l3-section';d.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:18px;background:#f8f3fb;border-color:#ddd0eb';d.innerHTML='<div></div><strong>30 DAYS</strong>';
    const q=$('#level3Dashboard .l3-two');q?.insertAdjacentElement('afterend',d);monthly();
  }else monthly();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();

// Load voice-mode control after the dashboard/Mino UI exists. This avoids depending on config.js timing.
const voice=document.createElement('script');voice.src='./voice-mode-control.js?v=0.18.18';voice.defer=true;document.head.appendChild(voice);
})();