import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const BudgetForm: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [department, setDepartment] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [quarterly, setQuarterly] = useState(false);
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('');
    const [q4, setQ4] = useState('');

    const departments = ['Administration', 'Academic', 'Sports', 'Library', 'IT', 'Marketing'];
    const categories = ['Salary', 'Utilities', 'Supplies', 'Marketing', 'Maintenance', 'Training', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const budgetData: any = {
                year,
                department,
                category,
                total_amount: parseFloat(amount)
            };

            if (quarterly) {
                budgetData.q1_amount = parseFloat(q1 || '0');
                budgetData.q2_amount = parseFloat(q2 || '0');
                budgetData.q3_amount = parseFloat(q3 || '0');
                budgetData.q4_amount = parseFloat(q4 || '0');
            }

            await api.post('/api/finance/budgets/', budgetData);
            toast.success('Budget created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating budget:', error);
            toast.error('Failed to create budget');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Create Budget</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year *</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget Amount *</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={quarterly}
                                onChange={(e) => setQuarterly(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Set Quarterly Breakdown</span>
                        </label>
                    </div>

                    {quarterly && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Q1 Amount</label>
                                <input
                                    type="number"
                                    value={q1}
                                    onChange={(e) => setQ1(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Q2 Amount</label>
                                <input
                                    type="number"
                                    value={q2}
                                    onChange={(e) => setQ2(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Q3 Amount</label>
                                <input
                                    type="number"
                                    value={q3}
                                    onChange={(e) => setQ3(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Q4 Amount</label>
                                <input
                                    type="number"
                                    value={q4}
                                    onChange={(e) => setQ4(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Budget
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetForm;