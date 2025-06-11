// Send message to backend
function sendMessage() {
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (message === "") return;

  addMessage("user", message);
  userInput.value = "";
  userInput.disabled = true;

  // Show bot typing...
  addMessage("bot", "⏳ Thinking...");

  fetch("https://zyakbot-backend.onrender.com/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'include',  // 🟢 Yeh line bahut important hai history ko backend me bhejne ke lia
    body: JSON.stringify({ message: message }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Server error");
      }
      return response.json();
    })
    .then((data) => {
      replaceLastBotMessage(data.reply);
    })
    .catch((error) => {
      replaceLastBotMessage("❌ Error connecting to the server.");
      console.error("Error:", error);
    })
    .finally(() => {
      userInput.disabled = false;
      // Removed focus to prevent keyboard popup on mobile
    });
}

// Display message in chat
function addMessage(sender, text) {
  const chatContainer = document.getElementById("chat");
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
}

// Replace the last bot message (used for loading indicator)
function replaceLastBotMessage(newText) {
  const chatContainer = document.getElementById("chat");
  const messages = chatContainer.getElementsByClassName("bot-msg");
  if (messages.length > 0) {
    messages[messages.length - 1].textContent = newText;
  }
}

// Voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("🎤 Voice recognition not supported in your browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;

    const inputField = document.getElementById("userInput");
    inputField.value = transcript;

    // Prevent keyboard popup on mobile by temporarily blurring input
    inputField.blur();

    // Small delay for UX before sending
    setTimeout(() => {
      sendMessage();
    }, 300);
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
}
