import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function CalendarScreen() {
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5001/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const hasEvent = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(e => e.date === dateStr);
  };

  const onDayPress = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setDayEvents(events.filter(e => e.date === dateStr));
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📅 Calendar</Text>

      <View style={styles.calendarContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={prevMonth}><Text style={styles.arrow}>◀</Text></TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth}><Text style={styles.arrow}>▶</Text></TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array(firstDay).fill(null).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDay === dateStr;
            const hasEv = hasEvent(day);
            return (
              <TouchableOpacity key={day} style={[styles.dayCell, isSelected && styles.selectedDay]} onPress={() => onDayPress(day)}>
                <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text>
                {hasEv && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedDay && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Events on {selectedDay}</Text>
          {dayEvents.length === 0 ? (
            <Text style={styles.noEvents}>No events on this day!</Text>
          ) : (
            dayEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text>{event.time}</Text>
                <Text>{event.location}</Text>
                <Text>{event.notes}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  calendarContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderColor: '#ddd', borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthTitle: { fontSize: 18, fontWeight: 'bold' },
  arrow: { fontSize: 18, color: '#6C63FF', padding: 8 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#999', fontSize: 12 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', padding: 8, borderRadius: 8 },
  selectedDay: { backgroundColor: '#6C63FF' },
  dayText: { fontSize: 14 },
  selectedDayText: { color: '#fff', fontWeight: 'bold' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6C63FF', marginTop: 2 },
  eventsSection: { marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  noEvents: { color: '#999', textAlign: 'center', marginTop: 10 },
  eventItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderColor: '#ddd', borderWidth: 1 },
  eventTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
});