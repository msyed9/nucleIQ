/**
 * Student Promotions Page
 * Promote students to the next academic year/grade level
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import './StudentPromotions.css';

interface AcademicYear {
    id: string;
    name: string;
    is_active: boolean;
    is_current: boolean;
}

interface GradeLevel {
    id: string;
    name: string;
    short_name: string;
    display_order: number;
}

interface Section {
    id: string;
    name: string;
    grade_level: string;
    grade_level_name: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    current_class: string;
    section: string;
    photo_url?: string;
}

interface PromotionPreview {
    student: Student;
    from_class: string;
    to_class: string;
    status: 'promote' | 'retain' | 'graduate';
}

const StudentPromotions: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [promotionPreviews, setPromotionPreviews] = useState<PromotionPreview[]>([]);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [fromYear, setFromYear] = useState('');
    const [toYear, setToYear] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [targetSection, setTargetSection] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);

    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedGrade) {
            fetchStudents();
        }
    }, [selectedGrade, selectedSection, fromYear]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [yearsRes, gradesRes, sectionsRes] = await Promise.all([
                api.get('/tenants/years/'),
                api.get('/tenants/grades/'),
                api.get('/tenants/sections/')
            ]);

            const years = Array.isArray(yearsRes.data) ? yearsRes.data : yearsRes.data?.results || [];
            const grades = Array.isArray(gradesRes.data) ? gradesRes.data : gradesRes.data?.results || [];
            const sects = Array.isArray(sectionsRes.data) ? sectionsRes.data : sectionsRes.data?.results || [];

            setAcademicYears(years);
            setGradeLevels(grades.sort((a: GradeLevel, b: GradeLevel) => a.display_order - b.display_order));
            setSections(sects);

            // Default to current academic year
            const currentYear = years.find((y: AcademicYear) => y.is_current || y.is_active);
            if (currentYear) {
                setFromYear(currentYear.id);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!selectedGrade) return;

        try {
            // Explicitly request only ACTIVE enrollment students for promotion
            // Students with COMPLETED enrollments have already been promoted
            let url = `/students/students/?grade_level=${selectedGrade}&academic_year=${fromYear}&enrollment_status=ACTIVE`;
            if (selectedSection) {
                url += `&section=${selectedSection}`;
            }

            const response = await api.get(url);
            const studentsData = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setStudents(studentsData);

            // Auto-select all students
            setSelectedStudents(new Set(studentsData.map((s: Student) => s.id)));
        } catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]);
        }
    };

    const getNextGrade = (currentGradeId: string): GradeLevel | null => {
        const currentIndex = gradeLevels.findIndex(g => g.id === currentGradeId);
        if (currentIndex === -1 || currentIndex === gradeLevels.length - 1) {
            return null; // No next grade (graduating)
        }
        return gradeLevels[currentIndex + 1];
    };

    const handleGeneratePreview = () => {
        if (!targetGrade && !getNextGrade(selectedGrade)) {
            // Graduating students
            const previews: PromotionPreview[] = students
                .filter(s => selectedStudents.has(s.id))
                .map(s => ({
                    student: s,
                    from_class: s.current_class,
                    to_class: 'Graduate',
                    status: 'graduate' as const,
                }));
            setPromotionPreviews(previews);
        } else {
            const target = targetGrade || getNextGrade(selectedGrade)?.id;
            const targetGradeName = gradeLevels.find(g => g.id === target)?.name || 'Next Grade';

            const previews: PromotionPreview[] = students
                .filter(s => selectedStudents.has(s.id))
                .map(s => ({
                    student: s,
                    from_class: s.current_class,
                    to_class: targetGradeName,
                    status: 'promote' as const,
                }));
            setPromotionPreviews(previews);
        }
        setStep(3);
    };

    const handlePromote = async () => {
        if (promotionPreviews.length === 0) {
            error('No students selected for promotion');
            return;
        }

        setProcessing(true);
        try {
            const payload = {
                student_ids: promotionPreviews.map(p => p.student.id),
                target_grade_id: targetGrade || getNextGrade(selectedGrade)?.id,
                target_section_id: targetSection || null,
                target_academic_year_id: toYear,
                action: promotionPreviews[0].status,
            };

            await api.post('/students/students/bulk_promote/', payload);
            success(`Successfully promoted ${promotionPreviews.length} students!`);

            // Reset wizard
            setStep(1);
            setSelectedGrade('');
            setSelectedSection('');
            setTargetGrade('');
            setTargetSection('');
            setSelectedStudents(new Set());
            setPromotionPreviews([]);
            setStudents([]);
        } catch (err: any) {
            console.error('Promotion failed:', err);
            error(err.response?.data?.message || 'Failed to promote students');
        } finally {
            setProcessing(false);
        }
    };

    const toggleStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudents);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudents(newSelected);
    };

    const toggleAllStudents = () => {
        if (selectedStudents.size === students.length) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s.id)));
        }
    };

    const filteredSections = sections.filter(s => s.grade_level === selectedGrade);
    const targetSections = sections.filter(s => s.grade_level === (targetGrade || getNextGrade(selectedGrade)?.id));

    if (loading) {
        return <Loading fullScreen text="Loading Promotion Data..." />;
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="promotions-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">🎓 Student Promotions</h1>
                        <p className="page-subtitle">Promote students to the next academic year</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="promotion-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Select Source</div>
                    </div>
                    <div className="step-connector" />
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Select Students</div>
                    </div>
                    <div className="step-connector" />
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-number">3</div>
                        <div className="step-label">Confirm & Promote</div>
                    </div>
                </div>

                {/* Step 1: Select Source */}
                {step === 1 && (
                    <Card>
                        <h3 className="section-title">📌 Step 1: Select Source Class</h3>
                        <p className="section-desc">Choose the academic year and class from which to promote students</p>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>From Academic Year *</label>
                                <select value={fromYear} onChange={(e) => setFromYear(e.target.value)}>
                                    <option value="">Select Year</option>
                                    {academicYears.map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.name} {year.is_current && '(Current)'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>To Academic Year *</label>
                                <select value={toYear} onChange={(e) => setToYear(e.target.value)}>
                                    <option value="">Select Year</option>
                                    {academicYears.filter(y => y.id !== fromYear).map(year => (
                                        <option key={year.id} value={year.id}>
                                            {year.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>From Grade Level *</label>
                                <select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSection(''); }}>
                                    <option value="">Select Grade</option>
                                    {gradeLevels.map(grade => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>From Section (Optional)</label>
                                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedGrade}>
                                    <option value="">All Sections</option>
                                    {filteredSections.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>To Grade Level</label>
                                <select value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)}>
                                    <option value="">
                                        {selectedGrade && getNextGrade(selectedGrade)
                                            ? `Auto: ${getNextGrade(selectedGrade)?.name}`
                                            : 'Graduate (No next grade)'}
                                    </option>
                                    {gradeLevels.filter(g => g.id !== selectedGrade).map(grade => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>To Section (Optional)</label>
                                <select value={targetSection} onChange={(e) => setTargetSection(e.target.value)}>
                                    <option value="">Keep Same Section Name</option>
                                    {targetSections.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="step-actions">
                            <Button
                                variant="primary"
                                onClick={() => setStep(2)}
                                disabled={!fromYear || !toYear || !selectedGrade}
                            >
                                Next: Select Students →
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 2: Select Students */}
                {step === 2 && (
                    <Card>
                        <h3 className="section-title">📌 Step 2: Select Students to Promote</h3>
                        <p className="section-desc">
                            Found {students.length} students • {selectedStudents.size} selected
                        </p>

                        {students.length === 0 ? (
                            <div className="no-students">
                                <span className="icon">👥</span>
                                <p>No students found in the selected class</p>
                            </div>
                        ) : (
                            <>
                                <div className="select-all-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.size === students.length}
                                            onChange={toggleAllStudents}
                                        />
                                        Select All Students
                                    </label>
                                </div>

                                <div className="students-grid">
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            className={`student-card ${selectedStudents.has(student.id) ? 'selected' : ''}`}
                                            onClick={() => toggleStudent(student.id)}
                                        >
                                            <div className="student-avatar">
                                                {student.photo_url ? (
                                                    <img src={student.photo_url} alt={student.first_name} />
                                                ) : (
                                                    <span>{student.first_name.charAt(0)}{student.last_name?.charAt(0) || ''}</span>
                                                )}
                                            </div>
                                            <div className="student-info">
                                                <strong>{student.first_name} {student.last_name}</strong>
                                                <span>{student.admission_number}</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.has(student.id)}
                                                onChange={() => toggleStudent(student.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="step-actions">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                ← Back
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGeneratePreview}
                                disabled={selectedStudents.size === 0}
                            >
                                Next: Preview Promotion →
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 3: Confirm & Promote */}
                {step === 3 && (
                    <Card>
                        <h3 className="section-title">📌 Step 3: Confirm Promotion</h3>
                        <p className="section-desc">
                            Review the promotion details before confirming
                        </p>

                        <div className="promotion-summary">
                            <div className="summary-stat">
                                <span className="stat-value">{promotionPreviews.length}</span>
                                <span className="stat-label">Students</span>
                            </div>
                            <div className="summary-arrow">→</div>
                            <div className="summary-stat">
                                <span className="stat-value">
                                    {promotionPreviews[0]?.to_class || 'Next Grade'}
                                </span>
                                <span className="stat-label">Target</span>
                            </div>
                        </div>

                        <div className="preview-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Admission No.</th>
                                        <th>From Class</th>
                                        <th>To Class</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotionPreviews.slice(0, 10).map(preview => (
                                        <tr key={preview.student.id}>
                                            <td>
                                                <strong>{preview.student.first_name} {preview.student.last_name}</strong>
                                            </td>
                                            <td>{preview.student.admission_number}</td>
                                            <td>{preview.from_class}</td>
                                            <td>{preview.to_class}</td>
                                            <td>
                                                <span className={`status-badge status-${preview.status}`}>
                                                    {preview.status === 'promote' && '⬆️ Promote'}
                                                    {preview.status === 'graduate' && '🎓 Graduate'}
                                                    {preview.status === 'retain' && '🔄 Retain'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {promotionPreviews.length > 10 && (
                                <p className="more-students">
                                    ... and {promotionPreviews.length - 10} more students
                                </p>
                            )}
                        </div>

                        <div className="warning-box">
                            <span className="warning-icon">⚠️</span>
                            <div>
                                <strong>Important:</strong> This action will update student records.
                                Make sure you have verified all the details before proceeding.
                            </div>
                        </div>

                        <div className="step-actions">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                ← Back
                            </Button>
                            <Button
                                variant="success"
                                onClick={handlePromote}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : `✅ Confirm Promotion (${promotionPreviews.length} students)`}
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </>
    );
};

export default StudentPromotions;
