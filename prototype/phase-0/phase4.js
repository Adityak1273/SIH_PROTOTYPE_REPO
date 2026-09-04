/* Phase 4 — production-readiness layer
 * Safety-first: training analytics are never presented as a diagnosis.
 */
(() => {
  const KEY = 'ccner_phase4';
  const state = JSON.parse(localStorage.getItem(KEY) || '{}');
  state.consent = state.consent || { analytics: false, notifications: false };
  state.audit = state.audit || [];

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function audit(action, detail=''){ state.audit.unshift({ action, detail, at:new Date().toISOString() }); state.audit=state.audit.slice(0,100); save(); }

  window.CognitiveCareProduction = {
    getConsent(){ return {...state.consent}; },
    setConsent(name, value){ if (!(name in state.consent)) return false; state.consent[name]=!!value; audit('consent_changed', `${name}:${!!value}`); return true; },
    recordSafetyEvent(action, detail){ audit(action, detail); },
    exportAudit(){ return JSON.stringify(state.audit, null, 2); },
    resetLocalProductionData(){ localStorage.removeItem(KEY); location.reload(); }
  };

  window.CognitiveCareClinicalSafety = {
    disclaimer: 'Cognitive training performance is not a dementia diagnosis or clinical staging assessment.',
    interpret(score){
      if (score >= 80) return 'Strong training performance in this session.';
      if (score >= 60) return 'Developing training performance; keep practicing regularly.';
      return 'This session was challenging. Consider easier practice and encouragement.';
    }
  };

  document.addEventListener('click', e => {
    const el=e.target.closest('[data-production-action]');
    if(el) audit(el.dataset.productionAction, el.dataset.detail || '');
  });

  // Load progressive modules after the base app. Every module is optional so a
  // failed enhancement can never stop the core app from becoming interactive.
  function loadUpgradeAssets(){
    if(!document.getElementById('ccner-upgrade-css')){const link=document.createElement('link');link.id='ccner-upgrade-css';link.rel='stylesheet';link.href='./ui-upgrade.css?v=0.11.0';document.head.appendChild(link)}
    const css=['sequence-game.css','sorting-game.css','category-game.css','pattern-game.css','spot-difference-game.css','routine-game.css'];
    css.forEach((src,i)=>{const id='ccner-css-'+i;if(!document.getElementById(id)){const link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href='./'+src+'?v=0.11.0';document.head.appendChild(link)}});
    const js=['sequence-game.js','sorting-game.js','category-game.js','pattern-game.js','spot-difference-game.js','routine-game.js','adaptive-engine.js','game-controls.js','dashboard-data-bridge.js','notification-bridge.js','momo-voice.js','ui-upgrade.js','ui-failsafe.js'];
    const load=(id,src)=>new Promise(resolve=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src+'?v=0.11.0';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)});
    let chain=Promise.resolve();js.forEach((src,i)=>{chain=chain.then(()=>load('ccner-module-'+i,src))});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadUpgradeAssets,0));else loadUpgradeAssets();
})();
