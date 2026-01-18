import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    useTheme,
    HelperText,
    IconButton,
    Card,
    Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { studentsAPI, classesAPI, sectionsAPI } from '../../services/api';
import Dropdown from '../../components/common/Dropdown';

const AddStudentScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        admission_number: '',
        current_class: null as number | null,
        section: null as number | null,
        gender: '',
        date_of_birth: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        parent_name: '',
        parent_phone: '',
        blood_group: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<{ label: string; value: number }[]>([]);
    const [sections, setSections] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (formData.current_class) {
            loadSections(formData.current_class);
        }
    }, [formData.current_class]);

    const loadInitialData = async () => {
        try {
            const data = await classesAPI.getAll();
            const classOptions = (data.results || data || []).map((c: any) => ({
                label: c.name,
                value: c.id,
            }));
            setClasses(classOptions);
        } catch (error) {
            console.error('Failed to load classes:', error);
        }
    };

    const loadSections = async (classId: number) => {
        try {
            const data = await sectionsAPI.getByClass(classId);
            const sectionOptions = (data.results || data || []).map((s: any) => ({
                label: s.name,
                value: s.id,
            }));
            setSections(sectionOptions);
            setFormData(prev => ({ ...prev, section: null }));
        } catch (error) {
            console.error('Failed to load sections:', error);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.first_name) newErrors.first_name = 'First name is required';
        if (!formData.last_name) newErrors.last_name = 'Last name is required';
        if (!formData.admission_number) newErrors.admission_number = 'Admission number is required';
        if (!formData.current_class) newErrors.current_class = 'Class is required';
        if (!formData.gender) newErrors.gender = 'Gender is required';

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please fill all required fields',
            });
            return;
        }

        setLoading(true);
        try {
            await studentsAPI.create(formData);
            Toast.show({
                type: 'success',
                text1: 'Student Added',
                text2: 'Student record created successfully',
            });
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to add student. Please check all fields.';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: theme.colors.background }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Basic Information Section */}
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <Card style={styles.card}>
                    <View style={styles.cardContent}>
                        <TextInput
                            label="First Name *"
                            value={formData.first_name}
                            onChangeText={v => updateField('first_name', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.first_name}
                        />
                        {errors.first_name && <HelperText type="error">{errors.first_name}</HelperText>}

                        <TextInput
                            label="Middle Name"
                            value={formData.middle_name}
                            onChangeText={v => updateField('middle_name', v)}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Last Name *"
                            value={formData.last_name}
                            onChangeText={v => updateField('last_name', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.last_name}
                        />
                        {errors.last_name && <HelperText type="error">{errors.last_name}</HelperText>}

                        <TextInput
                            label="Admission Number *"
                            value={formData.admission_number}
                            onChangeText={v => updateField('admission_number', v)}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.admission_number}
                        />
                        {errors.admission_number && <HelperText type="error">{errors.admission_number}</HelperText>}

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Dropdown
                                    label="Gender *"
                                    value={formData.gender}
                                    options={[
                                        { label: 'Male', value: 'male' },
                                        { label: 'Female', value: 'female' },
                                        { label: 'Other', value: 'other' },
                                    ]}
                                    onChange={v => updateField('gender', v)}
                                    style={styles.dropdown}
                                />
                                {errors.gender && <HelperText type="error">{errors.gender}</HelperText>}
                            </View>
                            <View style={{ width: 10 }} />
                            <TextInput
                                label="DOB (YYYY-MM-DD)"
                                value={formData.date_of_birth}
                                onChangeText={v => updateField('date_of_birth', v)}
                                mode="outlined"
                                style={[styles.input, { flex: 1, marginTop: 0 }]}
                                placeholder="2010-01-01"
                            />
                        </View>
                    </View>
                </Card>

                {/* Academic Details Section */}
                <Text style={styles.sectionTitle}>Academic Details</Text>
                <Card style={styles.card}>
                    <View style={styles.cardContent}>
                        <Dropdown
                            label="Current Class *"
                            value={formData.current_class}
                            options={classes}
                            onChange={v => updateField('current_class', v)}
                            style={styles.dropdown}
                        />
                        {errors.current_class && <HelperText type="error">{errors.current_class}</HelperText>}

                        <View style={{ height: 10 }} />

                        <Dropdown
                            label="Section"
                            value={formData.section}
                            options={sections}
                            onChange={v => updateField('section', v)}
                            style={styles.dropdown}
                            disabled={!formData.current_class}
                        />
                    </View>
                </Card>

                {/* Contact & Parent Details Section */}
                <Text style={styles.sectionTitle}>Contact & Parent Details</Text>
                <Card style={styles.card}>
                    <View style={styles.cardContent}>
                        <TextInput
                            label="Parent/Guardian Name"
                            value={formData.parent_name}
                            onChangeText={v => updateField('parent_name', v)}
                            mode="outlined"
                            style={styles.input}
                        />

                        <TextInput
                            label="Parent Phone"
                            value={formData.parent_phone}
                            onChangeText={v => updateField('parent_phone', v)}
                            mode="outlined"
                            keyboardType="phone-pad"
                            style={styles.input}
                        />

                        <TextInput
                            label="Student Email"
                            value={formData.email}
                            onChangeText={v => updateField('email', v)}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            error={!!errors.email}
                        />
                        {errors.email && <HelperText type="error">{errors.email}</HelperText>}

                        <TextInput
                            label="Address"
                            value={formData.address}
                            onChangeText={v => updateField('address', v)}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />
                    </View>
                </Card>

                <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                >
                    Add Student
                </Button>

                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 15,
        color: '#4B5563',
        marginLeft: 4,
    },
    card: {
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
    },
    cardContent: {
        padding: 15,
    },
    input: {
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
    },
    dropdown: {
        // Dropdown internal style managed by component
    },
    submitButton: {
        marginTop: 30,
        borderRadius: 12,
    },
    submitButtonContent: {
        height: 50,
    },
});

export default AddStudentScreen;
