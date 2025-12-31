import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Layout.css';

interface SubMenuItem {
    path: string;
    icon: string;
    labelKey: string;
    label?: string;
}

interface MenuItem {
    path?: string;
    icon: string;
    labelKey: string;
    label?: string;
    children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
    { path: '/dashboard', icon: '📊', labelKey: 'nav.dashboard', label: 'Dashboard' },
    {
        icon: '👨‍🎓',
        labelKey: 'nav.students',
        label: 'Students',
        children: [
            { path: '/students', icon: '📋', labelKey: 'nav.student_list', label: 'Student List' },
            { path: '/students/add', icon: '➕', labelKey: 'nav.add_student', label: 'Add Student' },
            { path: '/students/remarks', icon: '💬', labelKey: 'nav.remarks', label: 'Remarks' },
            { path: '/students/documents', icon: '📁', labelKey: 'nav.documents', label: 'Documents' },
        ]
    },
    {
        icon: '👨‍🏫',
        labelKey: 'nav.staff',
        label: 'Staff',
        children: [
            { path: '/staff', icon: '📋', labelKey: 'nav.staff_list', label: 'Staff List' },
            { path: '/staff/add', icon: '➕', labelKey: 'nav.add_staff', label: 'Add Staff' },
        ]
    },
    {
        icon: '🏫',
        labelKey: 'nav.academics',
        label: 'Academics',
        children: [
            { path: '/timetable/builder', icon: '📅', labelKey: 'nav.timetable', label: 'Timetable' },
            { path: '/assignments', icon: '📝', labelKey: 'nav.assignments', label: 'Assignments' },
            { path: '/exams', icon: '✍️', labelKey: 'nav.exams', label: 'Exams' },
            { path: '/exams/results/entry', icon: '📊', labelKey: 'nav.result_entry', label: 'Result Entry' },
            { path: '/exams/results/analytics', icon: '📈', labelKey: 'nav.result_analytics', label: 'Result Analytics' },
            { path: '/lms/classes', icon: '📹', labelKey: 'nav.live_classes', label: 'Live Classes' },
            { path: '/lms/digital', icon: '📚', labelKey: 'nav.digital_lms', label: 'Digital Library' },
        ]
    },
    {
        icon: '📅',
        labelKey: 'nav.attendance',
        label: 'Attendance',
        children: [
            { path: '/attendance', icon: '📝', labelKey: 'nav.mark_attendance', label: 'Mark Attendance' },
            { path: '/attendance/aggregates', icon: '📊', labelKey: 'nav.attendance_aggregates', label: 'Aggregates' },
        ]
    },
    {
        icon: '💰',
        labelKey: 'nav.fees',
        label: 'Fees',
        children: [
            { path: '/fees/collect', icon: '💵', labelKey: 'nav.collect_fees', label: 'Collect Fees' },
            { path: '/fees/configure', icon: '⚙️', labelKey: 'nav.fee_config', label: 'Configure' },
            { path: '/fees/defaulters', icon: '⚠️', labelKey: 'nav.fee_defaulters', label: 'Defaulters' },
            { path: '/finance', icon: '📊', labelKey: 'nav.finance', label: 'Finance' },
            { path: '/finance/reports', icon: '📈', labelKey: 'nav.financial_reports', label: 'Financial Reports' },
        ]
    },
    {
        icon: '🚛',
        labelKey: 'nav.operations',
        label: 'Operations',
        children: [
            { path: '/inventory', icon: '📦', labelKey: 'nav.inventory', label: 'Inventory' },
            { path: '/transport', icon: '🚌', labelKey: 'nav.transport', label: 'Transport' },
            { path: '/hostel', icon: '🏠', labelKey: 'nav.hostel', label: 'Hostel' },
            { path: '/library', icon: '📚', labelKey: 'nav.library', label: 'Library' },
            { path: '/store', icon: '🛒', labelKey: 'nav.store', label: 'Store' },
        ]
    },
    {
        icon: '💼',
        labelKey: 'nav.hr_payroll',
        label: 'HR & Payroll',
        children: [
            { path: '/hr/leaves', icon: '🍂', labelKey: 'nav.leaves', label: 'Leaves' },
            { path: '/payroll/payslips', icon: '📑', labelKey: 'nav.payroll', label: 'Payroll' },
        ]
    },
    {
        icon: '🚀',
        labelKey: 'nav.growth',
        label: 'Business',
        children: [
            { path: '/crm/leads', icon: '🎯', labelKey: 'nav.crm', label: 'CRM' },
            { path: '/alumni', icon: '🎓', labelKey: 'nav.alumni', label: 'Alumni' },
            { path: '/cms/builder', icon: '🌐', labelKey: 'nav.cms', label: 'CMS' },
            { path: '/placement', icon: '👔', labelKey: 'nav.placement', label: 'Placement' },
        ]
    },
    {
        icon: '✨',
        labelKey: 'nav.trackers',
        label: 'Trackers',
        children: [
            { path: '/trackers/salah', icon: '🕌', labelKey: 'nav.salah', label: 'Salah' },
            { path: '/trackers/habits', icon: '📊', labelKey: 'nav.habits', label: 'Habits' },
        ]
    },
    {
        icon: '🛡️',
        labelKey: 'nav.admin_tools',
        label: 'Admin Utility',
        children: [
            { path: '/admin/certificates', icon: '📜', labelKey: 'nav.certificates', label: 'Certificates' },
            { path: '/security/scanner', icon: '🔍', labelKey: 'nav.security', label: 'Scanner' },
            { path: '/helpdesk', icon: '🎫', labelKey: 'nav.helpdesk', label: 'Helpdesk' },
            { path: '/helpdesk/tickets', icon: '🎫', labelKey: 'nav.helpdesk_tickets', label: 'Tickets' },
            { path: '/idcards/designer', icon: '🪪', labelKey: 'nav.id_cards', label: 'ID Cards' },
            { path: '/group/hq', icon: '🏢', labelKey: 'nav.group_hq', label: 'Group HQ' },
        ]
    },
    { path: '/analytics', icon: '📊', labelKey: 'nav.analytics', label: 'Analytics' },
    { path: '/billing', icon: '💳', labelKey: 'nav.billing', label: 'Billing' },
    { path: '/reports', icon: '📈', labelKey: 'nav.reports', label: 'Reports' },
    {
        icon: '👥',
        labelKey: 'nav.users',
        label: 'Users',
        children: [
            { path: '/users', icon: '📋', labelKey: 'nav.user_list', label: 'User List' },
            { path: '/users/manage', icon: '⚙️', labelKey: 'nav.user_management', label: 'Manage Users' },
        ]
    },
    {
        icon: '⚙️',
        labelKey: 'nav.settings',
        label: 'Settings',
        children: [
            { path: '/settings', icon: '🔧', labelKey: 'nav.general_settings', label: 'General' },
            { path: '/settings/academic', icon: '🏫', labelKey: 'nav.academic_setup', label: 'Academic Setup' },
        ]
    },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpand = (labelKey: string) => {
        setExpandedItems(prev =>
            prev.includes(labelKey)
                ? prev.filter(item => item !== labelKey)
                : [...prev, labelKey]
        );
    };

