import React, { useState, useEffect } from 'react';
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

const TEMPLATES: ModuleTemplate[] = [
    {
        id: 'students',
        name: 'Students',
        icon: Users,
        description: 'Import student data including personal info, class, section, and parent details',
        requiredFields: ['first_name', 'last_name', 'admission_number', 'class_name', 'section_name', 'date_of_birth', 'gender'],
        optionalFields: ['email', 'phone', 'address', 'blood_group', 'father_name', 'mother_name', 'parent_phone', 'parent_email', 'aadhar_number', 'nationality', 'religion', 'caste', 'admission_date'],
        sampleData: [
            ['first_name', 'last_name', 'admission_number', 'class_name', 'section_name', 'date_of_birth', 'gender', 'email', 'phone', 'father_name', 'mother_name', 'parent_phone', 'parent_email', 'blood_group', 'address'],
            ['John', 'Doe', 'STU001', 'Class 10', 'A', '2010-05-15', 'Male', 'john.doe@example.com', '9876543210', 'Robert Doe', 'Mary Doe', '9876543211', 'parent@example.com', 'O+', '123 Main Street']
        ]
    },
    {
        id: 'staff',
        name: 'Staff',
        icon: UserCheck,
        description: 'Import staff data including personal info, department, and designation',
        requiredFields: ['first_name', 'last_name', 'employee_id', 'email', 'department', 'designation', 'date_of_joining'],
        optionalFields: ['phone', 'address', 'blood_group', 'date_of_birth', 'gender', 'qualification', 'experience_years', 'salary', 'bank_account', 'aadhar_number'],
        sampleData: [
            ['first_name', 'last_name', 'employee_id', 'email', 'department', 'designation', 'date_of_joining', 'phone', 'gender', 'qualification'],
            ['Jane', 'Smith', 'EMP001', 'jane.smith@school.com', 'Mathematics', 'Senior Teacher', '2020-06-01', '9876543212', 'Female', 'M.Sc Mathematics']
        ]
    },
    {
        id: 'classes',
        name: 'Classes & Sections',
        icon: GraduationCap,
        description: 'Import class and section structure for academic setup',
        requiredFields: ['class_name', 'section_name'],
        optionalFields: ['class_teacher_email', 'room_number', 'capacity', 'academic_year'],
        sampleData: [
            ['class_name', 'section_name', 'class_teacher_email', 'room_number', 'capacity'],
            ['Class 10', 'A', 'teacher@school.com', '101', '40']
        ]
    },
    {
        id: 'fee_structures',
        name: 'Fee Structures',
        icon: DollarSign,
        description: 'Import fee types, amounts, and payment schedules',
        requiredFields: ['fee_type', 'class_name', 'amount', 'frequency'],
        optionalFields: ['due_day', 'description', 'is_mandatory', 'late_fee_percent', 'academic_year'],
        sampleData: [
            ['fee_type', 'class_name', 'amount', 'frequency', 'due_day', 'description', 'is_mandatory'],
            ['Tuition Fee', 'Class 10', '5000', 'monthly', '10', 'Monthly tuition fee', 'true']
        ]
    },
    {
        id: 'parents',
        name: 'Parents',
        icon: Home,
        description: 'Import parent/guardian information linked to students',
        requiredFields: ['student_admission_number', 'parent_name', 'relationship', 'phone'],
        optionalFields: ['email', 'occupation', 'address', 'alternate_phone', 'workplace'],
        sampleData: [
            ['student_admission_number', 'parent_name', 'relationship', 'phone', 'email', 'occupation'],
            ['STU001', 'Robert Doe', 'Father', '9876543211', 'robert@example.com', 'Engineer']
        ]
    },
    {
        id: 'student_photos',
        name: 'Student Photos',
        icon: Image,
        description: 'Bulk update student photos (ZIP file with photos named by admission number)',
        requiredFields: ['admission_number.jpg or admission_number.png'],
        optionalFields: [],
        sampleData: [
            ['Prepare a ZIP file containing photos named as:'],
            ['STU001.jpg, STU002.png, etc.']
        ]
    },
    {
        id: 'subjects',
        name: 'Subjects',
        icon: Building2,
        description: 'Import subjects for classes',
        requiredFields: ['subject_name', 'subject_code', 'class_name'],
        optionalFields: ['credit_hours', 'teacher_email', 'is_elective', 'max_marks'],
        sampleData: [
            ['subject_name', 'subject_code', 'class_name', 'credit_hours', 'is_elective'],
            ['Mathematics', 'MATH10', 'Class 10', '5', 'false']
        ]
    },
    {
        id: 'fee_allocations',
        name: 'Fee Allocations',
        icon: CreditCard,
        description: 'Assign fee structures to specific students',
        requiredFields: ['student_admission_number', 'fee_type', 'amount'],
        optionalFields: ['discount_percent', 'discount_reason', 'effective_from'],
        sampleData: [
            ['student_admission_number', 'fee_type', 'amount', 'discount_percent', 'discount_reason'],
            ['STU001', 'Tuition Fee', '5000', '10', 'Sibling discount']
        ]
    }
];

const DataManagement: React.FC = () => {
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

    const selectedTemplate = TEMPLATES.find(t => t.id === selectedModule);

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
        const template = TEMPLATES.find(t => t.id === moduleId);
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

    const handleUpload = async () => {
        if (!uploadFile) return;

        setUploading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('module', selectedModule);
        formData.append('skip_duplicates', 'true');

        try {
            const response = await api.post('/data-management/import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const result = response.data;
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

    const overrideDuplicates = async () => {
        const selectedRecords = duplicatesToResolve.filter((_, i) => selectedDuplicates.has(i));

        try {
            const response = await api.post('/data-management/override-duplicates/', {
                module: selectedModule,
                records: selectedRecords
            });

            setShowDuplicateModal(false);
            setDuplicatesToResolve([]);
            setSelectedDuplicates(new Set());

            // Update result
            setUploadResult(prev => prev ? {
                ...prev,
                success: prev.success + response.data.updated,
                duplicates: duplicatesToResolve.filter((_, i) => !selectedDuplicates.has(i))
            } : null);
        } catch (error) {
            console.error('Error overriding duplicates:', error);
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
                    </div>

                    {/* Module Selection */}
                    <div className="module-grid">
                        {TEMPLATES.map(template => {
                            const Icon = template.icon;
                            return (
                                <div
                                    key={template.id}
                                    className={`module-card ${selectedModule === template.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedModule(template.id)}
                                >
                                    <Icon size={24} />
                                    <span>{template.name}</span>
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
                                                Upload & Import
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
                        {TEMPLATES.filter(t => t.id !== 'student_photos').map(template => {
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
                            <button onClick={() => setShowDuplicateModal(false)}>×</button>
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
                                onClick={() => {
                                    setShowDuplicateModal(false);
                                    setDuplicatesToResolve([]);
                                }}
                            >
                                Skip All Duplicates
                            </button>
                            <button
                                className="btn-primary"
                                onClick={overrideDuplicates}
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
