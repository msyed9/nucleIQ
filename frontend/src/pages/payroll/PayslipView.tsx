/**
 * Payslip View - View and download payslips
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PayslipView.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface PayslipComponent {
    component_name: string;
    component_type: string;
    amount: number;
}

interface Payslip {
    id: string;
    cycle_month: string;
    cycle_year: number;
    staff_name: string;
    total_working_days: number;
    days_present: number;
    days_absent: number;
    paid_leaves: number;
    base_salary: number;
    gross_salary: number;
    total_deductions: number;
    loss_of_pay: number;
    net_salary: number;
    components: PayslipComponent[];
}

const PayslipView: React.FC = () => {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchPayslips = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/payroll/payslips/my_payslips/`,
                { headers: getAuthHeaders() }
            );
            setPayslips(response.data.results || response.data);
            if ((response.data.results || response.data).length > 0) {
                setSelectedPayslip((response.data.results || response.data)[0]);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching payslips');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!selectedPayslip) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${API_BASE_URL}/payroll/payslips/${selectedPayslip.id}/download_pdf/`,
                {
                    headers: getAuthHeaders(),
                    responseType: 'blob'
                }
            );

            // Extract filename from Content-Disposition header or create default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `Payslip_${selectedPayslip.staff_name.replace(' ', '_')}_${selectedPayslip.cycle_month}${selectedPayslip.cycle_year}.pdf`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Download error:', err);
            setError(err.response?.data?.error || 'Failed to download payslip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const earnings = selectedPayslip?.components.filter(c => c.component_type === 'EARNING') || [];
    const deductions = selectedPayslip?.components.filter(c => c.component_type === 'DEDUCTION') || [];

    return (
        <div className="payslip-view">
            <div className="payslip-header">
                <h1>💰 My Payslips</h1>
                <p>View and download your salary slips</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="payslip-container">
                {/* Payslip List */}
                <div className="payslip-list">
                    <h2>Payslip History</h2>
                    {loading ? (
                        <div className="loading">Loading...</div>
                    ) : payslips.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📄</div>
                            <p>No payslips available</p>
                        </div>
                    ) : (
                        payslips.map((payslip) => (
                            <div
                                key={payslip.id}
                                className={`payslip-item ${selectedPayslip?.id === payslip.id ? 'active' : ''}`}
                                onClick={() => setSelectedPayslip(payslip)}
                            >
                                <div className="payslip-month">
                                    {payslip.cycle_month} {payslip.cycle_year}
                                </div>
                                <div className="payslip-amount">
                                    {formatCurrency(payslip.net_salary)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Payslip Detail */}
                {selectedPayslip && (
                    <div className="payslip-detail">
                        <div className="payslip-title">
                            <h2>Payslip for {selectedPayslip.cycle_month} {selectedPayslip.cycle_year}</h2>
                            <button
                                className="btn-download"
                                onClick={downloadPDF}
                                disabled={loading}
                            >
                                {loading ? '⏳ Generating...' : '📥 Download PDF'}
                            </button>
                        </div>

                        {/* Employee Info */}
                        <div className="info-section">
                            <h3>Employee Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="label">Name:</span>
                                    <span className="value">{selectedPayslip.staff_name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Period:</span>
                                    <span className="value">{selectedPayslip.cycle_month} {selectedPayslip.cycle_year}</span>
                                </div>
                            </div>
                        </div>

                        {/* Attendance */}
                        <div className="info-section">
                            <h3>Attendance Summary</h3>
                            <div className="attendance-grid">
                                <div className="attendance-item">
                                    <div className="att-value">{selectedPayslip.total_working_days}</div>
                                    <div className="att-label">Working Days</div>
                                </div>
                                <div className="attendance-item">
                                    <div className="att-value">{selectedPayslip.days_present}</div>
                                    <div className="att-label">Present</div>
                                </div>
                                <div className="attendance-item">
                                    <div className="att-value">{selectedPayslip.paid_leaves}</div>
                                    <div className="att-label">Paid Leaves</div>
                                </div>
                                <div className="attendance-item absent">
                                    <div className="att-value">{selectedPayslip.days_absent}</div>
                                    <div className="att-label">Absent</div>
                                </div>
                            </div>
                        </div>

                        {/* Salary Breakdown */}
                        <div className="salary-breakdown">
                            <div className="breakdown-column">
                                <h3>Earnings</h3>
                                <div className="component-list">
                                    <div className="component-item">
                                        <span>Base Salary</span>
                                        <span>{formatCurrency(selectedPayslip.base_salary)}</span>
                                    </div>
                                    {earnings.map((comp, idx) => (
                                        <div key={idx} className="component-item">
                                            <span>{comp.component_name}</span>
                                            <span>{formatCurrency(comp.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="component-item total">
                                        <span>Gross Salary</span>
                                        <span>{formatCurrency(selectedPayslip.gross_salary + selectedPayslip.loss_of_pay)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="breakdown-column">
                                <h3>Deductions</h3>
                                <div className="component-list">
                                    {selectedPayslip.loss_of_pay > 0 && (
                                        <div className="component-item loss-of-pay">
                                            <span>Loss of Pay</span>
                                            <span>-{formatCurrency(selectedPayslip.loss_of_pay)}</span>
                                        </div>
                                    )}
                                    {deductions.map((comp, idx) => (
                                        <div key={idx} className="component-item">
                                            <span>{comp.component_name}</span>
                                            <span>-{formatCurrency(comp.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="component-item total">
                                        <span>Total Deductions</span>
                                        <span>-{formatCurrency(selectedPayslip.total_deductions + selectedPayslip.loss_of_pay)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Salary */}
                        <div className="net-salary">
                            <div className="net-label">Net Salary</div>
                            <div className="net-amount">{formatCurrency(selectedPayslip.net_salary)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayslipView;
