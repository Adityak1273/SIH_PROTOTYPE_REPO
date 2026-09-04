// Public client configuration. Never put service-role or private secrets here.
window.CCNER_CONFIG = {
  AI_ENDPOINT: 'https://sih-prototype-repo.zopcloud.zop.dev/api/chat',
  SUPABASE_URL: 'https://mmgvgqtjlcrrfkehlqqe.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_cchVUBU7WOnxYH_sI8A1QA_05f1Sz4v'
};
window.COGNITIVE_AI_ENDPOINT = window.CCNER_CONFIG.AI_ENDPOINT;
(function(){
  const v='0.9.8';
  const addCss=(name)=>{const el=document.createElement('link');el.rel='stylesheet';el.href='./'+name+'?v='+v;document.head.appendChild(el)};
  const addScript=(name)=>{const el=document.createElement('script');el.src='./'+name+'?v='+v;document.body.appendChild(el)};
  addCss('phase2.css'); addCss('phase3.css'); addCss('phase4.css'); addCss('multilingual.css'); addCss('sequence-game.css'); addCss('sorting-game.css'); addCss('category-game.css'); addCss('pattern-game.css'); addCss('spot-difference-game.css');
  addScript('phase2.js'); addScript('phase3.js'); addScript('phase4.js'); addScript('sequence-game.js'); addScript('sorting-game.js'); addScript('category-game.js'); addScript('pattern-game.js'); addScript('spot-difference-game.js'); addScript('game-controls.js');
})();
