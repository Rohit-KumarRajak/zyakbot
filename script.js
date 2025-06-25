let isTalkModeOn = false;
let recognition = null;
let synth = window.speechSynthesis;
let lastBotMessage = "";
let isSpeaking = false;

// Initialize Talk Mode Button
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    document.getElementById("talkModeBtn").textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn) {
      if (lastBotMessage) speakOutLoud(lastBotMessage, startContinuousVoiceInput);
      else startContinuousVoiceInput();
    } else {
      stopRecognition();
      speakStop();
    }
  });
});

// Send message to backend
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
    .then((res) => res.json())
    .then((data) => {
      lastBotMessage = data.reply;
      replaceLastBotMessage(data.reply);
      if (isTalkModeOn) {
        speakOutLoud(data.reply, () => {
          if (isTalkModeOn) startContinuousVoiceInput();
        });
      }
    })
    .catch(() => {
      replaceLastBotMessage("❌ Error connecting to the server.");
    })
    .finally(() => {
      userInput.disabled = false;
    });
}

// Add message to chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  document.getElementById("chat").appendChild(div);
  document.getElementById("chat").scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// Replace last bot message
function replaceLastBotMessage(text) {
  const bots = document.getElementsByClassName("bot-msg");
  if (bots.length > 0) bots[bots.length - 1].textContent = text;
}

// Standard voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return alert("🎤 Voice recognition not supported.");

  stopRecognition();
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    sendMessage(transcript);
  };
  recognition.start();
}

// Continuous voice input
function startContinuousVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return;
  stopRecognition();

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    speakStop(); // interrupt current speech
    sendMessage(transcript);
  };

  recognition.onerror = (e) => {
    console.warn("Recognition error:", e.error);
    if (isTalkModeOn) setTimeout(startContinuousVoiceInput, 1000);
  };

  recognition.onend = () => {
    if (isTalkModeOn && !isSpeaking) startContinuousVoiceInput();
  };

  recognition.start();
}

// Stop recognition
function stopRecognition() {
  if (recognition) {
    recognition.onend = null;
    recognition.stop();
    recognition = null;
  }
}

// Speak text
function speakOutLoud(text, onEndCallback = null) {
  if (!synth) return;
  speakStop();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;
  isSpeaking = true;

  utter.onend = () => {
    isSpeaking = false;
    if (onEndCallback) onEndCallback();
  };

  synth.speak(utter);
}

// Stop speaking
function speakStop() {
  if (synth.speaking) {
    synth.cancel();
    isSpeaking = false;
  }
}
