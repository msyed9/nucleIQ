import React from 'react';

const MyAppraisal = () => {
    return (
        <div className="my-appraisal-container">
            <header className="page-header">
                <h1>My Appraisals</h1>
                <p className="subtitle">View your performance reviews and self-assessments</p>
            </header>

            <div className="content-card">
                <div className="empty-state">
                    <h3>No Active Appraisals</h3>
                    <p>You do not have any pending appraisals at this time.</p>
                </div>
            </div>
        </div>
    );
};

export default MyAppraisal;
