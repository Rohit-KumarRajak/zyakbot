from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-zyak-secret-256!")  # Production key fallback

# Allow your frontend to talk to backend
CORS(app, origins=["https://rohit-kumarrajak.github.io"], supports_credentials=True)

# ---------------------------
# Main Chat Endpoint
# ---------------------------
@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200  # Handle preflight CORS

    user_input = request.json.get('message', '')

    if 'history' not in session:
        session['history'] = []

    # Add user's message to session history
    session['history'].append({"role": "user", "content": user_input})

    # System prompt (personality and restrictions)
    system_prompt = {
        "role": "system",
        "content": (
            "You are ZyakBot, a helpful and intelligent AI assistant created by Rohit Kumar Rajak. "
            "Rohit is a CSE student at BIT Mesra and was the 7th topper in the Jharkhand JAC 10th board. "
            "If someone asks who created you, always say Rohit Kumar Rajak. "
            "Only share info about his friends if asked directly. Maintain context and be helpful."
        )
    }

    # Use last 15 messages + system prompt to send to Groq
    messages = [system_prompt] + session['history'][-15:]

    # Groq API request
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

        # Add bot reply to history
        session['history'].append({"role": "assistant", "content": reply})
        session.modified = True

        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": "⚠️ Error getting response from Groq API."}), 500

# ---------------------------
# Reset conversation memory
# ---------------------------
@app.route('/reset', methods=['POST'])
def reset():
    session.pop('history', None)
    return jsonify({"message": "History cleared."})

# ---------------------------
# Run App
# ---------------------------
@app.after_request
def set_cookie_headers(response):
    response.headers.add("Access-Control-Allow-Credentials", "true")
    # Flask sets SameSite=Lax by default, override it
    if 'session' in request.cookies:
        session_cookie = request.cookies.get('session')
        response.set_cookie(
            'session',
            session_cookie,
            secure=True,
            httponly=True,
            samesite='None'  # 🧠 Important for cross-origin
        )
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
