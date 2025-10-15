import uuid
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from db.base import SessionLocal
from db.models import User, Class
from services.ai_scheduler import ai_schedule_for_user

bp = Blueprint("schedule", __name__, url_prefix="/api/schedule")

# ----------------- Helpers -----------------

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
    """Accepts 'YYYY-MM-DD', 'MM/DD', or ISO; returns same (ISO preserved)."""
    try:
        s = (date_str or "").strip()
        if "T" in s:
            return s
        if "-" in s and len(s) >= 8:
            return s
        if "/" in s:
            m, d = s.split("/")
            return f"{default_year}-{int(m):02d}-{int(d):02d}"
    except Exception:
        pass
    return date_str


def normalize_day(day_str):
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


def ensure_iso_datetime(value: str) -> str:
    """Ensure consistent ISO format; date-only becomes 09:00 local."""
    if not value:
        return value
    s = value.strip()
    if "T" in s:
        try:
            dt = datetime.fromisoformat(s)
            return dt.replace(microsecond=0).isoformat()
        except Exception:
            return s[:16]
    return f"{s}T09:00"


def pick_class_color(seed: str) -> str:
    palette = [
        "#216869", "#49A078", "#74C0FC", "#FFD43B",
        "#FF6B6B", "#9CC5A1", "#1F2421", "#9b59b6",
    ]
    h = sum(ord(c) for c in (seed or "")) if seed else 0
    return palette[h % len(palette)]


TYPE_DOT_COLORS = {
    "lecture": "#74C0FC",
    "meeting": "#74C0FC",
    "assignment": "#FFD43B",
    "exam": "#FF6B6B",
    "study": "#9CC5A1",
    "custom": "#49A078",
}

# ----------------- Internal -----------------

def _build_events_for_user(user, db):
    """Build full schedule view for a user (generated + custom/AI)."""
    db.refresh(user)
    for c in user.classes:
        db.refresh(c)

    events = []
    days = {"monday": 0, "tuesday": 1, "wednesday": 2,
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}

    for c in user.classes:
        class_label = c.code or c.title or "Class"
        class_color = pick_class_color(class_label)
        term_start, term_end = term_dates(c.term)
        year = term_start.year if term_start else datetime.now().year

        # ---- Assignments ----
        for a in (c.assignments or []):
            date_raw = a.get("due_date") or a.get("start")
            if not date_raw:
                continue
            date_fixed = normalize_date(date_raw, year)
            events.append({
                "id": str(uuid.uuid4()),
                "title": f"{class_label}: {a.get('title', 'Assignment')}",
                "start": ensure_iso_datetime(date_fixed),
                "type": "assignment",
                "color": class_color,
                "dotColor": TYPE_DOT_COLORS["assignment"],
                "class": class_label,
                "origin": "generated",
                "textColor": "#ffffff",
            })

        # ---- Exams ----
        for e in (c.exams or []):
            date_raw = e.get("date") or e.get("start")
            if not date_raw:
                continue
            date_fixed = normalize_date(date_raw, year)
            events.append({
                "id": str(uuid.uuid4()),
                "title": f"{class_label}: {e.get('title', 'Exam')}",
                "start": ensure_iso_datetime(date_fixed),
                "type": "exam",
                "color": class_color,
                "dotColor": TYPE_DOT_COLORS["exam"],
                "class": class_label,
                "origin": "generated",
                "textColor": "#ffffff",
            })

        # ---- Meetings ----
        for m in (c.meetings or []):
            day_name = normalize_day(m.get("day"))
            if not day_name or not m.get("start_time") or not term_start:
                continue
            day_num = days.get(day_name)
            if day_num is None:
                continue

            current = term_start
            while current.weekday() != day_num:
                current += timedelta(days=1)

            while current <= term_end:
                start_dt = f"{current.strftime('%Y-%m-%d')}T{m['start_time']}"
                events.append({
                    "id": str(uuid.uuid4()),
                    "title": f"{class_label} {m.get('type', 'Lecture')} @ {m.get('location', 'TBD')}",
                    "start": ensure_iso_datetime(start_dt),
                    "type": "meeting",
                    "color": class_color,
                    "dotColor": TYPE_DOT_COLORS["lecture"],
                    "class": class_label,
                    "origin": "generated",
                    "textColor": "#ffffff",
                })
                current += timedelta(days=7)

        # ---- Custom + AI (persisted) ----
        for ce in (c.custom_events or []):
            ce = dict(ce)
            ce["color"] = class_color
            ce["textColor"] = "#ffffff"
            ce["dotColor"] = TYPE_DOT_COLORS.get(ce.get("type", "custom"), TYPE_DOT_COLORS["custom"])
            ce["class"] = ce.get("class") or class_label
            ce["origin"] = ce.get("origin", "custom")
            ce["start"] = ensure_iso_datetime(ce.get("start"))
            if ce.get("end"):
                ce["end"] = ensure_iso_datetime(ce["end"])
            events.append(ce)

    return events

