/**
 * ModuleStatusBadge Component
 * Displays visual indicators for module licensing status
 */

import React from 'react';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';

// Basic modules that are always included
const BASIC_MODULES = ['dashboard', 'settings', 'users', 'students'];

// Module metadata with labels and descriptions
export const MODULE_METADATA: Record<string, { label: string; description: string; icon: string }> = {
    dashboard: { label: 'Dashboard', description: 'Main overview and analytics', icon: '📊' },
    settings: { label: 'Settings', description: 'System configuration', icon: '⚙️' },
    users: { label: 'User Management', description: 'Manage system users', icon: '👥' },
    students: { label: 'Students', description: 'Student records and management', icon: '🎓' },
    staff: { label: 'Staff Management', description: 'Staff records and HR', icon: '👔' },
    attendance: { label: 'Attendance', description: 'Attendance tracking', icon: '✅' },
    fees: { label: 'Fee Collection', description: 'Fee management and payments', icon: '💰' },
    finance: { label: 'Finance & Accounting', description: 'Financial management', icon: '📈' },
    academics: { label: 'Academics & LMS', description: 'Learning management', icon: '📚' },
    exams: { label: 'Examinations', description: 'Exam management', icon: '📝' },
    timetable: { label: 'Timetable', description: 'Schedule management', icon: '📅' },
    calendar: { label: 'Calendar & Events', description: 'Events and holidays', icon: '🗓️' },
    communication: { label: 'Communication', description: 'Notices and messages', icon: '💬' },
    notifications: { label: 'Notifications', description: 'SMS and email', icon: '🔔' },
    reports: { label: 'Reports & Analytics', description: 'Advanced reporting', icon: '📊' },
    idcards: { label: 'ID Cards', description: 'ID card generation', icon: '🪪' },
    library: { label: 'Library', description: 'Library management', icon: '📖' },
    inventory: { label: 'Inventory', description: 'Stock management', icon: '📦' },
    transport: { label: 'Transport', description: 'Fleet management', icon: '🚌' },
    hostel: { label: 'Hostel', description: 'Hostel management', icon: '🏠' },
    hr: { label: 'HR & Payroll', description: 'Payroll and HR', icon: '💼' },
    crm: { label: 'CRM & Leads', description: 'Lead management', icon: '🎯' },
    alumni: { label: 'Alumni Management', description: 'Alumni network', icon: '🎓' },
    placement: { label: 'Placement', description: 'Campus placements', icon: '🏢' },
    cms: { label: 'Website Builder', description: 'School website', icon: '🌐' },
    security: { label: 'Security & Visitors', description: 'Visitor management', icon: '🛡️' },
    helpdesk: { label: 'Helpdesk', description: 'Support tickets', icon: '🎫' },
    wellbeing: { label: 'Wellbeing & Trackers', description: 'Habit tracking', icon: '❤️' },
    admin: { label: 'Admin Tools', description: 'Advanced admin features', icon: '🔧' },
};

interface ModuleStatusBadgeProps {
    moduleKey: string;
    showDescription?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge showing module status (Core/Enabled/Disabled)
 */
export const ModuleStatusBadge: React.FC<ModuleStatusBadgeProps> = ({
    moduleKey,
    showDescription = false,
    size = 'md'
}) => {
    const { isModuleEnabled } = useTenantBranding();
    const isBasic = BASIC_MODULES.includes(moduleKey);
    const isEnabled = isModuleEnabled(moduleKey);
    const metadata = MODULE_METADATA[moduleKey];

    const sizeClasses = {
        sm: 'module-badge-sm',
        md: 'module-badge-md',
        lg: 'module-badge-lg',
    };

    return (
        <div className={`module-status-badge ${sizeClasses[size]}`}>
            <span className="module-badge-icon">{metadata?.icon || '📌'}</span>
            <div className="module-badge-content">
                <span className="module-badge-label">
                    {metadata?.label || moduleKey}
                </span>
                {showDescription && metadata?.description && (
                    <span className="module-badge-description">{metadata.description}</span>
                )}
            </div>
            {isBasic ? (
                <span className="module-badge-tag core">Core</span>
            ) : isEnabled ? (
                <span className="module-badge-tag enabled">Enabled</span>
            ) : (
                <span className="module-badge-tag disabled">Not Licensed</span>
            )}

            <style>{`
                .module-status-badge {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .module-badge-sm {
                    padding: 6px 10px;
                    gap: 8px;
                }

                .module-badge-lg {
                    padding: 16px 20px;
                    gap: 16px;
                }

                .module-badge-icon {
                    font-size: 24px;
                }

                .module-badge-sm .module-badge-icon {
                    font-size: 16px;
                }

                .module-badge-lg .module-badge-icon {
                    font-size: 32px;
                }

                .module-badge-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .module-badge-label {
                    font-weight: 600;
                    color: #fff;
                }

                .module-badge-sm .module-badge-label {
                    font-size: 13px;
                }

                .module-badge-description {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .module-badge-tag {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .module-badge-tag.core {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }

                .module-badge-tag.enabled {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }

                .module-badge-tag.disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
};

/**
 * Grid showing all modules with their status
 */
export const ModuleStatusGrid: React.FC = () => {
    const { enabledModules } = useTenantBranding();

    const allModules = Object.keys(MODULE_METADATA);

    return (
        <div className="module-status-grid">
            <div className="module-grid-header">
                <h3>Module Access</h3>
                <p>Your current plan includes {enabledModules.length} modules</p>
            </div>
            <div className="module-grid">
                {allModules.map(moduleKey => (
                    <ModuleStatusBadge
                        key={moduleKey}
                        moduleKey={moduleKey}
                        showDescription
                    />
                ))}
            </div>

            <style>{`
                .module-status-grid {
                    padding: 24px;
                }

                .module-grid-header {
                    margin-bottom: 24px;
                }

                .module-grid-header h3 {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 4px 0;
                }

                .module-grid-header p {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                }

                .module-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 12px;
                }
            `}</style>
        </div>
    );
};

export default ModuleStatusBadge;
