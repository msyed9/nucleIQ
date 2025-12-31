import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LibraryMembers.css';

interface Member { id: number; name: string; member_type: string; membership_number: string; borrowing_limit: number; books_issued: number; status: string; }

const LibraryMembers: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ student_id: 0, borrowing_limit: 5 });
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/library/members/', { headers: { Authorization: `Bearer ${token}` } });
            setMembers(response.data.results || response.data);
        } catch (err) { console.error(err); }
    };

    const handleAdd = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/library/members/', form, { headers: { Authorization: `Bearer ${token}` } });
            setShowModal(false);
            fetchMembers();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="library-members">
            <div className="header"><h1>📚 Library Members</h1><button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Member</button></div>
            <div className="members-grid">
                {members.map(m => (
                    <div key={m.id} className="member-card">
                        <h3>{m.name}</h3>
                        <p>{m.member_type} • {m.membership_number}</p>
                        <div className="stats"><span>Limit: {m.borrowing_limit}</span><span>Issued: {m.books_issued}</span></div>
                        <span className={`status ${m.status.toLowerCase()}`}>{m.status}</span>
                    </div>
                ))}
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>Add Member</h2><button className="close-btn" onClick={() => setShowModal(false)}>✕</button></div>
                        <div className="modal-body">
                            <div className="form-group"><label>Student/Staff ID</label><input type="number" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: Number(e.target.value) })} className="form-control" /></div>
                            <div className="form-group"><label>Borrowing Limit</label><input type="number" value={form.borrowing_limit} onChange={(e) => setForm({ ...form, borrowing_limit: Number(e.target.value) })} className="form-control" /></div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={loading}>Add</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryMembers;
