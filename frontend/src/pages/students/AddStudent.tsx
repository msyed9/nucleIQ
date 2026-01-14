import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast, ToastContainer } from '@/design-system';
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
        section: '',
        roll_number: '',
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
    const [autoGenerateAdmission, setAutoGenerateAdmission] = useState(false);
    const [admissionNumberPreview, setAdmissionNumberPreview] = useState('');
    const { toasts, removeToast, success, error } = useToast();
    const [existingParents, setExistingParents] = useState<any[]>([]);
    const [selectedParent, setSelectedParent] = useState<any>(null);
    const [showParentSuggestions, setShowParentSuggestions] = useState(false);
    const [searchingParents, setSearchingParents] = useState(false);
    const [parentCredentials, setParentCredentials] = useState<any>(null);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);

    useEffect(() => {
        fetchSections();
        fetchTenantSettings();
    }, []);

    const fetchTenantSettings = async () => {
        try {
            // First get general settings
            const response = await api.get('/tenants/settings/');
            const settings = response.data;

            if (settings.auto_generate_admission_number) {
                setAutoGenerateAdmission(true);

                // Fetch the actual next admission number from backend
                try {
                    const admissionRes = await api.get('/tenants/settings/next_admission_number/');
                    if (admissionRes.data.auto_generate && admissionRes.data.admission_number) {
                        setAdmissionNumberPreview(admissionRes.data.admission_number);
                        setFormData(prev => ({ ...prev, admission_number: admissionRes.data.admission_number }));
                    }
                } catch (admErr) {
                    console.error('Error fetching admission number preview:', admErr);
                    // Fallback: Generate preview locally
                    const year = new Date().getFullYear();
                    const format = settings.admission_number_format || 'ADM{YEAR}{SEQUENCE:04d}';
                    const sequence = settings.admission_number_sequence || 1;

                    let preview = format.replace('{YEAR}', year.toString());
                    preview = preview.replace('{PREFIX}', settings.admission_number_prefix || 'ADM');

                    const sequenceMatch = format.match(/\{SEQUENCE:(\d+)d\}/);
                    if (sequenceMatch) {
                        const width = parseInt(sequenceMatch[1]);
                        preview = preview.replace(/\{SEQUENCE:\d+d\}/, sequence.toString().padStart(width, '0'));
                    } else {
                        preview = preview.replace('{SEQUENCE}', sequence.toString());
                    }

                    setAdmissionNumberPreview(preview);
                    setFormData(prev => ({ ...prev, admission_number: preview }));
                }
            }
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    };

    const fetchSections = async () => {
        try {
            const sectionsRes = await api.get('/tenants/sections/');
            console.log('Sections API Response:', sectionsRes.data);

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

            console.log('Processed sections data:', sectionsData);
            console.log('Number of sections:', sectionsData.length);
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
            setSections([]); // Set empty array on error
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset selected parent when phone number changes to allow re-checking
        if (name === 'father_phone' || name === 'mother_phone') {
            setSelectedParent(null);
        }
    };

    // Automatic sibling detection when parent phone is entered
    useEffect(() => {
        const checkForExistingParents = async (phone: string) => {
            if (!phone || phone.length < 10) {
                setExistingParents([]);
                setShowParentSuggestions(false);
                return;
            }

            setSearchingParents(true);
            try {
                const response = await api.get(`/students/students/check_siblings/?phone=${phone}`);
                if (response.data && response.data.length > 0) {
                    setExistingParents(response.data);
                    setShowParentSuggestions(true);
                } else {
                    setExistingParents([]);
                    setShowParentSuggestions(false);
                }
            } catch (err) {
                console.error('Error checking for siblings:', err);
                setExistingParents([]);
                setShowParentSuggestions(false);
            } finally {
                setSearchingParents(false);
            }
        };

        // Debounce the search to avoid excessive API calls
        const timeoutId = setTimeout(() => {
            const phone = formData.father_phone || formData.mother_phone;
            if (phone) {
                checkForExistingParents(phone);
            }
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(timeoutId);
    }, [formData.father_phone, formData.mother_phone]);

    const applyParentInfo = (sibling: any) => {
        setFormData(prev => ({
            ...prev,
            father_name: sibling.father_name || prev.father_name,
            father_phone: sibling.father_phone || prev.father_phone,
            mother_name: sibling.mother_name || prev.mother_name,
            mother_phone: sibling.mother_phone || prev.mother_phone,
            address: sibling.address || prev.address,
        }));
        setSelectedParent(sibling);
        setShowParentSuggestions(false);
        success(t('students.parent_info_applied', { defaultValue: '✅ Parent information copied from sibling record!' }));
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
            // Get tenant ID from localStorage
            const tenantId = localStorage.getItem('current_tenant');
            if (!tenantId) {
                error(t('students.tenant_error', { defaultValue: 'Tenant information not found. Please login again.' }));
                setLoading(false);
                return;
            }

            // 1. Create Student Profile
            const studentPayload: any = {
                tenant: parseInt(tenantId),
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
                pen_number: formData.pen_number,
                aadhar_number: formData.aadhar_number,
                aapar_number: formData.aapar_number,
                create_parent_login: true, // Flag to create parent login
            };

            // If sibling/parent is selected, link family_id
            if (selectedParent && selectedParent.family_id) {
                studentPayload.family_id = selectedParent.family_id;
            }

            const studentRes = await api.post('/students/students/', studentPayload);

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
                        tenant: parseInt(tenantId),
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

            // Display parent login information if created
            if (studentRes.data.parent_logins) {
                const logins = studentRes.data.parent_logins;
                setParentCredentials({
                    studentName: `${formData.first_name} ${formData.last_name}`,
                    admissionNumber: studentRes.data.admission_number,
                    ...logins
                });
                setShowCredentialsModal(true);
                success(t('students.add_success', { defaultValue: 'Student admitted successfully! 🎉' }));
            } else {
                success(t('students.add_success', { defaultValue: 'Student admitted and enrolled successfully! 🎉' }));
                navigate('/students');
            }
        } catch (err: any) {
            console.error('Error admitting student:', err);
            // Log server validation errors when present to aid debugging
            if (err?.response?.data) {
                try {
                    console.error('Server response:', JSON.stringify(err.response.data, null, 2));
                } catch (e) {
                    console.error('Server response (unstringifiable):', err.response.data);
                }
                // Show first validation error if available
                const respData = err.response.data;
                let message = t('students.add_error', { defaultValue: 'Failed to admit student. Please check all fields.' });
                if (typeof respData === 'string') {
                    message = respData;
                } else if (respData.detail) {
                    message = respData.detail;
                } else if (typeof respData === 'object') {
                    // Collect field errors into a single message
                    const parts: string[] = [];
                    Object.entries(respData).forEach(([k, v]) => {
                        if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
                        else parts.push(`${k}: ${String(v)}`);
                    });
                    if (parts.length) message = parts.join(' | ');
                }

                error(message);
            } else {
                error(t('students.add_error', { defaultValue: 'Failed to admit student. Please check all fields.' }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
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
                                    <input
                                        name="admission_number"
                                        value={formData.admission_number}
                                        onChange={handleChange}
                                        required
                                        readOnly={autoGenerateAdmission}
                                        style={{
                                            backgroundColor: autoGenerateAdmission ? 'var(--color-bg-secondary)' : 'transparent',
                                            cursor: autoGenerateAdmission ? 'not-allowed' : 'text'
                                        }}
                                    />
                                    {autoGenerateAdmission && (
                                        <small style={{ color: 'var(--color-success)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                                            ✓ Auto-generated admission number
                                        </small>
                                    )}
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
                                    <input
                                        name="father_phone"
                                        value={formData.father_phone}
                                        onChange={handleChange}
                                        required
                                        readOnly={false}
                                        disabled={false}
                                        style={{ pointerEvents: 'auto', cursor: 'text' }}
                                    />
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
                                    <input
                                        name="mother_phone"
                                        value={formData.mother_phone}
                                        onChange={handleChange}
                                        required
                                        readOnly={false}
                                        disabled={false}
                                        style={{ pointerEvents: 'auto', cursor: 'text' }}
                                    />
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

                            {/* Automatic Parent Detection */}
                            {showParentSuggestions && existingParents.length > 0 && (
                                <div style={{
                                    padding: '1rem',
                                    backgroundColor: '#fff3cd',
                                    borderRadius: '8px',
                                    marginTop: '1rem',
                                    marginBottom: '1rem',
                                    border: '2px solid #ffc107',
                                    animation: 'fadeIn 0.3s ease-in'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        marginBottom: '0.75rem',
                                        color: '#856404',
                                        fontWeight: 600,
                                        fontSize: '0.95rem'
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>🔗</span>
                                        <span>{t('students.existing_family_detected', { defaultValue: 'Existing family member(s) detected!' })}</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '0.75rem' }}>
                                        {t('students.family_suggestion_text', {
                                            defaultValue: 'We found students with matching parent contact information. Click on a student below to automatically fill in the parent details and link them as siblings:'
                                        })}
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {existingParents.map((sibling) => (
                                            <div
                                                key={sibling.id}
                                                onClick={() => applyParentInfo(sibling)}
                                                style={{
                                                    padding: '0.75rem',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #dee2e6',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                    e.currentTarget.style.borderColor = '#007bff';
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'white';
                                                    e.currentTarget.style.borderColor = '#dee2e6';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#333' }}>
                                                    👤 {sibling.first_name} {sibling.last_name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span>📋 {sibling.admission_number}</span>
                                                    {sibling.current_class && <span>🎓 {sibling.current_class}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowParentSuggestions(false)}
                                        style={{
                                            marginTop: '0.75rem',
                                            padding: '0.4rem 0.75rem',
                                            fontSize: '0.8rem',
                                            color: '#856404',
                                            background: 'transparent',
                                            border: '1px solid #856404',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ✕ {t('common.dismiss', { defaultValue: 'Dismiss' })}
                                    </button>
                                </div>
                            )}

                            {/* Show loading state while checking */}
                            {searchingParents && (formData.father_phone?.length >= 10 || formData.mother_phone?.length >= 10) && (
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#e3f2fd',
                                    borderRadius: '6px',
                                    marginTop: '1rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #2196f3',
                                    fontSize: '0.875rem',
                                    color: '#1565c0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>🔍</span>
                                    <span>{t('students.checking_family', { defaultValue: 'Checking for existing family members...' })}</span>
                                </div>
                            )}

                            {/* Show selected parent confirmation */}
                            {selectedParent && (
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: '#d4edda',
                                    borderRadius: '6px',
                                    marginTop: '1rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #28a745',
                                    fontSize: '0.875rem',
                                    color: '#155724',
                                    fontWeight: 600
                                }}>
                                    ✅ {t('students.linked_to_sibling', { defaultValue: 'Linked to sibling:' })} {selectedParent.first_name} {selectedParent.last_name}
                                </div>
                            )}
                            <div className="form-group">
                                <label>{t('students.address')}</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows={3} required />
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

                        {/* Parent Portal Access Preview */}
                        {(formData.father_phone || formData.mother_phone) && (
                            <Card title={t('students.parent_portal_access', { defaultValue: '🔐 Parent Portal Access' })}>
                                <div style={{
                                    backgroundColor: '#e8f5e9',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1rem',
                                    border: '1px solid #4caf50'
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
                                        {t('students.parent_portal_info', {
                                            defaultValue: 'Parent login accounts will be automatically created after admission. The phone number becomes the username, and a temporary password will be generated.'
                                        })}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {formData.father_phone && (
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem',
                                                fontWeight: 600,
                                                color: '#333'
                                            }}>
                                                <span>👨</span>
                                                <span>{t('students.father_account', { defaultValue: "Father's Account" })}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.25rem', fontSize: '0.9rem' }}>
                                                <span style={{ color: '#666' }}>{t('common.username', { defaultValue: 'Username' })}:</span>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1976d2' }}>
                                                    {formData.father_phone}
                                                </span>
                                                <span style={{ color: '#666' }}>{t('common.password', { defaultValue: 'Password' })}:</span>
                                                <span style={{ fontFamily: 'monospace', color: '#ff9800' }}>
                                                    {t('students.auto_generated', { defaultValue: '(Auto-generated on submit)' })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {formData.mother_phone && formData.mother_phone !== formData.father_phone && (
                                        <div style={{
                                            padding: '1rem',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '8px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.5rem',
                                                fontWeight: 600,
                                                color: '#333'
                                            }}>
                                                <span>👩</span>
                                                <span>{t('students.mother_account', { defaultValue: "Mother's Account" })}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.25rem', fontSize: '0.9rem' }}>
                                                <span style={{ color: '#666' }}>{t('common.username', { defaultValue: 'Username' })}:</span>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1976d2' }}>
                                                    {formData.mother_phone}
                                                </span>
                                                <span style={{ color: '#666' }}>{t('common.password', { defaultValue: 'Password' })}:</span>
                                                <span style={{ fontFamily: 'monospace', color: '#ff9800' }}>
                                                    {t('students.auto_generated', { defaultValue: '(Auto-generated on submit)' })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {formData.mother_phone === formData.father_phone && formData.father_phone && (
                                        <div style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#fff3cd',
                                            borderRadius: '6px',
                                            border: '1px solid #ffc107',
                                            fontSize: '0.85rem',
                                            color: '#856404'
                                        }}>
                                            ℹ️ {t('students.same_phone_notice', {
                                                defaultValue: 'Father and Mother have the same phone number. Only one account will be created.'
                                            })}
                                        </div>
                                    )}

                                    {selectedParent && (
                                        <div style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#e3f2fd',
                                            borderRadius: '6px',
                                            border: '1px solid #2196f3',
                                            fontSize: '0.85rem',
                                            color: '#1565c0'
                                        }}>
                                            🔗 {t('students.existing_account_linked', {
                                                defaultValue: 'Existing parent account will be linked from sibling records. No new password will be generated.'
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="form-actions">
                        <Button type="submit" variant="primary" loading={loading} size="large">
                            {t('students.submit_admission', { defaultValue: 'Complete Admission' })}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Parent Credentials Modal */}
            {showCredentialsModal && parentCredentials && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#28a745',
                                marginBottom: '0.5rem'
                            }}>
                                {t('students.admission_success', { defaultValue: 'Admission Successful!' })}
                            </h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                                {parentCredentials.studentName} ({parentCredentials.admissionNumber})
                            </p>
                        </div>

                        {parentCredentials.existing_accounts_linked ? (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                border: '1px solid #2196f3'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1565c0', fontWeight: 600 }}>
                                    <span>🔗</span>
                                    <span>{parentCredentials.message}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    marginBottom: '1rem',
                                    color: '#333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <span>🔐</span>
                                    {t('students.parent_login_credentials', { defaultValue: 'Parent Login Credentials' })}
                                </h3>

                                {parentCredentials.father?.created && (
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                            👨 {t('students.father_login', { defaultValue: "Father's Login" })}
                                        </div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '100px 1fr',
                                            gap: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ color: '#666' }}>{t('common.username', { defaultValue: 'Username' })}:</span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: '#1976d2',
                                                cursor: 'pointer'
                                            }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(parentCredentials.father.username);
                                                    success(t('common.copied', { defaultValue: 'Copied!' }));
                                                }}
                                                title="Click to copy"
                                            >
                                                {parentCredentials.father.username} 📋
                                            </span>
                                            <span style={{ color: '#666' }}>{t('common.password', { defaultValue: 'Password' })}:</span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: '#d32f2f',
                                                cursor: 'pointer'
                                            }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(parentCredentials.father.password);
                                                    success(t('common.copied', { defaultValue: 'Copied!' }));
                                                }}
                                                title="Click to copy"
                                            >
                                                {parentCredentials.father.password} 📋
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {parentCredentials.father && !parentCredentials.father.created && parentCredentials.father.message && (
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#e8f5e9',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #4caf50',
                                        fontSize: '0.9rem',
                                        color: '#2e7d32'
                                    }}>
                                        👨 {parentCredentials.father.message}
                                    </div>
                                )}

                                {parentCredentials.mother?.created && (
                                    <div style={{
                                        padding: '1rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #dee2e6'
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
                                            👩 {t('students.mother_login', { defaultValue: "Mother's Login" })}
                                        </div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '100px 1fr',
                                            gap: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            <span style={{ color: '#666' }}>{t('common.username', { defaultValue: 'Username' })}:</span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: '#1976d2',
                                                cursor: 'pointer'
                                            }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(parentCredentials.mother.username);
                                                    success(t('common.copied', { defaultValue: 'Copied!' }));
                                                }}
                                                title="Click to copy"
                                            >
                                                {parentCredentials.mother.username} 📋
                                            </span>
                                            <span style={{ color: '#666' }}>{t('common.password', { defaultValue: 'Password' })}:</span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: '#d32f2f',
                                                cursor: 'pointer'
                                            }}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(parentCredentials.mother.password);
                                                    success(t('common.copied', { defaultValue: 'Copied!' }));
                                                }}
                                                title="Click to copy"
                                            >
                                                {parentCredentials.mother.password} 📋
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {parentCredentials.mother && !parentCredentials.mother.created && parentCredentials.mother.message && (
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#e8f5e9',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #4caf50',
                                        fontSize: '0.9rem',
                                        color: '#2e7d32'
                                    }}>
                                        👩 {parentCredentials.mother.message}
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid #ffc107',
                            fontSize: '0.85rem',
                            color: '#856404',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                        }}>
                            <span>⚠️</span>
                            <span>{t('students.save_credentials_warning', { defaultValue: 'Please save these credentials and share with parents. Passwords cannot be recovered once this dialog is closed.' })}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Copy all credentials to clipboard
                                    let text = `Parent Login Credentials for ${parentCredentials.studentName}\n`;
                                    text += `Admission Number: ${parentCredentials.admissionNumber}\n\n`;
                                    if (parentCredentials.father?.created) {
                                        text += `Father's Login:\n`;
                                        text += `  Username: ${parentCredentials.father.username}\n`;
                                        text += `  Password: ${parentCredentials.father.password}\n\n`;
                                    }
                                    if (parentCredentials.mother?.created) {
                                        text += `Mother's Login:\n`;
                                        text += `  Username: ${parentCredentials.mother.username}\n`;
                                        text += `  Password: ${parentCredentials.mother.password}\n`;
                                    }
                                    navigator.clipboard.writeText(text);
                                    success(t('students.credentials_copied', { defaultValue: 'All credentials copied to clipboard!' }));
                                }}
                            >
                                📋 {t('common.copy_all', { defaultValue: 'Copy All' })}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowCredentialsModal(false);
                                    navigate('/students');
                                }}
                            >
                                ✓ {t('common.done', { defaultValue: 'Done' })}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddStudent;
