import React from 'react';
import { Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportItem {
    account: string;
    amount: number;
}

interface Props {
    income: ReportItem[];
    expenses: ReportItem[];
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    isProfit: boolean;
    fromDate: string;
    toDate: string;
    onExport: () => void;
    onPrint: () => void;
}

const ProfitLoss: React.FC<Props> = ({
    income,
    expenses,
    totalIncome,
    totalExpenses,
    netProfit,
    isProfit,
    fromDate,
    toDate,
    onExport,
    onPrint
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Profit & Loss Statement</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            From {new Date(fromDate).toLocaleDateString('en-IN')} to {new Date(toDate).toLocaleDateString('en-IN')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrint}
                            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={onExport}
                            className="px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-600 font-medium">Total Income</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">
                            ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">
                            ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className={`p-4 rounded-lg border ${isProfit ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                        <p className={`text-sm font-medium ${isProfit ? 'text-blue-600' : 'text-orange-600'}`}>
                            {isProfit ? 'Net Profit' : 'Net Loss'}
                        </p>
                        <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${isProfit ? 'text-blue-700' : 'text-orange-700'}`}>
                            {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            ₹{Math.abs(netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Section */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-green-500">Income</h4>
                        <div className="space-y-2">
                            {income.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 hover:bg-gray-50 px-2 rounded">
                                    <span className="text-sm text-gray-700">{item.account}</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-2 border-t-2 border-gray-200 font-bold">
                                <span className="text-sm text-gray-800">Total Income</span>
                                <span className="text-sm text-green-600">
                                    ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b-2 border-red-500">Expenses</h4>
                        <div className="space-y-2">
                            {expenses.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 hover:bg-gray-50 px-2 rounded">
                                    <span className="text-sm text-gray-700">{item.account}</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-2 border-t-2 border-gray-200 font-bold">
                                <span className="text-sm text-gray-800">Total Expenses</span>
                                <span className="text-sm text-red-600">
                                    ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Result */}
                <div className={`mt-6 p-4 rounded-lg border-2 ${isProfit ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'}`}>
                    <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${isProfit ? 'text-blue-800' : 'text-orange-800'}`}>
                            {isProfit ? 'Net Profit' : 'Net Loss'}
                        </span>
                        <span className={`text-2xl font-bold ${isProfit ? 'text-blue-700' : 'text-orange-700'}`}>
                            ₹{Math.abs(netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitLoss;