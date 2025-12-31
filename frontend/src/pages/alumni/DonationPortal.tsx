import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DonationPortal: React.FC = () => {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/alumni/campaigns/', { headers: { Authorization: `Bearer ${token}` } });
                setCampaigns(response.data.results || response.data);
            } catch (err) { console.error(err); }
        };
        fetchCampaigns();
    }, []);
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>💰 Donation Portal</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {campaigns.map(c => (
                    <div key={c.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{c.title}</h3>
                        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>{c.description}</p>
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Goal: ₹{c.target_amount.toLocaleString()}</span>
                                <span style={{ fontWeight: 'bold', color: '#22c55e' }}>₹{c.raised_amount.toLocaleString()}</span>
                            </div>
                            <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', width: `${(c.raised_amount / c.target_amount) * 100}%` }} />
                            </div>
                        </div>
                        <button style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Donate Now</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default DonationPortal;
