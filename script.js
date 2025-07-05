let isTalkModeOn = false;
let synth = window.speechSynthesis;
let lastBotMessage = "";

// DOM loaded
window.addEventListener("DOMContentLoaded", () => {
  const talkBtn = document.getElementById("talkModeBtn");
  talkBtn.addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    talkBtn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn && lastBotMessage) speakOutLoud(lastBotMessage);
    else speakStop();
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
      input.blur();
    });
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
  if (bots.length) {
    bots[bots.length - 1].textContent = text;
    document.getElementById("chat").scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }
}

function startVoiceInput() {
  const input = document.getElementById("userInput");

  // Prevent keyboard pop-up (on mobile)
  input.blur();
  const dummy = document.createElement("input");
  dummy.type = "text";
  dummy.setAttribute("inputmode", "none");
  dummy.style.position = "absolute";
  dummy.style.opacity = "0";
  document.body.appendChild(dummy);
  dummy.focus();
  setTimeout(() => dummy.remove(), 150);

  const beep = document.getElementById("beep");
  if (beep) {
    beep.currentTime = 0;
    beep.play().catch(err => console.warn("Beep error:", err));
  }

  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    input.value = transcript;
    setTimeout(() => sendMessage(), 200);
  };

  recognition.onerror = (e) => console.error("🎤 Mic error:", e.error);
  recognition.onend = () => input.disabled = false;
  recognition.start();
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
  if (synth?.speaking) synth.cancel();
}
