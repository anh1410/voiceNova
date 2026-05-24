from groq import Groq
from datetime import date
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_event(text):
    today = date.today().isoformat()
    prompt = f"""
    Extract event details from this text and return JSON only:
    Text: "{text}"
    
    Current year is 2026. If no date is specified use today's date: {today}.
    If no year is specified assume 2026.
    
    Return this exact format:
    {{
        "type": "event/alarm/reminder/task",
        "title": "event title",
        "date": "YYYY-MM-DD or null",
        "time": "HH:MM or null",
        "location": "location or null",
        "people": ["person1", "person2"] or [],
        "notes": "any extra info or null"
    }}
    """
    
    response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    
    return response.choices[0].message.content