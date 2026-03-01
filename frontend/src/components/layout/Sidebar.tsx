/**
 * Sidebar Navigation - With Dynamic Icon Sets
 * Modern sidebar with selectable icon libraries
 */

import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
import { useIconSet } from '../../contexts/IconSetContext';
import { useAuth } from '../../contexts/AuthContext';
import { IconKey } from '../../config/iconSets';
import './Layout.css';

interface SubMenuItem {
    path: string;
    iconKey: IconKey;
    labelKey: string;
    label?: string;
    moduleKey?: string; // Maps to tenant enabled_modules
}

interface MenuItem {
    path?: string;
    iconKey: IconKey;
    labelKey: string;
    label?: string;
    children?: SubMenuItem[];
    moduleKey?: string; // Maps to tenant enabled_modules
}

const menuItems: MenuItem[] = [
    { path: '/dashboard', iconKey: 'dashboard', labelKey: 'nav.dashboard', label: 'Dashboard', moduleKey: 'dashboard' },
    {
        iconKey: 'users',
        labelKey: 'nav.students',
        label: 'Students',
        moduleKey: 'students',
        children: [
            { path: '/students', iconKey: 'list', labelKey: 'nav.student_list', label: 'Student List' },
            { path: '/students/enrollments', iconKey: 'clipboardCheck', labelKey: 'nav.enrollments', label: 'Enrollments' },
            { path: '/students/add', iconKey: 'userPlus', labelKey: 'nav.add_student', label: 'Add Student' },
            { path: '/students/remarks', iconKey: 'messageCircle', labelKey: 'nav.remarks', label: 'Remarks' },
            { path: '/students/documents', iconKey: 'folderOpen', labelKey: 'nav.documents', label: 'Documents' },
            { path: '/students/promotions', iconKey: 'trendingUp', labelKey: 'nav.promotions', label: 'Promotions' },
            { path: '/students/analytics', iconKey: 'barChart', labelKey: 'nav.student_analytics', label: 'Analytics' },
        ]
    },
    {
        iconKey: 'userCheck',
        labelKey: 'nav.staff',
        label: 'Staff',
        moduleKey: 'staff',
        children: [
            { path: '/staff/my-qr', iconKey: 'qrCode', labelKey: 'nav.my_attendance_qr', label: 'My Attendance QR' },
            { path: '/staff', iconKey: 'list', labelKey: 'nav.staff_list', label: 'Staff List' },
            { path: '/staff/add', iconKey: 'userPlus', labelKey: 'nav.add_staff', label: 'Add Staff' },
            { path: '/staff/documents', iconKey: 'folderOpen', labelKey: 'nav.staff_documents', label: 'Documents' },
            { path: '/staff/attendance', iconKey: 'clipboardCheck', labelKey: 'nav.staff_attendance', label: 'Attendance' },
            { path: '/staff/qr-scanner', iconKey: 'qrCode', labelKey: 'nav.staff_qr_scanner', label: 'QR Scanner' },
            { path: '/staff/leave', iconKey: 'leaf', labelKey: 'nav.leave_management', label: 'Leave Management' },
            { path: '/staff/health', iconKey: 'award', labelKey: 'nav.health_records', label: 'Health Records' },
            { path: '/staff/training', iconKey: 'bookOpen', labelKey: 'nav.training', label: 'Training' },
            { path: '/staff/appraisal', iconKey: 'barChart', labelKey: 'nav.appraisal', label: 'Appraisal' },
        ]
    },
    {
        iconKey: 'graduationCap',
        labelKey: 'nav.academics',
        label: 'Academics',
        moduleKey: 'academics',
        children: [
            { path: '/timetable/builder', iconKey: 'calendarDays', labelKey: 'nav.timetable', label: 'Timetable', moduleKey: 'timetable' },
            { path: '/timetable/config', iconKey: 'settings', labelKey: 'nav.timetable_config', label: 'Timetable Config', moduleKey: 'timetable' },
            { path: '/subjects', iconKey: 'bookOpen', labelKey: 'nav.subjects', label: 'Subjects' },
            { path: '/syllabus', iconKey: 'list', labelKey: 'nav.syllabus', label: 'Syllabus Progress' },
            { path: '/homework', iconKey: 'penTool', labelKey: 'nav.homework', label: 'Homework' },
            { path: '/assignments', iconKey: 'clipboardCheck', labelKey: 'nav.assignments', label: 'Assignments' },
            { path: '/assignments/submit', iconKey: 'fileCheck', labelKey: 'nav.submit_assignment', label: 'Submit Assignment' },
            { path: '/assignments/grade', iconKey: 'clipboardCheck', labelKey: 'nav.grade_assignment', label: 'Grade Assignments' },
            { path: '/grades', iconKey: 'award', labelKey: 'nav.grades', label: 'Grades & Report Card' },
            { path: '/exams', iconKey: 'fileText', labelKey: 'nav.exams', label: 'Exams', moduleKey: 'exams' },
            { path: '/exams/question-bank', iconKey: 'bookOpen', labelKey: 'nav.question_bank', label: 'Question Bank', moduleKey: 'exams' },
            { path: '/exams/learning-outcomes', iconKey: 'award', labelKey: 'nav.learning_outcomes', label: 'Learning Outcomes', moduleKey: 'exams' },
            { path: '/exams/online', iconKey: 'video', labelKey: 'nav.online_examination', label: 'Online Examination', moduleKey: 'exams' },
            { path: '/exams/results/entry', iconKey: 'clipboardCheck', labelKey: 'nav.result_entry', label: 'Result Entry', moduleKey: 'exams' },
            { path: '/exams/results/analytics', iconKey: 'barChart', labelKey: 'nav.result_analytics', label: 'Result Analytics', moduleKey: 'exams' },
            { path: '/lms/classes', iconKey: 'video', labelKey: 'nav.live_classes', label: 'Live Classes' },
            { path: '/lms/digital', iconKey: 'library', labelKey: 'nav.digital_lms', label: 'Digital Library' },
            { path: '/lms/courses', iconKey: 'bookOpen', labelKey: 'nav.courses', label: 'Course Catalog' },
            { path: '/lms/my-courses', iconKey: 'graduationCap', labelKey: 'nav.my_learning', label: 'My Learning' },
            { path: '/lms/progress', iconKey: 'trendingUp', labelKey: 'nav.progress', label: 'My Progress' },
            { path: '/lms/enrollments', iconKey: 'users', labelKey: 'nav.enrollments', label: 'Enrollments' },
            { path: '/lms/quiz-builder', iconKey: 'clipboardCheck', labelKey: 'nav.quiz_builder', label: 'Quiz Builder' },
            { path: '/lms/discussions', iconKey: 'messageSquare', labelKey: 'nav.discussions', label: 'Discussions' },
            { path: '/lms/videos', iconKey: 'video', labelKey: 'nav.videos', label: 'Video Library' },
            { path: '/lms/certificates', iconKey: 'award', labelKey: 'nav.my_certificates', label: 'My Certificates' },
            { path: '/admin/certificates', iconKey: 'award', labelKey: 'nav.certificates', label: 'Certificate Templates' },
        ]
    },
    {
        iconKey: 'calendarDays',
        labelKey: 'nav.calendar',
        label: 'Calendar',
        moduleKey: 'calendar',
        children: [
            { path: '/calendar', iconKey: 'calendar', labelKey: 'nav.school_calendar', label: 'School Calendar' },
            { path: '/calendar/holidays', iconKey: 'sunrise', labelKey: 'nav.holidays', label: 'Holidays' },
            { path: '/calendar/events', iconKey: 'activity', labelKey: 'nav.events', label: 'Events' },
        ]
    },
    {
        iconKey: 'calendar',
        labelKey: 'nav.attendance',
        label: 'Attendance',
        moduleKey: 'attendance',
        children: [
            { path: '/attendance', iconKey: 'clipboardCheck', labelKey: 'nav.mark_attendance', label: 'Mark Attendance' },
            { path: '/attendance/mobile-capture', iconKey: 'qrCode', labelKey: 'nav.qr_face_scanner', label: 'QR & Face Scanner' },
            { path: '/attendance/face-enrollment', iconKey: 'camera', labelKey: 'nav.face_enrollment', label: 'Face Enrollment' },
            { path: '/attendance/reports', iconKey: 'barChart', labelKey: 'nav.attendance_reports', label: 'Reports' },
            { path: '/attendance/aggregates', iconKey: 'pieChart', labelKey: 'nav.attendance_aggregates', label: 'Aggregates' },
        ]
    },
    {
        iconKey: 'heart',
        labelKey: 'nav.wellbeing',
        label: 'Wellbeing',
        moduleKey: 'wellbeing',
        children: [
            { path: '/trackers/salah', iconKey: 'sunrise', labelKey: 'nav.salah_tracker', label: 'Salah Tracker' },
            { path: '/trackers/habits', iconKey: 'activity', labelKey: 'nav.habit_tracker', label: 'Habit Tracker' },
        ]
    },
    {
        path: '/cms/website-builder',
        iconKey: 'globe',
        labelKey: 'nav.website_builder',
        label: 'Website Builder',
        moduleKey: 'cms'
    },
    {
        iconKey: 'creditCard',
        labelKey: 'nav.idcards',
        label: 'ID Cards',
        moduleKey: 'idcards',
        children: [
            { path: '/idcards/templates', iconKey: 'layoutTemplate', labelKey: 'nav.id_templates', label: 'Templates' },
            { path: '/idcards/designer', iconKey: 'palette', labelKey: 'nav.id_designer', label: 'Designer' },
            { path: '/idcards/generate', iconKey: 'users', labelKey: 'nav.id_bulk', label: 'Bulk Generation' },
            { path: '/idcards/scanner', iconKey: 'qrCode', labelKey: 'nav.id_scanner', label: 'QR Scanner' },
        ]
    },
    {
        iconKey: 'dollarSign',
        labelKey: 'nav.fees',
        label: 'Fees',
        moduleKey: 'fees',
        children: [
            { path: '/fees/collect', iconKey: 'creditCard', labelKey: 'nav.collect_fees', label: 'Collect Fees' },
            { path: '/fees/payment-history', iconKey: 'history', labelKey: 'nav.payment_history', label: 'Payment History' },
            { path: '/fees/advances', iconKey: 'trendingUp', labelKey: 'nav.advances', label: 'Advance Payments' },
            { path: '/fees/refunds', iconKey: 'receipt', labelKey: 'nav.refunds', label: 'Refunds' },
            { path: '/fees/ledger', iconKey: 'fileText', labelKey: 'nav.student_ledger', label: 'Student Ledger' },
            { path: '/fees/reports/category', iconKey: 'pieChart', labelKey: 'nav.category_report', label: 'Category Report' },
            { path: '/fees/configure', iconKey: 'settingsGear', labelKey: 'nav.fee_config', label: 'Configure' },
            { path: '/fees/defaulters', iconKey: 'alertTriangle', labelKey: 'nav.fee_defaulters', label: 'Defaulters' },
        ]
    },
    {
        iconKey: 'landmark',
        labelKey: 'nav.finance',
        label: 'Finance',
        moduleKey: 'finance',
        children: [
            { path: '/finance/dashboard', iconKey: 'pieChart', labelKey: 'nav.finance_dashboard', label: 'Dashboard' },
            { path: '/finance', iconKey: 'receipt', labelKey: 'nav.expenses', label: 'Expenses' },
            { path: '/finance/chart-of-accounts', iconKey: 'list', labelKey: 'nav.chart_of_accounts', label: 'Chart of Accounts' },
            { path: '/finance/journal-entries', iconKey: 'fileText', labelKey: 'nav.journal_entries', label: 'Journal Entries' },
            { path: '/finance/vendors', iconKey: 'users', labelKey: 'nav.vendors', label: 'Vendors' },
            { path: '/finance/vendor-payments', iconKey: 'creditCard', labelKey: 'nav.vendor_payments', label: 'Vendor Payments' },
            { path: '/finance/salary-payments', iconKey: 'dollarSign', labelKey: 'nav.salary_payments', label: 'Salary Payments' },
            { path: '/finance/budgets', iconKey: 'trendingUp', labelKey: 'nav.budgets', label: 'Budgets' },
            { path: '/finance/petty-cash', iconKey: 'receipt', labelKey: 'nav.petty_cash', label: 'Petty Cash' },
            { path: '/finance/reconciliation', iconKey: 'landmark', labelKey: 'nav.bank_reconciliation', label: 'Bank Reconciliation' },
            { path: '/finance/reports', iconKey: 'barChart', labelKey: 'nav.financial_reports', label: 'Financial Reports' },
        ]
    },
    {
        iconKey: 'package',
        labelKey: 'nav.operations',
        label: 'Operations',
        children: [
            { path: '/inventory/stock', iconKey: 'package', labelKey: 'nav.inventory_stock', label: 'Stock Management', moduleKey: 'inventory' },
            { path: '/inventory/items', iconKey: 'list', labelKey: 'nav.inventory_items', label: 'Items & Products', moduleKey: 'inventory' },
            { path: '/inventory/vendors', iconKey: 'users', labelKey: 'nav.inventory_vendors', label: 'Vendor Management', moduleKey: 'inventory' },
            { path: '/inventory/orders', iconKey: 'fileText', labelKey: 'nav.purchase_orders', label: 'Purchase Orders', moduleKey: 'inventory' },
            { path: '/transport', iconKey: 'truck', labelKey: 'nav.transport', label: 'Transport', moduleKey: 'transport' },
            { path: '/hostel/allocations', iconKey: 'home', labelKey: 'nav.hostel_allocations', label: 'Hostel Allocations', moduleKey: 'hostel' },
            { path: '/hostel/mess', iconKey: 'utensils', labelKey: 'nav.mess_management', label: 'Mess Management', moduleKey: 'hostel' },
            { path: '/hostel/complaints', iconKey: 'alertTriangle', labelKey: 'nav.hostel_complaints', label: 'Hostel Complaints', moduleKey: 'hostel' },
            { path: '/library/books', iconKey: 'bookOpen', labelKey: 'nav.library_books', label: 'Library Books', moduleKey: 'library' },
            { path: '/library/circulation', iconKey: 'clipboardCheck', labelKey: 'nav.library_circulation', label: 'Circulation', moduleKey: 'library' },
            { path: '/library/members', iconKey: 'users', labelKey: 'nav.library_members', label: 'Library Members', moduleKey: 'library' },
            { path: '/security/visitors', iconKey: 'userCheck', labelKey: 'nav.visitors', label: 'Visitor Log', moduleKey: 'security' },
            { path: '/security/gate-passes', iconKey: 'ticket', labelKey: 'nav.gate_passes', label: 'Gate Passes', moduleKey: 'security' },
            { path: '/store', iconKey: 'shoppingCart', labelKey: 'nav.store', label: 'Store' },
        ]
    },
    {
        iconKey: 'briefcase',
        labelKey: 'nav.hr_payroll',
        label: 'HR & Payroll',
        moduleKey: 'hr',
        children: [
            { path: '/hr/leaves', iconKey: 'leaf', labelKey: 'nav.leaves', label: 'Leaves' },
            { path: '/hr/leave-approval', iconKey: 'clipboardCheck', labelKey: 'nav.leave_approval', label: 'Leave Approval' },
            { path: '/hr/leave-types', iconKey: 'calendar', labelKey: 'nav.leave_types', label: 'Leave Types' },
            { path: '/payroll/dashboard', iconKey: 'pieChart', labelKey: 'nav.payroll_dashboard', label: 'Payroll Dashboard' },
            { path: '/payroll/salary-structure', iconKey: 'list', labelKey: 'nav.salary_structure', label: 'Salary Structure' },
            { path: '/payroll/components', iconKey: 'dollarSign', labelKey: 'nav.salary_components', label: 'Salary Components' },
            { path: '/payroll/payslips', iconKey: 'fileSpreadsheet', labelKey: 'nav.payroll', label: 'Payslips' },
        ]
    },
    {
        iconKey: 'rocket',
        labelKey: 'nav.growth',
        label: 'Growth',
        children: [
            { path: '/crm', iconKey: 'trendingUp', labelKey: 'nav.crm', label: 'Lead Board', moduleKey: 'crm' },
            { path: '/admissions/apply', iconKey: 'userPlus', labelKey: 'nav.online_admission', label: 'Online Admission' },
            { path: '/crm/conversion', iconKey: 'userPlus', labelKey: 'nav.lead_conversion', label: 'Lead Conversion', moduleKey: 'crm' },
            { path: '/crm/followups', iconKey: 'calendar', labelKey: 'nav.followups', label: 'Follow-ups', moduleKey: 'crm' },
            { path: '/alumni/directory', iconKey: 'users', labelKey: 'nav.alumni_directory', label: 'Alumni Directory', moduleKey: 'alumni' },
            { path: '/alumni/jobs', iconKey: 'briefcase', labelKey: 'nav.alumni_jobs', label: 'Job Board', moduleKey: 'alumni' },
            { path: '/alumni/events', iconKey: 'calendar', labelKey: 'nav.alumni_events', label: 'Events', moduleKey: 'alumni' },
            { path: '/alumni/donations', iconKey: 'dollarSign', labelKey: 'nav.donations', label: 'Donations', moduleKey: 'alumni' },
            { path: '/placement/drives', iconKey: 'building', labelKey: 'nav.placement_drives', label: 'Placement Drives', moduleKey: 'placement' },
            { path: '/placement/recruiters', iconKey: 'users', labelKey: 'nav.recruiters', label: 'Recruiters', moduleKey: 'placement' },
            { path: '/placement/applications', iconKey: 'fileCheck', labelKey: 'nav.placement_applications', label: 'Applications', moduleKey: 'placement' },
        ]
    },
    {
        iconKey: 'messageSquare',
        labelKey: 'nav.communication',
        label: 'Communication',
        moduleKey: 'communication',
        children: [
            { path: '/communication', iconKey: 'bell', labelKey: 'nav.notices', label: 'Notices' },
            { path: '/communication/messages', iconKey: 'messageSquare', labelKey: 'nav.messages', label: 'Messages' },
            { path: '/notifications/center', iconKey: 'bell', labelKey: 'nav.notifications', label: 'Notifications', moduleKey: 'notifications' },
            { path: '/notifications/email', iconKey: 'messageSquare', labelKey: 'nav.email_campaigns', label: 'Email Campaigns', moduleKey: 'notifications' },
            { path: '/notifications/sms', iconKey: 'messageSquare', labelKey: 'nav.sms_messaging', label: 'SMS Messaging', moduleKey: 'notifications' },
        ]
    },

    {
        iconKey: 'barChart',
        labelKey: 'nav.analytics',
        label: 'Analytics & Reports',
        moduleKey: 'reports',
        children: [
            { path: '/analytics', iconKey: 'pieChart', labelKey: 'nav.platform_analytics', label: 'Platform Analytics' },
            { path: '/leaderboard', iconKey: 'award', labelKey: 'nav.leaderboard', label: 'Leaderboard' },
            { path: '/reports/builder', iconKey: 'fileText', labelKey: 'nav.report_builder', label: 'Report Builder' },
            { path: '/reports/analytics', iconKey: 'trendingUp', labelKey: 'nav.advanced_analytics', label: 'Advanced Analytics' },
            { path: '/reports/scheduled', iconKey: 'calendar', labelKey: 'nav.scheduled_reports', label: 'Scheduled Reports' },
        ]
    },
    { path: '/helpdesk', iconKey: 'helpCircle', labelKey: 'nav.helpdesk', label: 'Helpdesk', moduleKey: 'helpdesk' },
    {
        iconKey: 'settings',
        labelKey: 'nav.settings',
        label: 'Settings',
        moduleKey: 'settings',
        children: [
            { path: '/settings', iconKey: 'settings', labelKey: 'nav.general_settings', label: 'General Settings' },
            { path: '/settings/system', iconKey: 'settingsGear', labelKey: 'nav.system_settings', label: 'System Settings' },
            { path: '/settings/academic', iconKey: 'graduationCap', labelKey: 'nav.academic_setup', label: 'Academic Setup' },
            { path: '/settings/branding', iconKey: 'palette', labelKey: 'nav.branding', label: 'Branding' },
            { path: '/settings/roles', iconKey: 'shieldCheck', labelKey: 'nav.roles_permissions', label: 'Roles & Permissions' },
            { path: '/settings/permissions', iconKey: 'shield', labelKey: 'nav.permissions', label: 'Permissions Matrix' },
            { path: '/settings/data-management', iconKey: 'database', labelKey: 'nav.data_management', label: 'Data Management' },
        ]
    },
    {
        iconKey: 'shieldCheck',
        labelKey: 'nav.admin',
        label: 'Admin',
        moduleKey: 'admin',
        children: [
            { path: '/admin/dashboard-settings', iconKey: 'layoutTemplate', labelKey: 'nav.dashboard_settings', label: 'Dashboard Settings' },
            { path: '/admin/parent-portal', iconKey: 'users', labelKey: 'nav.parent_portal', label: 'Parent Portal' },
            { path: '/admin/audit-logs', iconKey: 'fileText', labelKey: 'nav.audit_logs', label: 'Audit Logs' },
            { path: '/admin/recycle-bin', iconKey: 'folderOpen', labelKey: 'nav.recycle_bin', label: 'Recycle Bin' },
            { path: '/users/manage', iconKey: 'users', labelKey: 'nav.user_management', label: 'User Management', moduleKey: 'users' },
        ]
    },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { branding, isModuleEnabled, getSmallLogoUrl } = useTenantBranding();
    const { getIconComponent } = useIconSet();
    const { user } = useAuth();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // Filter menu items based on enabled modules
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter(item => {
            // Filter out empty parent menus
            if (item.children && item.children.length === 0) {
                return false;
            }
            // Check if the menu item's module is enabled
            if (item.moduleKey && !isModuleEnabled(item.moduleKey)) {
                return false;
            }
            return true;
        }).map(item => {
            // Filter children based on their module keys
            if (item.children) {
                const filteredChildren = item.children.filter(child => {
                    if (child.moduleKey && !isModuleEnabled(child.moduleKey)) {
                        return false;
                    }
                    return true;
                });
                // Only include parent if it has visible children or no children defined
                if (filteredChildren.length === 0) {
                    return null;
                }
                return { ...item, children: filteredChildren };
            }
            return item;
        }).filter(Boolean) as MenuItem[];
    }, [isModuleEnabled]);

    const toggleMenu = (labelKey: string) => {
        setExpandedMenus(prev =>
            prev.includes(labelKey)
                ? prev.filter(key => key !== labelKey)
                : [...prev, labelKey]
        );
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const isMenuExpanded = (labelKey: string) => {
        return expandedMenus.includes(labelKey);
    };

    // Get chevron icons
    const ChevronDownIcon = getIconComponent('chevronDown');
    const ChevronRightIcon = getIconComponent('chevronRight');
    const LogoIcon = getIconComponent('graduationCap');

    // Get the small logo URL with fallback chain
    const smallLogoUrl = getSmallLogoUrl();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">
                    {smallLogoUrl ? (
                        <img
                            src={smallLogoUrl}
                            alt={branding?.tenant_name || 'Logo'}
                            style={{ height: '32px', width: 'auto', maxWidth: '150px' }}
                            loading="lazy"
                        />
                    ) : (
                        <LogoIcon size={32} className="sidebar-logo-icon" />
                    )}
                    <span>{branding?.tenant_name || 'NucleiQ'}</span>
                </h1>
            </div>

            <nav className="sidebar-nav">
                {filteredMenuItems.map((item) => {
                    const Icon = getIconComponent(item.iconKey);
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = isMenuExpanded(item.labelKey);

                    if (!hasChildren && item.path) {
                        // Single menu item
                        return (
                            <Link
                                key={item.labelKey}
                                to={item.path}
                                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                            >
                                <Icon size={20} className="sidebar-icon" />
                                <span className="sidebar-label">
                                    {t(item.labelKey, { defaultValue: item.label })}
                                </span>
                            </Link>
                        );
                    }

                    // Menu with children
                    return (
                        <div key={item.labelKey} className="sidebar-group">
                            <button
                                className={`sidebar-item sidebar-toggle ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleMenu(item.labelKey)}
                            >
                                <Icon size={20} className="sidebar-icon" />
                                <span className="sidebar-label">
                                    {t(item.labelKey, { defaultValue: item.label })}
                                </span>
                                {isExpanded ? (
                                    <ChevronDownIcon size={16} className="sidebar-chevron" />
                                ) : (
                                    <ChevronRightIcon size={16} className="sidebar-chevron" />
                                )}
                            </button>

                            {isExpanded && item.children && (
                                <div className="sidebar-submenu">
                                    {item.children.map((child) => {
                                        const ChildIcon = getIconComponent(child.iconKey);
                                        return (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`sidebar-subitem ${isActive(child.path) ? 'active' : ''}`}
                                            >
                                                <ChildIcon size={16} className="sidebar-icon" />
                                                <span className="sidebar-label">
                                                    {t(child.labelKey, { defaultValue: child.label })}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
