import React from 'react';

const HealthRecords = () => {
    return (
        <div className="health-records-container">
            <header className="page-header">
                <h1>Health Records</h1>
                <p className="subtitle">Maintain staff health and medical records</p>
            </header>
            <div className="content-card">
                <div className="empty-state">
                    <h3>Medical Records</h3>
                    <p>No health records found.</p>
                </div>
            </div>
        </div>
    );
};

export default HealthRecords;
