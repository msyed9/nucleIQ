import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Searchbar, ProgressBar, Divider, Portal, Modal, Button, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Chapter {
    id: number;
    name: string;
    description?: string;
    estimated_hours: number;
    is_completed: boolean;
    completion_date?: string;
    topics: string[];
}

interface SubjectSyllabus {
    id: number;
    subject_name: string;
    subject_code: string;
    total_chapters: number;
    completed_chapters: number;
    progress: number;
    teacher_name: string;
    chapters: Chapter[];
}

const SUBJECT_COLORS: Record<string, string> = {
    'Mathematics': '#3B82F6',
    'English': '#8B5CF6',
    'Science': '#10B981',
    'Physics': '#F59E0B',
    'Chemistry': '#EF4444',
    'Biology': '#22C55E',
    'History': '#A855F7',
    'Geography': '#06B6D4',
    'Computer Science': '#6366F1',
};

const SyllabusScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [syllabusData, setSyllabusData] = useState<SubjectSyllabus[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectSyllabus | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [expandedChapter, setExpandedChapter] = useState<number | null>(null);

    useEffect(() => { loadSyllabus(); }, []);

    const loadSyllabus = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setSyllabusData(getMockSyllabus());
        } finally { setLoading(false); }
    };

    const getMockSyllabus = (): SubjectSyllabus[] => [
        {
            id: 1, subject_name: 'Mathematics', subject_code: 'MATH10', total_chapters: 15, completed_chapters: 10, progress: 67, teacher_name: 'Dr. Smith',
            chapters: [
                { id: 1, name: 'Real Numbers', estimated_hours: 8, is_completed: true, topics: ['Euclid Division Lemma', 'Fundamental Theorem of Arithmetic', 'Irrational Numbers', 'Decimal Expansion'] },
                { id: 2, name: 'Polynomials', estimated_hours: 10, is_completed: true, topics: ['Zeros of Polynomial', 'Relationship between Zeros and Coefficients', 'Division Algorithm'] },
                { id: 3, name: 'Pair of Linear Equations', estimated_hours: 12, is_completed: true, topics: ['Graphical Method', 'Algebraic Methods', 'Substitution', 'Elimination', 'Cross Multiplication'] },
                { id: 4, name: 'Quadratic Equations', estimated_hours: 10, is_completed: false, topics: ['Standard Form', 'Factorization Method', 'Completing Square', 'Quadratic Formula', 'Nature of Roots'] },
                { id: 5, name: 'Arithmetic Progressions', estimated_hours: 8, is_completed: false, topics: ['nth Term', 'Sum of n Terms', 'Applications'] },
            ]
        },
        {
            id: 2, subject_name: 'Physics', subject_code: 'PHY10', total_chapters: 12, completed_chapters: 7, progress: 58, teacher_name: 'Mr. Brown',
            chapters: [
                { id: 1, name: 'Light - Reflection and Refraction', estimated_hours: 12, is_completed: true, topics: ['Reflection', 'Spherical Mirrors', 'Refraction', 'Lenses', 'Power of Lens'] },
                { id: 2, name: 'Electricity', estimated_hours: 14, is_completed: true, topics: ['Electric Current', 'Potential Difference', 'Ohms Law', 'Resistance', 'Series and Parallel'] },
                { id: 3, name: 'Magnetic Effects of Current', estimated_hours: 10, is_completed: false, topics: ['Magnetic Field', 'Field Lines', 'Right Hand Thumb Rule', 'Electromagnetic Induction'] },
            ]
        },
        {
            id: 3, subject_name: 'Chemistry', subject_code: 'CHEM10', total_chapters: 10, completed_chapters: 6, progress: 60, teacher_name: 'Dr. Lee',
            chapters: [
                { id: 1, name: 'Chemical Reactions and Equations', estimated_hours: 8, is_completed: true, topics: ['Types of Reactions', 'Balancing Equations', 'Oxidation and Reduction'] },
                { id: 2, name: 'Acids, Bases and Salts', estimated_hours: 10, is_completed: true, topics: ['Properties', 'pH Scale', 'Indicators', 'Salt Formation'] },
                { id: 3, name: 'Metals and Non-metals', estimated_hours: 12, is_completed: false, topics: ['Physical Properties', 'Chemical Properties', 'Reactivity Series', 'Extraction'] },
            ]
        },
        {
            id: 4, subject_name: 'English', subject_code: 'ENG10', total_chapters: 14, completed_chapters: 10, progress: 71, teacher_name: 'Ms. Johnson',
            chapters: [
                { id: 1, name: 'A Letter to God', estimated_hours: 4, is_completed: true, topics: ['Story Summary', 'Character Analysis', 'Vocabulary', 'Comprehension'] },
                { id: 2, name: 'Nelson Mandela', estimated_hours: 5, is_completed: true, topics: ['Biography', 'Historical Context', 'Important Quotes'] },
            ]
        },
    ];

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadSyllabus(); setRefreshing(false); }, []);

    const getSubjectColor = (name: string) => SUBJECT_COLORS[name] || '#6B7280';

    const getOverallProgress = () => {
        if (syllabusData.length === 0) return 0;
        return Math.round(syllabusData.reduce((acc, s) => acc + s.progress, 0) / syllabusData.length);
    };

    const renderSubjectCard = ({ item }: { item: SubjectSyllabus }) => {
        const color = getSubjectColor(item.subject_name);
        const progressColor = item.progress >= 70 ? '#10B981' : item.progress >= 40 ? '#F59E0B' : '#EF4444';

        return (
            <TouchableOpacity onPress={() => { setSelectedSubject(item); setModalVisible(true); }}>
                <Card style={[styles.subjectCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.colorBar, { backgroundColor: color }]} />
                        <View style={styles.cardInfo}>
                            <Text style={[styles.subjectName, { color: theme.colors.onSurface }]}>{item.subject_name}</Text>
                            <Text style={styles.subjectCode}>{item.subject_code}</Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={[styles.progressText, { color: progressColor }]}>{item.progress}%</Text>
                        </View>
                    </View>
                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <Text style={styles.chapterInfo}>{item.completed_chapters} of {item.total_chapters} chapters</Text>
                            <Text style={styles.teacherText}>{item.teacher_name}</Text>
                        </View>
                        <ProgressBar progress={item.progress / 100} color={progressColor} style={styles.progressBar} />
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderChapterItem = (chapter: Chapter, index: number) => {
        const isExpanded = expandedChapter === chapter.id;
        return (
            <View key={chapter.id}>
                <TouchableOpacity style={styles.chapterItem} onPress={() => setExpandedChapter(isExpanded ? null : chapter.id)}>
                    <View style={[styles.chapterStatus, { backgroundColor: chapter.is_completed ? '#D1FAE5' : '#FEF3C7' }]}>
                        <Ionicons name={chapter.is_completed ? 'checkmark-circle' : 'time-outline'} size={20} color={chapter.is_completed ? '#059669' : '#D97706'} />
                    </View>
                    <View style={styles.chapterDetails}>
                        <Text style={styles.chapterName}>{index + 1}. {chapter.name}</Text>
                        <Text style={styles.chapterMeta}>{chapter.estimated_hours} hours • {chapter.topics.length} topics</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.topicsContainer}>
                        {chapter.topics.map((topic, idx) => (
                            <View key={idx} style={styles.topicItem}>
                                <View style={styles.topicDot} />
                                <Text style={styles.topicText}>{topic}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading Syllabus...</Text></View>;

    const overallProgress = getOverallProgress();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Card style={[styles.overviewCard, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.overviewContent}>
                    <View>
                        <Text style={styles.overviewLabel}>Overall Syllabus Progress</Text>
                        <Text style={styles.overviewValue}>{overallProgress}%</Text>
                    </View>
                    <View style={styles.overviewStats}>
                        <View style={styles.overviewStatItem}><Text style={styles.overviewStatValue}>{syllabusData.length}</Text><Text style={styles.overviewStatLabel}>Subjects</Text></View>
                        <View style={styles.overviewStatItem}><Text style={styles.overviewStatValue}>{syllabusData.reduce((a, s) => a + s.completed_chapters, 0)}</Text><Text style={styles.overviewStatLabel}>Completed</Text></View>
                    </View>
                </View>
                <View style={styles.overviewProgressBar}><View style={[styles.overviewProgressFill, { width: `${overallProgress}%` }]} /></View>
            </Card>

            <FlatList data={syllabusData} renderItem={renderSubjectCard} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => { setModalVisible(false); setExpandedChapter(null); }} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    {selectedSubject && (
                        <View>
                            <View style={styles.modalHeader}>
                                <View style={[styles.modalColorBar, { backgroundColor: getSubjectColor(selectedSubject.subject_name) }]} />
                                <View style={styles.modalTitleSection}>
                                    <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>{selectedSubject.subject_name}</Text>
                                    <Text style={styles.modalSubtitle}>{selectedSubject.teacher_name} • {selectedSubject.subject_code}</Text>
                                </View>
                                <TouchableOpacity onPress={() => { setModalVisible(false); setExpandedChapter(null); }}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                            </View>
                            <View style={styles.modalProgressSection}>
                                <Text style={styles.modalProgressLabel}>{selectedSubject.completed_chapters} of {selectedSubject.total_chapters} chapters completed</Text>
                                <ProgressBar progress={selectedSubject.progress / 100} color={theme.colors.primary} style={styles.modalProgressBar} />
                            </View>
                            <Divider style={{ marginVertical: 12 }} />
                            <Text style={styles.chaptersTitle}>Chapters</Text>
                            <ScrollView style={styles.chaptersList} showsVerticalScrollIndicator={false}>
                                {selectedSubject.chapters.map((chapter, index) => renderChapterItem(chapter, index))}
                            </ScrollView>
                        </View>
                    )}
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#6B7280' },
    overviewCard: { margin: 15, borderRadius: 20, elevation: 4, padding: 20 },
    overviewContent: { flexDirection: 'row', justifyContent: 'space-between' },
    overviewLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    overviewValue: { color: '#FFF', fontSize: 40, fontWeight: '800', marginTop: 4 },
    overviewStats: { flexDirection: 'row', gap: 20 },
    overviewStatItem: { alignItems: 'center' },
    overviewStatValue: { color: '#FFF', fontSize: 22, fontWeight: '700' },
    overviewStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    overviewProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, marginTop: 15 },
    overviewProgressFill: { height: 6, backgroundColor: '#FFF', borderRadius: 3 },
    listContent: { paddingHorizontal: 15, paddingBottom: 30 },
    subjectCard: { marginBottom: 12, borderRadius: 16, elevation: 2, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    colorBar: { width: 6, height: 60, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
    cardInfo: { flex: 1, paddingVertical: 12, paddingHorizontal: 15 },
    subjectName: { fontSize: 16, fontWeight: '700' },
    subjectCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    progressCircle: { marginRight: 15 },
    progressText: { fontSize: 18, fontWeight: '800' },
    progressSection: { paddingHorizontal: 15, paddingBottom: 12 },
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    chapterInfo: { fontSize: 12, color: '#6B7280' },
    teacherText: { fontSize: 12, color: '#9CA3AF' },
    progressBar: { height: 6, borderRadius: 3 },
    modal: { margin: 15, borderRadius: 20, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    modalColorBar: { width: 6, height: 50, borderRadius: 3, marginRight: 12 },
    modalTitleSection: { flex: 1 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    modalProgressSection: { marginTop: 15 },
    modalProgressLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
    modalProgressBar: { height: 8, borderRadius: 4 },
    chaptersTitle: { fontSize: 15, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
    chaptersList: { maxHeight: 350 },
    chapterItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    chapterStatus: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    chapterDetails: { flex: 1 },
    chapterName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    chapterMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    topicsContainer: { paddingLeft: 48, paddingBottom: 10, backgroundColor: '#F9FAFB', marginTop: -1 },
    topicItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
    topicDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF', marginRight: 10 },
    topicText: { fontSize: 13, color: '#4B5563' },
});

export default SyllabusScreen;
