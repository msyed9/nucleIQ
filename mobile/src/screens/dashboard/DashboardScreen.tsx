import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Text, Card, useTheme, Avatar, Badge, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface StatCard {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    change?: string;
}

const DashboardScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const { user } = useAuth();

    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        todayAttendance: 0,
        pendingFees: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardAPI.getStats();
            setStats({
                totalStudents: data.total_students || 1250,
                totalStaff: data.total_staff || 85,
                todayAttendance: data.today_attendance || 92,
                pendingFees: data.pending_fees || 45000,
            });
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Use mock data on error
            setStats({
                totalStudents: 1250,
                totalStaff: 85,
                todayAttendance: 92,
                pendingFees: 45000,
            });
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const statCards: StatCard[] = [
        {
            title: 'Total Students',
            value: stats.totalStudents.toLocaleString(),
            icon: 'people',
            color: '#3B82F6',
            change: '+12 this month',
        },
        {
            title: 'Total Staff',
            value: stats.totalStaff,
            icon: 'person',
            color: '#10B981',
            change: '+2 this month',
        },
        {
            title: 'Today\'s Attendance',
            value: `${stats.todayAttendance}%`,
            icon: 'calendar-outline',
            color: '#8B5CF6',
        },
        {
            title: 'Pending Fees',
            value: `₹${(stats.pendingFees / 1000).toFixed(0)}K`,
            icon: 'wallet',
            color: '#F59E0B',
        },
    ];

    const quickActions = [
        { label: 'Mark\nAttendance', icon: 'checkbox-outline', screen: 'AttendanceTab', color: '#3B82F6' },
        { label: 'Collect\nFees', icon: 'wallet-outline', screen: 'FeesTab', color: '#10B981' },
        { label: 'Add\nStudent', icon: 'person-add-outline', screen: 'StudentsTab', params: { screen: 'AddStudent' }, color: '#8B5CF6' },
        { label: 'QR\nScanner', icon: 'qr-code-outline', screen: 'AttendanceTab', params: { screen: 'QRScanner' }, color: '#F59E0B' },
    ];

    const attendanceData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{
            data: [92, 88, 95, 91, 89, 94],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            strokeWidth: 2,
        }],
    };

    const feeData = [
        { name: 'Collected', population: 75, color: '#10B981', legendFontColor: '#7F7F7F' },
        { name: 'Pending', population: 18, color: '#F59E0B', legendFontColor: '#7F7F7F' },
        { name: 'Overdue', population: 7, color: '#EF4444', legendFontColor: '#7F7F7F' },
    ];

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#3B82F6',
        },
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* Welcome Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                    <Ionicons name="menu" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <Text style={styles.greeting}>
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!
                    </Text>
                    <Text style={styles.userName}>{user?.first_name || 'User'}</Text>
                </View>

                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications' as never)}
                >
                    <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                    <Badge style={styles.badge}>3</Badge>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {statCards.map((stat, index) => (
                    <Card key={stat.title} style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.statContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
                                <Ionicons name={stat.icon} size={24} color={stat.color} />
                            </View>
                            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{stat.value}</Text>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                            {stat.change && (
                                <Text style={[styles.statChange, { color: stat.color }]}>{stat.change}</Text>
                            )}
                        </View>
                    </Card>
                ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.label}
                            style={[styles.actionButton, { backgroundColor: `${action.color}10` }]}
                            onPress={() => navigation.navigate(action.screen as never, action.params as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                                <Ionicons name={action.icon as any} size={24} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Attendance Chart */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Weekly Attendance
                </Text>
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                    <LineChart
                        data={attendanceData}
                        width={width - 60}
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withInnerLines={false}
                        withOuterLines={false}
                    />
                </Card>
            </View>

            {/* Fee Collection Chart */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Fee Collection Status
                </Text>
                <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                    <PieChart
                        data={feeData}
                        width={width - 60}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </Card>
            </View>

            {/* Recent Activity */}
            <View style={[styles.section, { marginBottom: 30 }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Recent Activity
                </Text>
                <Card style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
                    {[
                        { icon: 'person-add', text: 'New student Rahul Kumar enrolled', time: '2 min ago', color: '#3B82F6' },
                        { icon: 'cash', text: '₹5,000 fee collected from Class 10', time: '15 min ago', color: '#10B981' },
                        { icon: 'megaphone', text: 'New notice published: Annual Day', time: '1 hour ago', color: '#8B5CF6' },
                        { icon: 'calendar', text: 'Attendance marked for Class 9-A', time: '2 hours ago', color: '#F59E0B' },
                    ].map((activity, index) => (
                        <View key={index} style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                                <Ionicons name={activity.icon as any} size={18} color={activity.color} />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={[styles.activityText, { color: theme.colors.onSurface }]}>
                                    {activity.text}
                                </Text>
                                <Text style={styles.activityTime}>{activity.time}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    menuButton: {
        padding: 5,
    },
    headerContent: {
        flex: 1,
        marginLeft: 15,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 2,
    },
    notificationButton: {
        position: 'relative',
        padding: 5,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 15,
        marginTop: -15,
    },
    statCard: {
        width: (width - 45) / 2,
        marginHorizontal: 5,
        marginVertical: 5,
        borderRadius: 16,
        elevation: 3,
    },
    statContent: {
        padding: 15,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statChange: {
        fontSize: 11,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: (width - 60) / 4,
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 16,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },
    chartCard: {
        borderRadius: 16,
        padding: 15,
        alignItems: 'center',
    },
    chart: {
        borderRadius: 16,
    },
    activityCard: {
        borderRadius: 16,
        padding: 15,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
        marginLeft: 12,
    },
    activityText: {
        fontSize: 14,
    },
    activityTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
});

export default DashboardScreen;
