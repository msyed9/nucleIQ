/**
 * Data Migration Page
 * Import, Export, and Migrate data between systems
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Eye,
    Trash2,
    RotateCcw,
    Clock,
    Users,
    UserCheck,
    GraduationCap,
    BookOpen,
    DollarSign,
    Bus,
    Calendar,
    HelpCircle,
    ChevronRight,
    ChevronDown,
    Loader2,
    FileText,
    Archive,
    X,
    Database
} from 'lucide-react';
import { Button, Card, Input, Select, Badge } from '@/design-system';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import './DataMigration.css';

// Module configuration with icons
const MODULE_ICONS: Record<string, React.ReactNode> = {
    students: <GraduationCap size={20} />,
    staff: <UserCheck size={20} />,
    classes: <BookOpen size={20} />,
    subjects: <BookOpen size={20} />,
    fee_structures: <DollarSign size={20} />,
    fee_invoices: <FileText size={20} />,
    fee_payments: <DollarSign size={20} />,
    fee_allocations: <DollarSign size={20} />,
    fee_discounts: <DollarSign size={20} />,
    student_enrollments: <Users size={20} />,
    transport: <Bus size={20} />,
    parents: <Users size={20} />,
    user_accounts: <Users size={20} />,
    attendance: <Calendar size={20} />,
    student_photos: <FileText size={20} />,
    exam_results: <FileSpreadsheet size={20} />,
    exam_schedule: <Calendar size={20} />,
    timetable: <Clock size={20} />,
    library_books: <BookOpen size={20} />,
    library_transactions: <BookOpen size={20} />,
    payroll_payments: <DollarSign size={20} />,
    hostel_allocations: <Users size={20} />,
    inventory_items: <Archive size={20} />,
    certificates_issued: <FileText size={20} />,
    finance_journal_entries: <DollarSign size={20} />,
    helpdesk_tickets: <HelpCircle size={20} />,
    lms_courses: <BookOpen size={20} />,
    lms_enrollments: <Users size={20} />,
    idcards: <FileText size={20} />,
};

interface ModuleInfo {
    name: string;
    display_name: string;
    description: string;
    unique_field: string | null;
    supported_formats: string[];
    required_field_count: number;
    optional_field_count: number;
}

interface FieldSpec {
    name: string;
    display_name: string;
    type: string;
    required: boolean;
    max_length: number | null;
    choices: string[] | null;
    description: string;
    sample_value: string;
    validation_hint: string;
}

interface ModuleFields {
    name: string;
    display_name: string;
    description: string;
    unique_field: string | null;
    required_fields: FieldSpec[];
    optional_fields: FieldSpec[];
    instructions: string[];
}

interface ValidationResult {
    valid: boolean;
    total_rows: number;
    error_count: number;
    duplicate_count: number;
    warning_count: number;
    errors: string[];
    warnings: string[];
    duplicates: Array<{
        row: number;
        field: string;
        value: string;
    }>;
    preview: Array<{
        row_number: number;
        data: Record<string, string>;
        has_errors: boolean;
    }>;
}

interface ImportResult {
    success: boolean;
    job_id: string;
    success_count?: number;
    failed: number;
    updated: number;
    duplicates_skipped: number;
    total: number;
    errors: string[];
}

interface ImportConfirmationResponse {
    success: boolean;
    requires_confirmation: boolean;
    message: string;
    job_id: string;
    validation: ValidationResult;
}

interface ImportJob {
    id: string;
    module: string;
    status: string;
    filename: string;
    total_rows: number;
    successful_rows: number;
    failed_rows: number;
    created_at: string;
    created_by: string | null;
}

const DataMigration: React.FC = () => {
    // State
    const [modules, setModules] = useState<ModuleInfo[]>([]);
    const [selectedModule, setSelectedModule] = useState<string>('');
    const [moduleFields, setModuleFields] = useState<ModuleFields | null>(null);
    const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cardFileInputRef = useRef<HTMLInputElement>(null);
    const [pendingModuleForUpload, setPendingModuleForUpload] = useState<string | null>(null);

    // Validation state
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Import state
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [updateExisting, setUpdateExisting] = useState(false);
    const [requiresConfirmation, setRequiresConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

    // History state
    const [importHistory, setImportHistory] = useState<ImportJob[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Field info expansion
    const [showFieldInfo, setShowFieldInfo] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // Backup state
    const [backupProgress, setBackupProgress] = useState<number>(0);
    const [creatingBackup, setCreatingBackup] = useState(false);

    // Load modules on mount
    useEffect(() => {
        loadModules();
    }, []);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // If coming back from preview/import, show result banner
        const navState: any = location?.state || {};
        if (navState.uploadResult) {
            setImportResult(navState.uploadResult);
        }
    }, [location?.state]);

    // Load fields when module changes
    useEffect(() => {
        if (selectedModule) {
            loadModuleFields(selectedModule);
        } else {
            setModuleFields(null);
        }
        setRequiresConfirmation(false);
        setConfirmationMessage(null);
    }, [selectedModule]);

    // Load history when tab changes
    useEffect(() => {
        if (activeTab === 'history') {
            loadImportHistory();
        }
    }, [activeTab]);

    // Define the recommended upload order for modules
    const MODULE_UPLOAD_ORDER = [
        // Phase 1: Infrastructure
        'classes', 'subjects',
        // Phase 2: People
        'staff', 'students', 'parents',
        // Phase 3: Connectivity
        'user_accounts', 'student_enrollments', 'student_photos',
        // Phase 4: Financials
        'fee_structures', 'fee_allocations', 'fee_invoices', 'fee_payments', 'fee_discounts',
        // Phase 5: Daily Logs
        'attendance', 'exam_schedule', 'exam_results', 'timetable',
        // Phase 6: Assets
        'library_books', 'library_transactions', 'inventory_items', 'transport', 'hostel_allocations',
        // Phase 7: Administrative
        'idcards', 'certificates_issued', 'helpdesk_tickets', 'lms_courses', 'lms_enrollments', 'payroll_payments', 'finance_journal_entries'
    ];

    const loadModules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/data-management/modules/');
            const fetchedModules = response.data.modules || [];

            // Sort modules according to the recommended upload order
            const sortedModules = fetchedModules.sort((a: ModuleInfo, b: ModuleInfo) => {
                const indexA = MODULE_UPLOAD_ORDER.indexOf(a.name);
                const indexB = MODULE_UPLOAD_ORDER.indexOf(b.name);
                // If not in the order list, put at the end
                const orderA = indexA === -1 ? 999 : indexA;
                const orderB = indexB === -1 ? 999 : indexB;
                return orderA - orderB;
            });

            setModules(sortedModules);
        } catch (err: any) {
            setError('Failed to load modules');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadModuleFields = async (module: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/data-management/modules/${module}/fields/`);
            setModuleFields(response.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadImportHistory = async () => {
        try {
            setLoadingHistory(true);
            const response = await api.get('/data-management/import/history/');
            setImportHistory(response.data.jobs || []);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // File handling
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (file: File, targetModule?: string) => {
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        const moduleToCheck = targetModule || selectedModule;

        // For student_photos module, allow ZIP files with 50MB limit
        if (moduleToCheck === 'student_photos') {
            const validPhotoExtensions = ['.zip'];
            if (!validPhotoExtensions.includes(extension)) {
                setError('For Student Photos, please upload a ZIP file containing images.');
                return;
            }
            if (file.size > 50 * 1024 * 1024) { // 50MB limit for photos
                setError('File too large. Maximum size for photos is 50MB.');
                return;
            }
        } else {
            // Standard data files
            const validExtensions = ['.csv', '.xlsx', '.xls'];
            if (!validExtensions.includes(extension)) {
                setError('Invalid file type. Please upload CSV, XLSX, or XLS file.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File too large. Maximum size is 10MB.');
                return;
            }
        }

        // If upload was triggered from card, select that module
        if (targetModule && targetModule !== selectedModule) {
            setSelectedModule(targetModule);
        }

        setSelectedFile(file);
        setError(null);
        setValidationResult(null);
        setImportResult(null);
        setRequiresConfirmation(false);
        setConfirmationMessage(null);
        setPendingModuleForUpload(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleCardFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && pendingModuleForUpload) {
            handleFileSelect(e.target.files[0], pendingModuleForUpload);
        }
        // Reset the input so the same file can be selected again
        if (cardFileInputRef.current) {
            cardFileInputRef.current.value = '';
        }
    };

    const triggerCardUpload = (moduleName: string) => {
        setPendingModuleForUpload(moduleName);
        if (cardFileInputRef.current) {
            // Set accept attribute based on module type
            cardFileInputRef.current.accept = moduleName === 'student_photos' ? '.zip' : '.csv,.xlsx,.xls';
            cardFileInputRef.current.click();
        }
    };

    // Get file type hint for a module
    const getModuleFileHint = (moduleName: string) => {
        if (moduleName === 'student_photos') {
            return 'ZIP (max 50MB)';
        }
        return 'CSV, XLSX, XLS (max 10MB)';
    };

    // Download template
    const downloadTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
        if (!selectedModule) return;

        try {
            setLoading(true);
            setError(null);

            const response = await api.get(`/data-management/template/${selectedModule}/`, {
                params: { format },
                responseType: 'blob'
            });

            // Check if response is actually a file or an error
            const contentType = response.headers['content-type'];

            // If it's JSON, it's probably an error response
            if (contentType && contentType.includes('application/json')) {
                // Parse the blob as text to get error message
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                setError(errorData.error || 'Failed to download template');
                return;
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedModule}_import_template.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Download template error:', err);
            try {
                let fields = moduleFields;
                if (!fields) {
                    fields = await fetchModuleFieldsForTemplate(selectedModule);
                    if (fields) {
                        setModuleFields(fields);
                    }
                }

                if (fields) {
                    downloadClientTemplate(format, fields);
                    setError(null);
                    return;
                }
                throw new Error('Template metadata not loaded');
            } catch (fallbackError) {
                // Try to extract error message from blob response
                if (err.response?.data instanceof Blob) {
                    try {
                        const text = await err.response.data.text();
                        const errorData = JSON.parse(text);
                        setError(errorData.error || 'Failed to download template');
                    } catch {
                        setError('Failed to download template. Please check your permissions.');
                    }
                } else {
                    setError(err.response?.data?.error || err.message || 'Failed to download template');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchModuleFieldsForTemplate = async (module: string) => {
        try {
            const response = await api.get(`/data-management/modules/${module}/fields/`);
            return response.data as ModuleFields;
        } catch (fetchError) {
            console.error('Failed to load module fields for template:', fetchError);
            return null;
        }
    };

    const downloadClientTemplate = (format: 'xlsx' | 'csv', fieldsOverride?: ModuleFields) => {
        const fieldsSource = fieldsOverride ?? moduleFields;
        if (!fieldsSource) {
            throw new Error('Template metadata not loaded');
        }

        const allFields = [...fieldsSource.required_fields, ...fieldsSource.optional_fields];
        const headerNames = allFields.map((field) => field.name);
        const sampleValues = allFields.map((field) => field.sample_value || '');
        const requiredNames = fieldsSource.required_fields.map((field) => field.display_name || field.name);
        const optionalNames = fieldsSource.optional_fields.map((field) => field.display_name || field.name);
        const instructionLines = [
            ...(fieldsSource.instructions || []),
            '',
            '✅ REQUIRED FIELDS (must be filled):',
            requiredNames.length ? requiredNames.join(', ') : 'None',
            '⚪ OPTIONAL FIELDS (can be left blank):',
            optionalNames.length ? optionalNames.join(', ') : 'None'
        ];

        if (format === 'xlsx') {
            const wb = XLSX.utils.book_new();
            const dataSheet = XLSX.utils.aoa_to_sheet([
                headerNames,
                sampleValues
            ]);

            // Sanitize sheet title (max 31 chars, remove invalid chars)
            let sheetTitle = fieldsSource.display_name || selectedModule;
            sheetTitle = sheetTitle.substring(0, 31);
            sheetTitle = sheetTitle.replace(/[:\\\/\?\*\[\]]/g, '_');

            XLSX.utils.book_append_sheet(
                wb,
                dataSheet,
                sheetTitle
            );

            const instructionsSheet = XLSX.utils.aoa_to_sheet(
                instructionLines.map((line) => [line])
            );
            XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions');

            XLSX.writeFile(wb, `${selectedModule}_import_template.xlsx`);
            return;
        }

        const escapeCsvValue = (value: string) => {
            const needsQuotes = /[",\n]/.test(value);
            if (!needsQuotes) return value;
            return `"${value.replace(/"/g, '""')}"`;
        };

        const csvLines = [headerNames, sampleValues].map((row) =>
            row.map((cell) => escapeCsvValue(String(cell ?? ''))).join(',')
        );

        const csvContent = `\ufeff${csvLines.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedModule}_import_template.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    // Validate file
    const validateFile = async () => {
        if (!selectedFile || !selectedModule) return;

        try {
            setIsValidating(true);
            setError(null);
            setRequiresConfirmation(false);
            setConfirmationMessage(null);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('module', selectedModule);

            const response = await api.post('/data-management/validate/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = response.data;

            // If server returned a preview, navigate to the import preview route
            const preview = data.preview || data.validation?.preview;
            const duplicates = data.duplicates || data.validation?.duplicates || [];
            if (preview) {
                navigate('/settings/data-management/import-preview', {
                    state: {
                        file: selectedFile,
                        preview,
                        duplicates,
                        module: selectedModule,
                        validationErrors: data.errors || data.validation?.errors || []
                    }
                });
                return;
            }

            setValidationResult(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Validation failed');
        } finally {
            setIsValidating(false);
        }
    };

    // Import file
    const importFile = async (confirmImport = false) => {
        if (!selectedFile || !selectedModule) return;

        try {
            setIsImporting(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('module', selectedModule);
            formData.append('skip_duplicates', skipDuplicates.toString());
            formData.append('update_existing', updateExisting.toString());
            formData.append('confirm_import', confirmImport.toString());

            const response = await api.post('/data-management/import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.requires_confirmation) {
                const confirmation = response.data as ImportConfirmationResponse;
                setRequiresConfirmation(true);
                setConfirmationMessage(confirmation.message || 'Confirmation required to proceed.');
                setValidationResult(confirmation.validation);
                setImportResult(null);
                return;
            }

            setRequiresConfirmation(false);
            setConfirmationMessage(null);
            setImportResult(response.data);

            // Refresh history and clear selection on success
            if (response.data.success) {
                loadImportHistory();

                // Clear file and unselect module after successful upload
                setSelectedFile(null);
                setSelectedModule('');
                setModuleFields(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    // Export data
    const exportData = async (format: 'xlsx' | 'csv' = 'xlsx') => {
        if (!selectedModule) return;

        try {
            setLoading(true);
            const response = await api.get(`/data-management/export/${selectedModule}/`, {
                params: { format },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedModule}_export_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    // Download full backup with progress
    const downloadBackup = async () => {
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
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            setError('Failed to create backup');
        } finally {
            setCreatingBackup(false);
            setBackupProgress(0);
        }
    };

    // Rollback import
    const rollbackImport = async (jobId: string) => {
        if (!confirm('Are you sure you want to rollback this import? All imported records will be deleted.')) {
            return;
        }

        try {
            setLoading(true);
            await api.post(`/data-management/import/${jobId}/rollback/`);
            loadImportHistory();
        } catch (err: any) {
            setError('Failed to rollback import');
        } finally {
            setLoading(false);
        }
    };

    // Clear selection
    const clearSelection = () => {
        setSelectedFile(null);
        setValidationResult(null);
        setImportResult(null);
        setRequiresConfirmation(false);
        setConfirmationMessage(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get status badge variant
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success"><CheckCircle size={14} /> Completed</Badge>;
            case 'FAILED':
                return <Badge variant="danger"><XCircle size={14} /> Failed</Badge>;
            case 'IMPORTING':
                return <Badge variant="warning"><Loader2 size={14} className="animate-spin" /> Importing</Badge>;
            case 'ROLLED_BACK':
                return <Badge variant="neutral"><RotateCcw size={14} /> Rolled Back</Badge>;
            default:
                return <Badge variant="neutral">{status}</Badge>;
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="data-migration-page">
            <div className="page-header">
                <div className="header-content">
                    <h1><Database size={28} /> Data Management</h1>
                    <p>Import, export, and backup your school data</p>
                </div>
                <div className="header-actions">
                    {creatingBackup && (
                        <div className="backup-progress-inline">
                            <div className="progress-bar-mini">
                                <div className="progress-fill" style={{ width: `${backupProgress}%` }} />
                            </div>
                            <span>{backupProgress}%</span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={downloadBackup}
                        disabled={loading || creatingBackup}
                    >
                        {creatingBackup ? (
                            <><RefreshCw size={18} className="animate-spin" /> Creating...</>
                        ) : (
                            <><Archive size={18} /> Full Backup</>
                        )}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}

            {importResult ? (() => {
                const successCount = typeof importResult.success === 'number'
                    ? importResult.success
                    : (importResult.success_count || 0);
                const failedCount = importResult.failed || 0;
                const hasErrors = failedCount > 0 || (importResult.errors?.length || 0) > 0;
                return (
                    <div className={hasErrors ? 'error-banner' : 'success-banner'}>
                        {hasErrors ? <XCircle size={20} /> : <CheckCircle size={20} />}
                        <span>
                            {hasErrors
                                ? `Import completed with errors. ${successCount} succeeded, ${failedCount} failed.`
                                : `Import completed successfully. ${successCount} records imported.`}
                        </span>
                        <button onClick={() => setImportResult(null)}><X size={16} /></button>
                    </div>
                );
            })() : null}

            {(() => {
                const errors = importResult?.errors ?? [];
                if (errors.length === 0) return null;
                return (
                    <div className="error-list">
                        <h5>Import Errors</h5>
                        <ul>
                            {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                );
            })()}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'import' ? 'active' : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload size={18} /> Import Data
                </button>
                <button
                    className={`tab ${activeTab === 'export' ? 'active' : ''}`}
                    onClick={() => setActiveTab('export')}
                >
                    <Download size={18} /> Export Data
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <Clock size={18} /> Import History
                </button>
            </div>

            {/* Import Tab */}
            {activeTab === 'import' && (
                <div className="import-section">
                    {/* Step 1: Select Module */}
                    <Card className="step-card">
                        <div className="step-header">
                            <span className="step-number">1</span>
                            <h3>Select Module</h3>
                        </div>
                        {/* Hidden file input for card-level uploads */}
                        <input
                            ref={cardFileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls,.zip"
                            onChange={handleCardFileInputChange}
                            hidden
                        />
                        <div className="module-grid">
                            {modules.map((module) => {
                                const isSelected = selectedModule === module.name;
                                const hasFile = isSelected && selectedFile;

                                return (
                                        <div
                                            key={module.name}
                                            className={`module-card ${isSelected ? 'selected' : ''} ${hasFile ? 'has-file' : ''}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                setSelectedModule(module.name);
                                                clearSelection();
                                            }}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedModule(module.name); clearSelection(); } }}
                                        >
                                        <div className="module-icon">
                                            {MODULE_ICONS[module.name] || <FileText size={20} />}
                                        </div>
                                        <div className="module-info">
                                            <span className="module-name">{module.display_name}</span>
                                            <span className="module-fields">
                                                {module.required_field_count} required • {module.optional_field_count} optional
                                            </span>
                                            <span className="module-file-hint">
                                                {getModuleFileHint(module.name)}
                                            </span>
                                            {/* Show selected file info */}
                                            {hasFile && (
                                                <span className="module-selected-file">
                                                    <FileSpreadsheet size={12} />
                                                    {selectedFile.name.length > 20
                                                        ? selectedFile.name.substring(0, 17) + '...'
                                                        : selectedFile.name}
                                                    <span className="file-size-badge">
                                                        {(selectedFile.size / 1024).toFixed(0)} KB
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        {module.unique_field && (
                                            <span className="unique-badge">
                                                Key: {module.unique_field}
                                            </span>
                                        )}

                                        {/* Overlay CTAs (appear on hover) - different when file is selected */}
                                        <div className="card-overlay" role="group" aria-hidden>
                                            {hasFile ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="overlay-btn import"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            validateFile();
                                                        }}
                                                        disabled={isValidating}
                                                    >
                                                        {isValidating ? (
                                                            <><Loader2 size={14} className="animate-spin" /> Validating...</>
                                                        ) : (
                                                            <><Eye size={14} /> Validate & Preview</>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="overlay-btn secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            clearSelection();
                                                        }}
                                                    >
                                                        <X size={14} /> Clear
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="overlay-btn upload"
                                                        onClick={(e) => { e.stopPropagation(); triggerCardUpload(module.name); }}
                                                    >
                                                        <Upload size={14} /> Upload
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="overlay-btn"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedModule(module.name); loadModuleFields(module.name); downloadTemplate('xlsx'); }}
                                                    >
                                                        <Download size={14} /> Template
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="overlay-btn secondary"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedModule(module.name); setShowFieldInfo(true); }}
                                                    >
                                                        <Eye size={14} /> Info
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        </div>
                                );
                            })}
                        </div>
                    </Card>

                    {selectedModule && moduleFields && (
                        <>
                            {/* Step 2: Download Template */}
                            <Card className="step-card">
                                <div className="step-header">
                                    <span className="step-number">2</span>
                                    <h3>Download Template</h3>
                                </div>
                                <p className="step-description">
                                    Download the import template, fill in your data, and upload it in Step 3.
                                </p>
                                <div className="template-actions">
                                    <Button
                                        variant="primary"
                                        onClick={() => downloadTemplate('xlsx')}
                                        disabled={loading}
                                    >
                                        <Download size={18} />
                                        Download Excel Template
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadTemplate('csv')}
                                        disabled={loading}
                                    >
                                        <Download size={18} />
                                        Download CSV Template
                                    </Button>
                                </div>

                                {/* Field Information Toggle */}
                                <button
                                    className="info-toggle"
                                    onClick={() => setShowFieldInfo(!showFieldInfo)}
                                >
                                    {showFieldInfo ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    View Field Specifications ({moduleFields.required_fields.length} required, {moduleFields.optional_fields.length} optional)
                                </button>

                                {showFieldInfo && (
                                    <div className="field-info">
                                        <h4>Required Fields</h4>
                                        <div className="field-table">
                                            <div className="field-row header">
                                                <span>Field</span>
                                                <span>Type</span>
                                                <span>Description</span>
                                                <span>Sample</span>
                                            </div>
                                            {moduleFields.required_fields.map((field) => (
                                                <div key={field.name} className="field-row">
                                                    <span className="field-name">{field.display_name}</span>
                                                    <span className="field-type">{field.type}</span>
                                                    <span className="field-desc">{field.description}</span>
                                                    <span className="field-sample">{field.sample_value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {moduleFields.optional_fields.length > 0 && (
                                            <>
                                                <h4>Optional Fields</h4>
                                                <div className="field-table optional">
                                                    <div className="field-row header">
                                                        <span>Field</span>
                                                        <span>Type</span>
                                                        <span>Description</span>
                                                        <span>Sample</span>
                                                    </div>
                                                    {moduleFields.optional_fields.map((field) => (
                                                        <div key={field.name} className="field-row">
                                                            <span className="field-name">{field.display_name}</span>
                                                            <span className="field-type">{field.type}</span>
                                                            <span className="field-desc">{field.description}</span>
                                                            <span className="field-sample">{field.sample_value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Instructions Toggle */}
                                {moduleFields.instructions && moduleFields.instructions.length > 0 && (
                                    <>
                                        <button
                                            className="info-toggle"
                                            onClick={() => setShowInstructions(!showInstructions)}
                                        >
                                            {showInstructions ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            <HelpCircle size={16} /> View Instructions
                                        </button>

                                        {showInstructions && (
                                            <div className="instructions-box">
                                                {moduleFields.instructions.map((line, idx) => (
                                                    <p key={idx}>{line}</p>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card>

                            {/* Step 3: Upload File */}
                            <Card className="step-card">
                                <div className="step-header">
                                    <span className="step-number">3</span>
                                    <h3>Upload File</h3>
                                </div>

                                <div
                                    className={`drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={selectedModule === 'student_photos' ? '.zip' : '.csv,.xlsx,.xls'}
                                        onChange={handleFileInputChange}
                                        hidden
                                    />

                                    {selectedFile ? (
                                        <div className="file-selected">
                                            <FileSpreadsheet size={40} />
                                            <div className="file-info">
                                                <span className="file-name">{selectedFile.name}</span>
                                                <span className="file-size">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            <button
                                                className="remove-file"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearSelection();
                                                }}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="drop-content">
                                            <Upload size={40} />
                                            <p>Drag and drop your file here, or click to browse</p>
                                            <span className="formats">
                                                {selectedModule === 'student_photos'
                                                    ? 'Upload ZIP file containing photos named by admission number (max 50MB)'
                                                    : 'Supports CSV, XLSX, XLS (max 10MB)'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {selectedFile && !validationResult && !importResult && (
                                    <div className="upload-actions">
                                        <Button
                                            variant="primary"
                                            onClick={validateFile}
                                            disabled={isValidating}
                                        >
                                            {isValidating ? (
                                                <><Loader2 size={18} className="animate-spin" /> Validating...</>
                                            ) : (
                                                <><Eye size={18} /> Validate & Preview</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            {/* Validation Results */}
                            {validationResult && !importResult && (
                                <Card className={`step-card validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                                    <div className="step-header">
                                        <span className="step-number">4</span>
                                        <h3>Validation Results</h3>
                                        {validationResult.valid ? (
                                            <Badge variant="success"><CheckCircle size={14} /> Ready to Import</Badge>
                                        ) : (
                                            <Badge variant="danger"><XCircle size={14} /> Has Errors</Badge>
                                        )}
                                    </div>

                                    {validationResult && validationResult.error_count > 0 && (
                                        <div className="error-banner validation-block">
                                            <XCircle size={18} />
                                            <span>{confirmationMessage || 'Validation errors detected. Fix the file before importing.'}</span>
                                        </div>
                                    )}

                                    {requiresConfirmation && validationResult && validationResult.error_count === 0 && (
                                        <div className="warning-banner">
                                            <AlertTriangle size={18} />
                                            <span>{confirmationMessage || 'Duplicates or warnings detected. Confirm to proceed.'}</span>
                                        </div>
                                    )}

                                    <div className="validation-summary">
                                        <div className="stat">
                                            <span className="stat-value">{validationResult.total_rows}</span>
                                            <span className="stat-label">Total Rows</span>
                                        </div>
                                        <div className="stat error">
                                            <span className="stat-value">{validationResult.error_count}</span>
                                            <span className="stat-label">Errors</span>
                                        </div>
                                        <div className="stat warning">
                                            <span className="stat-value">{validationResult.duplicate_count}</span>
                                            <span className="stat-label">Duplicates</span>
                                        </div>
                                    </div>

                                    {/* Preview Table */}
                                    {validationResult.preview && validationResult.preview.length > 0 && (
                                        <div className="preview-section">
                                            <h4>Data Preview (First {validationResult.preview.length} rows)</h4>
                                            <div className="preview-table-wrapper">
                                                <table className="preview-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Row</th>
                                                            {Object.keys(validationResult.preview[0].data).slice(0, 6).map((key) => (
                                                                <th key={key}>{key}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {validationResult.preview.map((row) => (
                                                            <tr key={row.row_number} className={row.has_errors ? 'has-error' : ''}>
                                                                <td>{row.row_number}</td>
                                                                {Object.values(row.data).slice(0, 6).map((value, idx) => (
                                                                    <td key={idx}>{value}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Errors */}
                                    {validationResult.errors.length > 0 && (
                                        <div className="errors-section">
                                            <h4><XCircle size={16} /> Validation Errors</h4>
                                            <ul className="error-list">
                                                {validationResult.errors.map((err, idx) => (
                                                    <li key={idx}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Duplicates */}
                                    {validationResult.duplicates.length > 0 && (
                                        <div className="duplicates-section">
                                            <h4><AlertTriangle size={16} /> Duplicates Found</h4>
                                            <ul className="duplicate-list">
                                                {validationResult.duplicates.map((dup, idx) => (
                                                    <li key={idx}>
                                                        Row {dup.row}: {dup.field} = "{dup.value}"
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Import Options */}
                                    <div className="import-options">
                                        <h4>Import Options</h4>
                                        <label className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={skipDuplicates}
                                                onChange={(e) => {
                                                    setSkipDuplicates(e.target.checked);
                                                    setRequiresConfirmation(false);
                                                    setConfirmationMessage(null);
                                                }}
                                            />
                                            <span>Skip duplicate records</span>
                                        </label>
                                        <label className="checkbox-option">
                                            <input
                                                type="checkbox"
                                                checked={updateExisting}
                                                onChange={(e) => {
                                                    setUpdateExisting(e.target.checked);
                                                    setRequiresConfirmation(false);
                                                    setConfirmationMessage(null);
                                                }}
                                            />
                                            <span>Update existing records (instead of skipping)</span>
                                        </label>
                                    </div>

                                    <div className="validation-actions">
                                        <Button variant="outline" onClick={clearSelection}>
                                            <RefreshCw size={18} /> Start Over
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={() => importFile(false)}
                                            disabled={isImporting || (validationResult && validationResult.error_count > 0)}
                                        >
                                            {isImporting ? (
                                                <><Loader2 size={18} className="animate-spin" /> Importing...</>
                                            ) : (
                                                <><Upload size={18} /> Start Import</>
                                            )}
                                        </Button>
                                        {requiresConfirmation && (
                                            <Button
                                                variant="danger"
                                                onClick={() => importFile(true)}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Importing...</>
                                                ) : (
                                                    <><AlertTriangle size={18} /> Confirm Import</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Import Results */}
                            {importResult && (
                                <Card className="step-card import-result">
                                    <div className="step-header">
                                        <CheckCircle size={24} className="success-icon" />
                                        <h3>Import Complete!</h3>
                                    </div>

                                    <div className="import-summary">
                                        <div className="stat success">
                                            <span className="stat-value">{importResult.success_count || importResult.total - importResult.failed}</span>
                                            <span className="stat-label">Imported</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{importResult.updated}</span>
                                            <span className="stat-label">Updated</span>
                                        </div>
                                        <div className="stat warning">
                                            <span className="stat-value">{importResult.duplicates_skipped}</span>
                                            <span className="stat-label">Skipped</span>
                                        </div>
                                        <div className="stat error">
                                            <span className="stat-value">{importResult.failed}</span>
                                            <span className="stat-label">Failed</span>
                                        </div>
                                    </div>

                                    {(() => {
                                        const errors = importResult?.errors ?? [];
                                        if (errors.length === 0) return null;
                                        return (
                                            <div className="errors-section">
                                                <h4>Errors ({errors.length})</h4>
                                                <ul className="error-list">
                                                    {errors.slice(0, 10).map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                    {errors.length > 10 && (
                                                        <li className="more">...and {errors.length - 10} more</li>
                                                    )}
                                                </ul>
                                            </div>
                                        );
                                    })()}

                                    <div className="result-actions">
                                        <Button variant="primary" onClick={clearSelection}>
                                            <Upload size={18} /> Import More Data
                                        </Button>
                                        <Button variant="outline" onClick={() => setActiveTab('history')}>
                                            <Clock size={18} /> View History
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
                <div className="export-section">
                    <Card className="step-card">
                        <h3>Export Data</h3>
                        <p className="step-description">
                            Export your school data to Excel or CSV format for backup or migration.
                        </p>

                        <div className="export-module-select">
                            <label>Select Module to Export</label>
                            <div className="module-grid">
                                {modules.map((module) => (
                                    <button
                                        key={module.name}
                                        className={`module-card ${selectedModule === module.name ? 'selected' : ''}`}
                                        onClick={() => setSelectedModule(module.name)}
                                    >
                                        <div className="module-icon">
                                            {MODULE_ICONS[module.name] || <FileText size={20} />}
                                        </div>
                                        <span className="module-name">{module.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedModule && (
                            <div className="export-actions">
                                <Button
                                    variant="primary"
                                    onClick={() => exportData('xlsx')}
                                    disabled={loading}
                                >
                                    <Download size={18} />
                                    Export as Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => exportData('csv')}
                                    disabled={loading}
                                >
                                    <Download size={18} />
                                    Export as CSV
                                </Button>
                            </div>
                        )}
                    </Card>

                    <Card className="step-card">
                        <h3><Archive size={20} /> Full Backup</h3>
                        <p className="step-description">
                            Download a complete backup of all your school data in a ZIP file containing CSV exports of all modules.
                        </p>
                        <Button
                            variant="primary"
                            onClick={downloadBackup}
                            disabled={loading}
                        >
                            <Archive size={18} />
                            Download Full Backup
                        </Button>
                    </Card>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="history-section">
                    <Card className="step-card">
                        <div className="history-header">
                            <h3>Import History</h3>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={loadImportHistory}
                                disabled={loadingHistory}
                            >
                                <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
                                Refresh
                            </Button>
                        </div>

                        {loadingHistory ? (
                            <div className="loading-state">
                                <Loader2 size={32} className="animate-spin" />
                                <p>Loading history...</p>
                            </div>
                        ) : importHistory.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={48} />
                                <p>No import history yet</p>
                                <span>Your import jobs will appear here</span>
                            </div>
                        ) : (
                            <div className="history-table-wrapper">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Module</th>
                                            <th>File</th>
                                            <th>Status</th>
                                            <th>Rows</th>
                                            <th>Success</th>
                                            <th>Failed</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importHistory.map((job) => (
                                            <tr key={job.id}>
                                                <td>
                                                    <div className="module-cell">
                                                        {MODULE_ICONS[job.module] || <FileText size={16} />}
                                                        <span>{job.module}</span>
                                                    </div>
                                                </td>
                                                <td className="filename-cell" title={job.filename}>
                                                    {job.filename}
                                                </td>
                                                <td>{getStatusBadge(job.status)}</td>
                                                <td>{job.total_rows}</td>
                                                <td className="success-cell">{job.successful_rows}</td>
                                                <td className="failed-cell">{job.failed_rows}</td>
                                                <td>{formatDate(job.created_at)}</td>
                                                <td>
                                                    {job.status === 'COMPLETED' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="small"
                                                            onClick={() => rollbackImport(job.id)}
                                                            title="Rollback import"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DataMigration;
