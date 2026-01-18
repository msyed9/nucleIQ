import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface MenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    route: string;
}

const ACADEMIC_MENU: MenuItem[] = [
    { id: 'timetable', title: 'Timetable', subtitle: 'View class schedule', icon: 'time-outline', color: '#3B82F6', route: 'Timetable' },
    { id: 'subjects', title: 'Subjects', subtitle: 'All subjects & teachers', icon: 'book-outline', color: '#8B5CF6', route: 'Subjects' },
    { id: 'syllabus', title: 'Syllabus', subtitle: 'Track syllabus progress', icon: 'list-outline', color: '#06B6D4', route: 'Syllabus' },
    { id: 'exams', title: 'Exams', subtitle: 'Exam schedules & info', icon: 'school-outline', color: '#F59E0B', route: 'Exams' },
    { id: 'grades', title: 'Grades', subtitle: 'Results & report cards', icon: 'ribbon-outline', color: '#10B981', route: 'Grades' },
    { id: 'assignments', title: 'Assignments', subtitle: 'View & submit work', icon: 'clipboard-outline', color: '#EC4899', route: 'Assignments' },
    { id: 'homework', title: 'Homework', subtitle: 'Daily homework tasks', icon: 'document-text-outline', color: '#EF4444', route: 'Homework' },
    { id: 'result_entry', title: 'Result Entry', subtitle: 'Enter exam results', icon: 'create-outline', color: '#6366F1', route: 'ResultEntry' },
];

const AcademicsIndexScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const renderMenuItem = (item: MenuItem) => (
        <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => navigation.navigate(item.route, item.route === 'ResultEntry' ? { examId: 1 } : undefined)}>
            <Card style={[styles.menuCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.menuContent}>
                    <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon} size={26} color={item.color} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.menuTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header Card */}
            <Card style={[styles.headerCard, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="school" size={32} color="#FFF" />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Academics</Text>
                        <Text style={styles.headerSubtitle}>Manage your academic journey</Text>
                    </View>
                </View>
            </Card>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Quick Access</Text>
                <View style={styles.menuGrid}>
                    {ACADEMIC_MENU.map(renderMenuItem)}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerCard: { margin: 15, marginBottom: 0, borderRadius: 20, elevation: 4 },
    headerContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    headerIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    headerText: {},
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
    scrollContent: { padding: 15, paddingBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    menuGrid: {},
    menuItem: { marginBottom: 10 },
    menuCard: { borderRadius: 16, elevation: 2 },
    menuContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconContainer: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    textContainer: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '700' },
    menuSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});

export default AcademicsIndexScreen;
