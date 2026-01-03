import React from 'react';

interface FineCalculatorProps {
    dueDate: string;
    finePerDay: number;
    onWaive?: () => void;
    allowWaive?: boolean;
}

const FineCalculator: React.FC<FineCalculatorProps> = ({
    dueDate,
    finePerDay = 5,
    onWaive,
    allowWaive = false
}) => {
    const calculateFine = () => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return { days: 0, amount: 0, isOverdue: false };
        
        return {
            days: diffDays,
            amount: diffDays * finePerDay,
            isOverdue: true
        };
    };

    const fine = calculateFine();

    if (!fine.isOverdue) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl"></span>
                    <div>
                        <div className="font-semibold text-green-800">On Time</div>
                        <div className="text-sm text-green-600">No fine applicable</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl"></span>
                        <div className="font-semibold text-red-800">Overdue Fine</div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600">Days overdue:</span>
                            <span className="font-medium">{fine.days} days</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-600">Fine per day:</span>
                            <span className="font-medium">{finePerDay}</span>
                        </div>
                        <div className="h-px bg-red-200 my-2" />
                        <div className="flex justify-between gap-4">
                            <span className="font-semibold text-gray-800">Total Fine:</span>
                            <span className="font-bold text-red-600 text-lg">{fine.amount}</span>
                        </div>
                    </div>
                </div>
                {allowWaive && onWaive && (
                    <button
                        onClick={onWaive}
                        className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                        Waive Fine
                    </button>
                )}
            </div>
        </div>
    );
};

export default FineCalculator;
