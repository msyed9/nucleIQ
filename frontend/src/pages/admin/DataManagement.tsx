import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
    Download,
    Upload,
    FileSpreadsheet,
    Users,
    UserCheck,
    GraduationCap,
    DollarSign,
    Building2,
    Home,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Database,
    Image,
    CreditCard
} from 'lucide-react';
import './DataManagement.css';

interface UploadResult {
    success: number;
    failed: number;
    duplicates: DuplicateRecord[];
    errors: string[];
}

interface DuplicateRecord {
    row: number;
    data: any;
    existingRecord: any;
    field: string;
    value: string;
}

interface ModuleTemplate {
    id: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
    requiredFields: string[];
    optionalFields: string[];
    sampleData: string[][];
}

// Icon mapping for backend module IDs
const ICON_MAP: Record<string, any> = {
    'students': Users,
    'staff': UserCheck,
    'classes': GraduationCap,
    'fee_structures': DollarSign,
    'fee_invoices': FileSpreadsheet,
    'fee_payments': DollarSign,
    'fee_allocations': CreditCard,
    'student_enrollments': UserCheck,
    'transport': Building2,
    'parents': Home,
    'attendance': CheckCircle,
    'student_photos': Image,
    'subjects': Building2,
    'exam_results': GraduationCap,
    'exam_schedule': RefreshCw,
    'timetable': RefreshCw,
    'library_books': Database,
    'library_transactions': Database,
    'payroll_payments': DollarSign,
    'hostel_allocations': Home,
    'inventory_items': Database,
    'certificates_issued': GraduationCap,
    'finance_journal_entries': DollarSign,
    'fee_discounts': DollarSign,
    'helpdesk_tickets': AlertTriangle,
    'lms_courses': GraduationCap,
    'idcards': Users,
};

const DEFAULT_ICON = Database;

