import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import TrialBalance from '../../components/finance/TrialBalance';
import ProfitLoss from '../../components/finance/ProfitLoss';
import BalanceSheet from '../../components/finance/BalanceSheet';
import CashFlow from '../../components/finance/CashFlow';
import LedgerReport from '../../components/finance/LedgerReport';
import DayBook from '../../components/finance/DayBook';
import './FinancialReports.css';
import { toast } from 'react-hot-toast';

type ReportType = 'trial_balance' | 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'ledger' | 'day_book';

const FinancialReports: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('profit_loss');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await axios.get('/api/finance/accounts/');
                setAccounts(response.data.results || response.data);
            } catch (error) {
                console.error('Error fetching accounts:', error);
            }
        };
        if (reportType === 'ledger') {
            fetchAccounts();
        }
    }, [reportType]);

    const handleExport = () => {
        toast('Exporting report...', { icon: 'ℹ️' });
    };

    const handlePrint = () => {
        window.print();
    };

    const getDatePreset = (preset: string) => {
        const today = new Date();
        let from = new Date();
        let to = new Date();

        switch (preset) {
            case 'THIS_MONTH':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                to = today;
                break;
            case 'LAST_MONTH':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'THIS_QUARTER':
                const quarter = Math.floor(today.getMonth() / 3);
                from = new Date(today.getFullYear(), quarter * 3, 1);
                to = today;
                break;
            case 'THIS_YEAR':
                from = new Date(today.getFullYear(), 0, 1);
                to = today;
                break;
        }

        setStartDate(from.toISOString().split('T')[0]);
        setEndDate(to.toISOString().split('T')[0]);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
                <p className="text-gray-600 mt-1">Comprehensive financial statements and analysis</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setReportType('trial_balance')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'trial_balance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Trial Balance</button>
                    <button onClick={() => setReportType('profit_loss')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'profit_loss' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Profit & Loss</button>
                    <button onClick={() => setReportType('balance_sheet')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'balance_sheet' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Balance Sheet</button>
                    <button onClick={() => setReportType('cash_flow')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'cash_flow' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cash Flow</button>
                    <button onClick={() => setReportType('ledger')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'ledger' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Ledger</button>
                    <button onClick={() => setReportType('day_book')} className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === 'day_book' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Day Book</button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Select report type and date range to view financial data</div>
            </div>
        </div>
    );
};

export default FinancialReports;