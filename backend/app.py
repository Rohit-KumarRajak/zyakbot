from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "super-secret-key")  # Needed for session memory

# Only allow frontend from your domain
CORS(app, origins=["https://rohit-kumarrajak.github.io"], supports_credentials=True)

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200

    user_input = request.json.get('message', '')

    # Initialize or update conversation history
    if 'history' not in session:
        session['history'] = []

    session['history'].append({"role": "user", "content": user_input})

    # Always start with a system prompt
    system_prompt = {
        "role": "system",
        "content": (
            "You are ZyakBot, a helpful AI assistant created by Rohit Kumar Rajak. "
            "Only share information about Rohit’s friends if the user explicitly asks about them. "
            "Rohit is a CSE student at BIT Mesra and was the 7th topper in Jharkhand JAC 10th board. "
            "If someone asks who created you, say Rohit Kumar Rajak made you."
        )
    }

    # Final message list for Groq API
    messages = [system_prompt] + session['history'][-15:]  # limit history to last 15 to avoid overflow

    headers = {
        'Authorization': f"Bearer {os.getenv('GROQ_API_KEY')}",
        'Content-Type': 'application/json'
    }

    payload = {
        "model": "llama3-8b-8192",
        "messages": messages
    }

    try:
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=payload)
        response.raise_for_status()
        reply = response.json()['choices'][0]['message']['content']

        # Add bot response to history
        session['history'].append({"role": "assistant", "content": reply})
        session.modified = True

        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": "⚠️ Error getting response from Groq API."}), 500

@app.route('/reset', methods=['POST'])
def reset():
    session.pop('history', None)
    return jsonify({"message": "History cleared."})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
