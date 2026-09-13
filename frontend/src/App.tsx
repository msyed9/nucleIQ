import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentListRefactored';
import AddStudent from './pages/students/AddStudent';
import EditStudent from './pages/students/EditStudent';
import Enrollments from './pages/students/Enrollments';
import Student360 from './pages/students/Student360';
import RemarksManager from './pages/students/RemarksManager';
import DocumentManager from './pages/students/DocumentManager';
import StudentAnalytics from './pages/students/StudentAnalytics';
import IDCardDesigner from './pages/idcards/Designer';
import StaffList from './pages/staff/StaffListRefactored';
import AddStaff from './pages/staff/AddStaff';
import CollectFees from './pages/fees/CollectFees';
import FeeConfiguration from './pages/fees/FeeConfigurationRefactored';
import MarkAttendance from './pages/attendance/MarkAttendanceRefactored';
import AttendanceAggregates from './pages/attendance/AttendanceAggregates';
import MobileCapture from './pages/attendance/MobileCapture';
import AttendanceReports from './pages/attendance/AttendanceReports';
import FaceEnrollment from './pages/attendance/FaceEnrollment';
import UserList from './pages/users/UserList';
import UserManagement from './pages/users/UserManagement';
import ExpenseManager from './pages/finance/ExpenseManager';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import Settings from './pages/settings/Settings';
import AcademicSetup from './pages/settings/AcademicSetup';
import ImportPreview from './pages/admin/ImportPreview';
import TimetableBuilder from './pages/timetable/TimetableBuilderRefactored';
import TimetableConfig from './pages/timetable/TimetableConfig';
import TeacherView from './pages/timetable/TeacherView';
import ClassView from './pages/timetable/ClassView';

// Phase 4 Imports
import Catalog from './pages/library/Catalog';
import DigitalResources from './pages/lms/DigitalResources';
import StockManager from './pages/inventory/StockManager';
import ParentShop from './pages/store/ParentShop';
import HostelDashboard from './pages/hostel/HostelDashboard';
import SalahTracker from './pages/trackers/SalahTracker';
import HabitBoard from './pages/trackers/HabitBoard';
import TransportFleet from './pages/transport/TransportFleet';
import FeeDefaulters from './pages/fees/FeeDefaulters';
import FeePaymentHistory from './pages/fees/FeePaymentHistory';
import AdvancePayments from './pages/fees/AdvancePayments';
import FeeRefunds from './pages/fees/FeeRefunds';
import PaymentHistory from './pages/fees/PaymentHistory';
import CategoryWiseReport from './pages/fees/CategoryWiseReport';
import StudentLedger from './pages/fees/StudentLedger';
import FinancialReports from './pages/finance/FinancialReports';
import LibraryManagement from './pages/library/LibraryManagement';

// Phase 4 Inventory Module Imports
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import ItemMaster from './pages/inventory/ItemMaster';
import StockTransactions from './pages/inventory/StockTransactions';
import InventoryReports from './pages/inventory/InventoryReports';

// Phase 3 Finance Module Imports
import ChartOfAccounts from './pages/finance/ChartOfAccounts';
import JournalEntries from './pages/finance/JournalEntries';
import VendorMaster from './pages/finance/VendorMaster';
import VendorPayments from './pages/finance/VendorPayments';
import SalaryPayments from './pages/finance/SalaryPayments';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import BudgetManagement from './pages/finance/BudgetManagement';
import BankReconciliation from './pages/finance/BankReconciliation';

// Phase 5 Imports
import AlumniPortal from './pages/alumni/AlumniPortal';
import AlumniDirectory from './pages/alumni/AlumniDirectory';
import AlumniEvents from './pages/alumni/AlumniEvents';
import LiveClassJoin from './pages/lms/LiveClassJoin';
import CourseList from './pages/lms/CourseList';
import CourseDetail from './pages/lms/CourseDetail';
import MyCourses from './pages/lms/MyCourses';
import CourseBuilder from './pages/lms/CourseBuilder';
import EnrollmentManagement from './pages/lms/EnrollmentManagement';
import QuizBuilder from './pages/lms/QuizBuilder';
import StudentProgress from './pages/lms/StudentProgress';
import DiscussionBoard from './pages/lms/DiscussionBoard';
import VideoLibrary from './pages/lms/VideoLibrary';
import CertificateViewer from './pages/lms/CertificateViewer';
import Headquarters from './pages/group/Headquarters';

// Phase 6 Imports
import CertificateTemplates from './pages/admin/CertificateTemplates';
import GuardScanner from './pages/security/GuardScanner';
import DriveDashboard from './pages/placement/DriveDashboard';
import RecruiterManagement from './pages/placement/RecruiterManagement';
import TicketBoard from './pages/helpdesk/TicketBoard';

// Extra Module Imports
import AssignmentList from './pages/assignments/AssignmentList';
import LeaveManage from './pages/hr/LeaveManage';
import LeaveTypeConfig from './pages/hr/LeaveTypeConfig';
import PayslipView from './pages/payroll/PayslipView';
import SalaryComponentConfig from './pages/payroll/SalaryComponentConfig';
import LeadKanbanBoard from './pages/crm/LeadKanbanBoard';
import WebsiteBuilder from './pages/cms/WebsiteBuilder';
import ExamScheduler from './pages/exams/ExamScheduler';
import ResultEntry from './pages/exams/ResultEntry';
import ResultAnalytics from './pages/exams/ResultAnalytics';
import QuestionBank from './pages/exams/QuestionBank';
import LearningOutcomes from './pages/exams/LearningOutcomes';
import OnlineExamination from './pages/exams/OnlineExamination';
import NoticeBoard from './pages/communication/NoticeBoard';
import MessageComposer from './pages/communication/MessageComposer';
import LeadConversion from './pages/crm/LeadConversion';
import OnlineAdmissionForm from './pages/crm/OnlineAdmissionForm';
import PlacementApplication from './pages/placement/PlacementApplication';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import RouteOptimization from './pages/transport/RouteOptimization';
import RoomAllocation from './pages/hostel/RoomAllocation';
import AssignmentSubmission from './pages/academics/AssignmentSubmission';
import AssignmentGrading from './pages/academics/AssignmentGrading';
import SubjectsList from './pages/academics/SubjectsList';
import Homework from './pages/academics/Homework';
import SyllabusProgress from './pages/academics/SyllabusProgress';
import Grades from './pages/academics/Grades';
import LeaveApproval from './pages/hr/LeaveApproval';
import SalaryStructure from './pages/payroll/SalaryStructure';
import LibraryMembers from './pages/library/LibraryMembers';
import VehicleMaintenance from './pages/transport/VehicleMaintenance';
import DigitalResourcesLibrary from './pages/library/DigitalResources';
import IDCardTemplateManager from './pages/idcards/TemplateManager';
import BulkGeneration from './pages/idcards/BulkGeneration';
import QRScanner from './pages/idcards/QRScanner';
import LibraryReports from './pages/library/LibraryReports';
import LibrarySettings from './pages/library/LibrarySettings';
import HostelFees from './pages/hostel/HostelFees';
import PurchaseOrders from './pages/inventory/PurchaseOrders';
import StockAdjustment from './pages/inventory/StockAdjustment';
import VendorManagement from './pages/inventory/VendorManagement';
import TemplateManager from './pages/communication/TemplateManager';
import DeliveryReports from './pages/communication/DeliveryReports';
import FollowupScheduler from './pages/crm/FollowupScheduler';
import JobBoard from './pages/alumni/JobBoard';
import EventRegistration from './pages/alumni/EventRegistration';
import DonationPortal from './pages/alumni/DonationPortal';
import CertificateRequest from './pages/certificates/CertificateRequest';
import PassRequest from './pages/security/PassRequest';
import PassApproval from './pages/security/PassApproval';
import CreateTicket from './pages/helpdesk/CreateTicket';

// Phase 6 - Staff Management Pages
import StaffDocuments from './pages/staff/StaffDocuments';
import StaffAttendance from './pages/staff/StaffAttendance';
import LeaveBalance from './pages/staff/LeaveBalance';
import LeaveApplications from './pages/staff/LeaveApplications';
import LeaveApprovalPage from './pages/staff/LeaveApproval';
import HealthRecords from './pages/staff/HealthRecords';
import TrainingManagement from './pages/staff/TrainingManagement';
import AppraisalManagement from './pages/staff/AppraisalManagement';
import MyAppraisal from './pages/staff/MyAppraisal';

