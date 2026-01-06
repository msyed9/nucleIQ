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
        pen_number: '',
        aadhar_number: '',
        aapar_number: '',
        section: '',
        roll_number: '',
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

    useEffect(() => {
        fetchSections();
        fetchTenantSettings();
    }, []);

    const fetchTenantSettings = async () => {
        try {
            const response = await api.get('/tenants/settings/');
            const settings = response.data;

            if (settings.auto_generate_admission_number) {
                setAutoGenerateAdmission(true);
                // Generate preview
                const year = new Date().getFullYear();
                const format = settings.admission_number_format || 'ADM{YEAR}{SEQUENCE:04d}';
                const sequence = settings.admission_number_sequence || 1;

                let preview = format.replace('{YEAR}', year.toString());
                preview = preview.replace('{PREFIX}', settings.admission_number_prefix || 'ADM');

                // Handle sequence formatting
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
                let loginMessage = '✅ Student added successfully!\n\n';

                if (logins.existing_accounts_linked) {
                    loginMessage += '🔗 ' + logins.message + '\n';
                } else {
                    if (logins.father?.created) {
                        loginMessage += `👨 Father's Login:\n`;
                        loginMessage += `   Username: ${logins.father.username}\n`;
                        loginMessage += `   Password: ${logins.father.password}\n\n`;
                    } else if (logins.father?.message) {
                        loginMessage += `👨 Father: ${logins.father.message}\n\n`;
                    }

                    if (logins.mother?.created) {
                        loginMessage += `👩 Mother's Login:\n`;
                        loginMessage += `   Username: ${logins.mother.username}\n`;
                        loginMessage += `   Password: ${logins.mother.password}\n\n`;
                    } else if (logins.mother?.message) {
                        loginMessage += `👩 Mother: ${logins.mother.message}\n\n`;
                    }
                }

                loginMessage += '\n📱 Please save these credentials and share with parents.';
                alert(loginMessage);
            }

            success(t('students.add_success', { defaultValue: 'Student admitted and enrolled successfully! 🎉' }));
            navigate('/students');
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
        </>
    );
};

export default AddStudent;
