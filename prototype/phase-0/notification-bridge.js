/* Native background reminder delivery for Capacitor Android, with web fallback. */
(function(){
  'use strict';
  const KEY='ccner-p1-reminders';const CHANNEL_ID='ccner-reminders';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(_){return[]}};const save=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const native=()=>window.Capacitor?.Plugins?.LocalNotifications||null;
  const stableId=s=>{let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return Math.abs(h>>>0)%2147483000+1};
  const kindText=r=>({medicine:'It is time for your medicine reminder.',hydration:'Time for a little water.',appointment:'You have an appointment reminder.',daily_activity:'Time for your planned daily activity.',general:'It is time for your reminder.'}[r.kind||'general']);
  async function ensurePermission(){const p=native();if(p){try{const status=await p.checkPermissions();if(status.display!=='granted'){const requested=await p.requestPermissions();if(requested.display!=='granted')return false}await p.createChannel?.({id:CHANNEL_ID,name:'Cognitive Care reminders',description:'Medicine, hydration and daily activity reminders',importance:5,sound:'default',vibration:true,lights:true});return true}catch(_){return false}}if('Notification'in window){if(Notification.permission==='granted')return true;if(Notification.permission==='denied')return false;return(await Notification.requestPermission())==='granted'}return false}
  function timeParts(time){const m=String(time||'').match(/^(\d{2}):(\d{2})$/);return m?{hour:Number(m[1]),minute:Number(m[2])}:null}
  function nextDate(time){const now=new Date();const p=timeParts(time);if(!p)return null;const d=new Date(now);d.setHours(p.hour,p.minute,0,0);if(d<=now)d.setDate(d.getDate()+1);return d}
  async function scheduleOne(r){const p=native();if(!p||r.enabled===false||r.active===false)return false;const parts=timeParts(r.time||r.reminder_time);if(!parts)return false;const repeat=(r.repeat||r.repeat_rule)==='daily';const at=nextDate(r.time||r.reminder_time);const id=stableId(r.id||r.client_id||r.title);try{await p.cancel({notifications:[{id}]});const schedule=repeat?{on:{hour:parts.hour,minute:parts.minute},allowWhileIdle:true}:{at,allowWhileIdle:true};await p.schedule({notifications:[{id,title:r.title||'Reminder',body:kindText(r),channelId:CHANNEL_ID,schedule,autoCancel:true,extra:{reminderId:r.id||null,kind:r.kind||'general'}}]});return true}catch(_){return false}}
  async function cancelOne(r){const p=native();if(!p)return false;try{await p.cancel({notifications:[{id:stableId(r.id||r.client_id||r.title)}]});return true}catch(_){return false}}
  async function syncAll(){const p=native();if(!p)return false;const ok=await ensurePermission();if(!ok)return false;const rows=read();const wanted=new Set(rows.filter(r=>r.enabled!==false&&r.active!==false).map(r=>stableId(r.id||r.client_id||r.title)));try{const pending=await p.getPending?.();const stale=(pending?.notifications||[]).filter(n=>!wanted.has(Number(n.id)));if(stale.length)await p.cancel({notifications:stale.map(n=>({id:Number(n.id)}))})}catch(_){}for(const r of rows){if(r.enabled===false||r.active===false)await cancelOne(r);else await scheduleOne(r)}return true}
  async function request(){const ok=await ensurePermission();if(ok)await syncAll();return ok}
  async function upsert(r){const rows=read();const i=rows.findIndex(x=>x.id===r.id);if(i>=0)rows[i]=r;else rows.push(r);save(rows);if(native())return scheduleOne(r);return true}
  async function remove(id){const rows=read();const r=rows.find(x=>x.id===id);if(r)await cancelOne(r);save(rows.filter(x=>x.id!==id));return true}
  window.CCNERNotifications={ensurePermission,syncAll,request,upsert,remove,isNative:()=>!!native()};
  window.addEventListener('online',()=>syncAll());document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncAll()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(syncAll,800));else setTimeout(syncAll,800);
})();
