import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FollowupScheduler: React.FC = () => {
    const [followups, setFollowups] = useState<any[]>([]);
    useEffect(() => {
        const fetchFollowups = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/crm/followups/', { headers: { Authorization: `Bearer ${token}` } });
                setFollowups(response.data.results || response.data);
            } catch (err) { console.error(err); }
        };
        fetchFollowups();
    }, []);
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📅 Follow-up Scheduler</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {followups.map(f => (
                    <div key={f.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{f.lead_name}</h3>
                        <p>📞 {f.followup_type} • {new Date(f.scheduled_date).toLocaleDateString()}</p>
                        <p style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', marginTop: '1rem' }}>{f.notes}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default FollowupScheduler;
