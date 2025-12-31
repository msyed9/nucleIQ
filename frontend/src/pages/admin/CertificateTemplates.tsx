import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CertificateTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/certificates/templates/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTemplates(res.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">📜 Certificate Templates</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map(t => (
                    <div key={t.id} className="bg-white p-6 rounded shadow border border-gray-200">
                        <h3 className="font-bold text-lg">{t.name}</h3>
                        <div className="mt-4 p-4 bg-gray-50 text-xs text-gray-600 rounded font-mono h-32 overflow-hidden">
                            {t.content}
                        </div>
                        <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded">
                            Edit Template
                        </button>
                    </div>
                ))}
            </div>
            {templates.length === 0 && <p>No templates found.</p>}
        </div>
    );
};

export default CertificateTemplates;
