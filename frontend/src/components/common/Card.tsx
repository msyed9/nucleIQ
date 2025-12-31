import React from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    title,
    subtitle,
    className = '',
    onClick,
    hoverable = false,
}) => {
    return (
        <div
            className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`}
            onClick={onClick}
        >
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="card-body">{children}</div>
        </div>
    );
};

export default Card;
