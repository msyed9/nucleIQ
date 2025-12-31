/**
 * Digital LMS Resources Component
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../library/Library.css'; // Reusing styles

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DigitalResources: React.FC = () => {
    const [resources, setResources] = useState<any[]>([]);

    useEffect(() => {
        const fetchResources = async () => {
            const token = localStorage.getItem('access_token');
            const tenantId = localStorage.getItem('tenant_id');
            try {
                const res = await axios.get(`${API_BASE_URL}/library/digital/`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId || '' }
                });
                setResources(res.data.results || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchResources();
    }, []);

    const handleDownload = async (id: string, url: string | null, file: string | null) => {
        try {
            // Track download
            const token = localStorage.getItem('access_token');
            const tenantId = localStorage.getItem('tenant_id');
            await axios.post(`${API_BASE_URL}/library/digital/${id}/download/`, {}, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenantId || '' }
            });

            // Open link
            if (file) window.open(file, '_blank');
            else if (url) window.open(url, '_blank');

        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="library-container">
            <h1>💻 Digital Learning Resources (LMS)</h1>
            <div className="resource-list">
                {resources.map(res => (
                    <div className="resource-item" key={res.id}>
                        <div className={`res-icon type-${res.resource_type}`}>
                            {res.resource_type === 'PDF' && '📄'}
                            {res.resource_type === 'VIDEO' && '▶️'}
                            {res.resource_type === 'AUDIO' && '🎵'}
                            {res.resource_type === 'LINK' && '🔗'}
                        </div>
                        <div className="res-details">
                            <h3>{res.title}</h3>
                            <p>{res.description}</p>
                        </div>
                        <button onClick={() => handleDownload(res.id, res.external_url, res.file)}>
                            Access Content
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DigitalResources;
