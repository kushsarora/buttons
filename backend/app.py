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

# ✅ GLOBAL CORS FIX
# Allow all endpoints (including /auth/google and /api/...) from your Vite dev server
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# --- Google Login Configuration ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@app.route("/auth/google", methods=["POST"])
def google_login():
    """Handle Google Sign-In token verification."""
    token = request.json.get("id_token")

    try:
        # Verify the ID token with Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

        user_id = idinfo["sub"]
        email = idinfo["email"]
        name = idinfo.get("name", "")

        # Return basic user data to frontend (DB handled separately)
        return jsonify({
            "success": True,
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            }
        })

    except Exception as e:
        print(f"[Auth Error] {e}")
        return jsonify({"success": False, "error": str(e)}), 400


# --- Health check route ---
@app.route("/api/ping", methods=["GET"])
def ping():
    """Quick check to make sure backend + env are set."""
    has_key = bool(os.getenv("OPENAI_API_KEY"))
    db_url = os.getenv("DATABASE_URL", "Not set")
    return jsonify({
        "ok": True,
        "openai_key_present": has_key,
        "database_url": db_url
    })


# --- Database initialization ---
from db.base import engine
from db.models import Base

# Automatically create tables (users, classes, requirements)
Base.metadata.create_all(bind=engine)


# --- Register Blueprints (Routes) ---
from routes.class_routes import bp as classes_bp
app.register_blueprint(classes_bp)


# --- Run the app ---
if __name__ == "__main__":
    app.run(port=5000, debug=True)
