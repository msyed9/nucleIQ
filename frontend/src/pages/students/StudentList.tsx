import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';
import './Students.css';
import { useTranslation } from 'react-i18next';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    current_class: string;
    section: string;
    date_of_birth: string;
    is_active: boolean;
    photo?: string; // Photo URL
}

const StudentList: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mountedAt] = useState(() => new Date().toISOString());

    useEffect(() => {
        console.log('StudentList mounted');
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            console.log('fetchStudents response', response?.data);

            // Handle different response structures
            let studentData = [];
            if (Array.isArray(response.data)) {
                // Direct array response
                studentData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                // Paginated response with results array
                studentData = response.data.results;
            } else if (typeof response.data === 'object') {
                // Object response - might be a single object or empty
                console.warn('Unexpected response structure:', response.data);
                studentData = [];
            }

            setStudents(studentData);
        } catch (error) {
            console.error('Error fetching students:', error);
            // Mock data for development
            setStudents([
                {
                    id: '1',
                    admission_number: 'ADM001',
                    full_name: 'John Doe',
                    current_class: 'Class 10',
                    section: 'A',
                    date_of_birth: '2010-05-15',
                    is_active: true,
                },
                {
                    id: '2',
                    admission_number: 'ADM002',
                    full_name: 'Jane Smith',
                    current_class: 'Class 10',
                    section: 'B',
                    date_of_birth: '2010-08-20',
                    is_active: true,
                },
                {
                    id: '3',
                    admission_number: 'ADM003',
                    full_name: 'Mike Johnson',
                    current_class: 'Class 9',
                    section: 'A',
                    date_of_birth: '2011-03-12',
                    is_active: true,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter((student) =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading fullScreen text={t('loading.students')} />;

    return (
        <div className="students-page">
            <div style={{ background: '#ffeeee', color: '#990000', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                <strong>DEBUG:</strong> StudentList mounted at {mountedAt} — loading: {String(loading)} — students: {students.length}
            </div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('students.title')}</h1>
                    <p className="page-subtitle">{t('students.subtitle')}</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/students/add')}>
                    {t('students.add')}
                </Button>
            </div>

            <Card>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder={t('students.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('students.photo', { defaultValue: 'Photo' })}</th>
                                <th>{t('students.admission_no')}</th>
                                <th>{t('students.name')}</th>
                                <th>{t('students.class')}</th>
                                <th>{t('students.section')}</th>
                                <th>{t('students.dob')}</th>
                                <th>{t('students.status')}</th>
                                <th>{t('students.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div className="student-photo-cell">
                                                {student.photo ? (
                                                    <img
                                                        src={student.photo}
                                                        alt={student.full_name}
                                                        className="student-photo-thumbnail"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`student-photo-placeholder ${student.photo ? 'hidden' : ''}`}>
                                                    👤
                                                </div>
                                            </div>
                                        </td>
                                        <td>{student.admission_number}</td>
                                        <td className="student-name">{student.full_name}</td>
                                        <td>{student.current_class}</td>
                                        <td>{student.section}</td>
                                        <td>{formatDate(student.date_of_birth)}</td>
                                        <td>
                                            <span className={`status-badge status-${student.is_active ? 'active' : 'inactive'}`}>
                                                {student.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => navigate(`/students/${student.id}`)}
                                            >
                                                {t('students.view')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="no-data">
                                        {t('students.no_data')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <p className="table-info">
                        {t('students.showing', { shown: filteredStudents.length, total: students.length })}
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default StudentList;
