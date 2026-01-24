/**
 * ModuleGuard Component
 * Protects routes based on tenant's enabled modules.
 * Redirects to dashboard or shows "Module Not Licensed" if module is disabled.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';

interface ModuleGuardProps {
    moduleKey: string;
    children: React.ReactNode;
    fallbackPath?: string;
    showNotLicensed?: boolean;
}

/**
 * ModuleGuard - Route protection based on tenant's enabled modules
 * 
 * Usage:
 * <Route path="/fees/*" element={
 *   <ModuleGuard moduleKey="fees">
 *     <Layout><FeesRoutes /></Layout>
 *   </ModuleGuard>
 * } />
 */
const ModuleGuard: React.FC<ModuleGuardProps> = ({
    moduleKey,
    children,
    fallbackPath = '/dashboard',
    showNotLicensed = false
}) => {
    const { isModuleEnabled, loading } = useTenantBranding();
    const location = useLocation();

    // While loading, show nothing (or could show a loader)
    if (loading) {
        return (
            <div className="module-guard-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Check if module is enabled
    if (!isModuleEnabled(moduleKey)) {
        // Show not licensed page or redirect to dashboard
        if (showNotLicensed) {
            return <ModuleNotLicensedPage moduleKey={moduleKey} />;
        }

        // Redirect to fallback path (dashboard by default)
        return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    // Module is enabled, render children
    return <>{children}</>;
};

/**
 * Module Not Licensed Page
 * Displayed when user tries to access a module that is not enabled for their tenant
 */
const ModuleNotLicensedPage: React.FC<{ moduleKey: string }> = ({ moduleKey }) => {
    const moduleLabels: Record<string, string> = {
        dashboard: 'Dashboard',
        settings: 'Settings',
        users: 'User Management',
        students: 'Students',
        staff: 'Staff Management',
        attendance: 'Attendance',
        fees: 'Fee Collection',
        finance: 'Finance & Accounting',
        academics: 'Academics & LMS',
        exams: 'Examinations',
        timetable: 'Timetable',
        calendar: 'Calendar & Events',
        communication: 'Communication',
        notifications: 'Notifications',
        reports: 'Reports & Analytics',
        idcards: 'ID Cards',
        library: 'Library',
        inventory: 'Inventory',
        transport: 'Transport',
        hostel: 'Hostel',
        hr: 'HR & Payroll',
        crm: 'CRM & Leads',
        alumni: 'Alumni Management',
        placement: 'Placement',
        cms: 'Website Builder',
        security: 'Security & Visitors',
        helpdesk: 'Helpdesk',
        wellbeing: 'Wellbeing & Trackers',
        admin: 'Admin Tools',
    };

    const moduleName = moduleLabels[moduleKey] || moduleKey;

    return (
        <div className="module-not-licensed">
            <div className="not-licensed-content">
                <div className="not-licensed-icon">
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                </div>
                <h1 className="not-licensed-title">Module Not Available</h1>
                <p className="not-licensed-message">
                    The <strong>{moduleName}</strong> module is not included in your current plan.
                </p>
                <p className="not-licensed-help">
                    Please contact your administrator to enable this feature or upgrade your subscription.
                </p>
                <a href="/dashboard" className="not-licensed-button">
                    Return to Dashboard
                </a>
            </div>

            <style>{`
                .module-not-licensed {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #1a1b2e 0%, #0f0f1a 100%);
                    padding: 20px;
                }

                .not-licensed-content {
                    text-align: center;
                    max-width: 480px;
                    padding: 48px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .not-licensed-icon {
                    color: #f59e0b;
                    margin-bottom: 24px;
                }

                .not-licensed-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 16px 0;
                }

                .not-licensed-message {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0 0 12px 0;
                    line-height: 1.6;
                }

                .not-licensed-message strong {
                    color: #fff;
                }

                .not-licensed-help {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0 0 32px 0;
                }

                .not-licensed-button {
                    display: inline-block;
                    padding: 14px 32px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: #fff;
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }

                .not-licensed-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
                }

                .module-guard-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #4f46e5;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ModuleGuard;

// Export a utility hook for programmatic checks
export const useModuleAccess = () => {
    const { isModuleEnabled, enabledModules, loading } = useTenantBranding();

    return {
        isModuleEnabled,
        enabledModules,
        loading,
        // Check multiple modules - returns true if ANY of them are enabled
        isAnyModuleEnabled: (modules: string[]) => modules.some(m => isModuleEnabled(m)),
        // Check multiple modules - returns true if ALL of them are enabled
        areAllModulesEnabled: (modules: string[]) => modules.every(m => isModuleEnabled(m)),
    };
};
