// Public client configuration. Never put service-role or private secrets here.
window.CCNER_CONFIG = {
  AI_ENDPOINT: 'https://sih-prototype-repo.zopcloud.zop.dev/api/chat',
  SUPABASE_URL: 'https://mmgvgqtjlcrrfkehlqqe.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_cchVUBU7WOnxYH_sI8A1QA_05f1Sz4v',
  APP_VERSION: '0.18.18'
};
window.COGNITIVE_AI_ENDPOINT = window.CCNER_CONFIG.AI_ENDPOINT;

// Load the voice-mode controller after the core app is present.
(() => {
  const s = document.createElement('script');
  s.src = './voice-mode-control.js?v=0.18.18';
  s.defer = true;
  document.head.appendChild(s);
})();
