import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import './Students.css';

interface Remark {
    id: number;
    student: number;
    student_name: string;
    remark_type: string;
    category: string;
    title: string;
    description: string;
    created_by_name: string;
    created_at: string;
    color_class: string;
    is_important: boolean;
    requires_action: boolean;
    action_taken: boolean;
    parent_acknowledged: boolean;
    visible_to_parent: boolean;
}

interface Student {
    id: number;
    admission_number: string;
    full_name: string;
}

const RemarksManager: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [filterStudent, setFilterStudent] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [formData, setFormData] = useState({
        student: '',
        remark_type: 'NEUTRAL',
        category: 'GENERAL',
        title: '',
        description: '',
        visible_to_parent: true,
        visible_to_student: false,
        is_important: false,
        requires_action: false
    });

    useEffect(() => {
        fetchRemarks();
        fetchStudents();
    }, [filterStudent, filterType, filterCategory]);

    const fetchRemarks = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterStudent) params.append('student_id', filterStudent);
            if (filterType) params.append('type', filterType);
            if (filterCategory) params.append('category', filterCategory);

            const response = await api.get(`/students/remarks/?${params}`);
            setRemarks(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching remarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            setStudents(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/students/remarks/', formData);
            alert(t('remarks.created', { defaultValue: 'Remark added successfully!' }));
            setShowModal(false);
            setFormData({
                student: '',
                remark_type: 'NEUTRAL',
                category: 'GENERAL',
                title: '',
                description: '',
                visible_to_parent: true,
                visible_to_student: false,
                is_important: false,
                requires_action: false
            });
            fetchRemarks();
        } catch (error) {
            console.error('Error creating remark:', error);
            alert(t('remarks.error', { defaultValue: 'Failed to add remark' }));
        }
    };

    const handleAcknowledge = async (remarkId: number) => {
        try {
            await api.post(`/students/remarks/${remarkId}/acknowledge/`);
            alert(t('remarks.acknowledged', { defaultValue: 'Remark acknowledged!' }));
            fetchRemarks();
        } catch (error) {
            console.error('Error acknowledging remark:', error);
        }
    };

    const handleMarkActionTaken = async (remarkId: number) => {
        const actionNotes = prompt(t('remarks.action_notes_prompt', { defaultValue: 'Enter action notes:' }));
        if (!actionNotes) return;

        try {
            await api.post(`/students/remarks/${remarkId}/mark_action_taken/`, { action_notes: actionNotes });
            alert(t('remarks.action_marked', { defaultValue: 'Action marked as taken!' }));
            fetchRemarks();
        } catch (error) {
            console.error('Error marking action:', error);
        }
    };

    const filteredRemarks = remarks.filter(remark =>
        remark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        remark.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        remark.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const remarkTypes = [
        { value: 'POSITIVE', label: '✅ Positive', color: 'success' },
        { value: 'NEGATIVE', label: '❌ Negative', color: 'danger' },
        { value: 'NEUTRAL', label: '⚪ Neutral', color: 'secondary' },
        { value: 'COMPLAINT', label: '⚠️ Complaint', color: 'warning' },
        { value: 'ACHIEVEMENT', label: '🏆 Achievement', color: 'primary' },
        { value: 'DISCIPLINE', label: '🚨 Discipline', color: 'danger' }
    ];

    const categories = [
        'ACADEMIC', 'BEHAVIORAL', 'ATTENDANCE', 'TRANSPORT',
        'LIBRARY', 'HOSTEL', 'HEALTH', 'FINANCE', 'GENERAL'
    ];

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <div className="remarks-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💬 {t('remarks.title', { defaultValue: 'Student Remarks' })}</h1>
                    <p className="page-subtitle">{t('remarks.subtitle', { defaultValue: 'Universal activity feed for all student interactions' })}</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    ➕ {t('remarks.add', { defaultValue: 'Add Remark' })}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="filters-row">
                    <input
                        type="text"
                        placeholder={t('remarks.search', { defaultValue: 'Search remarks...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('remarks.all_students', { defaultValue: 'All Students' })}</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.admission_number} - {student.full_name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('remarks.all_types', { defaultValue: 'All Types' })}</option>
                        {remarkTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('remarks.all_categories', { defaultValue: 'All Categories' })}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Remarks Feed */}
            <Card>
                <div className="remarks-feed">
                    {filteredRemarks.length === 0 ? (
                        <div className="empty-state">
                            <p>📭 {t('remarks.no_data', { defaultValue: 'No remarks found' })}</p>
                        </div>
                    ) : (
                        filteredRemarks.map(remark => (
                            <div key={remark.id} className={`remark-card remark-${remark.color_class}`}>
                                <div className="remark-header">
                                    <div className="remark-meta">
                                        <span
                                            className="student-link"
                                            onClick={() => navigate(`/students/${remark.student}`)}
                                        >
                                            👤 {remark.student_name}
                                        </span>
                                        <span className={`remark-type remark-type-${remark.color_class}`}>
                                            {remark.remark_type}
                                        </span>
                                        <span className="remark-category">{remark.category}</span>
                                        {remark.is_important && <span className="badge badge-important">⭐ Important</span>}
                                    </div>
                                    <span className="remark-date">{formatDate(remark.created_at)}</span>
                                </div>
                                <div className="remark-body">
                                    <h4>{remark.title}</h4>
                                    <p>{remark.description}</p>
                                </div>
                                <div className="remark-footer">
                                    <span className="created-by">By: {remark.created_by_name}</span>
                                    <div className="remark-actions">
                                        {remark.visible_to_parent && !remark.parent_acknowledged && (
                                            <Button size="small" variant="outline" onClick={() => handleAcknowledge(remark.id)}>
                                                ✓ {t('remarks.acknowledge', { defaultValue: 'Acknowledge' })}
                                            </Button>
                                        )}
                                        {remark.parent_acknowledged && (
                                            <span className="badge badge-success">✓ Acknowledged</span>
                                        )}
                                        {remark.requires_action && !remark.action_taken && (
                                            <Button size="small" variant="primary" onClick={() => handleMarkActionTaken(remark.id)}>
                                                ✅ {t('remarks.mark_action', { defaultValue: 'Mark Action Taken' })}
                                            </Button>
                                        )}
                                        {remark.action_taken && (
                                            <span className="badge badge-success">✅ Action Taken</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Add Remark Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('remarks.add', { defaultValue: 'Add Remark' })}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('remarks.student', { defaultValue: 'Student' })}</label>
                                    <select
                                        value={formData.student}
                                        onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('remarks.select_student', { defaultValue: 'Select Student' })}</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.admission_number} - {student.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('remarks.type', { defaultValue: 'Remark Type' })}</label>
                                        <select
                                            value={formData.remark_type}
                                            onChange={(e) => setFormData({ ...formData, remark_type: e.target.value })}
                                        >
                                            {remarkTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('remarks.category', { defaultValue: 'Category' })}</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('remarks.title', { defaultValue: 'Title' })}</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t('remarks.title_placeholder', { defaultValue: 'Brief title of the remark' })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('remarks.description', { defaultValue: 'Description' })}</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={t('remarks.description_placeholder', { defaultValue: 'Detailed description...' })}
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="form-checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.visible_to_parent}
                                            onChange={(e) => setFormData({ ...formData, visible_to_parent: e.target.checked })}
                                        />
                                        {t('remarks.visible_parent', { defaultValue: 'Visible to Parent' })}
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.visible_to_student}
                                            onChange={(e) => setFormData({ ...formData, visible_to_student: e.target.checked })}
                                        />
                                        {t('remarks.visible_student', { defaultValue: 'Visible to Student' })}
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_important}
                                            onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
                                        />
                                        {t('remarks.important', { defaultValue: 'Mark as Important' })}
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_action}
                                            onChange={(e) => setFormData({ ...formData, requires_action: e.target.checked })}
                                        />
                                        {t('remarks.requires_action', { defaultValue: 'Requires Action' })}
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemarksManager;
