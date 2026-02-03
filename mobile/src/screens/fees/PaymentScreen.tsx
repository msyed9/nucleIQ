import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Share, Alert, Linking } from 'react-native';
import {
    Text,
    Card,
    useTheme,
    Button,
    RadioButton,
    TextInput,
    ActivityIndicator,
    Divider,
    Portal,
    Modal,
    IconButton,
    Chip
} from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { feesAPI } from '../../services/api';

interface PaymentGateway {
    id: string;
    name: string;
    type: string;
    supports_qr: boolean;
    supports_payment_link: boolean;
    upi_vpa?: string;
}

interface PaymentOrder {
    transaction_id: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    order_id?: string;
    payment_link?: string;
    qr_code?: string;
    upi_url?: string;
    upi_vpa?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    student_name: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    due_date: string;
    status: string;
}

type PaymentScreenRouteProp = RouteProp<{ Payment: { invoiceId: string } }, 'Payment'>;

const PaymentScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<PaymentScreenRouteProp>();
    const { invoiceId } = route.params;

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [selectedGateway, setSelectedGateway] = useState<string>('upi');
    const [amount, setAmount] = useState<string>('0');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showSendLinkModal, setShowSendLinkModal] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sendChannel, setSendChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
    const [sendingLink, setSendingLink] = useState(false);

    useEffect(() => {
        loadData();
    }, [invoiceId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch invoice details
            const invoiceData = await feesAPI.getInvoice(invoiceId);
            setInvoice(invoiceData);
            setAmount(invoiceData.balance_amount.toString());

            // Fetch available gateways
            const gatewayData = await feesAPI.getGatewayConfig();
            setGateways(gatewayData.gateways || []);
            if (gatewayData.default_gateway) {
                setSelectedGateway(gatewayData.default_gateway);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Error', 'Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const initiatePayment = async () => {
        if (!invoice || parseFloat(amount) <= 0) return;

        try {
            setProcessing(true);

            const orderData = await feesAPI.createPaymentOrder({
                invoice_id: invoice.id,
                gateway: selectedGateway,
                amount: parseFloat(amount)
            });

            setPaymentOrder(orderData);

            if (selectedGateway === 'upi' || selectedGateway === 'googlepay' || selectedGateway === 'phonepe') {
                if (orderData.upi_url) {
                    // Try to open UPI app
                    const supported = await Linking.canOpenURL(orderData.upi_url);
                    if (supported) {
                        await Linking.openURL(orderData.upi_url);
                    } else {
                        // Show QR code if UPI app not available
                        setShowQRModal(true);
                    }
                } else if (orderData.qr_code) {
                    setShowQRModal(true);
                }
            } else if (orderData.payment_link) {
                // Open payment link in browser
                await Linking.openURL(orderData.payment_link);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to initiate payment');
        } finally {
            setProcessing(false);
        }
    };

    const generateQR = async () => {
        if (!invoice) return;

        try {
            setProcessing(true);
            const qrData = await feesAPI.generateQR({
                invoice_id: invoice.id,
                amount: parseFloat(amount)
            });
            setPaymentOrder(qrData);
            setShowQRModal(true);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to generate QR');
        } finally {
            setProcessing(false);
        }
    };

    const sendPaymentLink = async () => {
        if (!invoice || !phoneNumber) return;

        try {
            setSendingLink(true);
            const result = await feesAPI.sendPaymentLink({
                invoice_id: invoice.id,
                phone: phoneNumber,
                channel: sendChannel,
                include_qr: true
            });

            Alert.alert(
                'Success',
                `Payment link sent via ${sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}`
            );
            setShowSendLinkModal(false);
            setPhoneNumber('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send payment link');
        } finally {
            setSendingLink(false);
        }
    };

    const sharePaymentLink = async () => {
        if (!paymentOrder?.payment_link) return;

        try {
            await Share.share({
                message: `Fee Payment Link: ₹${paymentOrder.amount}\n\n${paymentOrder.payment_link}`,
                title: 'Fee Payment Link'
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    const getGatewayIcon = (gatewayId: string) => {
        switch (gatewayId) {
            case 'razorpay':
                return 'credit-card-outline';
            case 'phonepe':
                return 'cellphone';
            case 'googlepay':
                return 'google';
            case 'upi':
                return 'bank-transfer';
            default:
                return 'credit-card';
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle" size={60} color="#EF4444" />
                <Text style={styles.errorText}>Invoice not found</Text>
                <Button mode="contained" onPress={() => navigation.goBack()}>
                    Go Back
                </Button>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Invoice Summary */}
                <Card style={styles.invoiceCard}>
                    <Card.Content>
                        <View style={styles.invoiceHeader}>
                            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                            <Chip
                                style={[
                                    styles.statusChip,
                                    { backgroundColor: invoice.status === 'PAID' ? '#DEF7EC' : '#FEE2E2' }
                                ]}
                            >
                                {invoice.status}
                            </Chip>
                        </View>

                        <Text style={styles.studentName}>{invoice.student_name}</Text>

                        <Divider style={styles.divider} />

                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Total Amount</Text>
                            <Text style={styles.amountValue}>₹{invoice.total_amount.toLocaleString()}</Text>
                        </View>
                        <View style={styles.amountRow}>
                            <Text style={styles.amountLabel}>Paid</Text>
                            <Text style={[styles.amountValue, { color: '#10B981' }]}>
                                ₹{invoice.paid_amount.toLocaleString()}
                            </Text>
                        </View>
                        <View style={[styles.amountRow, styles.balanceRow]}>
                            <Text style={styles.balanceLabel}>Balance Due</Text>
                            <Text style={styles.balanceValue}>₹{invoice.balance_amount.toLocaleString()}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Payment Amount */}
                <Card style={styles.amountCard}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Payment Amount</Text>
                        <TextInput
                            mode="outlined"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            left={<TextInput.Affix text="₹" />}
                            style={styles.amountInput}
                        />
                        <View style={styles.quickAmounts}>
                            <Button
                                mode="outlined"
                                compact
                                onPress={() => setAmount(invoice.balance_amount.toString())}
                            >
                                Full
                            </Button>
                            <Button
                                mode="outlined"
                                compact
                                onPress={() => setAmount(Math.ceil(invoice.balance_amount / 2).toString())}
                            >
                                Half
                            </Button>
                            <Button
                                mode="outlined"
                                compact
                                onPress={() => setAmount(Math.ceil(invoice.balance_amount / 4).toString())}
                            >
                                Quarter
                            </Button>
                        </View>
                    </Card.Content>
                </Card>

                {/* Payment Method Selection */}
                <Card style={styles.methodCard}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <RadioButton.Group onValueChange={setSelectedGateway} value={selectedGateway}>
                            {gateways.map((gateway) => (
                                <View key={gateway.id} style={styles.radioRow}>
                                    <RadioButton value={gateway.id} />
                                    <MaterialCommunityIcons
                                        name={getGatewayIcon(gateway.id) as any}
                                        size={24}
                                        color={theme.colors.primary}
                                        style={styles.gatewayIcon}
                                    />
                                    <View style={styles.gatewayInfo}>
                                        <Text style={styles.gatewayName}>{gateway.name}</Text>
                                        <Text style={styles.gatewayType}>{gateway.type}</Text>
                                    </View>
                                </View>
                            ))}
                        </RadioButton.Group>
                    </Card.Content>
                </Card>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <Button
                        mode="contained"
                        style={styles.payButton}
                        contentStyle={styles.payButtonContent}
                        loading={processing}
                        disabled={processing || parseFloat(amount) <= 0}
                        onPress={initiatePayment}
                    >
                        Pay ₹{parseFloat(amount || '0').toLocaleString()}
                    </Button>

                    <View style={styles.secondaryActions}>
                        <Button
                            mode="outlined"
                            icon="qrcode"
                            style={styles.secondaryButton}
                            onPress={generateQR}
                        >
                            Show QR
                        </Button>
                        <Button
                            mode="outlined"
                            icon="send"
                            style={styles.secondaryButton}
                            onPress={() => setShowSendLinkModal(true)}
                        >
                            Send Link
                        </Button>
                    </View>
                </View>
            </ScrollView>

            {/* QR Code Modal */}
            <Portal>
                <Modal
                    visible={showQRModal}
                    onDismiss={() => setShowQRModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Scan to Pay</Text>
                            <IconButton icon="close" onPress={() => setShowQRModal(false)} />
                        </View>

                        {paymentOrder?.qr_code && (
                            <Image
                                source={{ uri: paymentOrder.qr_code }}
                                style={styles.qrImage}
                                resizeMode="contain"
                            />
                        )}

                        <Text style={styles.qrAmount}>₹{paymentOrder?.amount?.toLocaleString()}</Text>

                        {paymentOrder?.upi_vpa && (
                            <Text style={styles.upiId}>{paymentOrder.upi_vpa}</Text>
                        )}

                        <Text style={styles.qrInstruction}>
                            Open any UPI app and scan this QR code to pay
                        </Text>

                        <Button
                            mode="outlined"
                            icon="share-variant"
                            onPress={sharePaymentLink}
                            style={styles.shareButton}
                        >
                            Share Payment Link
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Send Link Modal */}
            <Portal>
                <Modal
                    visible={showSendLinkModal}
                    onDismiss={() => setShowSendLinkModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Send Payment Link</Text>
                            <IconButton icon="close" onPress={() => setShowSendLinkModal(false)} />
                        </View>

                        <TextInput
                            mode="outlined"
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            style={styles.phoneInput}
                        />

                        <Text style={styles.channelLabel}>Send via:</Text>
                        <RadioButton.Group onValueChange={(val) => setSendChannel(val as any)} value={sendChannel}>
                            <View style={styles.channelRow}>
                                <View style={styles.channelOption}>
                                    <RadioButton value="whatsapp" />
                                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                    <Text>WhatsApp</Text>
                                </View>
                                <View style={styles.channelOption}>
                                    <RadioButton value="sms" />
                                    <Ionicons name="chatbox" size={24} color="#3B82F6" />
                                    <Text>SMS</Text>
                                </View>
                            </View>
                        </RadioButton.Group>

                        <Button
                            mode="contained"
                            loading={sendingLink}
                            disabled={sendingLink || !phoneNumber}
                            onPress={sendPaymentLink}
                            style={styles.sendButton}
                        >
                            Send Link
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        color: '#6B7280',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 16,
    },
    invoiceCard: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    invoiceNumber: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'monospace',
    },
    statusChip: {
        height: 24,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    divider: {
        marginVertical: 12,
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    amountLabel: {
        color: '#6B7280',
    },
    amountValue: {
        fontWeight: '600',
    },
    balanceRow: {
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    balanceLabel: {
        fontWeight: '600',
        color: '#4338CA',
    },
    balanceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4338CA',
    },
    amountCard: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    amountInput: {
        fontSize: 24,
        marginBottom: 12,
    },
    quickAmounts: {
        flexDirection: 'row',
        gap: 8,
    },
    methodCard: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    gatewayIcon: {
        marginHorizontal: 12,
    },
    gatewayInfo: {
        flex: 1,
    },
    gatewayName: {
        fontSize: 16,
        fontWeight: '500',
    },
    gatewayType: {
        fontSize: 12,
        color: '#6B7280',
    },
    actionButtons: {
        gap: 12,
    },
    payButton: {
        borderRadius: 12,
    },
    payButtonContent: {
        height: 56,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        borderRadius: 12,
    },
    modalContainer: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
    },
    modalContent: {
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    qrImage: {
        width: 200,
        height: 200,
        marginVertical: 16,
    },
    qrAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4338CA',
    },
    upiId: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'monospace',
        marginTop: 4,
    },
    qrInstruction: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    shareButton: {
        width: '100%',
    },
    phoneInput: {
        width: '100%',
        marginBottom: 16,
    },
    channelLabel: {
        alignSelf: 'flex-start',
        marginBottom: 8,
        fontWeight: '500',
    },
    channelRow: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 16,
    },
    channelOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sendButton: {
        width: '100%',
        borderRadius: 12,
    },
});

export default PaymentScreen;
