/* Cognitive Care NER — multilingual voice + UI layer
 * Supported demo languages: English, Hindi, Bengali, Assamese.
 * No external translation service is required for core UI/voice controls.
 */
(() => {
  'use strict';
  const KEY='ccner-language';
  const LANGS={
    'en-IN':{name:'English',native:'English'},
    'hi-IN':{name:'Hindi',native:'हिन्दी'},
    'bn-IN':{name:'Bengali',native:'বাংলা'},
    'as-IN':{name:'Assamese',native:'অসমীয়া'}
  };
  const T={
    'en-IN':{title:'Meet Momo',subtitle:"Your playful companion for today's brain workout.",ready:'Ready to play',start:"🎮 Start today's session",talk:'🎙️ Talk to Momo',reminders:'⏰ Reminders',progress:'📈 Progress',hands:'Hands-free voice',handsText:'Tap Talk once. After Momo replies, Momo automatically listens again.',today:'TODAY',routine:'Your little daily routine',activity:"Today's activity",games:'Games',focus:'Focus',promise:"🐾 Momo's promise",noPressure:'No pressure. Just one small step at a time.',send:'Send',placeholder:'Or type to Momo…',language:'Language & voice',choose:'Choose your language',saved:'Language saved',safety:'Safety: training scores describe game performance only. They do not diagnose dementia or assign a clinical stage.',session:'SESSION COMPLETE',performance:'TRAINING PERFORMANCE',todaysGames:"Today's games",playAgain:'🔁 Play again',home:'⌂ Home'},
    'hi-IN':{title:'मोमो से मिलिए',subtitle:'आज के दिमागी अभ्यास के लिए आपका प्यारा साथी।',ready:'खेलने के लिए तैयार',start:'🎮 आज का अभ्यास शुरू करें',talk:'🎙️ मोमो से बात करें',reminders:'⏰ रिमाइंडर',progress:'📈 प्रगति',hands:'हैंड्स-फ्री आवाज़',handsText:'एक बार बात करें। मोमो के जवाब के बाद वह फिर से आपकी आवाज़ सुनेगा।',today:'आज',routine:'आपकी छोटी दैनिक दिनचर्या',activity:'आज की गतिविधि',games:'खेल',focus:'ध्यान',promise:'🐾 मोमो का वादा',noPressure:'कोई दबाव नहीं। बस एक छोटा कदम, एक समय में।',send:'भेजें',placeholder:'या मोमो को लिखें…',language:'भाषा और आवाज़',choose:'अपनी भाषा चुनें',saved:'भाषा सेव हो गई',safety:'सुरक्षा: ये स्कोर केवल खेल के प्रदर्शन को बताते हैं। ये डिमेंशिया का निदान या क्लिनिकल स्टेज नहीं बताते।',session:'अभ्यास पूरा',performance:'अभ्यास प्रदर्शन',todaysGames:'आज के खेल',playAgain:'🔁 फिर खेलें',home:'⌂ होम'},
    'bn-IN':{title:'মোমোর সাথে দেখা করুন',subtitle:'আজকের মস্তিষ্কের অনুশীলনের জন্য আপনার মজার সঙ্গী।',ready:'খেলার জন্য প্রস্তুত',start:'🎮 আজকের অনুশীলন শুরু করুন',talk:'🎙️ মোমোর সাথে কথা বলুন',reminders:'⏰ রিমাইন্ডার',progress:'📈 অগ্রগতি',hands:'হ্যান্ডস-ফ্রি ভয়েস',handsText:'একবার Talk চাপুন। মোমো উত্তর দেওয়ার পর আবার আপনার কথা শুনবে।',today:'আজ',routine:'আপনার ছোট দৈনিক রুটিন',activity:'আজকের কাজ',games:'গেম',focus:'মনোযোগ',promise:'🐾 মোমোর প্রতিশ্রুতি',noPressure:'কোনও চাপ নেই। একবারে একটি ছোট পদক্ষেপ।',send:'পাঠান',placeholder:'অথবা মোমোকে লিখুন…',language:'ভাষা ও ভয়েস',choose:'আপনার ভাষা বেছে নিন',saved:'ভাষা সংরক্ষিত হয়েছে',safety:'নিরাপত্তা: এই স্কোর শুধু গেমের পারফরম্যান্স বোঝায়। এটি ডিমেনশিয়ার রোগ নির্ণয় বা ক্লিনিক্যাল স্টেজ নয়।',session:'সেশন সম্পূর্ণ',performance:'অনুশীলনের ফলাফল',todaysGames:'আজকের গেম',playAgain:'🔁 আবার খেলুন',home:'⌂ হোম'},
    'as-IN':{title:'মোমোক লগ পাওক',subtitle:'আজিৰ মগজুৰ অনুশীলনৰ বাবে আপোনাৰ মৰমলগা সংগী।',ready:'খেলিবলৈ সাজু',start:'🎮 আজিৰ অনুশীলন আৰম্ভ কৰক',talk:'🎙️ মোমোৰ সৈতে কথা পাতক',reminders:'⏰ সোঁৱৰনী',progress:'📈 অগ্ৰগতি',hands:'হেণ্ডছ-ফ্ৰী ভইচ',handsText:'এবাৰ Talk টিপক। মোমোৱে উত্তৰ দিয়াৰ পিছত আকৌ আপোনাৰ কথা শুনিব।',today:'আজি',routine:'আপোনাৰ সৰু দৈনিক ৰুটিন',activity:'আজিৰ কাৰ্যকলাপ',games:'খেল',focus:'মনোযোগ',promise:'🐾 মোমোৰ প্ৰতিশ্ৰুতি',noPressure:'কোনো হেঁচা নাই। এটাকৈ সৰু খোজ লওঁ আহক।',send:'পঠাওক',placeholder:'অথবা মোমোক লিখক…',language:'ভাষা আৰু ভইচ',choose:'আপোনাৰ ভাষা বাছক',saved:'ভাষা সংৰক্ষণ কৰা হৈছে',safety:'সুৰক্ষা: এই স্ক’ৰ কেৱল খেলৰ প্ৰদৰ্শন বুজায়। ই ডিমেনচিয়াৰ ৰোগ নিৰ্ণয় বা ক্লিনিকেল ষ্টেজ নহয়।',session:'ছেছন সম্পূৰ্ণ',performance:'অনুশীলনৰ ফলাফল',todaysGames:'আজিৰ খেল',playAgain:'🔁 আকৌ খেলক',home:'⌂ হোম'}
  };
  let locale=localStorage.getItem(KEY)||'en-IN';
  if(!LANGS[locale])locale='en-IN';
  const text=()=>T[locale];
  function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function apply(){
    document.documentElement.lang=locale;
    const t=text();
    const map={pageTitle:t.title,voiceHint:t.ready,chatInput:t.placeholder,todayStatus:t.activity};
    Object.entries(map).forEach(([id,val])=>{const e=document.getElementById(id);if(e&&id==='chatInput')e.placeholder=val;else if(e)e.textContent=val});
    const subtitle=document.querySelector('.subtitle');if(subtitle)subtitle.textContent=t.subtitle;
    const buttons=[...document.querySelectorAll('.quick-actions button')];
    if(buttons[0])buttons[0].textContent=t.start;if(buttons[1])buttons[1].textContent=t.talk;if(buttons[2])buttons[2].textContent=t.reminders;if(buttons[3])buttons[3].textContent=t.progress;
    const vb=document.querySelector('.voice-banner');if(vb){const strong=vb.querySelector('strong'),p=vb.querySelector('p');if(strong)strong.textContent=t.hands;if(p)p.textContent=t.handsText}
    const send=document.getElementById('sendButton');if(send)send.textContent=t.send;
    const labels=document.querySelectorAll('.section-label .eyebrow');if(labels[0])labels[0].textContent=t.today;
    const routine=document.querySelector('.section-label h2');if(routine)routine.textContent=t.routine;
    const info=document.querySelectorAll('.info-grid article');if(info[0]?.querySelector('span'))info[0].querySelector('span').textContent=t.activity;if(info[1]?.querySelector('span'))info[1].querySelector('span').textContent=t.games;if(info[2]?.querySelector('span'))info[2].querySelector('span').textContent=t.focus;
    const strip=document.querySelector('.home-strip strong');if(strip)strip.textContent=t.noPressure;
    const safety=document.querySelector('.phase4-safety');if(safety)safety.textContent=t.safety;
    const resultEyebrow=document.querySelector('#resultsView .result-hero .eyebrow');if(resultEyebrow)resultEyebrow.textContent=t.session;
    const perf=document.querySelector('#resultsView .results-card .eyebrow');if(perf)perf.textContent=t.performance;
    const heading=document.querySelector('#resultsView .results-card h3');if(heading)heading.textContent=t.todaysGames;
    const again=document.getElementById('playAgain');if(again)again.textContent=t.playAgain;
    const home=document.getElementById('backHome');if(home)home.textContent=t.home;
    updateVoiceLanguage();
  }
  function updateVoiceLanguage(){
    window.CCNERLanguage={locale,language:LANGS[locale].name,nativeName:LANGS[locale].native,t:text,langs:LANGS};
    try{
      const voices=window.speechSynthesis?.getVoices?.()||[];const original=voices.slice();
      const preferred=original.filter(v=>String(v.lang).toLowerCase().startsWith(locale.toLowerCase().slice(0,2)));
      if(preferred.length&&window.speechSynthesis.getVoices!==window.__ccnerVoices){
        window.__ccnerVoices=window.speechSynthesis.getVoices;window.speechSynthesis.getVoices=()=>preferred.concat(original.filter(v=>!preferred.includes(v)));
      }
    }catch(_){ }
  }
  function installLanguageCard(){
    const home=document.getElementById('homeView');if(!home||document.getElementById('ccnerLanguageCard'))return;
    const card=document.createElement('section');card.id='ccnerLanguageCard';card.className='language-card';
    card.innerHTML=`<div><p class="eyebrow">${esc(text().language)}</p><h3>${esc(text().choose)}</h3><div class="language-options">${Object.entries(LANGS).map(([k,v])=>`<button type="button" class="language-option" data-lang="${k}">${esc(v.native)}<small>${esc(v.name)}</small></button>`).join('')}</div><p id="languageSaved" class="language-saved" aria-live="polite"></p></div>`;
    home.appendChild(card);
    card.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));
    highlight();
  }
  function highlight(){document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('selected',b.dataset.lang===locale));}
  function setLanguage(next){if(!LANGS[next])return;locale=next;localStorage.setItem(KEY,locale);apply();highlight();const saved=document.getElementById('languageSaved');if(saved)saved.textContent=`✓ ${text().saved} · ${LANGS[next].native}`;window.dispatchEvent(new CustomEvent('ccner:language-change',{detail:{locale}}));}
  function patchRecognition(){
    const Base=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Base||Base.__ccnerWrapped)return;
    const Wrapped=function(){const r=new Base();try{let value=locale;Object.defineProperty(r,'lang',{configurable:true,get:()=>locale,set:v=>{value=v}})}catch(_){r.lang=locale}return r};
    Wrapped.prototype=Base.prototype;Wrapped.__ccnerWrapped=true;window.SpeechRecognition=Wrapped;window.webkitSpeechRecognition=Wrapped;
  }
  function patchUtterance(){
    const Base=window.SpeechSynthesisUtterance;if(!Base||Base.__ccnerWrapped)return;
    const Wrapped=function(text){const u=new Base(text);try{u.lang=locale}catch(_){}return u};Wrapped.prototype=Base.prototype;Wrapped.__ccnerWrapped=true;window.SpeechSynthesisUtterance=Wrapped;
  }
  function boot(){installLanguageCard();apply();patchRecognition();patchUtterance();}
  window.CCNERLanguageController={setLanguage,getLanguage:()=>locale,getLanguages:()=>LANGS,translate:t=>T[locale]?.[t]||t};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
