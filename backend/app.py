from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = "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"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama3-8b-8192",  # ya "llama3-70b-8192" agar chaho
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_input}
        ]
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=data)
        response.raise_for_status()
        reply = response.json()['choices'][0]['message']['content']
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': f"Error: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
