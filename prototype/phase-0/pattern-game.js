/* Pattern Recognition — original project content using the supplied video only for interaction structure. */
(function(){
  const rounds=[
    {type:'objects',label:'Everyday objects',sequence:['🍎','🥭','🍎','🥭','🍎'],answer:'🥭',choices:['🥭','🍌','🍎','🍊'],hint:'The two fruits take turns.'},
    {type:'numbers',label:'Number pattern',sequence:['2','4','6','8','10'],answer:'12',choices:['11','12','14','16'],hint:'The numbers increase by the same amount each time.'},
    {type:'routine',label:'Daily-life pattern',sequence:['☕','💧','☕','💧','☕'],answer:'💧',choices:['💧','🍚','📖','💊'],hint:'The two daily items alternate.'},
    {type:'numbers',label:'Growing pattern',sequence:['5','10','15','20','25'],answer:'30',choices:['28','30','35','40'],hint:'Count forward in equal steps.'},
    {type:'objects',label:'Familiar object pattern',sequence:['🥄','🍽️','🥄','🍽️','🥄'],answer:'🍽️',choices:['🍽️','☕','🥄','💧'],hint:'The same two objects repeat in order.'}
  ];

  function install(){
    if(typeof state==='undefined'||typeof catalog==='undefined'||typeof $==='undefined'||typeof runGame!=='function'||typeof loadGame!=='function')return false;
    catalog.pattern={name:'Pattern Recognition',category:'PATTERN RECOGNITION',intro:'Look at the pattern and choose what comes next. Take your time and notice the rhythm.'};
    const oldRunGame=runGame;
    window.runGame=function(key){if(key==='pattern')return window.gamePatternRecognition();return oldRunGame(key)};
    window.gamePatternRecognition=function(){
      const c=state.current;if(!c||c.answered)return;
      c.patternRound=0;c.patternCorrect=0;c.patternTotal=0;c.patternConsecutiveMistakes=0;c.patternMaxRound=rounds.length;c.patternCompleted=false;
      runPatternRound();
    };

    function makeRound(base,index){
      const level=Number(state.level||1);
      let sequence=[...base.sequence];
      let choices=[...base.choices];
      if(level>=2 && index===0) sequence=['🍎','🥭','🍎','🥭','🍎','🥭'];
      if(level>=3 && index===1){sequence=['3','6','9','12','15'];choices=['18','20','21','24'];}
      if(level>=3 && index===4){sequence=['🥄','🍽️','🥄','🍽️','🥄','🍽️'];}
      return { ...base, sequence, choices:shuffle(choices) };
    }

    function runPatternRound(){
      const c=state.current;if(!c||c.answered)return;
      c.patternRound++;
      if(c.patternRound>c.patternMaxRound){completePattern();return;}
      const index=c.patternRound-1,base=makeRound(rounds[index],index);
      c.patternExpected=base.answer;
      c.patternSequence=base.sequence;
      c.patternLocked=false;
      $('#gamePrompt').textContent='What comes next in the pattern?';
      $('#gameArea').innerHTML=`<div class="pattern-stage pattern-transition">
        <div class="pattern-meta"><span class="pattern-chip">Question <strong>${c.patternRound} / ${c.patternMaxRound}</strong></span><span class="pattern-chip">Correct <strong>${c.patternCorrect}</strong></span><span class="pattern-chip">Mistakes <strong>${c.patternConsecutiveMistakes} / 3</strong></span></div>
        <div class="pattern-progress-line"><span style="width:${(c.patternRound-1)/c.patternMaxRound*100}%"></span></div>
        <div class="pattern-instruction">What comes next?</div>
        <div class="pattern-sequence" aria-label="Pattern sequence">${base.sequence.map((item,i)=>`<div class="pattern-cell" style="--delay:${i*45}ms">${item}</div>`).join('')}<div class="pattern-cell pattern-question">?</div></div>
        <div class="pattern-options" aria-label="Choose the next item">${base.choices.map((choice,i)=>`<button class="pattern-option" type="button" data-choice="${choice}" aria-label="Choice ${i+1}">${choice}</button>`).join('')}</div>
        <div class="pattern-feedback" id="patternFeedback"></div>
        <div class="pattern-hint">${base.hint}</div>
      </div>`;
      say(c.patternRound===1?'Look for the simple rhythm. What comes next?':'Nice. Look carefully at the pattern before you choose.','thinking','focused');
      $$('.pattern-option').forEach(btn=>btn.addEventListener('click',()=>answerPattern(btn.dataset.choice)));
    }

    function answerPattern(answer){
      const c=state.current;if(!c||c.patternLocked)return;
      c.patternLocked=true;c.patternTotal++;
      const ok=answer===c.patternExpected;
      const fb=$('#patternFeedback');
      if(ok){
        c.patternCorrect++;c.patternConsecutiveMistakes=0;
        fb.textContent='Correct! You spotted the pattern. Moving to the next one.';fb.className='pattern-feedback correct';
        setMood('celebrate','happy');setStatus('Correct! Next pattern.');
        $$('.pattern-option').forEach(b=>b.classList.toggle('correct',b.dataset.choice===answer));
        if(window.CognitiveCareCompanion)window.CognitiveCareCompanion.onGameEvent({type:'correct'});
      }else{
        c.patternConsecutiveMistakes++;
        fb.textContent=c.patternConsecutiveMistakes>=3?'Three misses in a row — that is okay. Moving to the next game.':'Not quite. That is okay — let’s try the next pattern.';
        fb.className='pattern-feedback incorrect';
        setMood('encourage','encouraging');setStatus(c.patternConsecutiveMistakes>=3?'Three misses in a row — moving on.':'Not quite. Next pattern.');
        $$('.pattern-option').forEach(b=>{if(b.dataset.choice===answer)b.classList.add('wrong');if(b.dataset.choice===c.patternExpected)b.classList.add('correct')});
        if(window.CognitiveCareCompanion)window.CognitiveCareCompanion.onGameEvent({type:'incorrect'});
      }
      setTimeout(()=>{if(c.patternConsecutiveMistakes>=3)completePattern();else runPatternRound()},850);
    }

    function completePattern(){
      const c=state.current;if(!c||c.patternCompleted)return;c.patternCompleted=true;c.answered=true;
      const total=Math.max(1,c.patternTotal||1),score=Math.round((c.patternCorrect/total)*100);
      c.correct=score>=50?1:0;c.score=score;c.seconds=(performance.now()-c.started)/1000;
      state.results.push({...c,name:catalog.pattern.name,skipped:false,rounds:c.patternTotal,correctItems:c.patternCorrect,totalItems:total,consecutiveMistakes:c.patternConsecutiveMistakes||0});
      setStatus('Pattern game complete. Moving to the next game.');setMood(score>=50?'celebrate':'encourage',score>=50?'happy':'encouraging');
      setTimeout(()=>{if(state.index<4){state.index++;loadGame()}else finishSession()},800);
    }
    return true;
  }
  if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},50);setTimeout(()=>clearInterval(timer),10000)}
})();
