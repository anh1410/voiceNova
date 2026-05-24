import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_event_reminder(event):
    sender = os.getenv("GMAIL_USER")
    password = os.getenv("GMAIL_APP_PASSWORD")
    recipient = os.getenv("NOTIFY_EMAIL")

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = recipient
    msg['Subject'] = f"⏰ Reminder: {event.get('title')} in 1 hour!"

    body = f"""
Hey! You have an event coming up in 1 hour:

📌 {event.get('title')}
📅 {event.get('date')} at {event.get('time')}
📍 {event.get('location') or 'No location'}
👥 {event.get('people') or 'No people'}
📝 {event.get('notes') or 'No notes'}
    """

    msg.attach(MIMEText(body, 'plain'))

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(sender, password)
        server.sendmail(sender, recipient, msg.as_string())
        print(f"✅ Reminder sent for: {event.get('title')}")