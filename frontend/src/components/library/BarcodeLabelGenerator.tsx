import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';

interface BarcodeLabelGeneratorProps {
    barcode: string;
    bookTitle: string;
    author: string;
    onClose: () => void;
}

const BarcodeLabelGenerator: React.FC<BarcodeLabelGeneratorProps> = ({
    barcode,
    bookTitle,
    author,
    onClose
}) => {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Barcode-${barcode}`,
        onAfterPrint: () => {
            console.log('Print successful');
        }
    } as any);

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Barcode Label</h2>
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                </div>

                <div ref={componentRef} style={styles.printArea}>
                    <div style={styles.label}>
                        <h3 style={styles.bookTitle}>{bookTitle}</h3>
                        <p style={styles.author}>by {author}</p>
                        <div style={styles.barcodeContainer}>
                            <Barcode
                                value={barcode}
                                format="CODE128"
                                width={2}
                                height={50}
                                displayValue={true}
                                fontSize={14}
                            />
                        </div>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button onClick={handlePrint} style={styles.printBtn}>
                        Print Label
                    </button>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    title: {
        margin: 0,
        fontSize: '1.5rem',
        color: '#333'
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '4px 8px',
        color: '#666'
    },
    printArea: {
        border: '2px dashed #ccc',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#fafafa'
    },
    label: {
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '16px',
        border: '1px solid #ddd'
    },
    bookTitle: {
        margin: '0 0 8px 0',
        fontSize: '1.1rem',
        color: '#333',
        fontWeight: 'bold'
    },
    author: {
        margin: '0 0 16px 0',
        fontSize: '0.9rem',
        color: '#666'
    },
    barcodeContainer: {
        display: 'flex',
        justifyContent: 'center',
        padding: '8px'
    },
    actions: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
    },
    printBtn: {
        padding: '10px 20px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500'
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: '#6b7280',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500'
    }
};

export default BarcodeLabelGenerator;
