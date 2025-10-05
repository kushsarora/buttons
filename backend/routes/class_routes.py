import uuid
from flask import Blueprint, request, jsonify
from db.base import SessionLocal
from db.models import User, Class, Requirement
from services.parser_service import extract_text_from_upload
from services.ai_parser import parse_with_ai

bp = Blueprint("classes", __name__, url_prefix="/api")

def get_current_user(db):
    """Pulls user from headers (frontend sends X-User-Id, X-User-Email)."""
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
        data = request.json
        class_id = str(uuid.uuid4())

        new_class = Class(
            id=class_id,
            user_id=user.id,
            title=data.get("title"),
            code=data.get("code"),
            instructor=data.get("instructor"),
            term=data.get("term"),
            location=data.get("location"),
            meeting_times=data.get("meeting_times"),
            grading_policy=data.get("grading_policy"),
            notes=data.get("notes"),
        )
        db.add(new_class)

        for r in data.get("requirements", []):
            db.add(Requirement(
                id=str(uuid.uuid4()),
                class_id=class_id,
                kind=r.get("kind"),
                title=r.get("title"),
                weight=r.get("weight"),
                due=r.get("due"),
                details=r.get("details"),
            ))

        db.commit()
        return jsonify({"success": True, "id": class_id})
    finally:
        db.close()

@bp.get("/classes")
def list_classes():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401
        classes = db.query(Class).filter_by(user_id=user.id).all()
        out = [{
            "id": c.id,
            "title": c.title,
            "code": c.code,
            "instructor": c.instructor,
            "term": c.term,
        } for c in classes]
        return jsonify({"classes": out})
    finally:
        db.close()
