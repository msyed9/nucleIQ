import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignmentAnalytics: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>({ submission_rate: 0, avg_grade: 0, total_assignments: 0 });
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/academics/assignment-analytics/', { headers: { Authorization: `Bearer ${token}` } });
                setAnalytics(response.data);
            } catch (err) { console.error(err); }
        };
        fetchAnalytics();
    }, []);
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📊 Assignment Analytics</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#8b5cf6' }}>{analytics.submission_rate}%</div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Submission Rate</div>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#22c55e' }}>{analytics.avg_grade}</div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Average Grade</div>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#3b82f6' }}>{analytics.total_assignments}</div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Total Assignments</div>
                </div>
            </div>
        </div>
    );
};
export default AssignmentAnalytics;
