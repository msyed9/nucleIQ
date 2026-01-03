import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    matched: boolean;
}

interface Props {
    bankTransactions: Transaction[];
    bookTransactions: Transaction[];
    onMatch: (bankId: number, bookId: number) => void;
    onAutoMatch: () => void;
}

const ReconciliationMatch: React.FC<Props> = ({
    bankTransactions,
    bookTransactions,
    onMatch,
    onAutoMatch
}) => {
    const [selectedBank, setSelectedBank] = React.useState<number | null>(null);
    const [selectedBook, setSelectedBook] = React.useState<number | null>(null);

    const handleMatch = () => {
        if (selectedBank !== null && selectedBook !== null) {
            onMatch(selectedBank, selectedBook);
            setSelectedBank(null);
            setSelectedBook(null);
        }
    };

    const unmatchedBankTxns = bankTransactions.filter(t => !t.matched);
    const unmatchedBookTxns = bookTransactions.filter(t => !t.matched);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Match Transactions</h3>
                <button
                    onClick={onAutoMatch}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Auto Match
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bank Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Bank Statement ({unmatchedBankTxns.length})</h4>
                        <span className="text-xs text-gray-500">Unmatched</span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {unmatchedBankTxns.map((txn) => (
                            <div
                                key={txn.id}
                                onClick={() => setSelectedBank(txn.id)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedBank === txn.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">
                                        {new Date(txn.date).toLocaleDateString('en-IN')}
                                    </span>
                                    <span className={`text-sm font-bold ${
                                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 truncate">{txn.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Book Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Book Entries ({unmatchedBookTxns.length})</h4>
                        <span className="text-xs text-gray-500">Unmatched</span>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {unmatchedBookTxns.map((txn) => (
                            <div
                                key={txn.id}
                                onClick={() => setSelectedBook(txn.id)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                    selectedBook === txn.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500">
                                        {new Date(txn.date).toLocaleDateString('en-IN')}
                                    </span>
                                    <span className={`text-sm font-bold ${
                                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 truncate">{txn.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Match Button */}
            {selectedBank !== null && selectedBook !== null && (
                <div className="mt-6 flex items-center justify-center">
                    <button
                        onClick={handleMatch}
                        className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <CheckCircle size={20} />
                        Match Selected Transactions
                    </button>
                </div>
            )}

            {/* Info */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">
                        Select one transaction from each column and click "Match" to reconcile them.
                        Or use "Auto Match" to automatically match transactions with same date and amount.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationMatch;