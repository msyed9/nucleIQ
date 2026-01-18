import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

// More Module Screens - All modules accessible from this stack
import MoreMenuScreen from '../../screens/more/MoreMenuScreen';

// Staff
import StaffListScreen from '../../screens/staff/StaffListScreen';
import StaffDetailScreen from '../../screens/staff/StaffDetailScreen';
import AddStaffScreen from '../../screens/staff/AddStaffScreen';
import StaffQRGeneratorScreen from '../../screens/staff/StaffQRGeneratorScreen';

// Academics
import AcademicsIndexScreen from '../../screens/academics/AcademicsIndexScreen';
import TimetableScreen from '../../screens/academics/TimetableScreen';
import ExamsScreen from '../../screens/academics/ExamsScreen';
import ResultEntryScreen from '../../screens/academics/ResultEntryScreen';
import AssignmentsScreen from '../../screens/academics/AssignmentsScreen';
import SubjectsScreen from '../../screens/academics/SubjectsScreen';
import GradesScreen from '../../screens/academics/GradesScreen';
import HomeworkScreen from '../../screens/academics/HomeworkScreen';
import SyllabusScreen from '../../screens/academics/SyllabusScreen';

// ID Cards
import IDCardTemplatesScreen from '../../screens/idcards/IDCardTemplatesScreen';
import IDCardScannerScreen from '../../screens/idcards/IDCardScannerScreen';
import BulkGenerationScreen from '../../screens/idcards/BulkGenerationScreen';

// Communication
import NoticeboardScreen from '../../screens/communication/NoticeboardScreen';
import MessagesScreen from '../../screens/communication/MessagesScreen';

// Finance
import FinanceDashboardScreen from '../../screens/finance/FinanceDashboardScreen';
import ExpensesScreen from '../../screens/finance/ExpensesScreen';
import VendorsScreen from '../../screens/finance/VendorsScreen';

// HR & Payroll
import LeaveManagementScreen from '../../screens/hr/LeaveManagementScreen';
import PayslipsScreen from '../../screens/payroll/PayslipsScreen';

// Operations
import LibraryScreen from '../../screens/library/LibraryScreen';
import TransportScreen from '../../screens/transport/TransportScreen';
import HostelScreen from '../../screens/hostel/HostelScreen';
import InventoryScreen from '../../screens/inventory/InventoryScreen';

// CRM
import LeadBoardScreen from '../../screens/crm/LeadBoardScreen';

// Calendar
import CalendarScreen from '../../screens/calendar/CalendarScreen';

// Trackers
import SalahTrackerScreen from '../../screens/trackers/SalahTrackerScreen';
import HabitTrackerScreen from '../../screens/trackers/HabitTrackerScreen';

// Helpdesk
import HelpdeskScreen from '../../screens/helpdesk/HelpdeskScreen';

// Settings
import SettingsScreen from '../../screens/settings/SettingsScreen';

// Reports
import ReportsScreen from '../../screens/reports/ReportsScreen';

// CMS / Website Builder
import { WebsiteBuilderScreen, WebsiteEditorScreen } from '../../screens/cms';

