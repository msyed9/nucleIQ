import React from 'react';
import { Card } from '@/design-system';

const HostelComplaints: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <Card>
                <div style={{ padding: '20px' }}>
                    <h2>Hostel Complaints</h2>
                    <p>Track and resolve student complaints regarding hostel facilities.</p>
                </div>
            </Card>
        </div>
    );
};

export default HostelComplaints;
