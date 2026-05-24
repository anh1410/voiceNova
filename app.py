from flask import Flask, request, jsonify
from flask_cors import CORS
from src.services.groq_service import parse_event
from src.services.database import init_db, save_event, get_all_events
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize database on startup
init_db()

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

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)