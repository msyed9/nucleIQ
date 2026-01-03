import React from 'react';

interface CashFlowData {
    month: string;
    cashIn: number;
    cashOut: number;
}

interface Props {
    data: CashFlowData[];
}

const CashFlowChart: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow Trend</h3>
                <div className="flex items-center justify-center h-64 text-gray-500">
                    No data available
                </div>
            </div>
        );
    }

    const maxValue = Math.max(
        ...data.map(d => Math.max(d.cashIn, d.cashOut))
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cash Flow Trend (6 Months)</h3>
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{item.month}</span>
                            <div className="flex gap-4">
                                <span className="text-green-600">₹{item.cashIn.toLocaleString('en-IN')}</span>
                                <span className="text-red-600">₹{item.cashOut.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${(item.cashIn / maxValue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${(item.cashOut / maxValue) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Cash In</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Cash Out</span>
                </div>
            </div>
        </div>
    );
};

export default CashFlowChart;