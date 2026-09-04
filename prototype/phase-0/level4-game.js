/* Cognitive Care NER — Level 4: guided game mode + Momo wake help + safe exit */
(() => {
  'use strict';
  if (window.__CCNER_LEVEL4__) return;
  window.__CCNER_LEVEL4__ = true;

  const $ = s => document.querySelector(s);
  const LANG = () => localStorage.getItem('ccner-p1-language') || 'en-IN';
  const langKey = () => LANG().slice(0,2);
  const COPY = {
    en:{yes:'Yes',no:'No',ask:'Would you like a tutorial?',title:'Before we play',close:'Continue',exit:'Exit Game',exitTitle:'Leave this game?',exitText:'Your current game will end safely. Any completed games already saved remain available.',stay:'Stay',leave:'Exit Game',wake:'Say “Momo” if you need help.',help:'Here is the game overview again. I will stay quiet while you play.',objective:'Objective',rules:'Rules',interaction:'How to interact'},
    hi:{yes:'हाँ',no:'नहीं',ask:'क्या आप ट्यूटोरियल चाहते हैं?',title:'खेल शुरू करने से पहले',close:'जारी रखें',exit:'गेम से बाहर निकलें',exitTitle:'क्या आप गेम छोड़ना चाहते हैं?',exitText:'आपका वर्तमान गेम सुरक्षित रूप से समाप्त हो जाएगा। पूरे किए गए गेम सेव रहेंगे।',stay:'रुकें',leave:'बाहर निकलें',wake:'मदद चाहिए तो “Momo” बोलें।',help:'यह गेम फिर से समझाता हूँ। खेलते समय मैं शांत रहूँगा।',objective:'उद्देश्य',rules:'नियम',interaction:'कैसे खेलें'},
    bn:{yes:'হ্যাঁ',no:'না',ask:'আপনি কি টিউটোরিয়াল চান?',title:'খেলা শুরুর আগে',close:'চালিয়ে যান',exit:'গেম ছাড়ুন',exitTitle:'গেম ছেড়ে যাবেন?',exitText:'বর্তমান গেমটি নিরাপদে শেষ হবে। সম্পূর্ণ করা গেমগুলো সংরক্ষিত থাকবে।',stay:'থাকুন',leave:'বেরিয়ে যান',wake:'সাহায্য চাইলে “Momo” বলুন।',help:'গেমটি আবার বুঝিয়ে দিচ্ছি। খেলার সময় আমি চুপ থাকব।',objective:'উদ্দেশ্য',rules:'নিয়ম',interaction:'কীভাবে খেলবেন'},
    as:{yes:'হয়',no:'নহয়',ask:'আপুনি টিউটোৰিয়েল বিচাৰে নেকি?',title:'খেল আৰম্ভ কৰাৰ আগতে',close:'আগবাঢ়ক',exit:'খেল এৰক',exitTitle:'খেল এৰিব নেকি?',exitText:'বৰ্তমান খেলখন সুৰক্ষিতভাৱে শেষ হ’ব। সম্পূৰ্ণ কৰা খেলসমূহ সংৰক্ষিত থাকিব।',stay:'থাকক',leave:'এৰক',wake:'সহায় লাগিলে “Momo” কওক।',help:'খেলখন আকৌ বুজাই দিছোঁ। খেলি থাকোঁতে মই মনে মনে থাকিম।',objective:'উদ্দেশ্য',rules:'নিয়ম',interaction:'কেনেকৈ খেলিব'}
  };
  const t = k => (COPY[langKey()] || COPY.en)[k];

  const gameInfo = {
    'Familiar Object Memory':{o:{en:'Remember familiar objects.',hi:'परिचित वस्तुओं को याद रखें।',bn:'পরিচিত জিনিস মনে রাখুন।',as:'চিনাকি বস্তুবোৰ মনত ৰাখক।'},r:{en:'Look carefully, remember the objects, then choose the one you saw.',hi:'ध्यान से देखें, वस्तुओं को याद रखें, फिर देखी गई वस्तु चुनें।',bn:'মন দিয়ে দেখুন, জিনিসগুলো মনে রাখুন, তারপর দেখা জিনিসটি বেছে নিন।',as:'ভালদৰে চাওক, বস্তুবোৰ মনত ৰাখক, তাৰ পিছত দেখা বস্তুটো বাছক।'},i:{en:'Tap the large answer button that you think is correct.',hi:'आपको सही लगने वाले बड़े उत्तर बटन को दबाएँ।',bn:'সঠিক মনে হওয়া বড় উত্তর বোতামটি চাপুন।',as:'সঠিক বুলি ভবা ডাঙৰ উত্তৰ বুটামটো টিপক।'}},
    'Find the Object':{o:{en:'Find the requested object.',hi:'मांगी गई वस्तु खोजें।',bn:'চাওয়া জিনিসটি খুঁজুন।',as:'বিচৰা বস্তুটো বিচাৰি উলিয়াওক।'},r:{en:'Listen to the target, scan the choices, and select the matching object.',hi:'लक्ष्य सुनें, विकल्प देखें और मिलती वस्तु चुनें।',bn:'লক্ষ্যটি শুনুন, বিকল্পগুলো দেখুন এবং মিল থাকা জিনিসটি বেছে নিন।',as:'লক্ষ্যটো শুনক, বিকল্পবোৰ চাওক আৰু মিল থকা বস্তুটো বাছক।'},i:{en:'Tap one large object button.',hi:'एक बड़े वस्तु बटन को दबाएँ।',bn:'একটি বড় জিনিসের বোতাম চাপুন।',as:'এটা ডাঙৰ বস্তু বুটাম টিপক।'}},
    'Sequence Recall':{o:{en:'Remember the daily routine order.',hi:'दैनिक दिनचर्या का क्रम याद रखें।',bn:'দৈনন্দিন কাজের ক্রম মনে রাখুন।',as:'দৈনন্দিন কামৰ ক্ৰম মনত ৰাখক।'},r:{en:'Watch the routine, then reproduce the same order.',hi:'दिनचर्या देखें, फिर उसी क्रम को दोहराएँ।',bn:'রুটিন দেখুন, তারপর একই ক্রমে সাজান।',as:'দিনটোৰ কামবোৰ চাওক, তাৰ পিছত একে ক্ৰমত সজাওক।'},i:{en:'Tap the large step buttons in order.',hi:'बड़े चरण बटन सही क्रम में दबाएँ।',bn:'বড় ধাপের বোতামগুলো ক্রম অনুযায়ী চাপুন।',as:'ডাঙৰ ধাপ বুটামবোৰ ক্ৰম অনুসৰি টিপক।'}},
    'Pattern Completion':{o:{en:'Find what comes next in the pattern.',hi:'पैटर्न में अगला चिन्ह खोजें।',bn:'প্যাটার্নে পরের চিহ্নটি খুঁজুন।',as:'আৰ্হিত পৰৱৰ্তী চিহ্নটো বিচাৰক।'},r:{en:'Look for the repeating rule and choose the next item.',hi:'दोहराते नियम को देखें और अगली वस्तु चुनें।',bn:'পুনরাবৃত্ত নিয়ম দেখুন এবং পরের জিনিসটি বেছে নিন।',as:'পুনৰাবৃত্ত নিয়মটো চাওক আৰু পৰৱৰ্তী বস্তুটো বাছক।'},i:{en:'Tap one large answer choice.',hi:'एक बड़ा उत्तर विकल्प दबाएँ।',bn:'একটি বড় উত্তর বিকল্প চাপুন।',as:'এটা ডাঙৰ উত্তৰ বিকল্প টিপক।'}},
    'Local Object Memory':{o:{en:'Remember familiar everyday NER-style objects.',hi:'NER क्षेत्र के परिचित रोज़मर्रा के सामान याद रखें।',bn:'NER-এর পরিচিত দৈনন্দিন জিনিস মনে রাখুন।',as:'NER-ৰ চিনাকি দৈনন্দিন বস্তুবোৰ মনত ৰাখক।'},r:{en:'Look at familiar objects, remember them, then recall the requested one.',hi:'परिचित वस्तुएँ देखें, याद रखें और फिर मांगी गई वस्तु पहचानें।',bn:'পরিচিত জিনিস দেখুন, মনে রাখুন, তারপর চাওয়া জিনিসটি চিনুন।',as:'চিনাকি বস্তুবোৰ চাওক, মনত ৰাখক আৰু বিচৰা বস্তুটো চিনাক্ত কৰক।'},i:{en:'Use the large object choices on screen.',hi:'स्क्रीन पर बड़े वस्तु विकल्पों का उपयोग करें।',bn:'স্ক্রিনের বড় জিনিসের বিকল্প ব্যবহার করুন।',as:'পৰ্দাত থকা ডাঙৰ বস্তু বিকল্পবোৰ ব্যৱহাৰ কৰক।'}}
  };

  let gateOpen = false, pendingTimers = [], observer, recognition, recognitionRunning = false;
  const nativeSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = function(fn, ms, ...args){
    const src = typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
    if (!gateOpen && typeof fn === 'function' && /beginRound/.test(src) && Number(ms) <= 2000) {
      pendingTimers.push(() => fn(...args));
      return -1;
    }
    return nativeSetTimeout(fn, ms, ...args);
  };

  function speak(text){ try{ if('speechSynthesis' in window){ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=LANG(); u.rate=.9; u.pitch=1.08; speechSynthesis.speak(u); } }catch(_){} }
  function currentInfo(){ const title=$('#gameTitle')?.textContent?.trim()||''; return gameInfo[title] || null; }

  function modal(html, cls='l4-modal'){
    document.querySelector('.'+cls)?.remove();
    const wrap=document.createElement('div'); wrap.className=cls; wrap.innerHTML=html; document.body.appendChild(wrap); return wrap;
  }
  function tutorial(){
    const info=currentInfo(); if(!info){ openGate(); return; }
    const k=langKey(), get=x=>x[k]||x.en;
    const el=modal(`<div class="l4-dialog" role="dialog" aria-modal="true"><div class="l4-momo">🐶</div><p class="l4-eyebrow">MOMO</p><h2>${t('title')}</h2><h3>${t('objective')}</h3><p>${get(info.o)}</p><h3>${t('rules')}</h3><p>${get(info.r)}</p><h3>${t('interaction')}</h3><p>${get(info.i)}</p><div class="l4-badges"><span>1 · Look</span><span>2 · Think</span><span>3 · Tap</span></div><p class="l4-quiet">${t('wake')}</p><button id="l4Continue" class="l4-primary">${t('close')}</button></div>`);
    $('#l4Continue',el)?.addEventListener('click',()=>{el.remove(); openGate(); speak(t('help'));});
    speak(`${get(info.o)} ${get(info.r)} ${get(info.i)}`);
  }
  function askTutorial(){
    const el=modal(`<div class="l4-dialog l4-ask" role="dialog" aria-modal="true"><div class="l4-momo">🐶</div><p class="l4-eyebrow">MOMO</p><h2>${t('ask')}</h2><div class="l4-choice-row"><button id="l4Yes" class="l4-primary">${t('yes')}</button><button id="l4No" class="l4-secondary">${t('no')}</button></div></div>`);
    $('#l4Yes',el)?.addEventListener('click',tutorial); $('#l4No',el)?.addEventListener('click',()=>{el.remove();openGate();});
    speak(t('ask'));
  }
  function openGate(){ gateOpen=true; const q=pendingTimers.splice(0); q.forEach(fn=>nativeSetTimeout(fn,50)); setGameChrome(); startWake(); }
  function setGameChrome(){
    const game=$('#gameView'); if(!game || game.hidden) return;
    if(!document.getElementById('l4Exit')) game.insertAdjacentHTML('afterbegin',`<div class="l4-gamebar"><span>🐾 ${t('wake')}</span><button id="l4Exit" type="button">${t('exit')}</button></div>`);
    const exit=$('#l4Exit'); if(exit&&!exit.dataset.bound){exit.dataset.bound='1';exit.addEventListener('click',exitConfirm);}
    const row=$('.chat-row'); if(row)row.classList.add('l4-disabled');
    const input=$('#chatInput'); if(input){input.disabled=true;input.placeholder=t('wake');}
  }
  function exitConfirm(){
    const el=modal(`<div class="l4-dialog" role="dialog" aria-modal="true"><div class="l4-momo">🐶</div><h2>${t('exitTitle')}</h2><p>${t('exitText')}</p><div class="l4-choice-row"><button id="l4Stay" class="l4-secondary">${t('stay')}</button><button id="l4Leave" class="l4-primary">${t('leave')}</button></div></div>`);
    $('#l4Stay',el)?.addEventListener('click',()=>el.remove());
    $('#l4Leave',el)?.addEventListener('click',()=>{el.remove();safeExit();});
  }
  function safeExit(){
    gateOpen=true; pendingTimers=[]; stopWake(); try{speechSynthesis?.cancel();}catch(_){}
    const game=$('#gameView'); if(game)game.hidden=true; const home=$('#homeView'); if(home)home.hidden=false;
    const status=$('#todayStatus'); if(status)status.textContent='Session exited';
    document.querySelector('.l4-gamebar')?.remove();
    window.dispatchEvent(new CustomEvent('ccner:level4-exit'));
    speak('Okay. We can try again whenever you are ready.');
  }

  function startWake(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR || recognitionRunning) return;
    try{
      recognition=new SR(); recognition.lang=LANG(); recognition.continuous=true; recognition.interimResults=false;
      recognition.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(!e.results[i].isFinal)continue;const text=e.results[i][0].transcript.toLowerCase();if(/\bmomo\b/.test(text)){const info=currentInfo(); if(info){const k=langKey(),get=x=>x[k]||x.en;speak(`${get(info.o)} ${get(info.r)} ${get(info.i)}`);flashHelp(get(info.r));}}}};
      recognition.onend=()=>{recognitionRunning=false;if(gateOpen&&$('#gameView')&&!$('#gameView').hidden) nativeSetTimeout(startWake,250);};
      recognition.onerror=()=>{recognitionRunning=false;}; recognition.start(); recognitionRunning=true;
    }catch(_){recognitionRunning=false;}
  }
  function stopWake(){try{recognition?.stop();}catch(_){} recognitionRunning=false;}
  function flashHelp(text){ const el=modal(`<div class="l4-help" role="status"><div class="l4-momo">🐶</div><strong>Momo</strong><p>${text}</p></div>`, 'l4-help-modal'); nativeSetTimeout(()=>el.remove(),3500); }

  const originalStart=window.startSession;
  window.startSession=function(){
    if(typeof originalStart!=='function') return;
    gateOpen=false; pendingTimers=[]; originalStart();
    nativeSetTimeout(()=>{setGameChrome();askTutorial();},80);
  };

  observer=new MutationObserver(()=>{
    const game=$('#gameView'); if(!game||game.hidden)return;
    setGameChrome();
    const title=$('#gameTitle')?.textContent?.trim()||'';
    if(title && observer._lastTitle!==title){
      observer._lastTitle=title;
      if(gateOpen){ gateOpen=false; pendingTimers=[]; askTutorial(); }
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});

  document.addEventListener('click',e=>{ if(e.target.closest('#l4Exit')) return; },true);
})();