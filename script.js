// Send message to backend
function sendMessage() {
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();

  if (message === "") return;

  addMessage("user", message);
  userInput.value = "";

  fetch("http://127.0.0.1:5000/chat", {

    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message }),
  })
    .then((response) => response.json())
    .then((data) => {
      addMessage("bot", data.reply);
    })
    .catch((error) => {
      addMessage("bot", "❌ Error connecting to the server.");
      console.error("Error:", error);
    });
}

// Display message in chat
function addMessage(sender, text) {
  const chatContainer = document.getElementById("chat");
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "user-msg" : "bot-msg";
  msgDiv.textContent = text;
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Voice input
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Voice recognition not supported in your browser.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("userInput").value = transcript;
    sendMessage();
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
}