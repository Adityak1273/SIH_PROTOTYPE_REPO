/* Cognitive Care NER — authenticated sync bridge.
 * Local-first records are uploaded only through the signed-in Supabase client.
 * RLS is the authorization boundary; the browser never carries a service-role key.
 */
(()=>{'use strict';
if(window.__CCNER_SECURE_SYNC__)return;window.__CCNER_SECURE_SYNC__=true;
const P6='ccner-p6-sync-queue',P1='ccner-p1-sync',L6='ccner.level6.outbox.v2',H='ccner-history';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
let running=false;
function auth(){return {sb:window.CCNERAuth?.client?.(),profile:window.CCNERAuth?.getProfile?.()}};
function sessionPayloads(ids,userId){
 const history=read(H,[]),wanted=new Set((Array.isArray(ids)?ids:[]).map(String)),sessions=[],games=[],queue=[];
 history.filter(x=>wanted.has(String(x?.id||x?.sessionId||x?.date))).forEach(x=>{
   const sid=String(x.id||x.sessionId||x.date),started=x.startedAt||x.date,results=Array.isArray(x.results)?x.results:[];
   sessions.push({id:sid,user_id:userId,started_at:started,completed_at:x.date,score:Number(x.score||0),accuracy:Number(x.accuracy||0),average_response_seconds:Number(x.avgTime||0),difficulty_level:Math.max(1,Math.min(10,Number(x.level)||1)),games_completed:results.length,metadata:{source:'ccner-v6'}});
   results.forEach((r,i)=>{
     const rid=String(r.id||sid+'-'+i);
     games.push({id:rid,session_id:sid,user_id:userId,game_id:String(r.game||'unknown'),game_name:String(r.game||'Game'),category:null,correct:!!r.correct,score:r.correct?100:0,response_seconds:Number(r.seconds||0),difficulty_level:Math.max(1,Math.min(10,Number(r.difficulty)||1))});
   });
   queue.push({user_id:userId,client_event_id:'session:'+sid,entity_type:'training_session',operation:'upsert',payload:x,client_created_at:started});
 });
 return {sessions,games,queue};
}
function profileOps(userId){return read(P1,[]).filter(x=>x?.status==='pending').map(x=>({user_id:userId,client_event_id:'p1:'+String(x.id),entity_type:String(x.type||'profile'),operation:'upsert',payload:x.payload??{},client_created_at:x.createdAt||new Date().toISOString()}))}
function routineOps(userId){return read(L6,[]).filter(x=>x?.status==='pending').map(x=>({user_id:userId,client_event_id:String(x.id),entity_type:String(x.resource||'routine'),operation:String(x.op||'upsert'),payload:x.payload??{},client_created_at:x.createdAt||new Date().toISOString()}))}
async function upload(detail={}){
  if(running)return;
  const authState=auth();
  const sb=authState.sb;
  const profile=authState.profile;
  if(!sb||!profile?.user_id)return;
  const ids=Array.isArray(detail.ids)?detail.ids:[];
  const built=sessionPayloads(ids,profile.user_id);
  const routines=routineOps(profile.user_id);
  const profileRows=profileOps(profile.user_id);
  if(!built.queue.length&&!routines.length&&!profileRows.length)return;
  running=true;
  try{
    if(built.sessions.length){
      const sessionWrite=await sb.from('cognitive_sessions').upsert(built.sessions);
      if(sessionWrite.error)throw sessionWrite.error;
    }
    if(built.games.length){
      const gameWrite=await sb.from('game_results').upsert(built.games);
      if(gameWrite.error)throw gameWrite.error;
    }
    const queueRows=[...built.queue,...routines,...profileRows];
    if(queueRows.length){
      const queueWrite=await sb.from('sync_queue').upsert(queueRows,{onConflict:'user_id,client_event_id'});
      if(queueWrite.error)throw queueWrite.error;
    }
    const at=new Date().toISOString();
    if(built.queue.length){
      const q=read(P6,[]);
      const idsSet=new Set(ids.map(String));
      write(P6,q.map(x=>idsSet.has(String(x.id))?{...x,status:'synced',syncedAt:at}:x));
    }
    if(routines.length){
      const rq=read(L6,[]);
      const sent=new Set(routines.map(x=>x.client_event_id));
      write(L6,rq.map(x=>sent.has(String(x.id))?{...x,status:'synced',syncedAt:at}:x));
    }
    if(profileRows.length){
      const pq=read(P1,[]);
      const sent=new Set(profileRows.map(x=>x.client_event_id.replace(/^p1:/,'')));
      write(P1,pq.map(x=>sent.has(String(x.id))?{...x,status:'synced',syncedAt:at}:x));
    }
    detail.onAck?.(ids);
    window.dispatchEvent(new CustomEvent('ccner:sync-complete',{detail:{count:built.sessions.length+built.games.length+routines.length+profileRows.length}}));
    window.dispatchEvent(new CustomEvent('ccner:profile-sync-complete',{detail:{ids:profileRows.map(x=>x.client_event_id.replace(/^p1:/,''))}}));
  }catch(error){
    console.warn('[CCNER sync]',error?.message||error);
    detail.onFailure?.(ids);
  }finally{
    running=false;
    window.CCNER567?.roleUI?.();
    window.CCNER_PHASE6?.refresh?.();
  }
}
window.addEventListener('ccner:sync-request',e=>upload(e.detail||{}));
window.addEventListener('ccner:secure-outbox-request',e=>upload(e.detail||{}));
window.addEventListener('ccner:profile-sync-request',e=>upload(e.detail||{}));
window.addEventListener('ccner:profile-ready',()=>upload({}));
window.addEventListener('online',()=>upload({}));
window.CCNERSecureSync={flush:()=>upload({})};
})();