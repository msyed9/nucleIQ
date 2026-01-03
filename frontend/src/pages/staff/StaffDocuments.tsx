import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import DocumentUpload from '../../components/staff/DocumentUpload';
import DocumentList from '../../components/staff/DocumentList';
import DocumentVerify from '../../components/staff/DocumentVerify';

const StaffDocuments: React.FC = () => {
    const { t } = useTranslation();
    const [selectedStaff] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [showVerify, setShowVerify] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null);
    const [expiringDocs, setExpiringDocs] = useState<any[]>([]);

    useEffect(() => {
        fetchExpiringDocuments();
    }, []);

    useEffect(() => {
        if (selectedStaff) {
            fetchDocuments();
        }
    }, [selectedStaff]);

    const fetchDocuments = async () => {
        if (!selectedStaff) return;
        setLoading(true);
        try {
            const response = await api.get(`/staff/documents/?staff=${selectedStaff.id}`);
            setDocuments(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExpiringDocuments = async () => {
        try {
            const response = await api.get('/staff/documents/expiring_soon/');
            setExpiringDocs(response.data || []);
        } catch (error) {
            console.error('Error fetching expiring documents:', error);
        }
    };

    const handleVerify = (doc: any) => {
        setSelectedDoc(doc);
        setShowVerify(true);
    };

    const handleVerifyComplete = () => {
        setShowVerify(false);
        fetchDocuments();
        fetchExpiringDocuments();
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{t('staff.documents', 'Staff Documents')}</h1>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {t('staff.upload_document', 'Upload Document')}
                    </button>
                </div>

                {expiringDocs.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    {expiringDocs.length} {t('staff.documents_expiring', 'documents expiring soon')}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                <DocumentList
                    documents={documents}
                    loading={loading}
                    onVerify={handleVerify}
                    onRefresh={fetchDocuments}
                />
            </div>

            {showUpload && (
                <DocumentUpload
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => {
                        setShowUpload(false);
                        fetchDocuments();
                    }}
                />
            )}

            {showVerify && selectedDoc && (
                <DocumentVerify
                    document={selectedDoc}
                    onClose={() => setShowVerify(false)}
                    onSuccess={handleVerifyComplete}
                />
            )}
        </div>
    );
};

export default StaffDocuments;
