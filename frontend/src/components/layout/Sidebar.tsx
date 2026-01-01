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
    LayoutTemplate
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
        ]
    },
    { path: '/reports', icon: BarChart3, labelKey: 'nav.reports', label: 'Reports' },
    { path: '/helpdesk', icon: HelpCircle, labelKey: 'nav.helpdesk', label: 'Helpdesk' },
    { path: '/settings', icon: Settings, labelKey: 'nav.settings', label: 'Settings' },
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
