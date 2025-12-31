import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StockAdjustment: React.FC = () => {
    const [adjustments, setAdjustments] = useState<any[]>([]);
    useEffect(() => { fetchAdjustments(); }, []);
    const fetchAdjustments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/inventory/stock-adjustments/', { headers: { Authorization: `Bearer ${token}` } });
            setAdjustments(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📊 Stock Adjustment</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {adjustments.map(a => (
                    <div key={a.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{a.item_name}</h3>
                        <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                            <span>Qty: {a.quantity_adjusted}</span>
                            <span style={{ color: a.adjustment_type === 'INCREASE' ? '#22c55e' : '#ef4444' }}>{a.adjustment_type}</span>
                        </div>
                        <p style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '8px' }}>Reason: {a.reason}</p>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Date: {new Date(a.adjustment_date).toLocaleDateString()}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default StockAdjustment;
