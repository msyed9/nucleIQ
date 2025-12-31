import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PurchaseOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ vendor_id: 0, items: [], total_amount: 0 });
    useEffect(() => { fetchOrders(); }, []);
    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/inventory/purchase-orders/', { headers: { Authorization: `Bearer ${token}` } });
            setOrders(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };
    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/inventory/purchase-orders/', form, { headers: { Authorization: `Bearer ${token}` } });
            setShowModal(false);
            fetchOrders();
        } catch (err) { console.error(err); }
    };
    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <h1 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📦 Purchase Orders</h1>
                <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>➕ Create PO</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {orders.map(o => (
                    <div key={o.id} style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>PO #{o.po_number}</h3>
                            <span style={{ background: o.status === 'APPROVED' ? '#22c55e' : '#f59e0b', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600' }}>{o.status}</span>
                        </div>
                        <p>Vendor: {o.vendor_name}</p>
                        <p>Date: {new Date(o.order_date).toLocaleDateString()}</p>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontWeight: 'bold' }}>Total: ₹{o.total_amount.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PurchaseOrders;
