/* Mino Live Voice — Gemini Live API adapter.
 * Uses a short-lived server-issued token; no provider API key is shipped to the browser.
 * Falls back to the existing browser speech layer when the live service is not configured.
 */
(()=>{'use strict';
if(window.__CCNER_MINO_LIVE__)return;window.__CCNER_MINO_LIVE__=true;
const state={ws:null,mic:null,processor:null,inputCtx:null,outputCtx:null,source:null,running:false,connecting:false,nextPlay:0,token:null};
const cfg=()=>window.CCNER_CONFIG||{};
const locale=()=>window.CCNERLanguage?.locale||localStorage.getItem('ccner-language')||'en-IN';
const languageName=()=>window.CCNERLanguage?.language||'English';
const tokenEndpoint=()=>cfg().GEMINI_TOKEN_ENDPOINT||(()=>{try{return new URL('/api/gemini-token',cfg().AI_ENDPOINT||location.origin).href}catch{return '/api/gemini-token'}})();
const $=s=>document.querySelector(s);
const status=(t,busy=false)=>{if(typeof window.setStatus==='function')window.setStatus(t,busy);};
const speech=(t)=>{const e=$('#speechText');if(e)e.textContent=t;};
const setMood=(m,l)=>window.setMood?.(m,l);
function fallback(){window.__CCNER_MINO_LIVE_READY__=false;return false}
async function token(){
 const r=await fetch(tokenEndpoint(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:locale(),languageName:languageName()})});
 if(!r.ok)throw Error('Live voice is not configured');
 const d=await r.json();if(!d?.token)throw Error('Live voice token unavailable');return d.token;
}
function b64(bytes){let s='';const step=0x8000;for(let i=0;i<bytes.length;i+=step)s+=String.fromCharCode(...bytes.subarray(i,i+step));return btoa(s)}
function downsample(buf,inRate,outRate){if(inRate===outRate)return buf;const ratio=inRate/outRate,outLen=Math.round(buf.length/ratio),out=new Float32Array(outLen);let off=0;for(let i=0;i<outLen;i++){const next=Math.min(buf.length,Math.round((i+1)*ratio));let sum=0,count=0;for(let j=off;j<next;j++){sum+=buf[j];count++}out[i]=count?sum/count:0;off=next}return out}
function pcm16(float32){const out=new Int16Array(float32.length);for(let i=0;i<float32.length;i++){const v=Math.max(-1,Math.min(1,float32[i]));out[i]=v<0?v*0x8000:v*0x7fff}return new Uint8Array(out.buffer)}
function decode(b64s){const raw=atob(b64s),out=new Int16Array(raw.length/2);for(let i=0;i<out.length;i++)out[i]=(raw.charCodeAt(i*2)|raw.charCodeAt(i*2+1)<<8);return out}
function playAudio(b64s){if(!state.outputCtx)return;const pcm=decode(b64s),audio=new Float32Array(pcm.length);for(let i=0;i<pcm.length;i++)audio[i]=pcm[i]/32768;const buf=state.outputCtx.createBuffer(1,audio.length,24000);buf.copyToChannel(audio,0);const src=state.outputCtx.createBufferSource();src.buffer=buf;src.connect(state.outputCtx.destination);const now=state.outputCtx.currentTime;state.nextPlay=Math.max(state.nextPlay,now);src.start(state.nextPlay);state.nextPlay+=buf.duration}
function setupMessage(){return {setup:{model:'models/'+(cfg().GEMINI_LIVE_MODEL||'gemini-3.8-live'),responseModalities:['AUDIO'],inputAudioTranscription:{},outputAudioTranscription:{},systemInstruction:{parts:[{text:'You are Mino, a warm, playful, elderly-friendly companion inside Cognitive Care NER. Speak naturally and briefly. The user may talk about memories, family stories, music, reminders, progress, games and daily life. Never diagnose or infer a medical condition from training results. Use the selected language consistently: '+languageName()+' ('+locale()+'). Be patient, gentle and encouraging. If the user asks to start a game, remind them that the app can launch it.'}]},sessionResumption:{}}}}
async function openSocket(tokenValue){
 return new Promise((resolve,reject)=>{const url='wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(tokenValue);const ws=new WebSocket(url);let opened=false;const timer=setTimeout(()=>{if(!opened){try{ws.close()}catch{}reject(Error('Live voice connection timed out'))}},12000);
 ws.onopen=()=>{opened=true;clearTimeout(timer);state.ws=ws;ws.send(JSON.stringify(setupMessage()));resolve(ws)};
 ws.onerror=()=>{clearTimeout(timer);if(!opened)reject(Error('Live voice connection failed'))};
 ws.onclose=()=>{clearTimeout(timer);if(state.ws===ws){state.ws=null;state.running=false;stopMicOnly();status('Voice ready');}};
 ws.onmessage=e=>{try{const m=JSON.parse(e.data);const sc=m.serverContent;if(sc?.inputTranscription?.text){speech(sc.inputTranscription.text);setMood('listening','listening')}if(sc?.outputTranscription?.text){speech(sc.outputTranscription.text);setMood('speaking','talking');if(window.setConversation)window.setConversation?.('assistant',sc.outputTranscription.text)}for(const p of (sc?.modelTurn?.parts||[]))if(p.inlineData?.data)playAudio(p.inlineData.data);if(sc?.interrupted){state.nextPlay=state.outputCtx?.currentTime||0}if(m.goAway?.timeLeft){console.debug('[Mino Live] reconnect scheduled',m.goAway.timeLeft)} }catch(err){console.error('[Mino Live] message',err)}};
 })
}
async function startMic(){if(!state.ws||state.ws.readyState!==WebSocket.OPEN)return;const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});state.mic=stream;state.inputCtx=new (window.AudioContext||window.webkitAudioContext)();await state.inputCtx.resume();state.source=state.inputCtx.createMediaStreamSource(stream);state.processor=state.inputCtx.createScriptProcessor(4096,1,1);state.processor.onaudioprocess=e=>{if(!state.running||!state.ws||state.ws.readyState!==WebSocket.OPEN)return;const f=downsample(e.inputBuffer.getChannelData(0),state.inputCtx.sampleRate,16000);const bytes=pcm16(f);state.ws.send(JSON.stringify({realtimeInput:{audio:{data:b64(bytes),mimeType:'audio/pcm;rate=16000'}}}))};state.source.connect(state.processor);state.processor.connect(state.inputCtx.destination)}
function stopMicOnly(){try{state.processor?.disconnect()}catch{}try{state.source?.disconnect()}catch{}try{state.mic?.getTracks().forEach(t=>t.stop())}catch{}try{state.inputCtx?.close()}catch{}state.processor=null;state.source=null;state.mic=null;state.inputCtx=null}
async function start(){if(state.running||state.connecting)return;state.connecting=true;status('Connecting Mino voice',true);setMood('thinking','thinking');try{if(!navigator.mediaDevices?.getUserMedia||!window.WebSocket)throw Error('Voice input is unavailable');const t=await token();state.outputCtx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:24000});await state.outputCtx.resume();await openSocket(t);await startMic();state.running=true;state.connecting=false;status('Mino is listening',true);speech('I’m listening. You can talk naturally.');setMood('listening','listening')}catch(e){state.connecting=false;stopMicOnly();try{state.ws?.close()}catch{}state.ws=null;state.running=false;console.warn('[Mino Live] fallback:',e?.message||e);status('Voice ready');window.armVoice?.__ccnerOriginal?.();}}
function stop(){state.running=false;stopMicOnly();try{state.ws?.close()}catch{}state.ws=null;if(state.outputCtx){try{state.outputCtx.close()}catch{}state.outputCtx=null}state.nextPlay=0;status('Voice ready');}
const originalArm=window.armVoice;
window.CCNERMinoLive={start,stop,isRunning:()=>state.running};
window.armVoice=()=>{if(cfg().GEMINI_LIVE_ENABLED===false)return originalArm?.();start()};
window.armVoice.__ccnerOriginal=originalArm;
window.stopListening=(()=>{const old=window.stopListening;return keep=>{if(state.running)stop();return old?.(keep)}})();
window.__CCNER_MINO_LIVE_READY__=true;
})();