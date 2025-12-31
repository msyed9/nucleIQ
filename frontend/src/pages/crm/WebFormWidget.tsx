/**
 * Web Form Widget - Public admission enquiry form
 */

import React, { useState } from 'react';
import axios from 'axios';
import './WebFormWidget.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const WebFormWidget: React.FC = () => {
    const [formData, setFormData] = useState({
        student_name: '',
        date_of_birth: '',
        gender: '',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        remarks: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/crm/public/lead/`,
                formData
            );

            setSubmitted(true);
            setFormData({
                student_name: '',
                date_of_birth: '',
                gender: '',
                parent_name: '',
                parent_email: '',
                parent_phone: '',
                address: '',
                city: '',
                state: '',
                postal_code: '',
                remarks: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error submitting form. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="web-form-widget">
                <div className="success-message">
                    <div className="success-icon">✅</div>
                    <h2>Thank You!</h2>
                    <p>Your enquiry has been submitted successfully.</p>
                    <p>Our admissions team will contact you shortly.</p>
                    <button onClick={() => setSubmitted(false)} className="btn-submit-another">
                        Submit Another Enquiry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="web-form-widget">
            <div className="form-header">
                <h2>🎓 Admission Enquiry Form</h2>
                <p>Fill in the details below and we'll get back to you soon!</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h3>Student Information</h3>

                    <div className="form-group">
                        <label>Student Name *</label>
                        <input
                            type="text"
                            value={formData.student_name}
                            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date of Birth *</label>
                            <input
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender *</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                required
                            >
                                <option value="">Select</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Parent/Guardian Information</h3>

                    <div className="form-group">
                        <label>Parent/Guardian Name *</label>
                        <input
                            type="text"
                            value={formData.parent_name}
                            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                value={formData.parent_email}
                                onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone *</label>
                            <input
                                type="tel"
                                value={formData.parent_phone}
                                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Postal Code</label>
                            <input
                                type="text"
                                value={formData.postal_code}
                                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Additional Information</h3>

                    <div className="form-group">
                        <label>Remarks/Questions</label>
                        <textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            rows={4}
                            placeholder="Any specific questions or requirements..."
                        />
                    </div>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Enquiry'}
                </button>
            </form>
        </div>
    );
};

export default WebFormWidget;
