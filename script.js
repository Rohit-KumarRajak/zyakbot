let isTalkModeOn = false;
let recognition = null;
let synth = window.speechSynthesis;
let lastBotMessage = "";
let debounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  const talkBtn = document.getElementById("talkModeBtn");
  talkBtn.addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    talkBtn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn) {
      if (lastBotMessage) speakOutLoud(lastBotMessage);
      startContinuousVoiceInput();
    } else {
      stopRecognition();
      synth.cancel();
    }
  });
});

function sendMessage(message = null) {
  const input = document.getElementById("userInput");
  const msg = message || input.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  input.value = "";
  input.disabled = true;
  addMessage("bot", "⏳ Thinking...");

  fetch("https://zyakbot-backend.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message: msg }),
  })
    .then(res => res.json())
    .then(data => {
      lastBotMessage = data.reply;
      replaceLastBotMessage(data.reply);
      if (isTalkModeOn) {
        speakOutLoud(data.reply, () => {
          if (isTalkModeOn) startContinuousVoiceInput();
        });
      }
    })
    .catch(() => replaceLastBotMessage("❌ Error connecting to the server."))
    .finally(() => (input.disabled = false));
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  const chat = document.getElementById("chat");
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

function replaceLastBotMessage(text) {
  const bots = document.getElementsByClassName("bot-msg");
  if (bots.length) bots[bots.length - 1].textContent = text;
}

function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return alert("🎤 Voice recognition not supported.");
  stopRecognition();
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = e => sendMessage(e.results[0][0].transcript);
  recognition.start();
}

function startContinuousVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return;
  stopRecognition();
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = e => {
    clearTimeout(debounceTimer);
    speakStop();
    sendMessage(e.results[0][0].transcript);
  };

  recognition.onerror = e => {
    if (isTalkModeOn && e.error !== "no-speech") {
      debounceTimer = setTimeout(startContinuousVoiceInput, 1500);
    }
  };

  recognition.onend = () => {
    if (isTalkModeOn) {
      debounceTimer = setTimeout(startContinuousVoiceInput, 1000);
    }
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
}

function speakOutLoud(text, onEnd) {
  if (!synth) return;
  speakStop();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;
  utter.onend = () => onEnd?.();
  synth.speak(utter);
}

function speakStop() {
  if (synth.speaking) synth.cancel();
}
