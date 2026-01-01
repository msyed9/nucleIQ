/**
 * Subscription Management Page
 * Displays current subscription, allows upgrades, and shows invoices
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlan {
    id: string;
    name: string;
    plan_type: string;
    description: string;
    price_monthly: number;
    price_quarterly: number;
    price_yearly: number;
    currency: string;
    max_students: number;
    max_staff: number;
    max_storage_gb: number;
    features: Record<string, boolean>;
}

interface Subscription {
    id: string;
    plan_details: SubscriptionPlan;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    auto_renew: boolean;
    days_until_renewal_count: number;
}

interface Invoice {
    id: string;
    invoice_number: string;
    total_amount: number;
    currency: string;
    status: string;
    issue_date: string;
    due_date: string;
    pdf_url?: string;
}

export const SubscriptionManage: React.FC = () => {
    useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subRes, plansRes, invoicesRes] = await Promise.all([
                axios.get('/api/billing/subscriptions/current/'),
                axios.get('/api/billing/plans/'),
                axios.get('/api/billing/invoices/'),
            ]);

            setSubscription(subRes.data);
            setPlans(plansRes.data);
            setInvoices(invoicesRes.data.results || invoicesRes.data);
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        if (!subscription) return;

        try {
            await axios.post(`/api/billing/subscriptions/${subscription.id}/upgrade/`, {
                new_plan_id: planId,
                billing_cycle: selectedBillingCycle,
            });

            alert(t('billing.upgrade_success'));
            fetchData();
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert(t('billing.upgrade_failed'));
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription || !confirm(t('billing.confirm_cancel'))) return;

        try {
            await axios.post(`/api/billing/subscriptions/${subscription.id}/cancel/`);
            alert(t('billing.cancel_success'));
            fetchData();
        } catch (error) {
            console.error('Cancellation failed:', error);
            alert(t('billing.cancel_failed'));
        }
    };

    const handlePayInvoice = async (invoiceId: string) => {
        try {
            const response = await axios.post(`/api/billing/invoices/${invoiceId}/pay/`, {
                gateway: 'razorpay',
            });

            // Redirect to payment link
            if (response.data.payment_link) {
                window.location.href = response.data.payment_link;
            }
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert(t('billing.payment_failed'));
        }
    };

    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">{t('billing.title', 'Subscription Management')}</h1>

            {/* Current Subscription */}
            {subscription && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">{t('billing.current_subscription', 'Current Subscription')}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-gray-600">{t('billing.plan', 'Plan')}</p>
                            <p className="text-xl font-semibold">{subscription.plan_details.name}</p>
                        </div>

                        <div>
                            <p className="text-gray-600">{t('billing.status', 'Status')}</p>
                            <p className={`text-xl font-semibold ${subscription.status === 'active' ? 'text-green-600' :
                                subscription.status === 'trial' ? 'text-blue-600' :
                                    'text-red-600'
                                }`}>
                                {t(`billing.status_${subscription.status.toLowerCase()}`, { defaultValue: subscription.status.toUpperCase() })}
                            </p>
                        </div>

                        <div>
                            <p className="text-gray-600">{t('billing.billing_cycle', 'Billing Cycle')}</p>
                            <p className="text-xl font-semibold capitalize">{subscription.billing_cycle}</p>
                        </div>

                        <div>
                            <p className="text-gray-600">{t('billing.renews_in', 'Renews In')}</p>
                            <p className="text-xl font-semibold">{subscription.days_until_renewal_count} days</p>
                        </div>
                    </div>

                    {/* Usage Limits */}
                    <div className="border-t pt-4 mb-4">
                        <h3 className="font-semibold mb-2">{t('billing.plan_limits', 'Plan Limits')}</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{subscription.plan_details.max_students}</p>
                                <p className="text-sm text-gray-600">{t('billing.plan_students', 'Students')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{subscription.plan_details.max_staff}</p>
                                <p className="text-sm text-gray-600">{t('billing.plan_staff', 'Staff')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{subscription.plan_details.max_storage_gb} GB</p>
                                <p className="text-sm text-gray-600">{t('billing.plan_storage', 'Storage')}</p>
                            </div>
                        </div>
                    </div>

                    {subscription.auto_renew && (
                        <button
                            onClick={handleCancelSubscription}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            {t('billing.cancel_subscription', 'Cancel Subscription')}
                        </button>
                    )}
                </div>
            )}

            {/* Available Plans */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">{t('billing.available_plans', 'Available Plans')}</h2>

                {/* Billing Cycle Selector */}
                <div className="flex gap-2 mb-6">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setSelectedBillingCycle(cycle)}
                            className={`px-4 py-2 rounded ${selectedBillingCycle === cycle
                                ? 'bg-primary text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {t(`billing.select_cycle_${cycle}`)}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const price = selectedBillingCycle === 'monthly' ? plan.price_monthly :
                            selectedBillingCycle === 'quarterly' ? plan.price_quarterly :
                                plan.price_yearly;

                        const isCurrentPlan = subscription?.plan_details.id === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`border rounded-lg p-6 ${isCurrentPlan ? 'border-primary border-2' : 'border-gray-300'
                                    }`}
                            >
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-gray-600 mb-4">{plan.description}</p>

                                <div className="mb-4">
                                    <span className="text-3xl font-bold">{plan.currency} {price}</span>
                                    <span className="text-gray-600">/{selectedBillingCycle}</span>
                                </div>

                                <ul className="mb-6 space-y-2">
                                    <li className="flex items-center">
                                        <span className="text-green-500 mr-2">✓</span>
                                        {plan.max_students} {t('billing.plan_students', 'Students')}
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-500 mr-2">✓</span>
                                        {plan.max_staff} {t('billing.plan_staff', 'Staff')}
                                    </li>
                                    <li className="flex items-center">
                                        <span className="text-green-500 mr-2">✓</span>
                                        {plan.max_storage_gb} GB {t('billing.plan_storage', 'Storage')}
                                    </li>
                                </ul>

                                {!isCurrentPlan && (
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                                    >
                                        {t('billing.upgrade', { plan: plan.name })}
                                    </button>
                                )}

                                {isCurrentPlan && (
                                    <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded text-center font-semibold">
                                        Current Plan
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Invoices */}
            <div>
                <h2 className="text-2xl font-semibold mb-4">{t('billing.invoices', 'Invoices')}</h2>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {invoice.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(invoice.issue_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {invoice.currency} {invoice.total_amount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {invoice.status === 'pending' && (
                                            <button
                                                onClick={() => handlePayInvoice(invoice.id)}
                                                className="text-primary hover:text-primary-dark mr-4"
                                            >
                                                {t('billing.pay_now', 'Pay Now')}
                                            </button>
                                        )}
                                        {invoice.pdf_url && (
                                            <a
                                                href={invoice.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Download PDF
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
