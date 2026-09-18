/* Cognitive Care NER — authenticated sync bridge.
 * Canonical cloud schema: cognitive_sessions + game_results + sync_queue.
 * Browser code uses only the authenticated Supabase client; no service-role secret.
 */
(()=>{'use strict';
if(window.__CCNER_SECURE_SYNC__)return;window.__CCNER_SECURE_SYNC__=true;
const L6='ccner.level6.outbox.v2';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const auth=()=>({sb:window.CCNERAuth?.client?.(),profile:window.CCNERAuth?.getProfile?.()});
let busy=false;
function uuid(){return globalThis.crypto?.randomUUID?.()||('evt-'+Date.now()+'-'+Math.random().toString(36).slice(2))}
function sessionRow(detail,userId){
 const id=String(detail.id||detail.sessionId||'');if(!/^[0-9a-f-]{36}$/i.test(id))return null;
 return {id,user_id:userId,started_at:detail.startedAt||new Date().toISOString(),completed_at:new Date().toISOString(),score:Number(detail.accuracy||0)*100,accuracy:Number(detail.accuracy||0),average_response_seconds:Number(detail.avgResponse||0),difficulty_level:Number(detail.level||1),games_completed:Array.isArray(detail.results)?detail.results.length:0,metadata:{client_session_id:id,source:'ccner-v6'}};
}
function gameRows(detail,userId){
 const sid=String(detail.id||detail.sessionId||'');if(!/^[0-9a-f-]{36}$/i.test(sid))return[];
 return (detail.results||[]).map((r,i)=>({session_id:sid,user_id:userId,game_id:String(r.game||r.gameKey||('game-'+i)),game_name:String(r.game||r.gameKey||('Game '+(i+1))),category:null,correct:!!r.correct,score:!!r.correct?100:0,response_seconds:Number(r.seconds||r.responseTime||0),difficulty_level:Number(r.level||1)}));
}
async function syncSession(detail){
 const {sb,profile}=auth();if(!sb||!profile?.user_id)return false;
 const session=sessionRow(detail,profile.user_id);if(!session)return false;
 const {error:e1}=await sb.from('cognitive_sessions').upsert(session,{onConflict:'id'});if(e1)throw e1;
 const rows=gameRows(detail,profile.user_id);
 if(rows.length){const existing=await sb.from('game_results').select('id,game_id').eq('session_id',session.id).eq('user_id',profile.user_id);if(existing.error)throw existing.error;const byGame=new Map((existing.data||[]).map(x=>[String(x.game_id),x.id]));for(const row of rows){const id=byGame.get(row.game_id);const q=id?sb.from('game_results').update(row).eq('id',id):sb.from('game_results').insert(row);const {error:e2}=await q;if(e2)throw e2}}
 const event={user_id:profile.user_id,client_event_id:'session:'+session.id,entity_type:'cognitive_session',operation:'upsert',payload:{session,game_results:rows},client_created_at:new Date().toISOString(),synced_at:new Date().toISOString(),processed_at:new Date().toISOString()};
 const {error:e3}=await sb.from('sync_queue').upsert(event,{onConflict:'user_id,client_event_id'});if(e3)throw e3;
 window.dispatchEvent(new CustomEvent('ccner:sync-complete',{detail:{count:1+rows.length,sessionId:session.id}}));return true;
}
async function flushOutbox(){
 const {sb,profile}=auth();if(!sb||!profile?.user_id||busy)return;
 const q=read(L6,[]).filter(x=>x?.status==='pending');if(!q.length)return;
 busy=true;try{
  const rows=q.map(x=>({user_id:profile.user_id,client_event_id:String(x.id||uuid()),entity_type:String(x.resource||'routine'),operation:String(x.op||'upsert'),payload:x.payload??{},client_created_at:x.createdAt||new Date().toISOString()}));
  const {error}=await sb.from('sync_queue').upsert(rows,{onConflict:'user_id,client_event_id'});if(error)throw error;
  const sent=new Set(rows.map(x=>x.client_event_id));write(L6,read(L6,[]).map(x=>sent.has(String(x.id))?{...x,status:'synced',syncedAt:new Date().toISOString()}:x));
 }catch(e){console.warn('[CCNER sync]',e?.message||e)}finally{busy=false}
}
window.addEventListener('ccner:session-complete',e=>syncSession(e.detail||{}).catch(err=>console.warn('[CCNER session sync]',err?.message||err)));
window.addEventListener('ccner:secure-outbox-request',flushOutbox);
window.addEventListener('ccner:profile-ready',flushOutbox);
window.addEventListener('online',flushOutbox);
window.CCNERSecureSync={flush:flushOutbox,syncSession};
})();