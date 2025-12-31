import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VendorManagement: React.FC = () => {
    const [vendors, setVendors] = useState<any[]>([]);
    useEffect(() => { fetchVendors(); }, []);
    const fetchVendors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/inventory/vendors/', { headers: { Authorization: `Bearer ${token}` } });
            setVendors(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };
    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🏢 Vendor Management</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {vendors.map(v => (
                    <div key={v.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>{v.name}</h3>
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📧</span><span>{v.email}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📞</span><span>{v.phone}</span></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>📍</span><span>{v.address}</span></div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment Terms:</span><span>{v.payment_terms} days</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Orders:</span><span>{v.total_orders || 0}</span></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default VendorManagement;
