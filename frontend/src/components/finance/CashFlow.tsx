import React from 'react';
import { Download, Printer, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';

interface CashFlowItem {
    description: string;
    amount: number;
}

interface Props {
    operating: CashFlowItem[];
    investing: CashFlowItem[];
    financing: CashFlowItem[];
    operatingTotal: number;
    investingTotal: number;
    financingTotal: number;
    netCashFlow: number;
    openingBalance: number;
    closingBalance: number;
    fromDate: string;
    toDate: string;
    onExport: () => void;
    onPrint: () => void;
}

const CashFlow: React.FC<Props> = ({
    operating,
    investing,
    financing,
    operatingTotal,
    investingTotal,
    financingTotal,
    netCashFlow,
    openingBalance,
    closingBalance,
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
                        <h3 className="text-xl font-bold text-gray-800">Cash Flow Statement</h3>
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

                {/* Opening Balance */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">Opening Cash Balance</span>
                        <span className="text-lg font-bold text-blue-800">
                            ₹{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Operating Activities */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <TrendingUp className="text-green-600" size={20} />
                            Operating Activities
                        </h4>
                        <div className="space-y-2">
                            {operating.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{item.description}</span>
                                    <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-3 border-t-2 border-gray-200 font-bold">
                                <span className="text-sm text-gray-800">Net Cash from Operating Activities</span>
                                <span className={`text-sm ${operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {operatingTotal >= 0 ? '+' : ''}₹{operatingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Investing Activities */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ArrowUpCircle className="text-blue-600" size={20} />
                            Investing Activities
                        </h4>
                        <div className="space-y-2">
                            {investing.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{item.description}</span>
                                    <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-3 border-t-2 border-gray-200 font-bold">
                                <span className="text-sm text-gray-800">Net Cash from Investing Activities</span>
                                <span className={`text-sm ${investingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {investingTotal >= 0 ? '+' : ''}₹{investingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Financing Activities */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ArrowDownCircle className="text-purple-600" size={20} />
                            Financing Activities
                        </h4>
                        <div className="space-y-2">
                            {financing.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{item.description}</span>
                                    <span className={`text-sm font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.amount >= 0 ? '+' : ''}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-3 border-t-2 border-gray-200 font-bold">
                                <span className="text-sm text-gray-800">Net Cash from Financing Activities</span>
                                <span className={`text-sm ${financingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {financingTotal >= 0 ? '+' : ''}₹{financingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Net Cash Flow */}
                <div className={`mt-6 p-4 rounded-lg border-2 ${netCashFlow >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <div className="flex justify-between items-center">
                        <span className={`text-lg font-bold ${netCashFlow >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            Net Increase/(Decrease) in Cash
                        </span>
                        <span className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {netCashFlow >= 0 ? '+' : ''}₹{netCashFlow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Closing Balance */}
                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">Closing Cash Balance</span>
                        <span className="text-lg font-bold text-blue-800">
                            ₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashFlow;