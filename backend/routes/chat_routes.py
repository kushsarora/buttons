import os, json
from flask import Blueprint, request, jsonify
from db.base import SessionLocal
from db.models import User, Class
from openai import OpenAI
from routes.schedule_routes import _build_events_for_user

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_current_user(db):
    uid = request.headers.get("X-User-Id")
    email = request.headers.get("X-User-Email")
    name = request.headers.get("X-User-Name", "")
    if not uid:
        return None
    user = db.get(User, uid)
    if not user:
        user = User(id=uid, email=email, name=name)
        db.add(user)
        db.commit()
    return user


@bp.post("")
def chat_with_ai():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        payload = request.json or {}
        user_msg = payload.get("message", "").strip()
        if not user_msg:
            return jsonify({"error": "Empty message"}), 400

        print(f"[Chat AI] User asked: {user_msg}")

        # --- Step 1: Relevance Check ---
        relevance_prompt = (
            "You are a strict filter for a class/schedule assistant. "
            "The student may ask any question. Your job is to respond ONLY with 'yes' or 'no' "
            "to indicate whether the question is about their courses, instructors, "
            "assignments, exams, meetings, or schedule/times. "
            "If it’s not clearly related to those, answer 'no'."
        )

        relevance_check = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": relevance_prompt},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=5,
        )

        relevance_answer = (
            relevance_check.choices[0].message.content.strip().lower()
        )
        print(f"[Chat AI] Relevance detected: {relevance_answer}")

        if not relevance_answer.startswith("y"):
            return jsonify({
                "reply": "❌ I can only answer questions related to your classes, assignments, exams, or schedule."
            })

        # --- Step 2: Context and Real Answer ---
        classes = db.query(Class).filter_by(user_id=user.id).all()
        events = _build_events_for_user(user, db)

        context = {
            "classes_summary": [
                {
                    "title": c.title,
                    "code": c.code,
                    "instructor": c.instructor,
                    "assignments": [
                        {"title": a.get("title"), "due_date": a.get("due_date")}
                        for a in (c.assignments or [])
                    ],
                    "exams": [
                        {"title": e.get("title"), "date": e.get("date")}
                        for e in (c.exams or [])
                    ],
                }
                for c in classes
            ],
            "events_count": len(events),
        }

        system_prompt = (
            "You are a helpful academic assistant. You must only use the provided data "
            "about this student’s classes, assignments, exams, and schedule. "
            "Answer clearly and concisely. If the information doesn’t exist, say so politely."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Data: {json.dumps(context)}"},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=300,
        )

        reply = response.choices[0].message.content.strip()
        return jsonify({"reply": reply})

    except Exception as e:
        print("[Chat AI Error]", e)
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
