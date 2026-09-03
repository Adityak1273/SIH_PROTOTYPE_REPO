/* Spot the Difference — original project content using the supplied video only for interaction structure. */
(function(){
  const rounds=[
    {items:['☕','🥄','📖','💊','💧','🍚'],changes:['☕','🥄','📅','💊','💧','🍚'],hint:'Look for the object that changed.'},
    {items:['🍎','🍌','🍊','🥭','🍐','🍇'],changes:['🍎','🍌','🍊','🥭','🍎','🍇'],hint:'Compare each fruit with what you saw first.'},
    {items:['🧹','🪣','🧽','🧺','🧴','🧹','🪣'],changes:['🧹','🪣','🧽','🧺','🧴','🧹','🧽'],hint:'One cleaning item is different.'},
    {items:['🛏️','🪥','🧴','🧣','⏰','📖','👓','🪥'],changes:['🛏️','🪥','🧴','🧣','⏰','📖','🧢','🪥'],hint:'Check the familiar bedroom and morning items carefully.'},
    {items:['🍽️','🥣','🥛','🥄','☕','🍚','🧂','🥣'],changes:['🍽️','🥣','🥛','🥄','☕','🍚','🌶️','🥣'],hint:'The changed item is in the dining or cooking group.'}
  ];

  function install(){
    if(typeof state==='undefined'||typeof catalog==='undefined'||typeof $==='undefined'||typeof runGame!=='function'||typeof loadGame!=='function')return false;
    catalog.memory={name:'Spot the Difference',category:'OBJECT RECOGNITION + ATTENTION',intro:'Memorize the familiar items, then spot which position changed.'};
    const oldRunGame=runGame;
    window.runGame=function(key){if(key==='memory')return window.gameSpotDifference();return oldRunGame(key)};
    window.gameSpotDifference=function(){
      const c=state.current;if(!c||c.answered)return;
      c.diffRound=0;c.diffCorrect=0;c.diffTotal=0;c.diffConsecutiveMistakes=0;c.diffMaxRound=rounds.length;c.diffCompleted=false;
      runDiffRound();
    };

    function runDiffRound(){
      const c=state.current;if(!c||c.answered)return;
      c.diffRound++;
      if(c.diffRound>c.diffMaxRound){completeDifference();return;}
      const base=rounds[c.diffRound-1];
      const level=Math.min(3,Math.max(1,Number(state.level)||1));
      const count=Math.min(base.items.length,6+level-1);
      const items=base.items.slice(0,count),changes=base.changes.slice(0,count);
      let changeIndex=Math.floor(Math.random()*items.length);
      c.diffItems=items;c.diffChanges=changes;c.diffExpected=changeIndex;c.diffLocked=true;c.diffStage='memorize';
      $('#gamePrompt').textContent=`Memorize ${items.length} familiar items. Look carefully…`;
      $('#gameArea').innerHTML=`<div class="difference-stage difference-transition">
        <div class="difference-meta"><span class="difference-chip">Round <strong>${c.diffRound} / ${c.diffMaxRound}</strong></span><span class="difference-chip">Correct <strong>${c.diffCorrect}</strong></span><span class="difference-chip">Misses <strong>${c.diffConsecutiveMistakes} / 3</strong></span></div>
        <div class="difference-progress"><span style="width:${(c.diffRound-1)/c.diffMaxRound*100}%"></span></div>
        <div class="difference-instruction">Memorize these familiar items</div>
        <div class="difference-grid memorize">${items.map((x,i)=>`<div class="difference-card" aria-label="Memory item ${i+1}"><span>${x}</span></div>`).join('')}</div>
        <div class="difference-count" id="differenceCount">Look carefully…</div>
        <div class="difference-feedback" id="differenceFeedback"></div>
      </div>`;
      say('Look carefully and remember where each item is. I will change one soon.','thinking','watching');

      const showMs=Math.max(2200,3400-(level-1)*450);
      setTimeout(()=>{
        if(!state.current||state.current!==c||c.answered)return;
        c.diffStage='answer';c.diffLocked=false;
        $('#gamePrompt').textContent='Which item changed? Tap the one that is different.';
        $('#gameArea').innerHTML=`<div class="difference-stage difference-transition">
          <div class="difference-meta"><span class="difference-chip">Round <strong>${c.diffRound} / ${c.diffMaxRound}</strong></span><span class="difference-chip">Correct <strong>${c.diffCorrect}</strong></span><span class="difference-chip">Misses <strong>${c.diffConsecutiveMistakes} / 3</strong></span></div>
          <div class="difference-progress"><span style="width:${(c.diffRound-1)/c.diffMaxRound*100}%"></span></div>
          <div class="difference-instruction">Which item changed? Tap the one that is different.</div>
          <div class="difference-grid answer">${changes.map((x,i)=>`<button class="difference-card difference-choice" type="button" data-index="${i}" aria-label="Item ${i+1}"><span>${x}</span><small>${i+1}</small></button>`).join('')}</div>
          <div class="difference-feedback" id="differenceFeedback"></div>
          <div class="difference-hint">${base.hint}</div>
        </div>`;
        say('Your turn. Which item changed? Take your time.','happy','focused');
        $$('.difference-choice').forEach(btn=>btn.addEventListener('click',()=>answerDifference(Number(btn.dataset.index))));
      },showMs);
    }

    function answerDifference(index){
      const c=state.current;if(!c||c.diffLocked)return;
      c.diffLocked=true;c.diffTotal++;
      const ok=index===c.diffExpected;
      const fb=$('#differenceFeedback');
      $$('.difference-choice').forEach(b=>b.disabled=true);
      $(`.difference-choice[data-index="${c.diffExpected}"]`)?.classList.add('correct');
      $(`.difference-choice[data-index="${index}"]`)?.classList.toggle('wrong',!ok);
      if(ok){
        c.diffCorrect++;c.diffConsecutiveMistakes=0;
        fb.textContent='Correct! You spotted the change. Moving to the next one.';fb.className='difference-feedback correct';
        setMood('celebrate','happy');setStatus('Nice spot! Next round.');
        if(window.CognitiveCareCompanion)window.CognitiveCareCompanion.onGameEvent({type:'correct'});
      }else{
        c.diffConsecutiveMistakes++;
        const ending=c.diffConsecutiveMistakes>=3;
        fb.textContent=ending?'Three misses in a row — that is okay. Moving to the next game.':'Not quite. That is okay — let’s try the next one.';fb.className='difference-feedback incorrect';
        setMood('encourage','encouraging');setStatus(ending?'Three misses in a row — moving on.':'Not quite. Next round.');
        if(window.CognitiveCareCompanion)window.CognitiveCareCompanion.onGameEvent({type:'incorrect'});
      }
      setTimeout(()=>{if(c.diffConsecutiveMistakes>=3)completeDifference();else runDiffRound()},850);
    }

    function completeDifference(){
      const c=state.current;if(!c||c.diffCompleted)return;c.diffCompleted=true;c.answered=true;
      const total=Math.max(1,c.diffTotal||1),score=Math.round((c.diffCorrect/total)*100);
      c.correct=score>=50?1:0;c.score=score;c.seconds=(performance.now()-c.started)/1000;
      state.results.push({...c,name:catalog.memory.name,skipped:false,rounds:c.diffTotal,correctItems:c.diffCorrect,totalItems:total,consecutiveMistakes:c.diffConsecutiveMistakes||0});
      setStatus('Spot the Difference complete. Moving to the next game.');setMood(score>=50?'celebrate':'encourage',score>=50?'happy':'encouraging');
      setTimeout(()=>{if(state.index<4){state.index++;loadGame()}else finishSession()},800);
    }
    return true;
  }
  if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},50);setTimeout(()=>clearInterval(timer),10000)}
})();
