import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import './Students.css';

interface Section {
    id: number;
    name: string;
    grade_level_name: string;
}

const EditStudent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);

    const [formData, setFormData] = useState({
        admission_number: '',
        admission_date: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        blood_group: '',
        email: '',
        phone: '',
        address: '',
        father_name: '',
        father_phone: '',
        father_profession: '',
        mother_name: '',
        mother_phone: '',
        mother_profession: '',
        pen_number: '',
        aadhar_number: '',
        aapar_number: '',
        citizenship: '',
        religion: '',
        caste: '',
        previous_school_name: '',
        previous_school_address: '',
        previous_school_class: '',
        transfer_certificate_number: '',
    });

    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [currentEnrollment, setCurrentEnrollment] = useState<any>(null);
    const [enrollmentForm, setEnrollmentForm] = useState({
        section: '',
        roll_number: ''
    });

    useEffect(() => {
        fetchSections();
        fetchStudent();
        fetchEnrollment();
    }, [id]);

    const fetchSections = async () => {
        try {
            const sectionsRes = await api.get('/tenants/sections/');
            let sectionsData: any[] = [];
            if (Array.isArray(sectionsRes.data)) {
                sectionsData = sectionsRes.data;
            } else if (sectionsRes.data?.results && Array.isArray(sectionsRes.data.results)) {
                sectionsData = sectionsRes.data.results;
            }
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
            setSections([]);
        }
    };

    const fetchEnrollment = async () => {
        try {
            // Fetch current enrollment for this student
            const response = await api.get(`/students/enrollments/?student=${id}`);
            const enrollments = Array.isArray(response.data) ? response.data : response.data.results || [];

            // Get the most recent active enrollment
            const activeEnrollment = enrollments.find((e: any) => e.status === 'ACTIVE') || enrollments[0];

            if (activeEnrollment) {
                setCurrentEnrollment(activeEnrollment);
                setEnrollmentForm({
                    section: activeEnrollment.section?.id || activeEnrollment.section || '',
                    roll_number: activeEnrollment.roll_number || ''
                });
            }
        } catch (error) {
            console.error('Error fetching enrollment:', error);
        }
    };

    const fetchStudent = async () => {
        try {
            const response = await api.get(`/students/students/${id}/`);
            const student = response.data;

            setFormData({
                admission_number: student.admission_number || '',
                admission_date: student.admission_date || '',
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                date_of_birth: student.date_of_birth || '',
                gender: student.gender || 'M',
                blood_group: student.blood_group || '',
                email: student.email || '',
                phone: student.phone || '',
                address: student.address || '',
                father_name: student.father_name || '',
                father_phone: student.father_phone || '',
                mother_name: student.mother_name || '',
                mother_phone: student.mother_phone || '',
                pen_number: student.pen_number || '',
                aadhar_number: student.aadhar_number || '',
                aapar_number: student.aapar_number || '',
            });

            if (student.photo) {
                setPhotoPreview(student.photo);
            }
        } catch (error) {
            console.error('Error fetching student:', error);
            alert('Failed to load student data');
            navigate('/students');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhoto(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update student data
            await api.patch(`/students/students/${id}/`, formData);

            // Upload photo if changed
            if (photo) {
                const photoFormData = new FormData();
                photoFormData.append('photo', photo);

                try {
                    await api.patch(`/students/students/${id}/`, photoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                }
            }

            // Update enrollment if changed and exists
            if (currentEnrollment && (enrollmentForm.section || enrollmentForm.roll_number)) {
                try {
                    await api.patch(`/students/enrollments/${currentEnrollment.id}/`, {
                        section: enrollmentForm.section || currentEnrollment.section,
                        roll_number: enrollmentForm.roll_number
                    });
                } catch (enrollmentError) {
                    console.error('Error updating enrollment:', enrollmentError);
                    alert('Student updated but enrollment update failed. Please update enrollment separately.');
                }
            }

            alert(t('students.update_success', { defaultValue: 'Student updated successfully!' }));
            navigate(`/students/${id}`);
        } catch (error) {
            console.error('Error updating student:', error);
            alert(t('students.update_error', { defaultValue: 'Failed to update student. Please check all fields.' }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Loading student data..." />;
    }

    return (
        <div className="add-student-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('students.edit_title', { defaultValue: 'Edit Student' })}</h1>
                    <p className="page-subtitle">{t('students.edit_subtitle', { defaultValue: 'Update student information' })}</p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/students/${id}`)}>
                    {t('common.cancel')}
                </Button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {/* Basic Info */}
                    <Card title={t('students.basic_info', { defaultValue: 'Basic Information' })}>
                        {/* Photo Upload */}
                        <div className="photo-upload-section">
                            <label>{t('students.photo', { defaultValue: 'Student Photo' })}</label>
                            <div className="photo-upload-container">
                                {photoPreview ? (
                                    <div className="photo-preview">
                                        <img src={photoPreview} alt="Student" />
                                        <button type="button" className="remove-photo-btn" onClick={handleRemovePhoto}>
                                            ✕ {t('common.remove', { defaultValue: 'Remove' })}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="photo-upload-placeholder">
                                        {/* Hidden file inputs */}
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                        <input
                                            type="file"
                                            id="photo-camera"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />

                                        {/* Upload buttons */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            width: '100%'
                                        }}>
                                            <div className="upload-icon">📷</div>
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.75rem',
                                                flexWrap: 'wrap',
                                                justifyContent: 'center'
                                            }}>
                                                <label
                                                    htmlFor="photo-upload"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'var(--color-primary-500)',
                                                        color: 'white',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-primary-600)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-primary-500)'}
                                                >
                                                    📁 Choose File
                                                </label>
                                                <label
                                                    htmlFor="photo-camera"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'var(--color-success)',
                                                        color: 'white',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#388E3C'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--color-success)'}
                                                >
                                                    📸 Take Photo
                                                </label>
                                            </div>
                                            <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>
                                                {t('students.photo_hint', { defaultValue: 'JPG, PNG (Max 2MB)' })}
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.admission_number')}</label>
                                <input name="admission_number" value={formData.admission_number} onChange={handleChange} required disabled />
                            </div>
                            <div className="form-group">
                                <label>{t('students.admission_date')}</label>
                                <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.first_name')} *</label>
                                <input name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.middle_name', 'Middle Name')}</label>
                                <input name="middle_name" value={formData.middle_name} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.last_name', 'Last Name')}</label>
                                <input name="last_name" value={formData.last_name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('students.blood_group', 'Blood Group')}</label>
                                <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.date_of_birth', 'Date of Birth')}</label>
                                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.gender')}</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.citizenship', 'Citizenship')}</label>
                                <input name="citizenship" value={formData.citizenship} onChange={handleChange} placeholder="e.g., Indian, US Citizen" />
                            </div>
                            <div className="form-group">
                                <label>{t('students.religion', 'Religion')}</label>
                                <input name="religion" value={formData.religion} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.caste', 'Caste')}</label>
                                <input name="caste" value={formData.caste} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                {/* Empty for alignment */}
                            </div>
                        </div>
                    </Card>

                    {/* Contact & Family */}
                    <Card title={t('students.family_info', { defaultValue: 'Contact & Family' })}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.email', 'Email')}</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>{t('students.phone', 'Phone')}</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.father_name', 'Father Name')}</label>
                                <input name="father_name" value={formData.father_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.father_phone', 'Father Phone')}</label>
                                <input name="father_phone" value={formData.father_phone} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.father_profession', 'Father Profession')}</label>
                                <input name="father_profession" value={formData.father_profession} onChange={handleChange} placeholder="e.g., Engineer, Doctor" />
                            </div>
                            <div className="form-group">
                                {/* Empty for alignment */}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.mother_name', 'Mother Name')} *</label>
                                <input name="mother_name" value={formData.mother_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.mother_phone', 'Mother Phone')} *</label>
                                <input name="mother_phone" value={formData.mother_phone} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.mother_profession', 'Mother Profession')}</label>
                                <input name="mother_profession" value={formData.mother_profession} onChange={handleChange} placeholder="e.g., Teacher, Homemaker" />
                            </div>
                            <div className="form-group">
                                {/* Empty for alignment */}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('students.address')}</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} required />
                        </div>
                    </Card>

                    {/* Previous School Details */}
                    <Card title={t('students.previous_school', { defaultValue: 'Previous School Details' })}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.previous_school_name', 'Previous School Name')}</label>
                                <input name="previous_school_name" value={formData.previous_school_name} onChange={handleChange} placeholder="Name of previous school" />
                            </div>
                            <div className="form-group">
                                <label>{t('students.previous_school_class', 'Last Class Attended')}</label>
                                <input name="previous_school_class" value={formData.previous_school_class} onChange={handleChange} placeholder="e.g., Class 9, Grade 10" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.previous_school_address', 'Previous School Address')}</label>
                                <textarea name="previous_school_address" value={formData.previous_school_address} onChange={handleChange} rows={2} placeholder="Address of previous school" />
                            </div>
                            <div className="form-group">
                                <label>{t('students.transfer_certificate_number', 'Transfer Certificate Number')}</label>
                                <input name="transfer_certificate_number" value={formData.transfer_certificate_number} onChange={handleChange} placeholder="TC Number" />
                            </div>
                        </div>
                    </Card>

                    {/* Government IDs */}
                    <Card title={t('students.government_ids', { defaultValue: 'Government IDs & Identification' })}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.pen_number', 'PEN Number')}</label>
                                <input name="pen_number" value={formData.pen_number} onChange={handleChange} placeholder="Permanent Education Number" />
                            </div>
                            <div className="form-group">
                                <label>{t('students.aadhar_number', 'Aadhar Number')}</label>
                                <input
                                    name="aadhar_number"
                                    value={formData.aadhar_number}
                                    onChange={handleChange}
                                    placeholder="12-digit Aadhar number"
                                    maxLength={12}
                                    pattern="[0-9]{12}"
                                />
                                <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                                    Enter 12-digit Aadhar number
                                </small>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.aapar_number', 'Aapar Number')}</label>
                                <input name="aapar_number" value={formData.aapar_number} onChange={handleChange} placeholder="Other ID number" />
                            </div>
                            <div className="form-group">
                                <label>{t('students.blood_group', 'Blood Group')}</label>
                                <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Enrollment Details */}
                    <Card title={t('students.enrollment', { defaultValue: 'Enrollment Details' })}>
                        {currentEnrollment ? (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('students.class_section', { defaultValue: 'Class & Section' })}</label>
                                        <select
                                            value={enrollmentForm.section}
                                            onChange={(e) => setEnrollmentForm({ ...enrollmentForm, section: e.target.value })}
                                        >
                                            <option value="">Select Section</option>
                                            {sections.map(s => (
                                                <option key={s.id} value={s.id}>{s.grade_level_name} - {s.name}</option>
                                            ))}
                                        </select>
                                        <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                            Current: {currentEnrollment.section_name || 'Not assigned'}
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('students.roll_no', 'Roll Number')}</label>
                                        <input
                                            value={enrollmentForm.roll_number}
                                            onChange={(e) => setEnrollmentForm({ ...enrollmentForm, roll_number: e.target.value })}
                                            placeholder="Enter roll number"
                                        />
                                    </div>
                                </div>
                                <small style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                                    💡 Note: Changing enrollment will update the student's current class/section assignment.
                                </small>
                            </>
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                <p>⚠️ No active enrollment found for this student.</p>
                                <small>Go to Students → Enrollments to assign this student to a class.</small>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="form-actions">
                    <Button type="submit" variant="primary" loading={saving} size="large">
                        {t('students.save_changes', { defaultValue: 'Save Changes' })}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditStudent;
