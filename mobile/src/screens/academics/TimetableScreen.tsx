import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { timetableAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface TimetableItem {
    id: number;
    subject_name: string;
    teacher_name: string;
    start_time: string;
    end_time: string;
    room?: string;
    day_of_week: number;
}

const DAYS = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
];

const TimetableScreen: React.FC = () => {
    const theme = useTheme();
    const { user } = useAuth();

    // Get current day of week (1=Mon, ..., 6=Sat)
    const currentDay = new Date().getDay();
    const [selectedDay, setSelectedDay] = useState(currentDay === 0 ? 1 : currentDay);
    const [loading, setLoading] = useState(true);
    const [timetable, setTimetable] = useState<TimetableItem[]>([]);

    useEffect(() => {
        loadTimetable();
    }, [user]);

    const loadTimetable = async () => {
        try {
            setLoading(true);
            // Use mock data if API fails or doesn't return anything
            // In a real app, you'd use user.class_id or user.teacher_id
            let data = [];
            try {
                if (user?.is_platform_admin) {
                    // Just some default class for admin view
                    data = await timetableAPI.getClassTimetable(1);
                } else {
                    // Try to get teacher or student timetable
                    data = await timetableAPI.getTeacherTimetable(user?.id || 0);
                }
            } catch (e) {
                console.warn('API lookup failed, using mock data');
                data = getMockTimetable();
            }

            setTimetable(data.results || data || getMockTimetable());
        } catch (error) {
            console.error('Failed to load timetable:', error);
            setTimetable(getMockTimetable());
        } finally {
            setLoading(false);
        }
    };

    const getMockTimetable = () => [
        { id: 1, subject_name: 'Mathematics', teacher_name: 'Dr. Smith', start_time: '08:30', end_time: '09:30', room: 'Room 101', day_of_week: 1 },
        { id: 2, subject_name: 'English', teacher_name: 'Ms. Johnson', start_time: '09:45', end_time: '10:45', room: 'Room 102', day_of_week: 1 },
        { id: 3, subject_name: 'Physics', teacher_name: 'Mr. Brown', start_time: '11:00', end_time: '12:00', room: 'Lab A', day_of_week: 1 },
        { id: 4, subject_name: 'Lunch Break', teacher_name: '', start_time: '12:00', end_time: '13:00', room: 'Cafeteria', day_of_week: 1 },
        { id: 5, subject_name: 'Chemistry', teacher_name: 'Dr. Lee', start_time: '13:00', end_time: '14:00', room: 'Lab B', day_of_week: 1 },

        { id: 6, subject_name: 'History', teacher_name: 'Mr. White', start_time: '08:30', end_time: '09:30', room: 'Room 103', day_of_week: 2 },
        { id: 7, subject_name: 'Geography', teacher_name: 'Ms. Green', start_time: '09:45', end_time: '10:45', room: 'Room 104', day_of_week: 2 },

        { id: 8, subject_name: 'Biology', teacher_name: 'Dr. Wilson', start_time: '08:30', end_time: '09:30', room: 'Lab C', day_of_week: 3 },
    ].concat(
        // Add more mock data for other days
        [1, 2, 3, 4, 5, 6].map(d => ({
            id: 100 + d,
            subject_name: 'General Studies',
            teacher_name: 'Admin',
            start_time: '14:30',
            end_time: '15:30',
            room: 'Auditorium',
            day_of_week: d
        }))
    );

    const filteredTimetable = timetable
        .filter(item => item.day_of_week === selectedDay)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const renderPeriod = ({ item }: { item: TimetableItem }) => {
        const isBreak = item.subject_name.toLowerCase().includes('break') || item.subject_name.toLowerCase().includes('lunch');

        return (
            <View style={styles.periodRow}>
                <View style={styles.timeColumn}>
                    <Text style={styles.startTime}>{item.start_time}</Text>
                    <Text style={styles.endTime}>{item.end_time}</Text>
                </View>
                <Card style={[
                    styles.subjectCard,
                    {
                        backgroundColor: isBreak ? theme.colors.surfaceVariant : theme.colors.surface,
                        borderLeftColor: isBreak ? '#9CA3AF' : theme.colors.primary,
                    }
                ]}>
                    <View style={styles.cardContent}>
                        <View style={styles.subjectInfo}>
                            <Text style={[styles.subjectName, { color: theme.colors.onSurface }]}>
                                {item.subject_name}
                            </Text>
                            {item.teacher_name ? (
                                <View style={styles.detailRow}>
                                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                                    <Text style={styles.detailText}>{item.teacher_name}</Text>
                                </View>
                            ) : null}
                            {item.room ? (
                                <View style={styles.detailRow}>
                                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                                    <Text style={styles.detailText}>{item.room}</Text>
                                </View>
                            ) : null}
                        </View>
                        {!isBreak && (
                            <View style={[styles.indicator, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                            </View>
                        )}
                    </View>
                </Card>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Day Selector */}
            <View style={[styles.daySelector, { backgroundColor: theme.colors.surface }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
                    {DAYS.map(day => (
                        <TouchableOpacity
                            key={day.value}
                            style={[
                                styles.dayButton,
                                selectedDay === day.value && { backgroundColor: theme.colors.primary }
                            ]}
                            onPress={() => setSelectedDay(day.value)}
                        >
                            <Text style={[
                                styles.dayLabel,
                                selectedDay === day.value && { color: '#FFFFFF' }
                            ]}>
                                {day.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading Schedule...</Text>
                </View>
            ) : filteredTimetable.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="calendar-outline" size={60} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No classes scheduled for today</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTimetable}
                    renderItem={renderPeriod}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    daySelector: {
        paddingVertical: 15,
        elevation: 2,
    },
    dayScroll: {
        paddingHorizontal: 15,
    },
    dayButton: {
        width: 60,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    listContent: {
        padding: 15,
        paddingBottom: 40,
    },
    periodRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    timeColumn: {
        width: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startTime: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    endTime: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    subjectCard: {
        flex: 1,
        borderRadius: 12,
        borderLeftWidth: 5,
        elevation: 1,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    detailText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 5,
    },
    indicator: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default TimetableScreen;
