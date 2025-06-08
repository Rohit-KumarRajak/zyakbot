from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json['message']
    headers = {
        'Authorization': f"Bearer {os.getenv('GROQ_API_KEY')}",
        'Content-Type': 'application/json'
    }
    data = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": user_input}]
    }
    response = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data)
    return jsonify(response.json()['choices'][0]['message']['content'])

if __name__ == '__main__':
    app.run(debug=True)
