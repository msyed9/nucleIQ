import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import AdmissionNumberConfig from './AdmissionNumberConfig';
import './Settings.css';

interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_current: boolean;
    description?: string;
}

interface Department {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
}

interface GradeLevel {
    id: number;
    name: string;
    short_name: string;
    display_order: number;
    description?: string;
}

interface Section {
    id: number;
    name: string;
    grade_level: number;
    grade_level_name?: string;
    capacity?: number;
    room_number?: string;
}

const AcademicSetup: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'years' | 'departments' | 'grades' | 'sections' | 'admission'>('years');
    const [loading, setLoading] = useState(true);

    // Academic Years
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [showYearModal, setShowYearModal] = useState(false);
    const [editingYearId, setEditingYearId] = useState<number | null>(null);
    const [yearForm, setYearForm] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_active: true,
        description: ''
    });

    // Departments
    const [departments, setDepartments] = useState<Department[]>([]);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [deptForm, setDeptForm] = useState({
        name: '',
        code: '',
        is_active: true
    });

    // Grade Levels
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [gradeForm, setGradeForm] = useState({
        name: '',
        short_name: '',
        display_order: 1,
        description: ''
    });

    // Sections
    const [sections, setSections] = useState<Section[]>([]);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [sectionForm, setSectionForm] = useState({
        name: '',
        grade_level: '',
        capacity: '',
        room_number: ''
    });
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'years') {
                const response = await api.get('/tenants/years/');
                setAcademicYears(Array.isArray(response.data) ? response.data : response.data.results || []);
            } else if (activeTab === 'departments') {
                const response = await api.get('/tenants/departments/');
                setDepartments(Array.isArray(response.data) ? response.data : response.data.results || []);
            } else if (activeTab === 'grades') {
                const response = await api.get('/tenants/grades/');
                setGradeLevels(Array.isArray(response.data) ? response.data : response.data.results || []);
            } else if (activeTab === 'sections') {
                const [sectionsRes, gradesRes] = await Promise.all([
                    api.get('/tenants/sections/'),
                    api.get('/tenants/grades/')
                ]);
                setSections(Array.isArray(sectionsRes.data) ? sectionsRes.data : sectionsRes.data.results || []);
                setGradeLevels(Array.isArray(gradesRes.data) ? gradesRes.data : gradesRes.data.results || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Academic Year Functions
    const handleCreateYear = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = localStorage.getItem('current_tenant');
        if (!tenantId) {
            error(t('common.tenant_error', { defaultValue: 'Tenant ID not found. Please log in again.' }));
            return;
        }
        try {
            if (editingYearId) {
                await api.patch(`/tenants/years/${editingYearId}/`, yearForm);
                success(t('academic.year_updated', { defaultValue: 'Academic year updated successfully!' }));
            } else {
                await api.post('/tenants/years/', { ...yearForm, tenant: tenantId });
                success(t('academic.year_created', { defaultValue: 'Academic year created successfully!' }));
            }
            setShowYearModal(false);
            setEditingYearId(null);
            setYearForm({ name: '', start_date: '', end_date: '', is_active: true, description: '' });
            fetchData();
        } catch (err: any) {
            console.error('Error creating/updating academic year:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to save academic year';
            error(errorMsg);
        }
    };

    const handleEditYear = (year: AcademicYear) => {
        setEditingYearId(year.id);
        setYearForm({
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            is_active: year.is_active,
            description: year.description || ''
        });
        setShowYearModal(true);
    };

    const handleDeleteYear = async (yearId: number) => {
        if (!confirm(t('academic.confirm_delete_year', { defaultValue: 'Are you sure you want to delete this academic year?' }))) {
            return;
        }
        try {
            await api.delete(`/tenants/years/${yearId}/`);
            success(t('academic.year_deleted', { defaultValue: 'Academic year deleted successfully!' }));
            fetchData();
        } catch (err: any) {
            console.error('Error deleting year:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to delete academic year';
            error(errorMsg);
        }
    };

    const handleSetActiveYear = async (yearId: number) => {
        try {
            await api.patch(`/tenants/years/${yearId}/`, { is_active: true });
            success(t('academic.year_activated', { defaultValue: 'Academic year activated!' }));
            fetchData();
        } catch (error) {
            console.error('Error activating year:', error);
        }
    };

    // Department Functions
    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = localStorage.getItem('current_tenant');
        if (!tenantId) {
            error(t('common.tenant_error', { defaultValue: 'Tenant ID not found. Please log in again.' }));
            return;
        }
        try {
            await api.post('/tenants/departments/', { ...deptForm, tenant: tenantId });
            success(t('academic.dept_created', { defaultValue: 'Department created successfully!' }));
            setShowDeptModal(false);
            setDeptForm({ name: '', code: '', is_active: true });
            fetchData();
        } catch (err: any) {
            console.error('Error creating department:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to create department';
            error(errorMsg);
        }
    };

    // Grade Level Functions
    const handleCreateGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = localStorage.getItem('current_tenant');
        if (!tenantId) {
            error(t('common.tenant_error', { defaultValue: 'Tenant ID not found. Please log in again.' }));
            return;
        }
        try {
            await api.post('/tenants/grades/', { ...gradeForm, tenant: tenantId });
            success(t('academic.grade_created', { defaultValue: 'Grade level created successfully!' }));
            setShowGradeModal(false);
            setGradeForm({ name: '', short_name: '', display_order: gradeLevels.length + 1, description: '' });
            fetchData();
        } catch (err: any) {
            console.error('Error creating grade:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to create grade level';
            error(errorMsg);
        }
    };

    // Section Functions
    const handleCreateSection = async (e: React.FormEvent) => {
        e.preventDefault();
        const tenantId = localStorage.getItem('current_tenant');
        if (!tenantId) {
            error(t('common.tenant_error', { defaultValue: 'Tenant ID not found. Please log in again.' }));
            return;
        }
        try {
            const payload = {
                name: sectionForm.name,
                grade_level: sectionForm.grade_level, // Keep as UUID string, don't parseInt!
                capacity: sectionForm.capacity ? parseInt(sectionForm.capacity) : null,
                room_number: sectionForm.room_number || null,
                tenant: tenantId
            };
            console.log('=== CREATING SECTION ===');
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('Available grade levels:', JSON.stringify(gradeLevels, null, 2));
            console.log('Selected grade_level ID:', sectionForm.grade_level);
            console.log('Parsed grade_level ID:', parseInt(sectionForm.grade_level));

            await api.post('/tenants/sections/', payload);
            success(t('academic.section_created', { defaultValue: 'Section created successfully!' }));
            setShowSectionModal(false);
            setSectionForm({ name: '', grade_level: '', capacity: '', room_number: '' });
            fetchData();
        } catch (err: any) {
            console.error('=== ERROR CREATING SECTION ===');
            console.error('Error:', err);
            console.error('Error response data:', JSON.stringify(err.response?.data, null, 2));
            console.error('Error status:', err.response?.status);

            let errorMsg = 'Failed to create section';
            if (err.response?.data) {
                const respData = err.response.data;
                if (respData.grade_level) {
                    errorMsg = `Grade Level Error: ${Array.isArray(respData.grade_level) ? respData.grade_level.join(', ') : respData.grade_level}. Please refresh the page and try again.`;
                } else if (respData.message || respData.error) {
                    errorMsg = respData.message || respData.error;
                } else if (typeof respData === 'object') {
                    errorMsg = JSON.stringify(respData);
                }
            }
            error(errorMsg);
        }
    };

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="academic-setup-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🏫 {t('academic.setup_title', { defaultValue: 'Academic Setup' })}</h1>
                        <p className="page-subtitle">{t('academic.setup_subtitle', { defaultValue: 'Configure academic structure and calendar' })}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'years' ? 'active' : ''}`}
                        onClick={() => setActiveTab('years')}
                    >
                        📅 {t('academic.years', { defaultValue: 'Academic Years' })}
                    </button>
                    <button
                        className={`tab ${activeTab === 'departments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('departments')}
                    >
                        🏢 {t('academic.departments', { defaultValue: 'Departments' })}
                    </button>
                    <button
                        className={`tab ${activeTab === 'grades' ? 'active' : ''}`}
                        onClick={() => setActiveTab('grades')}
                    >
                        📊 {t('academic.grades', { defaultValue: 'Grade Levels' })}
                    </button>
                    <button
                        className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sections')}
                    >
                        🏫 {t('academic.sections', { defaultValue: 'Sections' })}
                    </button>
                    <button
                        className={`tab ${activeTab === 'admission' ? 'active' : ''}`}
                        onClick={() => setActiveTab('admission')}
                    >
                        📝 {t('academic.admission_numbers', { defaultValue: 'Admission Numbers' })}
                    </button>
                </div>

                {/* Academic Years Tab */}
                {activeTab === 'years' && (
                    <Card>
                        <div className="card-header-with-action">
                            <h3>{t('academic.years_list', { defaultValue: 'Academic Years' })}</h3>
                            <Button variant="primary" onClick={() => setShowYearModal(true)}>
                                ➕ {t('academic.add_year', { defaultValue: 'Add Academic Year' })}
                            </Button>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('academic.year_name', { defaultValue: 'Year Name' })}</th>
                                        <th>{t('academic.start_date', { defaultValue: 'Start Date' })}</th>
                                        <th>{t('academic.end_date', { defaultValue: 'End Date' })}</th>
                                        <th>{t('academic.status', { defaultValue: 'Status' })}</th>
                                        <th>{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(academicYears) && academicYears.map((year) => (
                                        <tr key={year.id}>
                                            <td>
                                                {year.name}
                                                {year.is_current && <span className="badge badge-current">Current</span>}
                                            </td>
                                            <td>{new Date(year.start_date).toLocaleDateString()}</td>
                                            <td>{new Date(year.end_date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge status-${year.is_active ? 'active' : 'inactive'}`}>
                                                    {year.is_active ? t('common.active') : t('common.inactive')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button size="small" variant="outline" onClick={() => handleEditYear(year)}>
                                                        ✏️ {t('common.edit', { defaultValue: 'Edit' })}
                                                    </Button>
                                                    {!year.is_active && (
                                                        <Button size="small" variant="success" onClick={() => handleSetActiveYear(year.id)}>
                                                            ✅ {t('academic.activate', { defaultValue: 'Activate' })}
                                                        </Button>
                                                    )}
                                                    <Button size="small" variant="danger" onClick={() => handleDeleteYear(year.id)}>
                                                        🗑️ {t('common.delete', { defaultValue: 'Delete' })}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Departments Tab */}
                {activeTab === 'departments' && (
                    <Card>
                        <div className="card-header-with-action">
                            <h3>{t('academic.departments_list', { defaultValue: 'Departments' })}</h3>
                            <Button variant="primary" onClick={() => setShowDeptModal(true)}>
                                ➕ {t('academic.add_department', { defaultValue: 'Add Department' })}
                            </Button>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('academic.dept_name', { defaultValue: 'Department Name' })}</th>
                                        <th>{t('academic.dept_code', { defaultValue: 'Code' })}</th>
                                        <th>{t('academic.status', { defaultValue: 'Status' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(departments) && departments.map((dept) => (
                                        <tr key={dept.id}>
                                            <td>{dept.name}</td>
                                            <td><code>{dept.code}</code></td>
                                            <td>
                                                <span className={`status-badge status-${dept.is_active ? 'active' : 'inactive'}`}>
                                                    {dept.is_active ? t('common.active') : t('common.inactive')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Grade Levels Tab */}
                {activeTab === 'grades' && (
                    <Card>
                        <div className="card-header-with-action">
                            <h3>{t('academic.grades_list', { defaultValue: 'Grade Levels' })}</h3>
                            <Button variant="primary" onClick={() => setShowGradeModal(true)}>
                                ➕ {t('academic.add_grade', { defaultValue: 'Add Grade Level' })}
                            </Button>
                        </div>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>{t('academic.grade_name', { defaultValue: 'Grade Name' })}</th>
                                        <th>{t('academic.short_name', { defaultValue: 'Short Name' })}</th>
                                        <th>{t('academic.order', { defaultValue: 'Order' })}</th>
                                        <th>{t('academic.description', { defaultValue: 'Description' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(gradeLevels) && gradeLevels.map((grade) => (
                                        <tr key={grade.id}>
                                            <td>{grade.name}</td>
                                            <td><code>{grade.short_name}</code></td>
                                            <td>{grade.display_order}</td>
                                            <td>{grade.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Sections Tab */}
                {activeTab === 'sections' && (
                    <Card>
                        <div className="card-header-with-action">
                            <div>
                                <h3>{t('academic.sections_list', { defaultValue: 'Sections / Classrooms' })}</h3>
                                <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                                    Sections link grade levels to actual classrooms (e.g., "Class 1-A", "Class 2-B")
                                </small>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="outline" onClick={() => fetchData()}>
                                    🔄 Refresh
                                </Button>
                                <Button variant="primary" onClick={() => setShowSectionModal(true)}>
                                    ➕ {t('academic.add_section', { defaultValue: 'Add Section' })}
                                </Button>
                            </div>
                        </div>
                        {gradeLevels.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                <p>⚠️ Please create Grade Levels first before adding sections.</p>
                                <div style={{ marginTop: '1rem' }}>
                                    <Button variant="outline" onClick={() => setActiveTab('grades')}>
                                        Go to Grade Levels
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>{t('academic.section_name', { defaultValue: 'Section Name' })}</th>
                                            <th>{t('academic.grade_level', { defaultValue: 'Grade Level' })}</th>
                                            <th>{t('academic.capacity', { defaultValue: 'Capacity' })}</th>
                                            <th>{t('academic.room', { defaultValue: 'Room Number' })}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(sections) && sections.length > 0 ? (
                                            sections.map((section) => (
                                                <tr key={section.id}>
                                                    <td><strong>{section.name}</strong></td>
                                                    <td>{section.grade_level_name || `Grade ${section.grade_level}`}</td>
                                                    <td>{section.capacity || '-'}</td>
                                                    <td>{section.room_number || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                                                    No sections created yet. Click "Add Section" to create one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}

                {/* Admission Numbers Tab */}
                {activeTab === 'admission' && (
                    <AdmissionNumberConfig />
                )}

                {/* Academic Year Modal */}
                {showYearModal && (
                    <div className="modal-overlay" onClick={() => { setShowYearModal(false); setEditingYearId(null); }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingYearId ? t('academic.edit_year', { defaultValue: 'Edit Academic Year' }) : t('academic.add_year', { defaultValue: 'Add Academic Year' })}</h2>
                                <button className="modal-close" onClick={() => { setShowYearModal(false); setEditingYearId(null); }}>✕</button>
                            </div>
                            <form onSubmit={handleCreateYear}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>{t('academic.year_name', { defaultValue: 'Year Name' })}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 2024-2025"
                                            value={yearForm.name}
                                            onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('academic.start_date', { defaultValue: 'Start Date' })}</label>
                                            <input
                                                type="date"
                                                value={yearForm.start_date}
                                                onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('academic.end_date', { defaultValue: 'End Date' })}</label>
                                            <input
                                                type="date"
                                                value={yearForm.end_date}
                                                onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.description', { defaultValue: 'Description' })}</label>
                                        <textarea
                                            value={yearForm.description}
                                            onChange={(e) => setYearForm({ ...yearForm, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={yearForm.is_active}
                                            onChange={(e) => setYearForm({ ...yearForm, is_active: e.target.checked })}
                                        />
                                        {t('academic.set_active', { defaultValue: 'Set as active year' })}
                                    </label>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => { setShowYearModal(false); setEditingYearId(null); }}>
                                        {t('common.cancel')}
                                    </Button>
                                    <Button type="submit" variant="primary">
                                        {editingYearId ? t('common.update', { defaultValue: 'Update' }) : t('common.create')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Department Modal */}
                {showDeptModal && (
                    <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('academic.add_department', { defaultValue: 'Add Department' })}</h2>
                                <button className="modal-close" onClick={() => setShowDeptModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreateDepartment}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>{t('academic.dept_name', { defaultValue: 'Department Name' })}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Science"
                                            value={deptForm.name}
                                            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.dept_code', { defaultValue: 'Department Code' })}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., SCI"
                                            value={deptForm.code}
                                            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => setShowDeptModal(false)}>
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

                {/* Grade Level Modal */}
                {showGradeModal && (
                    <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('academic.add_grade', { defaultValue: 'Add Grade Level' })}</h2>
                                <button className="modal-close" onClick={() => setShowGradeModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreateGrade}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>{t('academic.grade_name', { defaultValue: 'Grade Name' })}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Class 10"
                                            value={gradeForm.name}
                                            onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.short_name', { defaultValue: 'Short Name' })}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 10 or X"
                                            value={gradeForm.short_name}
                                            onChange={(e) => setGradeForm({ ...gradeForm, short_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.order', { defaultValue: 'Display Order' })}</label>
                                        <input
                                            type="number"
                                            value={gradeForm.display_order}
                                            onChange={(e) => setGradeForm({ ...gradeForm, display_order: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.description', { defaultValue: 'Description' })}</label>
                                        <textarea
                                            value={gradeForm.description}
                                            onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => setShowGradeModal(false)}>
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

                {/* Section Modal */}
                {showSectionModal && (
                    <div className="modal-overlay" onClick={() => setShowSectionModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('academic.add_section', { defaultValue: 'Add Section' })}</h2>
                                <button className="modal-close" onClick={() => setShowSectionModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreateSection}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>{t('academic.grade_level', { defaultValue: 'Grade Level' })} *</label>
                                        <select
                                            value={sectionForm.grade_level}
                                            onChange={(e) => setSectionForm({ ...sectionForm, grade_level: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Grade Level</option>
                                            {gradeLevels.map((grade) => (
                                                <option key={grade.id} value={grade.id}>
                                                    {grade.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('academic.section_name', { defaultValue: 'Section Name' })} *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., A, B, C or Section 1"
                                            value={sectionForm.name}
                                            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                            required
                                        />
                                        <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                                            This will be combined with grade level (e.g., "Class 1-A")
                                        </small>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('academic.capacity', { defaultValue: 'Capacity' })}</label>
                                            <input
                                                type="number"
                                                placeholder="e.g., 40"
                                                value={sectionForm.capacity}
                                                onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })}
                                                min="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t('academic.room', { defaultValue: 'Room Number' })}</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 101, A-201"
                                                value={sectionForm.room_number}
                                                onChange={(e) => setSectionForm({ ...sectionForm, room_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <Button type="button" variant="outline" onClick={() => setShowSectionModal(false)}>
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
        </>
    );
};

export default AcademicSetup;
