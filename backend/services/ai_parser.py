import os, json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def parse_with_ai(text: str) -> dict:
    """
    Uses GPT-4o-mini to parse syllabus text into structured JSON.
    Returns default structure if parsing fails.
    """
    if not text or len(text.strip()) < 100:
        print("[AI Parser] ⚠️ Syllabus text too short or empty.")
        return {"title": None, "code": None, "instructor": None, "term": None, "requirements": []}

    system_prompt = (
        "You are an AI that extracts structured information from course syllabi. "
        "Return ONLY valid JSON—no markdown, no explanation."
    )

    user_prompt = f"""
    Parse the following syllabus into this JSON schema:
    {{
      "title": string | null,
      "code": string | null,
      "instructor": string | null,
      "term": string | null,
      "location": string | null,
      "meeting_times": string | null,
      "grading_policy": string | null,
      "notes": string | null,
      "requirements": [
        {{
          "kind": "Exam" | "Assignment" | "Project" | "Quiz" | "Other",
          "title": string,
          "weight": float | null,
          "due": string | null,
          "details": string
        }}
      ]
    }}

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

        # 🛡️ Validation
        if not content:
            print("[AI Parser] ⚠️ Empty model response.")
            return {"title": None, "code": None, "instructor": None, "term": None, "requirements": []}

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            print("[AI Parser] ⚠️ Invalid JSON returned.")
            return {"title": None, "code": None, "instructor": None, "term": None, "requirements": []}

    except Exception as e:
        print(f"[AI Parser Error] {e}")
        return {"title": None, "code": None, "instructor": None, "term": None, "requirements": []}
