import React, { useState, useRef, useEffect } from 'react';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    placeholder?: string;
    label?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
    onScan, 
    placeholder = "Scan or enter barcode",
    label 
}) => {
    const [barcode, setBarcode] = useState('');
    const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus on mount
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (barcode.trim()) {
            onScan(barcode.trim());
            setBarcode('');
            inputRef.current?.focus();
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                    {barcode && (
                        <button
                            type="button"
                            onClick={() => setBarcode('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={!barcode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Scan
                </button>
            </form>

            <p className="text-xs text-gray-500">
                 Tip: Use a barcode scanner to auto-enter, or type manually and press Enter
            </p>
        </div>
    );
};

export default BarcodeScanner;
