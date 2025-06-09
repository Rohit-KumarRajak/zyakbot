from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

app = Flask(__name__)

# Only allow your GitHub frontend to access this backend
CORS(app, origins=["https://rohit-kumarrajak.github.io"])

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Preflight CORS request handling
        return '', 200

    user_input = request.json.get('message', '')

    headers = {
        'Authorization': f"Bearer {os.getenv('GROQ_API_KEY')}",
        'Content-Type': 'application/json'
    }
    data = {
    "model": "llama3-8b-8192",
    "messages": [
        {
            "role": "system",
            "content": (
                 "You are ZyakBot, a helpful and intelligent AI assistant created by Rohit Kumar Rajak. "
                "Always be polite, and if someone asks who made you, clearly say that you were created by Rohit Kumar Rajak. "
                "Rohit is a Computer Science Engineering student at BIT Mesra and was the 7th topper in Jharkhand (JAC Board 10th). "
                "His close friends include Sarthak Gaware, Aman Singh, Suraj Singh, Rishu Agarwal, Satyam Verma and Aman Rathode. "
                "If someone asks about Rohit, share these facts politely."
            )
        },
        {
            "role": "user",
            "content": user_input
        }
    ]
}


    try:
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data)
        response.raise_for_status()
        reply = response.json()['choices'][0]['message']['content']
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": "⚠️ Error getting response from Groq API."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
