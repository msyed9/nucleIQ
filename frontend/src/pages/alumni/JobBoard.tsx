import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobBoard: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/alumni/jobs/', { headers: { Authorization: `Bearer ${token}` } });
                setJobs(response.data.results || response.data);
            } catch (err) { console.error(err); }
        };
        fetchJobs();
    }, []);
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>💼 Job Board</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {jobs.map(j => (
                    <div key={j.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{j.title}</h3>
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{j.company} • {j.location}</p>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>💰 {j.salary_range}</span>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>📅 {j.experience_required}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>{j.description}</p>
                        <button style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Apply Now</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default JobBoard;
