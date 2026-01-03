import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Students.css';

interface Section {
    id: number;
    name: string;
    grade_level_name: string;
}

const AddStudent: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);

    const [formData, setFormData] = useState({
        admission_number: '',
        admission_date: new Date().toISOString().split('T')[0],
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        blood_group: '',
        email: '',
        phone: '',
        address: '',
        father_name: '',
        father_phone: '',
        mother_name: '',
        mother_phone: '',
        section: '',
        roll_number: '',
    });

    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const sectionsRes = await api.get('/tenants/sections/');

            // Handle different response structures
            let sectionsData: any[] = [];
            if (Array.isArray(sectionsRes.data)) {
                // Direct array response
                sectionsData = sectionsRes.data;
            } else if (sectionsRes.data?.results && Array.isArray(sectionsRes.data.results)) {
                // Paginated response with results array
                sectionsData = sectionsRes.data.results;
            } else {
                console.warn('Unexpected sections response structure:', sectionsRes.data);
                sectionsData = [];
            }

            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
            setSections([]); // Set empty array on error
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

            // Create preview
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
        setLoading(true);
        try {
            // 1. Create Student Profile
            const studentRes = await api.post('/students/students/', {
                admission_number: formData.admission_number,
                admission_date: formData.admission_date,
                first_name: formData.first_name,
                last_name: formData.last_name,
                date_of_birth: formData.date_of_birth,
                gender: formData.gender,
                blood_group: formData.blood_group,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                father_name: formData.father_name,
                father_phone: formData.father_phone,
                mother_name: formData.mother_name,
                mother_phone: formData.mother_phone,
            });

            const studentId = studentRes.data.id;

            // 2. Upload Photo (if provided)
            if (photo && studentId) {
                const photoFormData = new FormData();
                photoFormData.append('photo', photo);

                try {
                    await api.patch(`/students/students/${studentId}/`, photoFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                    // Don't fail the whole process if photo upload fails
                }
            }

            // 3. Create Enrollment (if section provided)
            if (formData.section && studentId) {
                // Fetch active academic year
                const ayRes = await api.get('/tenants/years/?is_active=true');
                const activeYear = ayRes.data[0]; // Assuming at least one active year exists

                if (activeYear) {
                    await api.post('/students/enrollments/', {
                        student: studentId,
                        academic_year: activeYear.id,
                        section: parseInt(formData.section),
                        roll_number: formData.roll_number,
                        enrollment_date: formData.admission_date,
                        status: 'ACTIVE'
                    });
                } else {
                    console.warn('No active academic year found for enrollment');
                }
            }

            alert(t('students.add_success', { defaultValue: 'Student admitted and enrolled successfully! 🎉' }));
            navigate('/students');
        } catch (error) {
            console.error('Error admitting student:', error);
            alert(t('students.add_error', { defaultValue: 'Failed to admit student. Please check all fields.' }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-student-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('students.add_title', { defaultValue: 'Student Admission' })}</h1>
                    <p className="page-subtitle">{t('students.add_subtitle', { defaultValue: 'Enroll a new student into the school' })}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/students')}>
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
                                        <input
                                            type="file"
                                            id="photo-upload"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="photo-upload" className="photo-upload-label">
                                            <div className="upload-icon">📷</div>
                                            <div>{t('students.upload_photo', { defaultValue: 'Click to upload photo' })}</div>
                                            <small>{t('students.photo_hint', { defaultValue: 'JPG, PNG (Max 2MB)' })}</small>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.admission_number')}</label>
                                <input name="admission_number" value={formData.admission_number} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.admission_date')}</label>
                                <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.first_name')}</label>
                                <input name="first_name" value={formData.first_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>{t('students.last_name')}</label>
                                <input name="last_name" value={formData.last_name} onChange={handleChange} required />
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
                        <div className="form-group">
                            <label>{t('students.address')}</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} required />
                        </div>
                    </Card>

                    {/* Enrollment */}
                    <Card title={t('students.enrollment', { defaultValue: 'Enrollment Details' })}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('students.class_section', { defaultValue: 'Class & Section' })}</label>
                                <select name="section" value={formData.section} onChange={handleChange}>
                                    <option value="">Select Section</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.grade_level_name} - {s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{t('students.roll_no', 'Roll Number')}</label>
                                <input name="roll_number" value={formData.roll_number} onChange={handleChange} />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="form-actions">
                    <Button type="submit" variant="primary" loading={loading} size="large">
                        {t('students.submit_admission', { defaultValue: 'Complete Admission' })}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddStudent;
