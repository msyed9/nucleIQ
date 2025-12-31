import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HostelFees: React.FC = () => {
    const [allocations, setAllocations] = useState<any[]>([]);
    useEffect(() => { fetchAllocations(); }, []);
    const fetchAllocations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/hostel/allocations/', { headers: { Authorization: `Bearer ${token}` } });
            setAllocations(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏠 Hostel Fees Management</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {allocations.map(a => (
                    <div key={a.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{a.student_name}</h3>
                        <p>Room: {a.room_number} • Bed: {a.bed_number}</p>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Monthly Fee:</span><span>₹{a.monthly_fee}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid:</span><span>₹{a.paid_amount || 0}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#ef4444' }}><span>Due:</span><span>₹{a.monthly_fee - (a.paid_amount || 0)}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default HostelFees;
