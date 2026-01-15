/**
 * Sidebar Navigation - With Dynamic Icon Sets
 * Modern sidebar with selectable icon libraries
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
import { useIconSet } from '../../contexts/IconSetContext';
import { IconKey } from '../../config/iconSets';
import './Layout.css';

interface SubMenuItem {
    path: string;
    iconKey: IconKey;
    labelKey: string;
    label?: string;
}

interface MenuItem {
    path?: string;
    iconKey: IconKey;
    labelKey: string;
    label?: string;
    children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
    { path: '/dashboard', iconKey: 'dashboard', labelKey: 'nav.dashboard', label: 'Dashboard' },
    {
        iconKey: 'users',
        labelKey: 'nav.students',
        label: 'Students',
        children: [
            { path: '/students', iconKey: 'list', labelKey: 'nav.student_list', label: 'Student List' },
            { path: '/students/enrollments', iconKey: 'clipboardCheck', labelKey: 'nav.enrollments', label: 'Enrollments' },
            { path: '/students/add', iconKey: 'userPlus', labelKey: 'nav.add_student', label: 'Add Student' },
            { path: '/students/remarks', iconKey: 'messageCircle', labelKey: 'nav.remarks', label: 'Remarks' },
            { path: '/students/documents', iconKey: 'folderOpen', labelKey: 'nav.documents', label: 'Documents' },
        ]
    },
    {
        iconKey: 'userCheck',
        labelKey: 'nav.staff',
        label: 'Staff',
        children: [
            { path: '/staff', iconKey: 'list', labelKey: 'nav.staff_list', label: 'Staff List' },
            { path: '/staff/add', iconKey: 'userPlus', labelKey: 'nav.add_staff', label: 'Add Staff' },
            { path: '/staff/documents', iconKey: 'folderOpen', labelKey: 'nav.staff_documents', label: 'Documents' },
            { path: '/staff/attendance', iconKey: 'clipboardCheck', labelKey: 'nav.staff_attendance', label: 'Attendance' },
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
        children: [
            { path: '/timetable/builder', iconKey: 'calendarDays', labelKey: 'nav.timetable', label: 'Timetable' },
            { path: '/assignments', iconKey: 'penTool', labelKey: 'nav.assignments', label: 'Assignments' },
            { path: '/exams', iconKey: 'fileText', labelKey: 'nav.exams', label: 'Exams' },
            { path: '/exams/question-bank', iconKey: 'bookOpen', labelKey: 'nav.question_bank', label: 'Question Bank' },
            { path: '/exams/learning-outcomes', iconKey: 'award', labelKey: 'nav.learning_outcomes', label: 'Learning Outcomes' },
            { path: '/exams/online', iconKey: 'video', labelKey: 'nav.online_examination', label: 'Online Examination' },
            { path: '/exams/results/entry', iconKey: 'clipboardCheck', labelKey: 'nav.result_entry', label: 'Result Entry' },
            { path: '/exams/results/analytics', iconKey: 'barChart', labelKey: 'nav.result_analytics', label: 'Result Analytics' },
            { path: '/lms/classes', iconKey: 'video', labelKey: 'nav.live_classes', label: 'Live Classes' },
            { path: '/lms/digital', iconKey: 'library', labelKey: 'nav.digital_lms', label: 'Digital Library' },
            { path: '/admin/certificates', iconKey: 'award', labelKey: 'nav.certificates', label: 'Certificates' },
        ]
    },
    {
        iconKey: 'calendar',
        labelKey: 'nav.attendance',
        label: 'Attendance',
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
        children: [
            { path: '/trackers/salah', iconKey: 'sunrise', labelKey: 'nav.salah_tracker', label: 'Salah Tracker' },
            { path: '/trackers/habits', iconKey: 'activity', labelKey: 'nav.habit_tracker', label: 'Habit Tracker' },
        ]
    },
    {
        iconKey: 'creditCard',
        labelKey: 'nav.idcards',
        label: 'ID Cards',
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
        children: [
            { path: '/fees/collect', iconKey: 'creditCard', labelKey: 'nav.collect_fees', label: 'Collect Fees' },
            { path: '/fees/payment-history', iconKey: 'history', labelKey: 'nav.payment_history', label: 'Payment History' },
            { path: '/fees/advances', iconKey: 'trendingUp', labelKey: 'nav.advances', label: 'Advance Payments' },
            { path: '/fees/refunds', iconKey: 'receipt', labelKey: 'nav.refunds', label: 'Refunds' },
            { path: '/fees/ledger', iconKey: 'fileText', labelKey: 'nav.student_ledger', label: 'Student Ledger' },
            { path: '/fees/reports/category', iconKey: 'pieChart', labelKey: 'nav.category_report', label: 'Category Report' },
            { path: '/fees/configure', iconKey: 'settingsGear', labelKey: 'nav.fee_config', label: 'Configure' },
            { path: '/fees/defaulters', iconKey: 'alertTriangle', labelKey: 'nav.fee_defaulters', label: 'Defaulters' },
            { path: '/finance', iconKey: 'pieChart', labelKey: 'nav.finance', label: 'Finance' },
            { path: '/finance/petty-cash', iconKey: 'receipt', labelKey: 'nav.petty_cash', label: 'Petty Cash' },
            { path: '/finance/reconciliation', iconKey: 'landmark', labelKey: 'nav.bank_reconciliation', label: 'Bank Reconciliation' },
            { path: '/finance/reports', iconKey: 'trendingDown', labelKey: 'nav.financial_reports', label: 'Financial Reports' },
        ]
    },
    {
        iconKey: 'package',
        labelKey: 'nav.operations',
        label: 'Operations',
        children: [
            { path: '/inventory/stock', iconKey: 'package', labelKey: 'nav.inventory_stock', label: 'Stock Management' },
            { path: '/inventory/items', iconKey: 'list', labelKey: 'nav.inventory_items', label: 'Items & Products' },
            { path: '/inventory/vendors', iconKey: 'users', labelKey: 'nav.inventory_vendors', label: 'Vendor Management' },
            { path: '/inventory/orders', iconKey: 'fileText', labelKey: 'nav.purchase_orders', label: 'Purchase Orders' },
            { path: '/transport', iconKey: 'truck', labelKey: 'nav.transport', label: 'Transport' },
            { path: '/hostel/allocations', iconKey: 'home', labelKey: 'nav.hostel_allocations', label: 'Hostel Allocations' },
            { path: '/hostel/mess', iconKey: 'utensils', labelKey: 'nav.mess_management', label: 'Mess Management' },
            { path: '/hostel/complaints', iconKey: 'alertTriangle', labelKey: 'nav.hostel_complaints', label: 'Hostel Complaints' },
            { path: '/library/books', iconKey: 'bookOpen', labelKey: 'nav.library_books', label: 'Library Books' },
            { path: '/library/circulation', iconKey: 'clipboardCheck', labelKey: 'nav.library_circulation', label: 'Circulation' },
            { path: '/library/members', iconKey: 'users', labelKey: 'nav.library_members', label: 'Library Members' },
            { path: '/security/visitors', iconKey: 'userCheck', labelKey: 'nav.visitors', label: 'Visitor Log' },
            { path: '/security/gate-passes', iconKey: 'ticket', labelKey: 'nav.gate_passes', label: 'Gate Passes' },
            { path: '/store', iconKey: 'shoppingCart', labelKey: 'nav.store', label: 'Store' },
        ]
    },
    {
        iconKey: 'briefcase',
        labelKey: 'nav.hr_payroll',
        label: 'HR & Payroll',
        children: [
            { path: '/hr/leaves', iconKey: 'leaf', labelKey: 'nav.leaves', label: 'Leaves' },
            { path: '/payroll/payslips', iconKey: 'fileSpreadsheet', labelKey: 'nav.payroll', label: 'Payroll' },
        ]
    },
    {
        iconKey: 'rocket',
        labelKey: 'nav.growth',
        label: 'Growth',
        children: [
            { path: '/crm', iconKey: 'trendingUp', labelKey: 'nav.crm', label: 'CRM' },
            { path: '/alumni/directory', iconKey: 'users', labelKey: 'nav.alumni_directory', label: 'Alumni Directory' },
            { path: '/alumni/jobs', iconKey: 'briefcase', labelKey: 'nav.alumni_jobs', label: 'Job Board' },
            { path: '/alumni/events', iconKey: 'calendar', labelKey: 'nav.alumni_events', label: 'Events' },
            { path: '/placement/drives', iconKey: 'building', labelKey: 'nav.placement_drives', label: 'Placement Drives' },
            { path: '/placement/applications', iconKey: 'fileCheck', labelKey: 'nav.placement_applications', label: 'Applications' },
        ]
    },
    {
        iconKey: 'messageSquare',
        labelKey: 'nav.communication',
        label: 'Communication',
        children: [
            { path: '/communication', iconKey: 'bell', labelKey: 'nav.notices', label: 'Notices' },
            { path: '/communication/messages', iconKey: 'messageSquare', labelKey: 'nav.messages', label: 'Messages' },
            { path: '/notifications/center', iconKey: 'bell', labelKey: 'nav.notifications', label: 'Notifications' },
            { path: '/notifications/email', iconKey: 'messageSquare', labelKey: 'nav.email_campaigns', label: 'Email Campaigns' },
            { path: '/notifications/sms', iconKey: 'messageSquare', labelKey: 'nav.sms_messaging', label: 'SMS Messaging' },
        ]
    },
    {
        iconKey: 'globe',
        labelKey: 'nav.website',
        label: 'Website',
        children: [
            { path: '/cms/website-builder', iconKey: 'globe', labelKey: 'nav.website_builder', label: 'Website Builder' },
            { path: '/cms/templates', iconKey: 'layoutTemplate', labelKey: 'nav.templates', label: 'Templates' },
        ]
    },
    { path: '/reports/builder', iconKey: 'barChart', labelKey: 'nav.reports', label: 'Report Builder' },
    {
        iconKey: 'barChart',
        labelKey: 'nav.analytics',
        label: 'Analytics & Reports',
        children: [
            { path: '/reports/builder', iconKey: 'fileText', labelKey: 'nav.report_builder', label: 'Report Builder' },
            { path: '/reports/analytics', iconKey: 'trendingUp', labelKey: 'nav.advanced_analytics', label: 'Advanced Analytics' },
            { path: '/reports/scheduled', iconKey: 'calendar', labelKey: 'nav.scheduled_reports', label: 'Scheduled Reports' },
        ]
    },
    { path: '/helpdesk', iconKey: 'helpCircle', labelKey: 'nav.helpdesk', label: 'Helpdesk' },
    {
        iconKey: 'settings',
        labelKey: 'nav.settings',
        label: 'Settings',
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
    { path: '/parent-portal', iconKey: 'users', labelKey: 'nav.parent_portal', label: 'Parent Portal' },
    {
        iconKey: 'barChart',
        labelKey: 'nav.admin',
        label: 'Admin',
        children: [
            { path: '/admin/audit-logs', iconKey: 'fileText', labelKey: 'nav.audit_logs', label: 'Audit Logs' },
            { path: '/admin/recycle-bin', iconKey: 'folderOpen', labelKey: 'nav.recycle_bin', label: 'Recycle Bin' },
            { path: '/users/manage', iconKey: 'users', labelKey: 'nav.user_management', label: 'User Management' },
        ]
    },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { branding } = useTenantBranding();
    const { getIconComponent } = useIconSet();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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

    return (
        <aside className="sidebar" style={branding?.sidebar_color ? { backgroundColor: branding.sidebar_color } : {}}>
            <div className="sidebar-header">
                <h1 className="sidebar-logo">
                    {branding?.logo_url ? (
                        <img
                            src={branding.logo_url}
                            alt={branding.tenant_name || 'Logo'}
                            style={{ height: '32px', width: 'auto', maxWidth: '150px' }}
                        />
                    ) : (
                        <LogoIcon size={32} className="sidebar-logo-icon" />
                    )}
                    <span>{branding?.tenant_name || 'NucleIQ'}</span>
                </h1>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
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
