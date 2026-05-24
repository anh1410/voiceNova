import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function HomeScreen() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1));

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<any>(null);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/events');
      const data = await res.json();
      setEvents(data);
    } catch(e) {}
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = events.filter(ev =>
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.location && ev.location.toLowerCase().includes(q)) ||
      (ev.notes && ev.notes.toLowerCase().includes(q)) ||
      (ev.people && ev.people.toLowerCase().includes(q)) ||
      (ev.date && ev.date.includes(q)) ||
      (ev.type && ev.type.toLowerCase().includes(q))
    );
    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  const openEventCard = (event: any) => {
    setSelectedEvent(event);
    setEditData({ ...event });
    setEditMode(false);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const closeEventCard = () => {
    setSelectedEvent(null);
    setEditMode(false);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`http://localhost:5000/events/${selectedEvent.id}`, { method: 'DELETE' });
      if (!res.ok) { console.error('Delete failed', await res.text()); return; }
      setSelectedEvent(null);
      setEditMode(false);
      setEditData(null);
      await fetchEvents();
    } catch(e) { console.error('Delete error:', e); }
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`http://localhost:5000/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!res.ok) { console.error('Update failed', await res.text()); return; }
      setSelectedEvent(editData);
      setEditMode(false);
      await fetchEvents();
    } catch(e) { console.error('Update error:', e); }
  };

  const parseEvent = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:5000/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await res.json();
      setResult(data);
    } catch(e) {}
    setLoading(false);
  };

  const saveEvent = async () => {
    if (!result) return;
    try {
      await fetch('http://localhost:5000/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      setSaved(true);
      setResult(null);
      setInput('');
      fetchEvents();
      setTimeout(() => setSaved(false), 3000);
    } catch(e) {}
  };

  const toggleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-IN';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e: any) => setInput(e.results[0][0].transcript);
    r.start();
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const hasEvent = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.some(e => e.date === dateStr);
  };

  const currentMonthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}`;
  const sidebarEvents = events.filter(ev => ev.date && ev.date.startsWith(currentMonthPrefix)).slice(0, 3);
  const upcomingEvents = events.slice(0, 5);

  const styles: Record<string, React.CSSProperties> = {
    app: {
      display: 'flex',
      height: '100vh',
      background: '#1a0a2e',
      backgroundImage: 'radial-gradient(#ff69b4 1px, transparent 0), radial-gradient(#ff69b4 1px, #1a0a2e 1px)',
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
      fontFamily: "'VT323', monospace",
      overflow: 'hidden',
      position: 'relative',
      color: '#f0c0ff',
    },
    sidebar: {
      width: sidebarOpen ? 280 : 0,
      overflow: 'hidden',
      background: '#0d0020',
      borderRight: sidebarOpen ? '3px solid #ff69b4' : 'none',
      transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0,
    },
    sidebarInner: { width: 280, padding: '14px', boxSizing: 'border-box' },
    sidebarTitle: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 10,
      color: '#ff69b4',
      marginBottom: 14,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      lineHeight: 1.8,
    },
    calHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      background: '#1a0030',
      padding: '4px 6px',
      border: '1px solid #9b59b6',
    },
    calNav: {
      background: '#ff69b4',
      border: '2px solid #fff',
      cursor: 'pointer',
      color: '#1a0a2e',
      fontFamily: "'VT323', monospace",
      fontSize: 14,
      fontWeight: 'bold',
      padding: '1px 7px',
      lineHeight: 1.2,
    },
    calMonth: { fontSize: 13, color: '#da70d6', fontWeight: 'bold', letterSpacing: '0.5px' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 14 },
    calDayHeader: { textAlign: 'center', fontSize: 10, color: '#ff69b4', fontWeight: 'bold', padding: '2px 0' },
    calDay: {
      textAlign: 'center',
      fontSize: 12,
      color: '#f0c0ff',
      padding: '3px 0',
      cursor: 'pointer',
      border: '1px solid #2a0040',
      background: '#130025',
    },
    toggle: {
      position: 'absolute',
      left: sidebarOpen ? 280 : 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 16,
      height: 48,
      background: '#ff69b4',
      border: '2px solid #fff',
      borderLeft: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1)',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', padding: '18px', position: 'relative', overflow: 'hidden' },
    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      background: '#0d0020',
      padding: '8px 14px',
      border: '2px solid #9b59b6',
      boxShadow: '3px 3px 0 #ff69b4',
    },
    logo: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 13,
      color: '#ff69b4',
      letterSpacing: '1px',
      textShadow: '2px 2px #9b59b6',
    },
    searchWrap: { flex: 1, maxWidth: 340, margin: '0 18px', position: 'relative' as const },
    searchBar: {
      width: '100%',
      background: '#1a0030',
      border: '1px solid #9b59b6',
      padding: '6px 10px 6px 28px',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      color: '#da70d6',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    searchIcon: { position: 'absolute' as const, left: 9, top: '50%', transform: 'translateY(-50%)', color: '#ff69b4', fontSize: 13 },
    searchDropdown: {
      position: 'absolute' as const,
      top: 'calc(100% + 4px)',
      left: 0,
      right: 0,
      background: '#0d0020',
      border: '2px solid #ff69b4',
      zIndex: 200,
      maxHeight: 260,
      overflowY: 'auto' as const,
    },
    searchResultItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderBottom: '1px dashed #2a0040',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
    },
    searchResultTitle: { fontSize: 14, color: '#f0c0ff', fontWeight: 'bold' },
    searchResultMeta: { fontSize: 11, color: '#ff69b4', opacity: 0.8 },
    searchNoResult: { padding: '10px 12px', fontSize: 13, color: '#9b59b6' },
    upcomingWrap: { position: 'relative' as const },
    upcomingBtn: {
      background: '#2a0040',
      border: '1px solid #ff69b4',
      padding: '6px 14px',
      fontFamily: "'VT323', monospace",
      fontSize: 14,
      color: '#f0c0ff',
      cursor: 'pointer',
    },
    dropdown: {
      position: 'absolute' as const,
      right: 0,
      top: 'calc(100% + 6px)',
      width: 270,
      background: '#0d0020',
      border: '2px solid #da70d6',
      padding: 10,
      zIndex: 100,
      display: dropdownOpen ? 'block' : 'none',
    },
    dropdownTitle: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      color: '#ff69b4',
      fontWeight: 'bold',
      marginBottom: 10,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },
    eventItem: { display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px dashed #2a0040', alignItems: 'center', cursor: 'pointer' },
    eventDot: { width: 5, height: 5, background: '#da70d6', flexShrink: 0 },
    eventName: { fontSize: 13, color: '#f0c0ff', fontWeight: 'bold' },
    eventDate: { fontSize: 11, color: '#ff69b4', opacity: 0.8 },
    middle: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const, minHeight: 260 },
    resultCard: {
      background: '#0d0020',
      border: '2px solid #ff69b4',
      padding: '16px',
      maxWidth: 440,
      width: '100%',
      boxShadow: '5px 5px 0px #9b59b6',
      zIndex: 1,
      position: 'relative' as const,
    },
    resultTitle: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 11,
      color: '#da70d6',
      marginBottom: 12,
      borderBottom: '1px solid #2a0040',
      paddingBottom: 6,
    },
    resultRow: { display: 'flex', gap: 8, marginBottom: 7, fontSize: 13 },
    resultLabel: {
      color: '#ff69b4',
      minWidth: 76,
      fontSize: 10,
      textTransform: 'uppercase' as const,
      fontWeight: 'bold',
      fontFamily: "'Press Start 2P', monospace",
    },
    resultValue: { color: '#f0c0ff' },
    resultActions: { display: 'flex', gap: 10, marginTop: 14 },
    btnSave: {
      background: '#ff69b4',
      border: '2px solid #fff',
      padding: '6px 16px',
      color: '#1a0a2e',
      fontWeight: 'bold',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
    },
    btnDiscard: {
      background: 'transparent',
      border: '1px solid #9b59b6',
      padding: '6px 16px',
      color: '#9b59b6',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
    },
    emptyState: { textAlign: 'center' as const, zIndex: 1, position: 'relative' as const },
    emptyText: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 10,
      color: '#2a0040',
      letterSpacing: '1px',
      lineHeight: 1.8,
    },
    bottomArea: { marginTop: 16, position: 'relative' as const, display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box' },
    blobContainer: {
      position: 'relative' as const,
      width: '100%',
      height: 110,
      background: '#0d0020',
      border: '2px solid #da70d6',
      padding: '10px',
      boxSizing: 'border-box' as const,
      boxShadow: '4px 4px 0 #9b59b6',
    },
    blobInput: {
      position: 'absolute' as const,
      zIndex: 2,
      width: 'calc(100% - 170px)',
      height: 'calc(100% - 20px)',
      background: '#1a0030',
      border: '1px solid #9b59b6',
      outline: 'none',
      padding: '8px',
      fontFamily: "'VT323', monospace",
      fontSize: 14,
      color: '#da70d6',
      resize: 'none' as const,
      top: '10px',
      left: '10px',
    },
    blobActions: {
      position: 'absolute' as const,
      right: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 3,
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    },
    micBtn: {
      background: listening ? '#ff69b4' : '#2a0040',
      border: '1px solid #9b59b6',
      width: 36,
      height: 36,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: listening ? '#1a0a2e' : '#da70d6',
      fontSize: 15,
    },
    parseBtn: {
      background: '#da70d6',
      border: '2px solid #fff',
      padding: '9px 16px',
      color: '#1a0a2e',
      fontWeight: 'bold',
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 9,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    modalOverlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(10, 0, 20, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
    },
    modalCard: {
      background: '#0d0020',
      border: '2px solid #ff69b4',
      padding: '20px',
      width: 460,
      maxWidth: '90vw',
      boxShadow: '6px 6px 0 #9b59b6',
      position: 'relative' as const,
      maxHeight: '80vh',
      overflowY: 'auto' as const,
    },
    modalTitle: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 11,
      color: '#ff69b4',
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: '1px solid #2a0040',
    },
    modalField: {
      marginBottom: 10,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 3,
    },
    modalLabel: {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 8,
      color: '#ff69b4',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },
    modalValue: {
      fontSize: 14,
      color: '#f0c0ff',
      padding: '2px 0',
    },
    modalInput: {
      background: '#1a0030',
      border: '1px solid #9b59b6',
      padding: '5px 8px',
      fontFamily: "'VT323', monospace",
      fontSize: 14,
      color: '#da70d6',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    modalActions: {
      display: 'flex',
      gap: 10,
      marginTop: 18,
      flexWrap: 'wrap' as const,
    },
    btnEdit: {
      background: '#2a0040',
      border: '2px solid #da70d6',
      padding: '6px 16px',
      color: '#da70d6',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
    },
    btnDelete: {
      background: 'transparent',
      border: '2px solid #ff4444',
      padding: '6px 16px',
      color: '#ff4444',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
    },
    btnClose: {
      background: 'transparent',
      border: '1px solid #9b59b6',
      padding: '6px 16px',
      color: '#9b59b6',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
      marginLeft: 'auto' as const,
    },
    btnConfirm: {
      background: '#ff69b4',
      border: '2px solid #fff',
      padding: '6px 16px',
      color: '#1a0a2e',
      fontWeight: 'bold',
      fontFamily: "'VT323', monospace",
      fontSize: 15,
      cursor: 'pointer',
    },
  };

  const fields: [string, string][] = [
    ['type', 'type'],
    ['date', 'date'],
    ['time', 'time'],
    ['location', 'location'],
    ['people', 'people'],
    ['notes', 'notes'],
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&display=swap" rel="stylesheet" />

      <div style={styles.app}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarInner}>
            <div style={styles.sidebarTitle}>✿ my calendar ✿</div>
            <div style={styles.calHeader}>
              <button style={styles.calNav} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1))}>◀</button>
              <span style={styles.calMonth}>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
              <button style={styles.calNav} onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1))}>▶</button>
            </div>
            <div style={styles.calGrid}>
              {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={styles.calDayHeader}>{d}</div>)}
              {Array(getFirstDay(currentMonth)).fill(null).map((_,i) => <div key={`e${i}`} />)}
              {Array(getDaysInMonth(currentMonth)).fill(null).map((_,i) => {
                const day = i+1;
                const today = new Date();
                const isToday = day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
                const targetDayHasEvent = hasEvent(day);
                return (
                  <div key={day} style={{
                    ...styles.calDay,
                    background: isToday ? '#ff69b4' : targetDayHasEvent ? '#2a0040' : '#130025',
                    color: isToday ? '#1a0a2e' : targetDayHasEvent ? '#da70d6' : '#f0c0ff',
                    fontWeight: isToday || targetDayHasEvent ? 'bold' : 'normal',
                    border: targetDayHasEvent ? '1px dashed #da70d6' : isToday ? '1px solid #fff' : '1px solid #2a0040',
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '2px dashed #9b59b6', paddingTop: 10 }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#ff69b4', fontWeight: 'bold', marginBottom: 8, letterSpacing: '1px', lineHeight: 1.8 }}>♡ logged events //</div>
              {sidebarEvents.length === 0 ? (
                <div style={{ fontSize: 11, color: '#9b59b6', paddingLeft: 8 }}>no events this month</div>
              ) : (
                sidebarEvents.map(ev => (
                  <div key={ev.id} onClick={() => openEventCard(ev)} style={{ paddingLeft: 8, borderLeft: '2px solid #ff69b4', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ fontSize: 12, color: '#da70d6', fontWeight: 'bold' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: '#f0c0ff', opacity: 0.7 }}>{ev.date} @ {ev.time}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR TOGGLE */}
        <button style={styles.toggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span style={{ color: '#1a0a2e', fontSize: 10, fontWeight: 'bold', transform: sidebarOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>
            {sidebarOpen ? '◀' : '▶'}
          </span>
        </button>

        {/* MAIN */}
        <div style={styles.main}>

          {/* TOPBAR */}
          <div style={styles.topbar}>
            <div style={styles.logo}>voiceNova✦</div>

            {/* SEARCH */}
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>♡</span>
              <input
                style={styles.searchBar}
                placeholder="search your events..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              {showSearchResults && (
                <div style={styles.searchDropdown}>
                  {searchResults.length === 0 ? (
                    <div style={styles.searchNoResult}>no events found ✦</div>
                  ) : (
                    searchResults.map(ev => (
                      <div
                        key={ev.id}
                        style={styles.searchResultItem}
                        onClick={() => openEventCard(ev)}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1a0030')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={styles.searchResultTitle}>{ev.title}</span>
                        <span style={styles.searchResultMeta}>{ev.date} · {ev.time} · {ev.type}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* UPCOMING DROPDOWN */}
            <div style={styles.upcomingWrap} ref={dropdownRef}>
              <button style={styles.upcomingBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>upcoming events ▾</button>
              <div style={styles.dropdown}>
                <div style={styles.dropdownTitle}>// incoming_queue</div>
                {upcomingEvents.map(ev => (
                  <div key={ev.id} style={styles.eventItem} onClick={() => { openEventCard(ev); setDropdownOpen(false); }}>
                    <div style={styles.eventDot} />
                    <div>
                      <div style={styles.eventName}>{ev.title}</div>
                      <div style={styles.eventDate}>{ev.date} · {ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE */}
          <div style={styles.middle}>
            <span style={{ position: 'absolute', top: '8%', left: '4%', color: '#2a0040', fontSize: 13, fontFamily: "'VT323', monospace" }}>✦ system online ✦</span>
            <span style={{ position: 'absolute', top: '18%', right: '6%', color: '#2a0040', fontSize: 13 }}>⋆˚✿</span>
            <span style={{ position: 'absolute', bottom: '20%', left: '8%', color: '#2a0040', fontSize: 13 }}>♡</span>

            {loading && (
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#ff69b4', letterSpacing: '2px', zIndex: 1, position: 'relative' }}>
                ⋆ parsing + love the way you talk...
              </div>
            )}

            {result && !loading && (
              <div style={styles.resultCard}>
                <div style={styles.resultTitle}>&gt; {result.title}</div>
                {[['type',result.type],['date',result.date],['time',result.time],['location',result.location],['people', Array.isArray(result.people) ? result.people.join(', ') : result.people],['notes',result.notes]].map(([label, val]) => (
                  <div key={label} style={styles.resultRow}>
                    <span style={styles.resultLabel}>{label}</span>
                    <span style={styles.resultValue}>{val || '—'}</span>
                  </div>
                ))}
                <div style={styles.resultActions}>
                  <button style={styles.btnSave} onClick={saveEvent}>✦ save event</button>
                  <button style={styles.btnDiscard} onClick={() => setResult(null)}>discard</button>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div style={styles.emptyState}>
                <div style={styles.emptyText}>
                  {saved ? '✦ event saved! ✦' : 'empty your thoughts below ✦'}
                </div>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div style={styles.bottomArea}>
            <div style={styles.blobContainer}>
              <textarea
                style={styles.blobInput}
                placeholder="empty your thoughts here ✦ ill organise them"
                value={input}
                onChange={e => setInput(e.target.value)}
                rows={2}
              />
              <div style={styles.blobActions}>
                <button style={styles.micBtn} onClick={toggleListen}>{listening ? '⌾' : '🎤'}</button>
                <button style={styles.parseBtn} onClick={parseEvent}>parse ✦</button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) closeEventCard(); }}>
          <div style={styles.modalCard}>
            <div style={styles.modalTitle}>
              {editMode ? '✎ editing event' : `✦ ${selectedEvent.title}`}
            </div>

            {editMode ? (
              <>
                <div style={styles.modalField}>
                  <span style={styles.modalLabel}>title</span>
                  <input style={styles.modalInput} value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} />
                </div>
                {fields.map(([label, key]) => (
                  <div key={key} style={styles.modalField}>
                    <span style={styles.modalLabel}>{label}</span>
                    <input style={styles.modalInput} value={editData[key] || ''} onChange={e => setEditData({...editData, [key]: e.target.value})} />
                  </div>
                ))}
                <div style={styles.modalActions}>
                  <button style={styles.btnConfirm} onClick={handleSaveEdit}>✦ save changes</button>
                  <button style={styles.btnDiscard} onClick={() => { setEditMode(false); setEditData({...selectedEvent}); }}>cancel</button>
                </div>
              </>
            ) : (
              <>
                {[['title', selectedEvent.title], ...fields.map(([l, k]) => [l, selectedEvent[k]])].map(([label, val]) => (
                  <div key={label} style={styles.modalField}>
                    <span style={styles.modalLabel}>{label}</span>
                    <span style={styles.modalValue}>{val || '—'}</span>
                  </div>
                ))}
                <div style={styles.modalActions}>
                  <button style={styles.btnEdit} onClick={() => setEditMode(true)}>✎ edit</button>
                  <button style={styles.btnDelete} onClick={handleDelete}>✕ delete</button>
                  <button style={styles.btnClose} onClick={closeEventCard}>close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
