import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { useToast, ToastContainer } from '@/design-system';
import { citizenshipOptions, religionOptions } from '../../config/options';
import './AddStudent.css';

interface Section {
    id: number;
    name: string;
    grade_level_name: string;
}

const STEPS = [
    { key: 'basic', label: 'Basic Info', icon: '👤' },
    { key: 'family', label: 'Family', icon: '👨‍👩‍👧' },
    { key: 'academic', label: 'Academic', icon: '🎓' },
    { key: 'documents', label: 'Documents', icon: '📄' },
];

const AddStudent: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [sections, setSections] = useState<Section[]>([]);
    const [citizenshipOther, setCitizenshipOther] = useState('');

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
            const response = await api.get('/tenants/settings/');
            const settings = response.data;

            if (settings.auto_generate_admission_number) {
                setAutoGenerateAdmission(true);
                try {
                    const admissionRes = await api.get('/tenants/settings/next_admission_number/');
                    if (admissionRes.data.auto_generate && admissionRes.data.admission_number) {
                        setAdmissionNumberPreview(admissionRes.data.admission_number);
                        setFormData(prev => ({ ...prev, admission_number: admissionRes.data.admission_number }));
                    }
                } catch (admErr) {
                    console.error('Error fetching admission number preview:', admErr);
                }
            }
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    };

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'father_phone' || name === 'mother_phone') {
            setSelectedParent(null);
        }
    };

    // Automatic sibling detection
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
                setExistingParents([]);
                setShowParentSuggestions(false);
            } finally {
                setSearchingParents(false);
            }
        };

        const timeoutId = setTimeout(() => {
            const phone = formData.father_phone || formData.mother_phone;
            if (phone) {
                checkForExistingParents(phone);
            }
        }, 800);

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
        success('✅ Parent information copied from sibling record!');
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

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 0: // Basic Info
                if (!formData.first_name.trim()) {
                    error('First name is required');
                    return false;
                }
                if (!formData.date_of_birth) {
                    error('Date of birth is required');
                    return false;
                }
                return true;
            case 1: // Family
                if (!formData.father_name.trim() && !formData.mother_name.trim()) {
                    error('At least one parent name is required');
                    return false;
                }
                if (!formData.father_phone && !formData.mother_phone) {
                    error('At least one parent phone number is required');
                    return false;
                }
                if (!formData.address.trim()) {
                    error('Residential address is required');
                    return false;
                }
                return true;
            case 2: // Academic
                return true;
            case 3: // Documents
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateStep(currentStep)) return;

        setLoading(true);
        try {
            const tenantId = localStorage.getItem('current_tenant');
            if (!tenantId) {
                error('Tenant information not found. Please login again.');
                setLoading(false);
                return;
            }

            const studentPayload: any = {
                tenant: parseInt(tenantId),
                admission_number: formData.admission_number,
                admission_date: formData.admission_date,
                first_name: formData.first_name,
                middle_name: formData.middle_name,
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
                citizenship: formData.citizenship === 'Other' ? citizenshipOther : formData.citizenship,
                religion: formData.religion,
                caste: formData.caste,
                create_parent_login: true,
            };

            if (selectedParent?.family_id) {
                studentPayload.family_id = selectedParent.family_id;
            }

            const studentRes = await api.post('/students/students/', studentPayload);
            const studentId = studentRes.data.id;

            // Upload photo if provided
            if (photo && studentId) {
                const photoFormData = new FormData();
                photoFormData.append('photo', photo);
                try {
                    await api.patch(`/students/students/${studentId}/`, photoFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch (photoError) {
                    console.error('Error uploading photo:', photoError);
                }
            }

            // Create enrollment if section provided
            if (formData.section && studentId) {
                try {
                    const ayRes = await api.get('/tenants/years/?is_active=true');
                    const activeYear = ayRes.data[0];
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
                    }
                } catch (enrollErr) {
                    console.error('Error creating enrollment:', enrollErr);
                }
            }

            if (studentRes.data.parent_logins) {
                setParentCredentials({
                    studentName: `${formData.first_name} ${formData.last_name}`,
                    admissionNumber: studentRes.data.admission_number,
                    ...studentRes.data.parent_logins
                });
                setShowCredentialsModal(true);
                success('Student admitted successfully! 🎉');
            } else {
                success('Student admitted and enrolled successfully! 🎉');
                navigate('/students');
            }
        } catch (err: any) {
            console.error('Error admitting student:', err);
            const respData = err.response?.data;
            let message = 'Failed to admit student. Please check all fields.';
            if (typeof respData === 'string') {
                message = respData;
            } else if (respData?.detail) {
                message = respData.detail;
            } else if (typeof respData === 'object') {
                const parts: string[] = [];
                Object.entries(respData).forEach(([k, v]) => {
                    if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
                    else parts.push(`${k}: ${String(v)}`);
                });
                if (parts.length) message = parts.join(' | ');
            }
            error(message);
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
                        <h1 className="page-title">{t('students.add_title', { defaultValue: '📚 Student Admission' })}</h1>
                        <p className="page-subtitle">{t('students.add_subtitle', { defaultValue: 'Enroll a new student into the school' })}</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/students')}>
                        ← Back to Students
                    </Button>
                </div>

                {/* Stepper */}
                <div className="stepper-container">
                    <div className="stepper">
                        {STEPS.map((step, index) => (
                            <React.Fragment key={step.key}>
                                <div
                                    className={`stepper-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                    onClick={() => index <= currentStep && setCurrentStep(index)}
                                >
                                    <div className={`step-circle ${index === currentStep ? 'active' : index < currentStep ? 'completed' : 'inactive'}`}>
                                        {index < currentStep ? '✓' : step.icon}
                                    </div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`step-connector ${index < currentStep ? 'completed' : ''}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 0: Basic Info */}
                    {currentStep === 0 && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">👤</div>
                                <div>
                                    <h2 className="section-title">Basic Information</h2>
                                    <p className="section-subtitle">Student's personal details</p>
                                </div>
                            </div>

                            {/* Photo Upload */}
                            <div className="photo-upload-wrapper">
                                <div className="photo-avatar-large">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Student" />
                                    ) : (
                                        <span className="avatar-placeholder">📷</span>
                                    )}
                                </div>
                                <div className="photo-actions">
                                    <input type="file" id="photo-upload" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                    <label htmlFor="photo-upload" className="photo-btn photo-btn-primary">
                                        📁 Choose File
                                    </label>
                                    <input type="file" id="photo-camera" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                    <label htmlFor="photo-camera" className="photo-btn photo-btn-success">
                                        📸 Camera
                                    </label>
                                    {photoPreview && (
                                        <button type="button" className="photo-btn photo-btn-danger" onClick={handleRemovePhoto}>
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-field">
                                    <label>Admission Number</label>
                                    <input
                                        name="admission_number"
                                        value={formData.admission_number}
                                        onChange={handleChange}
                                        readOnly={autoGenerateAdmission}
                                        required
                                    />
                                    {autoGenerateAdmission && (
                                        <span className="field-success">✓ Auto-generated</span>
                                    )}
                                </div>
                                <div className="form-field">
                                    <label>Admission Date</label>
                                    <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} required />
                                </div>
                                <div className="form-field">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-field">
                                    <label>First Name <span className="required">*</span></label>
                                    <input name="first_name" value={formData.first_name} onChange={handleChange} required />
                                </div>
                                <div className="form-field">
                                    <label>Middle Name</label>
                                    <input name="middle_name" value={formData.middle_name} onChange={handleChange} />
                                </div>
                                <div className="form-field">
                                    <label>Last Name</label>
                                    <input name="last_name" value={formData.last_name} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-field">
                                    <label>Date of Birth <span className="required">*</span></label>
                                    <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
                                </div>
                                <div className="form-field">
                                    <label>Blood Group</label>
                                    <select name="blood_group" value={formData.blood_group} onChange={handleChange}>
                                        <option value="">Select</option>
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
                                <div className="form-field">
                                    <label>Religion</label>
                                    <select name="religion" value={formData.religion} onChange={handleChange}>
                                        <option value="">Select Religion</option>
                                        {religionOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-field">
                                    <label>Citizenship</label>
                                    <input
                                        name="citizenship"
                                        list="citizenship-list"
                                        value={formData.citizenship}
                                        onChange={handleChange}
                                        placeholder="Select or type..."
                                    />
                                    <datalist id="citizenship-list">
                                        {citizenshipOptions.map(opt => (
                                            <option key={opt} value={opt} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-field">
                                    <label>Caste</label>
                                    <input name="caste" value={formData.caste} onChange={handleChange} />
                                </div>
                                <div className="form-field">
                                    <label>Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Family Info */}
                    {currentStep === 1 && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">👨‍👩‍👧</div>
                                <div>
                                    <h2 className="section-title">Family Information</h2>
                                    <p className="section-subtitle">Parent/Guardian contact details</p>
                                </div>
                            </div>

                            {/* Sibling Detection Alert */}
                            {showParentSuggestions && existingParents.length > 0 && (
                                <div className="alert-card alert-card-warning">
                                    <span className="alert-icon">🔗</span>
                                    <div className="alert-content">
                                        <div className="alert-title">Existing family member(s) detected!</div>
                                        <div className="alert-text">Click on a student to auto-fill parent details and link them as siblings.</div>
                                        <div className="sibling-suggestions">
                                            {existingParents.map((sibling) => (
                                                <div key={sibling.id} className="sibling-card" onClick={() => applyParentInfo(sibling)}>
                                                    <div className="sibling-info">
                                                        <h4>👤 {sibling.first_name} {sibling.last_name}</h4>
                                                        <div className="sibling-meta">
                                                            <span>📋 {sibling.admission_number}</span>
                                                            {sibling.current_class && <span>🎓 {sibling.current_class}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="sibling-action">→</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedParent && (
                                <div className="alert-card alert-card-success">
                                    <span className="alert-icon">✅</span>
                                    <div className="alert-content">
                                        <div className="alert-title">Linked to sibling: {selectedParent.first_name} {selectedParent.last_name}</div>
                                    </div>
                                </div>
                            )}

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Father's Name</label>
                                    <input name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Full name of father" />
                                </div>
                                <div className="form-field">
                                    <label>Father's Phone</label>
                                    <input name="father_phone" value={formData.father_phone} onChange={handleChange} placeholder="10-digit mobile" />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Father's Profession</label>
                                    <input name="father_profession" value={formData.father_profession} onChange={handleChange} placeholder="e.g., Engineer, Doctor" />
                                </div>
                                <div className="form-field" />
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Mother's Name</label>
                                    <input name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Full name of mother" />
                                </div>
                                <div className="form-field">
                                    <label>Mother's Phone</label>
                                    <input name="mother_phone" value={formData.mother_phone} onChange={handleChange} placeholder="10-digit mobile" />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Mother's Profession</label>
                                    <input name="mother_profession" value={formData.mother_profession} onChange={handleChange} placeholder="e.g., Teacher, Homemaker" />
                                </div>
                                <div className="form-field" />
                            </div>

                            <div className="form-field full-width">
                                <label>Address <span className="required">*</span></label>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows={3} />
                            </div>

                            {/* Parent Portal Preview */}
                            {(formData.father_phone || formData.mother_phone) && (
                                <div className="parent-preview-card">
                                    <div className="parent-preview-title">🔐 Parent Portal Access</div>
                                    <p style={{ fontSize: '0.85rem', color: '#065f46', marginBottom: '0.75rem' }}>
                                        Parent login accounts will be automatically created. Phone number becomes the username.
                                    </p>
                                    {formData.father_phone && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>👨 Father's Account:</strong>
                                            <div className="credential-row">
                                                <span className="credential-label">Username:</span>
                                                <span className="credential-value">{formData.father_phone}</span>
                                            </div>
                                        </div>
                                    )}
                                    {formData.mother_phone && formData.mother_phone !== formData.father_phone && (
                                        <div>
                                            <strong>👩 Mother's Account:</strong>
                                            <div className="credential-row">
                                                <span className="credential-label">Username:</span>
                                                <span className="credential-value">{formData.mother_phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Academic */}
                    {currentStep === 2 && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">🎓</div>
                                <div>
                                    <h2 className="section-title">Academic Details</h2>
                                    <p className="section-subtitle">Class enrollment and previous school information</p>
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Class & Section</label>
                                    <select name="section" value={formData.section} onChange={handleChange}>
                                        <option value="">Select Section</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>{s.grade_level_name} - {s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Roll Number</label>
                                    <input name="roll_number" value={formData.roll_number} onChange={handleChange} />
                                </div>
                            </div>

                            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                                📄 Previous School Details
                            </h3>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Previous School Name</label>
                                    <input name="previous_school_name" value={formData.previous_school_name} onChange={handleChange} placeholder="Name of previous school" />
                                </div>
                                <div className="form-field">
                                    <label>Last Class Attended</label>
                                    <input name="previous_school_class" value={formData.previous_school_class} onChange={handleChange} placeholder="e.g., Class 9" />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>Previous School Address</label>
                                    <textarea name="previous_school_address" value={formData.previous_school_address} onChange={handleChange} rows={2} />
                                </div>
                                <div className="form-field">
                                    <label>Transfer Certificate Number</label>
                                    <input name="transfer_certificate_number" value={formData.transfer_certificate_number} onChange={handleChange} placeholder="TC Number" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Documents */}
                    {currentStep === 3 && (
                        <div className="form-section">
                            <div className="section-header">
                                <div className="section-icon">📄</div>
                                <div>
                                    <h2 className="section-title">Government IDs & Documents</h2>
                                    <p className="section-subtitle">Identity verification documents</p>
                                </div>
                            </div>

                            <div className="form-grid-3">
                                <div className="form-field">
                                    <label>PEN Number</label>
                                    <input name="pen_number" value={formData.pen_number} onChange={handleChange} placeholder="Permanent Education Number" />
                                </div>
                                <div className="form-field">
                                    <label>Aadhar Number</label>
                                    <input
                                        name="aadhar_number"
                                        value={formData.aadhar_number}
                                        onChange={handleChange}
                                        placeholder="12-digit Aadhar"
                                        maxLength={12}
                                    />
                                    <span className="field-hint">Enter 12-digit Aadhar number</span>
                                </div>
                                <div className="form-field">
                                    <label>AAPAR / Other ID</label>
                                    <input name="aapar_number" value={formData.aapar_number} onChange={handleChange} placeholder="Other ID number" />
                                </div>
                            </div>

                            {/* Review Summary */}
                            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
                                📋 Review Summary
                            </h3>
                            <div className="review-grid">
                                <div className="review-section">
                                    <h4>👤 Student Info</h4>
                                    <div className="review-item">
                                        <span className="review-label">Name</span>
                                        <span className="review-value">{formData.first_name} {formData.middle_name} {formData.last_name}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">DOB</span>
                                        <span className="review-value">{formData.date_of_birth || '-'}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">Gender</span>
                                        <span className="review-value">{formData.gender === 'M' ? 'Male' : formData.gender === 'F' ? 'Female' : 'Other'}</span>
                                    </div>
                                </div>
                                <div className="review-section">
                                    <h4>👨‍👩‍👧 Family</h4>
                                    <div className="review-item">
                                        <span className="review-label">Father</span>
                                        <span className="review-value">{formData.father_name || '-'}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">Mother</span>
                                        <span className="review-value">{formData.mother_name || '-'}</span>
                                    </div>
                                </div>
                                <div className="review-section">
                                    <h4>🎓 Academic</h4>
                                    <div className="review-item">
                                        <span className="review-label">Admission #</span>
                                        <span className="review-value">{formData.admission_number || '-'}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">Section</span>
                                        <span className="review-value">{sections.find(s => s.id.toString() === formData.section)?.name || '-'}</span>
                                    </div>
                                </div>
                                <div className="review-section">
                                    <h4>📄 Documents</h4>
                                    <div className="review-item">
                                        <span className="review-label">Aadhar</span>
                                        <span className="review-value">{formData.aadhar_number || '-'}</span>
                                    </div>
                                    <div className="review-item">
                                        <span className="review-label">PEN</span>
                                        <span className="review-value">{formData.pen_number || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="form-navigation">
                        <div>
                            {currentStep > 0 && (
                                <button type="button" className="nav-btn nav-btn-secondary" onClick={prevStep}>
                                    ← Previous
                                </button>
                            )}
                        </div>
                        <div>
                            {currentStep < STEPS.length - 1 ? (
                                <button type="button" className="nav-btn nav-btn-primary" onClick={nextStep}>
                                    Next →
                                </button>
                            ) : (
                                <button type="submit" className="nav-btn nav-btn-success" disabled={loading}>
                                    {loading ? '⏳ Submitting...' : '✓ Complete Admission'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Credentials Modal */}
            {showCredentialsModal && parentCredentials && (
                <div className="modal-overlay" onClick={() => { setShowCredentialsModal(false); navigate('/students'); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>✅ Admission Successful!</h2>
                            <button className="modal-close" onClick={() => { setShowCredentialsModal(false); navigate('/students'); }}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                {parentCredentials.studentName} ({parentCredentials.admissionNumber})
                            </p>

                            {parentCredentials.father?.created && (
                                <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                                    <strong>👨 Father's Login</strong>
                                    <div className="credential-row" style={{ marginTop: '0.5rem' }}>
                                        <span>Username:</span>
                                        <span style={{ fontFamily: 'monospace', color: '#1976d2' }}>{parentCredentials.father.username}</span>
                                    </div>
                                    <div className="credential-row">
                                        <span>Password:</span>
                                        <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>{parentCredentials.father.password}</span>
                                    </div>
                                </div>
                            )}

                            {parentCredentials.mother?.created && (
                                <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                                    <strong>👩 Mother's Login</strong>
                                    <div className="credential-row" style={{ marginTop: '0.5rem' }}>
                                        <span>Username:</span>
                                        <span style={{ fontFamily: 'monospace', color: '#1976d2' }}>{parentCredentials.mother.username}</span>
                                    </div>
                                    <div className="credential-row">
                                        <span>Password:</span>
                                        <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>{parentCredentials.mother.password}</span>
                                    </div>
                                </div>
                            )}

                            <div className="alert-card alert-card-warning" style={{ marginTop: '1rem' }}>
                                <span className="alert-icon">⚠️</span>
                                <div className="alert-content">
                                    <div className="alert-text">Please save these credentials. Passwords cannot be recovered once this dialog is closed.</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    let text = `Parent Login Credentials for ${parentCredentials.studentName}\n`;
                                    if (parentCredentials.father?.created) {
                                        text += `Father - Username: ${parentCredentials.father.username}, Password: ${parentCredentials.father.password}\n`;
                                    }
                                    if (parentCredentials.mother?.created) {
                                        text += `Mother - Username: ${parentCredentials.mother.username}, Password: ${parentCredentials.mother.password}\n`;
                                    }
                                    navigator.clipboard.writeText(text);
                                    success('Credentials copied!');
                                }}
                            >
                                📋 Copy All
                            </Button>
                            <Button variant="primary" onClick={() => { setShowCredentialsModal(false); navigate('/students'); }}>
                                ✓ Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddStudent;
