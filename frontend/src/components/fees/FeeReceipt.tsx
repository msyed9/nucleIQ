import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
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
}

interface FeeReceiptProps {
    receiptData: ReceiptData;
    onClose: () => void;
}

const FeeReceipt: React.FC<FeeReceiptProps> = ({ receiptData, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Fee_Receipt_${receiptData.receiptNumber}`,
        onAfterPrint: () => {
            console.log('Print completed');
        },
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

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

        if (num === 0) return 'Zero';

        const convertLessThanThousand = (n: number): string => {
            if (n === 0) return '';
            if (n < 20) return ones[n] + ' ';
            if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
            return ones[Math.floor(n / 100)] + ' Hundred ' + convertLessThanThousand(n % 100);
        };

        let result = '';
        const crore = Math.floor(num / 10000000);
        const lakh = Math.floor((num % 10000000) / 100000);
        const thousand = Math.floor((num % 100000) / 1000);
        const remainder = Math.floor(num % 1000);

        if (crore > 0) result += convertLessThanThousand(crore) + 'Crore ';
        if (lakh > 0) result += convertLessThanThousand(lakh) + 'Lakh ';
        if (thousand > 0) result += convertLessThanThousand(thousand) + 'Thousand ';
        result += convertLessThanThousand(remainder);

        return result.trim() + ' Rupees Only';
    };

    // Render a single copy of the receipt
    const renderReceiptCopy = (copyType: string, copyNumber: number) => (
        <div className={`receipt-copy ${copyNumber > 1 ? 'page-break-before' : ''}`} key={copyType}>
            <div className="receipt-header">
                <div className="school-info">
                    {receiptData.schoolLogo && (
                        <img src={receiptData.schoolLogo} alt="School Logo" className="school-logo" />
                    )}
                    <div className="school-details">
                        <h1 className="school-name">{receiptData.schoolName}</h1>
                        <p className="school-address">{receiptData.schoolAddress}</p>
                        {receiptData.schoolPhone && (
                            <p className="school-contact">📞 {receiptData.schoolPhone}</p>
                        )}
                        {receiptData.schoolEmail && (
                            <p className="school-contact">✉️ {receiptData.schoolEmail}</p>
                        )}
                    </div>
                </div>
                <div className="receipt-title-section">
                    <h2 className="receipt-title">FEE RECEIPT</h2>
                    <span className="copy-type">{copyType}</span>
                </div>
            </div>

            <div className="receipt-info-bar">
                <div className="info-item">
                    <span className="info-label">Receipt No:</span>
                    <span className="info-value">{receiptData.receiptNumber}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{formatDate(receiptData.paymentDate)}</span>
                </div>
            </div>

            <div className="student-info-section">
                <div className="student-info-grid">
                    <div className="info-row">
                        <span className="label">Student Name:</span>
                        <span className="value">{receiptData.studentName}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Admission No:</span>
                        <span className="value">{receiptData.admissionNumber}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Class:</span>
                        <span className="value">
                            {receiptData.className}
                            {receiptData.section && ` - ${receiptData.section}`}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="label">Invoice No:</span>
                        <span className="value">{receiptData.invoiceNumber}</span>
                    </div>
                </div>
            </div>

            <table className="fee-items-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Description</th>
                        <th>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {receiptData.items.map((item, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.description}</td>
                            <td className="amount-cell">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="total-row">
                        <td colSpan={2}>Total Amount</td>
                        <td className="amount-cell">{formatCurrency(receiptData.totalAmount)}</td>
                    </tr>
                    <tr className="paid-row">
                        <td colSpan={2}>Amount Paid</td>
                        <td className="amount-cell">{formatCurrency(receiptData.paidAmount)}</td>
                    </tr>
                    {receiptData.balanceAmount > 0 && (
                        <tr className="balance-row">
                            <td colSpan={2}>Balance Due</td>
                            <td className="amount-cell">{formatCurrency(receiptData.balanceAmount)}</td>
                        </tr>
                    )}
                </tfoot>
            </table>

            <div className="amount-in-words">
                <span className="label">Amount in words:</span>
                <span className="words">{numberToWords(receiptData.paidAmount)}</span>
            </div>

            <div className="payment-details">
                <div className="payment-info">
                    <span className="label">Payment Mode:</span>
                    <span className="value">{getPaymentModeLabel(receiptData.paymentMode)}</span>
                </div>
                {receiptData.paymentReference && (
                    <div className="payment-info">
                        <span className="label">Reference:</span>
                        <span className="value">{receiptData.paymentReference}</span>
                    </div>
                )}
            </div>

            <div className="receipt-footer">
                <div className="footer-left">
                    <p className="received-text">Received with thanks</p>
                    {receiptData.collectedBy && (
                        <p className="collected-by">Collected by: {receiptData.collectedBy}</p>
                    )}
                </div>
                <div className="footer-right">
                    <div className="signature-line"></div>
                    <p className="signature-label">Authorized Signature</p>
                </div>
            </div>

            <div className="receipt-note">
                <p>* This is a computer generated receipt and does not require a signature.</p>
                <p>* Please retain this receipt for future reference.</p>
            </div>
        </div>
    );

    return (
        <div className="fee-receipt-modal">
            <div className="receipt-modal-overlay" onClick={onClose}></div>
            <div className="receipt-modal-content">
                <div className="receipt-modal-header">
                    <h2>📄 Fee Receipt Preview</h2>
                    <div className="receipt-modal-actions">
                        <button className="btn-print" onClick={() => handlePrint()}>
                            🖨️ Print 3 Copies (A4)
                        </button>
                        <button className="btn-close" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                <div className="receipt-preview-container">
                    <div ref={printRef} className="receipt-print-area">
                        {/* Three copies: Office, Student, Parent */}
                        {renderReceiptCopy('OFFICE COPY', 1)}
                        {renderReceiptCopy('STUDENT COPY', 2)}
                        {renderReceiptCopy('PARENT COPY', 3)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeReceipt;
