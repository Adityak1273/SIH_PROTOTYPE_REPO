// Public client configuration. Never put service-role or private secrets here.
window.CCNER_CONFIG = {
  AI_ENDPOINT: 'https://sih-prototype-repo.zopcloud.zop.dev/api/chat',
  SUPABASE_URL: 'https://mmgvgqtjlcrrfkehlqqe.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_cchVUBU7WOnxYH_sI8A1QA_05f1Sz4v'
};
window.COGNITIVE_AI_ENDPOINT = window.CCNER_CONFIG.AI_ENDPOINT;
(function(){
  const css=document.createElement('link'); css.rel='stylesheet'; css.href='./phase2.css?v=0.6.0'; document.head.appendChild(css);
  const script=document.createElement('script'); script.src='./phase2.js?v=0.6.0'; script.defer=true; document.head.appendChild(script);
})();
