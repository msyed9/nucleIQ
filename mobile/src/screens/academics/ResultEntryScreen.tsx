import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Chip, Button, TextInput, Divider, Portal, Modal, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { examsAPI, studentsAPI, classesAPI } from '../../services/api';

interface Student {
    id: number;
    name: string;
    roll_number: string;
    marks?: number;
    grade?: string;
    status: 'pending' | 'present' | 'absent';
}

interface Subject {
    id: number;
    name: string;
    max_marks: number;
}

const GRADE_COLORS: Record<string, string> = {
    'A+': '#059669', 'A': '#10B981', 'B+': '#3B82F6', 'B': '#60A5FA',
    'C+': '#F59E0B', 'C': '#FBBF24', 'D': '#EF4444', 'F': '#DC2626',
};

const ResultEntryScreen: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const examId = route.params?.examId || 1;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectModalVisible, setSubjectModalVisible] = useState(false);
    const [examName, setExamName] = useState('');
    const [className, setClassName] = useState('');

    useEffect(() => { loadExamData(); }, [examId]);
    useEffect(() => { filterStudents(); }, [students, searchQuery]);

    const loadExamData = async () => {
        try {
            setLoading(true);
            setExamName('First Term Examination');
            setClassName('Grade 10 - A');
            setSubjects([
                { id: 1, name: 'Mathematics', max_marks: 100 },
                { id: 2, name: 'English', max_marks: 100 },
                { id: 3, name: 'Science', max_marks: 100 },
                { id: 4, name: 'Social Studies', max_marks: 100 },
                { id: 5, name: 'Hindi', max_marks: 80 },
            ]);
            setSelectedSubject({ id: 1, name: 'Mathematics', max_marks: 100 });
            setStudents(getMockStudents());
        } finally { setLoading(false); }
    };

    const getMockStudents = (): Student[] => [
        { id: 1, name: 'Ahmed Khan', roll_number: '001', marks: 85, grade: 'A', status: 'present' },
        { id: 2, name: 'Fatima Ali', roll_number: '002', marks: 92, grade: 'A+', status: 'present' },
        { id: 3, name: 'Mohammad Syed', roll_number: '003', marks: undefined, grade: undefined, status: 'pending' },
        { id: 4, name: 'Aisha Begum', roll_number: '004', marks: 78, grade: 'B+', status: 'present' },
        { id: 5, name: 'Omar Hassan', roll_number: '005', marks: undefined, grade: undefined, status: 'absent' },
        { id: 6, name: 'Zainab Patel', roll_number: '006', marks: 65, grade: 'B', status: 'present' },
        { id: 7, name: 'Ibrahim Sheikh', roll_number: '007', marks: undefined, grade: undefined, status: 'pending' },
        { id: 8, name: 'Mariam Qureshi', roll_number: '008', marks: 88, grade: 'A', status: 'present' },
    ];

    const filterStudents = () => {
        if (!searchQuery) { setFilteredStudents(students); return; }
        const query = searchQuery.toLowerCase();
        setFilteredStudents(students.filter(s => s.name.toLowerCase().includes(query) || s.roll_number.includes(query)));
    };

    const calculateGrade = (marks: number, maxMarks: number): string => {
        const percentage = (marks / maxMarks) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        if (percentage >= 33) return 'D';
        return 'F';
    };

    const updateStudentMarks = (studentId: number, marks: string) => {
        const numMarks = parseFloat(marks);
        if (marks && (isNaN(numMarks) || numMarks < 0 || (selectedSubject && numMarks > selectedSubject.max_marks))) return;

        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newMarks = marks === '' ? undefined : numMarks;
                const grade = newMarks !== undefined && selectedSubject ? calculateGrade(newMarks, selectedSubject.max_marks) : undefined;
                return { ...s, marks: newMarks, grade, status: newMarks !== undefined ? 'present' : s.status };
            }
            return s;
        }));
    };

    const toggleAbsent = (studentId: number) => {
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const newStatus = s.status === 'absent' ? 'pending' : 'absent';
                return { ...s, status: newStatus, marks: newStatus === 'absent' ? undefined : s.marks, grade: newStatus === 'absent' ? undefined : s.grade };
            }
            return s;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            Alert.alert('Success', 'Results saved successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save results. Please try again.');
        } finally { setSaving(false); }
    };

    const getEntryStats = () => {
        const total = students.length;
        const entered = students.filter(s => s.marks !== undefined).length;
        const absent = students.filter(s => s.status === 'absent').length;
        return { total, entered, absent, pending: total - entered - absent };
    };

    const stats = getEntryStats();

    const renderStudentItem = ({ item }: { item: Student }) => (
        <Card style={[styles.studentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                    <View style={[styles.rollBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.rollNumber, { color: theme.colors.primary }]}>{item.roll_number}</Text>
                    </View>
                    <Text style={[styles.studentName, { color: theme.colors.onSurface }]}>{item.name}</Text>
                </View>
                <TouchableOpacity style={[styles.absentBtn, item.status === 'absent' && styles.absentBtnActive]} onPress={() => toggleAbsent(item.id)}>
                    <Ionicons name={item.status === 'absent' ? 'close-circle' : 'close-circle-outline'} size={20} color={item.status === 'absent' ? '#DC2626' : '#9CA3AF'} />
                    <Text style={[styles.absentText, item.status === 'absent' && { color: '#DC2626' }]}>Absent</Text>
                </TouchableOpacity>
            </View>
            {item.status !== 'absent' && (
                <View style={styles.marksRow}>
                    <TextInput mode="outlined" label="Marks" value={item.marks?.toString() || ''} onChangeText={(text) => updateStudentMarks(item.id, text)} keyboardType="numeric" style={styles.marksInput} dense right={<TextInput.Affix text={`/ ${selectedSubject?.max_marks || 100}`} />} />
                    {item.grade && (
                        <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[item.grade] + '20', borderColor: GRADE_COLORS[item.grade] }]}>
                            <Text style={[styles.gradeText, { color: GRADE_COLORS[item.grade] }]}>{item.grade}</Text>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );

    if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /><Text style={styles.loadingText}>Loading...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.examTitle, { color: theme.colors.onSurface }]}>{examName}</Text>
                <Text style={styles.classInfo}>{className}</Text>
                <TouchableOpacity style={[styles.subjectPicker, { borderColor: theme.colors.primary }]} onPress={() => setSubjectModalVisible(true)}>
                    <Ionicons name="book-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.subjectText, { color: theme.colors.primary }]}>{selectedSubject?.name || 'Select Subject'}</Text>
                    <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.statItem}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
                <View style={[styles.statItem, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.statValue, { color: '#059669' }]}>{stats.entered}</Text><Text style={styles.statLabel}>Entered</Text></View>
                <View style={[styles.statItem, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.absent}</Text><Text style={styles.statLabel}>Absent</Text></View>
                <View style={[styles.statItem, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
            </View>

            <Searchbar placeholder="Search students..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} />

            <FlatList data={filteredStudents} renderItem={renderStudentItem} keyExtractor={item => item.id.toString()} contentContainerStyle={styles.listContent} />

            <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
                <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.footerBtn}>Cancel</Button>
                <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.footerBtn} icon="content-save">Save Results</Button>
            </View>

            <Portal>
                <Modal visible={subjectModalVisible} onDismiss={() => setSubjectModalVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    <Text style={styles.modalTitle}>Select Subject</Text>
                    <Divider style={{ marginVertical: 12 }} />
                    {subjects.map(subject => (
                        <TouchableOpacity key={subject.id} style={[styles.subjectOption, selectedSubject?.id === subject.id && { backgroundColor: theme.colors.primaryContainer }]} onPress={() => { setSelectedSubject(subject); setSubjectModalVisible(false); }}>
                            <Text style={[styles.subjectOptionText, { color: theme.colors.onSurface }]}>{subject.name}</Text>
                            <Text style={styles.subjectMarks}>Max: {subject.max_marks}</Text>
                        </TouchableOpacity>
                    ))}
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#6B7280' },
    header: { padding: 15, elevation: 2 },
    examTitle: { fontSize: 18, fontWeight: '700' },
    classInfo: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    subjectPicker: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1.5 },
    subjectText: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '600' },
    statsRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10 },
    statItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, marginHorizontal: 4 },
    statValue: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
    statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    searchBar: { marginHorizontal: 15, marginBottom: 10, elevation: 1, borderRadius: 12 },
    listContent: { padding: 15, paddingBottom: 100 },
    studentCard: { marginBottom: 12, borderRadius: 14, padding: 15, elevation: 1 },
    studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    rollBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
    rollNumber: { fontSize: 12, fontWeight: '700' },
    studentName: { fontSize: 15, fontWeight: '600', flex: 1 },
    absentBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 8 },
    absentBtnActive: { backgroundColor: '#FEE2E2' },
    absentText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
    marksRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    marksInput: { flex: 1, marginRight: 12 },
    gradeBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 2 },
    gradeText: { fontSize: 18, fontWeight: '800' },
    footer: { flexDirection: 'row', padding: 15, elevation: 5, gap: 12 },
    footerBtn: { flex: 1, borderRadius: 12 },
    modal: { margin: 20, borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    subjectOption: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginVertical: 4, flexDirection: 'row', justifyContent: 'space-between' },
    subjectOptionText: { fontSize: 15, fontWeight: '500' },
    subjectMarks: { fontSize: 13, color: '#6B7280' },
});

export default ResultEntryScreen;
