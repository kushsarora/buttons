import os
import json
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import OpenAI
from db.models import Class

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ===== Helpers =====

def parse_iso(s):
    try:
        return datetime.fromisoformat(s)
    except Exception:
        try:
            return datetime.fromisoformat(s[:16])
        except Exception:
            return None

def overlaps(a_start, a_end, b_start, b_end):
    return not (a_end <= b_start or a_start >= b_end)

def is_conflict(candidate_start, candidate_end, existing_events):
    c_start = parse_iso(candidate_start)
    c_end = parse_iso(candidate_end)
    if not c_start or not c_end:
        return False
    for ev in existing_events:
        s = parse_iso(ev.get("start"))
        e = parse_iso(ev.get("end")) or s
        if s and e and overlaps(c_start, c_end, s, e):
            return True
    return False

def format_event(cls, title, start, end):
    class_label = cls.code or cls.title or "Class"
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "start": start,
        "end": end,
        "type": "study",
        "repeat": "none",
        "color": "#9CC5A1",
        "textColor": "#fff",
        "dotColor": "#9CC5A1",
        "class": class_label,
        "origin": "ai",
    }

def extract_term_year(term: str, default_year: int) -> int:
    if not term:
        return default_year
    digits = "".join([c for c in term if c.isdigit()])
    try:
        y = int(digits)
        if 2000 <= y <= 2100:
            return y
    except Exception:
        pass
    return default_year

def ensure_year(date_str: str, fallback_year: int) -> str:
    """
    Accepts 'YYYY-MM-DD' or ISO; if year missing or clearly wrong/past,
    swap to fallback_year. Returns ISO date/time with at least HH:MM.
    """
    if not date_str:
        return date_str
    s = date_str.strip()
    # Already has time?
    if "T" in s:
        dt = parse_iso(s)
        if not dt:
            return s
        year = dt.year
        if year < fallback_year:
            dt = dt.replace(year=fallback_year)
        return dt.replace(microsecond=0).isoformat()

    # Date-only path
    try:
        # If it's already YYYY-MM-DD, respect it, but correct year if needed
        if "-" in s and len(s) >= 8:
            parts = s.split("-")
            y = int(parts[0])
            if y < fallback_year:
                parts[0] = str(fallback_year)
                s = "-".join(parts)
            return f"{s}T09:00"
        # If it's MM/DD or similar, inject fallback year
        if "/" in s:
            m, d = s.split("/")
            s = f"{fallback_year}-{int(m):02d}-{int(d):02d}"
            return f"{s}T09:00"
    except Exception:
        pass
    return f"{s}T09:00"

def clamp_to_hours(start_dt: datetime, end_dt: datetime, start_hour: int, end_hour: int):
    s = start_dt
    e = end_dt
    if s.hour < start_hour:
        s = s.replace(hour=start_hour, minute=0, second=0, microsecond=0)
    if e.hour > end_hour or (e.hour == end_hour and e.minute > 0):
        e = e.replace(hour=end_hour, minute=0, second=0, microsecond=0)
    return s, e

# ===== Core =====

