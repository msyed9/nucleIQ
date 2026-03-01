import React, { useState } from 'react';
import api from '../../services/api';

interface AdmissionFormData {
    student_name: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    city: string;
    state: string;
    remarks: string;
}

const initialFormData: AdmissionFormData = {
    student_name: '',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    city: '',
    state: '',
    remarks: '',
};

const OnlineAdmissionForm: React.FC = () => {
    const [formData, setFormData] = useState<AdmissionFormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await api.post('/crm/public/lead/', {
                student_name: formData.student_name,
                parent_name: formData.parent_name,
                parent_email: formData.parent_email,
                parent_phone: formData.parent_phone,
                city: formData.city,
                state: formData.state,
                remarks: formData.remarks,
            });

            setSuccessMessage('Application submitted successfully. Our admissions team will contact you soon.');
            setFormData(initialFormData);
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            setErrorMessage(detail || 'Unable to submit application right now. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-secondary)',
            padding: '2rem 1rem',
            fontFamily: 'var(--font-family-primary, Inter, sans-serif)'
        }}>
            <div style={{
                maxWidth: '720px',
                margin: '0 auto',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <h1 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Online Admission Form
                </h1>
                <p style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Submit your enquiry and our admissions team will reach out within 24-48 hours.
                </p>

                {successMessage && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--success-color)',
                        border: '1px solid var(--border-color)'
                    }}>
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--error-color)',
                        border: '1px solid var(--border-color)'
                    }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Student Name *</span>
                        <input
                            name="student_name"
                            value={formData.student_name}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Parent/Guardian Name *</span>
                        <input
                            name="parent_name"
                            value={formData.parent_name}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Parent Email *</span>
                        <input
                            type="email"
                            name="parent_email"
                            value={formData.parent_email}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                    </label>

                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Parent Phone *</span>
                        <input
                            name="parent_phone"
                            value={formData.parent_phone}
                            onChange={handleChange}
                            required
                            style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                    </label>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <label style={{ display: 'grid', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>City</span>
                            <input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            />
                        </label>

                        <label style={{ display: 'grid', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>State</span>
                            <input
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            />
                        </label>
                    </div>

                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Message</span>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            rows={4}
                            style={{ padding: '0.7rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary-color)',
                            color: 'var(--text-inverse)',
                            fontWeight: 700,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.7 : 1,
                        }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Admission Enquiry'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnlineAdmissionForm;