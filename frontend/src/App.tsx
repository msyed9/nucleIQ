import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import StudentList from './pages/students/StudentList';
import AddStudent from './pages/students/AddStudent';
import Student360 from './pages/students/Student360';
import RemarksManager from './pages/students/RemarksManager';
import DocumentManager from './pages/students/DocumentManager';
import IDCardDesigner from './pages/idcards/Designer';
import StaffList from './pages/staff/StaffList';
import AddStaff from './pages/staff/AddStaff';
import CollectFees from './pages/fees/CollectFees';
import FeeConfiguration from './pages/fees/FeeConfiguration';
import MarkAttendance from './pages/attendance/MarkAttendance';
import UserList from './pages/users/UserList';
import UserManagement from './pages/users/UserManagement';
import ExpenseManager from './pages/finance/ExpenseManager';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import Settings from './pages/settings/Settings';
import AcademicSetup from './pages/settings/AcademicSetup';
import TimetableBuilder from './pages/timetable/TimetableBuilder';
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

// Phase 5 Imports
import AlumniPortal from './pages/alumni/AlumniPortal';
import LiveClassJoin from './pages/lms/LiveClassJoin';
import Headquarters from './pages/group/Headquarters';

// Phase 6 Imports
import CertificateTemplates from './pages/admin/CertificateTemplates';
import GuardScanner from './pages/security/GuardScanner';
import DriveDashboard from './pages/placement/DriveDashboard';
import TicketBoard from './pages/helpdesk/TicketBoard';

// Extra Module Imports
import AssignmentList from './pages/assignments/AssignmentList';
import LeaveManage from './pages/hr/LeaveManage';
import PayslipView from './pages/payroll/PayslipView';
import LeadKanbanBoard from './pages/crm/LeadKanbanBoard';
import WebsiteBuilder from './pages/cms/WebsiteBuilder';
import ExamScheduler from './pages/exams/ExamScheduler';
import NoticeBoard from './pages/communication/NoticeBoard';

// New pages added
import AttendanceAggregates from './pages/attendance/AttendanceAggregates';
import StudentsApiList from './pages/students/StudentsList';
import TransportAllocations from './pages/transport/TransportAllocations';
import LibraryBooks from './pages/library/LibraryBooks';
import HelpdeskTickets from './pages/helpdesk/HelpdeskTickets';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import BillingManagement from './pages/billing/BillingManagement';
import StaffProfile from './pages/staff/StaffProfile';

// Import i18n configuration
import './i18n';

// Import Preferences Context
import { PreferencesProvider } from './contexts/PreferencesContext';

// Import theme CSS
import './styles/theme.css';

