/* Cognitive Care NER — canonical runtime boot.
 * One owner per subsystem: auth, security, games, offline sync and privacy.
 */
(()=>{
'use strict';
if(window.__ccnerCoreBoot)return;window.__ccnerCoreBoot=true;
const loaded=new Set();
function load(src,css){
 if(loaded.has(src))return;loaded.add(src);
 if(css&&!document.querySelector('link[data-ccner="'+css+'"]')){const l=document.createElement('link');l.rel='stylesheet';l.dataset.ccner=css;l.href='./'+css+'?v=0.20.3';document.head.appendChild(l)}
 const s=document.createElement('script');s.src='./'+src+'?v=0.20.3';s.defer=true;document.head.appendChild(s);
}
function loadOnce(src,css){load(src,css)}
function boot(){
 loadOnce('game-engine-v6.js','game-ui-polish.css');
 loadOnce('phase6.js','phase6.css');
 loadOnce('phase7.js','phase7.css');
 loadOnce('level567-core.js','level567-core.css');
 loadOnce('spot-difference-ux.js');
}
function recover(){
  const report=message=>{
    console.error('[CCNER runtime]',message);
    window.dispatchEvent(new CustomEvent('ccner:runtime-error',{detail:{message:String(message)}}));
  };
  window.addEventListener('error',e=>report(e.message||'Runtime error'));
  window.addEventListener('unhandledrejection',e=>{
    e.preventDefault();
    report(e.reason?.message||e.reason||'Async error');
  });
}
function authSecurity(){
 loadOnce('level2-auth-v2.js','level2-auth-v2.css');
 loadOnce('security-center.js');
 loadOnce('auth-recovery.js');
 loadOnce('secure-sync-bridge.js');
}
recover();authSecurity();boot();
})();