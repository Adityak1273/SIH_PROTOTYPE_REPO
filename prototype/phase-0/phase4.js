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

  // Never claim clinical meaning from game performance.
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
})();