const DataManagement: React.FC = () => {
    const [templates, setTemplates] = useState<ModuleTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [activeTab, setActiveTab] = useState<'import' | 'export' | 'backup'>('import');
    const [selectedModule, setSelectedModule] = useState<string>('students');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicatesToResolve, setDuplicatesToResolve] = useState<DuplicateRecord[]>([]);
    const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set());
    const [exporting, setExporting] = useState(false);
    const [backupProgress, setBackupProgress] = useState<number>(0);
    const [creatingBackup, setCreatingBackup] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const response = await api.get('/data-management/modules/');
                const modules = response.data.modules.map((m: any) => ({
                    ...m,
                    icon: ICON_MAP[m.id] || DEFAULT_ICON,
                }));
                setTemplates(modules);
                if (modules.length > 0 && !selectedModule) {
                    setSelectedModule(modules[0].id);
                }
            } catch (error) {
                console.error('Error fetching modules:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        // Check navigation state for uploadResult when arriving from preview/import
        const navState: any = (location && (location as any).state) || {};
        if (navState.uploadResult) {
            setUploadResult(navState.uploadResult);
            // clear state to avoid reusing it accidentally
            try {
                (window.history.replaceState as any)(null, '');
            } catch (e) {}
        }

        fetchTemplates();
    }, []);

    const selectedTemplate = templates.find(t => t.id === selectedModule);

    const downloadTemplate = async (moduleId: string) => {
        try {
            const response = await api.get(`/data-management/template/${moduleId}/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${moduleId}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading template:', error);
            // Fallback: Generate client-side template
            generateClientTemplate(moduleId);
        }
    };

    const generateClientTemplate = (moduleId: string) => {
        const template = templates.find(t => t.id === moduleId);
        if (!template) return;

        // Create CSV content
        const headers = [...template.requiredFields, ...template.optionalFields];
        let csvContent = headers.join(',') + '\n';

        // Add sample row if available
        if (template.sampleData.length > 1) {
            csvContent += template.sampleData[1].join(',') + '\n';
        }

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${moduleId}_template.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadFile(e.target.files[0]);
            setUploadResult(null);
        }
    };

    const navigate = useNavigate();
    const location = useLocation();

    const handleUpload = async () => {
        if (!uploadFile) return;

        setUploading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('module', selectedModule);
        formData.append('skip_duplicates', 'true');
        formData.append('validate_only', 'true');

        try {
            const response = await api.post('/data-management/validate/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const result = response.data;
            // If validate endpoint returned preview use it; some responses nest preview under 'validation'
            const preview = result.preview || result.validation?.preview || result.validation?.preview_rows;
            const duplicates = result.duplicates || result.validation?.duplicates || [];

            if (preview) {
                navigate('/settings/data-management/import-preview', {
                    state: {
                        file: uploadFile,
                        preview,
                        duplicates,
                        module: selectedModule
                    }
                });
                return;
            }

            // Fallback: show result/error summary
            setUploadResult(result);
            if (result.duplicates && result.duplicates.length > 0) {
                setDuplicatesToResolve(result.duplicates);
                setShowDuplicateModal(true);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadResult({
                success: 0,
                failed: 1,
                duplicates: [],
                errors: [error.response?.data?.error || 'Upload failed. Please check the file format.']
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDuplicateSelection = (index: number) => {
        const newSelected = new Set(selectedDuplicates);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedDuplicates(newSelected);
    };

    const selectAllDuplicates = () => {
        if (selectedDuplicates.size === duplicatesToResolve.length) {
            setSelectedDuplicates(new Set());
        } else {
            setSelectedDuplicates(new Set(duplicatesToResolve.map((_, i) => i)));
        }
    };

    const resolveDuplicates = async (action: 'override' | 'skip') => {
        if (action === 'skip') {
            setShowDuplicateModal(false);
            setDuplicatesToResolve([]);
            setSelectedDuplicates(new Set());
            return;
        }

        try {
            setUploading(true);
            const recordsToOverride = duplicatesToResolve
                .filter((_, idx) => selectedDuplicates.has(idx))
                .map(d => d.data);

            const response = await api.post('/data-management/override-duplicates/', {
                module: selectedModule,
                records: recordsToOverride
            });

            if (response.data.success) {
                // Update result locally
                setUploadResult(prev => prev ? {
                    ...prev,
                    success: prev.success + (response.data.overridden || 0),
                    duplicates: duplicatesToResolve.filter((_, i) => !selectedDuplicates.has(i))
                } : null);

                setShowDuplicateModal(false);
                setDuplicatesToResolve([]);
                setSelectedDuplicates(new Set());
                alert(`Successfully overridden ${response.data.overridden} records.`);
            } else {
                alert(`Failed to override some records: ${response.data.errors?.join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error overriding duplicates:', error);
            alert('Failed to override duplicates. Please check server logs.');
        } finally {
            setUploading(false);
        }
    };

    const handleExport = async (moduleId: string) => {
        setExporting(true);
        try {
            const response = await api.get(`/data-management/export/${moduleId}/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${moduleId}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const createFullBackup = async () => {
        setCreatingBackup(true);
        setBackupProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setBackupProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            const response = await api.get('/data-management/backup/', {
                responseType: 'blob'
            });

            clearInterval(progressInterval);
            setBackupProgress(100);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `school_backup_${new Date().toISOString().split('T')[0]}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Backup error:', error);
            alert('Backup creation failed. Please try again.');
        } finally {
            setCreatingBackup(false);
            setBackupProgress(0);
        }
    };

    if (loadingTemplates) {
        return (
            <div className="data-management-container loading">
                <RefreshCw size={48} className="spin" />
                <p>Loading module configurations...</p>
            </div>
        );
    }

    return (
        <div className="data-management-container">
            <div className="page-header">
                <h1>📊 Data Management</h1>
                <p>Import, export, and backup your school data</p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={activeTab === 'import' ? 'active' : ''}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload size={18} />
                    Import Data
                </button>
                <button
                    className={activeTab === 'export' ? 'active' : ''}
                    onClick={() => setActiveTab('export')}
                >
                    <Download size={18} />
                    Export Data
                </button>
                <button
                    className={activeTab === 'backup' ? 'active' : ''}
                    onClick={() => setActiveTab('backup')}
                >
                    <Database size={18} />
                    Backup & Restore
                </button>
            </div>

            {/* Import Tab */}
            {activeTab === 'import' && (
                <div className="import-section">
                    <div className="section-header">
                        <h2>📥 Import Data</h2>
                        <p>Select a module and download the template, fill in your data, then upload</p>
                        <div className="date-format-card">
                            <span className="date-format-icon">📅</span>
                            <div className="date-format-text">
                                <strong>Date Format:</strong>
                                <span>
                                    All date fields accept both <code>dd-mm-yyyy</code> and <code>dd/mm/yyyy</code> formats (e.g., 15-05-2010 or 15/05/2010)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Module Selection */}
                    <div className="module-grid">
                        {templates.map(template => {
                            const Icon = template.icon;
                            const keyField = template.requiredFields.find(f => /admission|email|id|number|code/i.test(f)) || template.requiredFields[0];
                            return (
                                <div
                                    key={template.id}
                                    className={`module-card ${selectedModule === template.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedModule(template.id)}
                                >
                                    {keyField && <span className="key-badge card-key">{keyField}</span>}
                                    <div className="module-icon">
                                        <Icon size={20} />
                                    </div>
                                    <div className="module-body">
                                        <span className="module-name">{template.name}</span>
                                        <p className="module-desc">{template.description}</p>
                                        <div className="module-meta">
                                            <span className="module-counts">{template.requiredFields.length} required • {template.optionalFields.length} optional</span>
                                        </div>
                                        <div className="sample-preview" aria-hidden>
                                            <strong>Sample:</strong>
                                            <pre>{template.sampleData && template.sampleData[1] ? template.sampleData[1].join(', ') : template.sampleData[0].join(', ')}</pre>
                                        </div>
                                    </div>

                                    <div className="card-overlay" role="group" aria-hidden>
                                        <button
                                            type="button"
                                            className="overlay-btn"
                                            onClick={(e) => { e.stopPropagation(); downloadTemplate(template.id); }}
                                        >
                                            Download Template
                                        </button>
                                        <button
                                            type="button"
                                            className="overlay-btn secondary"
                                            onClick={(e) => { e.stopPropagation(); setSelectedModule(template.id); }}
                                        >
                                            Preview Sample
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Module Details */}
                    {selectedTemplate && (
                        <div className="template-details">
                            <h3>{selectedTemplate.name} Import</h3>
                            <p>{selectedTemplate.description}</p>

                            <div className="fields-info">
                                <div className="required-fields">
                                    <h4>Required Fields</h4>
                                    <div className="field-tags">
                                        {selectedTemplate.requiredFields.map(field => (
                                            <span key={field} className="field-tag required">{field}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="optional-fields">
                                    <h4>Optional Fields</h4>
                                    <div className="field-tags">
                                        {selectedTemplate.optionalFields.map(field => (
                                            <span key={field} className="field-tag optional">{field}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="btn-download-template"
                                    onClick={() => downloadTemplate(selectedTemplate.id)}
                                >
                                    <FileSpreadsheet size={18} />
                                    Download Template
                                </button>
                            </div>

                            {/* Upload Section */}
                            <div className="upload-section">
                                <h4>Upload Your Data</h4>
                                <div className="upload-area">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        id="file-upload"
                                        className="file-input"
                                    />
                                    <label htmlFor="file-upload" className="upload-label">
                                        {uploadFile ? (
                                            <span>📄 {uploadFile.name}</span>
                                        ) : (
                                            <>
                                                <Upload size={32} />
                                                <span>Click to select file or drag and drop</span>
                                                <small>Accepts .xlsx, .xls, .csv</small>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {uploadFile && (
                                    <button
                                        className="btn-upload"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <RefreshCw size={18} className="spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Preview & Validate
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Upload Result */}
                                {uploadResult && (
                                    <div className="upload-result">
                                        <div className="result-summary">
                                            <div className="result-item success">
                                                <CheckCircle size={20} />
                                                <span>{uploadResult.success} records imported successfully</span>
                                            </div>
                                            {uploadResult.duplicates.length > 0 && (
                                                <div className="result-item warning">
                                                    <AlertTriangle size={20} />
                                                    <span>{uploadResult.duplicates.length} duplicates found</span>
                                                    <button onClick={() => setShowDuplicateModal(true)}>
                                                        Review
                                                    </button>
                                                </div>
                                            )}
                                            {uploadResult.failed > 0 && (
                                                <div className="result-item error">
                                                    <XCircle size={20} />
                                                    <span>{uploadResult.failed} records failed</span>
                                                </div>
                                            )}
                                        </div>
                                        {uploadResult.errors.length > 0 && (
                                            <div className="error-list">
                                                <h5>Errors:</h5>
                                                <ul>
                                                    {uploadResult.errors.map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
                <div className="export-section">
                    <div className="section-header">
                        <h2>📤 Export Data</h2>
                        <p>Download your data in Excel format for backup or migration</p>
                    </div>

                    <div className="export-grid">
                        {templates.filter(t => t.id !== 'student_photos').map(template => {
                            const Icon = template.icon;
                            return (
                                <div key={template.id} className="export-card">
                                    <div className="export-info">
                                        <Icon size={24} />
                                        <div>
                                            <h4>{template.name}</h4>
                                            <p>Export all {template.name.toLowerCase()} data</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleExport(template.id)}
                                        disabled={exporting}
                                    >
                                        <Download size={16} />
                                        Export
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
                <div className="backup-section">
                    <div className="section-header">
                        <h2>💾 Backup & Restore</h2>
                        <p>Create a complete backup of all your school data</p>
                    </div>

                    <div className="backup-options">
                        <div className="backup-card full-backup">
                            <div className="backup-icon">
                                <Database size={48} />
                            </div>
                            <h3>Full Data Backup</h3>
                            <p>
                                Download a complete backup of all modules including students, staff,
                                fees, academics, and more. The backup will be in ZIP format containing
                                Excel files for each module.
                            </p>
                            <ul className="backup-includes">
                                <li>✓ Students & Enrollments</li>
                                <li>✓ Staff & HR Data</li>
                                <li>✓ Fee Structures & Payments</li>
                                <li>✓ Academic Data (Classes, Subjects)</li>
                                <li>✓ Attendance Records</li>
                                <li>✓ Parent Information</li>
                            </ul>

                            {creatingBackup && (
                                <div className="backup-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${backupProgress}%` }}
                                        />
                                    </div>
                                    <span>Creating backup... {backupProgress}%</span>
                                </div>
                            )}

                            <button
                                className="btn-backup"
                                onClick={createFullBackup}
                                disabled={creatingBackup}
                            >
                                {creatingBackup ? (
                                    <>
                                        <RefreshCw size={18} className="spin" />
                                        Creating Backup...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Create & Download Backup
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="backup-info-box">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Important Notes:</strong>
                            <ul>
                                <li>Backups are created instantly and downloaded to your device</li>
                                <li>Media files (photos, documents) are not included in the backup</li>
                                <li>Keep your backups secure as they contain sensitive data</li>
                                <li>Regular backups are recommended (weekly or monthly)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Resolution Modal */}
            {showDuplicateModal && (
                <div className="modal-overlay">
                    <div className="modal-content duplicate-modal">
                        <div className="modal-header">
                            <h2>⚠️ Duplicate Records Found</h2>
                            <button onClick={() => resolveDuplicates('skip')}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>
                                The following records already exist in the system.
                                Select the ones you want to override with new data.
                            </p>

                            <div className="duplicate-actions">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedDuplicates.size === duplicatesToResolve.length}
                                        onChange={selectAllDuplicates}
                                    />
                                    Select All
                                </label>
                                <span>
                                    {selectedDuplicates.size} of {duplicatesToResolve.length} selected
                                </span>
                            </div>

                            <div className="duplicate-list">
                                {duplicatesToResolve.map((dup, index) => (
                                    <div key={index} className="duplicate-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedDuplicates.has(index)}
                                            onChange={() => handleDuplicateSelection(index)}
                                        />
                                        <div className="duplicate-details">
                                            <div className="duplicate-field">
                                                <strong>Row {dup.row}:</strong> {dup.field} = {dup.value}
                                            </div>
                                            <div className="comparison">
                                                <div className="existing">
                                                    <span className="label">Existing:</span>
                                                    <pre>{JSON.stringify(dup.existingRecord, null, 2)}</pre>
                                                </div>
                                                <div className="new">
                                                    <span className="label">New Data:</span>
                                                    <pre>{JSON.stringify(dup.data, null, 2)}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => resolveDuplicates('skip')}
                            >
                                Skip All Duplicates
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => resolveDuplicates('override')}
                                disabled={selectedDuplicates.size === 0}
                            >
                                Override Selected ({selectedDuplicates.size})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagement;
