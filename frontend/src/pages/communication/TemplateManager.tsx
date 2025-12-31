import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Template { id: number; name: string; channel: string; content: string; variables: string[]; }

const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', channel: 'SMS', content: '', variables: '' });

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/communication/templates/', { headers: { Authorization: `Bearer ${token}` } });
            setTemplates(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/communication/templates/', { ...form, variables: form.variables.split(',').map(v => v.trim()) }, { headers: { Authorization: `Bearer ${token}` } });
            setShowModal(false);
            fetchTemplates();
        } catch (err) { console.error(err); }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📝 Message Templates</h1>
                <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>➕ Create Template</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {templates.map(t => (
                    <div key={t.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{t.name}</h3>
                            <span style={{ background: t.channel === 'SMS' ? '#3b82f6' : t.channel === 'EMAIL' ? '#10b981' : '#8b5cf6', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600' }}>{t.channel}</span>
                        </div>
                        <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>{t.content}</p>
                        </div>
                        {t.variables.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {t.variables.map((v, i) => (
                                    <span key={i} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>{v}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: '20px', width: '90%', maxWidth: '700px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Create Template</h2>
                        <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }} /></div>
                        <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Channel</label><select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }}><option value="SMS">SMS</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></select></div>
                        <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Content</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontFamily: 'inherit' }} /></div>
                        <div style={{ marginBottom: '1.5rem' }}><label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Variables (comma-separated)</label><input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="e.g., student_name, class_name" style={{ width: '100%', padding: '0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px' }} /></div>
                        <div style={{ display: 'flex', gap: '1rem' }}><button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', background: 'white' }}>Cancel</button><button onClick={handleSave} style={{ flex: 1, padding: '1rem', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>Save</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManager;
