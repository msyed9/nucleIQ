/**
 * Sidebar Navigation - Redesigned with NucleIQ Design System
 * Modern sidebar with Lucide icons and collapsible sections
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Calendar,
    DollarSign,
    Package,
    Briefcase,
    TrendingUp,
    MessageSquare,
    Settings,
    ChevronDown,
    ChevronRight,
    UserPlus,
    List,
    MessageCircle,
    FolderOpen,
    UserCheck,
    CalendarDays,
    PenTool,
    FileText,
    BarChart3,
    Video,
    Library,
    ClipboardCheck,
    PieChart,
    CreditCard,
    SettingsIcon,
    AlertTriangle,
    TrendingDown,
    Truck,
    Home,
    ShoppingCart,
    Leaf,
    FileSpreadsheet,
    Rocket,
    Bell,
    HelpCircle,
    Award,
    LayoutTemplate,
    Globe
} from 'lucide-react';
import './Layout.css';

interface SubMenuItem {
    path: string;
    icon: React.ComponentType<any>;
    labelKey: string;
    label?: string;
}

interface MenuItem {
    path?: string;
    icon: React.ComponentType<any>;
    labelKey: string;
    label?: string;
    children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', label: 'Dashboard' },
    {
        icon: Users,
        labelKey: 'nav.students',
        label: 'Students',
        children: [
            { path: '/students', icon: List, labelKey: 'nav.student_list', label: 'Student List' },
            { path: '/students/add', icon: UserPlus, labelKey: 'nav.add_student', label: 'Add Student' },
            { path: '/students/remarks', icon: MessageCircle, labelKey: 'nav.remarks', label: 'Remarks' },
            { path: '/students/documents', icon: FolderOpen, labelKey: 'nav.documents', label: 'Documents' },
            { path: '/idcards/designer', icon: LayoutTemplate, labelKey: 'nav.id_cards', label: 'ID Cards' },
        ]
    },
    {
        icon: UserCheck,
        labelKey: 'nav.staff',
        label: 'Staff',
        children: [
            { path: '/staff', icon: List, labelKey: 'nav.staff_list', label: 'Staff List' },
            { path: '/staff/add', icon: UserPlus, labelKey: 'nav.add_staff', label: 'Add Staff' },
            { path: '/staff/documents', icon: FolderOpen, labelKey: 'nav.staff_documents', label: 'Documents' },
            { path: '/staff/attendance', icon: ClipboardCheck, labelKey: 'nav.staff_attendance', label: 'Attendance' },
            { path: '/staff/leave', icon: Leaf, labelKey: 'nav.leave_management', label: 'Leave Management' },
            { path: '/staff/health', icon: Award, labelKey: 'nav.health_records', label: 'Health Records' },
            { path: '/staff/training', icon: BookOpen, labelKey: 'nav.training', label: 'Training' },
            { path: '/staff/appraisal', icon: BarChart3, labelKey: 'nav.appraisal', label: 'Appraisal' },
        ]
    },
    {
        icon: GraduationCap,
        labelKey: 'nav.academics',
        label: 'Academics',
        children: [
            { path: '/timetable/builder', icon: CalendarDays, labelKey: 'nav.timetable', label: 'Timetable' },
            { path: '/assignments', icon: PenTool, labelKey: 'nav.assignments', label: 'Assignments' },
            { path: '/exams', icon: FileText, labelKey: 'nav.exams', label: 'Exams' },
            { path: '/exams/question-bank', icon: BookOpen, labelKey: 'nav.question_bank', label: 'Question Bank' },
            { path: '/exams/learning-outcomes', icon: Award, labelKey: 'nav.learning_outcomes', label: 'Learning Outcomes' },
            { path: '/exams/online', icon: Video, labelKey: 'nav.online_examination', label: 'Online Examination' },
            { path: '/exams/results/entry', icon: ClipboardCheck, labelKey: 'nav.result_entry', label: 'Result Entry' },
            { path: '/exams/results/analytics', icon: BarChart3, labelKey: 'nav.result_analytics', label: 'Result Analytics' },
            { path: '/lms/classes', icon: Video, labelKey: 'nav.live_classes', label: 'Live Classes' },
            { path: '/lms/digital', icon: Library, labelKey: 'nav.digital_lms', label: 'Digital Library' },
            { path: '/admin/certificates', icon: Award, labelKey: 'nav.certificates', label: 'Certificates' },
        ]
    },
    {
        icon: Calendar,
        labelKey: 'nav.attendance',
        label: 'Attendance',
        children: [
            { path: '/attendance', icon: ClipboardCheck, labelKey: 'nav.mark_attendance', label: 'Mark Attendance' },
            { path: '/attendance/aggregates', icon: PieChart, labelKey: 'nav.attendance_aggregates', label: 'Aggregates' },
        ]
    },
    {
        icon: DollarSign,
        labelKey: 'nav.fees',
        label: 'Fees',
        children: [
            { path: '/fees/collect', icon: CreditCard, labelKey: 'nav.collect_fees', label: 'Collect Fees' },
            { path: '/fees/configure', icon: SettingsIcon, labelKey: 'nav.fee_config', label: 'Configure' },
            { path: '/fees/defaulters', icon: AlertTriangle, labelKey: 'nav.fee_defaulters', label: 'Defaulters' },
            { path: '/finance', icon: PieChart, labelKey: 'nav.finance', label: 'Finance' },
            { path: '/finance/reports', icon: TrendingDown, labelKey: 'nav.financial_reports', label: 'Financial Reports' },
        ]
    },
    {
        icon: Package,
        labelKey: 'nav.operations',
        label: 'Operations',
        children: [
            { path: '/inventory/stock', icon: Package, labelKey: 'nav.inventory', label: 'Inventory' },
            { path: '/transport', icon: Truck, labelKey: 'nav.transport', label: 'Transport' },
            { path: '/hostel', icon: Home, labelKey: 'nav.hostel', label: 'Hostel' },
            { path: '/library', icon: BookOpen, labelKey: 'nav.library', label: 'Library' },
            { path: '/store', icon: ShoppingCart, labelKey: 'nav.store', label: 'Store' },
        ]
    },
    {
        icon: Briefcase,
        labelKey: 'nav.hr_payroll',
        label: 'HR & Payroll',
        children: [
            { path: '/hr/leaves', icon: Leaf, labelKey: 'nav.leaves', label: 'Leaves' },
            { path: '/payroll/payslips', icon: FileSpreadsheet, labelKey: 'nav.payroll', label: 'Payroll' },
        ]
    },
    {
        icon: Rocket,
        labelKey: 'nav.growth',
        label: 'Growth',
        children: [
            { path: '/crm', icon: TrendingUp, labelKey: 'nav.crm', label: 'CRM' },
            { path: '/alumni', icon: Users, labelKey: 'nav.alumni', label: 'Alumni' },
        ]
    },
    {
        icon: MessageSquare,
        labelKey: 'nav.communication',
        label: 'Communication',
        children: [
            { path: '/communication', icon: Bell, labelKey: 'nav.notices', label: 'Notices' },
            { path: '/communication/messages', icon: MessageSquare, labelKey: 'nav.messages', label: 'Messages' },
            { path: '/notifications/center', icon: Bell, labelKey: 'nav.notifications', label: 'Notifications' },
            { path: '/notifications/email', icon: MessageSquare, labelKey: 'nav.email_campaigns', label: 'Email Campaigns' },
            { path: '/notifications/sms', icon: MessageSquare, labelKey: 'nav.sms_messaging', label: 'SMS Messaging' },
        ]
    },
    {
        icon: Globe,
        labelKey: 'nav.website',
        label: 'Website',
        children: [
            { path: '/cms/website-builder', icon: Globe, labelKey: 'nav.website_builder', label: 'Website Builder' },
            { path: '/cms/templates', icon: LayoutTemplate, labelKey: 'nav.templates', label: 'Templates' },
        ]
    },
    { path: '/reports/builder', icon: BarChart3, labelKey: 'nav.reports', label: 'Report Builder' },
    {
        icon: BarChart3,
        labelKey: 'nav.analytics',
        label: 'Analytics & Reports',
        children: [
            { path: '/reports/builder', icon: FileText, labelKey: 'nav.report_builder', label: 'Report Builder' },
            { path: '/reports/analytics', icon: TrendingUp, labelKey: 'nav.advanced_analytics', label: 'Advanced Analytics' },
            { path: '/reports/scheduled', icon: Calendar, labelKey: 'nav.scheduled_reports', label: 'Scheduled Reports' },
        ]
    },
    { path: '/helpdesk', icon: HelpCircle, labelKey: 'nav.helpdesk', label: 'Helpdesk' },
    {
        icon: Settings,
        labelKey: 'nav.settings',
        label: 'Settings',
        children: [
            { path: '/settings', icon: Settings, labelKey: 'nav.general_settings', label: 'General Settings' },
            { path: '/settings/system', icon: SettingsIcon, labelKey: 'nav.system_settings', label: 'System Settings' },
            { path: '/settings/academic', icon: GraduationCap, labelKey: 'nav.academic_setup', label: 'Academic Setup' },
        ]
    },
    { path: '/parent-portal', icon: Users, labelKey: 'nav.parent_portal', label: 'Parent Portal' },
    {
        icon: BarChart3,
        labelKey: 'nav.admin',
        label: 'Admin',
        children: [
            { path: '/admin/audit-logs', icon: FileText, labelKey: 'nav.audit_logs', label: 'Audit Logs' },
            { path: '/users/manage', icon: Users, labelKey: 'nav.user_management', label: 'User Management' },
        ]
    },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
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

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-logo">
                    <GraduationCap size={32} style={{ color: 'var(--color-primary-600)' }} />
                    <span>NucleIQ</span>
                </h1>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
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
                                    <ChevronDown size={16} className="sidebar-chevron" />
                                ) : (
                                    <ChevronRight size={16} className="sidebar-chevron" />
                                )}
                            </button>

                            {isExpanded && item.children && (
                                <div className="sidebar-submenu">
                                    {item.children.map((child) => {
                                        const ChildIcon = child.icon;
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
