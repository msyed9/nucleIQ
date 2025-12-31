import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VehicleMaintenance.css';

interface Maintenance { id: number; vehicle_number: string; service_type: string; service_date: string; cost: number; next_service_date?: string; description: string; }

const VehicleMaintenance: React.FC = () => {
    const [records, setRecords] = useState<Maintenance[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ vehicle_id: 0, service_type: '', service_date: '', cost: 0, description: '', next_service_date: '' });

    useEffect(() => { fetchRecords(); fetchVehicles(); }, []);

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/transport/maintenance/', { headers: { Authorization: `Bearer ${token}` } });
            setRecords(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const fetchVehicles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/transport/vehicles/', { headers: { Authorization: `Bearer ${token}` } });
            setVehicles(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/transport/maintenance/', form, { headers: { Authorization: `Bearer ${token}` } });
            setShowModal(false);
            fetchRecords();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="vehicle-maintenance">
            <div className="header"><h1>🔧 Vehicle Maintenance</h1><button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Log Maintenance</button></div>
            <div className="records-grid">
                {records.map(r => (
                    <div key={r.id} className="record-card">
                        <h3>{r.vehicle_number}</h3>
                        <p className="service-type">{r.service_type}</p>
                        <div className="details"><span>📅 {new Date(r.service_date).toLocaleDateString()}</span><span>💰 ₹{r.cost.toLocaleString()}</span></div>
                        {r.next_service_date && <div className="next-service">Next: {new Date(r.next_service_date).toLocaleDateString()}</div>}
                        <p className="description">{r.description}</p>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Log Maintenance</h2><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="modal-body">
                            <div className="form-group"><label>Vehicle</label><select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: Number(e.target.value) })} className="form-control">{vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number}</option>)}</select></div>
                            <div className="form-group"><label>Service Type</label><input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="form-control" /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Service Date</label><input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} className="form-control" /></div>
                                <div className="form-group"><label>Cost</label><input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="form-control" /></div>
                            </div>
                            <div className="form-group"><label>Next Service Date</label><input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} className="form-control" /></div>
                            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-control" rows={3} /></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd}>Save</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleMaintenance;
