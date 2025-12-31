import React from 'react';
import './Loading.css';

interface LoadingProps {
    size?: 'small' | 'medium' | 'large';
    fullScreen?: boolean;
    text?: string;
}

const Loading: React.FC<LoadingProps> = ({
    size = 'medium',
    fullScreen = false,
    text,
}) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <div className={`loading-spinner loading-${size}`}></div>
                {text && <p className="loading-text">{text}</p>}
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className={`loading-spinner loading-${size}`}></div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default Loading;