def ai_schedule_for_user(user, settings=None, db=None):
    """
    Generate AI study/work sessions before assignments/exams.
    Respects:
      - startHour / endHour
      - avoidWeekends
      - sessionsPerWeek
    Ensures: dates are in the correct (term/current) year and not in the past.
    Requires the active SQLAlchemy session (db).
    """
    if db is None:
        raise ValueError("ai_schedule_for_user must be passed an active DB session")

    try:
        settings = settings or {}
        start_hour_str = settings.get("startHour", "09:00")
        end_hour_str = settings.get("endHour", "18:00")
        avoid_weekends = settings.get("avoidWeekends", True)
        sessions_per_week = int(settings.get("sessionsPerWeek", 3))

        start_hour = int(start_hour_str.split(":")[0])
        end_hour = int(end_hour_str.split(":")[0])

        now = datetime.now()
        current_year = now.year

        classes = user.classes
        if not classes:
            return {"success": False, "message": "No classes found."}

        # Collect existing custom/ai events to avoid conflicts
        all_existing = []
        for c in classes:
            if c.custom_events:
                all_existing.extend(c.custom_events)

        # Build absolute, year-resolved deadlines for the prompt
        upcoming = []
        for c in classes:
            label = c.code or c.title
            term_year = extract_term_year(c.term, current_year)
            # assignments
            for a in (c.assignments or []):
                dd = a.get("due_date") or a.get("start")
                if dd:
                    iso = ensure_year(dd, term_year)
                    upcoming.append({"class": label, "kind": "assignment", "title": a.get("title") or "Assignment", "date": iso})
            # exams
            for e in (c.exams or []):
                dd = e.get("date") or e.get("start")
                if dd:
                    iso = ensure_year(dd, term_year)
                    upcoming.append({"class": label, "kind": "exam", "title": e.get("title") or "Exam", "date": iso})

        if not upcoming:
            return {"success": False, "message": "No due dates found to schedule around."}

        # Build a strict prompt with absolute ISO dates + today's date
        today_str = now.replace(microsecond=0).isoformat()
        deadlines_lines = [
            f"{u['class']} {u['kind']} '{u['title']}' due {u['date']}"
            for u in upcoming
        ]
        user_summary = "\n".join(deadlines_lines)

        system_prompt = (
            "You are a university scheduling assistant that plans study/work sessions for students.\n"
            f"Today's date is {today_str}. Use the *exact year* shown in the deadlines below.\n"
            f"Study sessions must be between {start_hour_str} and {end_hour_str} local time. "
            f"Schedule about {sessions_per_week} sessions per week per course, evenly spaced before each deadline. "
            + ("Avoid weekends completely. " if avoid_weekends else "")
            + "Output STRICT JSON with no extra commentary in this schema:\n"
            '{ "events": [ { "title": "string", "class_code": "string", "start": "YYYY-MM-DDTHH:MM:SS", "end": "YYYY-MM-DDTHH:MM:SS" } ] }\n'
            "Ensure start < end and all events are ON OR BEFORE the corresponding deadline (not after)."
        )

        print("[AI Scheduler] Requesting study plan from GPT...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_summary},
            ],
            response_format={"type": "json_object"},
        )

        try:
            content = response.choices[0].message.content
            parsed = json.loads(content)
        except Exception as e:
            print("[AI Scheduler] Invalid GPT JSON:", e)
            return {"success": False, "message": "AI returned invalid JSON."}

        # Map deadlines to look up and reject sessions after due date
        deadline_by_class = {}
        for u in upcoming:
            # keep the farthest future deadline per class for a conservative bound
            d = parse_iso(u["date"])
            if not d:
                continue
            key = u["class"]
            if key not in deadline_by_class or d > deadline_by_class[key]:
                deadline_by_class[key] = d

        added_events = []

        for e in parsed.get("events", []):
            title = e.get("title")
            code = e.get("class_code")
            start_raw = e.get("start")
            end_raw = e.get("end")
            if not (title and code and start_raw and end_raw):
                continue

            # 1) Fix obvious past-year outputs: put in term/current year
            #    We pick class term year; if not available, current year.
            t_year = None
            for c in classes:
                if (c.code or c.title) == code:
                    t_year = extract_term_year(c.term, current_year)
                    break
            if t_year is None:
                t_year = current_year

            start_iso = ensure_year(start_raw, t_year)
            end_iso = ensure_year(end_raw, t_year)

            s_dt = parse_iso(start_iso)
            e_dt = parse_iso(end_iso)
            if not s_dt or not e_dt:
                continue

            # 2) Enforce working-hour clamps
            s_dt, e_dt = clamp_to_hours(s_dt, e_dt, start_hour, end_hour)

            # 3) Skip if still in the past relative to now
            if e_dt <= now:
                continue

            # 4) Respect "avoid weekends"
            if avoid_weekends and (s_dt.weekday() >= 5 or e_dt.weekday() >= 5):
                continue

            # 5) Reject anything after course's latest deadline
            dl = deadline_by_class.get(code)
            if dl and s_dt > dl:
                continue

            # 6) Conflict check vs existing items
            if is_conflict(s_dt.isoformat(), e_dt.isoformat(), all_existing):
                continue

            # 7) Persist to the matching class
            for c in classes:
                if (c.code or c.title) == code:
                    ev = format_event(c, title, s_dt.replace(microsecond=0).isoformat(), e_dt.replace(microsecond=0).isoformat())
                    if not c.custom_events:
                        c.custom_events = []
                    c.custom_events.append(ev)
                    all_existing.append(ev)
                    added_events.append(ev)
                    print(f"[AI Scheduler] Added: {title} ({ev['start']} - {ev['end']}) for {code}")
                    break

        db.commit()
        db.flush()
        for c in classes:
            db.refresh(c)

        print(f"[AI Scheduler] ✅ Added {len(added_events)} new AI study/work sessions.")
        return {
            "success": True,
            "message": f"Added {len(added_events)} new AI study/work sessions.",
            "added": added_events,
        }

    except Exception as e:
        print("[AI Scheduler Error]", e)
        return {"success": False, "message": str(e)}
