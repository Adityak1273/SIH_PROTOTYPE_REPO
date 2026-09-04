/* Cognitive Care NER — hard core interaction boot. */
(function(){
'use strict';if(window.__ccnerCoreBoot)return;window.__ccnerCoreBoot=true;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const app=document.querySelector('.app-shell');if(app)app.style.display='none';
function loadAuth(){if(window.__CCNER_AUTH_LOADED)return;window.__CCNER_AUTH_LOADED=true;const css=document.createElement('link');css.rel='stylesheet';css.href='./level2-auth-v2.css?v=0.18.6';document.head.appendChild(css);const s=document.createElement('script');s.src='./level2-auth-v2.js?v=0.18.6';s.defer=true;document.head.appendChild(s)}
function loadSecurity(){if(window.__CCNER_SECURITY_LOADED)return;window.__CCNER_SECURITY_LOADED=true;const s=document.createElement('script');s.src='./security-center.js?v=0.18.6';s.defer=true;document.head.appendChild(s)}
function loadAdmin(){if(window.__CCNER_ADMIN_LOADED)return;window.__CCNER_ADMIN_LOADED=true;const css=document.createElement('link');css.rel='stylesheet';css.href='./admin-access.css?v=0.18.6';document.head.appendChild(css);const s=document.createElement('script');s.src='./admin-access.js?v=0.18.6';s.defer=true;document.head.appendChild(s)}
function loadAuthRecovery(){if(window.__CCNER_AUTH_RECOVERY_LOADED)return;window.__CCNER_AUTH_RECOVERY_LOADED=true;const s=document.createElement('script');s.src='./auth-recovery.js?v=0.18.6';s.defer=true;document.head.appendChild(s)}
function show(id){$$('.view').forEach(v=>v.hidden=true);const x=$(id);if(x)x.hidden=false;$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===id.slice(1)));window.scrollTo?.({top:0,behavior:'smooth'})}
function start(){const s=$('#todayStatus');const launch=()=>{if(!window.CCNER_ADAPTIVE_GAME_ENGINE_V4||!window.CCNER_VIDEO_GAMES?.startSession)return false;if(window.CCNER_LEVEL4_START_HOOK?.())return true;window.CCNER_VIDEO_GAMES.startSession();return true};if(launch())return;if(s)s.textContent='Loading today\'s five-game training…';let tries=0;const wait=setInterval(()=>{tries++;if(launch()){clearInterval(wait)}else if(tries>=40){clearInterval(wait);if(s)s.textContent='Game engine could not load. Please refresh once.'}},100)}
function talk(){if(window.CCNERUIUpgrade?.openTalk)return window.CCNERUIUpgrade.openTalk();if(typeof window.armVoice==='function')return window.armVoice();if(typeof window.respond==='function')return window.respond('Hello Momo')}
function progress(){if(typeof window.showResultsFromHistory==='function')return window.showResultsFromHistory();show('#resultsView')}
function send(){const i=$('#chatInput'),text=i?.value?.trim();if(!text)return;i.value='';if(typeof window.respond==='function')return window.respond(text)}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='start')return start();if(b.dataset.action==='talk')return talk();if(b.dataset.action==='reminder')return openPanel('reminders');if(b.dataset.action==='progress')return progress();if(b.id==='sendButton')return send();if(b.id==='homeButton'||b.id==='backHome')return show('#homeView');if(b.id==='playAgain')return start();if(b.dataset.nav==='homeView')return show('#homeView');if(b.dataset.nav==='resultsView')return progress();if(b.dataset.nav==='reminders')return openPanel('reminders');if(b.dataset.nav==='settings')return openPanel('settings')},true);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement?.id==='chatInput')send()});
function load(src,css){if(css){const l=document.createElement('link');l.rel='stylesheet';l.href='./'+css+'?v=0.18.6';document.head.appendChild(l)}const s=document.createElement('script');s.src='./'+src+'?v=0.18.6';s.defer=true;document.head.appendChild(s);return s}
function loadPhase6(){if(window.CCNER_PHASE6_LOADED)return;window.CCNER_PHASE6_LOADED=true;load('phase6.js','phase6.css')}
function loadPhase7(){if(window.CCNER_PHASE7_LOADED)return;window.CCNER_PHASE7_LOADED=true;load('phase7.js','phase7.css')}
function loadLevel4(){if(window.CCNER_LEVEL4_LOADED)return;window.CCNER_LEVEL4_LOADED=true;load('level4-clean.js')}
function loadPhase8(){if(window.CCNER_PHASE8_LOADED)return;window.CCNER_PHASE8_LOADED=true;const s=document.createElement('script');s.src='./phase8.js?v=0.18.6';s.onload=()=>setTimeout(loadLevel4,0);s.defer=true;document.head.appendChild(s)}
function loadAdaptive(){if(window.CCNER_ADAPTIVE_GAME_ENGINE_REQUESTED)return;window.CCNER_ADAPTIVE_GAME_ENGINE_REQUESTED=true;load('game-engine-adaptive.js')}
function load567(){if(window.CCNER_567_LOADED)return;window.CCNER_567_LOADED=true;load('level567-core.js','level567-core.css')}
function bootModules(){loadPhase6();loadPhase7();loadPhase8();loadAdaptive();load567()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootModules,{once:true});else bootModules();
setTimeout(loadAuth,0);setTimeout(loadSecurity,0);setTimeout(loadAdmin,0);setTimeout(loadAuthRecovery,250);
})();