// Phase 7 - Reports & Analytics Pages
import ReportBuilder from './pages/reports/ReportBuilder';
import AdvancedAnalytics from './pages/reports/AdvancedAnalytics';
import ScheduledReports from './pages/reports/ScheduledReports';

// Phase 8 - Communication & Notifications Pages
import NotificationCenter from './pages/notifications/NotificationCenter';
import EmailCampaigns from './pages/notifications/EmailCampaigns';
import SMSMessaging from './pages/notifications/SMSMessaging';

// Phase 10 - Settings & Customization
import SystemSettings from './pages/settings/SystemSettings';
import PermissionsMatrixPage from './pages/settings/PermissionsMatrix';
import RolesPermissions from './pages/settings/RolesPermissions';
import TenantBranding from './pages/settings/TenantBranding';
import DataMigration from './pages/settings/DataMigration';
import TenYearMigration from './pages/settings/TenYearMigration';

// Phase 11 - Search & Dashboard
import EnhancedDashboard from './pages/dashboard/EnhancedDashboard';

// Phase 12 - Additional Features
import ParentPortal from './pages/parent/ParentPortal';
import ParentLogin from './pages/parent/ParentLogin';
import ParentLayout from './components/layout/ParentLayout';
import AuditLogs from './pages/admin/AuditLogs';
import RecycleBin from './pages/admin/RecycleBin';
import ParentPortalManagement from './pages/admin/ParentPortalManagement';
import SiblingSync from './pages/admin/SiblingSync';

// New pages added
import TransportAllocations from './pages/transport/TransportAllocations';
import LibraryBooks from './pages/library/LibraryBooks';
import BookCopies from './pages/library/BookCopies';
import HelpdeskTickets from './pages/helpdesk/HelpdeskTickets';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import BillingManagement from './pages/billing/BillingManagement';
import StaffProfile from './pages/staff/StaffProfile';

// Dashboard & Leaderboard Pages
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import DashboardAdmin from './pages/admin/DashboardAdmin';

// Newly added for Sidebar Consistency
import PettyCash from './pages/finance/PettyCash';
import MessManagement from './pages/hostel/MessManagement';
import HostelComplaints from './pages/hostel/Complaints';
import ComplaintAnalytics from './pages/hostel/ComplaintAnalytics';
import LessonPlans from './pages/staffwork/LessonPlans';
import DailyUpdatesList from './pages/staffwork/DailyUpdatesList';
import DailyUpdateForm from './pages/staffwork/DailyUpdateForm';
import MyTasks from './pages/staffwork/MyTasks';
import ConsolidatedDashboard from './pages/staffwork/ConsolidatedDashboard';
import LibraryCirculation from './pages/library/LibraryCirculation';
import VisitorLog from './pages/security/VisitorLog';
import GatePasses from './pages/security/GatePasses';

// Calendar & Events
import SchoolCalendar from './pages/calendar/SchoolCalendar';
import HolidaysManagement from './pages/calendar/HolidaysManagement';
import EventsManagement from './pages/calendar/EventsManagement';

// Student Promotions
import StudentPromotions from './pages/students/StudentPromotions';

// Import i18n configuration
import './i18n';

// Import Preferences Context
import { PreferencesProvider } from './contexts/PreferencesContext';
import { TenantBrandingProvider } from './contexts/TenantBrandingContext';
import { IconSetProvider } from './contexts/IconSetContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Import theme CSS
import './styles/theme.css';

// Import Protected Route
import { ProtectedRoute } from './components/auth/SimpleProtectedRoute';

