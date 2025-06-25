let isTalkModeOn = false;
let recognition = null;
const synth = window.speechSynthesis;
let lastBotMessage = "";

// Initialize Talk Mode button
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    const btn = document.getElementById("talkModeBtn");
    btn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn) {
      if (lastBotMessage) speakOutLoud(lastBotMessage);
      startContinuousVoiceInput();
    } else {
      stopRecognition();
      synth.cancel(); // stop any ongoing speech
    }
  });
});

// Send a message (called both manually & via voice)
function sendMessage(message = null) {
  const userInput = document.getElementById("userInput");
  const msg = message || userInput.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  userInput.value = "";
  userInput.disabled = true;
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
        // Speak and then resume listening afterwards
        speakOutLoud(data.reply, () => {
          if (isTalkModeOn) startContinuousVoiceInput();
        });
      }
    })
    .catch(() => replaceLastBotMessage("❌ Error connecting to the server."))
    .finally(() => userInput.disabled = false);
}

// Display a chat message
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  const chat = document.getElementById("chat");
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// Update the bot's last message
function replaceLastBotMessage(text) {
  const bots = document.querySelectorAll(".bot-msg");
  if (bots.length) bots[bots.length - 1].textContent = text;
}

// Manual voice input (single-shot)
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    return alert("🎤 Voice recognition not supported.");
  }
  stopRecognition();
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US"; // or "hi-IN"
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = e => sendMessage(e.results[0][0].transcript);
  recognition.start();
}

// Continuous 'Talk Mode' voice listening
function startContinuousVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return;
  stopRecognition();
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = e => {
    sendMessage(e.results[0][0].transcript);
  };
  recognition.onerror = () => {
    if (isTalkModeOn) setTimeout(startContinuousVoiceInput, 1000);
  };
  recognition.onend = () => {
    if (isTalkModeOn) startContinuousVoiceInput();
  };
  recognition.start();
}

// Stop listening
function stopRecognition() {
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
}

// Text-to-speech playback
function speakOutLoud(text, onEndCallback = null) {
  if (!synth) return;
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;
  if (onEndCallback) utter.onend = onEndCallback;
  synth.speak(utter);
}
