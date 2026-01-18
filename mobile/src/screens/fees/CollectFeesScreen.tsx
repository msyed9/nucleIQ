import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme, Searchbar, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentsAPI } from '../../services/api';
import { FeesStackParamList } from '../../navigation/stacks/FeesStack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<FeesStackParamList>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Student {
    id: number;
    admission_number: string;
    first_name: string;
    last_name: string;
    current_class_name: string;
    section_name?: string;
}

const CollectFeesScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const rootNavigation = useNavigation<RootNavigationProp>();

    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length > 2) {
                searchStudents();
            } else {
                setStudents([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchStudents = async () => {
        setLoading(true);
        try {
            const data = await studentsAPI.getAll({ search: searchQuery });
            setStudents(data.results || data || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStudent = ({ item }: { item: Student }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('StudentLedger', { studentId: item.id })}
        >
            <Card style={styles.studentCard}>
                <View style={styles.studentRow}>
                    <Avatar.Text
                        size={45}
                        label={`${item.first_name[0]}${item.last_name[0]}`}
                        style={{ backgroundColor: theme.colors.primary }}
                    />
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{item.first_name} {item.last_name}</Text>
                        <Text style={styles.admissionNo}>{item.admission_number}</Text>
                    </View>
                    <Chip style={styles.classChip} textStyle={styles.chipText}>
                        {item.current_class_name}
                    </Chip>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search Student..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                    loading={loading}
                />
            </View>

            {loading && students.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : students.length > 0 ? (
                <FlatList
                    data={students}
                    renderItem={renderStudent}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="search-outline" size={60} color="#D1D5DB" />
                    <Text style={styles.infoText}>
                        {searchQuery.length > 0 ? 'No students found' : 'Enter name or admission number'}
                    </Text>
                </View>
            )}

            {!searchQuery && (
                <View style={styles.quickStats}>
                    <Card style={[styles.statCard, { backgroundColor: '#DEF7EC' }]}>
                        <Text style={[styles.valueText, { color: '#047857' }]}>₹42,500</Text>
                        <Text style={styles.labelText}>Collected Today</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.valueText, { color: '#DC2626' }]}>24</Text>
                        <Text style={styles.labelText}>Defaulters</Text>
                    </Card>
                </View>
            )}

            <TouchableOpacity
                style={[styles.qrFab, { backgroundColor: theme.colors.primary }]}
                onPress={() => rootNavigation.navigate('Main', { screen: 'AttendanceTab', params: { screen: 'QRScanner' } } as any)}
            >
                <Ionicons name="qr-code" size={30} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 15 },
    searchbar: { borderRadius: 12, elevation: 2 },
    listContent: { padding: 15, paddingTop: 0 },
    studentCard: { marginBottom: 10, borderRadius: 12, elevation: 1 },
    studentRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    studentInfo: { flex: 1, marginLeft: 15 },
    studentName: { fontSize: 16, fontWeight: '600' },
    admissionNo: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    classChip: { height: 26, marginRight: 10 },
    chipText: { fontSize: 11 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    infoText: { marginTop: 15, fontSize: 16, color: '#9CA3AF' },
    quickStats: { flexDirection: 'row', gap: 15, padding: 15, marginTop: 20 },
    statCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center' },
    valueText: { fontSize: 20, fontWeight: 'bold' },
    labelText: { fontSize: 12, color: '#4B5563', marginTop: 5 },
    qrFab: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 65,
        height: 65,
        borderRadius: 33,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    }
});

export default CollectFeesScreen;
