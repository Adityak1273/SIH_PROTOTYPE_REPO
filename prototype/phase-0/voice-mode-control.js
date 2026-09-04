/* Momo voice-mode control: Continuous or Manual. */
(() => {
  'use strict';
  const KEY = 'ccner-momo-voice-mode';
  const getMode = () => localStorage.getItem(KEY) === 'manual' ? 'manual' : 'continuous';
  const setMode = mode => {
    const value = mode === 'manual' ? 'manual' : 'continuous';
    localStorage.setItem(KEY, value);
    document.documentElement.dataset.ccnerVoiceMode = value;
    updateSettingsUI();
    if (value === 'manual') {
      try { window.stopListening?.(false); } catch (_) {}
    }
  };

  document.documentElement.dataset.ccnerVoiceMode = getMode();

  // Manual mode owns each microphone interaction. One tap = one listening turn.
  // Momo's normal speech synthesis remains unchanged; after the reply there is
  // deliberately no automatic re-listen until the user taps the microphone again.
  let manualRecognition = null;
  let manualListening = false;

  function manualListen() {
    if (getMode() !== 'manual' || manualListening) return;
    try { window.stopListening?.(false); } catch (_) {}
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      window.respond?.('');
      return;
    }
    const r = new Recognition();
    manualRecognition = r;
    manualListening = true;
    r.lang = 'en-IN';
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

  function updateSettingsUI() {
    const labels = [...document.querySelectorAll('body *')].filter(el => el.children.length === 0 && el.textContent.trim() === 'Voice mode');
    labels.forEach(label => {
      const row = label.closest('div, li, section, article') || label.parentElement;
      if (!row || row.dataset.ccnerVoiceRow === '1') return;
      row.dataset.ccnerVoiceRow = '1';
      const control = document.createElement('div');
      control.className = 'ccner-voice-mode-control';
      control.innerHTML = '<button type="button" data-ccner-voice="continuous">Continuous</button><button type="button" data-ccner-voice="manual">Manual</button>';
      row.appendChild(control);
      control.querySelectorAll('[data-ccner-voice]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.ccnerVoice)));
      refreshButtons();
    });
  }

  function refreshButtons() {
    const mode = getMode();
    document.querySelectorAll('[data-ccner-voice]').forEach(btn => {
      const active = btn.dataset.ccnerVoice === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  // Keep the setting visible even when the settings drawer is rendered later.
  const observer = new MutationObserver(() => {
    installManualButtonHook();
    updateSettingsUI();
    refreshButtons();
  });
  const start = () => {
    installManualButtonHook();
    updateSettingsUI();
    refreshButtons();
    observer.observe(document.body, { childList: true, subtree: true });
  };

  window.CCNERVoiceMode = { getMode, setMode, manualListen, stopManual };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
