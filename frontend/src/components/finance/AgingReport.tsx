import React from 'react';
import { Download } from 'lucide-react';

interface AgingData {
    vendor_id: number;
    vendor_name: string;
    current: number; // 0-30 days
    days_31_60: number;
    days_61_90: number;
    over_90: number;
    total_outstanding: number;
}

interface AgingReportProps {
    data: AgingData[];
    asOfDate: string;
}

export const AgingReport: React.FC<AgingReportProps> = ({ data, asOfDate }) => {
    const totals = data.reduce(
        (acc, vendor) => ({
            current: acc.current + vendor.current,
            days_31_60: acc.days_31_60 + vendor.days_31_60,
            days_61_90: acc.days_61_90 + vendor.days_61_90,
            over_90: acc.over_90 + vendor.over_90,
            total_outstanding: acc.total_outstanding + vendor.total_outstanding,
        }),
        { current: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total_outstanding: 0 }
    );

    const handleExport = () => {
        const csv = [
            'Vendor Name,Current (0-30),31-60 Days,61-90 Days,Over 90 Days,Total Outstanding',
            ...data.map(vendor =>
                `"${vendor.vendor_name}",${vendor.current},${vendor.days_31_60},${vendor.days_61_90},${vendor.over_90},${vendor.total_outstanding}`
            ),
            `Total,${totals.current},${totals.days_31_60},${totals.days_61_90},${totals.over_90},${totals.total_outstanding}`
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendor-aging-report-${asOfDate}.csv`;
        a.click();
    };

    const getAgingColor = (amount: number, total: number) => {
        const percentage = (amount / total) * 100;
        if (percentage > 50) return 'text-red-600 font-semibold';
        if (percentage > 25) return 'text-orange-600';
        return 'text-gray-800';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Vendor Aging Report</h3>
                    <p className="text-sm text-gray-600 mt-1">As of {new Date(asOfDate).toLocaleDateString('en-IN')}</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                    <Download size={18} />
                    Export to Excel
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">Current (0-30)</p>
                    <p className="text-xl font-bold text-green-800 mt-1">
                        ₹{totals.current.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                        {((totals.current / totals.total_outstanding) * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-700 font-medium">31-60 Days</p>
                    <p className="text-xl font-bold text-yellow-800 mt-1">
                        ₹{totals.days_31_60.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                        {((totals.days_31_60 / totals.total_outstanding) * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 font-medium">61-90 Days</p>
                    <p className="text-xl font-bold text-orange-800 mt-1">
                        ₹{totals.days_61_90.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                        {((totals.days_61_90 / totals.total_outstanding) * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-700 font-medium">Over 90 Days</p>
                    <p className="text-xl font-bold text-red-800 mt-1">
                        ₹{totals.over_90.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        {((totals.over_90 / totals.total_outstanding) * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">Total Outstanding</p>
                    <p className="text-xl font-bold text-blue-800 mt-1">
                        ₹{totals.total_outstanding.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">100%</p>
                </div>
            </div>

            {/* Aging Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendor Name</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Current (0-30)</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">31-60 Days</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">61-90 Days</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Over 90 Days</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total Outstanding</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((vendor) => (
                                <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{vendor.vendor_name}</td>
                                    <td className={`px-4 py-3 text-sm text-right ${getAgingColor(vendor.current, vendor.total_outstanding)}`}>
                                        ₹{vendor.current.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right ${getAgingColor(vendor.days_31_60, vendor.total_outstanding)}`}>
                                        ₹{vendor.days_31_60.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right ${getAgingColor(vendor.days_61_90, vendor.total_outstanding)}`}>
                                        ₹{vendor.days_61_90.toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-right ${getAgingColor(vendor.over_90, vendor.total_outstanding)}`}>
                                        ₹{vendor.over_90.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-800">
                                        ₹{vendor.total_outstanding.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold">
                            <tr>
                                <td className="px-4 py-3 text-sm text-gray-800">Total</td>
                                <td className="px-4 py-3 text-sm text-right text-green-600">
                                    ₹{totals.current.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-yellow-600">
                                    ₹{totals.days_31_60.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-orange-600">
                                    ₹{totals.days_61_90.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-red-600">
                                    ₹{totals.over_90.toLocaleString('en-IN')}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-blue-600">
                                    ₹{totals.total_outstanding.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {data.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No aging data available</p>
                    </div>
                )}
            </div>

            {/* Insights */}
            {data.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Insights</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• {data.filter(v => v.over_90 > 0).length} vendors have outstanding amounts over 90 days</li>
                        <li>• {((totals.over_90 / totals.total_outstanding) * 100).toFixed(1)}% of total outstanding is overdue by more than 90 days</li>
                        <li>• Highest outstanding: {data.reduce((max, v) => v.total_outstanding > max.total_outstanding ? v : max).vendor_name}</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
