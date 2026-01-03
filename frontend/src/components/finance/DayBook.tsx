import React from 'react';
import { Download, Printer, Calendar } from 'lucide-react';

interface JournalEntry {
    entry_number: string;
    reference: string;
    description: string;
    lines: {
        account: string;
        debit: number;
        credit: number;
    }[];
}

interface Props {
    date: string;
    entries: JournalEntry[];
    totalDebit: number;
    totalCredit: number;
    onExport: () => void;
    onPrint: () => void;
}

const DayBook: React.FC<Props> = ({ date, entries, totalDebit, totalCredit, onExport, onPrint }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="text-blue-600" size={24} />
                            Day Book
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Date: {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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

                {/* Entries */}
                <div className="space-y-4">
                    {entries.map((entry, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{entry.entry_number}</p>
                                    <p className="text-xs text-gray-500">Ref: {entry.reference}</p>
                                </div>
                                <p className="text-sm text-gray-700 italic">{entry.description}</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Account</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Debit</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {entry.lines.map((line, lineIndex) => (
                                            <tr key={lineIndex}>
                                                <td className="px-3 py-2 text-sm text-gray-700">{line.account}</td>
                                                <td className="px-3 py-2 text-sm text-right font-medium text-gray-800">
                                                    {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-sm text-right font-medium text-gray-800">
                                                    {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Daily Summary */}
                <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-800 mb-3">Daily Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-blue-600">Total Entries</p>
                            <p className="text-lg font-bold text-blue-800">{entries.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-blue-600">Total Debits</p>
                            <p className="text-lg font-bold text-blue-800">
                                ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-blue-600">Total Credits</p>
                            <p className="text-lg font-bold text-blue-800">
                                ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayBook;