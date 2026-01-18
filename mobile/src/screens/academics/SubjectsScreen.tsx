import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Searchbar, FAB, Portal, Modal, Divider, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { classesAPI } from '../../services/api';

interface Subject {
    id: number;
    name: string;
    code: string;
    teacher_name: string;
    teacher_id?: number;
    grade_level_name: string;
    periods_per_week: number;
    is_practical: boolean;
    is_elective: boolean;
    credits?: number;
    syllabus_progress?: number;
    icon?: string;
}

const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
    'Mathematics': { icon: 'calculator-outline', color: '#3B82F6' },
    'English': { icon: 'book-outline', color: '#8B5CF6' },
    'Science': { icon: 'flask-outline', color: '#10B981' },
    'Physics': { icon: 'planet-outline', color: '#F59E0B' },
    'Chemistry': { icon: 'beaker-outline', color: '#EF4444' },
    'Biology': { icon: 'leaf-outline', color: '#22C55E' },
    'History': { icon: 'library-outline', color: '#A855F7' },
    'Geography': { icon: 'globe-outline', color: '#06B6D4' },
    'Computer Science': { icon: 'desktop-outline', color: '#6366F1' },
    'Hindi': { icon: 'language-outline', color: '#EC4899' },
    'Urdu': { icon: 'language-outline', color: '#14B8A6' },
    'Arabic': { icon: 'book-outline', color: '#059669' },
    'Physical Education': { icon: 'fitness-outline', color: '#F97316' },
    'Art': { icon: 'color-palette-outline', color: '#D946EF' },
    'Music': { icon: 'musical-notes-outline', color: '#E11D48' },
};

const SubjectsScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => { loadSubjects(); }, []);
    useEffect(() => { filterSubjects(); }, [subjects, searchQuery]);

    const loadSubjects = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setSubjects(getMockSubjects());
        } finally { setLoading(false); }
    };

    const getMockSubjects = (): Subject[] => [
        { id: 1, name: 'Mathematics', code: 'MATH10', teacher_name: 'Dr. Smith', grade_level_name: 'Grade 10', periods_per_week: 6, is_practical: false, is_elective: false, credits: 5, syllabus_progress: 65 },
        { id: 2, name: 'English', code: 'ENG10', teacher_name: 'Ms. Johnson', grade_level_name: 'Grade 10', periods_per_week: 5, is_practical: false, is_elective: false, credits: 5, syllabus_progress: 70 },
        { id: 3, name: 'Physics', code: 'PHY10', teacher_name: 'Mr. Brown', grade_level_name: 'Grade 10', periods_per_week: 5, is_practical: true, is_elective: false, credits: 5, syllabus_progress: 55 },
        { id: 4, name: 'Chemistry', code: 'CHEM10', teacher_name: 'Dr. Lee', grade_level_name: 'Grade 10', periods_per_week: 5, is_practical: true, is_elective: false, credits: 5, syllabus_progress: 60 },
        { id: 5, name: 'Biology', code: 'BIO10', teacher_name: 'Dr. Wilson', grade_level_name: 'Grade 10', periods_per_week: 4, is_practical: true, is_elective: false, credits: 4, syllabus_progress: 50 },
        { id: 6, name: 'History', code: 'HIST10', teacher_name: 'Mr. White', grade_level_name: 'Grade 10', periods_per_week: 3, is_practical: false, is_elective: false, credits: 3, syllabus_progress: 75 },
        { id: 7, name: 'Computer Science', code: 'CS10', teacher_name: 'Ms. Tech', grade_level_name: 'Grade 10', periods_per_week: 4, is_practical: true, is_elective: true, credits: 4, syllabus_progress: 45 },
        { id: 8, name: 'Physical Education', code: 'PE10', teacher_name: 'Coach Adams', grade_level_name: 'Grade 10', periods_per_week: 2, is_practical: true, is_elective: false, credits: 2, syllabus_progress: 80 },
    ];

    const filterSubjects = () => {
        if (!searchQuery) { setFilteredSubjects(subjects); return; }
        const query = searchQuery.toLowerCase();
        setFilteredSubjects(subjects.filter(s => s.name.toLowerCase().includes(query) || s.teacher_name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)));
    };

    const onRefresh = useCallback(async () => { setRefreshing(true); await loadSubjects(); setRefreshing(false); }, []);

    const getSubjectStyle = (name: string) => SUBJECT_ICONS[name] || { icon: 'book-outline', color: '#6B7280' };

    const renderSubjectCard = ({ item }: { item: Subject }) => {
        const style = getSubjectStyle(item.name);
        const progressColor = (item.syllabus_progress || 0) >= 70 ? '#10B981' : (item.syllabus_progress || 0) >= 40 ? '#F59E0B' : '#EF4444';

        return (
            <TouchableOpacity onPress={() => { setSelectedSubject(item); setModalVisible(true); }}>
                <Card style={[styles.subjectCard, { backgroundColor: theme.colors.surface }]}>
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: style.color + '20' }]}>
                            <Ionicons name={style.icon as any} size={28} color={style.color} />
                        </View>
                        <View style={styles.subjectInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.subjectName, { color: theme.colors.onSurface }]}>{item.name}</Text>
                                {item.is_elective && <Chip compact mode="flat" style={styles.electiveChip} textStyle={styles.electiveText}>Elective</Chip>}
                            </View>
                            <Text style={styles.subjectCode}>{item.code}</Text>
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={14} color="#6B7280" />
                                <Text style={styles.detailText}>{item.teacher_name}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={14} color="#6B7280" />
                                <Text style={styles.detailText}>{item.periods_per_week} periods/week</Text>
                                {item.is_practical && <Chip compact mode="outlined" style={styles.practicalChip} textStyle={styles.practicalText}>Practical</Chip>}
                            </View>
                        </View>
                        <View style={styles.progressSection}>
                            <Text style={styles.progressValue}>{item.syllabus_progress}%</Text>
                            <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${item.syllabus_progress}%`, backgroundColor: progressColor }]} /></View>
                            <Text style={styles.progressLabel}>Syllabus</Text>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading Subjects...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.searchContainer}><Searchbar placeholder="Search subjects..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} /></View>

            {filteredSubjects.length === 0 ? (
                <View style={styles.emptyContainer}><Ionicons name="book-outline" size={60} color="#9CA3AF" /><Text style={styles.emptyText}>No subjects found</Text></View>
            ) : (
                <FlatList data={filteredSubjects} renderItem={renderSubjectCard} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} />
            )}

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    {selectedSubject && (
                        <View>
                            <View style={styles.modalHeader}>
                                <View style={[styles.modalIcon, { backgroundColor: getSubjectStyle(selectedSubject.name).color + '20' }]}>
                                    <Ionicons name={getSubjectStyle(selectedSubject.name).icon as any} size={32} color={getSubjectStyle(selectedSubject.name).color} />
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
                            </View>
                            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>{selectedSubject.name}</Text>
                            <Text style={styles.modalCode}>{selectedSubject.code}</Text>
                            <Divider style={{ marginVertical: 15 }} />
                            <View style={styles.modalMeta}>
                                <View style={styles.modalMetaRow}><Ionicons name="person-outline" size={18} color="#6B7280" /><Text style={styles.modalMetaLabel}>Teacher:</Text><Text style={styles.modalMetaValue}>{selectedSubject.teacher_name}</Text></View>
                                <View style={styles.modalMetaRow}><Ionicons name="school-outline" size={18} color="#6B7280" /><Text style={styles.modalMetaLabel}>Class:</Text><Text style={styles.modalMetaValue}>{selectedSubject.grade_level_name}</Text></View>
                                <View style={styles.modalMetaRow}><Ionicons name="time-outline" size={18} color="#6B7280" /><Text style={styles.modalMetaLabel}>Periods:</Text><Text style={styles.modalMetaValue}>{selectedSubject.periods_per_week} per week</Text></View>
                                <View style={styles.modalMetaRow}><Ionicons name="ribbon-outline" size={18} color="#6B7280" /><Text style={styles.modalMetaLabel}>Credits:</Text><Text style={styles.modalMetaValue}>{selectedSubject.credits}</Text></View>
                            </View>
                            <Divider style={{ marginVertical: 15 }} />
                            <Text style={styles.modalSectionTitle}>Syllabus Progress</Text>
                            <View style={styles.fullProgressBar}><View style={[styles.fullProgressFill, { width: `${selectedSubject.syllabus_progress}%`, backgroundColor: theme.colors.primary }]} /></View>
                            <Text style={styles.progressPercentage}>{selectedSubject.syllabus_progress}% Complete</Text>
                            <Button mode="contained" style={{ marginTop: 20, borderRadius: 12 }} icon="book-open-variant">View Syllabus</Button>
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
    searchContainer: { paddingHorizontal: 15, paddingTop: 15 },
    searchBar: { elevation: 2, borderRadius: 12 },
    listContent: { padding: 15, paddingBottom: 40 },
    subjectCard: { marginBottom: 12, borderRadius: 16, elevation: 2 },
    cardContent: { flexDirection: 'row', padding: 15 },
    iconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    subjectInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    subjectName: { fontSize: 16, fontWeight: '700', marginRight: 8 },
    subjectCode: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
    electiveChip: { height: 20, backgroundColor: '#DBEAFE' },
    electiveText: { fontSize: 9, color: '#1D4ED8' },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    detailText: { fontSize: 12, color: '#6B7280', marginLeft: 6, marginRight: 8 },
    practicalChip: { height: 18, borderColor: '#10B981' },
    practicalText: { fontSize: 9, color: '#10B981' },
    progressSection: { alignItems: 'center', justifyContent: 'center', width: 60 },
    progressValue: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    progressBarBg: { width: 50, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginVertical: 4 },
    progressBarFill: { height: 4, borderRadius: 2 },
    progressLabel: { fontSize: 10, color: '#9CA3AF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#4B5563', marginTop: 16 },
    modal: { margin: 20, borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    modalIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: '700' },
    modalCode: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },
    modalMeta: {},
    modalMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    modalMetaLabel: { fontSize: 13, color: '#6B7280', marginLeft: 10, width: 65 },
    modalMetaValue: { fontSize: 13, color: '#1F2937', flex: 1, fontWeight: '500' },
    modalSectionTitle: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 10 },
    fullProgressBar: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
    fullProgressFill: { height: 10, borderRadius: 5 },
    progressPercentage: { fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center' },
});

export default SubjectsScreen;
