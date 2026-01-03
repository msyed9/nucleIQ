import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PayrollDashboard.css';

interface PayrollCycle {
    id: number;
    month: number;
    year: number;
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAID';
    total_staff: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    processed_at?: string;
    paid_at?: string;
    remarks?: string;
}

interface Payslip {
    id: number;
    staff_name: string;
    staff_id: number;
    gross_salary: number;
    total_deductions: number;
    net_salary: number;
    status: string;
    payment_date?: string;
}

interface PayrollStats {
    total_staff: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    pending_count: number;
    paid_count: number;
}

const PayrollDashboard: React.FC = () => {
    const [cycles, setCycles] = useState<PayrollCycle[]>([]);
    const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [stats, setStats] = useState<PayrollStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCycleMonth, setNewCycleMonth] = useState(new Date().getMonth() + 1);
    const [newCycleYear, setNewCycleYear] = useState(new Date().getFullYear());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const statusColors: { [key: string]: string } = {
        'DRAFT': '#6b7280',
        'PROCESSING': '#f59e0b',
        'COMPLETED': '#3b82f6',
        'PAID': '#22c55e',
    };

    useEffect(() => {
        fetchCycles();
    }, []);

    useEffect(() => {
        if (selectedCycle) {
            fetchPayslips(selectedCycle.id);
        }
    }, [selectedCycle]);

    const fetchCycles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/payroll/cycles/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cyclesData = response.data.results || response.data;
            setCycles(cyclesData);
            if (cyclesData.length > 0 && !selectedCycle) {
                setSelectedCycle(cyclesData[0]);
            }
        } catch (err) {
            console.error('Error fetching cycles:', err);
        }
    };

    const fetchPayslips = async (cycleId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/payroll/cycles/${cycleId}/payslips/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payslipsData = response.data.results || response.data;
            setPayslips(payslipsData);
            calculateStats(payslipsData);
        } catch (err) {
            console.error('Error fetching payslips:', err);
        }
    };

    const calculateStats = (payslipsData: Payslip[]) => {
        const stats: PayrollStats = {
            total_staff: payslipsData.length,
            total_gross: payslipsData.reduce((sum, p) => sum + Number(p.gross_salary), 0),
            total_deductions: payslipsData.reduce((sum, p) => sum + Number(p.total_deductions), 0),
            total_net: payslipsData.reduce((sum, p) => sum + Number(p.net_salary), 0),
            pending_count: payslipsData.filter(p => !p.payment_date).length,
            paid_count: payslipsData.filter(p => p.payment_date).length,
        };
        setStats(stats);
    };

    const handleCreateCycle = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/payroll/cycles/', {
                month: newCycleMonth,
                year: newCycleYear,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Payroll cycle created successfully!');
            setShowCreateModal(false);
            fetchCycles();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create payroll cycle');
        } finally {
            setLoading(false);
        }
    };

    const handleProcessCycle = async (cycleId: number) => {
        if (!confirm('Process this payroll cycle? This will calculate all salaries.')) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/payroll/cycles/${cycleId}/process/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Payroll processed successfully!');
            fetchCycles();
            if (selectedCycle?.id === cycleId) {
                fetchPayslips(cycleId);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to process payroll');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (cycleId: number) => {
        if (!confirm('Mark this payroll cycle as PAID? This action cannot be undone.')) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/payroll/cycles/${cycleId}/mark_paid/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Payroll marked as paid!');
            fetchCycles();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to mark as paid');
        } finally {
            setLoading(false);
        }
    };

    const [downloadingPayslips, setDownloadingPayslips] = useState<Set<number>>(new Set());

    const downloadPayslip = async (payslipId: number, staffName: string) => {
        setDownloadingPayslips(prev => new Set(prev).add(payslipId));
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/payroll/payslips/${payslipId}/download_pdf/`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Extract filename from Content-Disposition header or create default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `Payslip_${staffName.replace(' ', '_')}.pdf`;

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

            setSuccess('Payslip downloaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Download error:', err);
            setError(err.response?.data?.error || 'Failed to download payslip. Please try again.');
        } finally {
            setDownloadingPayslips(prev => {
                const newSet = new Set(prev);
                newSet.delete(payslipId);
                return newSet;
            });
        }
    };

    return (
        <div className="payroll-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>💰 Payroll Processing</h1>
                    <p>Manage monthly salary processing and payments</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    ➕ Create New Cycle
                </button>
            </div>

            {success && (
                <div className="alert alert-success">
                    <span className="icon">✅</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="payroll-grid">
                {/* Left Panel - Cycles List */}
                <div className="cycles-panel">
                    <h2>📅 Payroll Cycles</h2>
                    <div className="cycles-list">
                        {cycles.length === 0 ? (
                            <div className="empty-state-small">
                                <p>No payroll cycles found</p>
                            </div>
                        ) : (
                            cycles.map(cycle => (
                                <div
                                    key={cycle.id}
                                    className={`cycle-card ${selectedCycle?.id === cycle.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCycle(cycle)}
                                >
                                    <div className="cycle-header">
                                        <h3>{monthNames[cycle.month - 1]} {cycle.year}</h3>
                                        <span
                                            className="status-badge"
                                            style={{ background: statusColors[cycle.status] }}
                                        >
                                            {cycle.status}
                                        </span>
                                    </div>
                                    <div className="cycle-stats">
                                        <div className="stat-item">
                                            <span className="label">Staff:</span>
                                            <span className="value">{cycle.total_staff}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="label">Net Total:</span>
                                            <span className="value">₹{cycle.total_net.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {cycle.status === 'DRAFT' && (
                                        <button
                                            className="btn btn-process"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProcessCycle(cycle.id);
                                            }}
                                        >
                                            ⚙️ Process
                                        </button>
                                    )}
                                    {cycle.status === 'COMPLETED' && (
                                        <button
                                            className="btn btn-paid"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsPaid(cycle.id);
                                            }}
                                        >
                                            ✅ Mark as Paid
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel - Cycle Details */}
                <div className="details-panel">
                    {selectedCycle ? (
                        <>
                            <div className="cycle-info">
                                <h2>
                                    {monthNames[selectedCycle.month - 1]} {selectedCycle.year} Payroll
                                </h2>
                                <span
                                    className="status-badge-large"
                                    style={{ background: statusColors[selectedCycle.status] }}
                                >
                                    {selectedCycle.status}
                                </span>
                            </div>

                            {/* Statistics */}
                            {stats && (
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-icon">👥</div>
                                        <div className="stat-details">
                                            <div className="stat-value">{stats.total_staff}</div>
                                            <div className="stat-label">Total Staff</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">💵</div>
                                        <div className="stat-details">
                                            <div className="stat-value">₹{stats.total_gross.toLocaleString()}</div>
                                            <div className="stat-label">Gross Salary</div>
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">➖</div>
                                        <div className="stat-details">
                                            <div className="stat-value">₹{stats.total_deductions.toLocaleString()}</div>
                                            <div className="stat-label">Deductions</div>
                                        </div>
                                    </div>
                                    <div className="stat-card highlight">
                                        <div className="stat-icon">💰</div>
                                        <div className="stat-details">
                                            <div className="stat-value">₹{stats.total_net.toLocaleString()}</div>
                                            <div className="stat-label">Net Payable</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payslips Table */}
                            <div className="payslips-section">
                                <h3>📄 Payslips ({payslips.length})</h3>
                                <div className="table-container">
                                    <table className="payslips-table">
                                        <thead>
                                            <tr>
                                                <th>Staff Name</th>
                                                <th>Gross Salary</th>
                                                <th>Deductions</th>
                                                <th>Net Salary</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payslips.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="empty-cell">
                                                        No payslips found
                                                    </td>
                                                </tr>
                                            ) : (
                                                payslips.map(payslip => (
                                                    <tr key={payslip.id}>
                                                        <td className="staff-name">{payslip.staff_name}</td>
                                                        <td>₹{Number(payslip.gross_salary).toLocaleString()}</td>
                                                        <td className="deduction">₹{Number(payslip.total_deductions).toLocaleString()}</td>
                                                        <td className="net-salary">₹{Number(payslip.net_salary).toLocaleString()}</td>
                                                        <td>
                                                            {payslip.payment_date ? (
                                                                <span className="paid-badge">✅ Paid</span>
                                                            ) : (
                                                                <span className="pending-badge">⏳ Pending</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn-download"
                                                                onClick={() => downloadPayslip(payslip.id, payslip.staff_name)}
                                                                title="Download Payslip"
                                                                disabled={downloadingPayslips.has(payslip.id)}
                                                            >
                                                                {downloadingPayslips.has(payslip.id) ? '⏳' : '📥'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>No Cycle Selected</h3>
                            <p>Select a payroll cycle to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Cycle Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📅 Create Payroll Cycle</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Month *</label>
                                    <select
                                        value={newCycleMonth}
                                        onChange={(e) => setNewCycleMonth(Number(e.target.value))}
                                        className="form-control"
                                    >
                                        {monthNames.map((month, index) => (
                                            <option key={index} value={index + 1}>
                                                {month}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Year *</label>
                                    <input
                                        type="number"
                                        value={newCycleYear}
                                        onChange={(e) => setNewCycleYear(Number(e.target.value))}
                                        className="form-control"
                                        min="2020"
                                        max="2050"
                                    />
                                </div>
                            </div>

                            <div className="info-box">
                                <strong>ℹ️ Note:</strong>
                                <p>A new payroll cycle will be created in DRAFT status. You can process it later to calculate salaries.</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateCycle}
                                disabled={loading}
                            >
                                {loading ? '⏳ Creating...' : '✅ Create Cycle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollDashboard;
