import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { Text, Searchbar, Card, Avatar, useTheme, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { staffAPI } from '../../services/api';

interface Staff {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    designation_name: string;
    department_name: string;
    phone?: string;
    email?: string;
    photo_url?: string;
    status: string;
}

const StaffListScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const [staff, setStaff] = useState<Staff[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterStaff();
    }, [searchQuery, staff]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await staffAPI.getAll();
            const list = data.results || data || [];
            setStaff(list);
            setFilteredStaff(list);
        } catch (error) {
            console.error('Failed to load staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStaff = () => {
        if (!searchQuery) {
            setFilteredStaff(staff);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = staff.filter(s =>
            s.first_name.toLowerCase().includes(query) ||
            s.last_name.toLowerCase().includes(query) ||
            s.employee_id.toLowerCase().includes(query) ||
            s.designation_name.toLowerCase().includes(query)
        );
        setFilteredStaff(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleCall = (phone?: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const renderStaff = ({ item }: { item: Staff }) => (
        <Card style={styles.staffCard}>
            <TouchableOpacity
                style={styles.staffRow}
                onPress={() => navigation.navigate('MoreTab', { screen: 'StaffDetail', params: { staffId: item.id } })}
            >
                <Avatar.Text
                    size={50}
                    label={`${item.first_name[0]}${item.last_name[0]}`}
                    style={{ backgroundColor: theme.colors.secondaryContainer }}
                    labelStyle={{ color: theme.colors.onSecondaryContainer }}
                />
                <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.designation}>{item.designation_name}</Text>
                    <View style={styles.deptRow}>
                        <Chip compact style={styles.deptChip} textStyle={styles.chipText}>
                            {item.department_name}
                        </Chip>
                    </View>
                </View>
                <View style={styles.actionIcons}>
                    {item.phone && (
                        <IconButton
                            icon="phone-outline"
                            size={20}
                            onPress={() => handleCall(item.phone)}
                        />
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Searchbar
                    placeholder="Search staff..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchbar}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredStaff}
                    renderItem={renderStaff}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Ionicons name="people-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No staff members found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 15 },
    searchbar: { borderRadius: 12, elevation: 2 },
    listContent: { padding: 15, paddingTop: 0 },
    staffCard: { marginBottom: 10, borderRadius: 12, elevation: 1 },
    staffRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    staffInfo: { flex: 1, marginLeft: 15 },
    staffName: { fontSize: 16, fontWeight: 'bold' },
    designation: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    deptRow: { flexDirection: 'row', marginTop: 6 },
    deptChip: { height: 24, backgroundColor: '#F3F4F6' },
    chipText: { fontSize: 11 },
    actionIcons: { flexDirection: 'row', alignItems: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 15, fontSize: 16, color: '#9CA3AF' },
});

export default StaffListScreen;
