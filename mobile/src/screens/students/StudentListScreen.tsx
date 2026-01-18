import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import {
    Text,
    Searchbar,
    Card,
    Avatar,
    Chip,
    FAB,
    useTheme,
    Divider,
    ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentsAPI, classesAPI } from '../../services/api';
import { StudentsStackParamList } from '../../navigation/stacks/StudentsStack';
import Dropdown from '../../components/common/Dropdown';

type NavigationProp = NativeStackNavigationProp<StudentsStackParamList>;

interface Student {
    id: number;
    admission_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    current_class_name?: string;
    section_name?: string;
    gender: string;
    date_of_birth: string;
    phone?: string;
    email?: string;
    photo_url?: string;
    status: string;
}

interface GradeLevel {
    id: number;
    name: string;
}

const StudentListScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp>();

    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<GradeLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchQuery, selectedClass, students]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentsData, classesData] = await Promise.all([
                studentsAPI.getAll(),
                classesAPI.getAll(),
            ]);

            const studentsList = studentsData.results || studentsData || [];
            const classesList = classesData.results || classesData || [];

            setStudents(studentsList);
            setFilteredStudents(studentsList);
            setClasses(classesList);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filterStudents = () => {
        let filtered = [...students];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.first_name.toLowerCase().includes(query) ||
                    s.last_name.toLowerCase().includes(query) ||
                    s.admission_number.toLowerCase().includes(query)
            );
        }

        if (selectedClass) {
            filtered = filtered.filter(
                (s) => s.current_class_name === classes.find((c) => c.id === selectedClass)?.name
            );
        }

        setFilteredStudents(filtered);
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    };

    const renderStudent = ({ item }: { item: Student }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
        >
            <Card style={[styles.studentCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.studentContent}>
                    <Avatar.Text
                        size={50}
                        label={getInitials(item.first_name, item.last_name)}
                        style={{ backgroundColor: theme.colors.primary }}
                    />
                    <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: theme.colors.onSurface }]}>
                            {item.first_name} {item.middle_name || ''} {item.last_name}
                        </Text>
                        <Text style={styles.admissionNumber}>
                            {item.admission_number}
                        </Text>
                        <View style={styles.tagRow}>
                            {item.current_class_name && (
                                <Chip
                                    mode="outlined"
                                    compact
                                    style={styles.chip}
                                    textStyle={styles.chipText}
                                >
                                    {item.current_class_name}{item.section_name ? ` - ${item.section_name}` : ''}
                                </Chip>
                            )}
                            <Chip
                                mode="flat"
                                compact
                                style={[
                                    styles.statusChip,
                                    { backgroundColor: item.status === 'active' ? '#DEF7EC' : '#FEE2E2' }
                                ]}
                                textStyle={[
                                    styles.chipText,
                                    { color: item.status === 'active' ? '#047857' : '#DC2626' }
                                ]}
                            >
                                {item.status || 'Active'}
                            </Chip>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Search & Filters */}
            <View style={styles.filterContainer}>
                <Searchbar
                    placeholder="Search students..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    inputStyle={styles.searchInput}
                />

                <View style={styles.filterRow}>
                    <Dropdown
                        label="All Classes"
                        value={selectedClass}
                        options={[
                            { label: 'All Classes', value: null },
                            ...classes.map((c) => ({ label: c.name, value: c.id })),
                        ]}
                        onChange={setSelectedClass}
                        style={styles.dropdown}
                    />
                </View>
            </View>

            {/* Student Count */}
            <View style={styles.countContainer}>
                <Text style={styles.countText}>
                    {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </Text>
            </View>

            {/* Student List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    renderItem={renderStudent}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color="#9CA3AF" />
                            <Text style={styles.emptyText}>No students found</Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddStudent')}
                color="#FFFFFF"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        padding: 15,
        paddingBottom: 5,
    },
    searchbar: {
        elevation: 2,
        borderRadius: 12,
    },
    searchInput: {
        fontSize: 14,
    },
    filterRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    dropdown: {
        flex: 1,
    },
    countContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    countText: {
        fontSize: 13,
        color: '#6B7280',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    studentCard: {
        marginBottom: 10,
        borderRadius: 12,
        elevation: 2,
    },
    studentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    studentInfo: {
        flex: 1,
        marginLeft: 15,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
    },
    admissionNumber: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    tagRow: {
        flexDirection: 'row',
        marginTop: 8,
        flexWrap: 'wrap',
        gap: 6,
    },
    chip: {
        height: 26,
    },
    chipText: {
        fontSize: 11,
    },
    statusChip: {
        height: 26,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#9CA3AF',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
    },
});

export default StudentListScreen;
