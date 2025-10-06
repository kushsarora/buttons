import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db.base import SessionLocal
from db.models import User, Class

bp = Blueprint("schedule", __name__, url_prefix="/api/schedule")


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


def term_dates(term_str):
    if not term_str:
        return None, None
    term = term_str.lower()
    year = "".join([c for c in term if c.isdigit()]) or str(datetime.now().year)
    if "spring" in term:
        start = datetime(int(year), 1, 15)
        end = datetime(int(year), 5, 15)
    elif "fall" in term:
        start = datetime(int(year), 8, 15)
        end = datetime(int(year), 12, 15)
    else:
        start = datetime(int(year), 1, 1)
        end = datetime(int(year), 12, 31)
    return start, end


def normalize_date(date_str, default_year):
    try:
        date_str = date_str.strip()
        if "-" in date_str and len(date_str) >= 8:
            return date_str
        if "/" in date_str:
            month, day = date_str.split("/")
            return f"{default_year}-{int(month):02d}-{int(day):02d}"
    except Exception:
        pass
    return date_str


def normalize_day(day_str):
    """Allow for day abbreviations like 'Mon', 'M', etc."""
    if not day_str:
        return None
    d = day_str.strip().lower()
    mapping = {
        "m": "monday", "mon": "monday", "monday": "monday",
        "t": "tuesday", "tue": "tuesday", "tuesday": "tuesday",
        "w": "wednesday", "wed": "wednesday", "wednesday": "wednesday",
        "th": "thursday", "thu": "thursday", "thursday": "thursday",
        "f": "friday", "fri": "friday", "friday": "friday",
        "s": "saturday", "sat": "saturday", "saturday": "saturday",
        "su": "sunday", "sun": "sunday", "sunday": "sunday"
    }
    return mapping.get(d)


@bp.get("")
def get_schedule():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        events = []
        for c in user.classes:
            term_start, term_end = term_dates(c.term)
            year = term_start.year if term_start else datetime.now().year

            # === ASSIGNMENTS ===
            for a in (c.assignments or []):
                date_raw = a.get("due_date") or a.get("start")
                if date_raw:
                    date_fixed = normalize_date(date_raw, year)
                    events.append({
                        "id": str(uuid.uuid4()),
                        "title": f"{c.code or c.title}: {a.get('title', 'Assignment')}",
                        "start": date_fixed,
                        "type": "assignment",
                        "color": "#FFD43B",  # yellow
                        "class": c.code,
                    })

            # === EXAMS ===
            for e in (c.exams or []):
                date_raw = e.get("date") or e.get("start")
                if date_raw:
                    date_fixed = normalize_date(date_raw, year)
                    events.append({
                        "id": str(uuid.uuid4()),
                        "title": f"{c.code or c.title}: {e.get('title', 'Exam')}",
                        "start": date_fixed,
                        "type": "exam",
                        "color": "#FF6B6B",  # red
                        "class": c.code,
                    })

            # === MEETINGS (Lectures / Discussions / Labs) ===
            for m in (c.meetings or []):
                day_name = normalize_day(m.get("day"))
                if not day_name or not m.get("start_time"):
                    continue

                term_start, term_end = term_dates(c.term)
                if not term_start:
                    continue

                days = {
                    "monday": 0, "tuesday": 1, "wednesday": 2,
                    "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
                }
                day_num = days.get(day_name)
                if day_num is None:
                    continue

                current = term_start
                while current.weekday() != day_num:
                    current += timedelta(days=1)

                # repeat weekly until term end
                while current <= term_end:
                    start_dt = f"{current.strftime('%Y-%m-%d')}T{m['start_time']}"
                    events.append({
                        "id": str(uuid.uuid4()),
                        "title": f"{c.code or c.title} {m.get('type','Meeting')} @ {m.get('location','TBD')}",
                        "start": start_dt,
                        "type": "meeting",
                        "color": "#74C0FC",  # blue
                        "class": c.code,
                    })
                    current += timedelta(days=7)

            # === CUSTOM EVENTS ===
            for ce in getattr(c, "custom_events", []) or []:
                ce.setdefault("color", "#49A078")  # green default
                events.append(ce)

        return jsonify({"events": events})
    finally:
        db.close()


@bp.post("/add")
def add_event():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        data = request.json or {}
        class_id = data.get("class_id")
        cls = db.query(Class).filter_by(id=class_id, user_id=user.id).first()
        if not cls:
            cls = user.classes[0] if user.classes else None
        if not cls:
            return jsonify({"error": "No class found to attach event"}), 404

        base_event = {
            "id": str(uuid.uuid4()),
            "title": data.get("title"),
            "start": data.get("start"),
            "end": data.get("end"),
            "type": data.get("type", "custom"),
            "repeat": data.get("repeat", "none"),
            "color": "#49A078",  # green
        }

        events_to_add = [base_event]

        if base_event["repeat"] in ["weekly", "biweekly"]:
            interval = 7 if base_event["repeat"] == "weekly" else 14
            start_date = datetime.fromisoformat(base_event["start"])
            for i in range(1, 8):
                next_date = start_date + timedelta(days=interval * i)
                repeat_event = base_event.copy()
                repeat_event["id"] = str(uuid.uuid4())
                repeat_event["start"] = next_date.isoformat()
                events_to_add.append(repeat_event)

        if not getattr(cls, "custom_events", None):
            cls.custom_events = []
        cls.custom_events.extend(events_to_add)
        db.commit()

        return jsonify({"success": True, "events": events_to_add})
    finally:
        db.close()
