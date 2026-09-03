// Public client configuration. Never put service-role or private secrets here.
window.CCNER_CONFIG = {
  AI_ENDPOINT: 'https://sih-prototype-repo.zopcloud.zop.dev/api/chat',
  SUPABASE_URL: 'https://mmgvgqtjlcrrfkehlqqe.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_cchVUBU7WOnxYH_sI8A1QA_05f1Sz4v'
};
window.COGNITIVE_AI_ENDPOINT = window.CCNER_CONFIG.AI_ENDPOINT;
(function(){
  const v='0.7.0';
  const css=document.createElement('link'); css.rel='stylesheet'; css.href='./phase2.css?v='+v; document.head.appendChild(css);
  const css3=document.createElement('link'); css3.rel='stylesheet'; css3.href='./phase3.css?v='+v; document.head.appendChild(css3);
  const script=document.createElement('script'); script.src='./phase2.js?v='+v; script.defer=true; document.head.appendChild(script);
  const script3=document.createElement('script'); script3.src='./phase3.js?v='+v; script3.defer=true; document.head.appendChild(script3);
})();
