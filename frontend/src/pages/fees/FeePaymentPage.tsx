import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    CreditCard,
    Smartphone,
    QrCode,
    Send,
    CheckCircle,
    AlertCircle,
    Copy,
    Download,
    X,
    Loader2,
    MessageCircle,
    IndianRupee
} from 'lucide-react';
import './FeePayment.css';

interface PaymentGateway {
    id: string;
    name: string;
    type: string;
    supports_qr: boolean;
    supports_payment_link: boolean;
    key?: string;
    upi_vpa?: string;
}

interface PaymentOrder {
    transaction_id: string;
    amount: number;
    currency: string;
    gateway: string;
    status: string;
    order_id?: string;
    razorpay_key?: string;
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

const FeePaymentPage: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [selectedGateway, setSelectedGateway] = useState<string>('');
    const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [showSendLinkModal, setShowSendLinkModal] = useState(false);
    const [sendLinkPhone, setSendLinkPhone] = useState('');
    const [sendLinkChannel, setSendLinkChannel] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
    const [sendLinkLoading, setSendLinkLoading] = useState(false);
    const [sendLinkResult, setSendLinkResult] = useState<any>(null);
    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        fetchData();
    }, [invoiceId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch invoice details
            const invoiceResponse = await fetch(`/api/fees/invoices/${invoiceId}/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!invoiceResponse.ok) throw new Error('Failed to fetch invoice');
            const invoiceData = await invoiceResponse.json();
            setInvoice(invoiceData);
            setAmount(invoiceData.balance_amount);

            // Fetch available payment gateways
            const gatewayResponse = await fetch('/api/fees/payment-gateway/gateway_config/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (gatewayResponse.ok) {
                const gatewayData = await gatewayResponse.json();
                setGateways(gatewayData.gateways || []);
                if (gatewayData.gateways?.length > 0) {
                    setSelectedGateway(gatewayData.default_gateway || gatewayData.gateways[0].id);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load payment details');
        } finally {
            setLoading(false);
        }
    };

    const createPaymentOrder = async () => {
        if (!invoice || !selectedGateway) return;

        try {
            setProcessing(true);
            setError(null);

            const response = await fetch('/api/fees/payment-gateway/create_order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    invoice_id: invoice.id,
                    gateway: selectedGateway,
                    amount: amount
                })
            });

            if (!response.ok) throw new Error('Failed to create payment order');

            const orderData = await response.json();
            setPaymentOrder(orderData);

            // Handle different gateways
            if (selectedGateway === 'razorpay' && orderData.razorpay_key) {
                openRazorpayCheckout(orderData);
            } else if (orderData.qr_code) {
                setShowQRModal(true);
            } else if (orderData.payment_link) {
                window.open(orderData.payment_link, '_blank');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initiate payment');
        } finally {
            setProcessing(false);
        }
    };

    const openRazorpayCheckout = (order: PaymentOrder) => {
        const options = {
            key: order.razorpay_key,
            amount: order.amount * 100,
            currency: order.currency || 'INR',
            name: 'School Fee Payment',
            description: `Invoice: ${invoice?.invoice_number}`,
            order_id: order.order_id,
            handler: async function (response: any) {
                // Verify payment
                try {
                    const verifyResponse = await fetch('/api/fees/payment-gateway/verify_payment/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            gateway: 'razorpay',
                            invoice_id: invoice?.id,
                            payment_data: {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            }
                        })
                    });

                    if (verifyResponse.ok) {
                        setSuccess(true);
                        setTimeout(() => {
                            navigate('/fees/history');
                        }, 3000);
                    } else {
                        setError('Payment verification failed. Please contact support.');
                    }
                } catch (err) {
                    setError('Payment verification failed. Please contact support.');
                }
            },
            prefill: {
                name: invoice?.student_name,
            },
            theme: {
                color: '#6366f1'
            }
        };

        // @ts-ignore
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const sendPaymentLink = async () => {
        if (!invoice || !sendLinkPhone) return;

        try {
            setSendLinkLoading(true);

            const response = await fetch('/api/fees/payment-gateway/send_payment_link/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    invoice_id: invoice.id,
                    phone: sendLinkPhone,
                    channel: sendLinkChannel,
                    include_qr: true
                })
            });

            const result = await response.json();
            setSendLinkResult(result);

            if (response.ok) {
                setTimeout(() => {
                    setShowSendLinkModal(false);
                    setSendLinkResult(null);
                    setSendLinkPhone('');
                }, 3000);
            }
        } catch (err: any) {
            setSendLinkResult({ errors: [err.message] });
        } finally {
            setSendLinkLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Show toast notification
    };

    const getGatewayIcon = (gatewayId: string) => {
        switch (gatewayId) {
            case 'razorpay':
                return <CreditCard size={24} />;
            case 'phonepe':
            case 'googlepay':
            case 'upi':
                return <Smartphone size={24} />;
            default:
                return <CreditCard size={24} />;
        }
    };

    if (loading) {
        return (
            <div className="fee-payment-loading">
                <Loader2 className="spin" size={48} />
                <p>Loading payment details...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="fee-payment-success">
                <div className="success-icon">
                    <CheckCircle size={80} color="#10b981" />
                </div>
                <h2>Payment Successful!</h2>
                <p>Your payment has been processed successfully.</p>
                <p className="redirect-text">Redirecting to payment history...</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="fee-payment-error">
                <AlertCircle size={48} />
                <h2>Invoice Not Found</h2>
                <p>The requested invoice could not be found.</p>
                <button onClick={() => navigate('/fees')} className="btn-primary">
                    Go to Fees
                </button>
            </div>
        );
    }

    return (
        <div className="fee-payment-page">
            <div className="fee-payment-header">
                <h1>Fee Payment</h1>
                <p>Complete your payment securely</p>
            </div>

            {error && (
                <div className="payment-error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="fee-payment-content">
                {/* Invoice Summary */}
                <div className="invoice-summary-card">
                    <h3>Invoice Details</h3>
                    <div className="invoice-details">
                        <div className="detail-row">
                            <span>Invoice Number</span>
                            <strong>{invoice.invoice_number}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Student Name</span>
                            <strong>{invoice.student_name}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Total Amount</span>
                            <strong>₹{invoice.total_amount.toLocaleString()}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Already Paid</span>
                            <strong className="text-green">₹{invoice.paid_amount.toLocaleString()}</strong>
                        </div>
                        <div className="detail-row highlight">
                            <span>Balance Due</span>
                            <strong className="text-primary">₹{invoice.balance_amount.toLocaleString()}</strong>
                        </div>
                        {invoice.due_date && (
                            <div className="detail-row">
                                <span>Due Date</span>
                                <strong>{new Date(invoice.due_date).toLocaleDateString()}</strong>
                            </div>
                        )}
                    </div>

                    {/* Payment Amount Input */}
                    <div className="payment-amount-input">
                        <label>Payment Amount</label>
                        <div className="amount-input-wrapper">
                            <IndianRupee size={20} />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.min(parseFloat(e.target.value) || 0, invoice.balance_amount))}
                                max={invoice.balance_amount}
                                min={1}
                            />
                        </div>
                        <div className="amount-shortcuts">
                            <button onClick={() => setAmount(invoice.balance_amount)}>Full Amount</button>
                            <button onClick={() => setAmount(Math.ceil(invoice.balance_amount / 2))}>Half</button>
                        </div>
                    </div>
                </div>

                {/* Payment Gateway Selection */}
                <div className="payment-gateway-card">
                    <h3>Select Payment Method</h3>
                    <div className="gateway-options">
                        {gateways.map((gateway) => (
                            <div
                                key={gateway.id}
                                className={`gateway-option ${selectedGateway === gateway.id ? 'selected' : ''}`}
                                onClick={() => setSelectedGateway(gateway.id)}
                            >
                                <div className="gateway-icon">
                                    {getGatewayIcon(gateway.id)}
                                </div>
                                <div className="gateway-info">
                                    <span className="gateway-name">{gateway.name}</span>
                                    <span className="gateway-type">{gateway.type}</span>
                                </div>
                                <div className="gateway-check">
                                    {selectedGateway === gateway.id && <CheckCircle size={20} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Options */}
                    <div className="payment-actions">
                        <button
                            className="btn-primary btn-pay"
                            onClick={createPaymentOrder}
                            disabled={processing || !selectedGateway || amount <= 0}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    Pay ₹{amount.toLocaleString()}
                                </>
                            )}
                        </button>

                        <div className="action-buttons">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setSelectedGateway('upi');
                                    createPaymentOrder();
                                }}
                            >
                                <QrCode size={20} />
                                Show QR Code
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => setShowSendLinkModal(true)}
                            >
                                <MessageCircle size={20} />
                                Send Payment Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQRModal && paymentOrder?.qr_code && (
                <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Scan to Pay</h3>
                            <button onClick={() => setShowQRModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="qr-code-container">
                            <img src={paymentOrder.qr_code} alt="Payment QR Code" />
                        </div>
                        <div className="qr-info">
                            <p className="amount">₹{paymentOrder.amount.toLocaleString()}</p>
                            <p className="upi-id">{paymentOrder.upi_vpa}</p>
                        </div>
                        <div className="qr-actions">
                            {paymentOrder.upi_vpa && (
                                <button
                                    className="btn-secondary"
                                    onClick={() => copyToClipboard(paymentOrder.upi_vpa!)}
                                >
                                    <Copy size={16} />
                                    Copy UPI ID
                                </button>
                            )}
                            <button className="btn-secondary">
                                <Download size={16} />
                                Download QR
                            </button>
                        </div>
                        <p className="qr-instruction">
                            Open any UPI app (PhonePe, Google Pay, Paytm) and scan this QR code to pay.
                        </p>
                    </div>
                </div>
            )}

            {/* Send Link Modal */}
            {showSendLinkModal && (
                <div className="modal-overlay" onClick={() => setShowSendLinkModal(false)}>
                    <div className="send-link-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Send Payment Link</h3>
                            <button onClick={() => setShowSendLinkModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {sendLinkResult ? (
                            <div className={`send-result ${sendLinkResult.errors ? 'error' : 'success'}`}>
                                {sendLinkResult.errors ? (
                                    <>
                                        <AlertCircle size={48} />
                                        <p>Failed to send payment link</p>
                                        <small>{sendLinkResult.errors.join(', ')}</small>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={48} />
                                        <p>Payment link sent successfully!</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="send-link-form">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={sendLinkPhone}
                                        onChange={(e) => setSendLinkPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Send Via</label>
                                    <div className="channel-options">
                                        <label className={sendLinkChannel === 'whatsapp' ? 'selected' : ''}>
                                            <input
                                                type="radio"
                                                name="channel"
                                                value="whatsapp"
                                                checked={sendLinkChannel === 'whatsapp'}
                                                onChange={() => setSendLinkChannel('whatsapp')}
                                            />
                                            <MessageCircle size={20} />
                                            WhatsApp
                                        </label>
                                        <label className={sendLinkChannel === 'sms' ? 'selected' : ''}>
                                            <input
                                                type="radio"
                                                name="channel"
                                                value="sms"
                                                checked={sendLinkChannel === 'sms'}
                                                onChange={() => setSendLinkChannel('sms')}
                                            />
                                            <Smartphone size={20} />
                                            SMS
                                        </label>
                                        <label className={sendLinkChannel === 'both' ? 'selected' : ''}>
                                            <input
                                                type="radio"
                                                name="channel"
                                                value="both"
                                                checked={sendLinkChannel === 'both'}
                                                onChange={() => setSendLinkChannel('both')}
                                            />
                                            Both
                                        </label>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={sendPaymentLink}
                                    disabled={sendLinkLoading || !sendLinkPhone}
                                >
                                    {sendLinkLoading ? (
                                        <>
                                            <Loader2 className="spin" size={20} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Send Payment Link
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeePaymentPage;
