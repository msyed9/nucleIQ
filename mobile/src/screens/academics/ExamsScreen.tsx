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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { examsAPI, classesAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

interface Exam {
    id: number;
    name: string;
    exam_type: string;
    subject_name?: string;
    subject?: { id: number; name: string };
    grade_level_name?: string;
    grade_level?: { id: number; name: string };
    start_date: string;
    end_date: string;
    max_marks?: number;
    passing_marks?: number;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    venue?: string;
    instructions?: string;
    created_at?: string;
}

interface ExamScheduleItem {
    id: number;
    subject_name: string;
    date: string;
    start_time: string;
    end_time: string;
    venue: string;
    max_marks: number;
}

const EXAM_TYPE_COLORS: Record<string, string> = {
    'unit_test': '#3B82F6',
    'mid_term': '#F59E0B',
    'final': '#EF4444',
    'practical': '#10B981',
    'assignment': '#8B5CF6',
    'quiz': '#EC4899',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'scheduled': { bg: '#DBEAFE', text: '#1D4ED8' },
    'ongoing': { bg: '#FEF3C7', text: '#D97706' },
    'completed': { bg: '#D1FAE5', text: '#059669' },
    'cancelled': { bg: '#FEE2E2', text: '#DC2626' },
};

const ExamsScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exams, setExams] = useState<Exam[]>([]);
    const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [examSchedule, setExamSchedule] = useState<ExamScheduleItem[]>([]);

    useEffect(() => {
        loadExams();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [exams, searchQuery, filterStatus]);

    const loadExams = async () => {
        try {
            setLoading(true);
            let data = [];
            try {
                const response = await examsAPI.getAll();
                data = response.results || response || [];
            } catch (e) {
                console.warn('API failed, using mock data');
                data = getMockExams();
            }
            setExams(data.length > 0 ? data : getMockExams());
        } catch (error) {
            console.error('Failed to load exams:', error);
            setExams(getMockExams());
        } finally {
            setLoading(false);
        }
    };

    const getMockExams = (): Exam[] => [
        {
            id: 1,
            name: 'First Term Examination',
            exam_type: 'mid_term',
            subject_name: 'All Subjects',
            grade_level_name: 'Grade 10',
            start_date: '2026-01-20',
            end_date: '2026-01-30',
            status: 'scheduled',
            venue: 'Examination Hall',
            instructions: 'Bring your ID card. No electronic devices allowed.',
        },
        {
            id: 2,
            name: 'Mathematics Unit Test - 1',
            exam_type: 'unit_test',
            subject_name: 'Mathematics',
            grade_level_name: 'Grade 9',
            start_date: '2026-01-18',
            end_date: '2026-01-18',
            max_marks: 50,
            passing_marks: 18,
            status: 'scheduled',
            venue: 'Room 101',
        },
        {
            id: 3,
            name: 'Science Practical Exam',
            exam_type: 'practical',
            subject_name: 'Science',
            grade_level_name: 'Grade 10',
            start_date: '2026-01-15',
            end_date: '2026-01-17',
            max_marks: 30,
            passing_marks: 12,
            status: 'ongoing',
            venue: 'Science Laboratory',
        },
        {
            id: 4,
            name: 'English Mid-Term Exam',
            exam_type: 'mid_term',
            subject_name: 'English',
            grade_level_name: 'Grade 8',
            start_date: '2026-01-10',
            end_date: '2026-01-10',
            max_marks: 100,
            passing_marks: 35,
            status: 'completed',
            venue: 'Room 202',
        },
        {
            id: 5,
            name: 'History Quiz',
            exam_type: 'quiz',
            subject_name: 'History',
            grade_level_name: 'Grade 7',
            start_date: '2026-01-05',
            end_date: '2026-01-05',
            max_marks: 25,
            passing_marks: 10,
            status: 'completed',
            venue: 'Room 105',
        },
    ];

    const getMockSchedule = (examId: number): ExamScheduleItem[] => [
        { id: 1, subject_name: 'Mathematics', date: '2026-01-20', start_time: '09:00', end_time: '12:00', venue: 'Hall A', max_marks: 100 },
        { id: 2, subject_name: 'English', date: '2026-01-21', start_time: '09:00', end_time: '12:00', venue: 'Hall A', max_marks: 100 },
        { id: 3, subject_name: 'Science', date: '2026-01-22', start_time: '09:00', end_time: '12:00', venue: 'Hall B', max_marks: 100 },
        { id: 4, subject_name: 'Social Studies', date: '2026-01-24', start_time: '09:00', end_time: '12:00', venue: 'Hall A', max_marks: 100 },
        { id: 5, subject_name: 'Hindi', date: '2026-01-25', start_time: '09:00', end_time: '11:30', venue: 'Hall B', max_marks: 80 },
    ];

    const applyFilters = () => {
        let filtered = [...exams];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(exam =>
                exam.name.toLowerCase().includes(query) ||
                exam.subject_name?.toLowerCase().includes(query) ||
                exam.grade_level_name?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(exam => exam.status === filterStatus);
        }

        // Sort by date (upcoming first)
        filtered.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        setFilteredExams(filtered);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadExams();
        setRefreshing(false);
    }, []);

    const getExamTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'unit_test': 'Unit Test',
            'mid_term': 'Mid Term',
            'final': 'Final',
            'practical': 'Practical',
            'assignment': 'Assignment',
            'quiz': 'Quiz',
        };
        return labels[type] || type;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'scheduled': return 'calendar-outline';
            case 'ongoing': return 'time-outline';
            case 'completed': return 'checkmark-circle-outline';
            case 'cancelled': return 'close-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    const openExamDetails = (exam: Exam) => {
        setSelectedExam(exam);
        setExamSchedule(getMockSchedule(exam.id));
        setModalVisible(true);
    };

    const renderExamCard = ({ item }: { item: Exam }) => {
        const typeColor = EXAM_TYPE_COLORS[item.exam_type] || '#6B7280';
        const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.scheduled;
        const startDate = parseISO(item.start_date);
        const endDate = parseISO(item.end_date);
        const isMultiDay = item.start_date !== item.end_date;

        return (
            <TouchableOpacity onPress={() => openExamDetails(item)}>
                <Card style={[styles.examCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
                        <View style={styles.headerContent}>
                            <Text style={[styles.examName, { color: theme.colors.onSurface }]}>
                                {item.name}
                            </Text>
                            <Chip
                                mode="flat"
                                compact
                                style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}
                                textStyle={{ color: statusStyle.text, fontSize: 11, fontWeight: '600' }}
                            >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Chip>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.examMeta}>
                            <View style={styles.metaItem}>
                                <Ionicons name="book-outline" size={16} color="#6B7280" />
                                <Text style={styles.metaText}>{item.subject_name || 'All Subjects'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="school-outline" size={16} color="#6B7280" />
                                <Text style={styles.metaText}>{item.grade_level_name}</Text>
                            </View>
                        </View>

                        <View style={styles.dateRow}>
                            <View style={styles.dateItem}>
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                                <Text style={[styles.dateText, { color: theme.colors.primary }]}>
                                    {isMultiDay
                                        ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                                        : format(startDate, 'MMM d, yyyy')}
                                </Text>
                            </View>
                            {item.venue && (
                                <View style={styles.dateItem}>
                                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                                    <Text style={styles.metaText}>{item.venue}</Text>
                                </View>
                            )}
                        </View>

                        {(item.max_marks || item.passing_marks) && (
                            <View style={styles.marksRow}>
                                {item.max_marks && (
                                    <View style={[styles.marksBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={[styles.marksLabel, { color: theme.colors.onPrimaryContainer }]}>
                                            Max: {item.max_marks}
                                        </Text>
                                    </View>
                                )}
                                {item.passing_marks && (
                                    <View style={[styles.marksBadge, { backgroundColor: '#FEF3C7' }]}>
                                        <Text style={[styles.marksLabel, { color: '#D97706' }]}>
                                            Pass: {item.passing_marks}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <Chip
                        mode="outlined"
                        compact
                        style={[styles.typeChip, { borderColor: typeColor }]}
                        textStyle={{ color: typeColor, fontSize: 11 }}
                    >
                        {getExamTypeLabel(item.exam_type)}
                    </Chip>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderScheduleItem = ({ item }: { item: ExamScheduleItem }) => (
        <View style={styles.scheduleItem}>
            <View style={styles.scheduleDateCol}>
                <Text style={styles.scheduleDay}>{format(parseISO(item.date), 'EEE')}</Text>
                <Text style={styles.scheduleDate}>{format(parseISO(item.date), 'd')}</Text>
                <Text style={styles.scheduleMonth}>{format(parseISO(item.date), 'MMM')}</Text>
            </View>
            <View style={styles.scheduleContent}>
                <Text style={styles.scheduleSubject}>{item.subject_name}</Text>
                <View style={styles.scheduleDetails}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.scheduleText}>{item.start_time} - {item.end_time}</Text>
                </View>
                <View style={styles.scheduleDetails}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.scheduleText}>{item.venue}</Text>
                </View>
            </View>
            <View style={styles.scheduleMarks}>
                <Text style={styles.marksValue}>{item.max_marks}</Text>
                <Text style={styles.marksSubLabel}>marks</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading Exams...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search exams..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                />
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <SegmentedButtons
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                    buttons={[
                        { value: 'all', label: 'All' },
                        { value: 'scheduled', label: 'Upcoming' },
                        { value: 'ongoing', label: 'Ongoing' },
                        { value: 'completed', label: 'Done' },
                    ]}
                    style={styles.segmentedButtons}
                />
            </View>

            {/* Exam List */}
            {filteredExams.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="school-outline" size={60} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No exams found</Text>
                    <Text style={styles.emptySubtext}>
                        {filterStatus !== 'all'
                            ? `No ${filterStatus} exams at the moment`
                            : 'Check back later for exam schedules'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredExams}
                    renderItem={renderExamCard}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            {/* Exam Detail Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
                >
                    {selectedExam && (
                        <View>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                                    {selectedExam.name}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <Divider style={{ marginVertical: 12 }} />

                            <View style={styles.modalInfo}>
                                <View style={styles.modalInfoRow}>
                                    <Ionicons name="school-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.modalInfoText}>{selectedExam.grade_level_name}</Text>
                                </View>
                                <View style={styles.modalInfoRow}>
                                    <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.modalInfoText}>
                                        {format(parseISO(selectedExam.start_date), 'MMM d')} - {format(parseISO(selectedExam.end_date), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                                {selectedExam.instructions && (
                                    <View style={styles.instructionsBox}>
                                        <Text style={styles.instructionsTitle}>Instructions</Text>
                                        <Text style={styles.instructionsText}>{selectedExam.instructions}</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.scheduleTitle}>Exam Schedule</Text>

                            <FlatList
                                data={examSchedule}
                                renderItem={renderScheduleItem}
                                keyExtractor={item => item.id.toString()}
                                style={styles.scheduleList}
                                showsVerticalScrollIndicator={false}
                            />

                            {selectedExam.status !== 'completed' && (
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        setModalVisible(false);
                                        navigation.navigate('ResultEntry', { examId: selectedExam.id });
                                    }}
                                    style={styles.resultButton}
                                >
                                    Enter Results
                                </Button>
                            )}
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    searchContainer: {
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    searchBar: {
        elevation: 2,
        borderRadius: 12,
    },
    searchInput: {
        fontSize: 14,
    },
    filterContainer: {
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    segmentedButtons: {
        borderRadius: 10,
    },
    listContent: {
        padding: 15,
        paddingBottom: 100,
    },
    examCard: {
        marginBottom: 15,
        borderRadius: 16,
        elevation: 2,
        overflow: 'hidden',
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    typeIndicator: {
        width: 4,
        borderRadius: 2,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    examName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    statusChip: {
        height: 24,
    },
    cardBody: {},
    examMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
    },
    dateRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    marksRow: {
        flexDirection: 'row',
        gap: 8,
    },
    marksBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    marksLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    typeChip: {
        position: 'absolute',
        bottom: 15,
        right: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4B5563',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
    modalContainer: {
        margin: 20,
        borderRadius: 20,
        padding: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    modalInfo: {
        marginBottom: 15,
    },
    modalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalInfoText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 10,
    },
    instructionsBox: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    instructionsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#D97706',
        marginBottom: 4,
    },
    instructionsText: {
        fontSize: 13,
        color: '#92400E',
    },
    scheduleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    scheduleList: {
        maxHeight: 280,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    scheduleDateCol: {
        width: 50,
        alignItems: 'center',
        marginRight: 15,
    },
    scheduleDay: {
        fontSize: 11,
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    scheduleDate: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    scheduleMonth: {
        fontSize: 11,
        color: '#6B7280',
    },
    scheduleContent: {
        flex: 1,
    },
    scheduleSubject: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    scheduleDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    scheduleText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 5,
    },
    scheduleMarks: {
        alignItems: 'center',
    },
    marksValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    marksSubLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    resultButton: {
        marginTop: 15,
        borderRadius: 12,
    },
});

export default ExamsScreen;
