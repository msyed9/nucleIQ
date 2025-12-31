import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventRegistration: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/alumni/events/', { headers: { Authorization: `Bearer ${token}` } });
                setEvents(response.data.results || response.data);
            } catch (err) { console.error(err); }
        };
        fetchEvents();
    }, []);
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎉 Alumni Events</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {events.map(e => (
                    <div key={e.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{e.title}</h3>
                        <p>📅 {new Date(e.event_date).toLocaleDateString()} • 📍 {e.venue}</p>
                        <p style={{ marginTop: '1rem' }}>{e.description}</p>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px' }}>
                            <span>👥 {e.registered_count || 0} / {e.max_participants} registered</span>
                        </div>
                        <button style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Register</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default EventRegistration;
