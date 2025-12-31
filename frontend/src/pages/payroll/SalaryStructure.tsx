import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalaryStructure.css';

interface Component { id?: number; name: string; type: 'EARNING' | 'DEDUCTION'; calculation: 'FIXED' | 'PERCENTAGE'; value: number; }
interface Structure { id?: number; staff_id: number; staff_name?: string; effective_from: string; gross_salary: number; components: Component[]; }

const SalaryStructure: React.FC = () => {
    const [structures, setStructures] = useState<Structure[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<Structure>({ staff_id: 0, effective_from: '', gross_salary: 0, components: [] });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => { fetchStructures(); fetchStaff(); }, []);

    const fetchStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/payroll/salary-structures/', { headers: { Authorization: `Bearer ${token}` } });
            setStructures(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/staff/', { headers: { Authorization: `Bearer ${token}` } });
            setStaff(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/payroll/salary-structures/', form, { headers: { Authorization: `Bearer ${token}` } });
            setSuccess('Salary structure created!');
            setShowModal(false);
            fetchStructures();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save');
        } finally { setLoading(false); }
    };

    const addComponent = () => {
        setForm({ ...form, components: [...form.components, { name: '', type: 'EARNING', calculation: 'FIXED', value: 0 }] });
    };

    const updateComponent = (index: number, field: string, value: any) => {
        const updated = [...form.components];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, components: updated });
    };

    const calculateNet = () => {
        const earnings = form.components.filter(c => c.type === 'EARNING').reduce((sum, c) => sum + (c.calculation === 'FIXED' ? c.value : form.gross_salary * c.value / 100), 0);
        const deductions = form.components.filter(c => c.type === 'DEDUCTION').reduce((sum, c) => sum + (c.calculation === 'FIXED' ? c.value : form.gross_salary * c.value / 100), 0);
        return earnings - deductions;
    };

    return (
        <div className="salary-structure">
            <div className="header">
                <h1>💰 Salary Structure Builder</h1>
                <button className="btn btn-primary" onClick={() => { setForm({ staff_id: 0, effective_from: '', gross_salary: 0, components: [] }); setShowModal(true); }}>➕ Create Structure</button>
            </div>

            {success && <div className="alert alert-success">✅ {success}</div>}
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <div className="structures-grid">
                {structures.map(s => (
                    <div key={s.id} className="structure-card">
                        <h3>{s.staff_name}</h3>
                        <p>Effective: {new Date(s.effective_from).toLocaleDateString()}</p>
                        <div className="salary-breakdown">
                            <div className="item"><span>Gross:</span><span>₹{s.gross_salary.toLocaleString()}</span></div>
                            {s.components.map((c, i) => (
                                <div key={i} className="item"><span>{c.name}:</span><span className={c.type === 'DEDUCTION' ? 'deduction' : ''}>₹{c.value}</span></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Create Salary Structure</h2><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Staff Member *</label>
                                <select value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: Number(e.target.value) })} className="form-control">
                                    <option value="">Select Staff</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Effective From *</label>
                                    <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} className="form-control" />
                                </div>
                                <div className="form-group">
                                    <label>Gross Salary *</label>
                                    <input type="number" value={form.gross_salary} onChange={(e) => setForm({ ...form, gross_salary: Number(e.target.value) })} className="form-control" />
                                </div>
                            </div>
                            <div className="components-section">
                                <div className="section-header"><h3>Components</h3><button className="btn-add" onClick={addComponent}>➕ Add</button></div>
                                {form.components.map((c, i) => (
                                    <div key={i} className="component-row">
                                        <input placeholder="Name" value={c.name} onChange={(e) => updateComponent(i, 'name', e.target.value)} className="form-control" />
                                        <select value={c.type} onChange={(e) => updateComponent(i, 'type', e.target.value)} className="form-control">
                                            <option value="EARNING">Earning</option>
                                            <option value="DEDUCTION">Deduction</option>
                                        </select>
                                        <select value={c.calculation} onChange={(e) => updateComponent(i, 'calculation', e.target.value)} className="form-control">
                                            <option value="FIXED">Fixed</option>
                                            <option value="PERCENTAGE">Percentage</option>
                                        </select>
                                        <input type="number" placeholder="Value" value={c.value} onChange={(e) => updateComponent(i, 'value', Number(e.target.value))} className="form-control" />
                                    </div>
                                ))}
                            </div>
                            <div className="preview-section">
                                <h4>Preview</h4>
                                <div className="preview-item"><span>Gross Salary:</span><span>₹{form.gross_salary.toLocaleString()}</span></div>
                                <div className="preview-item"><span>Net Salary:</span><span>₹{calculateNet().toLocaleString()}</span></div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? '⏳ Saving...' : '✅ Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryStructure;
