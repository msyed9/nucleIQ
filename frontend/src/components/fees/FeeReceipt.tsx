import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency, formatDate } from '../../utils/helpers';
import './FeeReceipt.css';

interface ReceiptData {
    receiptNumber: string;
    transactionNumber: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    section?: string;
    invoiceNumber: string;
    invoiceDate: string;
    paymentDate: string;
    paymentMode: string;
    paymentReference?: string;
    items: {
        description: string;
        amount: number;
    }[];
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    collectedBy?: string;
    schoolName: string;
    schoolAddress: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    receiptCopies?: number; // 1, 2, or 3
    receiptFooterText?: string;
}

interface FeeReceiptProps {
    receiptData: ReceiptData;
    onClose: () => void;
}

const FeeReceipt: React.FC<FeeReceiptProps> = ({ receiptData, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const copies = receiptData.receiptCopies || 3;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Fee_Receipt_${receiptData.receiptNumber}`,
        onAfterPrint: () => {
            console.log('Print completed');
        },
    });

    const getPaymentModeLabel = (mode: string) => {
        const modes: Record<string, string> = {
            'CASH': 'Cash',
            'CHEQUE': 'Cheque',
            'CARD': 'Card',
            'UPI': 'UPI',
            'NET_BANKING': 'Net Banking',
            'WALLET': 'Wallet',
            'OTHER': 'Other'
        };
        return modes[mode] || mode;
    };

    // Convert number to words for Indian currency
    const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        // Handle edge cases: NaN, undefined, null, negative numbers
        if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';

        // Convert to positive integer (remove decimals)
        const intNum = Math.abs(Math.floor(num));

        if (intNum === 0) return 'Zero Rupees Only';

        const convertLessThanThousand = (n: number): string => {
            // Ensure n is a valid non-negative integer
            const safeN = Math.floor(Math.abs(n));
            if (safeN === 0) return '';
            if (safeN < 20) return ones[safeN] + ' ';
            if (safeN < 100) return tens[Math.floor(safeN / 10)] + ' ' + ones[safeN % 10] + ' ';
            return ones[Math.floor(safeN / 100)] + ' Hundred ' + convertLessThanThousand(safeN % 100);
        };

        let result = '';
        const crore = Math.floor(intNum / 10000000);
        const lakh = Math.floor((intNum % 10000000) / 100000);
        const thousand = Math.floor((intNum % 100000) / 1000);
        const remainder = Math.floor(intNum % 1000);

        if (crore > 0) result += convertLessThanThousand(crore) + 'Crore ';
        if (lakh > 0) result += convertLessThanThousand(lakh) + 'Lakh ';
        if (thousand > 0) result += convertLessThanThousand(thousand) + 'Thousand ';
        result += convertLessThanThousand(remainder);

        return (num < 0 ? 'Minus ' : '') + result.trim() + ' Rupees Only';
    };

    // Get copy labels based on number of copies
    const getCopyLabels = (numCopies: number): string[] => {
        if (numCopies === 1) return ['RECEIPT'];
        if (numCopies === 2) return ['OFFICE COPY', 'STUDENT COPY'];
        return ['OFFICE COPY', 'STUDENT COPY', 'PARENT COPY'];
    };

    // Get CSS class for height based on copies
    const getHeightClass = (): string => {
        if (copies === 1) return 'single-copy';
        if (copies === 2) return 'two-copies';
        return 'three-copies';
    };

    // Render a single compact copy of the receipt
    const renderReceiptCopy = (copyType: string, index: number) => (
        <div className={`receipt-copy-compact ${getHeightClass()}`} key={copyType}>
            {/* Header */}
            <div className="receipt-header-compact">
                <div className="school-info-compact">
                    {receiptData.schoolLogo && (
                        <img src={receiptData.schoolLogo} alt="" className="school-logo-compact" />
                    )}
                    <div className="school-details-compact">
                        <h1 className="school-name-compact">{receiptData.schoolName}</h1>
                        <p className="school-address-compact">{receiptData.schoolAddress}</p>
                        {(receiptData.schoolPhone || receiptData.schoolEmail) && (
                            <p className="school-contact-compact">
                                {receiptData.schoolPhone && `📞 ${receiptData.schoolPhone}`}
                                {receiptData.schoolPhone && receiptData.schoolEmail && ' | '}
                                {receiptData.schoolEmail && `✉️ ${receiptData.schoolEmail}`}
                            </p>
                        )}
                    </div>
                </div>
                <div className="receipt-meta-compact">
                    <div className="copy-badge">{copyType}</div>
                    <div className="receipt-no">#{receiptData.receiptNumber}</div>
                    <div className="receipt-date">{formatDate(receiptData.paymentDate)}</div>
                </div>
            </div>

            {/* Student Info Row */}
            <div className="student-info-compact">
                <div className="info-item-compact">
                    <span className="label">Student:</span>
                    <span className="value">{receiptData.studentName}</span>
                </div>
                <div className="info-item-compact">
                    <span className="label">Adm. No:</span>
                    <span className="value">{receiptData.admissionNumber}</span>
                </div>
                <div className="info-item-compact">
                    <span className="label">Class:</span>
                    <span className="value">{receiptData.className}{receiptData.section ? ` - ${receiptData.section}` : ''}</span>
                </div>
                <div className="info-item-compact">
                    <span className="label">Invoice:</span>
                    <span className="value">{receiptData.invoiceNumber}</span>
                </div>
            </div>

            {/* Fee Items Table - Compact */}
            <table className="fee-table-compact">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th className="amount-col">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {receiptData.items.slice(0, copies === 1 ? 10 : copies === 2 ? 5 : 3).map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.description}</td>
                            <td className="amount-col">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                    {receiptData.items.length > (copies === 1 ? 10 : copies === 2 ? 5 : 3) && (
                        <tr>
                            <td colSpan={2} style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                                ...and {receiptData.items.length - (copies === 1 ? 10 : copies === 2 ? 5 : 3)} more items
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Payment Summary */}
            <div className="payment-summary-compact">
                <div className="summary-row">
                    <span>Total:</span>
                    <span>{formatCurrency(receiptData.totalAmount)}</span>
                </div>
                <div className="summary-row paid">
                    <span>Paid ({getPaymentModeLabel(receiptData.paymentMode)}):</span>
                    <span className="paid-amount">{formatCurrency(receiptData.paidAmount)}</span>
                </div>
                {receiptData.balanceAmount > 0 && (
                    <div className="summary-row balance">
                        <span>Balance Due:</span>
                        <span className="balance-amount">{formatCurrency(receiptData.balanceAmount)}</span>
                    </div>
                )}
            </div>

            {/* Amount in Words */}
            <div className="amount-words-compact">
                <strong>Amount in words:</strong> {numberToWords(receiptData.paidAmount)}
            </div>

            {/* Footer */}
            <div className="receipt-footer-compact">
                <div className="footer-left-compact">
                    <p>Received with thanks</p>
                    {receiptData.collectedBy && <small>By: {receiptData.collectedBy}</small>}
                    {receiptData.receiptFooterText && (
                        <small className="footer-note">{receiptData.receiptFooterText}</small>
                    )}
                </div>
                <div className="footer-right-compact">
                    <div className="signature-line-compact"></div>
                    <small>Authorized Signature</small>
                </div>
            </div>
        </div>
    );

    const copyLabels = getCopyLabels(copies);

    return (
        <div className="fee-receipt-modal">
            <div className="receipt-modal-overlay" onClick={onClose}></div>
            <div className="receipt-modal-content">
                <div className="receipt-modal-header">
                    <h2>📄 Fee Receipt Preview</h2>
                    <div className="receipt-modal-actions">
                        <button className="btn-print" onClick={() => handlePrint()}>
                            🖨️ Print Receipt ({copies} {copies === 1 ? 'copy' : 'copies'} on A4)
                        </button>
                        <button className="btn-close" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="receipt-preview-container">
                    <div ref={printRef} className="receipt-print-area-single-page">
                        {/* Copies on single A4 page */}
                        <div className={`receipt-page-a4 copies-${copies}`}>
                            {copyLabels.map((label, index) => (
                                <React.Fragment key={label}>
                                    {renderReceiptCopy(label, index)}
                                    {index < copyLabels.length - 1 && (
                                        <div className="cut-line">
                                            <span>✂️ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂️</span>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
