let isTalkModeOn = false;
const synth = window.speechSynthesis;
let lastBotMessage = "";

document.addEventListener("DOMContentLoaded", () => {
  const talkBtn = document.getElementById("talkModeBtn");
  talkBtn.addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    talkBtn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";
    if (isTalkModeOn && lastBotMessage) speakOutLoud(lastBotMessage);
    if (!isTalkModeOn) speakStop();
  });
});

function sendMessage(message = null) {
  const input = document.getElementById("userInput");
  const msg = message || input.value.trim();
  if (!msg) return;

  speakStop();
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
    .catch(err => {
      console.error("❌ Fetch error:", err);
      replaceLastBotMessage("❌ Error connecting to the server.");
    })
    .finally(() => {
      input.disabled = false;
      input.focus();
    });
}

function addMessage(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

function replaceLastBotMessage(text) {
  const chat = document.getElementById("chat");
  const bots = chat.getElementsByClassName("bot-msg");
  if (bots.length > 0) {
    bots[bots.length - 1].textContent = text;
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }
}

// 🎤 Voice input (prevent keyboard + beep + input suppression)
function startVoiceInput() {
  const input = document.getElementById("userInput");

  // Prevent keyboard pop-up
  input.blur();
  input.disabled = true;

  const dummy = document.createElement("input");
  dummy.type = "text";
  dummy.style.position = "absolute";
  dummy.style.opacity = "0";
  dummy.style.height = "0";
  dummy.style.fontSize = "16px"; // Prevent zoom on iOS
  document.body.appendChild(dummy);
  dummy.focus();
  setTimeout(() => dummy.remove(), 150);

  // 🔊 Beep
  const beep = document.getElementById("beep");
  if (beep) {
    beep.currentTime = 0;
    beep.play().catch(err => console.warn("🔊 Beep error:", err));
  }

  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    input.disabled = false;
    return;
  }

  const recog = new webkitSpeechRecognition();
  recog.lang = "en-US";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    sendMessage(transcript);
  };

  recog.onerror = (err) => {
    console.error("🎤 Mic error:", err.error);
    input.disabled = false;
  };

  recog.onend = () => {
    input.disabled = false;
  };

  recog.start();
}

function speakOutLoud(text) {
  if (!synth) return;
  speakStop();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 1;
  utter.rate = 1;
  synth.speak(utter);
}

function speakStop() {
  if (synth && synth.speaking) synth.cancel();
}