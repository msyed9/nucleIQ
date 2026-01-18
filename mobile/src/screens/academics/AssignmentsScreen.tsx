import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import {
    Text,
    Card,
    useTheme,
    ActivityIndicator,
    Chip,
    Searchbar,
    SegmentedButtons,
    FAB,
    Portal,
    Modal,
    Button,
    Divider,
    ProgressBar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject_name: string;
    grade_level_name: string;
    teacher_name: string;
    due_date: string;
    assigned_date: string;
    max_marks?: number;
    status: 'pending' | 'submitted' | 'graded' | 'overdue';
    submission_count?: number;
    total_students?: number;
    priority: 'low' | 'medium' | 'high';
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: '#D1FAE5', text: '#059669', border: '#10B981' },
    medium: { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' },
    high: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: '#DBEAFE', text: '#1D4ED8', icon: 'time-outline' },
    submitted: { bg: '#D1FAE5', text: '#059669', icon: 'checkmark-outline' },
    graded: { bg: '#E9D5FF', text: '#7C3AED', icon: 'ribbon-outline' },
    overdue: { bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle-outline' },
};

const SUBJECT_ICONS: Record<string, string> = {
    'Mathematics': 'calculator-outline',
    'English': 'book-outline',
    'Science': 'flask-outline',
    'Chemistry': 'beaker-outline',
    'History': 'library-outline',
    'Geography': 'globe-outline',
    'Computer Science': 'desktop-outline',
};

const AssignmentsScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => { loadAssignments(); }, []);
    useEffect(() => { applyFilters(); }, [assignments, searchQuery, filterStatus]);

    const loadAssignments = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setAssignments(getMockAssignments());
        } finally { setLoading(false); }
    };

    const getMockAssignments = (): Assignment[] => [
        { id: 1, title: 'Algebra Problem Set - Chapter 5', description: 'Complete exercises 5.1 to 5.25 from the textbook.', subject_name: 'Mathematics', grade_level_name: 'Grade 10', teacher_name: 'Dr. Smith', due_date: '2026-01-20', assigned_date: '2026-01-15', max_marks: 50, status: 'pending', submission_count: 15, total_students: 32, priority: 'high' },
        { id: 2, title: 'Essay on Climate Change', description: 'Write a 1000-word essay on climate change impacts.', subject_name: 'English', grade_level_name: 'Grade 10', teacher_name: 'Ms. Johnson', due_date: '2026-01-22', assigned_date: '2026-01-12', max_marks: 100, status: 'pending', submission_count: 8, total_students: 32, priority: 'medium' },
        { id: 3, title: 'Lab Report: Chemical Reactions', description: 'Document the acid-base reactions experiment.', subject_name: 'Chemistry', grade_level_name: 'Grade 10', teacher_name: 'Dr. Lee', due_date: '2026-01-18', assigned_date: '2026-01-10', max_marks: 40, status: 'submitted', submission_count: 30, total_students: 32, priority: 'high' },
        { id: 4, title: 'History Timeline Project', description: 'Create timeline of Industrial Revolution.', subject_name: 'History', grade_level_name: 'Grade 9', teacher_name: 'Mr. White', due_date: '2026-01-14', assigned_date: '2026-01-05', max_marks: 60, status: 'graded', submission_count: 28, total_students: 28, priority: 'medium' },
        { id: 5, title: 'Programming Exercise: Loops', description: 'Complete 10 programming problems on loops.', subject_name: 'Computer Science', grade_level_name: 'Grade 10', teacher_name: 'Ms. Tech', due_date: '2026-01-10', assigned_date: '2026-01-01', max_marks: 30, status: 'overdue', submission_count: 25, total_students: 32, priority: 'high' },
    ];

    const applyFilters = () => {
        let filtered = [...assignments];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a => a.title.toLowerCase().includes(query) || a.subject_name.toLowerCase().includes(query));
        }
        if (filterStatus !== 'all') filtered = filtered.filter(a => a.status === filterStatus);
        filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        setFilteredAssignments(filtered);
    };

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadAssignments(); setRefreshing(false); }, []);

    const getDaysRemaining = (dueDate: string) => {
        const days = differenceInDays(parseISO(dueDate), new Date());
        if (days < 0) return { text: `${Math.abs(days)} days overdue`, isOverdue: true };
        if (days === 0) return { text: 'Due today!', isOverdue: false };
        return { text: `${days} days left`, isOverdue: false };
    };

    const getSubjectIcon = (subject: string): keyof typeof Ionicons.glyphMap => (SUBJECT_ICONS[subject] || 'book-outline') as keyof typeof Ionicons.glyphMap;

    const renderAssignmentCard = ({ item }: { item: Assignment }) => {
        const priorityStyle = PRIORITY_COLORS[item.priority];
        const statusStyle = STATUS_STYLES[item.status];
        const daysInfo = getDaysRemaining(item.due_date);
        const progress = item.total_students ? (item.submission_count || 0) / item.total_students : 0;

        return (
            <TouchableOpacity onPress={() => { setSelectedAssignment(item); setModalVisible(true); }}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <View style={[styles.priorityBar, { backgroundColor: priorityStyle.border }]} />
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.subjectIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                                <Ionicons name={getSubjectIcon(item.subject_name)} size={20} color={theme.colors.primary} />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={[styles.subjectName, { color: theme.colors.primary }]}>{item.subject_name}</Text>
                                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{item.title}</Text>
                            </View>
                            <Chip mode="flat" compact style={[styles.statusChip, { backgroundColor: statusStyle.bg }]} textStyle={{ color: statusStyle.text, fontSize: 10 }}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Chip>
                        </View>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}><Ionicons name="person-outline" size={14} color="#6B7280" /><Text style={styles.metaText}>{item.teacher_name}</Text></View>
                            <View style={styles.metaItem}><Ionicons name="school-outline" size={14} color="#6B7280" /><Text style={styles.metaText}>{item.grade_level_name}</Text></View>
                        </View>
                        <View style={styles.dueRow}>
                            <Ionicons name="calendar-outline" size={16} color={daysInfo.isOverdue ? '#DC2626' : theme.colors.primary} />
                            <Text style={[styles.dueText, { color: daysInfo.isOverdue ? '#DC2626' : theme.colors.primary }]}>{format(parseISO(item.due_date), 'MMM d, yyyy')}</Text>
                            <View style={[styles.daysBadge, { backgroundColor: daysInfo.isOverdue ? '#FEE2E2' : theme.colors.primaryContainer }]}>
                                <Text style={[styles.daysText, { color: daysInfo.isOverdue ? '#DC2626' : theme.colors.primary }]}>{daysInfo.text}</Text>
                            </View>
                        </View>
                        {item.total_students && (
                            <View style={styles.submissionSection}>
                                <View style={styles.submissionHeader}><Text style={styles.submissionLabel}>Submissions</Text><Text style={styles.submissionCount}>{item.submission_count}/{item.total_students}</Text></View>
                                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                            </View>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.searchContainer}><Searchbar placeholder="Search..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} /></View>
            <View style={styles.filterContainer}>
                <SegmentedButtons value={filterStatus} onValueChange={setFilterStatus} buttons={[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'submitted', label: 'Submitted' }, { value: 'graded', label: 'Graded' }]} />
            </View>
            {filteredAssignments.length === 0 ? (
                <View style={styles.emptyContainer}><Ionicons name="clipboard-outline" size={60} color="#9CA3AF" /><Text style={styles.emptyText}>No assignments found</Text></View>
            ) : (
                <FlatList data={filteredAssignments} renderItem={renderAssignmentCard} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            )}
            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    {selectedAssignment && (
                        <View>
                            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>{selectedAssignment.title}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity></View>
                            <Divider style={{ marginVertical: 12 }} />
                            <Text style={styles.modalSubject}>{selectedAssignment.subject_name} • {selectedAssignment.grade_level_name}</Text>
                            <Text style={styles.modalTeacher}>By {selectedAssignment.teacher_name}</Text>
                            <Text style={styles.modalDesc}>{selectedAssignment.description}</Text>
                            <View style={styles.modalMeta}><Text style={styles.modalMetaText}>Due: {format(parseISO(selectedAssignment.due_date), 'MMM d, yyyy')}</Text>{selectedAssignment.max_marks && <Text style={styles.modalMetaText}>Marks: {selectedAssignment.max_marks}</Text>}</View>
                            {selectedAssignment.status === 'pending' && <Button mode="contained" onPress={() => setModalVisible(false)} style={{ marginTop: 15, borderRadius: 12 }} icon="upload">Submit</Button>}
                        </View>
                    )}
                </Modal>
            </Portal>
            <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => { }} color="#FFF" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#6B7280' },
    searchContainer: { paddingHorizontal: 15, paddingTop: 15 },
    searchBar: { elevation: 2, borderRadius: 12 },
    filterContainer: { paddingHorizontal: 15, paddingVertical: 12 },
    listContent: { padding: 15, paddingBottom: 100 },
    card: { marginBottom: 15, borderRadius: 16, elevation: 2, overflow: 'hidden' },
    priorityBar: { height: 4 },
    cardContent: { padding: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    subjectIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    headerText: { flex: 1 },
    subjectName: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
    title: { fontSize: 15, fontWeight: '700' },
    statusChip: { height: 24 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    metaText: { fontSize: 12, color: '#6B7280', marginLeft: 5 },
    dueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dueText: { fontSize: 13, fontWeight: '600', marginLeft: 6, marginRight: 10 },
    daysBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    daysText: { fontSize: 11, fontWeight: '600' },
    submissionSection: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    submissionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    submissionLabel: { fontSize: 12, color: '#6B7280' },
    submissionCount: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
    progressBar: { height: 6, borderRadius: 3 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#4B5563', marginTop: 16 },
    modal: { margin: 20, borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    modalTitle: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 10 },
    modalSubject: { fontSize: 14, color: '#6B7280', marginTop: 8 },
    modalTeacher: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
    modalDesc: { fontSize: 14, color: '#4B5563', marginTop: 15, lineHeight: 22 },
    modalMeta: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between' },
    modalMetaText: { fontSize: 13, color: '#6B7280' },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});

export default AssignmentsScreen;
