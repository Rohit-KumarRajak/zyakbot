from flask import Flask, request, jsonify, session
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
import threading  # ✅ YEH ADD KARO
import time      # ✅ YEH BHI ADD KARO

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "fallback-secret")  # required for sessions

# Flask session cookie settings
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True
)

# Allow frontend from GitHub Pages
CORS(app, supports_credentials=True, origins=["https://rohit-kumarrajak.github.io"])

# ✅ ADD HEALTH CHECK ROUTE (Important for Render free tier)
@app.route('/')
def home():
    return jsonify({
        "message": "ZyakBot Backend is running!",
        "status": "active", 
        "developer": "Rohit Kumar Rajak",
        "timestamp": time.time()
    })

# ✅ ADD HEALTH CHECK ENDPOINT (Render auto-pings this)
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

# ✅ AUTO-PING SERVICE (Keeps instance awake)
# def keep_alive():
#     def ping():
#         while True:
#             try:
#                 requests.get("https://zyakbot-backend.onrender.com/health")
#                 print("🔄 Pinged server to keep awake")
#             except:
#                 print("⚠️ Ping failed")
#             time.sleep(300)  # Ping every 5 minutes
    
#     thread = threading.Thread(target=ping)
#     thread.daemon = True
#     thread.start()

# # Start keep-alive when app runs (but not in debug mode)
# if not os.environ.get("DEBUG"):
#     keep_alive()


@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200  # CORS preflight

    user_input = request.json.get('message', '')

    if 'history' not in session:
        session['history'] = []

    session['history'].append({"role": "user", "content": user_input})

    print("🔍 Session History:", session.get('history'))

    # Your system prompt (unchanged)
    system_prompt = {
        "role": "system",
        "content": (
             "You are ZyakBot, a smart and helpful AI assistant. "
        "Developed by Rohit Kumar Rajak, a CSE student at BIT Mesra. "
        )
    }

    # Limit context to last 15 messages + system prompt
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
        # Set a timeout (10 seconds) to avoid hanging on slow Groq API responses
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        reply = data['choices'][0]['message']['content']

        session['history'].append({"role": "assistant", "content": reply})
        session.modified = True

        return jsonify({"reply": reply})

    except requests.exceptions.Timeout:
        print("⚠️ Groq API timeout.")
        return jsonify({"reply": "⚠️ Server timeout. Please try again."}), 504

    except requests.exceptions.RequestException as e:
        print("❌ Groq API error:", e)
        return jsonify({"reply": "⚠️ Error connecting to Groq API."}), 500

    except Exception as e:
        print("❌ General error:", e)
        return jsonify({"reply": "⚠️ Unexpected server error."}), 500


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
