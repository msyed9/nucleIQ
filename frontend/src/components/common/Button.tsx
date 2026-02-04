import React from 'react';
import './Button.css';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    title?: string;
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    className = '',
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
        >
            {loading && <span className="btn-spinner"></span>}
            {children}
        </button>
    );
};

export default Button;