# ----------------- Routes -----------------

@bp.get("")
def get_schedule():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        events = _build_events_for_user(user, db)
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
        event_type = (data.get("type") or "custom").lower()

        cls = db.query(Class).filter_by(id=class_id, user_id=user.id).first()
        if not cls:
            return jsonify({"error": "No class found"}), 404

        class_label = cls.code or cls.title or "Class"
        new_event = {
            "id": str(uuid.uuid4()),
            "title": data.get("title"),
            "start": ensure_iso_datetime(data.get("start")),
            "end": ensure_iso_datetime(data.get("end")) if data.get("end") else None,
            "type": event_type,
            "repeat": data.get("repeat", "none"),
            "color": pick_class_color(class_label),
            "textColor": "#ffffff",
            "dotColor": TYPE_DOT_COLORS.get(event_type, TYPE_DOT_COLORS["custom"]),
            "class": class_label,
            "origin": "custom",
        }

        if not cls.custom_events:
            cls.custom_events = []
        cls.custom_events.append(new_event)

        # handle repeats (weekly/biweekly)
        extra = []
        if new_event["repeat"] in ["weekly", "biweekly"]:
            interval = 7 if new_event["repeat"] == "weekly" else 14
            start_dt = datetime.fromisoformat(new_event["start"])
            for i in range(1, 8):
                nxt = start_dt + timedelta(days=interval * i)
                ev = dict(new_event)
                ev["id"] = str(uuid.uuid4())
                ev["start"] = nxt.replace(microsecond=0).isoformat()
                extra.append(ev)
        cls.custom_events.extend(extra)

        db.commit()
        db.refresh(cls)
        db.refresh(user)

        events = _build_events_for_user(user, db)

        return jsonify({"success": True, "added": [new_event] + extra, "events": events})
    finally:
        db.close()


@bp.delete("/<event_id>")
def delete_event(event_id):
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        removed = False
        for c in user.classes:
            lst = c.custom_events or []
            new_list = [e for e in lst if e.get("id") != event_id]
            if len(new_list) != len(lst):
                c.custom_events = new_list
                removed = True

        if not removed:
            return jsonify({"error": "Event not found or not deletable"}), 404

        db.commit()
        return jsonify({"success": True, "deleted": event_id})
    finally:
        db.close()


@bp.post("/auto")
def auto_schedule():
    """
    Ask AI to generate study/work sessions with user preferences.
    Returns a fresh, complete event list including AI + user-added sessions.
    """
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        payload = request.json or {}
        settings = payload.get("settings", {})

        # Run AI scheduler with same DB session
        result = ai_schedule_for_user(user, settings=settings, db=db)

        if result.get("success"):
            db.expire_all()
            db.refresh(user)

            # Rebuild full schedule with all updates
            events = _build_events_for_user(user, db)

            return jsonify({
                "success": True,
                "added": result.get("added", []),
                "events": events
            })
        else:
            return jsonify(result)
    finally:
        db.close()
