/* Cognitive Care NER — canonical app shell.
 * Game logic is owned only by game-engine-v6.js.
 */
(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f}catch{return f}};
const readSetting=(k,f)=>{try{const v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}};
const state={soundOn:localStorage.getItem('ccner-mimo-voice')!=='off',listening:false,voiceArmed:readSetting('ccner-conversation-mode','manual')==='continuous',speaking:false,thinking:false,recognition:null,restartTimer:null,view:'homeView',history:read('ccner-history',[]),conversation:[],sessionStarted:false,level:1};
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
 state.speaking=true;stopListening(false);setStatus('Mimo is talking',true);speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(String(text));const globalSpeed={slow:.6,normal:.75,fast:.95};const globalVolume={low:.45,medium:.75,high:1};const gs=localStorage.getItem('ccner-global-speech-speed');const gv=localStorage.getItem('ccner-global-volume');const speechSpeed=gs?globalSpeed[gs]||.75:Number(localStorage.getItem('ccner-speech-speed')||'.75');const speechVolume=gv?globalVolume[gv]||1:Number(localStorage.getItem('ccner-volume')||'1');u.rate=Math.max(.5,Math.min(1.2,speechSpeed));u.pitch=1.08;u.volume=Math.max(0,Math.min(1,speechVolume));
 const wanted=String(window.CCNERLanguage?.locale||'en-IN').toLowerCase();const voices=speechSynthesis.getVoices(),preferred=voices.find(v=>String(v.lang).toLowerCase()===wanted)||voices.find(v=>String(v.lang).toLowerCase().startsWith(wanted.slice(0,2)))||voices.find(v=>/^en/i.test(v.lang));if(preferred)u.voice=preferred;
 u.onstart=()=>{setStatus('Mimo is talking',true);setMood('speaking','talking')};
 u.onend=()=>{state.speaking=false;setStatus(state.voiceArmed?'Listening for you':'Ready to play');after?.();if(localStorage.getItem('ccner-conversation-mode')==='continuous'&&state.voiceArmed)queueListening(250)};
 u.onerror=()=>{state.speaking=false;after?.();if(localStorage.getItem('ccner-conversation-mode')==='continuous'&&state.voiceArmed)queueListening(250)};
 speechSynthesis.speak(u);
}
function say(text,mood='happy',label=mood,opts={}){
 if(speechText)speechText.textContent=String(text);if(thought)thought.textContent=({thinking:'Let me think…',excited:'Ooooh! Let’s do it!',encourage:'One step at a time.',speaking:'I’m talking…',listening:'Your turn — I’m listening.'}[mood]||'I’m listening…');
 setMood(mood,label);if(!opts.silent)speak(text,opts.after);
}
function setConversation(role,text){state.conversation.push({role,text:String(text)});state.conversation=state.conversation.slice(-8)}
function localFallback(text){
 const l=String(text).toLowerCase();
 if(/\b(hi|hello|hey|namaste)\b/.test(l))return pick(['Hello! I was waiting for you. What shall we do together? 😸','Hi there! Mimo is here and listening.','Namaste! Shall we have a little chat?']);
 if(/progress|score|result|performance/.test(l)){showResultsFromHistory();return 'Here is your recent progress. We can look at it together.'}
 if(/remind|medicine|water|appointment|task/.test(l))return 'I can help you keep track of reminders and daily activities.';
 if(/start|play|game|activity|begin|khel/.test(l)){startSession();return 'Absolutely! Let’s start today’s little brain adventure. 🎮'}
 if(/thank/.test(l))return pick(['You’re very welcome! 😸','Anytime! Mimo is always here.','We make a good team!']);
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
 const text=String(raw||'').trim();if(!text)return;setConversation('user',text);state.thinking=true;setStatus('Mimo is thinking',true);setMood('thinking','thinking');
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
 const r=new Recognition();state.recognition=r;r.lang=window.CCNERLanguage?.locale||localStorage.getItem('ccner-language')||'en-IN';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;state.listening=true;if(voiceHint)voiceHint.hidden=false;setStatus('Listening for you',true);setMood('listening','listening');let finalText='';
 r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)finalText+=t;else if(speechText)speechText.textContent=t}if(finalText){respond(finalText);finalText=''}};
 r.onerror=e=>{state.listening=false;if(voiceHint)voiceHint.hidden=true;if(e.error!=='aborted'&&e.error!=='no-speech')setStatus('Voice ready');if(localStorage.getItem('ccner-conversation-mode')==='continuous'&&state.voiceArmed&&!state.speaking)queueListening(500)};
 r.onend=()=>{state.listening=false;if(voiceHint)voiceHint.hidden=true;if(localStorage.getItem('ccner-conversation-mode')==='continuous'&&state.voiceArmed&&!state.speaking&&!state.thinking)queueListening(350)};
 try{r.start()}catch{state.listening=false;queueListening(700)}
}
function armVoice(){const continuous=localStorage.getItem('ccner-conversation-mode')==='continuous';state.voiceArmed=true;say(continuous?'I’m listening now. You can talk naturally — I’ll keep listening after my replies. 😸':'I’m listening now. Please speak, then I’ll reply. Tap Talk again when you want to speak. 😸','listening','listening',{after:()=>{if(continuous)queueListening(150);else startListening()}})}
function startSession(){
 const canonical=window.CCNER_SAFE_START_SESSION||window.CCNER_VIDEO_GAMES?.startSession;
 if(typeof canonical==='function'&&canonical!==startSession){state.sessionStarted=true;canonical();return}
 setStatus('Loading today’s five-game training…',true);
 let tries=0;const timer=setInterval(()=>{tries++;const fn=window.CCNER_SAFE_START_SESSION||window.CCNER_VIDEO_GAMES?.startSession;if(typeof fn==='function'&&fn!==startSession){clearInterval(timer);state.sessionStarted=true;fn()}else if(tries>=120){clearInterval(timer);state.sessionStarted=false;setStatus('Game engine could not load. Please refresh once.')}} ,100);
}
function showResultsFromHistory(){
 const raw=read('ccner-history',[]),h=window.CCNERProgressSettings?.filterHistory?.(raw)||raw,s=h.at(-1);
 if(!s){openOverlay('Progress','<p>No completed sessions are available for the selected period. Start today’s five-game workout and your progress will appear here.</p><p class="overlay-note">Open Progress settings to change the period.</p>');return}
 state.history=h;
 $('#overallScore')?.replaceChildren(document.createTextNode(Math.round(Number(s.score||0))+'%'));
 $('#overallAccuracy')?.replaceChildren(document.createTextNode(Math.round(Number(s.accuracy||0)*100)+'%'));
 $('#gamesCompleted')?.replaceChildren(document.createTextNode('5 / 5'));
 $('#avgTime')?.replaceChildren(document.createTextNode((Number(s.avgTime||0)).toFixed(1)+'s'));
 const rows=$('#resultRows');if(rows)rows.textContent='';
 (s.results||[]).forEach(r=>{const e=document.createElement('div');e.className='result-row';const left=document.createElement('div'),name=document.createElement('div'),detail=document.createElement('div'),score=document.createElement('span');name.className='result-name';name.textContent=r.game||r.name||'Game';detail.className='result-detail';detail.textContent=(r.correct?'Correct':'Needs practice')+' · '+(Number(r.seconds||0)).toFixed(1)+'s';score.className='score-pill';score.textContent=r.correct?'100%':'0%';left.append(name,detail);e.append(left,score);rows?.append(e)});
 const prev=h.at(-2);$('#trendBadge')?.replaceChildren(document.createTextNode(!prev?'First session':Number(s.score)>Number(prev.score)?'Improving ↑':Number(s.score)<Number(prev.score)?'Different day ↔':'Steady →'));const detail=window.CCNERProgressSettings?.read?.().detail||'simple';const rowsBox=$('#resultRows');if(rowsBox)rowsBox.hidden=detail!=='detailed';
 showView('#resultsView');
}
function openOverlay(title,body){
 const p=$('#overlayPanel'),c=$('#overlayContent');if(!p||!c)return;c.textContent='';
 const head=document.createElement('p');head.className='eyebrow';head.textContent='MIMO';const h=document.createElement('h3');h.textContent=title;c.append(head,h);
 const wrap=document.createElement('div');wrap.innerHTML=body;c.append(wrap);p.hidden=false;$('#closeOverlay')?.focus();
}
function closeOverlay(){const p=$('#overlayPanel');if(p)p.hidden=true}
function reminderStore(){const key='ccner-reminder-list';try{const v=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(v)&&v.length)return v}catch(_){}const seed=[{id:'med-morning',category:'Medicine',name:'Morning Medicine',time:'08:00',repeat:'daily',days:[],message:'It’s time for your morning medicine.'},{id:'water-1',category:'Water',name:'Drink Water',time:'10:00',repeat:'daily',days:[],message:'Time to drink some water.'},{id:'meal-breakfast',category:'Meal',name:'Breakfast',time:'08:30',repeat:'daily',days:[],message:'It’s breakfast time.'},{id:'activity-walk',category:'Activity',name:'Morning Walk',time:'07:00',repeat:'daily',days:[],message:'Time for your morning walk.'},{id:'mimo-practice',category:'Mimo Practice',name:'Mimo Practice',time:localStorage.getItem('ccner-mimo-practice-default')||'18:00',repeat:'daily',days:[],message:'It’s time for your Mimo practice.',useDefault:true}];localStorage.setItem(key,JSON.stringify(seed));return seed}function saveReminders(list){localStorage.setItem('ccner-reminder-list',JSON.stringify(Array.isArray(list)?list:[]));scheduleReminders();window.dispatchEvent(new CustomEvent('ccner:reminders-changed',{detail:{count:Array.isArray(list)?list.length:0}}));if(localStorage.getItem('ccner-reminders')!=='off')window.CCNERReminderNotifications?.enable?.().catch?.(()=>{})}function fmtTime(t){const [h,m]=String(t||'09:00').split(':').map(Number);return new Date(2000,0,1,h||0,m||0).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}function reminderDueToday(x){if(x.repeat==='once')return true;if(x.repeat==='daily')return true;const d=new Date().getDay();return (x.days||[]).includes(d)}function reminderSettingsPanel(){const list=reminderStore();openOverlay('Reminder Settings','');const c=$('#overlayContent');if(!c)return;c.replaceChildren();const ey=document.createElement('p');ey.className='eyebrow';ey.textContent='MIMO';const h=document.createElement('h3');h.textContent='Reminder Settings';c.append(ey,h);const general=document.createElement('div');general.className='mimo-reminder-settings';const enabled=document.createElement('div');enabled.className='mimo-reminder-setting-row';const enabledLabel=document.createElement('span');enabledLabel.textContent='🔔 Reminders';const enabledInput=document.createElement('input');enabledInput.type='checkbox';enabledInput.checked=localStorage.getItem('ccner-reminders')!=='off';enabledInput.setAttribute('aria-label','Reminders');enabledInput.onchange=()=>{localStorage.setItem('ccner-reminders',enabledInput.checked?'on':'off');scheduleReminders()};enabled.append(enabledLabel,enabledInput);general.append(enabled,settingSelect('🔊 Reminder Voice',[['on','ON'],['off','OFF']],localStorage.getItem('ccner-reminder-voice')||'on',v=>localStorage.setItem('ccner-reminder-voice',v)),settingSelect('🔔 Reminder Sound',[['0.45','Low'],['0.75','Medium'],['1','High']],localStorage.getItem('ccner-reminder-sound')||'0.75',v=>localStorage.setItem('ccner-reminder-sound',v)),settingSelect('🔁 Missed Reminder',[['none','Don’t repeat'],['10','After 10 minutes'],['30','After 30 minutes']],localStorage.getItem('ccner-missed-reminder')||'10',v=>localStorage.setItem('ccner-missed-reminder',v)));c.append(general);const title=document.createElement('h4');title.textContent='Your Reminders';c.append(title);const listBox=document.createElement('div');listBox.className='mimo-reminder-list';list.filter(reminderDueToday).forEach(x=>listBox.append(reminderCard(x)));c.append(listBox);const add=button('＋ Add Reminder',()=>reminderEditor());add.classList.add('primary');c.append(add)}function settingLine(label,value){const d=document.createElement('div');d.className='mimo-reminder-setting-row';const a=document.createElement('span');a.textContent=label;const b=document.createElement('strong');b.textContent=value;d.append(a,b);return d}function settingSelect(label,opts,value,fn){const d=document.createElement('div');d.className='mimo-reminder-setting-row';const a=document.createElement('span');a.textContent=label;const s=document.createElement('select');opts.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o)});s.value=value;s.onchange=()=>fn(s.value);d.append(a,s);return d}function reminderCard(x){const d=document.createElement('article');d.className='mimo-reminder-card';const info=document.createElement('div');const name=document.createElement('strong');name.textContent=x.name;const meta=document.createElement('span');meta.textContent=x.category+' · '+fmtTime(x.time)+' · '+(x.repeat==='daily'?'Every day':x.repeat==='once'?'Once':'Selected days');info.append(name,meta);const actions=document.createElement('div');actions.className='mimo-reminder-actions';actions.append(button('Edit',()=>reminderEditor(x.id)),button('Delete',()=>{if(confirm('Delete this reminder?')){saveReminders(reminderStore().filter(r=>r.id!==x.id));reminderSettingsPanel()}}));d.append(info,actions);return d}function reminderEditor(id){const existing=typeof id==='string'?reminderStore().find(x=>x.id===id):id;const x=existing||{id:'r-'+Date.now(),category:'Medicine',name:'',time:'09:00',repeat:'daily',days:[],message:'',useDefault:false};openOverlay(existing?'Edit Reminder':'Add Reminder','');const c=$('#overlayContent');c.replaceChildren();const ey=document.createElement('p');ey.className='eyebrow';ey.textContent='MIMO';const h=document.createElement('h3');h.textContent=existing?'Edit Reminder':'Add Reminder';c.append(ey,h);const form=document.createElement('div');form.className='mimo-reminder-form';const name=field('Reminder Name','text',x.name,'e.g. Morning Walk');const cat=field('Type','select',x.category);[['Medicine','💊 Medicine'],['Water','💧 Water'],['Meal','🍽️ Meal'],['Activity','🏃 Activity'],['Mimo Practice','🧠 Mimo Practice'],['Appointment','📅 Appointment'],['Other','🔔 Other']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;cat.append(o)});cat.value=x.category;const time=field('Time','time',x.time);const repeat=field('Repeat','select',x.repeat);[['once','Once'],['daily','Every day'],['days','Specific days']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;repeat.append(o)});repeat.value=x.repeat;const days=field('Days','text','');days.classList.add('mimo-days');days.placeholder='Example: Mon, Wed, Fri';days.value=(x.days||[]).map(d=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ');const msg=field('Reminder Message','textarea',x.message);msg.placeholder='What should Mimo remind you?';const defaultBox=document.createElement('label');defaultBox.className='mimo-check';const check=document.createElement('input');check.type='checkbox';check.checked=!!x.useDefault;const span=document.createElement('span');span.textContent='Use Mimo Practice default time';defaultBox.append(check,span);form.append(name,cat,time,repeat,days,msg,defaultBox);const hint=document.createElement('p');hint.className='overlay-note';hint.textContent='Choose a custom alarm time like a phone clock. You can edit the name and time later.';c.append(form,hint);const actions=document.createElement('div');actions.className='mimo-reminder-form-actions';actions.append(button('Cancel',reminderSettingsPanel));const save=button('Save Reminder',()=>{const reminderName=String(name.value||'').trim();if(!reminderName){name.focus();alert('Please enter a reminder name.');return}if(!time.value&&!check.checked){time.focus();alert('Please choose a reminder time.');return}const parsedDays=String(days.value||'').split(',').map(v=>['sun','sunday','0','mon','monday','1','tue','tuesday','2','wed','wednesday','3','thu','thursday','4','fri','friday','5','sat','saturday','6'].indexOf(v.trim().toLowerCase())%7).filter(v=>v>=0);if(repeat.value==='days'&&!parsedDays.length){days.focus();alert('Choose at least one day, for example Mon, Wed, Fri.');return}const item={...x,name:reminderName,category:cat.value,time:check.checked&&cat.value==='Mimo Practice'?(localStorage.getItem('ccner-mimo-practice-default')||'18:00'):time.value,repeat:repeat.value,days:parsedDays,message:String(msg.value).trim()||('Time for '+reminderName),useDefault:check.checked&&cat.value==='Mimo Practice'};const all=reminderStore().filter(r=>r.id!==item.id);all.push(item);saveReminders(all);reminderSettingsPanel()});save.classList.add('primary');actions.append(save);c.append(actions)}function field(label,type,value,placeholder=''){const w=document.createElement('label');w.className='mimo-reminder-field';const l=document.createElement('span');l.textContent=label;let e;if(type==='select'){e=document.createElement('select')}else if(type==='textarea'){e=document.createElement('textarea');e.rows=3}else{e=document.createElement('input');e.type=type}e.value=value||'';e.placeholder=placeholder;w.append(l,e);return e}let reminderTimers=[];function scheduleReminders(){reminderTimers.forEach(clearTimeout);reminderTimers=[];if(localStorage.getItem('ccner-reminders')==='off')return;const list=reminderStore();const now=new Date();list.forEach(x=>{if(!reminderDueToday(x))return;const [h,m]=String(x.time||'09:00').split(':').map(Number);let target=new Date();target.setHours(h||0,m||0,0,0);if(target<=now&&x.repeat==='daily')target.setDate(target.getDate()+1);if(target<=now)return;reminderTimers.push(setTimeout(()=>fireReminder(x),target-now))})}function fireReminder(x){const voice=localStorage.getItem('ccner-reminder-voice')!=='off';const vol=Number(localStorage.getItem('ccner-reminder-sound')||'.75');const text=x.message||('Time for '+x.name);if('Notification'in window&&Notification.permission==='granted')new Notification(x.name,{body:text});if(voice&&state.soundOn&&'speechSynthesis'in window){const u=new SpeechSynthesisUtterance(text);u.volume=Math.max(0,Math.min(1,vol));u.rate=Number(localStorage.getItem('ccner-speech-speed')||'.75');speechSynthesis.speak(u)}say(text,'happy','reminder');if(x.repeat==='daily')scheduleReminders()}function reminders(){const list=reminderStore();if(!list.length)reminderStore();openOverlay('Today’s Reminders','');const c=$('#overlayContent');c.replaceChildren();const ey=document.createElement('p');ey.className='eyebrow';ey.textContent='MIMO';const h=document.createElement('h3');h.textContent='Today’s Reminders';c.append(ey,h);const box=document.createElement('div');box.className='mimo-reminder-list';const today=list.filter(reminderDueToday);if(!today.length){const p=document.createElement('p');p.className='overlay-note';p.textContent='No reminders scheduled. Add one to create a custom alarm.';box.append(p)}else today.sort((a,b)=>a.time.localeCompare(b.time)).forEach(x=>box.append(reminderCard(x)));c.append(box);const settingsBtn=button('⚙️ Reminder Settings',reminderSettingsPanel);const add=button('＋ Add Reminder',()=>reminderEditor());add.classList.add('primary');c.append(settingsBtn,add)}
function settings(){
 openOverlay('Settings','<div class="setting-row"><span>🔊 Mimo voice</span><button class="action-button" id="overlaySound" type="button">Toggle</button></div><div class="setting-row"><span>🎙️ Voice mode</span><strong>Continuous</strong></div><div class="setting-row"><span>🌐 Language</span><strong>English (India)</strong></div>');
 $('#overlaySound')?.addEventListener('click',()=>{$('#soundToggle')?.click();closeOverlay()},{once:true});
}
window.CCNERUI={home:()=>showView('#homeView'),progress:showResultsFromHistory,reminders,reminderSettings:reminderSettingsPanel,settings,closeOverlay};
window.CCNERGameShell={showView,setStatus,setMood,say,openOverlay,closeOverlay};
window.CCNERCompanion=window.CognitiveCareCompanion={onGameEvent:e=>say(e?.type==='correct'?pick(['Yes!','Lovely!','You got it!']):'That’s okay. Let’s keep going.',e?.type==='correct'?'celebrate':'encourage',e?.type==='correct'?'proud':'encouraging')};
window.startSession=startSession;window.respond=respond;window.armVoice=armVoice;window.queueListening=queueListening;window.stopListening=stopListening;window.showView=showView;window.setStatus=setStatus;window.setMood=setMood;window.say=say;window.showResultsFromHistory=showResultsFromHistory;window.openPanel=(name)=>({reminders,settings,progress:showResultsFromHistory}[name]||(()=>{}))();
function bind(){
 $('#soundToggle')?.addEventListener('click',()=>{state.soundOn=!state.soundOn;localStorage.setItem('ccner-mimo-voice',state.soundOn?'on':'off');$('#soundToggle').textContent=state.soundOn?'🔊':'🔇';if(!state.soundOn)stopListening(false)});
 $('#homeButton')?.addEventListener('click',()=>showView('#homeView'));
 $('#topMenuButton')?.addEventListener('click',()=>window.CCNERNavigation?.open?.());
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
   else if(n==='mino')window.CCNERNavigation?.mino?.()||window.CCNERLevel3?.openMino?.();
   else if(n==='settings')window.CCNERNavigation?.open?.()||settings();
 }));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlay()});
 $('#soundToggle')?.replaceChildren(document.createTextNode(state.soundOn?'🔊':'🔇'));setMood('happy','happy');setStatus('Ready to play');updateNav('homeView');
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{bind();scheduleReminders()},{once:true}):(()=>{bind();scheduleReminders()})();
})();