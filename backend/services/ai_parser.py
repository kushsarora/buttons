import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_with_ai(text: str) -> dict:
    """
    Uses GPT-4o-mini to parse syllabus text into structured JSON.
    Pulls title, term, instructor, assignments (weights/due), exams (weights/dates), and notes.
    """
    if not text or len(text.strip()) < 100:
        print("[AI Parser] ⚠️ Syllabus text too short or empty.")
        return {
            "title": None,
            "term": None,
            "instructor": None,
            "assignments": [],
            "exams": [],
            "notes": None
        }

    system_prompt = (
        "You are an AI that extracts structured information from university course syllabi. "
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
          "weight": float | null,      // percent weight of total grade (omit % symbol)
          "due_date": string | null,   // human-readable date if present
          "details": string | null
        }}
      ],
      "exams": [
        {{
          "title": string,             // e.g., "Midterm 1", "Final Exam"
          "weight": float | null,      // percent weight
          "date": string | null,       // exam date if present
          "details": string | null
        }}
      ],
      "notes": string | null
    }}

    If weight is written like "15%" return 15. If unknown, return null.
    Try to infer title/term/instructor from header blocks if not explicit.
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
                "assignments": [], "exams": [], "notes": None
            }

        try:
            data = json.loads(content)
            print("[AI Parser] ✅ Parsed syllabus successfully.")
            return data
        except json.JSONDecodeError:
            print("[AI Parser] ⚠️ Invalid JSON returned.")
            return {
                "title": None, "term": None, "instructor": None,
                "assignments": [], "exams": [], "notes": None
            }

    except Exception as e:
        print(f"[AI Parser Error] {e}")
        return {
            "title": None, "term": None, "instructor": None,
            "assignments": [], "exams": [], "notes": None
        }
