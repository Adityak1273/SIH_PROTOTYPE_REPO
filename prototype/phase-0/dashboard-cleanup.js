/* Clean patient dashboard: keep the main dashboard focused on Momo, games, progress and reminders. */
(() => {
  'use strict';

  const TARGETS = [
    'Choose your language',
    'Language & voice',
    'Privacy & security',
    'Care & engagement modes',
    'Clinic / Hospital mode',
    'Community play',
    'Storytelling',
    'Music memory',
    'Health context'
  ];

  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function hideTarget(text) {
    const wanted = normalize(text);
    const nodes = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,button,div,section,article')];
    const matches = nodes.filter(el => normalize(el.textContent) === wanted);

    matches.forEach(el => {
      // Prefer the semantic section/card containing the heading rather than hiding
      // the whole app shell. For standalone bars/buttons, hide the element itself.
      const container = el.closest('section, article');
      if (container && container !== document.querySelector('.app-shell')) {
        container.hidden = true;
        container.dataset.ccnerDashboardHidden = '1';
      } else {
        el.hidden = true;
        el.dataset.ccnerDashboardHidden = '1';
      }
    });
  }

  function clean() {
    TARGETS.forEach(hideTarget);

    // The build/version footer is implementation information, not patient UI.
    document.querySelectorAll('footer').forEach(el => {
      el.hidden = true;
      el.dataset.ccnerDashboardHidden = '1';
    });
  }

  let scheduled = false;
  function scheduleClean() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      clean();
    });
  }

  const start = () => {
    clean();
    const observer = new MutationObserver(scheduleClean);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
