import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, SegmentedButtons, Divider, Button, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { examsAPI } from '../../services/api';

interface SubjectResult {
    subject_name: string;
    obtained_marks: number;
    max_marks: number;
    grade: string;
    percentage: number;
    rank?: number;
    remarks?: string;
}

interface ExamResult {
    id: number;
    exam_name: string;
    exam_type: string;
    date: string;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    grade: string;
    rank?: number;
    class_average?: number;
    subjects: SubjectResult[];
}

const GRADE_COLORS: Record<string, { bg: string; text: string }> = {
    'A+': { bg: '#D1FAE5', text: '#059669' },
    'A': { bg: '#D1FAE5', text: '#10B981' },
    'B+': { bg: '#DBEAFE', text: '#3B82F6' },
    'B': { bg: '#DBEAFE', text: '#60A5FA' },
    'C+': { bg: '#FEF3C7', text: '#D97706' },
    'C': { bg: '#FEF3C7', text: '#F59E0B' },
    'D': { bg: '#FEE2E2', text: '#EF4444' },
    'F': { bg: '#FEE2E2', text: '#DC2626' },
};

const { width } = Dimensions.get('window');

const GradesScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [viewMode, setViewMode] = useState('list');

    useEffect(() => { loadResults(); }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setResults(getMockResults());
        } finally { setLoading(false); }
    };

    const getMockResults = (): ExamResult[] => [
        {
            id: 1, exam_name: 'First Term Examination', exam_type: 'mid_term', date: '2026-01-10',
            total_marks: 500, obtained_marks: 423, percentage: 84.6, grade: 'A', rank: 5, class_average: 72.3,
            subjects: [
                { subject_name: 'Mathematics', obtained_marks: 88, max_marks: 100, grade: 'A', percentage: 88, rank: 3 },
                { subject_name: 'English', obtained_marks: 85, max_marks: 100, grade: 'A', percentage: 85, rank: 7 },
                { subject_name: 'Science', obtained_marks: 92, max_marks: 100, grade: 'A+', percentage: 92, rank: 2 },
                { subject_name: 'Social Studies', obtained_marks: 78, max_marks: 100, grade: 'B+', percentage: 78, rank: 12 },
                { subject_name: 'Hindi', obtained_marks: 80, max_marks: 100, grade: 'A', percentage: 80, rank: 8 },
            ]
        },
        {
            id: 2, exam_name: 'Unit Test 2', exam_type: 'unit_test', date: '2025-12-15',
            total_marks: 250, obtained_marks: 198, percentage: 79.2, grade: 'B+', rank: 8, class_average: 68.5,
            subjects: [
                { subject_name: 'Mathematics', obtained_marks: 42, max_marks: 50, grade: 'A', percentage: 84 },
                { subject_name: 'English', obtained_marks: 38, max_marks: 50, grade: 'B+', percentage: 76 },
                { subject_name: 'Science', obtained_marks: 45, max_marks: 50, grade: 'A+', percentage: 90 },
                { subject_name: 'Social Studies', obtained_marks: 36, max_marks: 50, grade: 'B+', percentage: 72 },
                { subject_name: 'Hindi', obtained_marks: 37, max_marks: 50, grade: 'B+', percentage: 74 },
            ]
        },
        {
            id: 3, exam_name: 'Unit Test 1', exam_type: 'unit_test', date: '2025-10-20',
            total_marks: 250, obtained_marks: 185, percentage: 74.0, grade: 'B+', rank: 11, class_average: 65.2,
            subjects: [
                { subject_name: 'Mathematics', obtained_marks: 38, max_marks: 50, grade: 'B+', percentage: 76 },
                { subject_name: 'English', obtained_marks: 40, max_marks: 50, grade: 'A', percentage: 80 },
                { subject_name: 'Science', obtained_marks: 42, max_marks: 50, grade: 'A', percentage: 84 },
                { subject_name: 'Social Studies', obtained_marks: 32, max_marks: 50, grade: 'B', percentage: 64 },
                { subject_name: 'Hindi', obtained_marks: 33, max_marks: 50, grade: 'B', percentage: 66 },
            ]
        },
    ];

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadResults(); setRefreshing(false); }, []);

    const calculateTrend = () => {
        if (results.length < 2) return { direction: 'stable', value: 0 };
        const diff = results[0].percentage - results[1].percentage;
        if (diff > 0) return { direction: 'up', value: diff.toFixed(1) };
        if (diff < 0) return { direction: 'down', value: Math.abs(diff).toFixed(1) };
        return { direction: 'stable', value: 0 };
    };

    const trend = calculateTrend();
    const latestResult = results[0];

    const renderExamCard = (exam: ExamResult) => {
        const gradeStyle = GRADE_COLORS[exam.grade] || GRADE_COLORS['C'];

        return (
            <TouchableOpacity key={exam.id} onPress={() => { setSelectedExam(exam); setModalVisible(true); }}>
                <Card style={[styles.examCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={[styles.examName, { color: theme.colors.onSurface }]}>{exam.exam_name}</Text>
                            <Text style={styles.examDate}>{exam.date}</Text>
                        </View>
                        <View style={[styles.gradeBadge, { backgroundColor: gradeStyle.bg }]}>
                            <Text style={[styles.gradeText, { color: gradeStyle.text }]}>{exam.grade}</Text>
                        </View>
                    </View>
                    <Divider style={{ marginVertical: 12 }} />
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{exam.percentage.toFixed(1)}%</Text>
                            <Text style={styles.statLabel}>Percentage</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{exam.obtained_marks}/{exam.total_marks}</Text>
                            <Text style={styles.statLabel}>Marks</Text>
                        </View>
                        {exam.rank && (
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.colors.primary }]}>#{exam.rank}</Text>
                                <Text style={styles.statLabel}>Rank</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.subjectPreview}>
                        {exam.subjects.slice(0, 3).map((subject, index) => (
                            <Chip key={index} compact mode="flat" style={[styles.subjectChip, { backgroundColor: GRADE_COLORS[subject.grade]?.bg || '#F3F4F6' }]} textStyle={{ fontSize: 10, color: GRADE_COLORS[subject.grade]?.text || '#6B7280' }}>
                                {subject.subject_name}: {subject.grade}
                            </Chip>
                        ))}
                        {exam.subjects.length > 3 && <Text style={styles.moreSubjects}>+{exam.subjects.length - 3} more</Text>}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderSubjectRow = (subject: SubjectResult, index: number) => {
        const gradeStyle = GRADE_COLORS[subject.grade] || GRADE_COLORS['C'];
        return (
            <View key={index} style={styles.subjectRow}>
                <View style={styles.subjectNameCol}><Text style={styles.subjectName}>{subject.subject_name}</Text></View>
                <View style={styles.marksCol}><Text style={styles.marksText}>{subject.obtained_marks}/{subject.max_marks}</Text></View>
                <View style={styles.percentCol}><Text style={styles.percentText}>{subject.percentage}%</Text></View>
                <View style={[styles.gradeCol, { backgroundColor: gradeStyle.bg }]}><Text style={[styles.gradeColText, { color: gradeStyle.text }]}>{subject.grade}</Text></View>
            </View>
        );
    };

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading Grades...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Overview Card */}
            {latestResult && (
                <Card style={[styles.overviewCard, { backgroundColor: theme.colors.primary }]}>
                    <View style={styles.overviewContent}>
                        <View style={styles.overviewLeft}>
                            <Text style={styles.overviewLabel}>Latest Performance</Text>
                            <Text style={styles.overviewPercentage}>{latestResult.percentage.toFixed(1)}%</Text>
                            <View style={styles.trendRow}>
                                <Ionicons name={trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'remove'} size={18} color={trend.direction === 'up' ? '#34D399' : trend.direction === 'down' ? '#F87171' : '#FFF'} />
                                <Text style={[styles.trendText, { color: trend.direction === 'up' ? '#34D399' : trend.direction === 'down' ? '#F87171' : '#FFF' }]}>
                                    {trend.direction === 'stable' ? 'Stable' : `${trend.value}% ${trend.direction === 'up' ? 'improvement' : 'decrease'}`}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.overviewRight}>
                            <View style={styles.overviewGradeBadge}><Text style={styles.overviewGrade}>{latestResult.grade}</Text></View>
                            <Text style={styles.overviewRank}>Rank #{latestResult.rank}</Text>
                        </View>
                    </View>
                </Card>
            )}

            <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Exam Results</Text>
                {results.map(renderExamCard)}
            </ScrollView>

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    {selectedExam && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>{selectedExam.exam_name}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                            </View>
                            <View style={styles.modalOverview}>
                                <View style={styles.modalOverviewItem}><Text style={styles.modalOverviewValue}>{selectedExam.percentage.toFixed(1)}%</Text><Text style={styles.modalOverviewLabel}>Percentage</Text></View>
                                <View style={[styles.modalOverviewItem, { backgroundColor: GRADE_COLORS[selectedExam.grade]?.bg }]}><Text style={[styles.modalOverviewValue, { color: GRADE_COLORS[selectedExam.grade]?.text }]}>{selectedExam.grade}</Text><Text style={styles.modalOverviewLabel}>Grade</Text></View>
                                <View style={styles.modalOverviewItem}><Text style={[styles.modalOverviewValue, { color: theme.colors.primary }]}>#{selectedExam.rank}</Text><Text style={styles.modalOverviewLabel}>Rank</Text></View>
                            </View>
                            <Divider style={{ marginVertical: 15 }} />
                            <Text style={styles.modalSectionTitle}>Subject-wise Results</Text>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Subject</Text>
                                <Text style={styles.tableHeaderText}>Marks</Text>
                                <Text style={styles.tableHeaderText}>%</Text>
                                <Text style={styles.tableHeaderText}>Grade</Text>
                            </View>
                            {selectedExam.subjects.map(renderSubjectRow)}
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalText, { flex: 2 }]}>Total</Text>
                                <Text style={styles.totalText}>{selectedExam.obtained_marks}/{selectedExam.total_marks}</Text>
                                <Text style={styles.totalText}>{selectedExam.percentage.toFixed(1)}%</Text>
                                <Text style={[styles.totalText, { color: GRADE_COLORS[selectedExam.grade]?.text }]}>{selectedExam.grade}</Text>
                            </View>
                            <Button mode="contained" style={{ marginTop: 20, borderRadius: 12 }} icon="download">Download Report Card</Button>
                        </ScrollView>
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
    overviewCard: { margin: 15, borderRadius: 20, elevation: 4 },
    overviewContent: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
    overviewLeft: {},
    overviewLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    overviewPercentage: { color: '#FFF', fontSize: 42, fontWeight: '800', marginVertical: 5 },
    trendRow: { flexDirection: 'row', alignItems: 'center' },
    trendText: { marginLeft: 6, fontSize: 13, fontWeight: '500' },
    overviewRight: { alignItems: 'center', justifyContent: 'center' },
    overviewGradeBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    overviewGrade: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    overviewRank: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 8, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 15, paddingBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    examCard: { marginBottom: 15, borderRadius: 16, padding: 15, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    examName: { fontSize: 16, fontWeight: '700' },
    examDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    gradeBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
    gradeText: { fontSize: 18, fontWeight: '800' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    subjectPreview: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
    subjectChip: { height: 24 },
    moreSubjects: { fontSize: 11, color: '#9CA3AF', alignSelf: 'center', marginLeft: 4 },
    modal: { margin: 15, borderRadius: 20, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 10 },
    modalOverview: { flexDirection: 'row', justifyContent: 'space-around' },
    modalOverviewItem: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalOverviewValue: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
    modalOverviewLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
    modalSectionTitle: { fontSize: 15, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#E5E7EB' },
    tableHeaderText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
    subjectRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    subjectNameCol: { flex: 2 },
    subjectName: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
    marksCol: { flex: 1, alignItems: 'center' },
    marksText: { fontSize: 13, color: '#4B5563' },
    percentCol: { flex: 1, alignItems: 'center' },
    percentText: { fontSize: 13, color: '#4B5563' },
    gradeCol: { flex: 1, alignItems: 'center', paddingVertical: 4, borderRadius: 8, marginHorizontal: 4 },
    gradeColText: { fontSize: 13, fontWeight: '700' },
    totalRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 2, borderTopColor: '#E5E7EB', marginTop: 5 },
    totalText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
});

export default GradesScreen;
