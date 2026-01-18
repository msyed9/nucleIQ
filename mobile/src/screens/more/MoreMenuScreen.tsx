import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, useTheme, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface MenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    screen: string;
    color: string;
}

const menuSections: MenuSection[] = [
    {
        title: 'Staff & HR',
        items: [
            { label: 'My Attendance QR', icon: 'qr-code-outline', screen: 'StaffQRGenerator', color: '#10B981' },
            { label: 'Staff List', icon: 'people-outline', screen: 'StaffList', color: '#3B82F6' },
            { label: 'Leave Management', icon: 'calendar-outline', screen: 'LeaveManagement', color: '#10B981' },
            { label: 'Payslips', icon: 'document-text-outline', screen: 'Payslips', color: '#8B5CF6' },
        ],
    },
    {
        title: 'Academics',
        items: [
            { label: 'All Academics', icon: 'school-outline', screen: 'Academics', color: '#6366F1' },
            { label: 'Timetable', icon: 'time-outline', screen: 'Timetable', color: '#F59E0B' },
            { label: 'Subjects', icon: 'book-outline', screen: 'Subjects', color: '#8B5CF6' },
            { label: 'Syllabus', icon: 'list-outline', screen: 'Syllabus', color: '#06B6D4' },
            { label: 'Exams', icon: 'document-text-outline', screen: 'Exams', color: '#EF4444' },
            { label: 'Grades', icon: 'ribbon-outline', screen: 'Grades', color: '#10B981' },
            { label: 'Assignments', icon: 'clipboard-outline', screen: 'Assignments', color: '#EC4899' },
            { label: 'Homework', icon: 'create-outline', screen: 'Homework', color: '#3B82F6' },
        ],
    },
    {
        title: 'ID Cards',
        items: [
            { label: 'Templates', icon: 'card-outline', screen: 'IDCardTemplates', color: '#8B5CF6' },
            { label: 'QR Scanner', icon: 'qr-code-outline', screen: 'IDCardScanner', color: '#10B981' },
            { label: 'Bulk Generate', icon: 'layers-outline', screen: 'BulkGeneration', color: '#F59E0B' },
        ],
    },
    {
        title: 'Communication',
        items: [
            { label: 'Notice Board', icon: 'megaphone-outline', screen: 'Noticeboard', color: '#3B82F6' },
            { label: 'Messages', icon: 'mail-outline', screen: 'Messages', color: '#EC4899' },
        ],
    },
    {
        title: 'Finance',
        items: [
            { label: 'Dashboard', icon: 'pie-chart-outline', screen: 'FinanceDashboard', color: '#10B981' },
            { label: 'Expenses', icon: 'receipt-outline', screen: 'Expenses', color: '#EF4444' },
            { label: 'Vendors', icon: 'business-outline', screen: 'Vendors', color: '#8B5CF6' },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Library', icon: 'library-outline', screen: 'Library', color: '#F59E0B' },
            { label: 'Transport', icon: 'bus-outline', screen: 'Transport', color: '#3B82F6' },
            { label: 'Hostel', icon: 'bed-outline', screen: 'Hostel', color: '#10B981' },
            { label: 'Inventory', icon: 'cube-outline', screen: 'Inventory', color: '#8B5CF6' },
        ],
    },
    {
        title: 'Wellbeing',
        items: [
            { label: 'Salah Tracker', icon: 'sunny-outline', screen: 'SalahTracker', color: '#F59E0B' },
            { label: 'Habit Tracker', icon: 'checkmark-circle-outline', screen: 'HabitTracker', color: '#10B981' },
        ],
    },
    {
        title: 'Other',
        items: [
            { label: 'Website Builder', icon: 'globe-outline', screen: 'WebsiteBuilder', color: '#2563EB' },
            { label: 'Calendar', icon: 'calendar-number-outline', screen: 'Calendar', color: '#3B82F6' },
            { label: 'CRM Leads', icon: 'trending-up-outline', screen: 'LeadBoard', color: '#EC4899' },
            { label: 'Helpdesk', icon: 'help-circle-outline', screen: 'Helpdesk', color: '#8B5CF6' },
            { label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports', color: '#F59E0B' },
            { label: 'Settings', icon: 'settings-outline', screen: 'Settings', color: '#6B7280' },
        ],
    },
];

const MoreMenuScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();

    const handlePress = (screen: string) => {
        navigation.navigate(screen as never);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            showsVerticalScrollIndicator={false}
        >
            {menuSections.map((section, sectionIndex) => (
                <View key={section.title} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                        {section.title}
                    </Text>
                    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                        {section.items.map((item, itemIndex) => (
                            <React.Fragment key={item.label}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => handlePress(item.screen)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                                        <Ionicons name={item.icon} size={22} color={item.color} />
                                    </View>
                                    <Text style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
                                        {item.label}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                                {itemIndex < section.items.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </Card>
                </View>
            ))}
            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 15,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 12,
    },
});

export default MoreMenuScreen;
