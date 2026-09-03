const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function loadHistory() {
  try {
    const raw = localStorage.getItem('ccner-history');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

const state = {
  soundOn: true,
  listening: false,
  view: 'home',
  games: [],
  index: 0,
  results: [],
  current: null,
  level: 1,
  history: loadHistory()
};

const catalog = {
  memory: { name: 'Familiar Object Memory', category: 'MEMORY', intro: 'Look carefully. I will hide the objects, then ask what you remember.', objects: ['☕','🍌','🥄','📖','💊','💧','🧴','🍚'] },
  find: { name: 'Find the Object', category: 'ATTENTION', intro: 'Find the object I ask for. Take your time and look carefully.', objects: ['☕','🍌','🥄','📖','💊','💧','🧴','🍚','🧢','☂️'] },
  sequence: { name: 'Sequence Recall', category: 'MEMORY + DAILY ROUTINE', intro: 'Watch the order, then tap the steps in the same order.', objects: ['🌅','🪥','🍽️','💊','💧','📖','🚶'] },
  pattern: { name: 'Pattern Completion', category: 'PATTERN RECOGNITION', intro: 'What comes next? Spot the repeating pattern.', objects: ['🍎','🥭','☕','🍌'] },
  local: { name: 'Local Object Memory', category: 'MEMORY + FAMILIAR OBJECTS', intro: 'Remember familiar everyday items. This is training, not diagnosis.', objects: ['🍚','☕','🥥','🧺','🪣','🌂','🥄','📖'] }
};

const stage = $('#stage');
const speechText = $('#speechText');
const thought = $('#thought');
const statusPill = $('#statusPill');
const statusText = $('#statusText');
const moodText = $('#moodText');
const chatInput = $('#chatInput');
const voiceHint = $('#voiceHint');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

function setMood(m, label = m) {
  if (stage) stage.className = `stage mood-${m}`;
  if (moodText) moodText.textContent = `Mood: ${label}`;
}

function setStatus(t, busy = false) {
  if (statusText) statusText.textContent = t;
  if (statusPill) statusPill.classList.toggle('busy', busy);
}

function speak(text) {
  if (!state.soundOn || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.94;
  u.pitch = 1.06;
  u.onstart = () => setStatus('Momo is talking', true);
  u.onend = () => setStatus('Ready to play');
  window.speechSynthesis.speak(u);
}

function say(text, mood = 'happy', label = mood) {
  if (speechText) speechText.textContent = text;
  if (thought) thought.textContent = mood === 'thinking' ? 'Let me think…' : mood === 'excited' ? 'Ooooh!' : mood === 'encourage' ? 'One step at a time.' : 'I’m listening…';
  setMood(mood, label);
  speak(text);
}

function showView(id) {
  $$('.view').forEach((v) => { v.hidden = true; });
  const target = $(id);
  if (!target) return;
  target.hidden = false;
  state.view = id.slice(1);
}

function openOverlay(title, body) {
  const panel = $('#overlayPanel');
  const content = $('#overlayContent');
  if (!panel || !content) return;
  content.innerHTML = `<p class="eyebrow">MOMO</p><h3>${title}</h3>${body}`;
  panel.hidden = false;
}

function closeOverlay() {
  const panel = $('#overlayPanel');
  if (panel) panel.hidden = true;
}

function respond(raw) {
  const l = String(raw || '').trim().toLowerCase();
  if (!l) return;
  setStatus('Momo is thinking', true);
  setMood('thinking', 'thinking');
  window.setTimeout(() => {
    if (/\b(hi|hello|hey)\b/.test(l)) say(pick(['Hello! I was wondering when you would come back. 😸', 'Hi! Ready for a little fun?']));
    else if (/play|game|activity/.test(l)) say('Game time! I am warming up my tiny paws. 🎮', 'excited', 'excited');
    else if (/remind|medicine|water|appointment|task/.test(l)) say('Reminders can cover medicine, hydration, appointments and daily activities in the full app.', 'encourage', 'helpful');
    else if (/progress|score|result|performance/.test(l)) showResultsFromHistory();
    else if (/thank/.test(l)) say('You’re welcome! We make a pretty good team. 😸', 'excited', 'playful');
    else say('My ears are listening! Type a message, or use the Talk button when voice input is available.', 'happy', 'curious');
  }, 250);
}

function startListening() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    say('Speech input is not available in this browser. You can still type to me.', 'encourage', 'helpful');
    return;
  }
  if (state.listening) return;
  const recognition = new Recognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  state.listening = true;
  if (voiceHint) voiceHint.hidden = false;
  setStatus('Listening…', true);
  recognition.onresult = (e) => respond(e.results?.[0]?.[0]?.transcript || '');
  recognition.onerror = () => say('I could not catch that. Try again, or type to me. 😸', 'encourage', 'encouraging');
  recognition.onend = () => { state.listening = false; if (voiceHint) voiceHint.hidden = true; };
  try { recognition.start(); } catch (_) { state.listening = false; if (voiceHint) voiceHint.hidden = true; }
}

function adaptiveLevel() {
  if (!state.history.length) return 1;
  const last = state.history[state.history.length - 1];
  const accuracy = Number(last.accuracy || 0);
  const level = Number(last.level || 1);
  return accuracy >= 0.85 ? Math.min(3, level + 1) : accuracy < 0.6 ? Math.max(1, level - 1) : level;
}

function startSession() {
  state.level = adaptiveLevel();
  state.games = shuffle(Object.keys(catalog));
  state.index = 0;
  state.results = [];
  $('#todayStatus').textContent = 'In progress';
  showView('#gameView');
  say('Let’s go! Five tiny challenges, one at a time. I’ll gently adjust the next session. 😸', 'excited', 'excited');
  window.setTimeout(loadGame, 450);
}

function loadGame() {
  const key = state.games[state.index];
  const game = catalog[key];
  state.current = { key, started: performance.now(), answered: false, score: 0, correct: 0, seconds: 0 };
  $('#gameCategory').textContent = game.category;
  $('#gameTitle').textContent = game.name;
  $('#gameCounter').textContent = `Game ${state.index + 1} of 5`;
  $('#progressBar').style.width = `${state.index * 20}%`;
  $('#gamePrompt').textContent = game.intro;
  $('#gameArea').innerHTML = '';
  $('#gameFeedback').textContent = '';
  $('#gamePrimary').textContent = 'Start game';
  $('#gamePrimary').disabled = false;
  $('#gamePrimary').onclick = () => runGame(key);
  $('#gameSkip').onclick = () => finishGame(false, true);
  $('#gameMomoText').textContent = state.level === 3 ? 'A little extra challenge today!' : 'No rush. I’ll be your cheerleader.';
  say(game.intro, 'happy', 'ready');
}

function runGame(key) {
  const fn = { memory: gameMemory, find: gameFind, sequence: gameSequence, pattern: gamePattern, local: gameLocal }[key];
  if (!fn || !state.current || state.current.answered) return;
  $('#gamePrimary').disabled = true;
  fn();
}

function finishGame(correct, skipped = false) {
  if (!state.current || state.current.answered) return;
  state.current.answered = true;
  state.current.correct = correct ? 1 : 0;
  state.current.score = correct ? 100 : 0;
  state.current.seconds = (performance.now() - state.current.started) / 1000;
  state.results.push({ ...state.current, name: catalog[state.current.key].name, skipped });
  if (window.CognitiveCareCompanion) window.CognitiveCareCompanion.onGameEvent({ type: correct ? 'correct' : 'incorrect' });
  window.setTimeout(() => {
    if (state.index < 4) { state.index += 1; loadGame(); }
    else finishSession();
  }, 500);
}

function renderChoices(items, onPick) {
  const area = $('#gameArea');
  area.innerHTML = `<div class="answer-grid">${items.map((x, i) => `<button class="answer-tile" data-i="${i}" type="button">${x}</button>`).join('')}</div>`;
  $$('.answer-tile').forEach((button) => {
    button.onclick = () => onPick(items[Number(button.dataset.i)]);
  });
}

function gameMemory() {
  const n = state.level + 2;
  const items = shuffle(catalog.memory.objects).slice(0, n);
  const seconds = Math.max(3.2, 6 - state.level);
  $('#gamePrompt').textContent = `Remember ${n} objects for ${seconds.toFixed(1)} seconds.`;
  $('#gameArea').innerHTML = `<div class="memory-show">${items.map((x) => `<div class="object-tile">${x}</div>`).join('')}</div>`;
  say('Eyes here… remember these little things!', 'thinking', 'watching');
  window.setTimeout(() => {
    if (state.current?.answered) return;
    const target = pick(items);
    const distractors = shuffle(catalog.memory.objects.filter((x) => !items.includes(x))).slice(0, Math.min(3, items.length));
    $('#gamePrompt').textContent = 'Which object was shown?';
    renderChoices(shuffle([target, ...distractors]), (answer) => finishGame(answer === target));
  }, seconds * 1000);
}

function gameFind() {
  const items = shuffle(catalog.find.objects).slice(0, state.level + 4);
  const target = pick(items);
  $('#gamePrompt').textContent = `Find the ${target} and tap it.`;
  renderChoices(items, (answer) => finishGame(answer === target));
  say(`Can you find ${target}? Detective eyes! 👀`, 'happy', 'playful');
}

function gameSequence() {
  const seq = shuffle(catalog.sequence.objects).slice(0, state.level + 2);
  $('#gamePrompt').textContent = 'Watch the sequence…';
  $('#gameArea').innerHTML = `<div class="sequence-grid">${seq.map((x, i) => `<button class="sequence-tile" data-i="${i}" type="button">${x}</button>`).join('')}</div>`;
  const tiles = $$('.sequence-tile');
  let flashIndex = 0;
  const flash = () => {
    tiles.forEach((t) => t.classList.remove('active'));
    if (flashIndex < seq.length) {
      tiles[flashIndex].classList.add('active');
      flashIndex += 1;
      window.setTimeout(flash, 700);
      return;
    }
    window.setTimeout(() => {
      tiles.forEach((t) => { t.textContent = '?'; t.classList.remove('active'); });
      $('#gamePrompt').textContent = 'Tap the sequence in the same order.';
      let position = 0;
      tiles.forEach((tile) => {
        tile.onclick = () => {
          if (state.current?.answered) return;
          const chosenIndex = Number(tile.dataset.i);
          if (chosenIndex === position) {
            tile.textContent = seq[position];
            position += 1;
            if (position === seq.length) finishGame(true);
          } else {
            finishGame(false);
          }
        };
      });
    }, 450);
  };
  flash();
  say('Watch closely… I’ll hide the order soon!', 'thinking', 'focused');
}

function gamePattern() {
  const [a, b] = pick([['🍎','🥭'], ['☕','💧'], ['🍚','🥥'], ['🥄','🍌']]);
  const seq = state.level === 1 ? [a,b,a,b] : state.level === 2 ? [a,b,a,b,a] : [a,b,a,b,a,b];
  $('#gamePrompt').textContent = 'What comes next?';
  $('#gameArea').innerHTML = `<div class="pattern">${seq.map((x) => `<span>${x}</span>`).join('')}<span class="pattern-question">?</span></div>`;
  const wrong = pick(catalog.pattern.objects.filter((x) => x !== a && x !== b));
  renderChoices(shuffle([a, b, wrong]), (answer) => finishGame(answer === a));
  say('Hmm… I can see a rhythm. What comes next?', 'thinking', 'thinking');
}

function gameLocal() {
  const n = state.level + 2;
  const items = shuffle(catalog.local.objects).slice(0, n);
  const seconds = Math.max(3, 5.5 - state.level * 0.6);
  $('#gamePrompt').textContent = `Remember these familiar everyday items for ${seconds.toFixed(1)} seconds.`;
  $('#gameArea').innerHTML = `<div class="memory-show">${items.map((x) => `<div class="object-tile">${x}</div>`).join('')}</div>`;
  say('Familiar everyday things. Ready?', 'happy', 'friendly');
  window.setTimeout(() => {
    if (state.current?.answered) return;
    const target = pick(items);
    const choices = shuffle([target, ...shuffle(catalog.local.objects.filter((x) => !items.includes(x))).slice(0, 3)]);
    $('#gamePrompt').textContent = 'Which one did you see?';
    renderChoices(choices, (answer) => finishGame(answer === target));
  }, seconds * 1000);
}

function finishSession() {
  if (window.CognitiveCareCompanion) window.CognitiveCareCompanion.onGameEvent({ type: 'complete' });
  const correct = state.results.reduce((sum, result) => sum + result.correct, 0);
  const avg = state.results.reduce((sum, result) => sum + result.seconds, 0) / Math.max(1, state.results.length);
  const session = { date: new Date().toISOString(), score: correct * 20, accuracy: correct / 5, avgTime: avg, level: state.level, results: state.results };
  state.history.push(session);
  state.history = state.history.slice(-8);
  try { localStorage.setItem('ccner-history', JSON.stringify(state.history)); } catch (_) {}
  renderResults(session);
  showView('#resultsView');
  $('#todayStatus').textContent = 'Complete';
}

function renderResults(s) {
  $('#overallScore').textContent = `${s.score}%`;
  $('#overallAccuracy').textContent = `${Math.round(s.accuracy * 100)}%`;
  $('#gamesCompleted').textContent = `${s.results.length} / 5`;
  $('#avgTime').textContent = `${s.avgTime.toFixed(1)}s`;
  const prev = state.history.length > 1 ? state.history[state.history.length - 2] : null;
  $('#trendBadge').textContent = prev ? (s.score > prev.score ? '↑ Improving' : s.score < prev.score ? '↓ Lower today' : '→ Similar') : 'First session';
  $('#resultRows').innerHTML = s.results.map((r) => `<div class="result-row"><div><div class="result-name">${r.name}</div><div class="result-detail">${r.correct ? 'Correct' : 'Not correct'} · ${r.seconds.toFixed(1)}s${r.skipped ? ' · skipped' : ''}</div></div><span class="result-detail">Training score</span><span class="score-pill">${r.score}%</span></div>`).join('');
  $('#resultHeading').textContent = s.score >= 80 ? 'Fantastic work!' : s.score >= 60 ? 'Nice work!' : 'Good effort!';
  $('#resultMessage').textContent = s.score >= 80 ? 'Your paws… I mean brain… were on fire today!' : s.score >= 60 ? 'A steady session. We can keep practicing together.' : 'Every session is practice. We can make the next one gentler and try again.';
}

function showResultsFromHistory() {
  if (!state.history.length) {
    openOverlay('Progress', '<p>No completed session yet. Start today’s activity and I’ll keep a simple local history of training performance.</p>');
    return;
  }
  renderResults(state.history[state.history.length - 1]);
  showView('#resultsView');
}

window.CognitiveCareCompanion = {
  onGameEvent(event) {
    if (event?.type === 'correct') say('Yes! You got it! Nice one! 😸', 'excited', 'celebrating');
    if (event?.type === 'incorrect') say('Not quite — and that is completely okay. Let’s keep going together.', 'encourage', 'encouraging');
    if (event?.type === 'complete') say('We did it! Nice work finishing the activity.', 'excited', 'celebrating');
  }
};

$('#sendButton').onclick = () => { respond(chatInput.value); chatInput.value = ''; };
chatInput.onkeydown = (e) => { if (e.key === 'Enter') $('#sendButton').click(); };
$('#soundToggle').onclick = () => { state.soundOn = !state.soundOn; $('#soundToggle').textContent = state.soundOn ? '🔊' : '🔇'; if (!state.soundOn && 'speechSynthesis' in window) window.speechSynthesis.cancel(); };

$$('[data-action]').forEach((button) => {
  button.onclick = () => {
    const action = button.dataset.action;
    if (action === 'start') startSession();
    if (action === 'talk') startListening();
    if (action === 'reminder') openOverlay('Reminders', '<div class="reminder"><span>💊 Medicine</span><strong>Check today’s reminder</strong></div><div class="reminder"><span>💧 Hydration</span><strong>Drink some water</strong></div><div class="reminder"><span>📅 Appointment</span><strong>No demo appointment set</strong></div><p>This demo does not send real alerts yet.</p>');
    if (action === 'progress') showResultsFromHistory();
  };
});

$('#homeButton').onclick = () => { closeOverlay(); showView('#homeView'); };
$('#backHome').onclick = () => showView('#homeView');
$('#playAgain').onclick = startSession;
$('#closeOverlay').onclick = closeOverlay;
$('#overlayPanel').addEventListener('click', (event) => { if (event.target.id === 'overlayPanel') closeOverlay(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeOverlay(); });

setInterval(() => {
  if (state.view !== 'home' || state.listening || statusText.textContent.includes('thinking') || statusText.textContent.includes('talking')) return;
  thought.textContent = pick(['I’m ready when you are.', 'Psst… want to play?', 'My paws are warmed up!', 'What shall we do next?']);
}, 5200);

$('#todayStatus').textContent = state.history.length ? 'Last session complete' : 'Not started';
