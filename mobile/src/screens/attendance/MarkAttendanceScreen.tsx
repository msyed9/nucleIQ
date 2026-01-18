import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import {
    Text,
    Card,
    Avatar,
    Button,
    useTheme,
    Checkbox,
    RadioButton,
    ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';
import { studentsAPI, classesAPI, sectionsAPI, attendanceAPI } from '../../services/api';
import Dropdown from '../../components/common/Dropdown';

interface Student {
    id: number;
    admission_number: string;
    first_name: string;
    last_name: string;
    status?: 'present' | 'absent' | 'late' | 'half_day' | null;
}

interface GradeLevel {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

const MarkAttendanceScreen: React.FC = () => {
    const theme = useTheme();
    const today = format(new Date(), 'yyyy-MM-dd');

    const [classes, setClasses] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadSections(selectedClass);
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            loadStudents();
        }
    }, [selectedClass, selectedSection]);

    const loadClasses = async () => {
        try {
            const data = await classesAPI.getAll();
            setClasses(data.results || data || []);
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    };

    const loadSections = async (classId: number) => {
        try {
            const data = await sectionsAPI.getByClass(classId);
            setSections(data.results || data || []);
            setSelectedSection(null);
            setStudents([]);
        } catch (error) {
            console.error('Failed to load sections:', error);
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await studentsAPI.getByClass(selectedClass!, selectedSection!);
            const studentsList = (data.results || data || []).map((s: any) => ({
                ...s,
                status: null,
            }));
            setStudents(studentsList);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStudentStatus = (studentId: number, status: 'present' | 'absent' | 'late' | 'half_day') => {
        setStudents(prev =>
            prev.map(s => (s.id === studentId ? { ...s, status } : s))
        );
    };

    const toggleSelectAll = () => {
        const newStatus = !selectAll;
        setSelectAll(newStatus);
        setStudents(prev =>
            prev.map(s => ({ ...s, status: newStatus ? 'present' : null }))
        );
    };

    const submitAttendance = async () => {
        const unmarkedStudents = students.filter(s => !s.status);
        if (unmarkedStudents.length > 0) {
            Alert.alert(
                'Incomplete Attendance',
                `${unmarkedStudents.length} student(s) have not been marked. Do you want to mark them as absent?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Mark as Absent',
                        onPress: async () => {
                            const updatedStudents = students.map(s => ({
                                ...s,
                                status: s.status || 'absent',
                            }));
                            setStudents(updatedStudents as Student[]);
                            await doSubmit(updatedStudents as Student[]);
                        },
                    },
                ]
            );
            return;
        }
        await doSubmit(students);
    };

    const doSubmit = async (studentsList: Student[]) => {
        setSubmitting(true);
        try {
            const attendanceData = {
                date: today,
                class_id: selectedClass,
                section_id: selectedSection,
                attendance: studentsList.map(s => ({
                    student_id: s.id,
                    status: s.status,
                })),
            };

            await attendanceAPI.mark(attendanceData);

            Toast.show({
                type: 'success',
                text1: 'Attendance Saved',
                text2: `Attendance for ${studentsList.length} students has been recorded.`,
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Failed to Save',
                text2: 'Could not save attendance. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'present': return '#10B981';
            case 'absent': return '#EF4444';
            case 'late': return '#F59E0B';
            case 'half_day': return '#8B5CF6';
            default: return '#9CA3AF';
        }
    };

    const renderStudent = ({ item }: { item: Student }) => (
        <Card style={[styles.studentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.studentRow}>
                <Avatar.Text
                    size={40}
                    label={`${item.first_name[0]}${item.last_name[0]}`}
                    style={{ backgroundColor: theme.colors.primary }}
                />
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: theme.colors.onSurface }]}>
                        {item.first_name} {item.last_name}
                    </Text>
                    <Text style={styles.admissionNumber}>{item.admission_number}</Text>
                </View>
            </View>

            <View style={styles.statusButtons}>
                {(['present', 'absent', 'late', 'half_day'] as const).map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.statusButton,
                            {
                                backgroundColor: item.status === status
                                    ? getStatusColor(status)
                                    : `${getStatusColor(status)}20`,
                            },
                        ]}
                        onPress={() => updateStudentStatus(item.id, status)}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                { color: item.status === status ? '#FFFFFF' : getStatusColor(status) },
                            ]}
                        >
                            {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'H'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Card>
    );

    const markedCount = students.filter(s => s.status).length;
    const presentCount = students.filter(s => s.status === 'present').length;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Date & Filters */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                    <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </Text>
                </View>

                <View style={styles.filterRow}>
                    <Dropdown
                        label="Select Class"
                        value={selectedClass}
                        options={classes.map(c => ({ label: c.name, value: c.id }))}
                        onChange={setSelectedClass}
                        style={styles.dropdown}
                    />
                    <View style={{ width: 10 }} />
                    <Dropdown
                        label="Section"
                        value={selectedSection}
                        options={sections.map(s => ({ label: s.name, value: s.id }))}
                        onChange={setSelectedSection}
                        style={styles.dropdown}
                        disabled={!selectedClass}
                    />
                </View>
            </View>

            {/* Stats & Actions */}
            {students.length > 0 && (
                <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                        <Text style={styles.statsText}>
                            {markedCount}/{students.length} marked • {presentCount} present
                        </Text>
                        <TouchableOpacity style={styles.selectAllButton} onPress={toggleSelectAll}>
                            <Checkbox status={selectAll ? 'checked' : 'unchecked'} />
                            <Text style={styles.selectAllText}>Mark All Present</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Student List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading students...</Text>
                </View>
            ) : students.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="school-outline" size={60} color="#9CA3AF" />
                    <Text style={styles.emptyText}>
                        {selectedClass && selectedSection
                            ? 'No students in selected class'
                            : 'Select class and section to mark attendance'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={students}
                    renderItem={renderStudent}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Submit Button */}
            {students.length > 0 && (
                <View style={styles.submitContainer}>
                    <Button
                        mode="contained"
                        onPress={submitAttendance}
                        loading={submitting}
                        disabled={submitting || markedCount === 0}
                        style={styles.submitButton}
                        contentStyle={styles.submitButtonContent}
                    >
                        Save Attendance
                    </Button>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 15,
        paddingBottom: 5,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    filterRow: {
        flexDirection: 'row',
    },
    dropdown: {
        flex: 1,
    },
    statsContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statsText: {
        fontSize: 13,
        color: '#6B7280',
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectAllText: {
        fontSize: 13,
        color: '#6B7280',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    studentCard: {
        marginBottom: 10,
        padding: 15,
        borderRadius: 12,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentInfo: {
        marginLeft: 12,
        flex: 1,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
    },
    admissionNumber: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    statusButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    submitContainer: {
        padding: 15,
        backgroundColor: 'transparent',
    },
    submitButton: {
        borderRadius: 12,
    },
    submitButtonContent: {
        height: 50,
    },
});

export default MarkAttendanceScreen;
