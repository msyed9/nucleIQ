import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const DocumentUpload: React.FC<Props> = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        staff_id: '',
        category: 'PERSONAL',
        document_type: 'OTHER',
        title: '',
        description: '',
        document_number: '',
        issue_date: '',
        expiry_date: '',
        issuing_authority: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff/staff/');
            setStaff(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) data.append(key, value);
        });
        data.append('file', file);

        setLoading(true);
        try {
            await api.post('/staff/documents/', data);
            onSuccess();
        } catch (error) {
            console.error('Error uploading document:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">{t('staff.upload_document', 'Upload Document')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Staff Member *</label>
                        <select
                            value={formData.staff_id}
                            onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        >
                            <option value="">Select Staff</option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>{s.full_name} - {s.employee_id}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="PERSONAL">Personal Documents</option>
                                <option value="ACADEMIC">Academic Certificates</option>
                                <option value="EXPERIENCE">Experience Certificates</option>
                                <option value="ID_PROOFS">ID Proofs</option>
                                <option value="APPOINTMENT">Appointment Letter</option>
                                <option value="CONTRACTS">Agreements/Contracts</option>
                                <option value="APPRAISAL">Appraisal Documents</option>
                                <option value="TRAINING">Training Certificates</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Document Type *</label>
                            <select
                                value={formData.document_type}
                                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="RESUME">Resume/CV</option>
                                <option value="CONTRACT">Employment Contract</option>
                                <option value="CERTIFICATE">Educational Certificate</option>
                                <option value="EXPERIENCE">Experience Letter</option>
                                <option value="ID_PROOF">ID Proof</option>
                                <option value="ADDRESS_PROOF">Address Proof</option>
                                <option value="PHOTO">Photograph</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Document Number</label>
                            <input
                                type="text"
                                value={formData.document_number}
                                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Issuing Authority</label>
                            <input
                                type="text"
                                value={formData.issuing_authority}
                                onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Issue Date</label>
                            <input
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Expiry Date</label>
                            <input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">File *</label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border rounded"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentUpload;
