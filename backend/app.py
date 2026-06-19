from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
import traceback
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

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


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():

    if request.method == "OPTIONS":
        return "", 200

    try:

        data = request.get_json()

        if not data:
            return jsonify({"reply": "No JSON received"}), 400

        user_input = data.get("message", "").strip()

        if not user_input:
            return jsonify({"reply": "Message cannot be empty"}), 400

        if "history" not in session:
            session["history"] = []

        session["history"].append({
            "role": "user",
            "content": user_input
        })

        system_prompt = {
            "role": "system",
            "content": (
                "You are ZyakBot, a smart and helpful AI assistant. "
                "Developed by Rohit Kumar Rajak, a CSE student at BIT Mesra."
            )
        }

        messages = [system_prompt] + session["history"][-15:]

        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            print("❌ GROQ_API_KEY missing")
            return jsonify({
                "reply": "Server configuration error."
            }), 500

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama3-8b-8192",
            "messages": messages,
            "temperature": 0.7
        }

        print("========== REQUEST ==========")
        print(payload)
        print("=============================")

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=20
        )

        print("========== RESPONSE ==========")
        print("Status:", response.status_code)
        print(response.text)
        print("==============================")

        response.raise_for_status()

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

    except requests.exceptions.HTTPError as e:

        print("HTTP ERROR")
        print(e)

        if e.response is not None:
            print(e.response.text)

        traceback.print_exc()

        return jsonify({
            "reply": "Groq API HTTP Error",
            "details": e.response.text if e.response else ""
        }), 500

    except requests.exceptions.Timeout:

        traceback.print_exc()

        return jsonify({
            "reply": "Groq API Timeout"
        }), 504

    except Exception as e:

        print("GENERAL ERROR")
        traceback.print_exc()

        return jsonify({
            "reply": str(e)
        }), 500


@app.route("/reset", methods=["POST"])
def reset():
    session.pop("history", None)
    return jsonify({"message": "History cleared."})


@app.after_request
def add_headers(response):

    response.headers["Access-Control-Allow-Origin"] = "https://rohit-kumarrajak.github.io"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"

    return response


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=True
    )
