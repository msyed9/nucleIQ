import React from 'react';
import { Download, Printer, Shield, TrendingUp } from 'lucide-react';

interface ReportItem {
    account: string;
    amount: number;
}

interface Props {
    assets: ReportItem[];
    liabilities: ReportItem[];
    equity: ReportItem[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalLiabilitiesEquity: number;
    isBalanced: boolean;
    asOfDate: string;
    onExport: () => void;
    onPrint: () => void;
}

const BalanceSheet: React.FC<Props> = ({
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesEquity,
    isBalanced,
    asOfDate,
    onExport,
    onPrint
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Balance Sheet</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            As on {new Date(asOfDate).toLocaleDateString('en-IN')}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assets Column */}
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                        <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} />
                            Assets
                        </h4>
                        <div className="space-y-2 bg-white p-4 rounded-lg">
                            {assets.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 hover:bg-gray-50 px-2 rounded">
                                    <span className="text-sm text-gray-700">{item.account}</span>
                                    <span className="text-sm font-medium text-gray-800">
                                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 px-2 border-t-2 border-blue-300 font-bold mt-3">
                                <span className="text-sm text-blue-800">Total Assets</span>
                                <span className="text-sm text-blue-800">
                                    ₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities & Equity Column */}
                    <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                        <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                            <Shield size={20} />
                            Liabilities & Equity
                        </h4>
                        
                        {/* Liabilities */}
                        <div className="bg-white p-4 rounded-lg mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Liabilities</p>
                            <div className="space-y-2">
                                {liabilities.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1 hover:bg-gray-50 px-2 rounded">
                                        <span className="text-sm text-gray-700">{item.account}</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 font-medium">
                                    <span className="text-xs text-gray-700">Subtotal</span>
                                    <span className="text-xs text-gray-800">
                                        ₹{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Equity */}
                        <div className="bg-white p-4 rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Equity</p>
                            <div className="space-y-2">
                                {equity.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1 hover:bg-gray-50 px-2 rounded">
                                        <span className="text-sm text-gray-700">{item.account}</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 font-medium">
                                    <span className="text-xs text-gray-700">Subtotal</span>
                                    <span className="text-xs text-gray-800">
                                        ₹{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-3 px-4 border-t-2 border-green-300 font-bold mt-4 bg-white rounded-lg">
                            <span className="text-sm text-green-800">Total Liabilities & Equity</span>
                            <span className="text-sm text-green-800">
                                ₹{totalLiabilitiesEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Balance Check */}
                {isBalanced ? (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                            ✓ Balance Sheet is balanced (Assets = Liabilities + Equity)
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                            ⚠ Balance Sheet is NOT balanced! Difference: ₹{Math.abs(totalAssets - totalLiabilitiesEquity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BalanceSheet;