import React, { useState } from 'react';
import { BarChart, TrendingUp, Download, Package, AlertTriangle } from 'lucide-react';
import StockSummary from '../../components/inventory/StockSummary';
import MovementReport from '../../components/inventory/MovementReport';
import ABCAnalysis from '../../components/inventory/ABCAnalysis';

export const InventoryReports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('stock-summary');

    const tabs = [
        { id: 'stock-summary', label: 'Stock Summary', icon: Package },
        { id: 'movement', label: 'Stock Movement', icon: TrendingUp },
        { id: 'abc-analysis', label: 'ABC Analysis', icon: BarChart },
        { id: 'low-stock', label: 'Low Stock Report', icon: AlertTriangle },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800"> Inventory Reports</h1>
                    <p className="text-gray-600 mt-1">Comprehensive inventory analytics and insights</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download size={20} />
                    Export Report
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'stock-summary' && <StockSummary />}
                    {activeTab === 'movement' && <MovementReport />}
                    {activeTab === 'abc-analysis' && <ABCAnalysis />}
                    {activeTab === 'low-stock' && (
                        <div className="text-center text-gray-500 py-12">
                            Low Stock Report - Coming Soon
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryReports;
