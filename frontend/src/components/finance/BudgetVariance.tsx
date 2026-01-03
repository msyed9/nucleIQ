import React from 'react';

interface BudgetItem {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variance_percent: number;
    percent_utilized: number;
}

interface Props {
    data: BudgetItem[];
}

const BudgetVariance: React.FC<Props> = ({ data }) => {
    const getUtilizationColor = (percent: number) => {
        if (percent < 80) return 'bg-green-100 text-green-800';
        if (percent < 95) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getVarianceColor = (variance: number) => {
        if (variance > 0) return 'text-red-600'; // Over budget
        return 'text-green-600'; // Under budget
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget vs Actual</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Budgeted</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actual Spent</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Variance</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Utilized</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.category}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                                        ₹{item.budgeted.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        ₹{item.actual.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right font-medium ${getVarianceColor(item.variance)}`}>
                                        {item.variance > 0 ? '+' : ''}₹{item.variance.toLocaleString('en-IN')}
                                        <span className="text-xs ml-1">({item.variance_percent.toFixed(1)}%)</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-full max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        item.percent_utilized < 80 ? 'bg-green-500' :
                                                        item.percent_utilized < 95 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${Math.min(item.percent_utilized, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-600 mt-1">{item.percent_utilized.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUtilizationColor(item.percent_utilized)}`}>
                                            {item.percent_utilized < 80 ? 'Good' :
                                             item.percent_utilized < 95 ? 'Warning' : 'Over'}
                                        </span>
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

export default BudgetVariance;