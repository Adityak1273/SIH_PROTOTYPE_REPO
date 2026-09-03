/* Everyday Category Match — original project content using the supplied video only for interaction structure. */
(function(){
  const rounds=[
    {category:'Kitchen',items:['Steel plate','Cooking spoon','Masala box','Water bottle'],distractors:['Pillow','Notebook','Shawl']},
    {category:'Bathroom',items:['Soap','Toothbrush','Bath towel','Comb'],distractors:['Rice bowl','Pillow','Notebook']},
    {category:'Study Table',items:['Notebook','Pen','Reading glasses','Calendar'],distractors:['Cooking pot','Towel','Sofa cushion']},
    {category:'Bedroom',items:['Pillow','Bedsheet','Shawl','Alarm clock'],distractors:['Tea cup','Soap','Newspaper']},
    {category:'Living Room',items:['Sofa cushion','Newspaper','Remote control','Table lamp'],distractors:['Toothbrush','Cooking spoon','Bath bucket']}
  ];

  function install(){
    if(typeof state==='undefined'||typeof catalog==='undefined'||typeof $==='undefined'||typeof runGame!=='function'||typeof loadGame!=='function')return false;
    catalog.find={name:'Everyday Category Match',category:'ATTENTION + DAILY-LIFE RECOGNITION',intro:'Choose the familiar group that best matches the items shown.'};
    const oldRunGame=runGame;
    window.runGame=function(key){if(key==='find')return window.gameCategoryMatch();return oldRunGame(key)};
    window.gameCategoryMatch=function(){
      const c=state.current;if(!c||c.answered)return;
      c.categoryRound=0;c.categoryCorrect=0;c.categoryTotal=0;c.categoryConsecutiveMistakes=0;c.categoryMaxRound=rounds.length;c.categoryResults=[];
      runCategoryRound();
    };

    function runCategoryRound(){
      const c=state.current;if(!c||c.answered)return;
      c.categoryRound++;
      if(c.categoryRound>c.categoryMaxRound){completeCategory();return;}
      const base=rounds[c.categoryRound-1];
      const count=Math.min(4,3+Math.floor((c.categoryRound-1)/2));
      const items=shuffle([...base.items]).slice(0,count);
      const choices=shuffle([base.category,...['Kitchen','Bathroom','Study Table','Bedroom','Living Room'].filter(x=>x!==base.category).slice(0,2+Math.floor((c.categoryRound-1)/2))]);
      c.categoryExpected=base.category;c.categoryItems=items;c.categoryLocked=false;
      $('#gamePrompt').textContent='What do these familiar things have in common?';
      $('#gameArea').innerHTML=`<div class="category-stage category-transition">
        <div class="category-meta"><span class="category-chip">Round <strong>${c.categoryRound} / ${c.categoryMaxRound}</strong></span><span class="category-chip">Score <strong>${c.categoryCorrect}</strong></span><span class="category-chip">Mistakes <strong>${c.categoryConsecutiveMistakes} / 3</strong></span></div>
        <div class="category-instruction">Which place do these things belong to?</div>
        <div class="category-items">${items.map((item,i)=>`<div class="category-item" style="--delay:${i*55}ms">${item}</div>`).join('')}</div>
        <div class="category-options" aria-label="Choose a category">${choices.map(cat=>`<button class="category-option" type="button" data-category="${cat}">${cat}</button>`).join('')}</div>
        <div class="category-feedback" id="categoryFeedback"></div>
        <div class="category-progress" id="categoryProgress">Question ${c.categoryRound} of ${c.categoryMaxRound}</div>
      </div>`;
      say(`Look at these familiar things. Which place do they belong to?`,'happy','curious');
      $$('.category-option').forEach(btn=>btn.addEventListener('click',()=>answerCategory(btn.dataset.category)));
    }

    function answerCategory(answer){
      const c=state.current;if(!c||c.categoryLocked)return;
      c.categoryLocked=true;c.categoryTotal++;
      const ok=answer===c.categoryExpected;
      if(ok){
        c.categoryCorrect++;c.categoryConsecutiveMistakes=0;
        const fb=$('#categoryFeedback');fb.textContent='Correct! Nice connection. Moving to the next one.';fb.className='category-feedback correct';
        setMood('celebrate','happy');setStatus('Correct! Next one.');
        $$('.category-option').forEach(b=>b.classList.toggle('correct',b.dataset.category===answer));
      }else{
        c.categoryConsecutiveMistakes++;
        const fb=$('#categoryFeedback');fb.textContent=c.categoryConsecutiveMistakes>=3?'That was a tricky one. Three misses in a row — moving to the next game.':'Not quite. That is okay — moving to the next one.';fb.className='category-feedback incorrect';
        setMood('encourage','encouraging');setStatus(c.categoryConsecutiveMistakes>=3?'Three misses in a row — moving on.':'Not quite. Next one.');
        $$('.category-option').forEach(b=>{if(b.dataset.category===answer)b.classList.add('wrong');if(b.dataset.category===c.categoryExpected)b.classList.add('correct')});
      }
      setTimeout(()=>{if(c.categoryConsecutiveMistakes>=3)completeCategory();else runCategoryRound()},850);
    }

    function completeCategory(){
      const c=state.current;if(!c||c.categoryCompleted)return;c.categoryCompleted=true;c.answered=true;
      const total=Math.max(1,c.categoryTotal||1),score=Math.round((c.categoryCorrect/total)*100);
      c.correct=score>=50?1:0;c.score=score;c.seconds=(performance.now()-c.started)/1000;
      state.results.push({...c,name:catalog.find.name,skipped:false,rounds:c.categoryResults?.length||c.categoryRound,correctItems:c.categoryCorrect,totalItems:total,consecutiveMistakes:c.categoryConsecutiveMistakes||0});
      if(window.CognitiveCareCompanion)window.CognitiveCareCompanion.onGameEvent({type:c.correct?'correct':'incorrect'});
      setStatus('Game complete. Moving to the next game.');setMood(score>=50?'celebrate':'encourage',score>=50?'happy':'encouraging');
      setTimeout(()=>{if(state.index<4){state.index++;loadGame()}else finishSession()},800);
    }
    return true;
  }
  if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer)},50);setTimeout(()=>clearInterval(timer),10000)}
})();
