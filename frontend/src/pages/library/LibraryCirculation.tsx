import React from 'react';
import { Card } from '@/design-system';

const LibraryCirculation: React.FC = () => {
    return (
        <div style={{ padding: '20px' }}>
            <Card>
                <div style={{ padding: '20px' }}>
                    <h2>Library Circulation</h2>
                    <p>Manage book issues, returns, and renewals.</p>
                </div>
            </Card>
        </div>
    );
};

export default LibraryCirculation;
