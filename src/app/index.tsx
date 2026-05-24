import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [saved, setSaved] = useState(false);
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser!');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const parseEvent = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setSaved(false);
    try {
      const response = await fetch('http://localhost:5000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const saveEvent = async () => {
    if (!result) return;
    try {
      await fetch('http://localhost:5000/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      setSaved(true);
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎙️ Voice Planner</Text>

      <TouchableOpacity style={styles.calendarButton} onPress={() => window.location.href = '/calendar'}>
        <Text style={styles.buttonText}>📅 View Calendar</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="empty your thoughts <3 ill organise it"
        value={input}
        onChangeText={setInput}
        multiline
      />

      <TouchableOpacity style={[styles.voiceButton, listening && styles.voiceButtonActive]} onPress={startListening}>
        <Text style={styles.buttonText}>{listening ? '🔴 Listening...' : '🎙️ Speak'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={parseEvent}>
        <Text style={styles.buttonText}>Parse Event</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#6C63FF" />}

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 {result.title}</Text>
          <Text>Type: {result.type}</Text>
          <Text>Date: {result.date}</Text>
          <Text>Time: {result.time}</Text>
          <Text>Location: {result.location}</Text>
          <Text>People: {result.people?.join(', ')}</Text>
          <Text>Notes: {result.notes}</Text>

          <TouchableOpacity style={styles.saveButton} onPress={saveEvent}>
            <Text style={styles.buttonText}>{saved ? '✅ Saved!' : 'Save Event'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {events.length > 0 && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>📋 Saved Events</Text>
          {events.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text>{event.date} at {event.time}</Text>
              <Text>{event.location}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, minHeight: 80, borderColor: '#ddd', borderWidth: 1 },
  button: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  calendarButton: { backgroundColor: '#FF9500', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  voiceButton: { backgroundColor: '#FF6B6B', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  voiceButtonActive: { backgroundColor: '#cc0000' },
  saveButton: { backgroundColor: '#22C55E', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6, borderColor: '#ddd', borderWidth: 1, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  eventsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  eventItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderColor: '#ddd', borderWidth: 1 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
});