// Import Protected Route
import { ProtectedRoute } from './components/auth/SimpleProtectedRoute';

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
                <Routes>
                    {/* Public Routes - No authentication required */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Login />} />

                    {/* Protected Routes - Single PreferencesProvider wrapper */}
                    <Route path="/*" element={
                        <ProtectedRoute>
                            <PreferencesProvider>
                                <Routes>
                                    <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                                    {/* Student routes - specific routes MUST come before dynamic :id route */}
                                    <Route path="/students/add" element={<Layout><AddStudent /></Layout>} />
                                    <Route path="/students/remarks" element={<Layout><RemarksManager /></Layout>} />
                                    <Route path="/students/documents" element={<Layout><DocumentManager /></Layout>} />
                                    <Route path="/students/:id" element={<Layout><Student360 /></Layout>} />
                                    <Route path="/students" element={<Layout><StudentList /></Layout>} />
                                    <Route path="/students/api" element={<Layout><StudentsApiList /></Layout>} />
                                    {/* ID Cards routes */}
                                    <Route path="/idcards/designer" element={<Layout><IDCardDesigner /></Layout>} />
                                    {/* Staff routes */}
                                    <Route path="/staff/add" element={<Layout><AddStaff /></Layout>} />
                                    <Route path="/staff/:id" element={<Layout><StaffProfile /></Layout>} />
                                    <Route path="/staff" element={<Layout><StaffList /></Layout>} />
                                    {/* Fees routes - specific routes before general */}
                                    <Route path="/fees/configure" element={<Layout><FeeConfiguration /></Layout>} />
                                    <Route path="/fees/collect" element={<Layout><CollectFees /></Layout>} />
                                    {/* Other routes */}
                                    <Route path="/attendance" element={<Layout><MarkAttendance /></Layout>} />
                                    <Route path="/attendance/aggregates" element={<Layout><AttendanceAggregates /></Layout>} />
                                    <Route path="/finance" element={<Layout><ExpenseManager /></Layout>} />
                                    <Route path="/reports" element={<Layout><ReportsDashboard /></Layout>} />
                                    {/* Settings routes - specific routes before general */}
                                    <Route path="/settings/academic" element={<Layout><AcademicSetup /></Layout>} />
                                    <Route path="/settings" element={<Layout><Settings /></Layout>} />
                                    {/* User routes - specific routes before general */}
                                    <Route path="/users/manage" element={<Layout><UserManagement /></Layout>} />
                                    <Route path="/users" element={<Layout><UserList /></Layout>} />
                                    {/* Timetable routes */}
                                    <Route path="/timetable/builder" element={<Layout><TimetableBuilder /></Layout>} />
                                    <Route path="/timetable/teacher" element={<Layout><TeacherView /></Layout>} />
                                    <Route path="/timetable/class" element={<Layout><ClassView /></Layout>} />

                                    {/* Academics & LMS */}
                                    <Route path="/assignments" element={<Layout><AssignmentList /></Layout>} />
                                    <Route path="/exams" element={<Layout><ExamScheduler /></Layout>} />
                                    <Route path="/lms/classes" element={<Layout><LiveClassJoin /></Layout>} />
                                    <Route path="/lms/digital" element={<Layout><DigitalResources /></Layout>} />

                                    {/* Operations */}
                                    <Route path="/library/catalog" element={<Layout><Catalog /></Layout>} />
                                    <Route path="/library/books" element={<Layout><LibraryBooks /></Layout>} />
                                    <Route path="/inventory/stock" element={<Layout><StockManager /></Layout>} />
                                    <Route path="/hostel" element={<Layout><HostelDashboard /></Layout>} />
                                    <Route path="/transport" element={<Layout><TransportFleet /></Layout>} />
                                    <Route path="/transport/allocations" element={<Layout><TransportAllocations /></Layout>} />
                                    <Route path="/communication" element={<Layout><NoticeBoard /></Layout>} />

                                    {/* Finance & HR */}
                                    <Route path="/hr/leaves" element={<Layout><LeaveManage /></Layout>} />
                                    <Route path="/payroll/payslips" element={<Layout><PayslipView /></Layout>} />

                                    {/* Business & Growth */}
                                    <Route path="/crm/leads" element={<Layout><LeadKanbanBoard /></Layout>} />
                                    <Route path="/alumni" element={<Layout><AlumniPortal /></Layout>} />
                                    <Route path="/cms/builder" element={<Layout><WebsiteBuilder /></Layout>} />

                                    {/* Character Trackers */}
                                    <Route path="/trackers/salah" element={<Layout><SalahTracker /></Layout>} />
                                    <Route path="/trackers/habits" element={<Layout><HabitBoard /></Layout>} />

                                    {/* Admin & Security */}
                                    <Route path="/admin/certificates" element={<Layout><CertificateTemplates /></Layout>} />
                                    <Route path="/security/scanner" element={<Layout><GuardScanner /></Layout>} />
                                    <Route path="/placement" element={<Layout><DriveDashboard /></Layout>} />
                                    <Route path="/helpdesk" element={<Layout><TicketBoard /></Layout>} />
                                    <Route path="/helpdesk/tickets" element={<Layout><HelpdeskTickets /></Layout>} />

                                    {/* Analytics & Billing */}
                                    <Route path="/analytics" element={<Layout><AnalyticsDashboard /></Layout>} />
                                    <Route path="/billing" element={<Layout><BillingManagement /></Layout>} />

                                    {/* enterprise */}
                                    <Route path="/group/hq" element={<Layout><Headquarters /></Layout>} />

                                    <Route path="/store" element={<Layout><ParentShop /></Layout>} />
                                </Routes>
                            </PreferencesProvider>
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
