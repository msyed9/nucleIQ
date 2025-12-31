import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeliveryReports: React.FC = () => {
    const [reports, setReports] = useState<any[]>([]);
    useEffect(() => { fetchReports(); }, []);
    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/communication/delivery-reports/', { headers: { Authorization: `Bearer ${token}` } });
            setReports(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📊 Delivery Reports</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {reports.map(r => (
                    <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{r.message_title}</h3>
                        <p>Channel: {r.channel}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{r.delivered || 0}</div><div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Delivered</div></div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{r.pending || 0}</div><div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Pending</div></div>
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{r.failed || 0}</div><div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Failed</div></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default DeliveryReports;
