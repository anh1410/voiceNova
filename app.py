from flask import Flask, request, jsonify
from flask_cors import CORS
from src.services.groq_service import parse_event
from src.services.database import init_db, save_event, get_all_events, delete_event, update_event
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

init_db()
from src.services.scheduler import start_scheduler
scheduler = start_scheduler()

@app.route('/parse', methods=['POST'])
def parse():
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    result = parse_event(text)
    result = result.replace('```json', '').replace('```', '').strip()
    parsed = json.loads(result)
    return jsonify(parsed)

@app.route('/save', methods=['POST'])
def save():
    event = request.json
    save_event(event)
    return jsonify({'message': 'Event saved!'})

@app.route('/events', methods=['GET'])
def events():
    all_events = get_all_events()
    events_list = []
    for e in all_events:
        events_list.append({
            'id': e[0],
            'title': e[1],
            'type': e[2],
            'date': e[3],
            'time': e[4],
            'location': e[5],
            'people': e[6],
            'notes': e[7]
        })
    return jsonify(events_list)

@app.route('/events/<int:event_id>', methods=['DELETE'])
def delete(event_id):
    delete_event(event_id)
    return jsonify({'message': 'Event deleted!'})

@app.route('/events/<int:event_id>', methods=['PUT'])
def update(event_id):
    event = request.json
    update_event(event_id, event)
    return jsonify({'message': 'Event updated!'})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
