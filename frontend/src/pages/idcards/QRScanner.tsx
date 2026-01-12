import React, { useState, useRef, useEffect } from 'react';
import * as idcardsAPI from '../../services/idcards';
import './QRScanner.css';

const QRScanner: React.FC = () => {
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [manualQRData, setManualQRData] = useState('');
    const [scanHistory, setScanHistory] = useState<any[]>([]);
    const [scanLocation, setScanLocation] = useState('Main Gate');
    const [scanDevice, setScanDevice] = useState('Scanner-01');
    const [todayStats, setTodayStats] = useState<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadScanHistory();
        fetchTodayStats();
    }, []);

    const loadScanHistory = () => {
        const saved = localStorage.getItem('scan_history');
        if (saved) {
            setScanHistory(JSON.parse(saved).slice(0, 10));
        }
    };

    const saveScanHistory = (record: any) => {
        const updated = [record, ...scanHistory.slice(0, 9)];
        setScanHistory(updated);
        localStorage.setItem('scan_history', JSON.stringify(updated));
    };

    const fetchTodayStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await idcardsAPI.getDailyAttendanceReport(today);
            setTodayStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleManualScan = async () => {
        if (!manualQRData.trim()) {
            alert('Please enter QR code data');
            return;
        }

        await processScan(manualQRData);
        setManualQRData('');
    };

    const processScan = async (qrData: string) => {
        try {
            const response = await idcardsAPI.scanQRCode({
                qr_data: qrData,
                scan_location: scanLocation,
                scan_device: scanDevice,
                scan_type: 'entry',
            });

            const result = response.data;
            setScanResult(result);
            saveScanHistory(result);
            fetchTodayStats();

            // Auto-close success message after 3 seconds
            setTimeout(() => {
                setScanResult(null);
            }, 3000);
        } catch (error: any) {
            setScanResult({
                success: false,
                error: error.response?.data?.error || 'Failed to process scan',
            });

            setTimeout(() => {
                setScanResult(null);
            }, 3000);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setScanning(true);
            }
        } catch (error) {
            console.error('Failed to start camera:', error);
            alert('Failed to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setScanning(false);
    };

    return (
        <div className="qr-scanner-page">
            <div className="scanner-header">
                <div>
                    <h1>QR Code Scanner</h1>
                    <p>Scan student and staff ID cards for attendance</p>
                </div>
            </div>

            {/* Today's Stats */}
            {todayStats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon students">
                            <i className="fas fa-user-graduate"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Students Present</span>
                            <span className="stat-value">{todayStats.unique_students}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon staff">
                            <i className="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Staff Present</span>
                            <span className="stat-value">{todayStats.unique_staff}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon late">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Late Arrivals</span>
                            <span className="stat-value">{todayStats.late}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <i className="fas fa-qrcode"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Scans</span>
                            <span className="stat-value">{todayStats.total_scans}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="scanner-container">
                <div className="scanner-section">
                    {/* Scanner Settings */}
                    <div className="scanner-settings">
                        <div className="setting-group">
                            <label>Scan Location</label>
                            <input
                                type="text"
                                value={scanLocation}
                                onChange={(e) => setScanLocation(e.target.value)}
                                placeholder="e.g., Main Gate"
                            />
                        </div>
                        <div className="setting-group">
                            <label>Scanner Device</label>
                            <input
                                type="text"
                                value={scanDevice}
                                onChange={(e) => setScanDevice(e.target.value)}
                                placeholder="e.g., Scanner-01"
                            />
                        </div>
                    </div>

                    {/* Camera Scanner */}
                    <div className="camera-scanner">
                        <div className="camera-container">
                            {scanning ? (
                                <>
                                    <video ref={videoRef} autoPlay playsInline></video>
                                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                                    <div className="scan-overlay">
                                        <div className="scan-frame"></div>
                                    </div>
                                </>
                            ) : (
                                <div className="camera-placeholder">
                                    <i className="fas fa-camera fa-4x"></i>
                                    <p>Camera not active</p>
                                </div>
                            )}
                        </div>

                        <div className="camera-controls">
                            {!scanning ? (
                                <button className="btn-primary btn-lg" onClick={startCamera}>
                                    <i className="fas fa-camera"></i>
                                    Start Camera
                                </button>
                            ) : (
                                <button className="btn-danger btn-lg" onClick={stopCamera}>
                                    <i className="fas fa-stop"></i>
                                    Stop Camera
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="manual-entry">
                        <h3>Manual Entry</h3>
                        <div className="manual-input-group">
                            <input
                                type="text"
                                value={manualQRData}
                                onChange={(e) => setManualQRData(e.target.value)}
                                placeholder="Enter QR code data or scan with barcode scanner"
                                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                            />
                            <button className="btn-primary" onClick={handleManualScan}>
                                <i className="fas fa-check"></i>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Scan History */}
                <div className="history-section">
                    <h2>Recent Scans</h2>
                    {scanHistory.length === 0 ? (
                        <div className="empty-history">
                            <i className="fas fa-history fa-2x"></i>
                            <p>No scans yet</p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {scanHistory.map((record, index) => (
                                <div key={index} className="history-record">
                                    <div className="record-info">
                                        <div className="record-name">
                                            {record.student?.name || record.staff?.name}
                                        </div>
                                        <div className="record-details">
                                            {record.student && (
                                                <span>Class: {record.student.class}</span>
                                            )}
                                            <span className={`status-badge ${record.status}`}>
                                                {record.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="record-time">
                                        {new Date(record.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Result Popup */}
            {scanResult && (
                <div className="scan-result-popup">
                    <div className={`result-card ${scanResult.success ? 'success' : 'error'}`}>
                        <div className="result-icon">
                            {scanResult.success ? (
                                <i className="fas fa-check-circle"></i>
                            ) : (
                                <i className="fas fa-times-circle"></i>
                            )}
                        </div>
                        {scanResult.success ? (
                            <>
                                <h3>Attendance Marked</h3>
                                <div className="result-details">
                                    <p className="name">
                                        {scanResult.student?.name || scanResult.staff?.name}
                                    </p>
                                    {scanResult.student && (
                                        <p className="class">Class: {scanResult.student.class}</p>
                                    )}
                                    <p className={`status ${scanResult.status}`}>
                                        Status: {scanResult.status.toUpperCase()}
                                    </p>
                                    {scanResult.message && (
                                        <p className="message">{scanResult.message}</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <h3>Scan Failed</h3>
                                <p className="error-text">{scanResult.error}</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
