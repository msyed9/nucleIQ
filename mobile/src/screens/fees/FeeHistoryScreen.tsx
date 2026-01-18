import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, List, Divider, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { studentsAPI } from '../../services/api';

interface PaymentRecord {
    id: number;
    student_name: string;
    amount: number;
    date: string;
    status: 'success' | 'pending' | 'failed';
    payment_mode: string;
}

const FeeHistoryScreen: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // In a real app, this would be feesAPI.getAllPayments()
            const mockPayments: PaymentRecord[] = [
                { id: 1, student_name: 'John Doe', amount: 5000, date: '2026-01-15', status: 'success', payment_mode: 'Cash' },
                { id: 2, student_name: 'Jane Smith', amount: 3500, date: '2026-01-14', status: 'success', payment_mode: 'Online' },
                { id: 3, student_name: 'Mike Ross', amount: 12000, date: '2026-01-12', status: 'pending', payment_mode: 'Cheque' },
                { id: 4, student_name: 'Rachel Zane', amount: 4500, date: '2026-01-10', status: 'success', payment_mode: 'UPI' },
            ];
            setPayments(mockPayments);
        } catch (error) {
            console.error('Failed to load payment history:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'failed': return '#EF4444';
            default: return '#9CA3AF';
        }
    };

    const renderItem = ({ item }: { item: PaymentRecord }) => (
        <Card style={styles.card}>
            <List.Item
                title={item.student_name}
                description={`${item.payment_mode} | ${item.date}`}
                left={props => <List.Icon {...props} icon="receipt-outline" color={theme.colors.primary} />}
                right={() => (
                    <View style={styles.rightContent}>
                        <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
                        <Chip
                            compact
                            style={{ backgroundColor: `${getStatusColor(item.status)}20`, marginTop: 5 }}
                            textStyle={{ color: getStatusColor(item.status), fontSize: 10, fontWeight: 'bold' }}
                        >
                            {item.status.toUpperCase()}
                        </Chip>
                    </View>
                )}
            />
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={payments}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="receipt-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No payment records found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 15 },
    card: { marginBottom: 10, borderRadius: 12, elevation: 1, overflow: 'hidden' },
    rightContent: { alignItems: 'flex-end', justifyContent: 'center' },
    amount: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#9CA3AF' },
});

export default FeeHistoryScreen;
