/* Cognitive Care NER — hard core interaction boot.
 * This layer is intentionally independent from progressive UI modules.
 * If an enhancement fails, the primary buttons still work.
 */
(function(){
  'use strict';
  if (window.__ccnerCoreBoot) return;
  window.__ccnerCoreBoot = true;
  try{
    const auth=JSON.parse(localStorage.getItem('ccner.level2.auth.v1')||'null');
    const profile=JSON.parse(localStorage.getItem('ccner.level2.profile.v1')||'null');
    if(!(auth?.verified&&auth?.profileComplete&&profile?.fullName)){
      const app=document.querySelector('.app-shell'); if(app)app.style.display='none';
      const css=document.createElement('link');css.rel='stylesheet';css.href='./level2-auth.css?v=0.17.1';document.head.appendChild(css);
      const script=document.createElement('script');script.src='./level2-auth.js?v=0.17.1';document.head.appendChild(script);
    }
  }catch(_){
    const app=document.querySelector('.app-shell');if(app)app.style.display='none';
    const css=document.createElement('link');css.rel='stylesheet';css.href='./level2-auth.css?v=0.17.1';document.head.appendChild(css);
    const script=document.createElement('script');script.src='./level2-auth.js?v=0.17.1';document.head.appendChild(script);
  }
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  function show(id){$$('.view').forEach(v=>v.hidden=true);const target=$(id);if(target)target.hidden=false;$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===id.slice(1)));window.scrollTo?.({top:0,behavior:'smooth'});}
  function openPanel(name){if(window.CCNERPhase1?.openPanel)return window.CCNERPhase1.openPanel(name);const panel=$('#overlayPanel');if(panel)panel.hidden=false;}
  function start(){if(window.CCNER_LEVEL4_START_HOOK?.())return;if(window.CCNER_VIDEO_GAMES?.startSession)return window.CCNER_VIDEO_GAMES.startSession();if(window.CCNERGameRestored?.startSession)return window.CCNERGameRestored.startSession();if(typeof window.startSession==='function')return window.startSession();const status=$('#todayStatus');if(status)status.textContent='App is still loading…';}
  function talk(){if(window.CCNERUIUpgrade?.openTalk)return window.CCNERUIUpgrade.openTalk();if(typeof window.armVoice==='function')return window.armVoice();if(typeof window.respond==='function')return window.respond('Hello Momo');}
  function progress(){if(typeof window.showResultsFromHistory==='function')return window.showResultsFromHistory();show('#resultsView');}
  function send(){const input=$('#chatInput');const text=input?.value?.trim();if(!text)return;input.value='';if(typeof window.respond==='function')return window.respond(text);}
  document.addEventListener('click',function(e){const button=e.target.closest('button');if(!button)return;if(button.dataset.action==='start')return start();if(button.dataset.action==='talk')return talk();if(button.dataset.action==='reminder')return openPanel('reminders');if(button.dataset.action==='progress')return progress();if(button.id==='sendButton')return send();if(button.id==='homeButton'||button.id==='backHome')return show('#homeView');if(button.id==='playAgain')return start();if(button.dataset.nav==='homeView')return show('#homeView');if(button.dataset.nav==='resultsView')return progress();if(button.dataset.nav==='reminders')return openPanel('reminders');if(button.dataset.nav==='settings')return openPanel('settings');},true);
  document.addEventListener('keydown',function(e){if(e.key==='Enter'&&document.activeElement?.id==='chatInput')send();});
  function loadPhase6(){if(window.CCNER_PHASE6_LOADED)return;window.CCNER_PHASE6_LOADED=true;const version='0.15.0';const css=document.createElement('link');css.rel='stylesheet';css.href='./phase6.css?v='+version;document.head.appendChild(css);const script=document.createElement('script');script.src='./phase6.js?v='+version;script.defer=true;document.head.appendChild(script);}
  function loadPhase7(){if(window.CCNER_PHASE7_LOADED)return;window.CCNER_PHASE7_LOADED=true;const version='0.16.0';const css=document.createElement('link');css.rel='stylesheet';css.href='./phase7.css?v='+version;document.head.appendChild(css);const script=document.createElement('script');script.src='./phase7.js?v='+version;script.defer=true;document.head.appendChild(script);}
  function loadPhase4(){if(window.CCNER_LEVEL4_LOADED)return;window.CCNER_LEVEL4_LOADED=true;const version='0.17.1';['level4-game.css','level4-video-bridge.css'].forEach(f=>{const css=document.createElement('link');css.rel='stylesheet';css.href='./'+f+'?v='+version;document.head.appendChild(css)});['level4-game.js','level4-video-bridge.js'].forEach(f=>{const s=document.createElement('script');s.src='./'+f+'?v='+version;s.defer=true;document.head.appendChild(s)});}
  function loadPhase8(){if(window.CCNER_PHASE8_LOADED)return;window.CCNER_PHASE8_LOADED=true;const version='0.17.0';const css=document.createElement('link');css.rel='stylesheet';css.href='./phase8.css?v='+version;document.head.appendChild(css);const script=document.createElement('script');script.src='./phase8.js?v='+version;script.onload=()=>{window.setTimeout(loadPhase4,0);};script.defer=true;document.head.appendChild(script);const compat=document.createElement('script');compat.src='./phase8-compat.js?v='+version;compat.defer=true;document.head.appendChild(compat);const video=document.createElement('script');video.src='./phase8-video-override.js?v='+version;video.defer=true;document.head.appendChild(video);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{loadPhase6();loadPhase7();loadPhase8();},{once:true});else{loadPhase6();loadPhase7();loadPhase8();}
})();