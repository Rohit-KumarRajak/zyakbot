let isTalkModeOn = false;
const synth = window.speechSynthesis;
let lastBotMessage = "";
let isFirstInteraction = true;

// DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  // Talk Mode Toggle
  document.getElementById("talkModeBtn").addEventListener("click", () => {
    isTalkModeOn = !isTalkModeOn;
    const btn = document.getElementById("talkModeBtn");
    btn.textContent = isTalkModeOn ? "🗣️ Talk Mode: ON" : "🔇 Talk Mode: OFF";

    if (isTalkModeOn && lastBotMessage) {
      speakOutLoud(lastBotMessage);
    } else if (!isTalkModeOn && synth.speaking) {
      synth.cancel();
    }
  });

  // 🧠 Auto greeting on load (for faster first message)
  if (isFirstInteraction) {
    isFirstInteraction = false;
    setTimeout(() => {
      sendMessage("Hello");
    }, 300); // small delay after load
  }
});

// 🧠 Send message to backend
function sendMessage(msgFromVoice = null) {
  const userInput = document.getElementById("userInput");
  const message = msgFromVoice || userInput.value.trim();
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

// 💬 Add message to chat
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

// 🎤 Start continuous voice input if Talk Mode is on
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported.");
    return;
  }

  const recog = new webkitSpeechRecognition();
  recog.lang = "en-US";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  recog.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const inputField = document.getElementById("userInput");
    inputField.value = transcript;
    inputField.blur();
    sendMessage(transcript); // direct send

    // If Talk Mode on, restart listening after bot speaks
    if (isTalkModeOn) {
      // Wait till speech ends
      const restartListener = () => {
        if (!synth.speaking) {
          startVoiceInput(); // loop again
        } else {
          setTimeout(restartListener, 300); // check again
        }
      };
      restartListener();
    }
  };

  recog.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (isTalkModeOn) {
      setTimeout(() => startVoiceInput(), 1000); // try again
    }
  };

  recog.start();
}

// 🗣️ Speak the bot response
function speakOutLoud(text) {
  if (!synth) return;
  if (synth.speaking) synth.cancel(); // interrupt previous

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US"; // or "hi-IN" for Hindi
  utter.rate = 1;
  utter.pitch = 1;
  synth.speak(utter);
}
