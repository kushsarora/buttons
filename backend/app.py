from flask import Flask, request, jsonify
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv
import os

# --- Load environment variables ---
load_dotenv()

# --- Initialize Flask app ---
app = Flask(__name__)

# ✅ Enable CORS for frontend dev
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
])

# --- Google Login Configuration ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


from google.oauth2 import id_token
from google.auth.transport import requests
import time

@app.route("/auth/google", methods=["POST"])
def google_login():
    """Handle Google Sign-In token verification."""
    token = request.json.get("id_token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=5  
        )
        user_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")

        return jsonify({
            "success": True,
            "user": {"id": user_id, "email": email, "name": name}
        })
    except Exception as e:
        print(f"[Auth Error] {e}")
        return jsonify({"success": False, "error": str(e)}), 400



# --- Health Check Route ---
@app.route("/api/ping", methods=["GET"])
def ping():
    """Quick health check for backend and env."""
    has_key = bool(os.getenv("OPENAI_API_KEY"))
    db_url = os.getenv("DATABASE_URL", "Not set")
    return jsonify({
        "ok": True,
        "openai_key_present": has_key,
        "database_url": db_url
    })


# --- Database Initialization ---
from db.base import engine
from db.models import Base

# Automatically create tables
Base.metadata.create_all(bind=engine)

# --- Register Routes ---
from routes.class_routes import bp as classes_bp
app.register_blueprint(classes_bp)

# ✅ Register Schedule Routes
try:
    from routes.schedule_routes import bp as schedule_bp
    app.register_blueprint(schedule_bp)
    print("✅ Loaded /api/schedule routes successfully.")
except Exception as e:
    print(f"⚠️ Could not load schedule routes: {e}")

# ✅ Register Chat AI Routes
try:
    from routes.chat_routes import bp as chat_bp
    app.register_blueprint(chat_bp)
    print("✅ Loaded /api/chat routes successfully.")
except Exception as e:
    print(f"⚠️ Could not load chat routes: {e}")

# --- Run the App ---
if __name__ == "__main__":
    print("🚀 Flask backend starting on port 5000...")
    app.run(port=5000, debug=True)
