let isTalkModeOn = false;
const synth = window.speechSynthesis;
let lastBotMessage = "";

document.addEventListener("DOMContentLoaded", () => {
  // Setup Talk Mode button
  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    const btn = document.getElementById("talkModeBtn");
    btn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    // If Talk Mode turned ON after message was already shown
    if (isTalkModeOn && lastBotMessage !== "") {
      speakOutLoud(lastBotMessage);
    }

    // If turned OFF, stop any speaking
    if (!isTalkModeOn && synth.speaking) {
      synth.cancel();
    }
  });
});

// 🧠 Send message to backend
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
      lastBotMessage = data.reply;
      replaceLastBotMessage(data.reply);
      if (isTalkModeOn) speakOutLoud(data.reply);
    })
    .catch((err) => {
      console.error("Error:", err);
      replaceLastBotMessage("❌ Error connecting to the server.");
    })
    .finally(() => {
      userInput.disabled = false;
    });
}

// 💬 Add chat message
function addMessage(sender, text) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// 🔁 Replace last bot message
function replaceLastBotMessage(text) {
  const chat = document.getElementById("chat");
  const messages = chat.getElementsByClassName("bot-msg");
  if (messages.length > 0) {
    messages[messages.length - 1].textContent = text;
  }
}

// 🎤 Voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    return;
  }

  const recog = new webkitSpeechRecognition();
  recog.lang = "en-US"; // Default to English, or change to "hi-IN"
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

// 🗣️ Speak out loud
function speakOutLoud(text) {
  if (!synth) return;
  if (synth.speaking) synth.cancel(); // Stop any current speech

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US"; // Change to "hi-IN" for Hindi
  utter.rate = 1;
  utter.pitch = 1;
  synth.speak(utter);
}