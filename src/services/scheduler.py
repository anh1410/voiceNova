from apscheduler.schedulers.background import BackgroundScheduler
from src.services.database import get_all_events
from src.services.notify import send_event_reminder
from datetime import datetime, timedelta

def check_upcoming_events():
    events = get_all_events()
    now = datetime.now()

    for e in events:
        try:
            event_dt = datetime.strptime(f"{e[3]} {e[4]}", "%Y-%m-%d %H:%M")
            diff = (event_dt - now).total_seconds() / 60
            if 55 <= diff <= 65:
                send_event_reminder({
                    'title': e[1],
                    'date': e[3],
                    'time': e[4],
                    'location': e[5],
                    'people': e[6],
                    'notes': e[7]
                })
        except Exception as ex:
            print(f"Scheduler error: {ex}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_upcoming_events, 'interval', minutes=5)
    scheduler.start()
    print("✅ Scheduler started — checking every 5 mins")
    return scheduler