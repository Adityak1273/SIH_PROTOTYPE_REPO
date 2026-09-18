/* Cognitive Care NER — simple, elderly-friendly game settings. */
(()=>{'use strict';
if(window.__CCNER_GAME_SETTINGS__)return;window.__CCNER_GAME_SETTINGS__=true;
const KEY='ccner-game-settings';
const defaults={difficulty:'adaptive',gameTime:10,sound:true,voice:true,textSize:'normal',easyMode:false,pause:true,hints:true,encouragement:'normal',quiet:false};
const $=s=>document.querySelector(s);
function read(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){return {...defaults}}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v));apply(v);window.dispatchEvent(new CustomEvent('ccner:game-settings-change',{detail:v}))}
function apply(v=read()){
 document.body.classList.toggle('ccner-game-text-large',v.textSize==='large');
 document.body.classList.toggle('ccner-game-text-xl',v.textSize==='extra');
 document.body.classList.toggle('ccner-easy-mode',!!v.easyMode);
 document.body.classList.toggle('ccner-quiet-mode',!!v.quiet);document.body.classList.toggle('ccner-mino-voice-off',!v.voice);const soundButton=document.querySelector('#soundToggle');if(soundButton){soundButton.textContent=v.voice?'🔊':'🔇';soundButton.setAttribute('aria-pressed',v.voice?'true':'false')}
 window.CCNER_GAME_SETTINGS=v;
 if(window.state&&typeof window.state==='object')window.state.soundOn=!!v.voice;
 if(v.voice===false&&window.CCNERMinoLive?.isRunning?.())window.CCNERMinoLive.stop();
}
function option(label,value,current,field){const b=document.createElement('button');b.type='button';b.className='ccner-gs-option'+(value===current?' selected':'');b.textContent=label;b.onclick=()=>{const v=read();v[field]=value;save(v);render()};return b}
function switchRow(label,help,field){const card=document.createElement('div');card.className='ccner-gs-card';const wrap=document.createElement('label');wrap.className='ccner-gs-switch';const text=document.createElement('div');text.innerHTML='<div class="ccner-gs-title">'+label+'</div><div class="ccner-gs-help">'+help+'</div>';const input=document.createElement('input');input.type='checkbox';input.checked=!!read()[field];input.setAttribute('aria-label',label);input.onchange=()=>{const v=read();v[field]=input.checked;save(v);render()};wrap.append(text,input);card.append(wrap);return card}
function card(title,help,controls){const c=document.createElement('div');c.className='ccner-gs-card';const h=document.createElement('div');h.className='ccner-gs-title';h.textContent=title;const p=document.createElement('div');p.className='ccner-gs-help';p.textContent=help;const x=document.createElement('div');x.className='ccner-gs-control';controls.forEach(i=>x.append(i));c.append(h,p,x);return c}
function render(){
 const box=$('#ccnerGameSettingsRoot');if(!box)return;box.replaceChildren();const v=read();
 box.append(
  card('🎯 Difficulty','Choose how challenging the games should feel.',[
   option('Easy','easy',v.difficulty,'difficulty'),option('Normal','normal',v.difficulty,'difficulty'),option('Adaptive','adaptive',v.difficulty,'difficulty')
  ]),
  card('⏱️ Game Time','Sets the time for timed attention practice.',[
   option('5 min',5,v.gameTime,'gameTime'),option('10 min',10,v.gameTime,'gameTime'),option('15 min',15,v.gameTime,'gameTime')
  ]),
  switchRow('🔊 Sound','Game sounds and feedback sounds.', 'sound'),
  switchRow('🐶 Mino Voice','Mino voice and spoken guidance.', 'voice'),
  card('🔤 Text & Button Size','Make game instructions easier to read and tap.',[
   option('Normal','normal',v.textSize,'textSize'),option('Large','large',v.textSize,'textSize'),option('Extra Large','extra',v.textSize,'textSize')
  ]),
  switchRow('♿ Easy Mode','Larger controls and a simpler game presentation.', 'easyMode'),
  switchRow('⏸️ Pause Game','Allow a Pause button during games.', 'pause'),
  switchRow('💡 Hints','Allow a gentle hint when you need help.', 'hints'),
  card('👏 Encouragement','Choose how often Mino gives encouragement.',[
   option('More','more',v.encouragement,'encouragement'),option('Normal','normal',v.encouragement,'encouragement'),option('Less','less',v.encouragement,'encouragement')
  ]),
  switchRow('🌙 Quiet Mode','Reduce animations and extra visual distractions.', 'quiet')
 );
 const note=document.createElement('div');note.className='ccner-gs-note';note.textContent='Settings are saved on this device and take effect immediately. You can change them anytime.';box.append(note);
 const actions=document.createElement('div');actions.className='ccner-gs-actions';
 const reset=document.createElement('button');reset.type='button';reset.className='action-button ccner-gs-reset';reset.textContent='Reset to simple defaults';reset.onclick=()=>{save({...defaults});render();toast('Settings reset.')};
 const close=document.createElement('button');close.type='button';close.className='action-button primary ccner-gs-save';close.textContent='Save & Close';close.onclick=()=>{apply();window.CCNERUI?.closeOverlay?.()};actions.append(reset,close);box.append(actions)
}
function toast(t){const x=document.createElement('div');x.className='ccner-gs-toast';x.textContent=t;document.body.append(x);setTimeout(()=>x.remove(),1800)}
function open(){window.CCNERUI?.overlay?.('Game settings',c=>{const root=document.createElement('div');root.id='ccnerGameSettingsRoot';root.className='ccner-game-settings';c.append(root);render()})||fallback()}
function fallback(){const panel=$('#overlayPanel'),content=$('#overlayContent');if(!panel||!content)return;content.replaceChildren();const h=document.createElement('h3');h.textContent='Game settings';const root=document.createElement('div');root.id='ccnerGameSettingsRoot';root.className='ccner-game-settings';content.append(h,root);panel.hidden=false;render()}
window.CCNERGameSettings={open,read,save,apply,defaults:{...defaults}};
apply();
})();