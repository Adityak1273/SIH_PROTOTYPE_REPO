/* Sound & Accessibility — global patient-friendly controls. */
(()=>{'use strict';
if(window.__CCNER_SOUND_ACCESSIBILITY__)return;window.__CCNER_SOUND_ACCESSIBILITY__=true;
const KEY={volume:'ccner-global-volume',notification:'ccner-notification-sound',buttons:'ccner-button-sounds',textSize:'ccner-text-size',buttonSize:'ccner-button-size',contrast:'ccner-high-contrast',voice:'ccner-voice-guidance',speed:'ccner-global-speech-speed',confirm:'ccner-confirm-actions'};
const defaults={volume:'high',notification:'on',buttons:'on',textSize:'large',buttonSize:'large',contrast:'off',voice:'on',speed:'slow',confirm:'on'};
const get=(k,d)=>localStorage.getItem(KEY[k])??d,set=(k,v)=>localStorage.setItem(KEY[k],String(v));
const prefs=()=>Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,get(k,v)]));
function apply(){
 const p=prefs(),root=document.documentElement;
 root.classList.toggle('ccner-access-large-text',p.textSize!=='normal');
 root.classList.toggle('ccner-access-xl-text',p.textSize==='extra');
 root.classList.toggle('ccner-access-large-buttons',p.buttonSize==='large');
 root.classList.toggle('ccner-high-contrast',p.contrast==='on');
 if(window.state)window.state.soundOn=p.voice==='on'&&localStorage.getItem('ccner-mimo-voice')!=='off';
}
function select(value,options,onchange){const s=document.createElement('select');options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o)});s.value=value;s.onchange=()=>{onchange?.(s.value);apply()};return s}
function toggle(value,onchange){const b=document.createElement('button');b.type='button';b.className='mimo-toggle';const render=()=>{b.textContent=value==='on'?'ON':'OFF';b.setAttribute('aria-pressed',value==='on')};b.onclick=()=>{value=value==='on'?'off':'on';onchange?.(value);render();apply()};render();return b}
function row(label,control){const r=document.createElement('div');r.className='mimo-setting-row';const l=document.createElement('div');l.className='mimo-setting-label';l.textContent=label;r.append(l,control);return r}
function playNotification(){const p=prefs();if(p.notification!=='on')return;try{const ctx=new(window.AudioContext||window.webkitAudioContext)(),gain=ctx.createGain(),osc=ctx.createOscillator();gain.gain.value={low:.05,medium:.1,high:.16}[p.volume]||.1;osc.frequency.value=880;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.12);osc.onended=()=>ctx.close()}catch(_){}}
function shouldConfirm(action){return prefs().confirm==='on'&&/delete|remove|revoke|signout|sign out|disconnect/i.test(String(action||''))}
function open(){
 const panel=document.querySelector('#overlayPanel'),content=document.querySelector('#overlayContent');if(!panel||!content)return;
 content.replaceChildren();const ey=document.createElement('p');ey.className='eyebrow';ey.textContent='ACCESSIBILITY';const h=document.createElement('h3');h.textContent='Sound & Accessibility';content.append(ey,h);
 const p=prefs(),box=document.createElement('div');box.className='mimo-settings';
 const add=(label,key,opts)=>box.append(row(label,select(p[key],opts,v=>{localStorage.setItem(KEY[key],String(v))})));
 add('🔊 Master Volume','volume',[['low','Low'],['medium','Medium'],['high','High']]);
 box.append(row('🔔 Notification Sound',toggle(p.notification,v=>localStorage.setItem(KEY.notification,v))));
 box.append(row('🔘 Button Sounds',toggle(p.buttons,v=>localStorage.setItem(KEY.buttons,v))));
 add('👓 Text Size','textSize',[['normal','Normal'],['large','Large'],['extra','Extra Large']]);
 add('Button Size','buttonSize',[['normal','Normal'],['large','Large']]);
 box.append(row('High Contrast',toggle(p.contrast,v=>localStorage.setItem(KEY.contrast,v))));
 box.append(row('🗣️ Voice Guidance',toggle(p.voice,v=>{localStorage.setItem(KEY.voice,v);localStorage.setItem('ccner-mimo-voice',v==='on'?'on':'off')})));
 add('Speech Speed','speed',[['slow','Slow'],['normal','Normal'],['fast','Fast']]);
 box.append(row('✋ Confirm Important Actions',toggle(p.confirm,v=>localStorage.setItem(KEY.confirm,v))));
 const note=document.createElement('p');note.className='overlay-note';note.textContent='These controls apply across the app. Mimo Settings can still customize Mimo-specific conversation preferences.';
 const save=document.createElement('button');save.type='button';save.className='action-button primary mimo-save';save.textContent='Save';save.onclick=()=>{apply();panel.hidden=true};
 content.append(box,note,save);panel.hidden=false;document.querySelector('#closeOverlay')?.focus();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const label=(b.dataset.drawerAction||b.textContent||'').trim();if(shouldConfirm(label)&&!window.__CCNER_CONFIRMING__){e.preventDefault();e.stopImmediatePropagation();window.__CCNER_CONFIRMING__=true;const ok=window.confirm('Are you sure you want to continue?');window.__CCNER_CONFIRMING__=false;if(!ok)return;b.click();return}if(prefs().buttons==='on'&&!b.classList.contains('close-button'))playNotification()},{capture:true});
window.CCNERSoundAccessibility={open,apply,prefs,playNotification,shouldConfirm,keys:KEY};apply();
})();