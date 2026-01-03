import React, { useState } from 'react';

const AppraisalManagement = () => {
    return (
        <div className="appraisal-management-container">
            <header className="page-header">
                <h1>Appraisal Management</h1>
                <p className="subtitle">Manage and review staff performance appraisals</p>
            </header>

            <div className="content-card">
                <div className="empty-state">
                    <h3>Appraisal System</h3>
                    <p>Select an appraisal cycle or create a new one to get started.</p>
                    {/* Placeholder for future implementation */}
                    <button className="btn-primary">Create New Appraisal Cycle</button>
                </div>
            </div>
        </div>
    );
};

export default AppraisalManagement;
