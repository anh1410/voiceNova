from src.services.groq_service import parse_event

result = parse_event("I have a meeting with Devi on Friday at 3pm at CCD")
print(result)