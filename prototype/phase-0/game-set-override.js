/* Cognitive Care NER — active five-game set override.
 * Active games: Spot the Difference, Stroop, Sequence Memory,
 * Pattern Recognition, Familiar Object Memory.
 * This replaces the older Phase 8 category/belong game rotation.
 */
(() => {
  'use strict';
  if (window.CCNER_GAME_SET_V2) return;
  window.CCNER_GAME_SET_V2 = true;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const shuffle = a => [...a].sort(() => Math.random() - 0.5);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const say = text => { try { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate=.9; u.pitch=1.05; u.lang=localStorage.getItem('ccner-p1-language') || 'en-IN'; speechSynthesis.speak(u); } } catch (_) {} };

  const css = `
    .ccv2-intro{padding:22px;text-align:center;background:#fff;border:1px solid #e5ddd4;border-radius:20px}
    .ccv2-intro h3{font-size:25px;margin:7px 0}.ccv2-intro p{font-size:17px;line-height:1.45}
    .ccv2-tags{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:15px 0}.ccv2-tags span{padding:7px 11px;border-radius:999px;background:#f3eee7}
    .ccv2-grid{display:grid;grid-template-columns:repeat(3,minmax(90px,1fr));gap:12px;max-width:620px;margin:18px auto}
    .ccv2-tile{min-height:88px;border:2px solid #ddd4ca;border-radius:16px;background:#fff;font-size:40px;cursor:pointer}
    .ccv2-tile:disabled{opacity:.6}.ccv2-tile.found{outline:4px solid #77a77e55}
    .ccv2-stroop-word{font-size:56px;font-weight:900;text-align:center;margin:24px 0;line-height:1.1}
    .ccv2-choices{display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:12px;max-width:560px;margin:auto}
    .ccv2-choice{min-height:58px;border:1px solid #d8d0c7;border-radius:14px;background:#fff;font-size:18px;font-weight:800;cursor:pointer}
    .ccv2-seq{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:20px}.ccv2-seq span{width:62px;height:62px;border-radius:15px;display:block}
    .ccv2-red{background:#d95c5c}.ccv2-blue{background:#5d7fd7}.ccv2-green{background:#65a76b}.ccv2-yellow{background:#e0ba4c}.ccv2-purple{background:#8d68bd}
    .ccv2-pattern{display:flex;justify-content:center;gap:9px;align-items:center;flex-wrap:wrap;font-size:28px;margin:22px}.ccv2-pattern span{min-width:52px;padding:10px 8px;text-align:center;border-radius:12px;background:#f1eee9}
    .ccv2-memory{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:560px;margin:18px auto}.ccv2-memory div{padding:15px;border:1px solid #ddd4ca;border-radius:14px;text-align:center;font-size:34px;background:#fbf8f3}
    @media(max-width:600px){.ccv2-grid{grid-template-columns:repeat(2,1fr)}.ccv2-stroop-word{font-size:44px}.ccv2-memory{grid-template-columns:repeat(2,1fr)}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  const COLORS=[['red','Red'],['blue','Blue'],['green','Green'],['yellow','Yellow'],['purple','Purple']];
  const OBJECTS=[['☕','Cup'],['🍌','Banana'],['🥄','Spoon'],['📖','Book'],['💊','Medicine'],['💧','Water'],['🧴','Bottle'],['🍚','Rice'],['🧢','Cap'],['🌂','Umbrella']];
  const state={active:false,index:0,order:[],round:0,current:null,results:[]};

  const META={
    spot:{title:'Spot the Difference',area:'VISUAL ATTENTION',icon:'🔎',what:'Visual attention and detail recognition',intro:'Look at the two pictures and find the one small difference.',voice:'Look carefully at both pictures. Find the one small difference.'},
    stroop:{title:'Stroop',area:'ATTENTION + INHIBITION',icon:'🎨',what:'Selective attention and response control',intro:'Choose the ink colour, not the word you read.',voice:'Choose the colour of the ink, not the word.'},
    sequence:{title:'Sequence Memory',area:'MEMORY + ATTENTION',icon:'🔢',what:'Short-term sequence memory',intro:'Watch the colours, remember the order, then repeat it.',voice:'Watch the colours carefully. Then repeat the same order.'},
    pattern:{title:'Pattern Recognition',area:'PATTERN RECOGNITION',icon:'🧩',what:'Pattern and object recognition',intro:'Find the repeating rule and choose what comes next.',voice:'Look for the pattern. What comes next?'},
    memory:{title:'Familiar Object Memory',area:'MEMORY + FAMILIAR OBJECTS',icon:'🧠',what:'Visual memory using familiar everyday objects',intro:'Remember the familiar objects, then identify one you saw.',voice:'Remember these familiar everyday objects. Take your time.'}
  };

  function showGame(){ $$('.view').forEach(v=>v.hidden=true); const v=$('#gameView'); if(v)v.hidden=false; }
  function finishGame(score,seconds){
    const c=state.current;if(!c)return;c.score=score;c.correct=score>=50?1:0;c.seconds=seconds;state.results.push({name:META[c.key].title,score,correct:c.correct,seconds});
    setTimeout(()=>{if(state.index<4){state.index++;loadGame();}else finishSession()},700);
  }
  function finishSession(){
    state.active=false;
    const correct=state.results.reduce((s,r)=>s+r.correct,0),avg=state.results.reduce((s,r)=>s+r.seconds,0)/Math.max(1,state.results.length);
    const session={date:new Date().toISOString(),score:correct*20,accuracy:correct/5,avgTime:avg,level:1,results:state.results.map(r=>({...r}))};
    try{const h=JSON.parse(localStorage.getItem('ccner-history')||'[]');h.push(session);localStorage.setItem('ccner-history',JSON.stringify(h.slice(-8)));}catch(_){ }
    if(typeof window.renderResults==='function')window.renderResults(session);
    $$('.view').forEach(v=>v.hidden=true);const rv=$('#resultsView');if(rv)rv.hidden=false;
    if($('#overallScore'))$('#overallScore').textContent=`${session.score}%`;
    if($('#overallAccuracy'))$('#overallAccuracy').textContent=`${Math.round(session.accuracy*100)}%`;
    if($('#gamesCompleted'))$('#gamesCompleted').textContent='5 / 5';
    if($('#avgTime'))$('#avgTime').textContent=`${avg.toFixed(1)}s`;
    if($('#resultRows'))$('#resultRows').innerHTML=state.results.map(r=>`<div class="result-row"><div><div class="result-name">${esc(r.name)}</div><div class="result-detail">${r.correct?'Correct':'Needs another try'} · ${r.seconds.toFixed(1)}s</div></div><span class="score-pill">${r.score}%</span></div>`).join('');
    say(correct>=4?'Wonderful work! You finished all five games.':'You finished all five games. Nice steady practice!');
  }

  function intro(meta){
    const a=$('#gameArea');if(!a)return;
    a.innerHTML=`<section class="ccv2-intro"><div style="font-size:42px">${meta.icon}</div><h3>${meta.title}</h3><p><strong>What it trains:</strong> ${meta.what}</p><p>${meta.intro}</p><div class="ccv2-tags"><span>🔁 3 rounds</span><span>🧓 Training only · not diagnosis</span></div><button class="p8-primary" id="ccv2Start" type="button">▶ Start game</button></section>`;
    $('#ccv2Start').onclick=beginRound;
  }

  function loadGame(){
    const key=state.order[state.index],meta=META[key];state.round=0;state.current={key,correct:0,started:performance.now()};
    if($('#gameCategory'))$('#gameCategory').textContent=meta.area;if($('#gameTitle'))$('#gameTitle').textContent=meta.title;if($('#gameCounter'))$('#gameCounter').textContent=`${state.index+1} of 5`;if($('#gamePrompt'))$('#gamePrompt').textContent=meta.intro;if($('#gameFeedback'))$('#gameFeedback').textContent='';
    const b=$('#progressBar');if(b)b.style.width=`${state.index/5*100}%`;if($('#gameMomoText'))$('#gameMomoText').textContent='Momo will guide you. No rush.';intro(meta);say(meta.voice);
  }

  function beginRound(){if(!state.active||state.current?.live)return;state.current.live=true;state.round++;if($('#gameFeedback'))$('#gameFeedback').textContent=`Round ${state.round} of 3`;const k=state.current.key;if(k==='spot')spot();else if(k==='stroop')stroop();else if(k==='sequence')sequence();else if(k==='pattern')pattern();else memory();}
  function done(ok,start){if(!state.current?.live)return;state.current.live=false;state.current.correct+=ok?1:0;const elapsed=(performance.now()-start)/1000;if(state.round<3){if($('#gameFeedback'))$('#gameFeedback').textContent=ok?'✓ Correct — next round!':'Good try — next round!';return setTimeout(beginRound,650)}finishGame(Math.round(state.current.correct/3*100),elapsed);}

  function spot(){
    const start=performance.now(),n=6,base=shuffle(OBJECTS).slice(0,n),diffIndex=Math.floor(Math.random()*n),left=base.map(x=>x[0]),right=base.map(x=>x[0]);
    right[diffIndex]=pick(OBJECTS.filter(x=>x[0]!==left[diffIndex]))[0];
    const a=$('#gameArea');a.innerHTML=`<div class="ccv2-intro"><p><strong>Find the different item.</strong></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><div><strong>Picture A</strong><div class="ccv2-grid">${left.map((x,i)=>`<button class="ccv2-tile" data-side="a" data-i="${i}" type="button">${x}</button>`).join('')}</div></div><div><strong>Picture B</strong><div class="ccv2-grid">${right.map((x,i)=>`<button class="ccv2-tile" data-side="b" data-i="${i}" type="button">${x}</button>`).join('')}</div></div></div></div>`;
    $$('.ccv2-tile').forEach(b=>b.onclick=()=>done(Number(b.dataset.i)===diffIndex,b.dataset.side==='b'?start:performance.now()));
    say('Find the one item that is different between the two pictures.');
  }

  function stroop(){
    const start=performance.now(),word=pick(COLORS),ink=pick(COLORS.filter(x=>x[0]!==word[0])),a=$('#gameArea');
    a.innerHTML=`<div class="ccv2-intro"><p><strong>Ignore the word. Choose the ink colour.</strong></p><div class="ccv2-stroop-word" style="color:${ink[0]}">${word[1].toUpperCase()}</div><div class="ccv2-choices">${shuffle(COLORS).map(c=>`<button class="ccv2-choice" type="button" data-c="${c[0]}">${c[1]}</button>`).join('')}</div></div>`;
    $$('.ccv2-choice').forEach(b=>b.onclick=()=>done(b.dataset.c===ink[0],start));say(`Choose ${ink[1]}. Ignore the word.`);
  }

  function sequence(){
    const start=performance.now(),seq=shuffle(COLORS.map(x=>x[0])).slice(0,3+state.round),a=$('#gameArea');a.innerHTML=`<div class="ccv2-intro"><p><strong>Remember this order.</strong></p><div class="ccv2-seq">${seq.map(c=>`<span class="ccv2-${c}"></span>`).join('')}</div></div>`;
    setTimeout(()=>{if(!state.current?.live)return;let chosen=[];a.innerHTML=`<div class="ccv2-intro"><p><strong>Repeat the sequence.</strong></p><div class="ccv2-choices">${shuffle(COLORS).map(c=>`<button class="ccv2-choice" type="button" data-c="${c[0]}">${c[1]}</button>`).join('')}</div></div>`;$$('.ccv2-choice').forEach(b=>b.onclick=()=>{chosen.push(b.dataset.c);b.disabled=true;if(chosen.length===seq.length)done(chosen.every((x,i)=>x===seq[i]),start)});say('Now repeat the colours in the same order.')},1800);
  }

  function pattern(){
    const pairs=pick([['🍎','🥭'],['☕','💧'],['🍚','🥥'],['🥄','🍌']]),seq=[pairs[0],pairs[1],pairs[0],pairs[1]],start=performance.now(),a=$('#gameArea');a.innerHTML=`<div class="ccv2-intro"><div class="ccv2-pattern">${seq.map(x=>`<span>${x}</span>`).join('')}<span>?</span></div><div class="ccv2-choices">${shuffle([pairs[0],pairs[1],pick(OBJECTS)[0]]).map(x=>`<button class="ccv2-choice" type="button" data-v="${x}">${x}</button>`).join('')}</div></div>`;$$( '.ccv2-choice').forEach(b=>b.onclick=()=>done(b.dataset.v===pairs[0],start));say('What comes next in the pattern?');
  }

  function memory(){
    const start=performance.now(),items=shuffle(OBJECTS).slice(0,3+state.round),target=pick(items),a=$('#gameArea');a.innerHTML=`<div class="ccv2-intro"><p><strong>Remember these familiar objects.</strong></p><div class="ccv2-memory">${items.map(x=>`<div>${x[0]}<br><small>${esc(x[1])}</small></div>`).join('')}</div></div>`;
    setTimeout(()=>{if(!state.current?.live)return;const choices=shuffle([target,...shuffle(OBJECTS.filter(x=>!items.includes(x))).slice(0,3)]);a.innerHTML=`<div class="ccv2-intro"><p><strong>Which object did you see?</strong></p><div class="ccv2-choices">${choices.map(x=>`<button class="ccv2-choice" type="button" data-v="${x[0]}">${x[0]} ${x[1]}</button>`).join('')}</div></div>`;$$( '.ccv2-choice').forEach(b=>b.onclick=()=>done(b.dataset.v===target[0],start));say('Which object did you see?')},2200);
  }

  function startSession(){
    if(state.active)return;
    state.active=true;state.index=0;state.results=[];state.order=shuffle(['spot','stroop','sequence','pattern','memory']);
    showGame();if($('#todayStatus'))$('#todayStatus').textContent='In progress';loadGame();
  }

  window.CCNER_VIDEO_GAMES={startSession};
})();
