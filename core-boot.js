/* Cognitive Care NER — canonical runtime boot.
 * One owner per subsystem: auth, security, games, offline sync and privacy.
 */
(()=>{
'use strict';
if(window.__ccnerCoreBoot)return;window.__ccnerCoreBoot=true;
const loaded=new Set();
function load(src,css){
 if(loaded.has(src))return;loaded.add(src);
 if(css&&!document.querySelector('link[data-ccner="'+css+'"]')){const l=document.createElement('link');l.rel='stylesheet';l.dataset.ccner=css;l.href='./'+css+'?v=0.20.2';document.head.appendChild(l)}
 const s=document.createElement('script');s.src='./'+src+'?v=0.20.2';s.defer=true;document.head.appendChild(s);
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
 const reveal=()=>{};
 const report=message=>{console.error('[CCNER runtime]',message);let b=document.getElementById('ccnerRuntimeError');if(!b){b=document.createElement('div');b.id='ccnerRuntimeError';b.className='ccner-runtime-error';b.setAttribute('role','alert');document.body.appendChild(b)}b.replaceChildren();const t=document.createElement('span');t.textContent='A feature hit a temporary error. Your saved data is safe.';const r=document.createElement('button');r.type='button';r.textContent='Reload app';r.className='action-button';r.onclick=()=>location.reload();b.append(t,r);window.dispatchEvent(new CustomEvent('ccner:runtime-error',{detail:{message:String(message)}}))};
 window.addEventListener('error',e=>{report(e.message||'Runtime error');reveal()});
 window.addEventListener('unhandledrejection',e=>{e.preventDefault();report(e.reason?.message||e.reason||'Async error');reveal()});
 window.addEventListener('ccner:runtime-ready',reveal,{once:true});
}
function authSecurity(){
 loadOnce('level2-auth-v2.js','level2-auth-v2.css');
 loadOnce('security-center.js');
 loadOnce('admin-access.js','admin-access.css');
 loadOnce('auth-recovery.js');
 loadOnce('secure-sync-bridge.js');
}
recover();authSecurity();boot();
})();