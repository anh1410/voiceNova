import sqlite3

def init_db():
    conn = sqlite3.connect('planner.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            type TEXT,
            date TEXT,
            time TEXT,
            location TEXT,
            people TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_event(event):
    conn = sqlite3.connect('planner.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (title, type, date, time, location, people, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        event.get('title'),
        event.get('type'),
        event.get('date'),
        event.get('time'),
        event.get('location'),
        ', '.join(event.get('people', [])) if isinstance(event.get('people'), list) else event.get('people'),
        event.get('notes')
    ))
    conn.commit()
    conn.close()

def get_all_events():
    conn = sqlite3.connect('planner.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM events ORDER BY date, time')
    events = cursor.fetchall()
    conn.close()
    return events

def delete_event(event_id):
    conn = sqlite3.connect('planner.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()

def update_event(event_id, event):
    conn = sqlite3.connect('planner.db')
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE events
        SET title=?, type=?, date=?, time=?, location=?, people=?, notes=?
        WHERE id=?
    ''', (
        event.get('title'),
        event.get('type'),
        event.get('date'),
        event.get('time'),
        event.get('location'),
        ', '.join(event.get('people', [])) if isinstance(event.get('people'), list) else event.get('people'),
        event.get('notes'),
        event_id
    ))
    conn.commit()
    conn.close()