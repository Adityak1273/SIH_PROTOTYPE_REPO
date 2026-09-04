/* Momo voice-mode control: Continuous or Manual. */
(() => {
  'use strict';
  const KEY = 'ccner-momo-voice-mode';
  const getMode = () => localStorage.getItem(KEY) === 'manual' ? 'manual' : 'continuous';
  const getLanguage = () => {
    const raw = localStorage.getItem('ccner-p1-language') || window.CCNER_CONFIG?.LANGUAGE || 'en-IN';
    return ({ en: 'en-IN', 'en-IN': 'en-IN', hi: 'hi-IN', 'hi-IN': 'hi-IN', bn: 'bn-IN', 'bn-IN': 'bn-IN', as: 'as-IN', 'as-IN': 'as-IN' })[raw] || 'en-IN';
  };

  let manualRecognition = null;
  let manualListening = false;

  function refreshButtons() {
    const mode = getMode();
    document.querySelectorAll('[data-ccner-voice]').forEach(btn => {
      const active = btn.dataset.ccnerVoice === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    const mic = document.querySelector('#l3VoiceBtn');
    if (mic) {
      mic.title = mode === 'manual' ? 'Tap to talk to Momo' : 'Talk to Momo';
      mic.setAttribute('aria-label', mode === 'manual' ? 'Tap to talk to Momo' : 'Talk to Momo');
    }
  }

  function updateVoicePrompt() {
    const p = document.querySelector('#l3VoiceBox p');
    if (!p) return;
    const text = getMode() === 'manual'
      ? 'Manual mode: tap the microphone each time you want to speak to Momo.'
      : 'Continuous mode: after Momo replies, he listens again automatically.';
    if (p.textContent !== text) p.textContent = text;
  }

  function stopManual() {
    try { manualRecognition?.stop(); } catch (_) {}
    manualRecognition = null;
    manualListening = false;
  }

  function setMode(mode) {
    const value = mode === 'manual' ? 'manual' : 'continuous';
    localStorage.setItem(KEY, value);
    document.documentElement.dataset.ccnerVoiceMode = value;
    if (value === 'manual') {
      try { window.stopListening?.(false); } catch (_) {}
      stopManual();
    }
    refreshButtons();
    updateVoicePrompt();
  }

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
    const status = document.querySelector('#statusText');
    if (hint) hint.hidden = false;
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

  function ensureSettingsControl() {
    const leaves = [...document.querySelectorAll('body *')].filter(el => {
      return el.children.length === 0 && el.textContent.trim() === 'Voice mode';
    });

    leaves.forEach(label => {
      // Prefer the immediate row containing the Voice mode label.
      let row = label.parentElement;
      if (!row) return;
      for (let i = 0; i < 3 && row.parentElement; i++) {
        if (row.querySelector('button, [role="button"]')) break;
        row = row.parentElement;
      }

      if (row.querySelector('.ccner-voice-mode-control')) return;

      const control = document.createElement('div');
      control.className = 'ccner-voice-mode-control';
      control.setAttribute('aria-label', 'Momo voice mode');
      control.innerHTML = '<button type="button" data-ccner-voice="continuous" aria-pressed="false">Continuous</button><button type="button" data-ccner-voice="manual" aria-pressed="false">Manual</button>';
      control.querySelectorAll('[data-ccner-voice]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          setMode(btn.dataset.ccnerVoice);
        });
      });

      // Replace the old static value if it is present in this row.
      [...row.querySelectorAll('*')].forEach(el => {
        if (el === label || el.closest('.ccner-voice-mode-control')) return;
        if (el.children.length === 0 && el.textContent.trim() === 'Continuous') el.hidden = true;
      });

      row.appendChild(control);
      refreshButtons();
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .ccner-voice-mode-control{display:flex!important;gap:8px;align-items:center;margin-left:auto;flex-shrink:0}
    .ccner-voice-mode-control button{border:1px solid #dfd1c2!important;background:#fffaf5!important;color:#4f443b!important;border-radius:10px!important;padding:8px 12px!important;font-weight:800!important;cursor:pointer!important;line-height:1.1!important}
    .ccner-voice-mode-control button.active{background:#6d4ca5!important;color:#fff!important;border-color:#6d4ca5!important}
    .ccner-voice-mode-control button:focus-visible{outline:3px solid rgba(109,76,165,.25);outline-offset:2px}
    @media(max-width:560px){.ccner-voice-mode-control{margin-left:0;margin-top:6px;flex-wrap:wrap}}
  `;
  document.head.appendChild(style);

  document.documentElement.dataset.ccnerVoiceMode = getMode();
  window.CCNERVoiceMode = { getMode, setMode, manualListen, stopManual };

  const boot = () => {
    installManualButtonHook();
    ensureSettingsControl();
    refreshButtons();
    updateVoicePrompt();
  };

  const observer = new MutationObserver(() => boot());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  observer.observe(document.body, { childList: true, subtree: true });
})();
