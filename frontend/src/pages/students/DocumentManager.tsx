import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import '../../components/common/Modal.css';
import './Students.css';

interface Document {
    id: number;
    student: number;
    student_name?: string;
    document_type: string;
    title: string;
    description: string;
    file: string;
    uploaded_by_name: string;
    is_verified: boolean;
    verified_by_name?: string;
    verified_at?: string;
    created_at: string;
}

interface Student {
    id: number;
    admission_number: string;
    full_name: string;
}

const DocumentManager: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Filters
    const [filterStudent, setFilterStudent] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterVerified, setFilterVerified] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [formData, setFormData] = useState({
        student: '',
        document_type: 'OTHER',
        title: '',
        description: '',
        file: null as File | null
    });

    const documentTypes = [
        { value: 'BIRTH_CERTIFICATE', label: '📄 Birth Certificate' },
        { value: 'TRANSFER_CERTIFICATE', label: '📋 Transfer Certificate' },
        { value: 'REPORT_CARD', label: '📊 Report Card' },
        { value: 'MEDICAL', label: '🏥 Medical Document' },
        { value: 'ID_PROOF', label: '🪪 ID Proof' },
        { value: 'PHOTO', label: '📷 Photograph' },
        { value: 'OTHER', label: '📎 Other' }
    ];

    useEffect(() => {
        fetchDocuments();
        fetchStudents();
    }, [filterStudent, filterType, filterVerified]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterStudent) params.append('student', filterStudent);
            if (filterType) params.append('document_type', filterType);
            if (filterVerified === 'verified') params.append('is_verified', 'true');
            if (filterVerified === 'unverified') params.append('is_verified', 'false');

            const response = await api.get(`/students/documents/?${params}`);
            setDocuments(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            setStudents(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.file) {
            alert(t('documents.file_required', { defaultValue: 'Please select a file to upload' }));
            return;
        }

        try {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('student', formData.student);
            uploadData.append('document_type', formData.document_type);
            uploadData.append('title', formData.title);
            uploadData.append('description', formData.description);
            uploadData.append('file', formData.file);

            await api.post('/students/documents/', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert(t('documents.uploaded', { defaultValue: 'Document uploaded successfully!' }));
            setShowModal(false);
            setFormData({
                student: '',
                document_type: 'OTHER',
                title: '',
                description: '',
                file: null
            });
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert(t('documents.upload_error', { defaultValue: 'Failed to upload document' }));
        } finally {
            setUploading(false);
        }
    };

    const handleVerify = async (documentId: number) => {
        if (!confirm(t('documents.confirm_verify', { defaultValue: 'Are you sure you want to verify this document?' }))) {
            return;
        }

        try {
            await api.post(`/students/documents/${documentId}/verify/`);
            alert(t('documents.verified', { defaultValue: 'Document verified successfully!' }));
            fetchDocuments();
        } catch (error) {
            console.error('Error verifying document:', error);
            alert(t('documents.verify_error', { defaultValue: 'Failed to verify document' }));
        }
    };

    const handleDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <div className="documents-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📁 {t('documents.title', { defaultValue: 'Student Documents' })}</h1>
                    <p className="page-subtitle">{t('documents.subtitle', { defaultValue: 'Manage student documents and verification' })}</p>
                </div>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    ⬆️ {t('documents.upload', { defaultValue: 'Upload Document' })}
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <div className="filters-row">
                    <input
                        type="text"
                        placeholder={t('documents.search', { defaultValue: 'Search documents...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('documents.all_students', { defaultValue: 'All Students' })}</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.admission_number} - {student.full_name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('documents.all_types', { defaultValue: 'All Types' })}</option>
                        {documentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterVerified}
                        onChange={(e) => setFilterVerified(e.target.value)}
                        className="filter-select"
                    >
                        <option value="">{t('documents.all_status', { defaultValue: 'All Status' })}</option>
                        <option value="verified">{t('documents.verified_only', { defaultValue: 'Verified Only' })}</option>
                        <option value="unverified">{t('documents.unverified_only', { defaultValue: 'Unverified Only' })}</option>
                    </select>
                </div>
            </Card>

            {/* Documents Grid */}
            <div className="documents-grid">
                {filteredDocuments.length === 0 ? (
                    <Card>
                        <div className="empty-state">
                            <p>📭 {t('documents.no_data', { defaultValue: 'No documents found' })}</p>
                        </div>
                    </Card>
                ) : (
                    filteredDocuments.map(doc => (
                        <Card key={doc.id}>
                            <div className="document-card">
                                <div className="document-header">
                                    <div className="document-type-icon">
                                        {documentTypes.find(t => t.value === doc.document_type)?.label.split(' ')[0] || '📎'}
                                    </div>
                                    <div className="document-info">
                                        <h4>{doc.title}</h4>
                                        <p className="document-student">
                                            <span
                                                className="student-link"
                                                onClick={() => navigate(`/students/${doc.student}`)}
                                            >
                                                👤 {doc.student_name || `Student #${doc.student}`}
                                            </span>
                                        </p>
                                    </div>
                                    {doc.is_verified && (
                                        <div className="verified-badge">
                                            ✅ {t('documents.verified', { defaultValue: 'Verified' })}
                                        </div>
                                    )}
                                </div>
                                <div className="document-body">
                                    <p className="document-type">{doc.document_type.replace('_', ' ')}</p>
                                    {doc.description && (
                                        <p className="document-description">{doc.description}</p>
                                    )}
                                    <div className="document-meta">
                                        <span>📤 {doc.uploaded_by_name}</span>
                                        <span>📅 {formatDate(doc.created_at)}</span>
                                    </div>
                                    {doc.is_verified && doc.verified_by_name && (
                                        <div className="verification-info">
                                            <span>✅ Verified by {doc.verified_by_name}</span>
                                            {doc.verified_at && <span> on {formatDate(doc.verified_at)}</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="document-actions">
                                    <Button
                                        size="small"
                                        variant="outline"
                                        onClick={() => handleDownload(doc.file, doc.title)}
                                    >
                                        ⬇️ {t('documents.download', { defaultValue: 'Download' })}
                                    </Button>
                                    {!doc.is_verified && (
                                        <Button
                                            size="small"
                                            variant="success"
                                            onClick={() => handleVerify(doc.id)}
                                        >
                                            ✅ {t('documents.verify', { defaultValue: 'Verify' })}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('documents.upload', { defaultValue: 'Upload Document' })}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('documents.student', { defaultValue: 'Student' })}</label>
                                    <select
                                        value={formData.student}
                                        onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('documents.select_student', { defaultValue: 'Select Student' })}</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.admission_number} - {student.full_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('documents.type', { defaultValue: 'Document Type' })}</label>
                                    <select
                                        value={formData.document_type}
                                        onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                                    >
                                        {documentTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('documents.title', { defaultValue: 'Title' })}</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder={t('documents.title_placeholder', { defaultValue: 'Document title' })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('documents.description', { defaultValue: 'Description' })}</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder={t('documents.description_placeholder', { defaultValue: 'Optional description...' })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('documents.file', { defaultValue: 'File' })}</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        required
                                    />
                                    <small>{t('documents.file_hint', { defaultValue: 'Accepted: PDF, JPG, PNG, DOC (Max 10MB)' })}</small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary" disabled={uploading}>
                                    {uploading ? t('documents.uploading', { defaultValue: 'Uploading...' }) : t('common.upload')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentManager;
