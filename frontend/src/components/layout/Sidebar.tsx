/**
 * Sidebar Navigation - Redesigned with NucleIQ Design System
 * Modern sidebar with Lucide icons and collapsible sections
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
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
    Globe,
    Shield,
    Building2,
    Utensils,
    ShieldCheck,
    Ticket,
    Receipt,
    Landmark,
    FileCheck,
    Heart,
    Sunrise,
    Activity,
    Palette
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
        icon: Heart,
        labelKey: 'nav.wellbeing',
        label: 'Wellbeing',
        children: [
            { path: '/trackers/salah', icon: Sunrise, labelKey: 'nav.salah_tracker', label: 'Salah Tracker' },
            { path: '/trackers/habits', icon: Activity, labelKey: 'nav.habit_tracker', label: 'Habit Tracker' },
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
            { path: '/finance/petty-cash', icon: Receipt, labelKey: 'nav.petty_cash', label: 'Petty Cash' },
            { path: '/finance/reconciliation', icon: Landmark, labelKey: 'nav.bank_reconciliation', label: 'Bank Reconciliation' },
            { path: '/finance/reports', icon: TrendingDown, labelKey: 'nav.financial_reports', label: 'Financial Reports' },
        ]
    },
    {
        icon: Package,
        labelKey: 'nav.operations',
        label: 'Operations',
        children: [
            { path: '/inventory/stock', icon: Package, labelKey: 'nav.inventory_stock', label: 'Stock Management' },
            { path: '/inventory/items', icon: List, labelKey: 'nav.inventory_items', label: 'Items & Products' },
            { path: '/inventory/vendors', icon: Users, labelKey: 'nav.inventory_vendors', label: 'Vendor Management' },
            { path: '/inventory/orders', icon: FileText, labelKey: 'nav.purchase_orders', label: 'Purchase Orders' },
            { path: '/transport', icon: Truck, labelKey: 'nav.transport', label: 'Transport' },
            { path: '/hostel/allocations', icon: Home, labelKey: 'nav.hostel_allocations', label: 'Hostel Allocations' },
            { path: '/hostel/mess', icon: Utensils, labelKey: 'nav.mess_management', label: 'Mess Management' },
            { path: '/hostel/complaints', icon: AlertTriangle, labelKey: 'nav.hostel_complaints', label: 'Hostel Complaints' },
            { path: '/library/books', icon: BookOpen, labelKey: 'nav.library_books', label: 'Library Books' },
            { path: '/library/circulation', icon: ClipboardCheck, labelKey: 'nav.library_circulation', label: 'Circulation' },
            { path: '/library/members', icon: Users, labelKey: 'nav.library_members', label: 'Library Members' },
            { path: '/security/visitors', icon: UserCheck, labelKey: 'nav.visitors', label: 'Visitor Log' },
            { path: '/security/gate-passes', icon: Ticket, labelKey: 'nav.gate_passes', label: 'Gate Passes' },
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
            { path: '/alumni/directory', icon: Users, labelKey: 'nav.alumni_directory', label: 'Alumni Directory' },
            { path: '/alumni/jobs', icon: Briefcase, labelKey: 'nav.alumni_jobs', label: 'Job Board' },
            { path: '/alumni/events', icon: Calendar, labelKey: 'nav.alumni_events', label: 'Events' },
            { path: '/placement/drives', icon: Building2, labelKey: 'nav.placement_drives', label: 'Placement Drives' },
            { path: '/placement/applications', icon: FileCheck, labelKey: 'nav.placement_applications', label: 'Applications' },
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
            { path: '/settings/branding', icon: Palette, labelKey: 'nav.branding', label: 'Branding' },
            { path: '/settings/permissions', icon: Shield, labelKey: 'nav.permissions', label: 'Permissions' },
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
    const { branding, loading } = useTenantBranding();
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
                        <GraduationCap size={32} style={{ color: 'var(--color-primary-600)' }} />
                    )}
                    <span>{branding?.tenant_name || 'NucleIQ'}</span>
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
