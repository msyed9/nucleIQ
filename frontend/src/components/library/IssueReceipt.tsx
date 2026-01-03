import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface IssueReceiptProps {
    issueData: {
        bookTitle: string;
        author: string;
        barcode: string;
        memberName: string;
        memberId: string;
        issuedDate: string;
        dueDate: string;
        booksRemaining: string;
    };
    onClose: () => void;
}

const IssueReceipt: React.FC<IssueReceiptProps> = ({ issueData, onClose }) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Issue-Receipt-${issueData.barcode}`,
    } as any);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4"> Issue Receipt</h2>

                <div ref={componentRef} className="border-2 border-dashed border-gray-300 p-6 mb-4">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-bold">Library Issue Receipt</h3>
                        <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium">Book:</span>
                            <span className="text-right">{issueData.bookTitle}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Author:</span>
                            <span>{issueData.author}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Barcode:</span>
                            <span className="font-mono">{issueData.barcode}</span>
                        </div>
                        <div className="h-px bg-gray-300 my-3" />
                        <div className="flex justify-between">
                            <span className="font-medium">Member:</span>
                            <span>{issueData.memberName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Member ID:</span>
                            <span>{issueData.memberId}</span>
                        </div>
                        <div className="h-px bg-gray-300 my-3" />
                        <div className="flex justify-between">
                            <span className="font-medium">Issued:</span>
                            <span>{new Date(issueData.issuedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Due:</span>
                            <span className="font-bold text-red-600">
                                {new Date(issueData.dueDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Books Remaining:</span>
                            <span>{issueData.booksRemaining}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-xs text-gray-500">
                        <p>Please return the book by the due date to avoid fines.</p>
                        <p>Fine: $5 per day for late returns</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Print Receipt
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IssueReceipt;
