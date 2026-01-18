import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Divider, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { attendanceAPI, classesAPI, sectionsAPI } from '../../services/api';
import Dropdown from '../../components/common/Dropdown';

interface AttendanceRecord {
    id: number;
    student_name: string;
    admission_number: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
    date: string;
}

const AttendanceHistoryScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const classesData = await classesAPI.getAll();
            setClasses(classesData.results || classesData || []);

            // For now, let's load some mock history or fetch from API if available
            // In a real app, this would be attendanceAPI.getHistory({ class_id: selectedClass })
            const mockHistory: AttendanceRecord[] = [
                { id: 1, student_name: 'John Doe', admission_number: 'ADM001', status: 'present', date: format(new Date(), 'yyyy-MM-dd') },
                { id: 2, student_name: 'Jane Smith', admission_number: 'ADM002', status: 'absent', date: format(new Date(), 'yyyy-MM-dd') },
                { id: 3, student_name: 'Mike Ross', admission_number: 'ADM003', status: 'late', date: format(new Date(), 'yyyy-MM-dd') },
                { id: 4, student_name: 'Rachel Zane', admission_number: 'ADM004', status: 'present', date: format(new Date(), 'yyyy-MM-dd') },
                { id: 5, student_name: 'Harvey Specter', admission_number: 'ADM005', status: 'present', date: format(new Date(), 'yyyy-MM-dd') },
            ];
            setHistory(mockHistory);
        } catch (error) {
            console.error('Failed to load attendance history:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return '#10B981';
            case 'absent': return '#EF4444';
            case 'late': return '#F59E0B';
            case 'half_day': return '#8B5CF6';
            default: return '#9CA3AF';
        }
    };

    const renderItem = ({ item }: { item: AttendanceRecord }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View style={styles.info}>
                    <Text style={styles.studentName}>{item.student_name}</Text>
                    <Text style={styles.admissionNo}>{item.admission_number}</Text>
                </View>
                <Chip
                    style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
                    textStyle={{ color: getStatusColor(item.status), fontWeight: 'bold' }}
                >
                    {item.status.toUpperCase()}
                </Chip>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Dropdown
                    label="Select Class"
                    value={selectedClass}
                    options={classes.map(c => ({ label: c.name, value: c.id }))}
                    onChange={setSelectedClass}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="time-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No history records found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 15 },
    list: { padding: 15, paddingTop: 0 },
    card: { marginBottom: 10, padding: 15, borderRadius: 12, elevation: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    info: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '600' },
    admissionNo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#9CA3AF' },
});

export default AttendanceHistoryScreen;
