import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme, Button, DataTable, Divider, List, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { feesAPI, studentsAPI } from '../../services/api';
import { FeesStackParamList } from '../../navigation/stacks/FeesStack';

type StudentLedgerRouteProp = RouteProp<FeesStackParamList, 'StudentLedger'>;

interface FeeSummary {
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    installments: any[];
    payments: any[];
}

const StudentLedgerScreen: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<StudentLedgerRouteProp>();
    const { studentId } = route.params;

    const [student, setStudent] = useState<any>(null);
    const [summary, setSummary] = useState<FeeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, [studentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentData, feesData] = await Promise.all([
                studentsAPI.getById(studentId),
                feesAPI.getStudentFees(studentId),
            ]);
            setStudent(studentData);
            setSummary(feesData);
        } catch (error) {
            console.error('Failed to load ledger data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Student Profile Summary */}
            <Card style={styles.profileCard}>
                <View style={styles.profileContent}>
                    <View style={styles.studentBasic}>
                        <Text style={styles.studentName}>{student?.first_name} {student?.last_name}</Text>
                        <Text style={styles.admissionNo}>{student?.admission_number} | {student?.current_class_name}</Text>
                    </View>
                    <Chip style={styles.statusChip}>{student?.status?.toUpperCase()}</Chip>
                </View>
            </Card>

            {/* Fee Overview Stats */}
            <View style={styles.statsRow}>
                <Card style={[styles.statCard, { borderBottomColor: '#3B82F6', borderBottomWidth: 4 }]}>
                    <Text style={styles.statLabel}>Total Fees</Text>
                    <Text style={styles.statValue}>₹{(summary?.total_amount || 0).toLocaleString()}</Text>
                </Card>
                <Card style={[styles.statCard, { borderBottomColor: '#10B981', borderBottomWidth: 4 }]}>
                    <Text style={styles.statLabel}>Paid</Text>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>₹{(summary?.paid_amount || 0).toLocaleString()}</Text>
                </Card>
                <Card style={[styles.statCard, { borderBottomColor: '#EF4444', borderBottomWidth: 4 }]}>
                    <Text style={styles.statLabel}>Pending</Text>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>₹{(summary?.pending_amount || 0).toLocaleString()}</Text>
                </Card>
            </View>

            {/* Upcoming Installments */}
            <Text style={styles.sectionTitle}>Breakdown / Installments</Text>
            <Card style={styles.tableCard}>
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Fee Head</DataTable.Title>
                        <DataTable.Title numeric>Amount</DataTable.Title>
                        <DataTable.Title numeric>Status</DataTable.Title>
                    </DataTable.Header>

                    {summary?.installments?.map((inst, index) => (
                        <DataTable.Row key={index}>
                            <DataTable.Cell>{inst.fee_head_name || 'Annual Fee'}</DataTable.Cell>
                            <DataTable.Cell numeric>₹{inst.amount?.toLocaleString()}</DataTable.Cell>
                            <DataTable.Cell numeric>
                                <Text style={{ color: inst.status === 'paid' ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                                    {inst.status?.toUpperCase()}
                                </Text>
                            </DataTable.Cell>
                        </DataTable.Row>
                    )) || (
                            <View style={styles.emptyTable}>
                                <Text>No installments found</Text>
                            </View>
                        )}
                </DataTable>
            </Card>

            {/* Payment History */}
            <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Payment History</Text>
                <Button mode="text" labelStyle={{ fontSize: 12 }}>View All</Button>
            </View>
            <Card style={styles.historyCard}>
                {summary?.payments?.map((payment, index) => (
                    <React.Fragment key={index}>
                        <List.Item
                            title={`₹${payment.amount?.toLocaleString()}`}
                            description={`${payment.payment_mode} | ${new Date(payment.payment_date).toLocaleDateString()}`}
                            left={props => <List.Icon {...props} icon="receipt-outline" color="#3B82F6" />}
                            right={props => <IconButton {...props} icon="chevron-right" />}
                        />
                        {index < summary.payments.length - 1 && <Divider />}
                    </React.Fragment>
                )) || (
                        <View style={styles.emptyHistory}>
                            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No payment records found</Text>
                        </View>
                    )}
            </Card>

            <View style={styles.actionContainer}>
                <Button
                    mode="contained"
                    style={styles.payButton}
                    contentStyle={styles.payButtonContent}
                    onPress={() => { }}
                >
                    Collect Payment
                </Button>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    profileCard: { margin: 15, borderRadius: 16, elevation: 2 },
    profileContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    studentBasic: { flex: 1 },
    studentName: { fontSize: 18, fontWeight: 'bold' },
    admissionNo: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    statusChip: { height: 26, backgroundColor: '#DEF7EC' },
    statsRow: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginTop: 5 },
    statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
    statLabel: { fontSize: 11, color: '#6B7280' },
    statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 15, marginTop: 20, marginBottom: 10, color: '#374151' },
    tableCard: { marginHorizontal: 15, borderRadius: 12, elevation: 1 },
    emptyTable: { padding: 20, alignItems: 'center' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    historyCard: { marginHorizontal: 15, borderRadius: 12, elevation: 1, overflow: 'hidden' },
    emptyHistory: { padding: 30, alignItems: 'center' },
    emptyText: { marginTop: 10, color: '#9CA3AF' },
    actionContainer: { padding: 20, marginTop: 10 },
    payButton: { borderRadius: 12 },
    payButtonContent: { height: 50 },
});

export default StudentLedgerScreen;
