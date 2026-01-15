/**
 * ThemedIcon Component
 * 
 * A wrapper component that applies the current icon theme styles to Lucide icons.
 * Use this to wrap icons that should respect the tenant's theme settings.
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import './ThemedIcon.css';

interface ThemedIconProps {
    icon: LucideIcon;
    size?: number;
    className?: string;
    variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'muted';
    withBackground?: boolean;
    animated?: boolean;
    onClick?: () => void;
}

const ThemedIcon: React.FC<ThemedIconProps> = ({
    icon: Icon,
    size = 24,
    className = '',
    variant = 'default',
    withBackground = false,
    animated = false,
    onClick
}) => {
    const variantClasses = {
        default: 'themed-icon--default',
        primary: 'themed-icon--primary',
        secondary: 'themed-icon--secondary',
        accent: 'themed-icon--accent',
        muted: 'themed-icon--muted'
    };

    return (
        <span
            className={`
                themed-icon 
                ${variantClasses[variant]} 
                ${withBackground ? 'themed-icon--with-bg' : ''} 
                ${animated ? 'themed-icon--animated' : ''}
                ${className}
            `.trim()}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'inherit' }}
        >
            <Icon size={size} />
        </span>
    );
};

export default ThemedIcon;
