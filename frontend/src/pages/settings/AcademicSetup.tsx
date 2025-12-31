import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
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
    level_order: number;
    description?: string;
}

const AcademicSetup: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'years' | 'departments' | 'grades'>('years');
    const [loading, setLoading] = useState(true);

    // Academic Years
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [showYearModal, setShowYearModal] = useState(false);
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
        level_order: 1,
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'years') {
                const response = await api.get('/tenants/years/');
                setAcademicYears(response.data);
            } else if (activeTab === 'departments') {
                const response = await api.get('/tenants/departments/');
                setDepartments(response.data);
            } else if (activeTab === 'grades') {
                const response = await api.get('/tenants/grades/');
                setGradeLevels(response.data);
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
        try {
            await api.post('/tenants/years/', yearForm);
            alert(t('academic.year_created', { defaultValue: 'Academic year created successfully!' }));
            setShowYearModal(false);
            setYearForm({ name: '', start_date: '', end_date: '', is_active: true, description: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating academic year:', error);
            alert(t('academic.year_error', { defaultValue: 'Failed to create academic year' }));
        }
    };

    const handleSetActiveYear = async (yearId: number) => {
        try {
            await api.patch(`/tenants/years/${yearId}/`, { is_active: true });
            alert(t('academic.year_activated', { defaultValue: 'Academic year activated!' }));
            fetchData();
        } catch (error) {
            console.error('Error activating year:', error);
        }
    };

    // Department Functions
    const handleCreateDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tenants/departments/', deptForm);
            alert(t('academic.dept_created', { defaultValue: 'Department created successfully!' }));
            setShowDeptModal(false);
            setDeptForm({ name: '', code: '', is_active: true });
            fetchData();
        } catch (error) {
            console.error('Error creating department:', error);
            alert(t('academic.dept_error', { defaultValue: 'Failed to create department' }));
        }
    };

    // Grade Level Functions
    const handleCreateGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tenants/grades/', gradeForm);
            alert(t('academic.grade_created', { defaultValue: 'Grade level created successfully!' }));
            setShowGradeModal(false);
            setGradeForm({ name: '', level_order: gradeLevels.length + 1, description: '' });
            fetchData();
        } catch (error) {
            console.error('Error creating grade:', error);
            alert(t('academic.grade_error', { defaultValue: 'Failed to create grade level' }));
        }
    };

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
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
                                {academicYears.map((year) => (
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
                                            {!year.is_active && (
                                                <Button size="small" variant="success" onClick={() => handleSetActiveYear(year.id)}>
                                                    ✅ {t('academic.activate', { defaultValue: 'Activate' })}
                                                </Button>
                                            )}
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
                                {departments.map((dept) => (
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
                                    <th>{t('academic.order', { defaultValue: 'Order' })}</th>
                                    <th>{t('academic.description', { defaultValue: 'Description' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradeLevels.map((grade) => (
                                    <tr key={grade.id}>
                                        <td>{grade.name}</td>
                                        <td>{grade.level_order}</td>
                                        <td>{grade.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Academic Year Modal */}
            {showYearModal && (
                <div className="modal-overlay" onClick={() => setShowYearModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('academic.add_year', { defaultValue: 'Add Academic Year' })}</h2>
                            <button className="modal-close" onClick={() => setShowYearModal(false)}>✕</button>
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
                                <Button type="button" variant="outline" onClick={() => setShowYearModal(false)}>
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
                                    <label>{t('academic.order', { defaultValue: 'Order' })}</label>
                                    <input
                                        type="number"
                                        value={gradeForm.level_order}
                                        onChange={(e) => setGradeForm({ ...gradeForm, level_order: parseInt(e.target.value) })}
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
        </div>
    );
};

export default AcademicSetup;
