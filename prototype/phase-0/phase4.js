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

  // Load the native reminder bridge and the upgraded home/voice UI after the core app.
  // Keeping these as separate modules lets the browser build remain usable while the
  // Capacitor Android build gets true device-local scheduled notifications.
  function loadUpgradeAssets(){
    if(!document.getElementById('ccner-upgrade-css')){const link=document.createElement('link');link.id='ccner-upgrade-css';link.rel='stylesheet';link.href='./ui-upgrade.css?v=0.10.0';document.head.appendChild(link)}
    const load=(id,src)=>new Promise(resolve=>{if(document.getElementById(id)){resolve();return}const s=document.createElement('script');s.id=id;s.src=src+'?v=0.10.0';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)});
    load('ccner-notification-bridge','./notification-bridge.js').then(()=>load('ccner-ui-upgrade','./ui-upgrade.js'));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadUpgradeAssets,0));else loadUpgradeAssets();
})();