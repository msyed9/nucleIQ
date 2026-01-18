import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Searchbar, FAB, Checkbox } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';

interface Homework {
    id: number;
    title: string;
    subject_name: string;
    teacher_name: string;
    description: string;
    due_date: string;
    assigned_date: string;
    is_completed: boolean;
    priority: 'low' | 'medium' | 'high';
    attachment_count: number;
}

const PRIORITY_COLORS = {
    low: { bg: '#D1FAE5', border: '#10B981', text: '#059669' },
    medium: { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' },
    high: { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' },
};

const SUBJECT_COLORS: Record<string, string> = {
    'Mathematics': '#3B82F6',
    'English': '#8B5CF6',
    'Science': '#10B981',
    'Physics': '#F59E0B',
    'Chemistry': '#EF4444',
    'History': '#A855F7',
    'Geography': '#06B6D4',
};

const HomeworkScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => { loadHomework(); }, []);

    const loadHomework = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setHomework(getMockHomework());
        } finally { setLoading(false); }
    };

    const getMockHomework = (): Homework[] => [
        { id: 1, title: 'Complete Exercise 5.4', subject_name: 'Mathematics', teacher_name: 'Dr. Smith', description: 'Solve problems 1-20 from exercise 5.4', due_date: '2026-01-17', assigned_date: '2026-01-15', is_completed: false, priority: 'high', attachment_count: 1 },
        { id: 2, title: 'Write essay on freedom', subject_name: 'English', teacher_name: 'Ms. Johnson', description: 'Write a 500-word essay on the meaning of freedom', due_date: '2026-01-18', assigned_date: '2026-01-14', is_completed: false, priority: 'medium', attachment_count: 0 },
        { id: 3, title: 'Lab report submission', subject_name: 'Chemistry', teacher_name: 'Dr. Lee', description: 'Submit the completed lab report for yesterdays experiment', due_date: '2026-01-16', assigned_date: '2026-01-13', is_completed: true, priority: 'high', attachment_count: 2 },
        { id: 4, title: 'Read Chapter 8', subject_name: 'History', teacher_name: 'Mr. White', description: 'Read chapter 8 and prepare notes', due_date: '2026-01-20', assigned_date: '2026-01-16', is_completed: false, priority: 'low', attachment_count: 0 },
        { id: 5, title: 'Physics numericals', subject_name: 'Physics', teacher_name: 'Mr. Brown', description: 'Solve all numericals from chapter 6', due_date: '2026-01-17', assigned_date: '2026-01-12', is_completed: false, priority: 'high', attachment_count: 1 },
        { id: 6, title: 'Map work practice', subject_name: 'Geography', teacher_name: 'Ms. Green', description: 'Practice world map for upcoming test', due_date: '2026-01-19', assigned_date: '2026-01-15', is_completed: true, priority: 'medium', attachment_count: 0 },
    ];

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadHomework(); setRefreshing(false); }, []);

    const toggleComplete = (id: number) => {
        setHomework(prev => prev.map(h => h.id === id ? { ...h, is_completed: !h.is_completed } : h));
    };

    const getFilteredHomework = () => {
        let filtered = [...homework];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(h => h.title.toLowerCase().includes(query) || h.subject_name.toLowerCase().includes(query));
        }
        if (filter === 'pending') filtered = filtered.filter(h => !h.is_completed);
        if (filter === 'completed') filtered = filtered.filter(h => h.is_completed);
        return filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    };

    const getDueDateLabel = (dueDate: string) => {
        const date = parseISO(dueDate);
        if (isToday(date)) return { text: 'Today', urgent: true };
        if (isTomorrow(date)) return { text: 'Tomorrow', urgent: true };
        if (isPast(date)) return { text: 'Overdue', urgent: true };
        const days = differenceInDays(date, new Date());
        return { text: `${days} days left`, urgent: false };
    };

    const renderHomeworkCard = ({ item }: { item: Homework }) => {
        const priorityStyle = PRIORITY_COLORS[item.priority];
        const subjectColor = SUBJECT_COLORS[item.subject_name] || '#6B7280';
        const dueInfo = getDueDateLabel(item.due_date);

        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface, opacity: item.is_completed ? 0.7 : 1 }]}>
                <View style={[styles.priorityStrip, { backgroundColor: priorityStyle.border }]} />
                <View style={styles.cardContent}>
                    <View style={styles.checkboxCol}>
                        <Checkbox status={item.is_completed ? 'checked' : 'unchecked'} onPress={() => toggleComplete(item.id)} color={theme.colors.primary} />
                    </View>
                    <View style={styles.mainContent}>
                        <View style={styles.headerRow}>
                            <View style={[styles.subjectBadge, { backgroundColor: subjectColor + '20' }]}>
                                <Text style={[styles.subjectText, { color: subjectColor }]}>{item.subject_name}</Text>
                            </View>
                            {item.attachment_count > 0 && (
                                <View style={styles.attachmentBadge}>
                                    <Ionicons name="attach" size={14} color="#6B7280" />
                                    <Text style={styles.attachmentText}>{item.attachment_count}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.title, { color: theme.colors.onSurface, textDecorationLine: item.is_completed ? 'line-through' : 'none' }]}>{item.title}</Text>
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.footerRow}>
                            <View style={styles.teacherInfo}>
                                <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                                <Text style={styles.teacherText}>{item.teacher_name}</Text>
                            </View>
                            <View style={[styles.dueBadge, { backgroundColor: dueInfo.urgent && !item.is_completed ? '#FEE2E2' : '#F3F4F6' }]}>
                                <Ionicons name="time-outline" size={12} color={dueInfo.urgent && !item.is_completed ? '#DC2626' : '#6B7280'} />
                                <Text style={[styles.dueText, { color: dueInfo.urgent && !item.is_completed ? '#DC2626' : '#6B7280' }]}>{dueInfo.text}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Card>
        );
    };

    const filteredHomework = getFilteredHomework();
    const pendingCount = homework.filter(h => !h.is_completed).length;
    const completedCount = homework.filter(h => h.is_completed).length;

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar placeholder="Search homework..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} />

            <View style={styles.filterRow}>
                <TouchableOpacity style={[styles.filterBtn, filter === 'all' && { backgroundColor: theme.colors.primaryContainer }]} onPress={() => setFilter('all')}>
                    <Text style={[styles.filterText, filter === 'all' && { color: theme.colors.primary }]}>All ({homework.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filter === 'pending' && { backgroundColor: '#FEF3C7' }]} onPress={() => setFilter('pending')}>
                    <Text style={[styles.filterText, filter === 'pending' && { color: '#D97706' }]}>Pending ({pendingCount})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filter === 'completed' && { backgroundColor: '#D1FAE5' }]} onPress={() => setFilter('completed')}>
                    <Text style={[styles.filterText, filter === 'completed' && { color: '#059669' }]}>Done ({completedCount})</Text>
                </TouchableOpacity>
            </View>

            {filteredHomework.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name={filter === 'completed' ? 'checkmark-circle-outline' : 'document-text-outline'} size={60} color="#9CA3AF" />
                    <Text style={styles.emptyText}>{filter === 'completed' ? 'No completed homework' : 'No pending homework'}</Text>
                    <Text style={styles.emptySubtext}>{filter === 'completed' ? 'Complete some tasks to see them here' : 'Great job! All caught up!'}</Text>
                </View>
            ) : (
                <FlatList data={filteredHomework} renderItem={renderHomeworkCard} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#6B7280' },
    searchBar: { margin: 15, marginBottom: 10, elevation: 2, borderRadius: 12 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, gap: 10 },
    filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    listContent: { padding: 15, paddingTop: 5, paddingBottom: 40 },
    card: { marginBottom: 12, borderRadius: 16, elevation: 2, overflow: 'hidden' },
    priorityStrip: { height: 4 },
    cardContent: { flexDirection: 'row', padding: 12 },
    checkboxCol: { justifyContent: 'flex-start', marginRight: 8 },
    mainContent: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    subjectBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    subjectText: { fontSize: 11, fontWeight: '600' },
    attachmentBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    attachmentText: { fontSize: 11, color: '#6B7280', marginLeft: 2 },
    title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    description: { fontSize: 13, color: '#6B7280', marginBottom: 8, lineHeight: 18 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teacherInfo: { flexDirection: 'row', alignItems: 'center' },
    teacherText: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
    dueBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    dueText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#4B5563', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});

export default HomeworkScreen;
