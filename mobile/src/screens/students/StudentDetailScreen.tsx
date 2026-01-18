import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Linking, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, useTheme, Button, Divider, List, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { studentsAPI } from '../../services/api';
import { StudentsStackParamList } from '../../navigation/stacks/StudentsStack';

type StudentDetailRouteProp = RouteProp<StudentsStackParamList, 'StudentDetail'>;
type NavigationProp = NativeStackNavigationProp<StudentsStackParamList>;

interface StudentDetail {
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
    address?: string;
    city?: string;
    blood_group?: string;
    religion?: string;
    caste?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    parent_occupation?: string;
    status: string;
    photo_url?: string;
}

const StudentDetailScreen: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<StudentDetailRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const { studentId } = route.params;

    const [student, setStudent] = useState<StudentDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadStudentDetails();
    }, [studentId]);

    const loadStudentDetails = async () => {
        try {
            setLoading(true);
            const data = await studentsAPI.getById(studentId);
            setStudent(data);
        } catch (error) {
            console.error('Failed to load student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStudentDetails();
        setRefreshing(false);
    };

    const getInitials = () => {
        if (!student) return '';
        return `${student.first_name[0] || ''}${student.last_name[0] || ''}`.toUpperCase();
    };

    const handleCall = (phone?: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email?: string) => {
        if (email) Linking.openURL(`mailto:${email}`);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                <Text style={styles.errorText}>Student not found</Text>
                <Button mode="contained" onPress={loadStudentDetails} style={styles.retryButton}>
                    Retry
                </Button>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header Section */}
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <Avatar.Text
                    size={100}
                    label={getInitials()}
                    style={styles.avatar}
                />
                <Text style={styles.name}>
                    {student.first_name} {student.middle_name || ''} {student.last_name}
                </Text>
                <Text style={styles.admissionNo}>Adm No: {student.admission_number}</Text>
                <View style={styles.tagRow}>
                    <Chip style={styles.chip} textStyle={styles.chipText}>
                        {student.current_class_name} {student.section_name ? `- ${student.section_name}` : ''}
                    </Chip>
                    <Chip
                        style={[styles.chip, { backgroundColor: student.status === 'active' ? '#10B981' : '#EF4444' }]}
                        textStyle={[styles.chipText, { color: '#FFFFFF' }]}
                    >
                        {student.status.toUpperCase()}
                    </Chip>
                </View>
            </View>

            <View style={styles.content}>
                {/* Quick Actions */}
                <Card style={styles.card}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('EditStudent', { studentId })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionLabel}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionItem}>
                            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                                <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionLabel}>Fees</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('StudentDocuments', { studentId })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
                                <Ionicons name="document-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionLabel}>Docs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('StudentRemarks', { studentId })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                                <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionLabel}>Remarks</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Personal Information */}
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Gender"
                        description={student.gender}
                        left={props => <List.Icon {...props} icon="gender-male-female" />}
                    />
                    <Divider />
                    <List.Item
                        title="Date of Birth"
                        description={student.date_of_birth}
                        left={props => <List.Icon {...props} icon="calendar" />}
                    />
                    <Divider />
                    <List.Item
                        title="Blood Group"
                        description={student.blood_group || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="water" />}
                    />
                    <Divider />
                    <List.Item
                        title="Religion / Caste"
                        description={`${student.religion || ''} ${student.caste ? ` / ${student.caste}` : ''}`.trim() || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="information-outline" />}
                    />
                </Card>

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Phone Number"
                        description={student.phone || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="phone" />}
                        onPress={() => handleCall(student.phone)}
                        right={props => student.phone ? <IconButton icon="phone-outline" onPress={() => handleCall(student.phone)} /> : null}
                    />
                    <Divider />
                    <List.Item
                        title="Email Address"
                        description={student.email || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="email" />}
                        onPress={() => handleEmail(student.email)}
                        right={props => student.email ? <IconButton icon="email-outline" onPress={() => handleEmail(student.email)} /> : null}
                    />
                    <Divider />
                    <List.Item
                        title="Address"
                        description={`${student.address || ''} ${student.city || ''}`.trim() || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="map-marker" />}
                    />
                </Card>

                {/* Parent/Guardian Information */}
                <Text style={styles.sectionTitle}>Parent / Guardian Information</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Parent Name"
                        description={student.parent_name || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="account" />}
                    />
                    <Divider />
                    <List.Item
                        title="Parent Phone"
                        description={student.parent_phone || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="phone" />}
                        onPress={() => handleCall(student.parent_phone)}
                        right={props => student.parent_phone ? <IconButton icon="phone-outline" onPress={() => handleCall(student.parent_phone)} /> : null}
                    />
                    <Divider />
                    <List.Item
                        title="Parent Occupation"
                        description={student.parent_occupation || 'Not Specified'}
                        left={props => <List.Icon {...props} icon="briefcase" />}
                    />
                </Card>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 18, marginTop: 10, marginBottom: 20 },
    retryButton: { width: 120 },
    header: {
        alignItems: 'center',
        padding: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
    },
    avatar: {
        backgroundColor: '#FFFFFF66',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    admissionNo: {
        fontSize: 16,
        color: '#FFFFFFCC',
        marginTop: 5,
    },
    tagRow: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 10,
    },
    chip: {
        height: 28,
        backgroundColor: '#FFFFFF33',
    },
    chipText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    content: {
        padding: 15,
        marginTop: -20,
    },
    card: {
        borderRadius: 16,
        marginBottom: 20,
        elevation: 2,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 5,
        color: '#374151',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
    },
    actionItem: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
    },
});

export default StudentDetailScreen;
