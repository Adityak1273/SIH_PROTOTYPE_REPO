/* Cognitive Care NER — authenticated sync bridge.
 * Uploads only user-owned outbox records through Supabase RLS.
 * No service-role key is ever used in the browser.
 */
(()=>{'use strict';
if(window.__CCNER_SECURE_SYNC__)return;window.__CCNER_SECURE_SYNC__=true;
const P6='ccner-p6-sync-queue',L6='ccner.level6.outbox.v2',H='ccner-history';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
let pending=false;
function auth(){return {sb:window.CCNERAuth?.client?.(),profile:window.CCNERAuth?.getProfile?.()}};
function sessionOps(ids,userId){const history=read(H,[]);const wanted=new Set(Array.isArray(ids)?ids.map(String):[]);return history.filter(x=>wanted.has(String(x?.id||x?.sessionId||x?.date))).map(x=>({client_operation_id:'session:'+String(x.id||x.sessionId||x.date),user_id:userId,operation:'upsert',resource:'training_session',payload:x}));}
function routineOps(userId){return read(L6,[]).filter(x=>x?.status==='pending').map(x=>({client_operation_id:String(x.id),user_id:userId,operation:String(x.op||'upsert'),resource:String(x.resource||'routine'),payload:x.payload??{}}))}
async function upload(detail={}){
 if(pending)return;const {sb,profile}=auth();if(!sb||!profile?.user_id)return;
 const ids=Array.isArray(detail.ids)?detail.ids:[];const ops=[...sessionOps(ids,profile.user_id),...routineOps(profile.user_id)];if(!ops.length)return;
 pending=true;
 try{
  const {error}=await sb.from('sync_queue').upsert(ops,{onConflict:'user_id,client_operation_id'});
  if(error)throw error;
  const at=new Date().toISOString();
  if(ids.length){const q=read(P6,[]);const set=new Set(ids.map(String));write(P6,q.map(x=>set.has(String(x.id))?{...x,status:'synced',syncedAt:at}:x));}
  const rq=read(L6,[]),sent=new Set(routineOps(profile.user_id).map(x=>x.client_operation_id));write(L6,rq.map(x=>sent.has(String(x.id))?{...x,status:'synced',syncedAt:at}:x));
  detail.onAck?.(ids);
  window.dispatchEvent(new CustomEvent('ccner:sync-complete',{detail:{count:ops.length}}));
 }catch(error){
  console.warn('[CCNER sync]',error?.message||error);
  detail.onFailure?.(ids);
 }finally{pending=false;window.CCNER567?.roleUI?.();window.CCNER_PHASE6?.refresh?.();}
}
window.addEventListener('ccner:sync-request',e=>upload(e.detail||{}));
window.addEventListener('ccner:secure-outbox-request',e=>upload(e.detail||{}));
window.addEventListener('ccner:profile-ready',()=>upload({}));
window.addEventListener('online',()=>upload({}));
window.CCNERSecureSync={flush:()=>upload({})};
})();