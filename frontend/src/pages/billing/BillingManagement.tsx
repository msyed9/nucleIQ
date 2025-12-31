import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import './Billing.css';

interface SubscriptionPlan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number;
    max_students: number;
    max_staff: number;
    features: string[];
    is_popular: boolean;
}

interface CurrentSubscription {
    id: string;
    plan: SubscriptionPlan;
    status: string;
    current_period_start: string;
    current_period_end: string;
    is_trial: boolean;
    trial_ends_at: string | null;
}

interface Invoice {
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    due_date: string;
    paid_at: string | null;
}

const BillingManagement: React.FC = () => {
    const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'subscription' | 'invoices'>('subscription');

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            const [subsRes, plansRes, invoicesRes] = await Promise.all([
                api.get('/billing/subscriptions/current/'),
                api.get('/billing/plans/'),
                api.get('/billing/invoices/')
            ]);
            setSubscription(subsRes.data);
            setPlans(plansRes.data.results || plansRes.data);
            setInvoices(invoicesRes.data.results || invoicesRes.data);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        try {
            await api.post('/billing/subscriptions/upgrade/', { plan_id: planId });
            alert('Upgrade initiated! You will be redirected to payment.');
            fetchBillingData();
        } catch (error) {
            console.error('Error upgrading plan:', error);
            alert('Failed to upgrade plan. Please try again.');
        }
    };

    if (loading) return <Loading fullScreen text="Loading Billing Information..." />;

    return (
        <div className="billing-page">
            <div className="page-header">
                <h1 className="page-title">💳 Billing & Subscription</h1>
                <p className="page-subtitle">Manage your subscription and billing</p>
            </div>

            <div className="billing-tabs">
                <button
                    className={`tab-button ${activeTab === 'subscription' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subscription')}
                >
                    Subscription
                </button>
                <button
                    className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    Invoices
                </button>
            </div>

            {activeTab === 'subscription' && (
                <>
                    {subscription && (
                        <Card className="current-plan-card">
                            <div className="plan-header">
                                <div>
                                    <h2 className="plan-name">{subscription.plan.name} Plan</h2>
                                    {subscription.is_trial && (
                                        <span className="trial-badge">Trial - Ends {new Date(subscription.trial_ends_at!).toLocaleDateString()}</span>
                                    )}
                                </div>
                                <div className="plan-price">
                                    <span className="price-amount">₹{subscription.plan.price_monthly}</span>
                                    <span className="price-period">/month</span>
                                </div>
                            </div>
                            <div className="plan-details">
                                <div className="detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className={`status-badge status-${subscription.status.toLowerCase()}`}>
                                        {subscription.status}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Current Period:</span>
                                    <span>{new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Max Students:</span>
                                    <span>{subscription.plan.max_students}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Max Staff:</span>
                                    <span>{subscription.plan.max_staff}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    <h2 className="section-title">Available Plans</h2>
                    <div className="plans-grid">
                        {plans.map(plan => (
                            <Card key={plan.id} className={`plan-card ${plan.is_popular ? 'popular' : ''}`}>
                                {plan.is_popular && <div className="popular-badge">Most Popular</div>}
                                <h3 className="plan-card-name">{plan.name}</h3>
                                <div className="plan-card-price">
                                    <span className="price-amount">₹{plan.price_monthly}</span>
                                    <span className="price-period">/month</span>
                                </div>
                                <ul className="plan-features">
                                    <li>✅ Up to {plan.max_students} students</li>
                                    <li>✅ Up to {plan.max_staff} staff members</li>
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx}>✅ {feature}</li>
                                    ))}
                                </ul>
                                <Button
                                    variant={plan.is_popular ? 'primary' : 'outline'}
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={subscription?.plan.id === plan.id}
                                    className="w-full"
                                >
                                    {subscription?.plan.id === plan.id ? 'Current Plan' : 'Upgrade'}
                                </Button>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'invoices' && (
                <Card>
                    <h2 className="section-title">Invoice History</h2>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Paid On</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="font-semibold">{invoice.invoice_number}</td>
                                        <td>₹{invoice.amount.toLocaleString()}</td>
                                        <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${invoice.status.toLowerCase()}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>{invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <Button size="small" variant="outline">Download</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default BillingManagement;
