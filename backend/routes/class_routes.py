import uuid
from flask import Blueprint, request, jsonify
from db.base import SessionLocal
from db.models import User, Class
from services.parser_service import extract_text_from_upload
from services.ai_parser import parse_with_ai

bp = Blueprint("classes", __name__, url_prefix="/api")

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


def pick_class_color(seed: str) -> str:
    palette = [
        "#216869", "#49A078", "#74C0FC", "#FFD43B",
        "#FF6B6B", "#9CC5A1", "#1F2421", "#9b59b6",
    ]
    h = sum(ord(c) for c in (seed or "")) if seed else 0
    return palette[h % len(palette)]


@bp.post("/classes/parse")
def parse_class():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        f = request.files["file"]
        text = extract_text_from_upload(f)
        parsed = parse_with_ai(text)
        return jsonify({"draft": parsed})
    finally:
        db.close()


@bp.post("/classes")
def create_class():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json or {}
        class_id = str(uuid.uuid4())

        new_class = Class(
            id=class_id,
            user_id=user.id,
            title=data.get("title"),
            code=data.get("code"),
            instructor=data.get("instructor"),
            term=data.get("term"),
            notes=data.get("notes"),
            grading_policy=data.get("grading_policy"),
            meetings=data.get("meetings", []),
            assignments=data.get("assignments", []),
            exams=data.get("exams", []),
            schedule=data.get("schedule", [])
        )

        db.add(new_class)
        db.commit()
        return jsonify({"success": True, "id": class_id})
    finally:
        db.close()


@bp.get("/classes")
def list_classes():
    """
    Returns all classes for the logged-in user.
    Includes full class data (meetings, assignments, exams, etc.)
    so the Edit modal can prefill properly.
    """
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        classes = db.query(Class).filter_by(user_id=user.id).all()
        out = []
        for c in classes:
            label = c.code or c.title or ""
            out.append({
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "instructor": c.instructor,
                "term": c.term,
                "notes": c.notes,
                "grading_policy": c.grading_policy,
                "meetings": c.meetings or [],
                "assignments": c.assignments or [],
                "exams": c.exams or [],
                "schedule": c.schedule or [],
                "custom_events": c.custom_events or [],
                "color": pick_class_color(label),
            })
        return jsonify({"classes": out})
    finally:
        db.close()


@bp.delete("/classes/<class_id>")
def delete_class(class_id):
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        cls = db.query(Class).filter_by(id=class_id, user_id=user.id).first()
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        db.delete(cls)
        db.commit()
        return jsonify({"success": True})
    finally:
        db.close()


@bp.put("/classes/<class_id>")
def update_class(class_id):
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json or {}
        cls = db.query(Class).filter_by(id=class_id, user_id=user.id).first()
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        # Update all editable fields
        cls.title = data.get("title", cls.title)
        cls.code = data.get("code", cls.code)
        cls.instructor = data.get("instructor", cls.instructor)
        cls.term = data.get("term", cls.term)
        cls.notes = data.get("notes", cls.notes)
        cls.grading_policy = data.get("grading_policy", cls.grading_policy)
        cls.meetings = data.get("meetings", cls.meetings)
        cls.assignments = data.get("assignments", cls.assignments)
        cls.exams = data.get("exams", cls.exams)
        cls.schedule = data.get("schedule", cls.schedule)
        cls.custom_events = data.get("custom_events", cls.custom_events)

        db.commit()
        db.refresh(cls)
        return jsonify({"success": True, "updated": class_id})
    finally:
        db.close()
