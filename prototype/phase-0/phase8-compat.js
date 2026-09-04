/* Compatibility bridge for the restored Phase 8 game records. */
(() => {
  'use strict';
  const KEY='ccner-history';
  function normalize(){
    try{
      const h=JSON.parse(localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(h))return;
      let changed=false;
      h.forEach(s=>(s?.results||[]).forEach(r=>{
        if(r && r.seconds==null && r.avgResponse!=null){r.seconds=Number(r.avgResponse)||0;changed=true;}
        if(r && r.difficulty==null && r.level!=null){r.difficulty=r.level;changed=true;}
      }));
      if(changed)localStorage.setItem(KEY,JSON.stringify(h));
    }catch(_){ }
  }
  normalize();
  window.addEventListener('storage',normalize);
  setInterval(normalize,3000);
})();