let isTalkModeOn = false;

const synth = window.speechSynthesis;
let selectedLang = "en-US";
let selectedVoice = null;
let rate = 1;
let pitch = 1;

document.addEventListener("DOMContentLoaded", () => {
  populateVoices();

  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    document.getElementById("talkModeBtn").textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";
  });

  document.getElementById("langSelect").addEventListener("change", (e) => {
    selectedLang = e.target.value;
    populateVoices();
  });

  document.getElementById("rateSlider").addEventListener("input", (e) => {
    rate = parseFloat(e.target.value);
  });

  document.getElementById("pitchSlider").addEventListener("input", (e) => {
    pitch = parseFloat(e.target.value);
  });
});

// 🧠 Send user message to backend
function sendMessage() {
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage("user", message);
  userInput.value = "";
  userInput.disabled = true;

  addMessage("bot", "⏳ Thinking...");

  fetch("https://zyakbot-backend.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ message }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Server error");
      return res.json();
    })
    .then((data) => {
      replaceLastBotMessage(data.reply);
      if (isTalkModeOn) speakOutLoud(data.reply);
    })
    .catch((err) => {
      replaceLastBotMessage("❌ Error connecting to the server.");
      console.error("Error:", err);
    })
    .finally(() => {
      userInput.disabled = false;
    });
}

// 🧾 Display chat messages
function addMessage(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// ✨ Replace last bot message (used after loading indicator)
function replaceLastBotMessage(text) {
  const chat = document.getElementById("chat");
  const messages = chat.getElementsByClassName("bot-msg");
  if (messages.length > 0) {
    messages[messages.length - 1].textContent = text;
  }
}

// 🎤 Voice input via browser
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    return;
  }

  const recog = new webkitSpeechRecognition();
  recog.lang = selectedLang;
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const inputField = document.getElementById("userInput");
    inputField.value = transcript;
    inputField.blur();
    setTimeout(() => sendMessage(), 300);
  };

  recog.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recog.start();
}

// 🗣️ Voice Output
function speakOutLoud(text) {
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = selectedLang;
  utter.rate = rate;
  utter.pitch = pitch;
  if (selectedVoice) utter.voice = selectedVoice;
  synth.speak(utter);
}

// 🔊 Load voices dynamically
function populateVoices() {
  const voices = synth.getVoices();
  selectedVoice = voices.find(v => v.lang === selectedLang) || voices[0];
}

// 📦 Update voices on change (some browsers delay loading)
if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = populateVoices;
}
