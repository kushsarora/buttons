import os, re, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ===== Helper: regex fallback for lecture/discussion times =====
def extract_meetings_from_text(text: str):
    """
    Scan syllabus text for meeting patterns like:
      MWF 9:00–9:50 AM
      TuTh 2:30–3:45 PM
      Monday 10-11 AM in Room 101
    Returns a list of meeting dicts with {type, day, start_time, end_time, location}.
    """
    # Match day patterns and times
    day_pattern = r"(Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?|MWF|TR|TTh|TuTh)"
    time_pattern = r"(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)[\s–\-to]+(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)?)"
    loc_pattern = r"(?:in|at)\s+([A-Z]?[A-Za-z0-9\s\-]+(?:Hall|Room|Bldg|Building|Auditorium|Center|Lab|Rm)?\s*\d*)"

    combined = re.findall(
        rf"({day_pattern}.*?)({time_pattern})(?:.*?{loc_pattern})?",
        text, re.IGNORECASE
    )

    meetings = []
    for match in combined:
        raw = " ".join(match)
        # Normalize day codes
        day_segment = match[0]
        day_segment = day_segment.strip().replace("TTh", "TuTh")
        days = []
        if "MWF" in day_segment.upper():
            days = ["Mon", "Wed", "Fri"]
        elif re.search(r"T.?R", day_segment.upper()):
            days = ["Tue", "Thu"]
        else:
            for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
                if d.lower() in day_segment.lower():
                    days.append(d)

        start_time, end_time = match[2], match[3]
        location = match[4].strip() if len(match) > 4 and match[4] else ""

        for d in days:
            meetings.append({
                "type": "Lecture",
                "day": d,
                "start_time": start_time.replace(" ", ""),
                "end_time": end_time.replace(" ", ""),
                "location": location
            })
    return meetings


# ===== Core Parser =====
def parse_with_ai(text: str) -> dict:
    """
    Uses GPT-4o-mini to parse syllabus text into structured JSON.
    Also regex-detects meeting patterns as backup.
    """
    if not text or len(text.strip()) < 100:
        print("[AI Parser] ⚠️ Syllabus text too short or empty.")
        return {
            "title": None,
            "term": None,
            "instructor": None,
            "assignments": [],
            "exams": [],
            "meetings": [],
            "notes": None
        }

    system_prompt = (
        "You are an AI that extracts structured information from a university course syllabus. "
        "Return ONLY valid JSON — no markdown, no commentary."
    )

    user_prompt = f"""
    Extract all useful class information in this strict JSON format:
    {{
      "title": string | null,
      "term": string | null,
      "instructor": string | null,
      "assignments": [
        {{
          "title": string,
          "weight": float | null,
          "due_date": string | null,
          "details": string | null
        }}
      ],
      "exams": [
        {{
          "title": string,
          "weight": float | null,
          "date": string | null,
          "details": string | null
        }}
      ],
      "meetings": [
        {{
          "type": string,           // Lecture, Discussion, Lab, etc.
          "day": string,            // e.g. "Mon", "Tue", "Wed"
          "start_time": string,     // 24h format HH:MM if available
          "end_time": string,       // 24h format HH:MM if available
          "location": string | null
        }}
      ],
      "notes": string | null
    }}

    - Include all recurring meetings like Lecture, Discussion, or Lab.
    - Prefer explicit times and days (e.g. “MWF 9:00–9:50 AM” or “TTh 2:30-3:45 PM”).
    - If time/day missing, leave them blank but keep entry.
    Syllabus text:
    {text[:15000]}
    """

    try:
        # ---- Run AI parser ----
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content.strip()
        data = json.loads(content) if content else {}

        # ---- Validate structure ----
        for key in ["assignments", "exams", "meetings"]:
            if key not in data or not isinstance(data[key], list):
                data[key] = []

        # ---- Fallback: regex meeting detection ----
        regex_meetings = extract_meetings_from_text(text)
        if regex_meetings:
            # Merge non-duplicates
            seen = {(m["day"], m["start_time"], m["end_time"]) for m in data["meetings"]}
            for m in regex_meetings:
                sig = (m["day"], m["start_time"], m["end_time"])
                if sig not in seen:
                    data["meetings"].append(m)
                    seen.add(sig)

        print(f"[AI Parser] ✅ Parsed syllabus successfully — {len(data['meetings'])} meetings found.")
        return data

    except Exception as e:
        print(f"[AI Parser Error] {e}")
        return {
            "title": None, "term": None, "instructor": None,
            "assignments": [], "exams": [], "meetings": [], "notes": None
        }