// Import ModuleGuard for route protection
import ModuleGuard from './components/auth/ModuleGuard';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Routes - No authentication required */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/parent/login" element={<ParentLogin />} />
                        <Route path="/admissions/apply" element={<OnlineAdmissionForm />} />
                        <Route path="/" element={<Login />} />

                        {/* Protected Routes - Single PreferencesProvider wrapper */}
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <TenantBrandingProvider>
                                    <IconSetProvider>
                                        <PreferencesProvider>
                                            <ThemeProvider>
                                                <Routes>
                                                    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                                                    {/* Student routes - specific routes MUST come before dynamic :id route */}
                                                    <Route path="/students/enrollments" element={<Layout><Enrollments /></Layout>} />
                                                    <Route path="/students/add" element={<Layout><AddStudent /></Layout>} />
                                                    <Route path="/students/:id/edit" element={<Layout><EditStudent /></Layout>} />
                                                    <Route path="/students/remarks" element={<Layout><RemarksManager /></Layout>} />
                                                    <Route path="/students/documents" element={<Layout><DocumentManager /></Layout>} />
                                                    <Route path="/students/:id" element={<Layout><Student360 /></Layout>} />
                                                    <Route path="/students" element={<Layout><StudentList /></Layout>} />
                                                    <Route path="/students/analytics" element={<Layout><StudentAnalytics /></Layout>} />
                                                    <Route path="/students/promotions" element={<Layout><StudentPromotions /></Layout>} />
                                                    {/* Calendar routes */}
                                                    <Route path="/calendar" element={<Layout><SchoolCalendar /></Layout>} />
                                                    <Route path="/calendar/holidays" element={<Layout><HolidaysManagement /></Layout>} />
                                                    <Route path="/calendar/events" element={<Layout><EventsManagement /></Layout>} />
                                                    {/* ID Cards routes */}
                                                    <Route path="/idcards/designer" element={<Layout><IDCardDesigner /></Layout>} />
                                                    <Route path="/idcards/templates" element={<Layout><IDCardTemplateManager /></Layout>} />
                                                    <Route path="/idcards/generate" element={<Layout><BulkGeneration /></Layout>} />
                                                    <Route path="/idcards/scanner" element={<Layout><QRScanner /></Layout>} />
                                                    {/* Staff routes */}
                                                    <Route path="/staff/add" element={<Layout><AddStaff /></Layout>} />
                                                    <Route path="/staff/documents" element={<Layout><StaffDocuments /></Layout>} />
                                                    <Route path="/staff/attendance" element={<Layout><StaffAttendance /></Layout>} />
                                                    <Route path="/staff/leave/balance" element={<Layout><LeaveBalance /></Layout>} />
                                                    <Route path="/staff/leave/applications" element={<Layout><LeaveApplications /></Layout>} />
                                                    <Route path="/staff/leave/approval" element={<Layout><LeaveApprovalPage /></Layout>} />
                                                    <Route path="/staff/health" element={<Layout><HealthRecords /></Layout>} />
                                                    <Route path="/staff/training" element={<Layout><TrainingManagement /></Layout>} />
                                                    <Route path="/staff/appraisal" element={<Layout><AppraisalManagement /></Layout>} />
                                                    <Route path="/staff/my-appraisal" element={<Layout><MyAppraisal /></Layout>} />
                                                    <Route path="/staff/:id" element={<Layout><StaffProfile /></Layout>} />
                                                    <Route path="/staff" element={<Layout><StaffList /></Layout>} />
                                                    {/* Fees routes - protected by ModuleGuard */}
                                                    <Route path="/fees/configure" element={<ModuleGuard moduleKey="fees"><Layout><FeeConfiguration /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/collect" element={<ModuleGuard moduleKey="fees"><Layout><CollectFees /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/defaulters" element={<ModuleGuard moduleKey="fees"><Layout><FeeDefaulters /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/history" element={<ModuleGuard moduleKey="fees"><Layout><FeePaymentHistory /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/advances" element={<ModuleGuard moduleKey="fees"><Layout><AdvancePayments /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/refunds" element={<ModuleGuard moduleKey="fees"><Layout><FeeRefunds /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/payment-history" element={<ModuleGuard moduleKey="fees"><Layout><PaymentHistory /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/reports/category" element={<ModuleGuard moduleKey="fees"><Layout><CategoryWiseReport /></Layout></ModuleGuard>} />
                                                    <Route path="/fees/ledger" element={<ModuleGuard moduleKey="fees"><Layout><StudentLedger /></Layout></ModuleGuard>} />
                                                    {/* Other routes */}
                                                    <Route path="/attendance" element={<Layout><MarkAttendance /></Layout>} />
                                                    <Route path="/attendance/aggregates" element={<Layout><AttendanceAggregates /></Layout>} />
                                                    <Route path="/attendance/mobile-capture" element={<Layout><MobileCapture /></Layout>} />
                                                    <Route path="/attendance/reports" element={<Layout><AttendanceReports /></Layout>} />
                                                    <Route path="/attendance/face-enrollment" element={<Layout><FaceEnrollment /></Layout>} />
                                                    {/* Finance Routes - protected by ModuleGuard */}
                                                    <Route path="/finance/dashboard" element={<ModuleGuard moduleKey="finance"><Layout><FinanceDashboard /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/chart-of-accounts" element={<ModuleGuard moduleKey="finance"><Layout><ChartOfAccounts /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/journal-entries" element={<ModuleGuard moduleKey="finance"><Layout><JournalEntries /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/vendors" element={<ModuleGuard moduleKey="finance"><Layout><VendorMaster /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/vendor-payments" element={<ModuleGuard moduleKey="finance"><Layout><VendorPayments /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/salary-payments" element={<ModuleGuard moduleKey="finance"><Layout><SalaryPayments /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/budgets" element={<ModuleGuard moduleKey="finance"><Layout><BudgetManagement /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/bank-reconciliation" element={<ModuleGuard moduleKey="finance"><Layout><BankReconciliation /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/reconciliation" element={<ModuleGuard moduleKey="finance"><Layout><BankReconciliation /></Layout></ModuleGuard>} /> {/* Sidebar Alias */}
                                                    <Route path="/finance/reports" element={<ModuleGuard moduleKey="finance"><Layout><FinancialReports /></Layout></ModuleGuard>} />
                                                    <Route path="/finance/petty-cash" element={<ModuleGuard moduleKey="finance"><Layout><PettyCash /></Layout></ModuleGuard>} />
                                                    <Route path="/finance" element={<ModuleGuard moduleKey="finance"><Layout><ExpenseManager /></Layout></ModuleGuard>} />

                                                    {/* Phase 7 - Reports & Analytics */}
                                                    <Route path="/reports/builder" element={<Layout><ReportBuilder /></Layout>} />
                                                    <Route path="/reports/analytics" element={<Layout><AdvancedAnalytics /></Layout>} />
                                                    <Route path="/reports/scheduled" element={<Layout><ScheduledReports /></Layout>} />
                                                    <Route path="/reports" element={<Layout><ReportsDashboard /></Layout>} />
                                                    {/* Settings routes - specific routes before general */}
                                                    <Route path="/settings/academic" element={<Layout><AcademicSetup /></Layout>} />
                                                    <Route path="/settings/branding" element={<Layout><TenantBranding /></Layout>} />
                                                    <Route path="/settings/system" element={<Layout><SystemSettings /></Layout>} />
                                                    <Route path="/settings/permissions" element={<Layout><PermissionsMatrixPage /></Layout>} />
                                                    <Route path="/settings/roles" element={<Layout><RolesPermissions /></Layout>} />
                                                    <Route path="/settings/data-management" element={<Layout><DataMigration /></Layout>} />
                                                    <Route path="/settings/data-management/import-preview" element={<Layout><ImportPreview /></Layout>} />
                                                    <Route path="/settings/data-migration" element={<Layout><DataMigration /></Layout>} /> {/* Legacy alias */}
                                                    <Route path="/settings/10-year-migration" element={<Layout><TenYearMigration /></Layout>} />
                                                    <Route path="/settings/10-year-migration/:tenantId" element={<Layout><TenYearMigration /></Layout>} />
                                                    <Route path="/settings" element={<Layout><Settings /></Layout>} />
                                                    {/* User routes - specific routes before general */}
                                                    <Route path="/users/manage" element={<Layout><UserManagement /></Layout>} />
                                                    <Route path="/users" element={<Layout><UserList /></Layout>} />
                                                    {/* Phase 11 & 12 routes */}
                                                    <Route path="/parent/portal" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    {/* Parent routes - ensure sidebar links have matching routes */}
                                                    <Route path="/parent/students" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    <Route path="/parent/attendance" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    <Route path="/parent/fees" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    <Route path="/parent/academics" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    <Route path="/parent/messages" element={<ParentLayout><ParentPortal /></ParentLayout>} />
                                                    <Route path="/admin/audit-logs" element={<Layout><AuditLogs /></Layout>} />
                                                    <Route path="/admin/recycle-bin" element={<Layout><RecycleBin /></Layout>} />
                                                    <Route path="/admin/parent-portal" element={<Layout><ParentPortalManagement /></Layout>} />
                                                    <Route path="/admin/sibling-sync" element={<Layout><SiblingSync /></Layout>} />
                                                    {/* Timetable routes */}
                                                    <Route path="/timetable/builder" element={<Layout><TimetableBuilder /></Layout>} />
                                                    <Route path="/timetable/config" element={<Layout><TimetableConfig /></Layout>} />
                                                    <Route path="/timetable/teacher" element={<Layout><TeacherView /></Layout>} />
                                                    <Route path="/timetable/class" element={<Layout><ClassView /></Layout>} />

                                                    {/* Academics & LMS */}
                                                    <Route path="/subjects" element={<Layout><SubjectsList /></Layout>} />
                                                    <Route path="/homework" element={<Layout><Homework /></Layout>} />
                                                    <Route path="/syllabus" element={<Layout><SyllabusProgress /></Layout>} />
                                                    <Route path="/grades" element={<Layout><Grades /></Layout>} />
                                                    <Route path="/assignments" element={<Layout><AssignmentList /></Layout>} />
                                                    <Route path="/assignments/submit" element={<Layout><AssignmentSubmission /></Layout>} />
                                                    <Route path="/assignments/grade" element={<Layout><AssignmentGrading /></Layout>} />
                                                    <Route path="/exams" element={<Layout><ExamScheduler /></Layout>} />
                                                    <Route path="/exams/results/entry" element={<Layout><ResultEntry /></Layout>} />
                                                    <Route path="/exams/results/analytics" element={<Layout><ResultAnalytics /></Layout>} />
                                                    <Route path="/exams/question-bank" element={<Layout><QuestionBank /></Layout>} />
                                                    <Route path="/exams/learning-outcomes" element={<Layout><LearningOutcomes /></Layout>} />
                                                    <Route path="/exams/online" element={<Layout><OnlineExamination /></Layout>} />
                                                    <Route path="/lms/classes" element={<Layout><LiveClassJoin /></Layout>} />
                                                    <Route path="/lms/digital" element={<Layout><DigitalResources /></Layout>} />
                                                    <Route path="/lms/courses" element={<Layout><CourseList /></Layout>} />
                                                    <Route path="/lms/courses/:courseId" element={<Layout><CourseDetail /></Layout>} />
                                                    <Route path="/lms/courses/:courseId/builder" element={<Layout><CourseBuilder /></Layout>} />
                                                    <Route path="/lms/my-courses" element={<Layout><MyCourses /></Layout>} />
                                                    <Route path="/lms/enrollments" element={<Layout><EnrollmentManagement /></Layout>} />
                                                    <Route path="/lms/quizzes/:quizId" element={<Layout><QuizBuilder /></Layout>} />
                                                    <Route path="/lms/quiz-builder" element={<Layout><QuizBuilder /></Layout>} />
                                                    <Route path="/lms/progress" element={<Layout><StudentProgress /></Layout>} />
                                                    <Route path="/lms/discussions" element={<Layout><DiscussionBoard /></Layout>} />
                                                    <Route path="/lms/discussions/:courseId" element={<Layout><DiscussionBoard /></Layout>} />
                                                    <Route path="/lms/videos" element={<Layout><VideoLibrary /></Layout>} />
                                                    <Route path="/lms/certificates" element={<Layout><CertificateViewer /></Layout>} />

                                                    {/* Operations */}
                                                    <Route path="/library/catalog" element={<Layout><Catalog /></Layout>} />
                                                    <Route path="/library/books/:bookId/copies" element={<Layout><BookCopies /></Layout>} />
                                                    <Route path="/library/books" element={<Layout><LibraryBooks /></Layout>} />
                                                    <Route path="/library/circulation" element={<Layout><LibraryCirculation /></Layout>} />
                                                    <Route path="/library/members" element={<Layout><LibraryMembers /></Layout>} />
                                                    <Route path="/library/digital-resources" element={<Layout><DigitalResourcesLibrary /></Layout>} />
                                                    <Route path="/library/reports" element={<Layout><LibraryReports /></Layout>} />
                                                    <Route path="/library/settings" element={<Layout><LibrarySettings /></Layout>} />

                                                    {/* Inventory Module - Complete */}
                                                    <Route path="/inventory/dashboard" element={<Layout><InventoryDashboard /></Layout>} />
                                                    <Route path="/inventory/items" element={<Layout><ItemMaster /></Layout>} />
                                                    <Route path="/inventory/transactions" element={<Layout><StockTransactions /></Layout>} />
                                                    <Route path="/inventory/reports" element={<Layout><InventoryReports /></Layout>} />
                                                    <Route path="/inventory/stock" element={<Layout><StockManager /></Layout>} />
                                                    <Route path="/inventory/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
                                                    <Route path="/inventory/orders" element={<Layout><PurchaseOrders /></Layout>} /> {/* Sidebar Alias */}
                                                    <Route path="/inventory/stock-adjustment" element={<Layout><StockAdjustment /></Layout>} />
                                                    <Route path="/inventory/vendors" element={<Layout><VendorManagement /></Layout>} />

                                                    <Route path="/hostel" element={<Layout><HostelDashboard /></Layout>} />
                                                    <Route path="/hostel/rooms" element={<Layout><RoomAllocation /></Layout>} />
                                                    <Route path="/hostel/allocations" element={<Layout><RoomAllocation /></Layout>} /> {/* Sidebar Alias */}
                                                    <Route path="/hostel/mess" element={<Layout><MessManagement /></Layout>} />
                                                    <Route path="/staffwork/lesson-plans" element={<Layout><LessonPlans /></Layout>} />
                                                    <Route path="/staffwork/daily-updates" element={<Layout><DailyUpdatesList /></Layout>} />
                                                    <Route path="/staffwork/daily-updates/new" element={<Layout><DailyUpdateForm /></Layout>} />
                                                    <Route path="/staffwork/my-tasks" element={<Layout><MyTasks /></Layout>} />
                                                    <Route path="/staffwork/consolidated" element={<Layout><ConsolidatedDashboard /></Layout>} />
                                                    <Route path="/hostel/complaints" element={<Layout><HostelComplaints /></Layout>} />
                                                    <Route path="/hostel/complaints/analytics" element={<Layout><ComplaintAnalytics /></Layout>} />
                                                    <Route path="/hostel/fees" element={<Layout><HostelFees /></Layout>} />
                                                    <Route path="/transport" element={<Layout><TransportFleet /></Layout>} />
                                                    <Route path="/transport/allocations" element={<Layout><TransportAllocations /></Layout>} />
                                                    <Route path="/transport/routes" element={<Layout><RouteOptimization /></Layout>} />
                                                    <Route path="/transport/maintenance" element={<Layout><VehicleMaintenance /></Layout>} />
                                                    <Route path="/communication" element={<Layout><NoticeBoard /></Layout>} />
                                                    <Route path="/communication/messages" element={<Layout><MessageComposer /></Layout>} />
                                                    <Route path="/communication/templates" element={<Layout><TemplateManager /></Layout>} />
                                                    <Route path="/communication/delivery-reports" element={<Layout><DeliveryReports /></Layout>} />

                                                    {/* Phase 8 - Notifications & Communication */}
                                                    <Route path="/notifications/center" element={<Layout><NotificationCenter /></Layout>} />
                                                    <Route path="/notifications/email" element={<Layout><EmailCampaigns /></Layout>} />
                                                    <Route path="/notifications/sms" element={<Layout><SMSMessaging /></Layout>} />

                                                    {/* Finance & HR */}
                                                    <Route path="/hr/leaves" element={<Layout><LeaveManage /></Layout>} />
                                                    <Route path="/hr/leave-approval" element={<Layout><LeaveApproval /></Layout>} />
                                                    <Route path="/hr/leave-types" element={<Layout><LeaveTypeConfig /></Layout>} />
                                                    <Route path="/payroll/payslips" element={<Layout><PayslipView /></Layout>} />
                                                    <Route path="/payroll/salary-structure" element={<Layout><SalaryStructure /></Layout>} />
                                                    <Route path="/payroll/components" element={<Layout><SalaryComponentConfig /></Layout>} />
                                                    <Route path="/payroll/dashboard" element={<Layout><PayrollDashboard /></Layout>} />

                                                    {/* Business & Growth */}
                                                    <Route path="/crm" element={<Layout><LeadKanbanBoard /></Layout>} />
                                                    <Route path="/crm/conversion" element={<Layout><LeadConversion /></Layout>} />
                                                    <Route path="/crm/followups" element={<Layout><FollowupScheduler /></Layout>} />
                                                    <Route path="/alumni" element={<Layout><AlumniPortal /></Layout>} />
                                                    <Route path="/alumni/directory" element={<Layout><AlumniDirectory /></Layout>} />
                                                    <Route path="/alumni/jobs" element={<Layout><JobBoard /></Layout>} />
                                                    <Route path="/alumni/events" element={<Layout><AlumniEvents /></Layout>} />
                                                    <Route path="/alumni/donations" element={<Layout><DonationPortal /></Layout>} />
                                                    <Route path="/cms/builder" element={<Layout><WebsiteBuilder /></Layout>} />
                                                    <Route path="/cms/website-builder" element={<Layout><WebsiteBuilder /></Layout>} />
                                                    <Route path="/cms/templates" element={<Layout><WebsiteBuilder /></Layout>} />

                                                    {/* Character Trackers */}
                                                    <Route path="/trackers/salah" element={<Layout><SalahTracker /></Layout>} />
                                                    <Route path="/trackers/habits" element={<Layout><HabitBoard /></Layout>} />

                                                    {/* Admin & Security */}
                                                    <Route path="/admin/certificates" element={<Layout><CertificateTemplates /></Layout>} />
                                                    <Route path="/security/scanner" element={<Layout><GuardScanner /></Layout>} />
                                                    <Route path="/security/visitors" element={<Layout><VisitorLog /></Layout>} />
                                                    <Route path="/security/gate-passes" element={<Layout><GatePasses /></Layout>} />
                                                    <Route path="/placement" element={<Layout><DriveDashboard /></Layout>} />
                                                    <Route path="/placement/drives" element={<Layout><DriveDashboard /></Layout>} /> {/* Sidebar Alias */}
                                                    <Route path="/placement/recruiters" element={<Layout><RecruiterManagement /></Layout>} />
                                                    <Route path="/placement/apply" element={<Layout><PlacementApplication /></Layout>} />
                                                    <Route path="/placement/applications" element={<Layout><PlacementApplication /></Layout>} /> {/* Sidebar Alias */}
                                                    <Route path="/certificates/request" element={<Layout><CertificateRequest /></Layout>} />
                                                    <Route path="/security/pass-request" element={<Layout><PassRequest /></Layout>} />
                                                    <Route path="/security/pass-approval" element={<Layout><PassApproval /></Layout>} />
                                                    <Route path="/helpdesk/create-ticket" element={<Layout><CreateTicket /></Layout>} />
                                                    <Route path="/helpdesk" element={<Layout><TicketBoard /></Layout>} />
                                                    <Route path="/helpdesk/tickets" element={<Layout><HelpdeskTickets /></Layout>} />

                                                    {/* Analytics, Dashboard & Billing */}
                                                    <Route path="/analytics" element={<Layout><AnalyticsDashboard /></Layout>} />
                                                    <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
                                                    <Route path="/admin/dashboard-settings" element={<Layout><DashboardAdmin /></Layout>} />
                                                    <Route path="/library" element={<Layout><LibraryManagement /></Layout>} />
                                                    <Route path="/billing" element={<Layout><BillingManagement /></Layout>} />

                                                    {/* enterprise */}
                                                    <Route path="/group/hq" element={<Layout><Headquarters /></Layout>} />

                                                    <Route path="/store" element={<Layout><ParentShop /></Layout>} />
                                                </Routes>
                                            </ThemeProvider>
                                        </PreferencesProvider>
                                    </IconSetProvider>
                                </TenantBrandingProvider>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
