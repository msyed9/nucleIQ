import React from 'react';

const TrainingManagement = () => {
    return (
        <div className="training-management-container">
            <header className="page-header">
                <h1>Training Management</h1>
                <p className="subtitle">Manage staff training programs and records</p>
            </header>
            <div className="content-card">
                <div className="empty-state">
                    <h3>Training Programs</h3>
                    <p>No training programs scheduled.</p>
                </div>
            </div>
        </div>
    );
};

export default TrainingManagement;
