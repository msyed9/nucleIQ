import React, { useState } from 'react';
import axios from 'axios';

const CertificateRequest: React.FC = () => {
    const [form, setForm] = useState({ certificate_type: 'BONAFIDE', purpose: '', delivery_mode: 'COLLECT' });
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/certificates/requests/', form, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess('Certificate request submitted successfully!');
            setForm({ certificate_type: 'BONAFIDE', purpose: '', delivery_mode: 'COLLECT' });
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📜 Certificate Request</h1>
            {success && <div style={{ padding: '1rem', background: '#d4fc79', borderRadius: '12px', marginTop: '1rem', color: '#065f46' }}>{success}</div>}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginTop: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Certificate Type</label>
                    <select value={form.certificate_type} onChange={(e) => setForm({ ...form, certificate_type: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}>
                        <option value="BONAFIDE">Bonafide Certificate</option>
                        <option value="TRANSFER">Transfer Certificate</option>
                        <option value="CHARACTER">Character Certificate</option>
                        <option value="COURSE_COMPLETION">Course Completion</option>
                    </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Purpose</label>
                    <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontFamily: 'inherit' }} placeholder="Specify the purpose for this certificate..." />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Delivery Mode</label>
                    <select value={form.delivery_mode} onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}>
                        <option value="COLLECT">Collect from Office</option>
                        <option value="POST">Send by Post</option>
                        <option value="EMAIL">Email (Digital)</option>
                    </select>
                </div>
                <button onClick={handleSubmit} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Submit Request</button>
            </div>
        </div>
    );
};
export default CertificateRequest;
