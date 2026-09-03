const state = {
  soundOn: true,
  listening: false,
  mood: "happy",
};

const stage = document.querySelector("#stage");
const speechText = document.querySelector("#speechText");
const thought = document.querySelector("#thought");
const statusPill = document.querySelector("#statusPill");
const statusText = document.querySelector("#statusText");
const moodText = document.querySelector("#moodText");
const chatInput = document.querySelector("#chatInput");
const sendButton = document.querySelector("#sendButton");
const soundToggle = document.querySelector("#soundToggle");
const voiceHint = document.querySelector("#voiceHint");

const replies = {
  hello: [
    "Hello! I was wondering when you would come back. 😸",
    "Hi! Ready for a little fun? I promise there will be no boring lectures.",
  ],
  activity: [
    "Game time! I am warming up my tiny paws. 🎮",
    "Okay, let's play. You do the thinking, I will do the cheering!",
  ],
  reminder: [
    "Reminders are important. In the full app, I can help you check today's medicine, water, appointments and tasks.",
  ],
  progress: [
    "I can show your recent activity and how you are doing over time. In the full app, your caregiver can see the appropriate detailed report too.",
  ],
  thanks: [
    "You're welcome! See? We make a pretty good team. 😸",
  ],
  default: [
    "Hmm… I heard you. In the real AI version, I will understand much more and keep the conversation going.",
    "Interesting! My ears are listening. The next version will connect me to the real AI brain.",
    "Okay, I am thinking… and yes, I still look adorable while doing it. 😼",
  ],
};

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setMood(mood, label = mood) {
  state.mood = mood;
  stage.className = `stage mood-${mood}`;
  moodText.textContent = `Mood: ${label}`;
}

function setStatus(text, busy = false) {
  statusText.textContent = text;
  statusPill.classList.toggle("busy", busy);
}

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1.05;
  utterance.volume = 1;
  utterance.onstart = () => setStatus("Momo is talking", true);
  utterance.onend = () => setStatus("Ready to talk", false);
  window.speechSynthesis.speak(utterance);
}

function say(text, mood = "happy", label = mood) {
  speechText.textContent = text;
  thought.textContent = mood === "thinking" ? "Let me think…" : mood === "excited" ? "Ooooh!" : "I’m listening…";
  setMood(mood, label);
  speak(text);
}

function respond(raw) {
  const text = raw.trim();
  if (!text) return;
  const lower = text.toLowerCase();
  setStatus("Momo is thinking", true);
  setMood("thinking", "thinking");

  window.setTimeout(() => {
    if (/\b(hi|hello|hey|good morning|good evening)\b/.test(lower)) {
      say(pick(replies.hello), "happy", "happy");
    } else if (/\b(play|game|activity|let's play)\b/.test(lower)) {
      say(pick(replies.activity), "excited", "excited");
    } else if (/\b(remind|reminder|medicine|water|appointment|task)\b/.test(lower)) {
      say(pick(replies.reminder), "encourage", "helpful");
    } else if (/\b(progress|score|result|performance)\b/.test(lower)) {
      say(pick(replies.progress), "happy", "happy");
    } else if (/\b(thank|thanks)\b/.test(lower)) {
      say(pick(replies.thanks), "excited", "playful");
    } else {
      say(pick(replies.default), "happy", "curious");
    }
    setStatus("Ready to talk", false);
  }, 520);
}

function startListening() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    say("Your browser does not provide speech recognition here. You can still type to me, and voice output will work if your browser supports it.", "encourage", "helpful");
    return;
  }

  if (state.listening) return;
  const recognition = new Recognition();
  recognition.lang = document.documentElement.lang || "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  state.listening = true;
  voiceHint.hidden = false;
  setStatus("Listening…", true);
  setMood("happy", "listening");

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    respond(transcript);
  };
  recognition.onerror = () => {
    say("I could not catch that. Try again, or type to me. 😸", "encourage", "encouraging");
  };
  recognition.onend = () => {
    state.listening = false;
    voiceHint.hidden = true;
    if (!speechText.textContent) setStatus("Ready to talk", false);
  };
  recognition.start();
}

sendButton.addEventListener("click", () => {
  respond(chatInput.value);
  chatInput.value = "";
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendButton.click();
  }
});

soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "🔊" : "🔇";
  soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  if (!state.soundOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
  setStatus(state.soundOn ? "Voice on" : "Voice muted", false);
});

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "talk") startListening();
    if (action === "activity") say(pick(replies.activity), "excited", "excited");
    if (action === "reminder") say(pick(replies.reminder), "encourage", "helpful");
    if (action === "progress") say(pick(replies.progress), "happy", "happy");
  });
});

document.querySelectorAll("[data-mood]").forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    const lines = {
      happy: "Yay! I am feeling cheerful today! 😸",
      excited: "Ooooh! Something fun is happening!",
      thinking: "Hmm… give me a moment. My little brain wheels are turning.",
      encourage: "That is okay. We can take it one step at a time. I am right here with you.",
      surprised: "WHOA! I did not see that coming! 😮",
      sleepy: "Mmm… I could use a tiny cat nap. But I am still listening.",
    };
    say(lines[mood], mood, mood);
  });
});

// Tiny game-event hook for the future deterministic game engine.
window.CognitiveCareCompanion = {
  onGameEvent(event) {
    if (!event) return;
    if (event.type === "correct") say("Yes! You got it! That was a good memory. 😸", "excited", "celebrating");
    if (event.type === "incorrect") say("Not quite — and that is completely okay. Let's keep going together.", "encourage", "encouraging");
    if (event.type === "complete") say("We did it! Nice work finishing the activity.", "excited", "celebrating");
  },
};

// Initial idle behavior: the character feels alive without becoming distracting.
window.setInterval(() => {
  if (state.listening || statusText.textContent.includes("thinking") || statusText.textContent.includes("talking")) return;
  const lines = ["I’m ready when you are.", "Psst… want to play?", "My paws are warmed up!", "What shall we do next?"];
  thought.textContent = pick(lines);
}, 5200);