export type MoreStackParamList = {
    MoreMenu: undefined;
    // Staff
    StaffList: undefined;
    StaffDetail: { staffId: number };
    AddStaff: undefined;
    StaffQRGenerator: undefined;
    // Academics
    Academics: undefined;
    Timetable: undefined;
    Exams: undefined;
    ResultEntry: { examId: number };
    Assignments: undefined;
    Subjects: undefined;
    Grades: undefined;
    Homework: undefined;
    Syllabus: undefined;
    // ID Cards
    IDCardTemplates: undefined;
    IDCardScanner: undefined;
    BulkGeneration: undefined;
    // Communication
    Noticeboard: undefined;
    Messages: undefined;
    // Finance
    FinanceDashboard: undefined;
    Expenses: undefined;
    Vendors: undefined;
    // HR & Payroll
    LeaveManagement: undefined;
    Payslips: undefined;
    // Operations
    Library: undefined;
    Transport: undefined;
    Hostel: undefined;
    Inventory: undefined;
    // CRM
    LeadBoard: undefined;
    // Calendar
    Calendar: undefined;
    // Trackers
    SalahTracker: undefined;
    HabitTracker: undefined;
    // Helpdesk
    Helpdesk: undefined;
    // Settings
    Settings: undefined;
    // Reports
    Reports: undefined;
    // CMS / Website Builder
    WebsiteBuilder: undefined;
    WebsiteEditor: { instanceId: number };
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreStack: React.FC = () => {
    const theme = useTheme();

    const screenOptions = {
        headerStyle: {
            backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
            fontWeight: '600' as const,
        },
    };

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'More' }} />

            {/* Staff */}
            <Stack.Screen name="StaffList" component={StaffListScreen} options={{ title: 'Staff' }} />
            <Stack.Screen name="StaffDetail" component={StaffDetailScreen} options={{ title: 'Staff Details' }} />
            <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ title: 'Add Staff' }} />
            <Stack.Screen
                name="StaffQRGenerator"
                component={StaffQRGeneratorScreen}
                options={{
                    title: 'My Attendance QR',
                    headerShown: false  // Screen has its own header
                }}
            />

            {/* Academics */}
            <Stack.Screen name="Academics" component={AcademicsIndexScreen} options={{ title: 'Academics' }} />
            <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable' }} />
            <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: 'Exams' }} />
            <Stack.Screen name="ResultEntry" component={ResultEntryScreen} options={{ title: 'Result Entry' }} />
            <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ title: 'Assignments' }} />
            <Stack.Screen name="Subjects" component={SubjectsScreen} options={{ title: 'Subjects' }} />
            <Stack.Screen name="Grades" component={GradesScreen} options={{ title: 'Grades & Results' }} />
            <Stack.Screen name="Homework" component={HomeworkScreen} options={{ title: 'Homework' }} />
            <Stack.Screen name="Syllabus" component={SyllabusScreen} options={{ title: 'Syllabus' }} />

            {/* ID Cards */}
            <Stack.Screen name="IDCardTemplates" component={IDCardTemplatesScreen} options={{ title: 'ID Card Templates' }} />
            <Stack.Screen name="IDCardScanner" component={IDCardScannerScreen} options={{ title: 'ID Card Scanner' }} />
            <Stack.Screen name="BulkGeneration" component={BulkGenerationScreen} options={{ title: 'Bulk Generation' }} />

            {/* Communication */}
            <Stack.Screen name="Noticeboard" component={NoticeboardScreen} options={{ title: 'Notice Board' }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />

            {/* Finance */}
            <Stack.Screen name="FinanceDashboard" component={FinanceDashboardScreen} options={{ title: 'Finance' }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
            <Stack.Screen name="Vendors" component={VendorsScreen} options={{ title: 'Vendors' }} />

            {/* HR & Payroll */}
            <Stack.Screen name="LeaveManagement" component={LeaveManagementScreen} options={{ title: 'Leave Management' }} />
            <Stack.Screen name="Payslips" component={PayslipsScreen} options={{ title: 'Payslips' }} />

            {/* Operations */}
            <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'Library' }} />
            <Stack.Screen name="Transport" component={TransportScreen} options={{ title: 'Transport' }} />
            <Stack.Screen name="Hostel" component={HostelScreen} options={{ title: 'Hostel' }} />
            <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />

            {/* CRM */}
            <Stack.Screen name="LeadBoard" component={LeadBoardScreen} options={{ title: 'Lead Board' }} />

            {/* Calendar */}
            <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendar' }} />

            {/* Trackers */}
            <Stack.Screen name="SalahTracker" component={SalahTrackerScreen} options={{ title: 'Salah Tracker' }} />
            <Stack.Screen name="HabitTracker" component={HabitTrackerScreen} options={{ title: 'Habit Tracker' }} />

            {/* Helpdesk */}
            <Stack.Screen name="Helpdesk" component={HelpdeskScreen} options={{ title: 'Helpdesk' }} />

            {/* Settings */}
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />

            {/* Reports */}
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />

            {/* CMS / Website Builder */}
            <Stack.Screen name="WebsiteBuilder" component={WebsiteBuilderScreen} options={{ title: 'Website Builder', headerShown: false }} />
            <Stack.Screen name="WebsiteEditor" component={WebsiteEditorScreen} options={{ title: 'Website Editor', headerShown: false }} />
        </Stack.Navigator>
    );
};

export default MoreStack;
