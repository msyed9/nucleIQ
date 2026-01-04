import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, QrCode, User, Building2, Calendar, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

interface Visitor {
    id: number;
    visitor_number: string;
    name: string;
    phone: string;
    email: string;
    organization: string;
    purpose: string;
    meeting_with_name?: string;
    check_in_time: string;
    badge_number: string;
    photo?: string;
}

interface BadgePrintProps {
    visitor: Visitor;
    onClose: () => void;
}

const VisitorBadgePrint: React.FC<BadgePrintProps> = ({ visitor, onClose }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string>('/logo.png'); // Placeholder
    const badgeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        generateQRCode();
    }, [visitor]);

    const generateQRCode = async () => {
        try {
            const qrData = JSON.stringify({
                visitor_id: visitor.id,
                visitor_number: visitor.visitor_number,
                name: visitor.name,
                check_in: visitor.check_in_time,
            });
            const url = await QRCode.toDataURL(qrData, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            setQrCodeUrl(url);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const handlePrint = () => {
        window.print();
        toast.success('Badge sent to printer');
    };

    const handleDownload = () => {
        if (!badgeRef.current) return;

        // Create a canvas from the badge
        import('html2canvas').then((html2canvas) => {
            html2canvas.default(badgeRef.current!).then((canvas) => {
                const link = document.createElement('a');
                link.download = `visitor-badge-${visitor.visitor_number}.png`;
                link.href = canvas.toDataURL();
                link.click();
                toast.success('Badge downloaded successfully');
            });
        }).catch(() => {
            toast.error('Failed to download badge. Please use print instead.');
        });
    };

    const handleMarkPrinted = async () => {
        try {
            await api.patch(`/api/crm/visitors/${visitor.id}/`, {
                badge_printed: true,
            });
            toast.success('Badge marked as printed');
            onClose();
        } catch (error) {
            console.error('Error marking badge as printed:', error);
            toast.error('Failed to update badge status');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header - No Print */}
                <div className="p-6 border-b border-gray-200 print:hidden">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Visitor Badge</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                            >
                                <Download size={18} />
                                Download
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Printer size={18} />
                                Print Badge
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>

                {/* Badge Design */}
                <div className="p-8 flex justify-center">
                    <div
                        ref={badgeRef}
                        className="w-[400px] h-[600px] bg-white border-4 border-blue-600 rounded-2xl shadow-2xl overflow-hidden relative"
                        style={{ pageBreakInside: 'avoid' }}
                    >
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center">
                            <div className="flex items-center justify-center mb-2">
                                <Building2 size={32} />
                            </div>
                            <h1 className="text-2xl font-bold">VISITOR</h1>
                            <p className="text-sm mt-1 opacity-90">Campus Access Badge</p>
                        </div>

                        {/* Photo Section */}
                        <div className="flex justify-center -mt-12 mb-4">
                            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                                {visitor.photo ? (
                                    <img src={visitor.photo} alt={visitor.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Visitor Information */}
                        <div className="px-6 space-y-3">
                            {/* Name */}
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{visitor.name}</p>
                                <p className="text-sm text-gray-600">{visitor.organization || 'Individual Visitor'}</p>
                            </div>

                            {/* Badge Number */}
                            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-2 text-center">
                                <p className="text-xs text-gray-600 font-medium">Badge Number</p>
                                <p className="text-xl font-bold text-gray-800">{visitor.badge_number || visitor.visitor_number}</p>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-600" />
                                    <span className="text-gray-600">Check-in:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(visitor.check_in_time).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-blue-600" />
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(visitor.check_in_time).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-blue-600" />
                                    <span className="text-gray-600">Meeting:</span>
                                    <span className="font-medium text-gray-800">{visitor.meeting_with_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-blue-600" />
                                    <span className="text-gray-600">Purpose:</span>
                                    <span className="font-medium text-gray-800">{visitor.purpose}</span>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center pt-4">
                                {qrCodeUrl && (
                                    <div className="text-center">
                                        <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 mx-auto" />
                                        <p className="text-xs text-gray-500 mt-1">Scan for verification</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-100 p-3 text-center border-t-2 border-gray-300">
                            <p className="text-xs text-gray-600 font-medium">
                                Please return this badge when leaving the premises
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                For security purposes, this badge must be visible at all times
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions - No Print */}
                <div className="p-6 border-t border-gray-200 print:hidden">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <p>Badge for: <span className="font-semibold">{visitor.name}</span></p>
                            <p>Visitor #: <span className="font-semibold">{visitor.visitor_number}</span></p>
                        </div>
                        <button
                            onClick={handleMarkPrinted}
                            className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <QrCode size={18} />
                            Mark as Printed
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    ${badgeRef.current ? `
                        #${badgeRef.current.id},
                        #${badgeRef.current.id} * {
                            visibility: visible;
                        }
                        #${badgeRef.current.id} {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                        }
                    ` : ''}
                }
            `}</style>
        </div>
    );
};

export default VisitorBadgePrint;
