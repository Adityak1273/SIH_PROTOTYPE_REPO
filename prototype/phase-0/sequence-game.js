/* Sequence Memory — interaction layer inspired by the supplied reference video, but using original UI/content. */
(function(){
  function install(){
    if(typeof state==='undefined' || typeof catalog==='undefined' || typeof $==='undefined' || typeof runGame!=='function' || typeof loadGame!=='function') return false;

    catalog.sequence={
      name:'Sequence Memory',
      category:'MEMORY + ATTENTION',
      intro:'Watch the lights carefully, then repeat the sequence from memory.',
      pads:[
        {color:'red',label:'Red',icon:'●'},
        {color:'blue',label:'Blue',icon:'●'},
        {color:'green',label:'Green',icon:'●'},
        {color:'gold',label:'Yellow',icon:'●'}
      ]
    };

    const oldRunGame=runGame;
    window.gameSequence=function(){
      const current=state.current;
      if(!current || current.answered) return;
      current.sequenceRound=0;
      current.sequenceScore=0;
      current.sequenceConsecutiveMistakes=0;
      current.sequenceStreak=0;
      current.sequenceMaxRound=5;
      current.sequenceRoundResults=[];
      runSequenceRound();
    };

    window.runGame=function(key){
      if(key==='sequence') return window.gameSequence();
      return oldRunGame(key);
    };

    function runSequenceRound(){
      const c=state.current;
      if(!c || c.answered) return;
      c.sequenceRound++;
      if(c.sequenceRound>c.sequenceMaxRound){completeSequenceGame();return;}

      const level=Math.min(3,Math.max(1,Number(state.level)||1));
      const length=Math.min(7,2+c.sequenceRound+level-1);
      const sequence=Array.from({length},()=>Math.floor(Math.random()*4));
      c.sequence=sequence;
      c.sequenceInput=[];
      c.sequenceLocked=true;

      const area=$('#gameArea');
      area.innerHTML=`<div class="sequence-stage sequence-transition">
        <div class="sequence-meta">
          <span class="sequence-chip">Round <strong>${c.sequenceRound} / ${c.sequenceMaxRound}</strong></span>
          <span class="sequence-chip">Score <strong>${c.sequenceScore}</strong></span>
          <span class="sequence-chip">Mistakes <strong>${c.sequenceConsecutiveMistakes} / 3</strong></span>
        </div>
        <div class="sequence-instruction">Watch the lights. Momo will show the order, then it is your turn.</div>
        <div class="sequence-board" aria-label="Sequence memory board">
          ${catalog.sequence.pads.map((p,i)=>`<button class="sequence-pad" data-pad="${i}" data-color="${p.color}" type="button" aria-label="${p.label}">${p.icon}</button>`).join('')}
        </div>
        <div class="sequence-count" id="sequenceCount">Get ready…</div>
        <div class="sequence-feedback" id="sequenceFeedback"></div>
      </div>`;

      const pads=$$('.sequence-pad');
      pads.forEach(p=>p.disabled=true);
      const flashMs=Math.max(430,650-(level-1)*70);
      const gapMs=Math.max(130,190-(level-1)*20);
      let i=0;
      const flash=()=>{
        if(!state.current || state.current!==c || c.answered)return;
        pads.forEach(p=>p.classList.remove('is-lit'));
        if(i>=sequence.length){
          c.sequenceLocked=false;
          pads.forEach(p=>p.disabled=false);
          $('#sequenceCount').textContent=`0 of ${sequence.length} remembered`;
          $('#gamePrompt').textContent='Your turn — repeat the sequence.';
          $('#sequenceFeedback').textContent='';
          $('#sequenceFeedback').className='sequence-feedback';
          say('Your turn. Tap the lights in the same order.','happy','focused');
          return;
        }
        const pad=pads[sequence[i]];
        pad.classList.add('is-lit');
        $('#sequenceCount').textContent=`Watch ${i+1} of ${sequence.length}`;
        setTimeout(()=>{
          pad.classList.remove('is-lit');
          i++;
          setTimeout(flash,gapMs);
        },flashMs);
      };
      $('#gamePrompt').textContent='Watch the sequence…';
      say(`Remember this sequence of ${length} lights.`,'thinking','watching',{after:()=>setTimeout(flash,420)});
      pads.forEach(p=>p.addEventListener('click',()=>handlePad(Number(p.dataset.pad))));

      function handlePad(chosen){
        if(c.sequenceLocked || c.answered) return;
        const expected=c.sequence[c.sequenceInput.length];
        const pad=pads[chosen];
        pad.classList.add('is-lit');
        setTimeout(()=>pad.classList.remove('is-lit'),170);
        if(chosen===expected){
          c.sequenceInput.push(chosen);
          $('#sequenceCount').textContent=`${c.sequenceInput.length} of ${c.sequence.length} remembered`;
          if(c.sequenceInput.length===c.sequence.length){
            c.sequenceScore+=20;
            c.sequenceStreak++;
            c.sequenceConsecutiveMistakes=0;
            c.sequenceRoundResults.push({round:c.sequenceRound,correct:true,length:c.sequence.length});
            const fb=$('#sequenceFeedback');
            fb.textContent='Correct! Nice memory. Next round is coming.';
            fb.className='sequence-feedback correct';
            setMood('celebrate','happy');
            setStatus('Correct! Moving to the next round.');
            setTimeout(runSequenceRound,650);
          }
        }else{
          c.sequenceConsecutiveMistakes=(c.sequenceConsecutiveMistakes||0)+1;
          c.sequenceStreak=0;
          c.sequenceRoundResults.push({round:c.sequenceRound,correct:false,length:c.sequence.length,expected,chosen});
          const fb=$('#sequenceFeedback');
          fb.textContent=c.sequenceConsecutiveMistakes>=3?'Incorrect three times in a row. Moving to the next game.':'Incorrect — that is okay. Moving to the next round.';
          fb.className='sequence-feedback incorrect';
          setMood('encourage','encouraging');
          setStatus(c.sequenceConsecutiveMistakes>=3?'Three misses in a row — moving on.':'Incorrect. Next round.');
          if(c.sequenceConsecutiveMistakes>=3){setTimeout(completeSequenceGame,700);return;}
          setTimeout(runSequenceRound,700);
        }
      }
    }

    function completeSequenceGame(){
      const c=state.current;
      if(!c || c.sequenceCompleted) return;
      c.sequenceCompleted=true;
      c.answered=true;
      const rounds=Math.max(1,c.sequenceRoundResults?.length||1);
      const correctRounds=(c.sequenceRoundResults||[]).filter(r=>r.correct).length;
      const score=Math.round((correctRounds/rounds)*100);
      c.correct=score>=50?1:0;
      c.score=score;
      c.seconds=(performance.now()-c.started)/1000;
      state.results.push({...c,name:catalog.sequence.name,skipped:false,rounds,correctRounds,consecutiveMistakes:c.sequenceConsecutiveMistakes||0});
      if(window.CognitiveCareCompanion) window.CognitiveCareCompanion.onGameEvent({type:correctRounds?'correct':'incorrect'});
      setStatus('Game complete. Moving to the next game.');
      setMood(correctRounds>=Math.ceil(rounds/2)?'celebrate':'encourage',correctRounds>=Math.ceil(rounds/2)?'happy':'encouraging');
      setTimeout(()=>{if(state.index<4){state.index++;loadGame();}else finishSession();},800);
    }

    return true;
  }
  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},50);
    setTimeout(()=>clearInterval(timer),10000);
  }
})();