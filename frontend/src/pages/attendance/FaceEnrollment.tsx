/**
 * Face Enrollment Page - Admin Only
 * Allows tenant admins to capture and manage student face enrollments for attendance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Camera,
    User,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    RefreshCw,
    AlertCircle,
    Upload,
    Trash2,
    Users,
    Shield,
    ChevronDown
} from 'lucide-react';
import Webcam from 'react-webcam';
import api from '../../services/api';
import { Card, Button, Input, Select, useToast, ToastContainer } from '@/design-system';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    photo: string | null;
    class_name: string | null;
    section_name: string | null;
    has_face_encoding: boolean;
    face_encoding_date: string | null;
}

interface GradeLevel {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    grade_level_name: string;
}

interface EnrollmentStatus {
    face_recognition_available: boolean;
    total_students: number;
    enrolled_count: number;
    not_enrolled_count: number;
    enrollment_percentage: number;
}

const FaceEnrollment: React.FC = () => {
    const { t } = useTranslation();
    const { toasts, removeToast, success, error: showError } = useToast();
    const webcamRef = useRef<Webcam>(null);

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');

    // UI State
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = students;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.full_name.toLowerCase().includes(query) ||
                s.admission_number.toLowerCase().includes(query)
            );
        }

        if (classFilter) {
            filtered = filtered.filter(s => s.class_name === classFilter);
        }

        if (sectionFilter) {
            filtered = filtered.filter(s => s.section_name === sectionFilter);
        }

        if (enrollmentFilter === 'enrolled') {
            filtered = filtered.filter(s => s.has_face_encoding);
        } else if (enrollmentFilter === 'not_enrolled') {
            filtered = filtered.filter(s => !s.has_face_encoding);
        }

        setFilteredStudents(filtered);
    }, [students, searchQuery, classFilter, sectionFilter, enrollmentFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setPermissionDenied(false);

            // Fetch face enrollment data - this may fail with 403 if not admin
            let studentsData: Student[] = [];
            let statusData: EnrollmentStatus | null = null;

            try {
                const [studentsRes, statusRes] = await Promise.all([
                    api.get('/attendance/face-enrollment/'),
                    api.get('/attendance/face-enrollment/status/')
                ]);
                studentsData = studentsRes.data.results || [];
                statusData = statusRes.data;
            } catch (enrollmentErr: any) {
                if (enrollmentErr.response?.status === 403) {
                    setPermissionDenied(true);
                    setLoading(false);
                    return;
                }
                throw enrollmentErr;
            }

            // Fetch grade levels and sections - these should work for any tenant user
            try {
                const [classesRes, sectionsRes] = await Promise.all([
                    api.get('/tenants/grades/'),
                    api.get('/tenants/sections/')
                ]);
                setGradeLevels(classesRes.data.results || classesRes.data || []);
                setSections(sectionsRes.data.results || sectionsRes.data || []);
            } catch (err) {
                console.warn('Could not fetch grades/sections:', err);
            }

            setStudents(studentsData);
            setEnrollmentStatus(statusData);

        } catch (err: any) {
            console.error('Error fetching data:', err);
            showError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setCapturedImage(imageSrc);
                setShowCamera(false);
            }
        }
    }, []);

    const handleEnroll = async () => {
        if (!selectedStudent || !capturedImage) return;

        try {
            setEnrolling(true);

            const response = await api.post('/attendance/face-enrollment/enroll/', {
                student_id: selectedStudent.id,
                image: capturedImage
            });

            if (response.data.success) {
                success(`Face enrolled for ${selectedStudent.full_name}`);

                // Update the student in the list
                setStudents(prev => prev.map(s =>
                    s.id === selectedStudent.id
                        ? { ...s, has_face_encoding: true, face_encoding_date: new Date().toISOString() }
                        : s
                ));

                // Refresh status
                const statusRes = await api.get('/attendance/face-enrollment/status/');
                setEnrollmentStatus(statusRes.data);

                // Reset UI
                setSelectedStudent(null);
                setCapturedImage(null);
            }
        } catch (err: any) {
            console.error('Error enrolling face:', err);
            showError(err.response?.data?.error || 'Failed to enroll face. Please try again.');
        } finally {
            setEnrolling(false);
        }
    };

    const handleDeleteEnrollment = async (student: Student) => {
        if (!confirm(`Are you sure you want to delete face enrollment for ${student.full_name}?`)) {
            return;
        }

        try {
            await api.delete(`/attendance/face-enrollment/delete/${student.id}/`);
            success(`Face enrollment deleted for ${student.full_name}`);

            // Update the student in the list
            setStudents(prev => prev.map(s =>
                s.id === student.id
                    ? { ...s, has_face_encoding: false, face_encoding_date: null }
                    : s
            ));

            // Refresh status
            const statusRes = await api.get('/attendance/face-enrollment/status/');
            setEnrollmentStatus(statusRes.data);

        } catch (err: any) {
            console.error('Error deleting enrollment:', err);
            showError(err.response?.data?.error || 'Failed to delete enrollment.');
        }
    };

    const openEnrollmentModal = (student: Student) => {
        setSelectedStudent(student);
        setCapturedImage(null);
        setShowCamera(false);
        setCameraError(null);
    };

    const renderStatusCards = () => {
        if (!enrollmentStatus) return null;

        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <Card>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <Users size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {enrollmentStatus.total_students}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Total Students
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <CheckCircle size={32} style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                            {enrollmentStatus.enrolled_count}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Enrolled
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <XCircle size={32} style={{ color: 'var(--color-warning)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>
                            {enrollmentStatus.not_enrolled_count}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Not Enrolled
                        </div>
                    </div>
                </Card>

                <Card>
                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <Shield size={32} style={{ color: 'var(--color-info)', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-info)' }}>
                            {enrollmentStatus.enrollment_percentage}%
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                            Coverage
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    const renderFilters = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
        }}>
            <Input
                id="search"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                iconLeft={Search}
            />

            <Select
                options={[
                    { value: '', label: 'All Classes' },
                    ...gradeLevels.map(g => ({ value: g.name, label: g.name }))
                ]}
                value={classFilter}
                onChange={(val: any) => {
                    setClassFilter(val);
                    setSectionFilter('');
                }}
                fullWidth
            />

            <Select
                options={[
                    { value: '', label: 'All Sections' },
                    ...sections
                        .filter(s => !classFilter || s.grade_level_name === classFilter)
                        .map(s => ({ value: s.name, label: s.name }))
                ]}
                value={sectionFilter}
                onChange={(val: any) => setSectionFilter(val)}
                fullWidth
            />

            <Select
                options={[
                    { value: 'all', label: 'All Students' },
                    { value: 'enrolled', label: 'Enrolled Only' },
                    { value: 'not_enrolled', label: 'Not Enrolled' }
                ]}
                value={enrollmentFilter}
                onChange={(val: any) => setEnrollmentFilter(val)}
                fullWidth
            />
        </div>
    );

    const renderStudentGrid = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
        }}>
            {filteredStudents.map(student => (
                <Card key={student.id}>
                    <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'var(--color-primary-50)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-primary-700)',
                                flexShrink: 0
                            }}>
                                {student.photo ? (
                                    <img
                                        src={student.photo}
                                        alt={student.full_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    student.full_name.charAt(0)
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {student.full_name}
                                </h3>
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    margin: '0.25rem 0'
                                }}>
                                    {student.admission_number}
                                </p>
                                <p style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-tertiary)',
                                    margin: 0
                                }}>
                                    {student.class_name || 'N/A'} - {student.section_name || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: student.has_face_encoding
                                ? 'rgba(34, 197, 94, 0.1)'
                                : 'rgba(234, 179, 8, 0.1)',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            {student.has_face_encoding ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-success)' }}>
                                            Enrolled
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                        {student.face_encoding_date
                                            ? new Date(student.face_encoding_date).toLocaleDateString()
                                            : ''
                                        }
                                    </span>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--color-warning)' }}>
                                        Not Enrolled
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                                size="sm"
                                variant={student.has_face_encoding ? 'secondary' : 'primary'}
                                onClick={() => openEnrollmentModal(student)}
                                fullWidth
                            >
                                <Camera size={16} />
                                {student.has_face_encoding ? 'Update Face' : 'Enroll Face'}
                            </Button>

                            {student.has_face_encoding && (
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDeleteEnrollment(student)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );

    const renderEnrollmentModal = () => {
        if (!selectedStudent) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <Card style={{ maxWidth: '600px', width: '100%', margin: '1rem' }}>
                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
                                {selectedStudent.has_face_encoding ? 'Update' : 'Enroll'} Face
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStudent(null)}
                            >
                                <XCircle size={20} />
                            </Button>
                        </div>

                        {/* Student Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'var(--color-background-secondary)',
                            borderRadius: '8px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'var(--color-primary-50)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-primary-700)'
                            }}>
                                {selectedStudent.photo ? (
                                    <img
                                        src={selectedStudent.photo}
                                        alt={selectedStudent.full_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    selectedStudent.full_name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                    {selectedStudent.full_name}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
                                    {selectedStudent.admission_number}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
                                    {selectedStudent.class_name} - {selectedStudent.section_name}
                                </p>
                            </div>
                        </div>

                        {/* Camera / Capture Area */}
                        <div style={{
                            minHeight: '300px',
                            background: 'var(--color-background-tertiary)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem',
                            overflow: 'hidden'
                        }}>
                            {showCamera ? (
                                <div style={{ width: '100%' }}>
                                    <Webcam
                                        ref={webcamRef}
                                        audio={false}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{
                                            width: 640,
                                            height: 480,
                                            facingMode: 'user'
                                        }}
                                        onUserMediaError={(err) => {
                                            console.error('Camera error:', err);
                                            setCameraError('Could not access camera. Please check permissions.');
                                            setShowCamera(false);
                                        }}
                                        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                                    />
                                </div>
                            ) : capturedImage ? (
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    {cameraError ? (
                                        <>
                                            <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
                                            <p style={{ color: 'var(--color-error)' }}>{cameraError}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Camera size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '1rem' }} />
                                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                                Click "Open Camera" to capture a face photo
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {!showCamera && !capturedImage && (
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setCameraError(null);
                                        setShowCamera(true);
                                    }}
                                    fullWidth
                                >
                                    <Camera size={18} />
                                    Open Camera
                                </Button>
                            )}

                            {showCamera && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowCamera(false)}
                                        fullWidth
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleCapture}
                                        fullWidth
                                    >
                                        <Camera size={18} />
                                        Capture
                                    </Button>
                                </>
                            )}

                            {capturedImage && (
                                <>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setCapturedImage(null);
                                            setShowCamera(true);
                                        }}
                                        fullWidth
                                    >
                                        <RefreshCw size={18} />
                                        Retake
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleEnroll}
                                        loading={enrolling}
                                        fullWidth
                                    >
                                        <CheckCircle size={18} />
                                        {selectedStudent.has_face_encoding ? 'Update Enrollment' : 'Enroll Face'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    // Check if permission is denied
    if (permissionDenied) {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <Card>
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <Shield size={64} style={{ color: 'var(--color-warning)', marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Access Denied
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            You do not have permission to access Face Enrollment.
                            This feature is only available to administrators.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    // Check if face recognition is available
    if (enrollmentStatus && !enrollmentStatus.face_recognition_available) {
        return (
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <Card>
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <AlertCircle size={64} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Face Recognition Not Available
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                            The face recognition library is not installed on the server.
                            Please contact your administrator to install the required dependencies.
                        </p>
                        <code style={{
                            background: 'var(--color-background-secondary)',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}>
                            pip install face_recognition
                        </code>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '2.25rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                margin: '0 0 0.5rem 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <Camera size={32} />
                                Face Enrollment
                            </h1>
                            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                                Capture and manage student faces for attendance recognition
                            </p>
                        </div>

                        <Button variant="secondary" onClick={fetchData}>
                            <RefreshCw size={18} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Status Cards */}
                {renderStatusCards()}

                {/* Filters */}
                {renderFilters()}

                {/* Results Count */}
                <div style={{
                    marginBottom: '1rem',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem'
                }}>
                    Showing {filteredStudents.length} of {students.length} students
                </div>

                {/* Student Grid */}
                {filteredStudents.length > 0 ? (
                    renderStudentGrid()
                ) : (
                    <Card>
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <User size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                No students found matching your filters
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            {/* Enrollment Modal */}
            {renderEnrollmentModal()}
        </>
    );
};

export default FaceEnrollment;
