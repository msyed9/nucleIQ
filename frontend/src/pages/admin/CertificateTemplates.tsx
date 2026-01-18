import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, FileText, Award } from 'lucide-react';
import './CertificateTemplates.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface CertificateTemplate {
    id?: number;
    name: string;
    certificate_type: string;
    content: string;
    header_text?: string;
    footer_text?: string;
    is_active: boolean;
}

const CertificateTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
    const [formData, setFormData] = useState<CertificateTemplate>({
        name: '',
        certificate_type: 'BONAFIDE',
        content: '',
        header_text: '',
        footer_text: '',
        is_active: true
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/certificates/templates/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });
            setTemplates(res.data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate?.id) {
                // Update existing template
                await axios.put(
                    `${API_BASE_URL}/certificates/templates/${editingTemplate.id}/`,
                    formData,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
                );
            } else {
                // Create new template
                await axios.post(
                    `${API_BASE_URL}/certificates/templates/`,
                    formData,
                    { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
                );
            }
            fetchTemplates();
            closeModal();
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Failed to save template');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await axios.delete(`${API_BASE_URL}/certificates/templates/${id}/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });
            fetchTemplates();
        } catch (err) {
            console.error('Error deleting template:', err);
            alert('Failed to delete template');
        }
    };

    const openModal = (template?: CertificateTemplate) => {
        if (template) {
            setEditingTemplate(template);
            setFormData(template);
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                certificate_type: 'BONAFIDE',
                content: '',
                header_text: '',
                footer_text: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTemplate(null);
    };

    const insertPlaceholder = (placeholder: string) => {
        const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = formData.content;
            const newText = text.substring(0, start) + placeholder + text.substring(end);
            setFormData({ ...formData, content: newText });

            // Set cursor position after inserted text
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
            }, 0);
        }
    };

    const placeholders = [
        '{StudentName}',
        '{FatherName}',
        '{MotherName}',
        '{Class}',
        '{Section}',
        '{AdmissionNumber}',
        '{DateOfBirth}',
        '{AdmissionDate}',
        '{CurrentDate}',
        '{AcademicYear}'
    ];

    if (loading) {
        return <div className="certificate-loading">Loading templates...</div>;
    }

    return (
        <div className="certificate-templates-container">
            <div className="certificate-header">
                <div className="header-left">
                    <Award size={32} className="header-icon" />
                    <div>
                        <h1>Certificate Templates</h1>
                        <p>Create and manage certificate templates for your institution</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => openModal()}>
                    <Plus size={20} />
                    Create Template
                </button>
            </div>

            <div className="templates-grid">
                {templates.map(template => (
                    <div key={template.id} className="template-card">
                        <div className="template-card-header">
                            <div className="template-icon">
                                <FileText size={24} />
                            </div>
                            <div className="template-info">
                                <h3>{template.name}</h3>
                                <span className={`badge ${template.is_active ? 'badge-success' : 'badge-inactive'}`}>
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className="template-type">
                            <span className="type-label">Type:</span>
                            <span className="type-value">{template.certificate_type}</span>
                        </div>

                        <div className="template-content-preview">
                            {template.content.substring(0, 150)}...
                        </div>

                        <div className="template-actions">
                            <button
                                className="btn-icon btn-edit"
                                onClick={() => openModal(template)}
                                title="Edit Template"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                className="btn-icon btn-delete"
                                onClick={() => handleDelete(template.id!)}
                                title="Delete Template"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {templates.length === 0 && (
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>No Templates Found</h3>
                        <p>Create your first certificate template to get started</p>
                        <button className="btn-primary" onClick={() => openModal()}>
                            <Plus size={20} />
                            Create Template
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                            <button className="btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Template Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Bonafide Certificate"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Certificate Type *</label>
                                    <select
                                        value={formData.certificate_type}
                                        onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value })}
                                        required
                                    >
                                        <option value="BONAFIDE">Bonafide</option>
                                        <option value="TRANSFER">Transfer Certificate</option>
                                        <option value="CONDUCT">Conduct Certificate</option>
                                        <option value="COMPLETION">Course Completion</option>
                                        <option value="ACHIEVEMENT">Achievement</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Header Text</label>
                                    <input
                                        type="text"
                                        value={formData.header_text || ''}
                                        onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                                        placeholder="e.g., [School Name] - Certificate"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Certificate Content *</label>
                                    <div className="placeholder-buttons">
                                        {placeholders.map(ph => (
                                            <button
                                                key={ph}
                                                type="button"
                                                className="btn-placeholder"
                                                onClick={() => insertPlaceholder(ph)}
                                            >
                                                {ph}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        id="content-textarea"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Enter certificate content. Use placeholders like {StudentName}, {Class}, etc."
                                        rows={10}
                                        required
                                    />
                                    <small className="help-text">
                                        Click on placeholders above to insert them at cursor position
                                    </small>
                                </div>

                                <div className="form-group full-width">
                                    <label>Footer Text</label>
                                    <input
                                        type="text"
                                        value={formData.footer_text || ''}
                                        onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                                        placeholder="e.g., Principal's Signature"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        />
                                        <span>Active Template</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    <Save size={20} />
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateTemplates;
