import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_with_ai(text: str) -> dict:
    """
    Uses GPT-4o-mini to parse syllabus text into structured JSON.
    Pulls title, term, instructor, assignments, exams, meetings, and notes.
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
          "type": string,           // Lecture, Discussion, Lab, Office Hours, etc.
          "day": string,            // e.g. "Mon", "Tue", "Wed"
          "start_time": string,     // 24h format HH:MM if available
          "end_time": string,       // 24h format HH:MM if available
          "location": string | null // building/room if listed
        }}
      ],
      "notes": string | null
    }}

    - Only return meetings that recur weekly (lecture, lab, discussion, etc.).
    - If multiple sections exist, list each separately.
    - Try to infer missing details logically (e.g., “MWF 9:00–9:50 AM”).
    - If no meeting times found, return an empty list.
    Syllabus text:
    {text[:15000]}
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content.strip()
        if not content:
            print("[AI Parser] ⚠️ Empty model response.")
            return {
                "title": None, "term": None, "instructor": None,
                "assignments": [], "exams": [], "meetings": [], "notes": None
            }

        try:
            data = json.loads(content)
            print("[AI Parser] ✅ Parsed syllabus successfully.")
            # Ensure all keys exist
            for key in ["assignments", "exams", "meetings"]:
                if key not in data or not isinstance(data[key], list):
                    data[key] = []
            return data
        except json.JSONDecodeError:
            print("[AI Parser] ⚠️ Invalid JSON returned.")
            return {
                "title": None, "term": None, "instructor": None,
                "assignments": [], "exams": [], "meetings": [], "notes": None
            }

    except Exception as e:
        print(f"[AI Parser Error] {e}")
        return {
            "title": None, "term": None, "instructor": None,
            "assignments": [], "exams": [], "meetings": [], "notes": None
        }
