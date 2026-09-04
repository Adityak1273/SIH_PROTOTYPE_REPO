/* Momo voice-mode control: Continuous or Manual. */
(() => {
  'use strict';
  const KEY = 'ccner-momo-voice-mode';
  const getMode = () => localStorage.getItem(KEY) === 'manual' ? 'manual' : 'continuous';
  const getLanguage = () => {
    const raw = localStorage.getItem('ccner-p1-language') || window.CCNER_CONFIG?.LANGUAGE || 'en-IN';
    return ({ en: 'en-IN', 'en-IN': 'en-IN', hi: 'hi-IN', 'hi-IN': 'hi-IN', bn: 'bn-IN', 'bn-IN': 'bn-IN', as: 'as-IN', 'as-IN': 'as-IN' })[raw] || 'en-IN';
  };
  const setMode = mode => {
    const value = mode === 'manual' ? 'manual' : 'continuous';
    localStorage.setItem(KEY, value);
    document.documentElement.dataset.ccnerVoiceMode = value;
    updateSettingsUI();
    refreshButtons();
    if (value === 'manual') {
      try { window.stopListening?.(false); } catch (_) {}
      stopManual();
    }
    updateVoicePrompt();
  };

  document.documentElement.dataset.ccnerVoiceMode = getMode();

  const style = document.createElement('style');
  style.textContent = `.ccner-voice-mode-control{display:flex;gap:8px;align-items:center;margin-left:auto}.ccner-voice-mode-control button{border:1px solid #dfd1c2;background:#fffaf5;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer;color:#4f443b}.ccner-voice-mode-control button.active{background:#6d4ca5;color:#fff;border-color:#6d4ca5}.ccner-voice-mode-control button:focus-visible{outline:3px solid rgba(109,76,165,.25);outline-offset:2px}@media(max-width:560px){.ccner-voice-mode-control{margin-left:0;margin-top:6px;flex-wrap:wrap}}`;
  document.head.appendChild(style);

  let manualRecognition = null;
  let manualListening = false;

  function manualListen() {
    if (getMode() !== 'manual' || manualListening) return;
    try { window.stopListening?.(false); } catch (_) {}
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      const status = document.querySelector('#statusText');
      if (status) status.textContent = 'Voice recognition unavailable';
      return;
    }
    const r = new Recognition();
    manualRecognition = r;
    manualListening = true;
    r.lang = getLanguage();
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    const hint = document.querySelector('#voiceHint');
    if (hint) hint.hidden = false;
    const status = document.querySelector('#statusText');
    if (status) status.textContent = 'Listening for you';
    let finalText = '';
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0]?.transcript || '';
        if (e.results[i].isFinal) finalText += text;
        else interim += text;
      }
      const speech = document.querySelector('#speechText');
      if (interim && speech) speech.textContent = interim;
      if (finalText.trim()) {
        const text = finalText.trim();
        finalText = '';
        window.respond?.(text);
        try { r.stop(); } catch (_) {}
      }
    };
    const finish = () => {
      manualListening = false;
      manualRecognition = null;
      if (hint) hint.hidden = true;
      if (status) status.textContent = 'Ready to play';
      refreshButtons();
    };
    r.onerror = finish;
    r.onend = finish;
    try { r.start(); } catch (_) { finish(); }
  }

  function installManualButtonHook() {
    const button = document.querySelector('#l3VoiceBtn');
    if (!button || button.dataset.ccnerManualHook === '1') return;
    button.dataset.ccnerManualHook = '1';
    button.addEventListener('click', e => {
      if (getMode() !== 'manual') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      manualListen();
    }, true);
  }

  function stopManual() {
    try { manualRecognition?.stop(); } catch (_) {}
    manualRecognition = null;
    manualListening = false;
  }

  function updateVoicePrompt() {
    const p = document.querySelector('#l3VoiceBox p');
    if (!p) return;
    const next = getMode() === 'manual'
      ? 'Manual mode: tap the microphone each time you want to speak to Momo.'
      : 'Continuous mode: after Momo replies, he listens again automatically.';
    if (p.textContent !== next) p.textContent = next;
  }

  function updateSettingsUI() {
    const labels = [...document.querySelectorAll('body *')].filter(el => el.children.length === 0 && el.textContent.trim() === 'Voice mode');
    labels.forEach(label => {
      const row = label.closest('div, li, section, article') || label.parentElement;
      if (!row || row.dataset.ccnerVoiceRow === '1') return;
      row.dataset.ccnerVoiceRow = '1';
      [...row.querySelectorAll('*')].filter(el => el.children.length === 0 && el.textContent.trim() === 'Continuous').forEach(el => {
        if (el !== label) el.hidden = true;
      });
      const control = document.createElement('div');
      control.className = 'ccner-voice-mode-control';
      control.innerHTML = '<button type="button" data-ccner-voice="continuous">Continuous</button><button type="button" data-ccner-voice="manual">Manual</button>';
      row.appendChild(control);
      control.querySelectorAll('[data-ccner-voice]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.ccnerVoice)));
    });
    refreshButtons();
    updateVoicePrompt();
  }

  function refreshButtons() {
    const mode = getMode();
    document.querySelectorAll('[data-ccner-voice]').forEach(btn => {
      const active = btn.dataset.ccnerVoice === mode;
      if (btn.classList.contains('active') !== active) btn.classList.toggle('active', active);
      const pressed = String(active);
      if (btn.getAttribute('aria-pressed') !== pressed) btn.setAttribute('aria-pressed', pressed);
    });
    const mic = document.querySelector('#l3VoiceBtn');
    if (mic) {
      const manual = mode === 'manual';
      mic.title = manual ? 'Tap to talk to Momo' : 'Talk to Momo';
      mic.setAttribute('aria-label', manual ? 'Tap to talk to Momo' : 'Talk to Momo');
    }
  }

  const observer = new MutationObserver(() => {
    installManualButtonHook();
    updateSettingsUI();
    refreshButtons();
  });
  const start = () => {
    installManualButtonHook();
    updateSettingsUI();
    refreshButtons();
    updateVoicePrompt();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  window.CCNERVoiceMode = { getMode, setMode, manualListen, stopManual };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
