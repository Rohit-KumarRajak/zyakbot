let isTalkModeOn = false;
let synth = window.speechSynthesis;
let lastBotMessage = "";

// DOM loaded
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

// Send message
function sendMessage(message = null) {
  const input = document.getElementById("userInput");
  const msg = message || input.value.trim();
  if (!msg) return;

  speakStop(); // ⛔ Stop old speech before sending
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

// Add message to chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;

  const chat = document.getElementById("chat");
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// Replace last bot reply
function replaceLastBotMessage(text) {
  const bots = document.getElementsByClassName("bot-msg");
  if (bots.length) {
    bots[bots.length - 1].textContent = text;
    document.getElementById("chat").scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }
}

// 🎤 Start voice input
function startVoiceInput() {
  const input = document.getElementById("userInput");

  // ✅ Blur first to close keyboard
  input.blur();

  // ✅ Use temporary disabled hidden input to suppress keyboard popup
  const tempInput = document.createElement("input");
  tempInput.setAttribute("type", "text");
  tempInput.style.position = "absolute";
  tempInput.style.opacity = "0";
  tempInput.style.height = "0";
  tempInput.style.fontSize = "16px"; // prevent iOS zoom
  document.body.appendChild(tempInput);
  tempInput.focus();
  setTimeout(() => tempInput.remove(), 100); // clean up after 100ms

  // 🔊 Beep
  const beep = document.getElementById("beep");
  if (beep) {
    beep.currentTime = 0;
    beep.play().catch((e) => console.warn("Beep error:", e));
  }

  // 🎤 Voice Recognition
  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    setTimeout(() => sendMessage(), 300);
  };

  recognition.onerror = (e) => {
    console.error("🎤 Mic error:", e.error);
  };

  recognition.onend = () => {
    input.disabled = false;
  };

  recognition.start();
}

// 🔈 Speak message
function speakOutLoud(text) {
  if (!synth) return;
  speakStop();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 1;
  utter.rate = 1;
  synth.speak(utter);
}

// ❌ Stop speech
function speakStop() {
  if (synth && synth.speaking) {
    synth.cancel();
  }
}