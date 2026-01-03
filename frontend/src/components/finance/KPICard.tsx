import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
    title: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
    subtitle?: string;
}

const KPICard: React.FC<Props> = ({ title, value, change, icon: Icon, color, subtitle }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 bg-blue-100 text-blue-600',
        green: 'from-green-500 to-green-600 bg-green-100 text-green-600',
        red: 'from-red-500 to-red-600 bg-red-100 text-red-600',
        yellow: 'from-yellow-500 to-yellow-600 bg-yellow-100 text-yellow-600',
        purple: 'from-purple-500 to-purple-600 bg-purple-100 text-purple-600',
        gray: 'from-gray-500 to-gray-600 bg-gray-100 text-gray-600'
    };

    const [bgGradient, iconBg, iconColor] = colorClasses[color].split(' ');

    return (
        <div className={`bg-gradient-to-br ${bgGradient} rounded-lg shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${iconBg} ${iconColor} bg-opacity-20 rounded-lg`}>
                    <Icon size={24} />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${
                        change >= 0 ? 'text-green-200' : 'text-red-200'
                    }`}>
                        {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>
            <h3 className="text-sm font-medium opacity-90">{title}</h3>
            <p className="text-3xl font-bold mt-2">
                {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
            </p>
            {subtitle && (
                <p className="text-xs opacity-75 mt-2">{subtitle}</p>
            )}
        </div>
    );
};

export default KPICard;