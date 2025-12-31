import React from 'react';

type WidgetLibraryProps = {
    onClose?: () => void;
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onClose }) => {
    return (
        <div style={{ padding: 8 }}>
            <div>Widget Library (stub)</div>
            {onClose && (
                <button onClick={onClose} style={{ marginTop: 8 }}>
                    Close
                </button>
            )}
        </div>
    );
};

export default WidgetLibrary;
