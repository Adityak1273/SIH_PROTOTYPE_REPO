(() => {
  const rig = () => document.querySelector('#momoRig');
  const stage = () => document.querySelector('#stage');
  const moodMap = {happy:'happy',excited:'excited',celebrate:'celebrate',thinking:'thinking',listening:'listening',encourage:'encourage',speaking:'speaking'};
  let last = '';
  function apply(mood) {
    const r = rig(); if (!r) return;
    const m = moodMap[mood] || 'happy';
    if (m === last) return;
    last = m;
    r.dataset.mood = m;
    r.classList.remove('gesture-pulse');
    void r.offsetWidth;
    r.classList.add('gesture-pulse');
    if (navigator.vibrate && ['excited','celebrate'].includes(m)) navigator.vibrate(18);
  }
  function observe() {
    const s = stage(); if (!s) return;
    const sync = () => {
      const c = [...s.classList].find(x => x.startsWith('mood-'));
      apply(c ? c.slice(5) : 'happy');
    };
    new MutationObserver(sync).observe(s, {attributes:true, attributeFilter:['class']});
    sync();
  }
  window.MomoAvatar = {
    setMood: apply,
    gesture(name) {
      const r = rig(); if (!r) return;
      r.dataset.gesture = name || 'none';
      clearTimeout(r._gestureTimer);
      r._gestureTimer = setTimeout(() => { r.dataset.gesture = 'none'; }, 1200);
    },
    react(type) {
      const map = {correct:'celebrate',incorrect:'encourage',thinking:'thinking',listening:'listening',speaking:'speaking',welcome:'happy'};
      apply(map[type] || 'happy');
      this.gesture(type === 'correct' ? 'both-up' : type === 'incorrect' ? 'shrug' : type === 'welcome' ? 'wave' : type);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe); else observe();
})();
