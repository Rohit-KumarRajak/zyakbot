let isTalkModeOn = false;
let recognition = null;
let synth = window.speechSynthesis;
let lastBotMessage = "";

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    document.getElementById("talkModeBtn").textContent = isTalkModeOn
      ? "🗣️ Talk Mode: ON"
      : "🔇 Talk Mode: OFF";

    if (isTalkModeOn) {
      if (lastBotMessage) speakOutLoud(lastBotMessage);
      startContinuousVoiceInput();
    } else {
      stopRecognition();
      synth.cancel();
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

// Add message
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "user-msg" : "bot-msg";
  div.textContent = text;
  document.getElementById("chat").appendChild(div);
  document.getElementById("chat").scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}

// Replace last "Thinking..." bot message
function replaceLastBotMessage(text) {
  const bots = document.getElementsByClassName("bot-msg");
  if (bots.length > 0) bots[bots.length - 1].textContent = text;
}

// Manual voice input (button 🎤 Speak)
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

  recognition.onerror = (e) => console.error("Voice input error:", e.error);
  recognition.start();
}

// Continuous Talk Mode input (🔈)
function startContinuousVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) return;
  stopRecognition();

  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false; // single question per cycle
  recognition.maxAlternatives = 1;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    speakStop(); // Interrupt current bot response
    sendMessage(transcript);
  };

  recognition.onerror = (e) => {
    console.warn("Recognition error:", e.error);
    if (isTalkModeOn) setTimeout(startContinuousVoiceInput, 800);
  };

  recognition.onend = () => {
    if (isTalkModeOn) startContinuousVoiceInput();
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

// Speak output
function speakOutLoud(text, onEndCallback = null) {
  if (!synth) return;
  speakStop(); // Stop previous speaking if any

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  utter.pitch = 1;

  utter.onend = () => {
    if (onEndCallback) onEndCallback();
  };

  synth.speak(utter);
}

// Stop current speaking
function speakStop() {
  if (synth.speaking || synth.pending) synth.cancel();
}
