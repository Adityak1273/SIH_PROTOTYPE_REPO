/* Cognitive Care NER — Phase 5 stability guard.
 * Multilingual localization uses a MutationObserver for dynamically-created game text.
 * Character-data observation caused a feedback loop: the observer rewrote text nodes,
 * which generated another characterData mutation, which rewrote them again.
 * Keep childList observation (needed for dynamic game screens) but disable characterData
 * observation globally before multilingual.js is loaded. Existing app observers do not
 * require characterData events.
 */
(() => {
  'use strict';
  if (window.__CCNER_PHASE5_GUARD__) return;
  const NativeMutationObserver = window.MutationObserver;
  if (typeof NativeMutationObserver !== 'function') return;
  window.__CCNER_PHASE5_GUARD__ = true;
  window.MutationObserver = function Phase5SafeMutationObserver(callback) {
    const observer = new NativeMutationObserver(callback);
    return {
      observe(target, options = {}) {
        const safe = { ...options, characterData: false, characterDataOldValue: false };
        observer.observe(target, safe);
      },
      disconnect() { observer.disconnect(); },
      takeRecords() { return observer.takeRecords(); }
    };
  };
  window.MutationObserver.prototype = NativeMutationObserver.prototype;
})();
