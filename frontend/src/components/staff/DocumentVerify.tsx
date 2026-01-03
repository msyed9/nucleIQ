import React, { useState } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

interface Props {
    document: any;
    onClose: () => void;
    onSuccess: () => void;
}

const DocumentVerify: React.FC<Props> = ({ document, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            await api.post(`/staff/documents/${document.id}/verify/`, { notes });
            onSuccess();
        } catch (error) {
            console.error('Error verifying document:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Verify Document</h2>
                <div className="mb-4">
                    <p className="text-sm text-gray-600">Staff: {document.staff_name}</p>
                    <p className="text-sm text-gray-600">Document: {document.title}</p>
                    <p className="text-sm text-gray-600">Type: {document.document_type}</p>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Verification Notes</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        rows={4}
                        placeholder="Add any verification notes..."
                    />
                </div>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Verifying...' : 'Verify Document'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentVerify;
