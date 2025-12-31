import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PassApproval: React.FC = () => {
    const [requests, setRequests] = useState<any[]>([]);
    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/security/pass-requests/', { headers: { Authorization: `Bearer ${token}` } });
            setRequests(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const handleApprove = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/security/pass-requests/${id}/approve/`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchRequests();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✅ Pass Approval</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {requests.filter(r => r.status === 'PENDING').map(r => (
                    <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{r.student_name}</h3>
                        <p style={{ color: '#6b7280' }}>{r.pass_type} Pass</p>
                        <p style={{ marginTop: '0.5rem' }}>📅 {new Date(r.from_date).toLocaleDateString()} - {new Date(r.to_date).toLocaleDateString()}</p>
                        <p style={{ marginTop: '1rem', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>{r.reason}</p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button onClick={() => handleApprove(r.id)} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>✅ Approve</button>
                            <button style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>❌ Reject</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PassApproval;
