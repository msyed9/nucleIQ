import React, { useState } from 'react';
import api from '../../services/api';

const BiometricImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/staff/attendance/import_biometric/', formData);
        } catch (error) {
            console.error('Error importing biometric data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4" />
            <button onClick={handleImport} disabled={!file || loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
                {loading ? 'Importing...' : 'Import Biometric Data'}
            </button>
        </div>
    );
};

export default BiometricImport;