    const isActive = (path?: string, children?: SubMenuItem[]) => {
        if (path) {
            return location.pathname === path || location.pathname.startsWith(path + '/');
        }
        if (children) {
            return children.some(child =>
                location.pathname === child.path || location.pathname.startsWith(child.path + '/')
            );
        }
        return false;
    };


    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">
                    <span className="logo-text">NucleIQ</span>
                </h1>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems.includes(item.labelKey);
                    const itemIsActive = isActive(item.path, item.children);

                    return (
                        <div key={item.labelKey} className="sidebar-item-wrapper">
                            {hasChildren ? (
                                <>
                                    <button
                                        className={`sidebar-item sidebar-parent ${itemIsActive ? 'active' : ''}`}
                                        onClick={() => toggleExpand(item.labelKey)}
                                    >
                                        <span className="sidebar-icon">{item.icon}</span>
                                        <span className="sidebar-label">
                                            {t(item.labelKey, { defaultValue: item.label })}
                                        </span>
                                        <span className={`sidebar-arrow ${isExpanded ? 'expanded' : ''}`}>
                                            ▼
                                        </span>
                                    </button>
                                    {isExpanded && item.children && (
                                        <div className="sidebar-submenu">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`sidebar-item sidebar-child ${location.pathname === child.path ? 'active' : ''
                                                        }`}
                                                >
                                                    <span className="sidebar-icon">{child.icon}</span>
                                                    <span className="sidebar-label">
                                                        {t(child.labelKey, { defaultValue: child.label })}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.path!}
                                    className={`sidebar-item ${itemIsActive ? 'active' : ''}`}
                                >
                                    <span className="sidebar-icon">{item.icon}</span>
                                    <span className="sidebar-label">
                                        {t(item.labelKey, { defaultValue: item.label })}
                                    </span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
