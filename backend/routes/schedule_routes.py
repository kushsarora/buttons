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


# ---------- Helpers ----------

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
    """Accepts 'YYYY-MM-DD', 'MM/DD', or full ISO; returns 'YYYY-MM-DD'."""
    try:
        s = date_str.strip()
        if "T" in s:  # already ISO datetime
            return s
        if "-" in s and len(s) >= 8:  # YYYY-MM-DD
            return s
        if "/" in s:  # MM/DD
            month, day = s.split("/")
            return f"{default_year}-{int(month):02d}-{int(day):02d}"
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


def pick_class_color(seed: str) -> str:
    """Deterministic color per class without a DB migration."""
    palette = [
        "#216869",  # dark teal
        "#49A078",  # jungle green
        "#74C0FC",  # blue
        "#FFD43B",  # yellow
        "#FF6B6B",  # red
        "#9CC5A1",  # light green
        "#1F2421",  # eerie black
        "#9b59b6",  # purple
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


def ensure_iso_datetime(value: str) -> str:
    """Accept 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM' → returns full ISO with at least HH:MM."""
    if not value:
        return value
    s = value.strip()
    if "T" in s:
        # Already has time; ensure seconds for fromisoformat robustness
        try:
            dt = datetime.fromisoformat(s)
            return dt.replace(microsecond=0).isoformat()
        except Exception:
            # Fallback: slice to minutes
            return s[:16]
    # Date-only → set to 09:00
    return f"{s}T09:00"


# ---------- Routes ----------

@bp.get("")
def get_schedule():
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        events = []

        for c in user.classes:
            class_label = c.code or c.title or "Class"
            class_color = pick_class_color(class_label)
            term_start, term_end = term_dates(c.term)
            year = term_start.year if term_start else datetime.now().year

            # --- Assignments ---
            for a in (c.assignments or []):
                date_raw = a.get("due_date") or a.get("start")
                if date_raw:
                    date_fixed = normalize_date(date_raw, year)
                    events.append({
                        "id": str(uuid.uuid4()),
                        "title": f"{class_label}: {a.get('title', 'Assignment')}",
                        "start": ensure_iso_datetime(date_fixed),
                        "type": "assignment",
                        "color": class_color,           # background = class color
                        "dotColor": TYPE_DOT_COLORS["assignment"],
                        "class": class_label,
                        "origin": "generated",
                        "textColor": "#ffffff",
                    })

            # --- Exams ---
            for e in (c.exams or []):
                date_raw = e.get("date") or e.get("start")
                if date_raw:
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

            # --- Meetings (Lectures/Discussions/Labs weekly) ---
            for m in (c.meetings or []):
                day_name = normalize_day(m.get("day"))
                if not day_name or not m.get("start_time"):
                    continue

                if not term_start:
                    continue

                days = {"monday": 0, "tuesday": 1, "wednesday": 2,
                        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
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
                        "title": f"{class_label} {m.get('type','Lecture')} @ {m.get('location','TBD')}",
                        "start": ensure_iso_datetime(start_dt),
                        "type": "meeting",
                        "color": class_color,
                        "dotColor": TYPE_DOT_COLORS["lecture"],
                        "class": class_label,
                        "origin": "generated",
                        "textColor": "#ffffff",
                    })
                    current += timedelta(days=7)

            # --- Custom/AI events persisted on the class ---
            for ce in getattr(c, "custom_events", []) or []:
                # Backfill required fields
                ce["color"] = class_color
                ce["textColor"] = "#ffffff"
                ce["dotColor"] = TYPE_DOT_COLORS.get(ce.get("type", "custom"), TYPE_DOT_COLORS["custom"])
                ce["class"] = ce.get("class") or class_label
                ce["origin"] = "custom"
                ce["start"] = ensure_iso_datetime(ce.get("start"))
                if ce.get("end"):
                    ce["end"] = ensure_iso_datetime(ce["end"])
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
        event_type = (data.get("type") or "custom").lower()

        cls = db.query(Class).filter_by(id=class_id, user_id=user.id).first()
        if not cls:
            cls = user.classes[0] if user.classes else None
        if not cls:
            return jsonify({"error": "No class found to attach event"}), 404

        class_label = cls.code or cls.title or "Class"
        class_color = pick_class_color(class_label)

        start_iso = ensure_iso_datetime(data.get("start"))
        end_iso = ensure_iso_datetime(data.get("end")) if data.get("end") else None

        base_event = {
            "id": str(uuid.uuid4()),
            "title": data.get("title"),
            "start": start_iso,
            "end": end_iso,
            "type": event_type,
            "repeat": data.get("repeat", "none"),
            "color": class_color,
            "textColor": "#ffffff",
            "dotColor": TYPE_DOT_COLORS.get(event_type, TYPE_DOT_COLORS["custom"]),
            "class": class_label,
            "origin": "custom",
        }

        events_to_add = [base_event]

        # Repeat (weekly/biweekly) for the next ~8 occurrences
        if base_event["repeat"] in ["weekly", "biweekly"]:
            interval = 7 if base_event["repeat"] == "weekly" else 14

            def parse_dt(s: str) -> datetime:
                s = s.strip()
                if "T" not in s:
                    s = f"{s}T09:00"
                # allow missing seconds
                try:
                    return datetime.fromisoformat(s)
                except Exception:
                    return datetime.fromisoformat(s[:16])

            start_dt = parse_dt(base_event["start"])
            for i in range(1, 8):
                next_date = start_dt + timedelta(days=interval * i)
                repeat_event = base_event.copy()
                repeat_event["id"] = str(uuid.uuid4())
                repeat_event["start"] = next_date.replace(microsecond=0).isoformat()
                if base_event.get("end"):
                    end_dt = parse_dt(base_event["end"]) + timedelta(days=interval * i)
                    repeat_event["end"] = end_dt.replace(microsecond=0).isoformat()
                events_to_add.append(repeat_event)

        if not getattr(cls, "custom_events", None):
            cls.custom_events = []
        cls.custom_events.extend(events_to_add)
        db.commit()

        return jsonify({"success": True, "events": events_to_add})
    finally:
        db.close()


@bp.delete("/<event_id>")
def delete_event(event_id):
    """
    Deletes ONLY persisted custom/AI events (origin='custom') from cls.custom_events.
    Generated items (meetings/exams/assignments) are recomputed and cannot be deleted here.
    """
    db = SessionLocal()
    try:
        user = get_current_user(db)
        if not user:
            return jsonify({"error": "Unauthorized"}), 401

        found = False
        for c in user.classes:
            lst = getattr(c, "custom_events", []) or []
            new_list = [e for e in lst if e.get("id") != event_id]
            if len(new_list) != len(lst):
                c.custom_events = new_list
                found = True

        if not found:
            return jsonify({"error": "Event not found or not deletable"}), 404

        db.commit()
        return jsonify({"success": True, "deleted": event_id})
    finally:
        db.close()
