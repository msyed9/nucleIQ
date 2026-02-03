/**
 * Certificate Viewer Page
 * View and download course completion certificates
 */

import React, { useState, useEffect } from 'react';
import {
    Award,
    Download,
    Share2,
    ExternalLink,
    Calendar,
    BookOpen,
    User,
    CheckCircle,
    RefreshCw,
    QrCode,
    Copy,
    Printer,
    Eye
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface Certificate {
    id: string;
    certificate_number: string;
    course: {
        id: string;
        title: string;
        thumbnail: string | null;
    };
    student: {
        id: string;
        full_name: string;
    };
    instructor: {
        id: string;
        full_name: string;
    };
    issue_date: string;
    expiry_date: string | null;
    completion_percentage: number;
    download_url: string;
    verification_url: string;
    qr_code: string | null;
    status: 'valid' | 'expired' | 'revoked';
}

const CertificateViewer: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/lms/my-certificates/');
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setCertificates(data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (certificate: Certificate) => {
        try {
            const response = await api.get(certificate.download_url, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate_${certificate.certificate_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading certificate:', error);
            alert('Failed to download certificate');
        }
    };

    const handleCopyLink = (certificateId: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(certificateId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = async (certificate: Certificate) => {
        const shareData = {
            title: `${certificate.course.title} Certificate`,
            text: `I completed ${certificate.course.title}!`,
            url: certificate.verification_url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopyLink(certificate.id, certificate.verification_url);
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return <span className="status-badge valid"><CheckCircle size={12} /> Valid</span>;
            case 'expired':
                return <span className="status-badge expired">Expired</span>;
            case 'revoked':
                return <span className="status-badge revoked">Revoked</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading certificates...</p>
            </div>
        );
    }

    return (
        <div className="certificate-viewer">
            <div className="page-header">
                <div>
                    <h1>🏆 My Certificates</h1>
                    <p>View and download your course completion certificates</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <Award size={24} />
                    <div>
                        <span className="stat-value">{certificates.length}</span>
                        <span className="stat-label">Total Certificates</span>
                    </div>
                </div>
                <div className="stat-card">
                    <CheckCircle size={24} />
                    <div>
                        <span className="stat-value">
                            {certificates.filter(c => c.status === 'valid').length}
                        </span>
                        <span className="stat-label">Valid</span>
                    </div>
                </div>
            </div>

            {/* Certificates Grid */}
            {certificates.length === 0 ? (
                <div className="empty-state">
                    <Award size={48} />
                    <h3>No certificates yet</h3>
                    <p>Complete courses to earn certificates</p>
                </div>
            ) : (
                <div className="certificates-grid">
                    {certificates.map(cert => (
                        <div key={cert.id} className={`certificate-card ${cert.status}`}>
                            <div className="certificate-preview">
                                <div className="certificate-frame">
                                    <div className="frame-content">
                                        <Award size={32} />
                                        <h4>Certificate of Completion</h4>
                                        <p className="course-title">{cert.course.title}</p>
                                        <p className="recipient">{cert.student.full_name}</p>
                                        <p className="date">{formatDate(cert.issue_date)}</p>
                                    </div>
                                </div>
                                {getStatusBadge(cert.status)}
                            </div>

                            <div className="certificate-info">
                                <h3>{cert.course.title}</h3>
                                <div className="cert-meta">
                                    <span>
                                        <Calendar size={14} />
                                        Issued: {formatDate(cert.issue_date)}
                                    </span>
                                    <span>
                                        <User size={14} />
                                        {cert.instructor.full_name}
                                    </span>
                                </div>
                                <div className="cert-number">
                                    <span>Certificate #:</span>
                                    <code>{cert.certificate_number}</code>
                                </div>
                            </div>

                            <div className="certificate-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => handleDownload(cert)}
                                    disabled={cert.status !== 'valid'}
                                >
                                    <Download size={16} />
                                    Download PDF
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setSelectedCertificate(cert)}
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleShare(cert)}
                                    title="Share"
                                >
                                    <Share2 size={16} />
                                </button>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleCopyLink(cert.id, cert.verification_url)}
                                    title={copiedId === cert.id ? 'Copied!' : 'Copy verification link'}
                                >
                                    {copiedId === cert.id ? <CheckCircle size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Certificate Detail Modal */}
            {selectedCertificate && (
                <div className="modal-overlay" onClick={() => setSelectedCertificate(null)}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="certificate-detail-modal">
                            <div className="certificate-display">
                                <div className="certificate-template">
                                    <div className="cert-header">
                                        <Award size={48} className="cert-icon" />
                                        <h1>Certificate of Completion</h1>
                                    </div>
                                    <div className="cert-body">
                                        <p className="cert-intro">This is to certify that</p>
                                        <h2 className="cert-name">{selectedCertificate.student.full_name}</h2>
                                        <p className="cert-text">has successfully completed the course</p>
                                        <h3 className="cert-course">{selectedCertificate.course.title}</h3>
                                        <p className="cert-score">
                                            with a completion score of {selectedCertificate.completion_percentage}%
                                        </p>
                                    </div>
                                    <div className="cert-footer">
                                        <div className="cert-date">
                                            <span>Date Issued</span>
                                            <strong>{formatDate(selectedCertificate.issue_date)}</strong>
                                        </div>
                                        <div className="cert-instructor">
                                            <span>Instructor</span>
                                            <strong>{selectedCertificate.instructor.full_name}</strong>
                                        </div>
                                        <div className="cert-id">
                                            <span>Certificate ID</span>
                                            <strong>{selectedCertificate.certificate_number}</strong>
                                        </div>
                                    </div>
                                    {selectedCertificate.qr_code && (
                                        <div className="cert-qr">
                                            <img src={selectedCertificate.qr_code} alt="QR Code" />
                                            <span>Scan to verify</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="cert-actions-panel">
                                <button
                                    className="btn-primary full"
                                    onClick={() => handleDownload(selectedCertificate)}
                                >
                                    <Download size={18} />
                                    Download PDF
                                </button>
                                <button className="btn-secondary full" onClick={() => window.print()}>
                                    <Printer size={18} />
                                    Print
                                </button>
                                <button
                                    className="btn-secondary full"
                                    onClick={() => handleShare(selectedCertificate)}
                                >
                                    <Share2 size={18} />
                                    Share
                                </button>
                                <div className="verification-section">
                                    <h4>Verification Link</h4>
                                    <div className="verification-link">
                                        <input
                                            type="text"
                                            value={selectedCertificate.verification_url}
                                            readOnly
                                        />
                                        <button
                                            onClick={() => handleCopyLink(
                                                selectedCertificate.id,
                                                selectedCertificate.verification_url
                                            )}
                                        >
                                            {copiedId === selectedCertificate.id ? (
                                                <CheckCircle size={16} />
                                            ) : (
                                                <Copy size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className="close-modal"
                                    onClick={() => setSelectedCertificate(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateViewer;
