import React, { useState } from 'react';
import axios from 'axios';

const CreateTicket: React.FC = () => {
    const [form, setForm] = useState({ category: 'TECHNICAL', priority: 'MEDIUM', subject: '', description: '' });
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/helpdesk/tickets/', form, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess('Ticket created successfully!');
            setForm({ category: 'TECHNICAL', priority: 'MEDIUM', subject: '', description: '' });
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🎫 Create Support Ticket</h1>
            {success && <div style={{ padding: '1rem', background: '#d4fc79', borderRadius: '12px', marginTop: '1rem', color: '#065f46' }}>{success}</div>}
            <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginTop: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Category</label>
                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}>
                            <option value="TECHNICAL">Technical Issue</option>
                            <option value="ACADEMIC">Academic Query</option>
                            <option value="ADMINISTRATIVE">Administrative</option>
                            <option value="FACILITY">Facility Issue</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Priority</label>
                        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Subject</label>
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }} placeholder="Brief description of the issue..." />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontFamily: 'inherit' }} placeholder="Provide detailed information about your issue..." />
                </div>
                <button onClick={handleSubmit} style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Create Ticket</button>
            </div>
        </div>
    );
};
export default CreateTicket;
