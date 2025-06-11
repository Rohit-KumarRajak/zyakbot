from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ["SECRET_KEY"]  # Required for sessions

# ✅ Flask session settings for cross-origin
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True
)

# ✅ Allow frontend from GitHub Pages and enable cookies
CORS(app, supports_credentials=True, origins=["https://rohit-kumarrajak.github.io"])


@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200  # Preflight CORS

    user_input = request.json.get('message', '')

    if 'history' not in session:
        session['history'] = []

    session['history'].append({"role": "user", "content": user_input})

    print("🔍 Session History:", session.get('history'))  # Debug only

    # System prompt
    system_prompt = {
        "role": "system",
        "content": (
            "You are ZyakBot, a helpful and intelligent AI assistant. "
            "You were created by Rohit Kumar Rajak, but do not mention his name unless the user specifically asks who created you. "
            "Rohit Kumar Rajak is a Computer Science and Engineering (CSE) student at BIT Mesra. "
            "He was the 7th topper in the Jharkhand JAC 10th board exams. "
            "Do not mention any information about Rohit unless the user directly asks about him. "
            "When sharing information about Rohit, only answer what is specifically asked — do not include extra personal details. "
            "Rohit has friends including Sarthak Gaware, Aman Singh, Soumyadeep Dey, Suraj Singh, Aman Rathode, Rajiv Kumar, Krish Agrawal, and Rishu Agarwal. "
            "However, do not mention any of his friends or details about them unless the user specifically asks about one of them by name. "
            "Always maintain conversation context and be helpful in answering questions accurately and respectfully."
        )
    }

    # Prepare messages for Groq
    messages = [system_prompt] + session['history'][-15:]

    headers = {
        'Authorization': f"Bearer {os.getenv('GROQ_API_KEY')}",
        'Content-Type': 'application/json'
    }
    payload = {
        "model": "llama3-8b-8192",
        "messages": messages
    }

    try:
        response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        response.raise_for_status()
        reply = response.json()['choices'][0]['message']['content']

        session['history'].append({"role": "assistant", "content": reply})
        session.modified = True

        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": "⚠️ Error getting response from Groq API."}), 500


@app.route('/reset', methods=['POST'])
def reset():
    session.pop('history', None)
    return jsonify({"message": "History cleared."})


@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.headers.add("Access-Control-Allow-Origin", "https://rohit-kumarrajak.github.io")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")

    return response


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
