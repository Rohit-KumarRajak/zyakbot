from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import traceback
import os

load_dotenv()

app = Flask(__name__)

# ==============================
# Config
# ==============================

app.secret_key = os.getenv("SECRET_KEY", "fallback-secret")

app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True
)

CORS(
    app,
    supports_credentials=True,
    origins=["https://rohit-kumarrajak.github.io"]
)

# ==============================
# Home Route
# ==============================

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "ZyakBot Backend",
        "developer": "Rohit Kumar Rajak"
    })


# ==============================
# Chat Route
# ==============================

@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():

    if request.method == "OPTIONS":
        return "", 200

    try:

        # --------------------------
        # Validate Request
        # --------------------------

        data = request.get_json()

        if not data:
            return jsonify({
                "reply": "Invalid JSON."
            }), 400

        user_input = data.get("message", "").strip()

        if user_input == "":
            return jsonify({
                "reply": "Message cannot be empty."
            }), 400

        # --------------------------
        # Session History
        # --------------------------

        if "history" not in session:
            session["history"] = []

        session["history"].append({
            "role": "user",
            "content": user_input
        })

        system_prompt = {
            "role": "system",
            "content": (
                "You are ZyakBot, an intelligent AI assistant. "
                "Developed by Rohit Kumar Rajak, "
                "a CSE student at BIT Mesra. "
                "Always answer politely, accurately and clearly."
            )
        }

        messages = [system_prompt] + session["history"][-15:]

        # --------------------------
        # API Key
        # --------------------------

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            return jsonify({
                "reply": "GROQ_API_KEY not found."
            }), 500

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            # Recommended Groq model
            "model": "llama-3.1-8b-instant",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024
        }

        print("\n========== REQUEST ==========")
        print(payload)
        print("=============================\n")

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        print("\n========== RESPONSE ==========")
        print("Status:", response.status_code)
        print(response.text)
        print("==============================\n")

        if response.status_code != 200:

            return jsonify({
                "reply": "Groq API Error",
                "status": response.status_code,
                "details": response.text
            }), response.status_code

        result = response.json()

        reply = result["choices"][0]["message"]["content"]

        session["history"].append({
            "role": "assistant",
            "content": reply
        })

        session.modified = True

        return jsonify({
            "reply": reply
        })

    except requests.exceptions.Timeout:

        traceback.print_exc()

        return jsonify({
            "reply": "Groq API timeout."
        }), 504

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "reply": "Server Error",
            "error": str(e)
        }), 500


# ==============================
# Reset Chat
# ==============================

@app.route("/reset", methods=["POST"])
def reset():

    session.pop("history", None)

    return jsonify({
        "message": "Conversation reset successfully."
    })


# ==============================
# After Request
# ==============================

@app.after_request
def after_request(response):

    response.headers["Access-Control-Allow-Origin"] = "https://rohit-kumarrajak.github.io"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"

    return response


# ==============================
# Main
# ==============================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=True
    )
