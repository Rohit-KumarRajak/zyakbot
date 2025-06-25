let isTalkModeOn = false;
let synth = window.speechSynthesis;
let lastBotMessage = "";

// Talk Mode toggle button
document.addEventListener("DOMContentLoaded", () => {
  const talkBtn = document.getElementById("talkModeBtn");
  talkBtn.addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    talkBtn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn && lastBotMessage) {
      speakOutLoud(lastBotMessage);
    } else {
      speakStop();
    }
  });
});

// Send message function
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
      if (isTalkModeOn) speakOutLoud(data.reply);
    })
    .catch(() => replaceLastBotMessage("❌ Error connecting to the server."))
    .finally(() => {
      input.disabled = false;
    });
}

// Add chat message to UI
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  const chat = document.getElementById("chat");
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// Replace thinking message with bot reply
function replaceLastBotMessage(text) {
  const bots = document.getElementsByClassName("bot-msg");
  if (bots.length) bots[bots.length - 1].textContent = text;
}

// Manual voice input (Speak button)
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    return alert("🎤 Voice recognition not supported in this browser.");
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    sendMessage(transcript);
  };

  recognition.onerror = (e) => {
    console.error("Mic error:", e.error);
  };

  recognition.start();
}

// Speak bot's message
function speakOutLoud(text) {
  if (!synth) return;
  speakStop();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;

  synth.speak(utter);
}

// Stop current speech
function speakStop() {
  if (synth.speaking) synth.cancel();
}
