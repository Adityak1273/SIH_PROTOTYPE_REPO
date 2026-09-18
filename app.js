/* Cognitive Care NER — canonical app shell.
 * Game logic is owned only by game-engine-v6.js.
 */
(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
const state={soundOn:true,listening:false,voiceArmed:false,speaking:false,thinking:false,recognition:null,restartTimer:null,view:'homeView',history:read('ccner-history',[]),conversation:[],sessionStarted:false,level:1};
window.state=state;
const stage=$('#stage'),speechText=$('#speechText'),thought=$('#thought'),statusPill=$('#statusPill'),statusText=$('#statusText'),moodText=$('#moodText'),chatInput=$('#chatInput'),voiceHint=$('#voiceHint');
const pick=a=>a[Math.floor(Math.random()*a.length)];
function setMood(m,label=m){if(stage)stage.className='stage mood-'+m;if(moodText)moodText.textContent='Mood: '+label}
function setStatus(t,busy=false){if(statusText)statusText.textContent=t;if(statusPill)statusPill.classList.toggle('busy',busy)}
function updateNav(active='homeView'){
 $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===active));
 const nav=$('.bottom-nav');if(nav)nav.hidden=active==='gameView';
}
function showView(id){
 $$('.view').forEach(v=>v.hidden=true);const t=$(id);if(!t)return;t.hidden=false;
 state.view=id.slice(1);updateNav(state.view);window.scrollTo?.({top:0,behavior:'smooth'});
}
function speak(text,after=null){
 if(!state.soundOn||!('speechSynthesis'in window)){after?.();return}
 state.speaking=true;stopListening(false);setStatus('Momo is talking',true);speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(String(text));u.rate=.92;u.pitch=1.08;u.volume=1;
 const voices=speechSynthesis.getVoices(),preferred=voices.find(v=>/^en-IN$/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));if(preferred)u.voice=preferred;
 u.onstart=()=>{setStatus('Momo is talking',true);setMood('speaking','talking')};
 u.onend=()=>{state.speaking=false;setStatus(state.voiceArmed?'Listening for you':'Ready to play');after?.();if(state.voiceArmed)queueListening(250)};
 u.onerror=()=>{state.speaking=false;after?.();if(state.voiceArmed)queueListening(250)};
 speechSynthesis.speak(u);
}
function say(text,mood='happy',label=mood,opts={}){
 if(speechText)speechText.textContent=String(text);if(thought)thought.textContent=({thinking:'Let me think…',excited:'Ooooh! Let’s do it!',encourage:'One step at a time.',speaking:'I’m talking…',listening:'Your turn — I’m listening.'}[mood]||'I’m listening…');
 setMood(mood,label);if(!opts.silent)speak(text,opts.after);
}
function setConversation(role,text){state.conversation.push({role,text:String(text)});state.conversation=state.conversation.slice(-8)}
function localFallback(text){
 const l=String(text).toLowerCase();
 if(/\b(hi|hello|hey|namaste)\b/.test(l))return pick(['Hello! I was waiting for you. What shall we do together? 😸','Hi there! Momo is here and listening.','Namaste! Shall we have a little chat?']);
 if(/progress|score|result|performance/.test(l)){showResultsFromHistory();return 'Here is your recent progress. We can look at it together.'}
 if(/remind|medicine|water|appointment|task/.test(l))return 'I can help you keep track of reminders and daily activities.';
 if(/start|play|game|activity|begin|khel/.test(l)){startSession();return 'Absolutely! Let’s start today’s little brain adventure. 🎮'}
 if(/thank/.test(l))return pick(['You’re very welcome! 😸','Anytime! Momo is always here.','We make a good team!']);
 return pick(['Hmm, tell me a little more. I’m listening.','That sounds interesting. What happened next?','I’m right here with you. Want to tell me more?']);
}
async function aiReply(text){
 try{
  const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:state.conversation,level:state.level,screen:state.view,game:null,language:window.CCNERLanguage?.locale||'en-IN',languageName:window.CCNERLanguage?.language||'English'})});
  if(!r.ok)throw Error('AI unavailable');const d=await r.json();if(d?.reply)return String(d.reply).slice(0,1200);
 }catch(_){}
 return localFallback(text);
}
function respond(raw){
 const text=String(raw||'').trim();if(!text)return;setConversation('user',text);state.thinking=true;setStatus('Momo is thinking',true);setMood('thinking','thinking');
 if(/\b(start|play|game|activity|begin)\b/i.test(text)){state.thinking=false;startSession();return}
 aiReply(text).then(reply=>{setConversation('assistant',reply);state.thinking=false;say(reply,'happy','curious')}).catch(()=>{state.thinking=false;say(localFallback(text),'encourage','helpful')});
}
function queueListening(delay=350){if(!state.voiceArmed||state.speaking)return;clearTimeout(state.restartTimer);state.restartTimer=setTimeout(startListening,delay)}
function stopListening(keepArmed=true){
 const r=state.recognition;state.recognition=null;try{r?.stop()}catch{}state.listening=false;if(voiceHint)voiceHint.hidden=true;if(!keepArmed)clearTimeout(state.restartTimer);
}
function startListening(){
 if(!state.voiceArmed||state.speaking||state.listening)return;
 const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){say('Voice input is not supported on this device yet. You can still type to me.','encourage','helpful');state.voiceArmed=false;return}
 const r=new Recognition();state.recognition=r;r.lang='en-IN';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;state.listening=true;if(voiceHint)voiceHint.hidden=false;setStatus('Listening for you',true);setMood('listening','listening');let finalText='';
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=t;else if(speechText)speechText.textContent=t}if(finalText){respond(finalText);finalText=''}};
 r.onerror=e=>{state.listening=false;if(voiceHint)voiceHint.hidden=true;if(e.error!=='aborted'&&e.error!=='no-speech')setStatus('Voice ready');if(state.voiceArmed&&!state.speaking)queueListening(500)};
 r.onend=()=>{state.listening=false;if(voiceHint)voiceHint.hidden=true;if(state.voiceArmed&&!state.speaking&&!state.thinking)queueListening(350)};
 try{r.start()}catch{state.listening=false;queueListening(700)}
}
function armVoice(){state.voiceArmed=true;say('I’m listening now. You can keep talking naturally — no need to press Talk again. 😸','listening','listening',{after:()=>queueListening(150)})}
function startSession(){
 const canonical=window.CCNER_SAFE_START_SESSION;
 if(typeof canonical==='function'&&canonical!==startSession){state.sessionStarted=true;canonical();return}
 setStatus('Loading today’s five-game training…',true);
 let tries=0;const timer=setInterval(()=>{tries++;const fn=window.CCNER_SAFE_START_SESSION;if(typeof fn==='function'&&fn!==startSession){clearInterval(timer);state.sessionStarted=true;fn()}else if(tries>=50){clearInterval(timer);state.sessionStarted=false;setStatus('Game engine could not load. Please refresh once.')}} ,100);
}
function showResultsFromHistory(){
 const h=read('ccner-history',[]),s=h.at(-1);
 if(!s){openOverlay('Progress','<p>You have not completed a session yet. Start today’s five-game workout and your progress will appear here.</p>');return}
 state.history=h;
 $('#overallScore')?.replaceChildren(document.createTextNode(Math.round(Number(s.score||0))+'%'));
 $('#overallAccuracy')?.replaceChildren(document.createTextNode(Math.round(Number(s.accuracy||0)*100)+'%'));
 $('#gamesCompleted')?.replaceChildren(document.createTextNode('5 / 5'));
 $('#avgTime')?.replaceChildren(document.createTextNode((Number(s.avgTime||0)).toFixed(1)+'s'));
 const rows=$('#resultRows');if(rows)rows.textContent='';
 (s.results||[]).forEach(r=>{const e=document.createElement('div');e.className='result-row';const left=document.createElement('div'),name=document.createElement('div'),detail=document.createElement('div'),score=document.createElement('span');name.className='result-name';name.textContent=r.game||r.name||'Game';detail.className='result-detail';detail.textContent=(r.correct?'Correct':'Needs practice')+' · '+(Number(r.seconds||0)).toFixed(1)+'s';score.className='score-pill';score.textContent=r.correct?'100%':'0%';left.append(name,detail);e.append(left,score);rows?.append(e)});
 const prev=h.at(-2);$('#trendBadge')?.replaceChildren(document.createTextNode(!prev?'First session':Number(s.score)>Number(prev.score)?'Improving ↑':Number(s.score)<Number(prev.score)?'Different day ↔':'Steady →'));
 showView('#resultsView');
}
function openOverlay(title,body){
 const p=$('#overlayPanel'),c=$('#overlayContent');if(!p||!c)return;c.textContent='';
 const head=document.createElement('p');head.className='eyebrow';head.textContent='MOMO';const h=document.createElement('h3');h.textContent=title;c.append(head,h);
 const wrap=document.createElement('div');wrap.innerHTML=body;c.append(wrap);p.hidden=false;$('#closeOverlay')?.focus();
}
function closeOverlay(){const p=$('#overlayPanel');if(p)p.hidden=true}
function reminders(){
 openOverlay('Today’s reminders','<div class="reminder"><span>💊 Medicine</span><strong>08:00 · 20:00</strong></div><div class="reminder"><span>💧 Hydration</span><strong>Every 2 hours</strong></div><div class="reminder"><span>📅 Appointment</span><strong>Tomorrow · 11:30</strong></div><p class="overlay-note">Reminder delivery is controlled by the notification and security layers.</p>');
}
function settings(){
 openOverlay('Settings','<div class="setting-row"><span>🔊 Momo voice</span><button class="action-button" id="overlaySound" type="button">Toggle</button></div><div class="setting-row"><span>🎙️ Voice mode</span><strong>Continuous</strong></div><div class="setting-row"><span>🌐 Language</span><strong>English (India)</strong></div>');
 $('#overlaySound')?.addEventListener('click',()=>{$('#soundToggle')?.click();closeOverlay()},{once:true});
}
window.CCNERUI={home:()=>showView('#homeView'),progress:showResultsFromHistory,reminders,settings};
window.CCNERGameShell={showView,setStatus,setMood,say,openOverlay,closeOverlay};
window.CCNERCompanion=window.CognitiveCareCompanion={onGameEvent:e=>say(e?.type==='correct'?pick(['Yes!','Lovely!','You got it!']):'That’s okay. Let’s keep going.',e?.type==='correct'?'celebrate':'encourage',e?.type==='correct'?'proud':'encouraging')};
window.startSession=startSession;window.respond=respond;window.armVoice=armVoice;window.queueListening=queueListening;window.stopListening=stopListening;window.showView=showView;window.setStatus=setStatus;window.setMood=setMood;window.say=say;window.showResultsFromHistory=showResultsFromHistory;window.openPanel=(name)=>({reminders,settings,progress:showResultsFromHistory}[name]||(()=>{}))();
function bind(){
 $('#soundToggle')?.addEventListener('click',()=>{state.soundOn=!state.soundOn;$('#soundToggle').textContent=state.soundOn?'🔊':'🔇';if(!state.soundOn)stopListening(false)});
 $('#homeButton')?.addEventListener('click',()=>showView('#homeView'));
 $('#closeOverlay')?.addEventListener('click',closeOverlay);
 $('#overlayPanel')?.addEventListener('click',e=>{if(e.target.id==='overlayPanel')closeOverlay()});
 $('#playAgain')?.addEventListener('click',startSession);
 $('#backHome')?.addEventListener('click',()=>showView('#homeView'));
 $('#sendButton')?.addEventListener('click',()=>{respond(chatInput?.value);if(chatInput)chatInput.value=''});
 chatInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){respond(chatInput.value);chatInput.value=''}});
 $$('.quick-actions [data-action="start"]').forEach(b=>b.addEventListener('click',startSession));
 $$('.quick-actions [data-action="talk"]').forEach(b=>b.addEventListener('click',armVoice));
 $$('.quick-actions [data-action="reminder"]').forEach(b=>b.addEventListener('click',reminders));
 $$('.quick-actions [data-action="progress"]').forEach(b=>b.addEventListener('click',showResultsFromHistory));
 $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>{
   const n=b.dataset.nav;
   if(n==='homeView')showView('#homeView');
   else if(n==='resultsView')showResultsFromHistory();
   else if(n==='startSession')startSession();
   else if(n==='reminders')reminders();
   else if(n==='settings')window.CCNERNavigation?.open?.()||settings();
 }));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlay()});
 setMood('happy','happy');setStatus('Ready to play');updateNav('homeView');
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();