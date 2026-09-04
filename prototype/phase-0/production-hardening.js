/* Production hardening: caregiver alerts, typed reminders, durable offline sync, caregiver patient view. */
(function(){
  'use strict';
  const C=window.CCNER_CONFIG||{};
  const LOCAL_QUEUE='ccner-p1-sync';
  const LOCAL_REMINDERS='ccner-p1-reminders';
  let sb=null,user=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch(_){return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const keyFor=(prefix,value)=>prefix+'-'+btoa(unescape(encodeURIComponent(String(value)))).replace(/[^a-zA-Z0-9]/g,'').slice(0,42);

  function classify(title){
    const t=String(title||'').toLowerCase();
    if(/medicine|medication|tablet|pill|dose/.test(t))return'medicine';
    if(/water|hydration|drink/.test(t))return'hydration';
    if(/appointment|doctor|hospital|clinic|medical/.test(t))return'appointment';
    if(/walk|bath|breakfast|tea|exercise|routine|activity|task/.test(t))return'daily_activity';
    return'general';
  }
  function reminderRows(){return Array.isArray(read(LOCAL_REMINDERS,[]))?read(LOCAL_REMINDERS,[]):[]}
  function saveReminder(r){const a=reminderRows();const i=a.findIndex(x=>x.id===r.id);if(i>=0)a[i]=r;else a.push(r);write(LOCAL_REMINDERS,a);return r}

  function injectStyle(){if(document.getElementById('hardeningStyle'))return;const s=document.createElement('style');s.id='hardeningStyle';s.textContent=`.ph-card{background:#fff;border:1px solid #eadfd6;border-radius:18px;padding:15px;margin:10px 0}.ph-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #eee4db}.ph-row:last-child{border-bottom:0}.ph-badge{display:inline-flex;padding:5px 9px;border-radius:999px;background:#f0e7ff;font-size:.72rem;font-weight:800}.ph-alert{padding:12px 14px;border-radius:14px;background:#fff3e8;border:1px solid #f0d1b5;margin:8px 0}.ph-alert.critical{background:#fff0f0;border-color:#efb7b7}.ph-alert button{margin-left:8px}.ph-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ph-btn{border:0;border-radius:12px;padding:10px 13px;background:#4f3a2d;color:#fff;font-weight:800;cursor:pointer}.ph-btn.secondary{background:#fff;color:#4f3a2d;border:1px solid #d8cabe}.ph-select{width:100%;padding:11px;border:1px solid #d8cabe;border-radius:12px;background:#fff;font:inherit}.ph-notice{position:fixed;left:16px;right:16px;bottom:86px;z-index:10001;background:#fffaf5;border:2px solid #d9794f;border-radius:18px;padding:15px;box-shadow:0 20px 60px rgba(30,20,10,.2);display:none}.ph-notice.show{display:block}`;document.head.appendChild(s)}

  async function connect(){
    if(!C.SUPABASE_URL||!C.SUPABASE_ANON_KEY)return;
    try{const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');sb=mod.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);const r=await sb.auth.getSession();user=r.data?.session?.user||null;sb.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;if(user)syncAll()});if(user)await syncAll()}catch(_){sb=null}
  }

  async function syncAll(){
    if(!sb||!user||navigator.onLine===false)return false;
    const history=read('ccner-history',[]);let ok=true;
    for(let i=0;i<history.length;i++){
      const s=history[i],clientKey=keyFor('session',user.id+'|'+(s.date||'')+'|'+i+'|'+JSON.stringify((s.results||[]).map(r=>r.name)));
      try{
        const existing=await sb.from('cognitive_sessions').select('id').eq('user_id',user.id).contains('metadata',{client_session_key:clientKey}).limit(1);
        if(existing.error)throw existing.error;
        let session=existing.data?.[0];
        if(!session){const ins=await sb.from('cognitive_sessions').insert({user_id:user.id,started_at:s.date,completed_at:s.date,score:Number(s.score||0),accuracy:Number(s.accuracy||0),average_response_seconds:Number(s.avgTime||0),difficulty_level:Number(s.level||1),games_completed:(s.results||[]).filter(r=>!r.skipped).length,metadata:{device:localStorage.getItem('ccner-p2-device')||'unknown',source:'production-hardening',client_session_key:clientKey}}).select('id').single();if(ins.error)throw ins.error;session=ins.data}
        const results=(s.results||[]).filter(r=>!r.skipped).map((r,j)=>({session_id:session.id,user_id:user.id,game_id:keyFor('game',clientKey+'|'+j+'|'+r.name),game_name:r.name||'Game',category:r.category||r.name||'Game',correct:Number(r.correct||0)>0,score:Number(r.score||0),response_seconds:Number(r.seconds||0),difficulty_level:Number(r.difficulty||s.level||1)}));
        for(const r of results){const ex=await sb.from('game_results').select('id').eq('user_id',user.id).eq('game_id',r.game_id).limit(1);if(ex.error)throw ex.error;if(!ex.data?.length){const ins=await sb.from('game_results').insert(r);if(ins.error)throw ins.error}}
      }catch(_){ok=false}
    }
    await flushQueue();
    if(ok)localStorage.setItem('ccner-p2-session-sync',new Date().toISOString());
    return ok;
  }

  async function queueEntity(entityType,operation,payload){
    const q=read(LOCAL_QUEUE,[]);const id=keyFor('event',user?.id||'device')+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);q.push({id,type:entityType,operation,payload,createdAt:new Date().toISOString(),status:'pending'});write(LOCAL_QUEUE,q.slice(-300));if(user&&navigator.onLine!==false)await flushQueue();
  }
  async function flushQueue(){
    if(!sb||!user||navigator.onLine===false)return;
    const q=read(LOCAL_QUEUE,[]);let changed=false;
    for(const item of q){if(item.status==='synced')continue;try{const {error}=await sb.from('sync_queue').upsert({user_id:user.id,client_event_id:item.id,entity_type:item.type,operation:item.operation,payload:item.payload,client_created_at:item.createdAt},{onConflict:'user_id,client_event_id'});if(error)throw error;item.status='synced';item.syncedAt=new Date().toISOString();changed=true}catch(_){item.attempts=(item.attempts||0)+1}}
    if(changed)write(LOCAL_QUEUE,q.slice(-300));
  }
  window.addEventListener('online',()=>{flushQueue();syncAll()});

  async function requestNotifications(){if(!('Notification'in window))return false;if(Notification.permission==='granted')return true;if(Notification.permission==='denied')return false;return (await Notification.requestPermission())==='granted'}
  function notice(title,message,kind){let n=document.getElementById('phNotice');if(!n){n=document.createElement('div');n.id='phNotice';n.className='ph-notice';document.body.appendChild(n)}n.classList.add('show');n.innerHTML='<strong>'+esc(title)+'</strong><p style="margin:6px 0 0">'+esc(message)+'</p>';setTimeout(()=>n.classList.remove('show'),12000);if('Notification'in window&&Notification.permission==='granted'){try{new Notification(title,{body:message,tag:'ccner-'+kind})}catch(_){} }}
  function reminderDue(r,now){if(!r||r.enabled===false)return false;const time=String(r.time||r.reminder_time||'');if(!/^\\d{2}:\\d{2}$/.test(time))return false;const hh=Number(time.slice(0,2)),mm=Number(time.slice(3));return now.getHours()===hh&&now.getMinutes()===mm&&(r.lastNotifiedDate!==now.toISOString().slice(0,10));}
  async function checkReminders(){const now=new Date();for(const r of reminderRows()){if(!reminderDue(r,now))continue;r.lastNotifiedDate=now.toISOString().slice(0,10);saveReminder(r);const kind=r.kind||classify(r.title);const msg=kind==='medicine'?'It is time for the medicine reminder.':kind==='hydration'?'Time for a little water.':kind==='appointment'?'You have a medical appointment reminder.':'Time for your planned daily activity.';notice(r.title,msg,kind);await queueEntity('reminder_trigger','insert',{reminderId:r.id,kind,title:r.title,triggeredAt:now.toISOString()})}}
  setInterval(checkReminders,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminders()});

  function normalizeReminderTypes(){const a=reminderRows().map(r=>({...r,kind:r.kind||classify(r.title),enabled:r.enabled!==false}));write(LOCAL_REMINDERS,a);return a}
  function patchReminderForm(){const form=document.getElementById('p1ReminderForm');if(!form||form.dataset.hardened)return;form.dataset.hardened='1';const wrap=document.createElement('label');wrap.textContent='Type';wrap.innerHTML='<span style="display:block;margin-bottom:4px">Type</span><select name="kind" class="ph-select"><option value="medicine">💊 Medicine</option><option value="hydration">💧 Hydration</option><option value="daily_activity">📅 Daily activity</option><option value="appointment">🏥 Medical appointment</option><option value="general">General</option></select>';form.insertBefore(wrap,form.querySelector('.p1-actions'));form.addEventListener('submit',()=>{setTimeout(()=>{const a=normalizeReminderTypes();const r=a[a.length-1];if(r){const kind=form.kind?.value||classify(r.title);r.kind=kind;r.enabled=true;saveReminder(r);queueEntity('reminder','upsert',{...r,kind})}},0)})}

  async function caregiverAlerts(){if(!sb||!user||navigator.onLine===false)return[];const {data,error}=await sb.from('caregiver_alerts').select('id,patient_id,caregiver_id,type,severity,title,message,acknowledged_at,created_at').or('caregiver_id.eq.'+user.id+',patient_id.eq.'+user.id).is('acknowledged_at',null).order('created_at',{ascending:false}).limit(50);return error?[]:(data||[])}
  async function createAlertsFromLocal(){if(!sb||!user||navigator.onLine===false)return;const h=read('ccner-history',[]);const last=h.at(-1);if(!last)return;const previous=h.at(-2);const flags=[];if(!previous&&h.length===1)flags.push(['new_session','info','First training session','A first training session has been recorded.']);if(previous&&Number(last.score||0)-Number(previous.score||0)<=-10)flags.push(['performance_change','watch','Recent performance change','The latest training score is 10 or more points lower than the previous session. Review the full pattern before drawing conclusions.']);if(!navigator.onLine)flags.push(['offline','info','Device offline','The participant device is offline and local changes will sync when connectivity returns.']);const links=await sb.from('caregiver_links').select('caregiver_user_id').eq('patient_user_id',user.id).eq('status','active');if(links.error||!links.data?.length)return;for(const [type,severity,title,message] of flags){for(const l of links.data){const {data:existing}=await sb.from('caregiver_alerts').select('id').eq('patient_id',user.id).eq('caregiver_id',l.caregiver_user_id).eq('type',type).is('acknowledged_at',null).limit(1);if(!existing?.length)await sb.from('caregiver_alerts').insert({patient_id:user.id,caregiver_id:l.caregiver_user_id,type,severity,title,message,source_session_id:null})}}}

  async function openCaregiverPortal(){if(!sb||!user){alert('Please sign in first.');return}const links=await sb.from('caregiver_links').select('patient_user_id,status,role').eq('caregiver_user_id',user.id).eq('status','active');if(links.error){alert('Caregiver access could not be loaded.');return}const ids=(links.data||[]).map(x=>x.patient_user_id);let profiles=[];if(ids.length){const r=await sb.from('profiles').select('user_id,display_name,preferred_language').in('user_id',ids);profiles=r.data||[]}const alerts=await caregiverAlerts();const panel=document.createElement('section');panel.className='p2-panel';panel.innerHTML='<div class="p2-sheet"><button class="p2-close" aria-label="Close">×</button><div class="p2-dashboard-head"><div><span class="p2-eyebrow">SECURE CAREGIVER ACCESS</span><h2>My linked patients</h2><p class="p2-sub">Only active caregiver links are shown.</p></div></div><div class="ph-card"><strong>Patients</strong>'+(profiles.length?profiles.map(p=>'<div class="ph-row"><div><strong>'+esc(p.display_name||'Participant')+'</strong><small>Language: '+esc(p.preferred_language||'—')+'</small></div><span class="ph-badge">Active link</span></div>').join(''):'<p class="p2-muted">No active patient links.</p>')+'</div><div class="ph-card"><strong>Open alerts</strong>'+(alerts.length?alerts.map(a=>'<div class="ph-alert '+esc(a.severity)+'"><strong>'+esc(a.title)+'</strong><p>'+esc(a.message)+'</p><small>'+new Date(a.created_at).toLocaleString()+'</small><div class="ph-actions"><button class="ph-btn secondary" data-ack="'+a.id+'">Acknowledge</button></div></div>').join(''):'<p class="p2-muted">No open caregiver alerts.</p>')+'</div></div>';document.body.appendChild(panel);panel.querySelector('.p2-close').onclick=()=>panel.remove();panel.querySelectorAll('[data-ack]').forEach(b=>b.onclick=async()=>{const id=b.dataset.ack;const r=await sb.from('caregiver_alerts').update({acknowledged_at:new Date().toISOString()}).eq('id',id).eq('caregiver_id',user.id);if(!r.error)b.closest('.ph-alert')?.remove()})}

  function addCaregiverButton(){const home=document.getElementById('homeView');if(!home||document.getElementById('phCaregiverButton'))return;const b=document.createElement('button');b.id='phCaregiverButton';b.className='p2-btn p2-dashboard-launch';b.textContent='👩‍⚕️ Caregiver secure portal';b.onclick=openCaregiverPortal;home.querySelector('.p2-dashboard-launch')?.insertAdjacentElement('afterend',b)||home.appendChild(b)}
  function boot(){injectStyle();normalizeReminderTypes();patchReminderForm();addCaregiverButton();connect();setTimeout(patchReminderForm,1000)}
  setInterval(patchReminderForm,1000);
  window.CCNERProductionHardening={syncAll,requestNotifications,checkReminders,openCaregiverPortal};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
