import React, { useState } from 'react';
import axios from 'axios';

const PassRequest: React.FC = () => {
    const [form, setForm] = useState({ pass_type: 'GATE', from_date: '', to_date: '', reason: '' });
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/security/pass-requests/', form, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess('Pass request submitted successfully!');
            setForm({ pass_type: 'GATE', from_date: '', to_date: '', reason: '' });
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎫 Gate Pass Request</h1>
            {success && <div style={{ padding: '1rem', background: '#d4fc79', borderRadius: '12px', marginTop: '1rem', color: '#065f46' }}>{success}</div>}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginTop: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Pass Type</label>
                    <select value={form.pass_type} onChange={(e) => setForm({ ...form, pass_type: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}>
                        <option value="GATE">Gate Pass</option>
                        <option value="LIBRARY">Library Pass</option>
                        <option value="HOSTEL">Hostel Pass</option>
                        <option value="VEHICLE">Vehicle Pass</option>
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>From Date</label>
                        <input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>To Date</label>
                        <input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }} />
                    </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Reason</label>
                    <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontFamily: 'inherit' }} placeholder="Specify the reason for pass request..." />
                </div>
                <button onClick={handleSubmit} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Submit Request</button>
            </div>
        </div>
    );
};
export default PassRequest;
