/**
 * Mobile Attendance Capture
 * Support for QR Code, Face Recognition, and RFID attendance capture
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Camera,
    QrCode,
    CreditCard,
    X,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react';
import { Button, Card } from '@/design-system';
import api from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';
import Webcam from 'react-webcam';

type CaptureMethod = 'QR' | 'FACE' | 'RFID' | null;

interface CaptureResult {
    success: boolean;
    message: string;
    student?: {
        id: string;
        full_name: string;
        admission_number: string;
        class_name: string;
        section: string;
        photo_url?: string;
    };
    status?: string;
    check_in_time?: string;
}

const MobileCapture: React.FC = () => {
    const { t } = useTranslation();
    const [method, setMethod] = useState<CaptureMethod>(null);
    const [capturing, setCapturing] = useState(false);
    const [result, setResult] = useState<CaptureResult | null>(null);
    const [processing, setProcessing] = useState(false);
    const webcamRef = useRef<Webcam>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const qrReaderDivId = 'qr-reader';

    useEffect(() => {
        return () => {
            // Cleanup: stop QR scanner when component unmounts
            stopQRScanner();
        };
    }, []);

    const stopQRScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (error) {
                console.error('Error stopping QR scanner:', error);
            }
        }
    };

    const handleQRScan = async () => {
        setMethod('QR');
        setCapturing(true);
        setResult(null);
        setProcessing(false);

        // Wait for next tick to ensure div is rendered
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(qrReaderDivId);
                html5QrCodeRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Use back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    async (decodedText) => {
                        // QR Code detected!
                        setProcessing(true);
                        await stopQRScanner();
                        await markAttendanceByQR(decodedText);
                    },
                    (errorMessage) => {
                        // QR scanning errors (can be ignored mostly)
                    }
                );
            } catch (error) {
                console.error('Error starting QR scanner:', error);
                alert('Unable to access camera. Please check permissions.');
                handleCancel();
            }
        }, 100);
    };

    const markAttendanceByQR = async (qrData: string) => {
        try {
            // The QR code on ID cards contains the admission number
            // Try the new scan_idcard endpoint first
            const response = await api.post('/attendance/records/scan_idcard/', {
                admission_number: qrData.trim(),
                location: 'Mobile Capture'
            });

            if (response.data.success) {
                const studentData = response.data.student || {};

                setResult({
                    success: true,
                    message: response.data.message || 'Attendance marked successfully!',
                    student: {
                        id: studentData.id || '',
                        full_name: studentData.full_name || 'Unknown',
                        admission_number: studentData.admission_number || qrData,
                        class_name: studentData.class || 'N/A',
                        section: studentData.section || 'N/A',
                        photo_url: studentData.photo
                    },
                    status: response.data.attendance?.status || 'PRESENT',
                    check_in_time: response.data.attendance?.check_in_time || new Date().toLocaleTimeString()
                });
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }

            setCapturing(false);

            // Auto-reset after 3 seconds
            setTimeout(() => {
                setResult(null);
                setMethod(null);
            }, 3000);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error || 'Failed to mark attendance. Invalid QR code or student not found.'
            });
            setCapturing(false);
        } finally {
            setProcessing(false);
        }
    };

    const handleFaceCapture = () => {
        setMethod('FACE');
        setCapturing(true);
        setResult(null);
        setProcessing(false);
    };

    const handleRFIDScan = () => {
        setMethod('RFID');
        setCapturing(true);
        setResult(null);
        alert('Please scan RFID card...');
        // RFID scanning would be handled by external hardware
        // that sends data to backend
    };

    const captureFaceImage = async () => {
        if (!webcamRef.current) return;

        setProcessing(true);

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                throw new Error('Failed to capture image');
            }

            // Convert base64 to blob
            const response = await fetch(imageSrc);
            const blob = await response.blob();

            // Create FormData
            const formData = new FormData();
            formData.append('image', blob, 'face-capture.jpg');
            formData.append('method', 'FACE');

            // Send to backend
            const apiResponse = await api.post('/attendance/records/mobile_capture/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult({
                success: true,
                message: apiResponse.data.message || 'Attendance marked successfully!',
                student: apiResponse.data.student,
                status: apiResponse.data.status,
                check_in_time: apiResponse.data.check_in_time
            });

            setCapturing(false);

            // Auto-reset after 3 seconds
            setTimeout(() => {
                setResult(null);
                setMethod(null);
            }, 3000);
        } catch (error: any) {
            setResult({
                success: false,
                message: error.response?.data?.error || 'Failed to recognize face. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        await stopQRScanner();
        setCapturing(false);
        setMethod(null);
        setResult(null);
        setProcessing(false);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '2.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.5rem 0'
                }}>
                    Mobile Attendance
                </h1>
                <p style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                }}>
                    Capture attendance using QR Code, Face Recognition, or RFID
                </p>
            </div>

            {!capturing && !result && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {/* QR Code Option */}
                    <Card padding='lg' style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={handleQRScan}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <QrCode size={40} color='white' />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                                QR Code Scan
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Scan student ID card QR code
                            </p>
                        </div>
                    </Card>

                    {/* Face Recognition Option */}
                    <Card padding='lg' style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={handleFaceCapture}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <Camera size={40} color='white' />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                                Face Recognition
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Capture student face for attendance
                            </p>
                        </div>
                    </Card>

                    {/* RFID Option */}
                    <Card padding='lg' style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={handleRFIDScan}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <CreditCard size={40} color='white' />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                                RFID Card
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                Scan RFID card for attendance
                            </p>
                        </div>
                    </Card>
                </div>
            )}

            {/* QR Scanner View */}
            {capturing && method === 'QR' && !processing && (
                <Card padding='lg'>
                    <div style={{ position: 'relative' }}>
                        <div id={qrReaderDivId} style={{ width: '100%' }}></div>

                        <div style={{
                            marginTop: '1rem',
                            textAlign: 'center'
                        }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                Position the QR code within the frame
                            </p>
                            <Button
                                variant='outline'
                                size='lg'
                                onClick={handleCancel}
                                iconLeft={X}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Face Capture View */}
            {capturing && method === 'FACE' && !processing && (
                <Card padding='lg'>
                    <div style={{ position: 'relative' }}>
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                facingMode: 'user',
                                width: 1280,
                                height: 720
                            }}
                            style={{
                                width: '100%',
                                borderRadius: 'var(--radius-lg)',
                                background: '#000'
                            }}
                        />

                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '1rem'
                        }}>
                            <Button
                                variant='primary'
                                size='lg'
                                onClick={captureFaceImage}
                                iconLeft={Camera}
                            >
                                Capture Face
                            </Button>
                            <Button
                                variant='outline'
                                size='lg'
                                onClick={handleCancel}
                                iconLeft={X}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Processing Indicator */}
            {processing && (
                <Card padding='lg'>
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        <Loader size={48} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)' }}>
                            Processing {method === 'QR' ? 'QR Code' : 'Face Recognition'}...
                        </p>
                    </div>
                </Card>
            )}

            {/* Result Display */}
            {result && (
                <Card padding='lg' style={{
                    background: result.success ?
                        'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(255,255,255,0.02))' :
                        'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255,255,255,0.02))',
                    borderLeft: result.success ? '4px solid var(--color-success)' : '4px solid var(--color-error)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: result.success ? 'var(--color-success)' : 'var(--color-error)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            {result.success ? (
                                <CheckCircle size={40} color='white' />
                            ) : (
                                <AlertCircle size={40} color='white' />
                            )}
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600 }}>
                            {result.message}
                        </h3>

                        {result.student && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: 'var(--radius-base)' }}>
                                {result.student.photo_url && (
                                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                        <img
                                            src={result.student.photo_url}
                                            alt={result.student.full_name}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid var(--color-success)'
                                            }}
                                        />
                                    </div>
                                )}
                                <p style={{ margin: '0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                    {result.student.full_name}
                                </p>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {result.student.admission_number}
                                </p>
                                <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                    {result.student.class_name} - {result.student.section}
                                </p>
                                {result.status && (
                                    <p style={{
                                        margin: '0.5rem 0 0.25rem 0',
                                        fontSize: '0.875rem',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        background: result.status === 'PRESENT' ? 'var(--color-success)' : 'var(--color-warning)',
                                        color: 'white',
                                        display: 'inline-block',
                                        fontWeight: 600
                                    }}>
                                        Status: {result.status}
                                    </p>
                                )}
                                {result.check_in_time && (
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Check-in: {result.check_in_time}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default MobileCapture;
