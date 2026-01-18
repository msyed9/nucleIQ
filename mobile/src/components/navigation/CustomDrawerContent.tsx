import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text, Divider, useTheme, Avatar, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

interface MenuSection {
    title: string;
    items: MenuItem[];
}

interface MenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    screen: string;
    stack?: string;
}

const menuSections: MenuSection[] = [
    {
        title: 'Core',
        items: [
            { label: 'Dashboard', icon: 'home-outline', screen: 'DashboardTab' },
            { label: 'Students', icon: 'people-outline', screen: 'StudentsTab' },
            { label: 'Attendance', icon: 'calendar-outline', screen: 'AttendanceTab' },
            { label: 'Fees', icon: 'wallet-outline', screen: 'FeesTab' },
        ],
    },
    {
        title: 'Staff & HR',
        items: [
            { label: 'My Attendance QR', icon: 'qr-code-outline', screen: 'StaffQRGenerator', stack: 'MoreTab' },
            { label: 'Staff List', icon: 'person-outline', screen: 'StaffList', stack: 'MoreTab' },
            { label: 'Leave Management', icon: 'leaf-outline', screen: 'LeaveManagement', stack: 'MoreTab' },
            { label: 'Payslips', icon: 'document-text-outline', screen: 'Payslips', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Academics',
        items: [
            { label: 'Timetable', icon: 'time-outline', screen: 'Timetable', stack: 'MoreTab' },
            { label: 'Exams', icon: 'school-outline', screen: 'Exams', stack: 'MoreTab' },
            { label: 'Assignments', icon: 'clipboard-outline', screen: 'Assignments', stack: 'MoreTab' },
        ],
    },
    {
        title: 'ID Cards',
        items: [
            { label: 'Templates', icon: 'card-outline', screen: 'IDCardTemplates', stack: 'MoreTab' },
            { label: 'QR Scanner', icon: 'qr-code-outline', screen: 'IDCardScanner', stack: 'MoreTab' },
            { label: 'Bulk Generation', icon: 'layers-outline', screen: 'BulkGeneration', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Communication',
        items: [
            { label: 'Notice Board', icon: 'megaphone-outline', screen: 'Noticeboard', stack: 'MoreTab' },
            { label: 'Messages', icon: 'mail-outline', screen: 'Messages', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Finance',
        items: [
            { label: 'Finance Dashboard', icon: 'stats-chart-outline', screen: 'FinanceDashboard', stack: 'MoreTab' },
            { label: 'Expenses', icon: 'receipt-outline', screen: 'Expenses', stack: 'MoreTab' },
            { label: 'Vendors', icon: 'business-outline', screen: 'Vendors', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Library', icon: 'library-outline', screen: 'Library', stack: 'MoreTab' },
            { label: 'Transport', icon: 'bus-outline', screen: 'Transport', stack: 'MoreTab' },
            { label: 'Hostel', icon: 'bed-outline', screen: 'Hostel', stack: 'MoreTab' },
            { label: 'Inventory', icon: 'cube-outline', screen: 'Inventory', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Growth',
        items: [
            { label: 'Lead Board', icon: 'trending-up-outline', screen: 'LeadBoard', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Wellbeing',
        items: [
            { label: 'Salah Tracker', icon: 'sunny-outline', screen: 'SalahTracker', stack: 'MoreTab' },
            { label: 'Habit Tracker', icon: 'checkmark-circle-outline', screen: 'HabitTracker', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Website',
        items: [
            { label: 'Website Builder', icon: 'globe-outline', screen: 'WebsiteBuilder', stack: 'MoreTab' },
        ],
    },
    {
        title: 'Other',
        items: [
            { label: 'Calendar', icon: 'calendar-number-outline', screen: 'Calendar', stack: 'MoreTab' },
            { label: 'Helpdesk', icon: 'help-circle-outline', screen: 'Helpdesk', stack: 'MoreTab' },
            { label: 'Reports', icon: 'bar-chart-outline', screen: 'Reports', stack: 'MoreTab' },
            { label: 'Settings', icon: 'settings-outline', screen: 'Settings', stack: 'MoreTab' },
        ],
    },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { navigation } = props;
    const theme = useTheme();
    const { isDark, toggleTheme } = useAppTheme();
    const { user, logout } = useAuth();

    const handleNavigation = (item: MenuItem) => {
        if (item.stack) {
            navigation.navigate('MainTabs', {
                screen: item.stack,
                params: {
                    screen: item.screen,
                },
            });
        } else {
            navigation.navigate('MainTabs', { screen: item.screen });
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
            {/* User Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <Avatar.Text
                    size={60}
                    label={getInitials(user?.full_name || user?.first_name)}
                    style={{ backgroundColor: theme.colors.tertiary }}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.full_name || `${user?.first_name} ${user?.last_name}`}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    {user?.tenant_name && (
                        <Text style={styles.tenantName}>{user.tenant_name}</Text>
                    )}
                </View>
            </View>

            {/* Menu Sections */}
            <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
                {menuSections.map((section, sectionIndex) => (
                    <View key={section.title}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                            {section.title}
                        </Text>
                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.menuItem}
                                onPress={() => handleNavigation(item)}
                            >
                                <Ionicons
                                    name={item.icon}
                                    size={22}
                                    color={theme.colors.onSurface}
                                />
                                <Text style={[styles.menuLabel, { color: theme.colors.onSurface }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {sectionIndex < menuSections.length - 1 && (
                            <Divider style={styles.divider} />
                        )}
                    </View>
                ))}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.colors.outline }]}>
                <View style={styles.themeToggle}>
                    <Ionicons
                        name={isDark ? 'moon' : 'sunny'}
                        size={22}
                        color={theme.colors.onSurface}
                    />
                    <Text style={[styles.themeLabel, { color: theme.colors.onSurface }]}>
                        Dark Mode
                    </Text>
                    <Switch value={isDark} onValueChange={toggleTheme} />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 15,
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    userEmail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    tenantName: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    menuContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 15,
        marginBottom: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    menuLabel: {
        fontSize: 15,
        marginLeft: 15,
        fontWeight: '500',
    },
    divider: {
        marginVertical: 10,
    },
    footer: {
        padding: 15,
        borderTopWidth: 1,
    },
    themeToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    themeLabel: {
        fontSize: 15,
        marginLeft: 15,
        flex: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 5,
    },
    logoutText: {
        fontSize: 15,
        marginLeft: 15,
        color: '#EF4444',
        fontWeight: '500',
    },
});

export default CustomDrawerContent;
