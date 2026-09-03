/* Cognitive Care NER — Phase 2
 * Online account + cloud sync layer with graceful offline fallback.
 * Clinical safety rule: product scores are training performance, never diagnosis.
 */
(() => {
  'use strict';
  const C = window.CCNER_CONFIG || {};
  const KEY = {device:'ccner-p2-device',sessionSync:'ccner-p2-session-sync',profile:'ccner-p2-profile'};
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => {let id=localStorage.getItem(KEY.device);if(!id){id='device-'+crypto.randomUUID();localStorage.setItem(KEY.device,id)}return id};
  let supabase=null, user=null;
  const localHistory=()=>{try{return JSON.parse(localStorage.getItem('ccner-history')||'[]')}catch(_){return[]}};
  const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;

  function inject(){
    if($('.p2-account')) return;
    const home=$('#homeView'); if(!home)return;
    const status=document.createElement('div');status.className='p2-status';status.id='p2Status';status.innerHTML='<span class="p2-dot"></span><span>Offline-ready · this device saves your progress</span>';
    const account=document.createElement('section');account.className='p2-account';account.innerHTML='<div class="p2-account-row"><div><strong id="p2AccountTitle">Cloud account</strong><small id="p2AccountSub">Optional sign-in keeps progress available across devices.</small></div><button class="p2-btn" id="p2AccountBtn" type="button">Sign in</button></div>';
    const anchor=home.querySelector('.voice-banner');if(anchor)anchor.insertAdjacentElement('beforebegin',status);home.querySelector('.quick-actions')?.insertAdjacentElement('afterend',account);
    const panel=document.createElement('section');panel.className='p2-panel';panel.id='p2Panel';panel.hidden=true;panel.innerHTML='<div class="p2-sheet"><button class="p2-close" id="p2Close" type="button">×</button><div id="p2SheetContent"></div></div>';document.body.appendChild(panel);
    $('#p2Close').onclick=()=>panel.hidden=true;$('#p2AccountBtn').onclick=showAccount;
    window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
    updateStatus();
  }
  function updateStatus(){const el=$('#p2Status');if(!el)return;const online=navigator.onLine!==false;el.className='p2-status'+(online?'':' offline');el.innerHTML='<span class="p2-dot"></span><span>'+(online?'Online-ready · local progress is available here too':'Offline · progress will stay on this device until connected')+'</span>'}
  function showAccount(){
    const panel=$('#p2Panel'),box=$('#p2SheetContent');if(!panel||!box)return;panel.hidden=false;
    if(user){box.innerHTML='<h2>Your account</h2><p class="p2-sub">'+esc(user.email||'Signed-in account')+'</p><div class="p2-nav"><button class="p2-btn" id="p2Sync">Sync now</button><button class="p2-btn secondary" id="p2SignOut">Sign out</button></div><p class="p2-note">Your game performance remains training data. It is not a dementia diagnosis.</p>';$('#p2Sync').onclick=syncAll;$('#p2SignOut').onclick=async()=>{await supabase?.auth.signOut();user=null;updateAccount()};return}
    box.innerHTML='<h2>Secure sign-in</h2><p class="p2-sub">Use an email magic link. If cloud authentication is not configured yet, the app continues working offline on this device.</p><form class="p2-form" id="p2Login"><input id="p2Email" type="email" required placeholder="your@email.com" autocomplete="email"/><button class="p2-btn" type="submit">Send magic link</button></form><p id="p2LoginMsg" class="p2-muted"></p>';
    $('#p2Login').onsubmit=async e=>{e.preventDefault();const email=$('#p2Email').value.trim();const msg=$('#p2LoginMsg');try{if(!supabase)throw Error('Cloud authentication is unavailable');const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;msg.textContent='Magic link sent. Check your email, then return here.'}catch(err){msg.textContent=err.message||'Sign-in is not available yet; local mode remains active.'}};
  }
  function updateAccount(){const title=$('#p2AccountTitle'),sub=$('#p2AccountSub'),btn=$('#p2AccountBtn');if(!title)return;if(user){title.textContent='Cloud account connected';sub.textContent=user.email||'Signed in';btn.textContent='Account'}else{title.textContent='Cloud account';sub.textContent='Optional sign-in keeps progress available across devices.';btn.textContent='Sign in'}}

  function reportData(){const h=localHistory();const recent=h.slice(-7),month=h.slice(-30);const scores=recent.map(x=>Number(x.score||0));const games={};h.forEach(s=>(s.results||[]).forEach(r=>{const k=r.name||'Game';const g=games[k]||={name:k,plays:0,correct:0,time:[]};g.plays++;g.correct+=Number(r.correct||0);g.time.push(Number(r.seconds||0))}));return {h,recent,month,scores,games:Object.values(games).map(g=>({...g,accuracy:g.plays?Math.round(g.correct/g.plays*100):0,avgTime:avg(g.time)}))}}
  function showDashboard(){
    const d=reportData(),last=d.h.at(-1),prev=d.h.at(-2);const panel=$('#p2Panel'),box=$('#p2SheetContent');if(!panel||!box)return;panel.hidden=false;
    box.innerHTML='<h2>Caregiver & progress dashboard</h2><p class="p2-sub">A plain-language view of training activity. No diagnostic staging.</p><div class="p2-nav"><button data-tab="week" class="active">7 days</button><button data-tab="month">30 days</button><button data-tab="games">Games</button></div><div id="p2Dash"></div><p class="p2-note">Performance trends can help guide supportive routines and follow-up. They should not be converted into dementia stages or used as a clinical diagnosis.</p>';
    const render=tab=>{const el=$('#p2Dash');if(tab==='games'){el.innerHTML='<div class="p2-grid">'+d.games.map(g=>'<article class="p2-card"><span>'+esc(g.name)+'</span><strong>'+g.accuracy+'%</strong><span>'+g.plays+' plays · '+g.avgTime.toFixed(1)+'s average</span><div class="p2-bar"><i style="width:'+g.accuracy+'%"></i></div></article>').join('')+'</div>'+(d.games.length?'':'<p class="p2-muted">Complete a session to see game-level trends.</p>');return}const arr=tab==='week'?d.recent:d.month;const sc=arr.map(x=>Number(x.score||0));const mean=Math.round(avg(sc));const change=prev&&last?Number(last.score||0)-Number(prev.score||0):0;el.innerHTML='<div class="p2-grid"><article class="p2-card"><span>Sessions</span><strong>'+arr.length+'</strong></article><article class="p2-card"><span>Average score</span><strong>'+mean+'%</strong></article><article class="p2-card"><span>Latest score</span><strong>'+Number(last?.score||0)+'%</strong></article><article class="p2-card"><span>Recent change</span><strong>'+(!prev?'—':(change>0?'+':'')+change+' pts')+'</strong></article><article class="p2-card p2-wide"><span>Plain-language trend</span><strong>'+(change>3?'Recent performance is improving.':change<-3?'The latest result was lower than the previous one; a calm repeat may help.':'Recent performance is broadly steady.')+'</strong></article></div>'};
    $$('.p2-nav button').forEach(b=>b.onclick=()=>{$$('.p2-nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.tab)});render('week');
  }
  const $$=s=>[...document.querySelectorAll(s)];

  async function loadSupabase(){
    if(!C.SUPABASE_URL||!C.SUPABASE_ANON_KEY)return;
    try{const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');supabase=mod.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);const {data}=await supabase.auth.getSession();user=data?.session?.user||null;supabase.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;updateAccount();if(user)syncAll()});updateAccount();if(user)syncAll()}catch(_){/* offline or CDN unavailable; local mode is intentional */}
  }
  async function syncAll(){
    if(!supabase||!user)return false;
    const h=localHistory();if(!h.length)return true;
    try{
      for(const s of h){
        const {data:session,error}=await supabase.from('cognitive_sessions').insert({user_id:user.id,started_at:s.date,completed_at:s.date,score:Number(s.score||0),accuracy:Number(s.accuracy||0),adaptive_level:Number(s.level||1),metadata:{device:uid(),source:'phase2'}}).select('id').single();
        if(error)throw error;
        const rows=(s.results||[]).map(r=>({session_id:session.id,user_id:user.id,game_name:r.name,category:r.name,score:Number(r.score||0),correct:Number(r.correct||0)>0,response_time_ms:Math.round(Number(r.seconds||0)*1000),metadata:{source:'phase2'}}));
        if(rows.length){const {error:e2}=await supabase.from('game_results').insert(rows);if(e2)throw e2}
      }
      localStorage.setItem(KEY.sessionSync,new Date().toISOString());return true;
    }catch(_){return false}
  }
  function addDashboardLauncher(){if($('.p2-dashboard-launch'))return;const home=$('#homeView');if(!home)return;const b=document.createElement('button');b.className='p2-btn p2-dashboard-launch';b.type='button';b.textContent='📊 Open full progress & caregiver dashboard';b.onclick=showDashboard;home.querySelector('.home-strip')?.insertAdjacentElement('afterend',b)}

  window.CCNERPhase2={showDashboard,showAccount,syncAll,getUser:()=>user};
  function boot(){inject();addDashboardLauncher();loadSupabase()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
