// Placeholder screens - Replace with full implementations

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface PlaceholderScreenProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    message?: string;
}

const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title, icon, message }) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Ionicons name={icon} size={60} color={theme.colors.primary} />
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
                <Text style={styles.message}>{message || 'This module is being set up. Check back soon!'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    title: { fontSize: 22, fontWeight: '600', marginTop: 20, textAlign: 'center' },
    message: { fontSize: 14, color: '#6B7280', marginTop: 10, textAlign: 'center' },
});

// Dashboard Screens
export const NotificationsScreen = () => <PlaceholderScreen title="Notifications" icon="notifications-outline" />;
export const ProfileScreen = () => <PlaceholderScreen title="My Profile" icon="person-outline" />;

// Student Screens
export const StudentDetailScreen = () => <PlaceholderScreen title="Student Details" icon="person-outline" />;
export const AddStudentScreen = () => <PlaceholderScreen title="Add Student" icon="person-add-outline" />;
export const EditStudentScreen = () => <PlaceholderScreen title="Edit Student" icon="create-outline" />;
export const StudentDocumentsScreen = () => <PlaceholderScreen title="Student Documents" icon="document-outline" />;
export const StudentRemarksScreen = () => <PlaceholderScreen title="Student Remarks" icon="chatbubble-outline" />;

// Attendance Screens
export const AttendanceReportsScreen = () => <PlaceholderScreen title="Attendance Reports" icon="bar-chart-outline" />;
export const QRScannerScreen = () => <PlaceholderScreen title="QR Scanner" icon="qr-code-outline" />;
export const AttendanceHistoryScreen = () => <PlaceholderScreen title="Attendance History" icon="time-outline" />;

// Fee Screens
export const FeeHistoryScreen = () => <PlaceholderScreen title="Payment History" icon="receipt-outline" />;
export const FeeDefaultersScreen = () => <PlaceholderScreen title="Fee Defaulters" icon="alert-circle-outline" />;
export const StudentLedgerScreen = () => <PlaceholderScreen title="Student Ledger" icon="document-text-outline" />;
export const PaymentReceiptScreen = () => <PlaceholderScreen title="Payment Receipt" icon="receipt-outline" />;

// Staff Screens
export const StaffListScreen = () => <PlaceholderScreen title="Staff List" icon="people-outline" />;
export const StaffDetailScreen = () => <PlaceholderScreen title="Staff Details" icon="person-outline" />;
export const AddStaffScreen = () => <PlaceholderScreen title="Add Staff" icon="person-add-outline" />;

// Academic Screens
export const TimetableScreen = () => <PlaceholderScreen title="Timetable" icon="time-outline" />;
export const ExamsScreen = () => <PlaceholderScreen title="Exams" icon="school-outline" />;
export const ResultEntryScreen = () => <PlaceholderScreen title="Result Entry" icon="create-outline" />;
export const AssignmentsScreen = () => <PlaceholderScreen title="Assignments" icon="clipboard-outline" />;
export const SubjectsScreen = () => <PlaceholderScreen title="Subjects" icon="book-outline" />;
export const GradesScreen = () => <PlaceholderScreen title="Grades" icon="ribbon-outline" />;
export const HomeworkScreen = () => <PlaceholderScreen title="Homework" icon="document-text-outline" />;
export const SyllabusScreen = () => <PlaceholderScreen title="Syllabus" icon="list-outline" />;
export const AcademicsIndexScreen = () => <PlaceholderScreen title="Academics" icon="school-outline" />;

// ID Card Screens
export const IDCardTemplatesScreen = () => <PlaceholderScreen title="ID Card Templates" icon="card-outline" />;
export const IDCardScannerScreen = () => <PlaceholderScreen title="ID Card Scanner" icon="qr-code-outline" />;
export const BulkGenerationScreen = () => <PlaceholderScreen title="Bulk Generation" icon="layers-outline" />;

// Communication Screens
export const NoticeboardScreen = () => <PlaceholderScreen title="Notice Board" icon="megaphone-outline" />;
export const MessagesScreen = () => <PlaceholderScreen title="Messages" icon="mail-outline" />;

// Finance Screens
export const FinanceDashboardScreen = () => <PlaceholderScreen title="Finance Dashboard" icon="pie-chart-outline" />;
export const ExpensesScreen = () => <PlaceholderScreen title="Expenses" icon="cash-outline" />;
export const VendorsScreen = () => <PlaceholderScreen title="Vendors" icon="business-outline" />;

// HR & Payroll Screens
export const LeaveManagementScreen = () => <PlaceholderScreen title="Leave Management" icon="calendar-outline" />;
export const PayslipsScreen = () => <PlaceholderScreen title="Payslips" icon="document-text-outline" />;

// Operations Screens
export const LibraryScreen = () => <PlaceholderScreen title="Library" icon="library-outline" />;
export const TransportScreen = () => <PlaceholderScreen title="Transport" icon="bus-outline" />;
export const HostelScreen = () => <PlaceholderScreen title="Hostel" icon="bed-outline" />;
export const InventoryScreen = () => <PlaceholderScreen title="Inventory" icon="cube-outline" />;

// CRM Screens
export const LeadBoardScreen = () => <PlaceholderScreen title="Lead Board" icon="trending-up-outline" />;

// Calendar Screen
export const CalendarScreen = () => <PlaceholderScreen title="Calendar" icon="calendar-outline" />;

// Tracker Screens
export const SalahTrackerScreen = () => <PlaceholderScreen title="Salah Tracker" icon="sunny-outline" />;
export const HabitTrackerScreen = () => <PlaceholderScreen title="Habit Tracker" icon="checkmark-circle-outline" />;

// Helpdesk Screen
export const HelpdeskScreen = () => <PlaceholderScreen title="Helpdesk" icon="help-circle-outline" />;

// Settings Screen
export const SettingsScreen = () => <PlaceholderScreen title="Settings" icon="settings-outline" />;

// Reports Screen
export const ReportsScreen = () => <PlaceholderScreen title="Reports" icon="bar-chart-outline" />;

export default PlaceholderScreen;
