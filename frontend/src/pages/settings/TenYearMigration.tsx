/**
 * 10-Year Data Migration Page
 * Comprehensive migration module for historical school data
 * 
 * NOTE: This page is only accessible to Platform Admins.
 * Tenant Super Admins should not have access to this feature.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import {
    Database,
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    ChevronRight,
    ChevronDown,
    FileSpreadsheet,
    Upload,
    Download,
    RefreshCw,
    Eye,
    Trash2,
    Calendar,
    Layers,
    Filter,
    Search,
    BarChart3,
    ListChecks,
    Settings2,
    ArrowRight,
    Loader2,
    X,
    Info,
    CheckSquare,
    Square,
    AlertCircle,
    ShieldX
} from 'lucide-react';
import { Button, Card, Input, Badge, Select } from '@/design-system';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import './TenYearMigration.css';

// =============================================================================
// TYPES
// =============================================================================

interface MigrationRun {
    id: string;
    run_code: string;
    description: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
    current_phase: string;
    source_system_name: string;
    start_academic_year: string;
    end_academic_year: string;
    total_records: number;
    processed_records: number;
    successful_records: number;
    failed_records: number;
    skipped_records: number;
    progress_percentage: number;
    phase_status: Record<string, any>;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    created_by_email: string | null;
}

interface MigrationSummary {
    total_runs: number;
    active_runs: number;
    completed_runs: number;
    failed_runs: number;
    total_records_migrated: number;
    total_errors: number;
    recent_runs: MigrationRun[];
}

interface AcademicYearBatch {
    id: string;
    academic_year_code: string;
    academic_year_name: string;
    year_sequence: number;
    status: string;
    total_records: number;
    processed_records: number;
    successful_records: number;
    failed_records: number;
    progress_percentage: number;
    started_at: string | null;
    completed_at: string | null;
}

interface CrosswalkEntry {
    id: string;
    entity_type: string;
    entity_type_display: string;
    source_id: string;
    target_id: string | null;
    status: string;
    academic_year_code: string;
    error_message: string | null;
}

interface MigrationError {
    id: string;
    phase: string;
    phase_display: string;
    entity_type: string;
    entity_type_display: string;
    source_id: string;
    error_type: string;
    error_message: string;
    is_resolved: boolean;
    created_at: string;
}

interface QuarantineRecord {
    id: string;
    entity_type: string;
    entity_type_display: string;
    source_id: string;
    reason: string;
    status: string;
    created_at: string;
}

interface EntityScope {
    entity_type: string;
    entity_type_display: string;
    data_scope: string;
    scope_display: string;
    model_path: string;
    migration_order: number;
}

// =============================================================================
// MIGRATION PHASES
// =============================================================================

const MIGRATION_PHASES = [
    { key: 'PREFLIGHT', label: 'Preflight', icon: ListChecks, description: 'Source system analysis' },
    { key: 'STAGING', label: 'Staging', icon: Database, description: 'Create crosswalk tables' },
    { key: 'REFERENCE', label: 'Reference', icon: Layers, description: 'Migrate global data' },
    { key: 'ACADEMIC_CORE', label: 'Academic Years', icon: Calendar, description: 'Setup academic structure' },
    { key: 'TRANSACTIONAL', label: 'Transactional', icon: FileSpreadsheet, description: 'Migrate per-year data' },
    { key: 'RECONCILIATION', label: 'Reconciliation', icon: CheckSquare, description: 'Validate migration' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const TenYearMigration: React.FC = () => {
    // Check if user is platform admin
    const { user } = useAuth();
    const { tenantId } = useParams<{ tenantId?: string }>();
    const isPlatformAdmin = user?.is_platform_admin ?? false;

    // If not platform admin, show access denied
    if (!isPlatformAdmin) {
        return (
            <div className="ten-year-migration-page">
                <div className="access-denied-container">
                    <Card className="access-denied-card">
                        <div className="access-denied-content">
                            <ShieldX size={64} className="access-denied-icon" />
                            <h1>Access Denied</h1>
                            <p>
                                The 10-Year Data Migration feature is only accessible to Platform Administrators.
                            </p>
                            <p className="sub-text">
                                If you believe you should have access to this feature, please contact your platform administrator.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => window.history.back()}
                            >
                                Go Back
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'runs' | 'create' | 'config'>('dashboard');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Summary state
    const [summary, setSummary] = useState<MigrationSummary | null>(null);

    // Runs state
    const [runs, setRuns] = useState<MigrationRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<MigrationRun | null>(null);
    const [runDetailTab, setRunDetailTab] = useState<'phases' | 'years' | 'crosswalk' | 'errors' | 'quarantine'>('phases');

    // Create run state
    const [newRunDescription, setNewRunDescription] = useState('');
    const [sourceSystem, setSourceSystem] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Year batches
    const [yearBatches, setYearBatches] = useState<AcademicYearBatch[]>([]);

    // Crosswalk pagination
    const [crosswalkEntries, setCrosswalkEntries] = useState<CrosswalkEntry[]>([]);
    const [crosswalkPage, setCrosswalkPage] = useState(1);
    const [crosswalkFilter, setCrosswalkFilter] = useState<string>('');

    // Errors
    const [migrationErrors, setMigrationErrors] = useState<MigrationError[]>([]);

    // Quarantine
    const [quarantineRecords, setQuarantineRecords] = useState<QuarantineRecord[]>([]);

    // Entity scopes
    const [entityScopes, setEntityScopes] = useState<EntityScope[]>([]);

    // File upload for preflight
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [entityType, setEntityType] = useState('students');

    // ==========================================================================
    // LOAD DATA
    // ==========================================================================

    useEffect(() => {
        loadSummary();
        loadEntityScopes();
    }, [tenantId]);

    useEffect(() => {
        if (activeTab === 'runs') {
            loadRuns();
        }
    }, [activeTab, tenantId]);

    useEffect(() => {
        if (selectedRun) {
            loadRunDetails(selectedRun.id);
        }
    }, [selectedRun?.id, runDetailTab]);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const params = tenantId ? { tenant: tenantId } : {};
            const response = await api.get('/data-management/migration/summary/', { params });
            setSummary(response.data);
        } catch (err: any) {
            console.error('Failed to load summary:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRuns = async () => {
        try {
            const params = tenantId ? { tenant: tenantId } : {};
            const response = await api.get('/data-management/migration/runs/', { params });
            setRuns(response.data.results || response.data || []);
        } catch (err: any) {
            console.error('Failed to load runs:', err);
        }
    };

    const loadEntityScopes = async () => {
        try {
            const response = await api.get('/data-management/migration/entity-scopes/');
            setEntityScopes(response.data || []);
        } catch (err: any) {
            console.error('Failed to load entity scopes:', err);
        }
    };

    const loadRunDetails = async (runId: string) => {
        try {
            if (runDetailTab === 'years') {
                const response = await api.get(`/data-management/migration/runs/${runId}/year-batches/`);
                setYearBatches(response.data || []);
            } else if (runDetailTab === 'crosswalk') {
                const params: any = { page: crosswalkPage };
                if (crosswalkFilter) params.entity_type = crosswalkFilter;
                const response = await api.get(`/data-management/migration/runs/${runId}/crosswalk/`, { params });
                setCrosswalkEntries(response.data.results || response.data || []);
            } else if (runDetailTab === 'errors') {
                const response = await api.get(`/data-management/migration/runs/${runId}/errors/`);
                setMigrationErrors(response.data.results || response.data || []);
            } else if (runDetailTab === 'quarantine') {
                const response = await api.get(`/data-management/migration/runs/${runId}/quarantine/`);
                setQuarantineRecords(response.data.results || response.data || []);
            }
        } catch (err: any) {
            console.error('Failed to load run details:', err);
        }
    };

    // ==========================================================================
    // CREATE RUN
    // ==========================================================================

    const createMigrationRun = async () => {
        if (!newRunDescription || !sourceSystem) {
            setError('Please provide a description and source system name');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            const payload: any = {
                description: newRunDescription,
                source_system_name: sourceSystem,
                start_academic_year: startYear || null,
                end_academic_year: endYear || null,
                config: {
                    batch_size: 1000,
                    continue_on_error: true,
                    dry_run: false
                }
            };

            if (tenantId) {
                payload.tenant = tenantId;
            }

            const response = await api.post('/data-management/migration/runs/', payload);

            // Reset form
            setNewRunDescription('');
            setSourceSystem('');
            setStartYear('');
            setEndYear('');

            // Select the new run
            setSelectedRun(response.data);
            setActiveTab('runs');
            loadRuns();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create migration run');
        } finally {
            setIsCreating(false);
        }
    };

    // ==========================================================================
    // EXECUTE PHASES
    // ==========================================================================

    const executePhase = async (phase: string) => {
        if (!selectedRun) return;

        try {
            setLoading(true);
            setError(null);

            let endpoint = '';
            let payload: any = {};

            switch (phase) {
                case 'PREFLIGHT':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/preflight/`;
                    if (sourceFile) {
                        const formData = new FormData();
                        formData.append('file', sourceFile);
                        formData.append('entity_type', entityType);
                        const response = await api.post(endpoint, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        break;
                    }
                    payload = { source_data: {} };
                    break;
                case 'STAGING':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/staging/`;
                    if (sourceFile) {
                        const formData = new FormData();
                        formData.append('file', sourceFile);
                        formData.append('entity_type', entityType);
                        const response = await api.post(endpoint, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        break;
                    }
                    payload = { source_data: {} };
                    break;
                case 'REFERENCE':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/reference/`;
                    break;
                case 'ACADEMIC_CORE':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/academic-years/`;
                    break;
                case 'TRANSACTIONAL':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/transactional/`;
                    break;
                case 'RECONCILIATION':
                    endpoint = `/data-management/migration/runs/${selectedRun.id}/reconciliation/`;
                    break;
                default:
                    return;
            }

            const response = await api.post(endpoint, payload);

            // Refresh run details
            const runResponse = await api.get(`/data-management/migration/runs/${selectedRun.id}/`);
            setSelectedRun(runResponse.data);
            loadRuns();

        } catch (err: any) {
            setError(err.response?.data?.error || `Failed to execute ${phase} phase`);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================================================
    // ROLLBACK
    // ==========================================================================

    const rollbackMigration = async (yearCode?: string) => {
        if (!selectedRun) return;

        const confirmMsg = yearCode
            ? `Are you sure you want to rollback the ${yearCode} year? All migrated data for this year will be deleted.`
            : 'Are you sure you want to rollback the ENTIRE migration? ALL migrated data will be deleted.';

        if (!confirm(confirmMsg)) return;

        try {
            setLoading(true);
            setError(null);

            await api.post(`/data-management/migration/runs/${selectedRun.id}/rollback/`, {
                academic_year_code: yearCode || '',
                rollback_all: !yearCode,
                confirm: true
            });

            // Refresh run details
            const runResponse = await api.get(`/data-management/migration/runs/${selectedRun.id}/`);
            setSelectedRun(runResponse.data);
            loadRuns();

        } catch (err: any) {
            setError(err.response?.data?.error || 'Rollback failed');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            PENDING: { variant: 'neutral', icon: Clock },
            RUNNING: { variant: 'warning', icon: Loader2 },
            COMPLETED: { variant: 'success', icon: CheckCircle },
            FAILED: { variant: 'danger', icon: XCircle },
            ROLLED_BACK: { variant: 'neutral', icon: RotateCcw },
            IN_PROGRESS: { variant: 'warning', icon: Loader2 },
            CREATED: { variant: 'success', icon: CheckCircle },
            SKIPPED: { variant: 'neutral', icon: AlertTriangle },
            MAPPED: { variant: 'info', icon: CheckSquare },
        };

        const config = variants[status] || { variant: 'neutral', icon: AlertCircle };
        const Icon = config.icon;

        return (
            <Badge variant={config.variant}>
                <Icon size={14} className={status === 'RUNNING' || status === 'IN_PROGRESS' ? 'animate-spin' : ''} />
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPhaseStatus = (phaseKey: string) => {
        if (!selectedRun?.phase_status) return 'PENDING';
        const status = selectedRun.phase_status[phaseKey];
        return status?.status || 'PENDING';
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <div className="ten-year-migration-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1><Database size={28} /> 10-Year Data Migration</h1>
                    <p>
                        Comprehensive migration module for historical school data
                        {tenantId && <span className="target-tenant-label"> for Tenant: <strong>{tenantId}</strong></span>}
                    </p>
                </div>
                <div className="header-actions">
                    <Button
                        variant="outline"
                        onClick={() => {
                            loadSummary();
                            loadRuns();
                        }}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setActiveTab('create')}
                    >
                        <Play size={18} />
                        New Migration
                    </Button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={16} /></button>
                </div>
            )}

            {/* Tabs */}
            <div className="migration-tabs">
                <button
                    className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <BarChart3 size={18} />
                    Dashboard
                </button>
                <button
                    className={`tab ${activeTab === 'runs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('runs')}
                >
                    <Layers size={18} />
                    Migration Runs
                </button>
                <button
                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    <Play size={18} />
                    New Migration
                </button>
                <button
                    className={`tab ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    <Settings2 size={18} />
                    Configuration
                </button>
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
                <div className="dashboard-tab">
                    {/* Summary Cards */}
                    <div className="summary-grid">
                        <Card className="summary-card">
                            <div className="summary-icon total">
                                <Database size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary?.total_runs || 0}</span>
                                <span className="summary-label">Total Migrations</span>
                            </div>
                        </Card>
                        <Card className="summary-card">
                            <div className="summary-icon active">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary?.active_runs || 0}</span>
                                <span className="summary-label">Active Runs</span>
                            </div>
                        </Card>
                        <Card className="summary-card">
                            <div className="summary-icon success">
                                <CheckCircle size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary?.completed_runs || 0}</span>
                                <span className="summary-label">Completed</span>
                            </div>
                        </Card>
                        <Card className="summary-card">
                            <div className="summary-icon records">
                                <FileSpreadsheet size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">
                                    {(summary?.total_records_migrated || 0).toLocaleString()}
                                </span>
                                <span className="summary-label">Records Migrated</span>
                            </div>
                        </Card>
                        <Card className="summary-card">
                            <div className="summary-icon errors">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="summary-content">
                                <span className="summary-value">{summary?.total_errors || 0}</span>
                                <span className="summary-label">Total Errors</span>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Runs */}
                    <Card className="recent-runs-card">
                        <div className="card-header">
                            <h3>Recent Migration Runs</h3>
                            <Button variant="ghost" onClick={() => setActiveTab('runs')}>
                                View All <ChevronRight size={16} />
                            </Button>
                        </div>
                        <div className="runs-table">
                            <div className="table-header">
                                <span>Run Code</span>
                                <span>Description</span>
                                <span>Status</span>
                                <span>Progress</span>
                                <span>Created</span>
                            </div>
                            {summary?.recent_runs?.map((run) => (
                                <div
                                    key={run.id}
                                    className="table-row clickable"
                                    onClick={() => {
                                        setSelectedRun(run);
                                        setActiveTab('runs');
                                    }}
                                >
                                    <span className="run-code">{run.run_code}</span>
                                    <span className="run-description">{run.description || '-'}</span>
                                    <span>{getStatusBadge(run.status)}</span>
                                    <span>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${run.progress_percentage}%` }}
                                            />
                                        </div>
                                        <span className="progress-text">{run.progress_percentage}%</span>
                                    </span>
                                    <span className="run-date">{formatDate(run.created_at)}</span>
                                </div>
                            ))}
                            {(!summary?.recent_runs || summary.recent_runs.length === 0) && (
                                <div className="empty-state">
                                    <Database size={48} />
                                    <p>No migration runs yet</p>
                                    <Button variant="primary" onClick={() => setActiveTab('create')}>
                                        Start Your First Migration
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Migration Order */}
                    <Card className="migration-order-card">
                        <div className="card-header">
                            <h3>Migration Order (Strict)</h3>
                            <Info size={18} />
                        </div>
                        <div className="order-list">
                            {MIGRATION_PHASES.map((phase, index) => {
                                const Icon = phase.icon;
                                return (
                                    <div key={phase.key} className="order-item">
                                        <span className="order-number">{index + 1}</span>
                                        <Icon size={20} />
                                        <div className="order-info">
                                            <span className="order-label">{phase.label}</span>
                                            <span className="order-description">{phase.description}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}

            {/* Migration Runs Tab */}
            {activeTab === 'runs' && (
                <div className="runs-tab">
                    <div className="runs-layout">
                        {/* Runs List */}
                        <div className="runs-list-panel">
                            <div className="panel-header">
                                <h3>Migration Runs</h3>
                                <Button variant="ghost" size="sm" onClick={loadRuns}>
                                    <RefreshCw size={16} />
                                </Button>
                            </div>
                            <div className="runs-list">
                                {runs.map((run) => (
                                    <div
                                        key={run.id}
                                        className={`run-item ${selectedRun?.id === run.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedRun(run)}
                                    >
                                        <div className="run-item-header">
                                            <span className="run-code">{run.run_code}</span>
                                            {getStatusBadge(run.status)}
                                        </div>
                                        <p className="run-item-description">{run.description || 'No description'}</p>
                                        <div className="run-item-meta">
                                            <span>{run.source_system_name || 'Unknown source'}</span>
                                            <span>{formatDate(run.created_at)}</span>
                                        </div>
                                        <div className="progress-bar small">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${run.progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {runs.length === 0 && (
                                    <div className="empty-state small">
                                        <p>No migration runs found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Run Details */}
                        <div className="run-details-panel">
                            {selectedRun ? (
                                <>
                                    <div className="panel-header">
                                        <div>
                                            <h3>{selectedRun.run_code}</h3>
                                            <p>{selectedRun.description}</p>
                                        </div>
                                        <div className="header-actions">
                                            {getStatusBadge(selectedRun.status)}
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => rollbackMigration()}
                                                disabled={loading || selectedRun.status === 'ROLLED_BACK'}
                                            >
                                                <RotateCcw size={16} />
                                                Rollback All
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Run Stats */}
                                    <div className="run-stats">
                                        <div className="stat">
                                            <span className="stat-value">{selectedRun.total_records.toLocaleString()}</span>
                                            <span className="stat-label">Total Records</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{selectedRun.processed_records.toLocaleString()}</span>
                                            <span className="stat-label">Processed</span>
                                        </div>
                                        <div className="stat success">
                                            <span className="stat-value">{selectedRun.successful_records.toLocaleString()}</span>
                                            <span className="stat-label">Successful</span>
                                        </div>
                                        <div className="stat danger">
                                            <span className="stat-value">{selectedRun.failed_records}</span>
                                            <span className="stat-label">Failed</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{selectedRun.skipped_records}</span>
                                            <span className="stat-label">Skipped</span>
                                        </div>
                                    </div>

                                    {/* Detail Tabs */}
                                    <div className="detail-tabs">
                                        <button
                                            className={runDetailTab === 'phases' ? 'active' : ''}
                                            onClick={() => setRunDetailTab('phases')}
                                        >
                                            <Play size={16} /> Phases
                                        </button>
                                        <button
                                            className={runDetailTab === 'years' ? 'active' : ''}
                                            onClick={() => setRunDetailTab('years')}
                                        >
                                            <Calendar size={16} /> Year Batches
                                        </button>
                                        <button
                                            className={runDetailTab === 'crosswalk' ? 'active' : ''}
                                            onClick={() => setRunDetailTab('crosswalk')}
                                        >
                                            <Layers size={16} /> Crosswalk
                                        </button>
                                        <button
                                            className={runDetailTab === 'errors' ? 'active' : ''}
                                            onClick={() => setRunDetailTab('errors')}
                                        >
                                            <AlertTriangle size={16} /> Errors
                                        </button>
                                        <button
                                            className={runDetailTab === 'quarantine' ? 'active' : ''}
                                            onClick={() => setRunDetailTab('quarantine')}
                                        >
                                            <AlertCircle size={16} /> Quarantine
                                        </button>
                                    </div>

                                    {/* Phases Panel */}
                                    {runDetailTab === 'phases' && (
                                        <div className="phases-panel">
                                            {/* File Upload for Preflight/Staging */}
                                            <Card className="upload-card">
                                                <h4>Source Data File (for Preflight/Staging)</h4>
                                                <div className="upload-row">
                                                    <Select
                                                        value={entityType}
                                                        onChange={(val: string) => setEntityType(val)}
                                                        options={[
                                                            { value: 'students', label: 'Students' },
                                                            { value: 'staff', label: 'Staff' },
                                                            { value: 'enrollments', label: 'Enrollments' },
                                                            { value: 'fees', label: 'Fees' },
                                                            { value: 'attendance', label: 'Attendance' },
                                                        ]}
                                                    />
                                                    <input
                                                        type="file"
                                                        accept=".csv,.xlsx,.xls"
                                                        onChange={(e) => setSourceFile(e.target.files?.[0] || null)}
                                                    />
                                                    {sourceFile && (
                                                        <span className="file-name">{sourceFile.name}</span>
                                                    )}
                                                </div>
                                            </Card>

                                            {/* Phase Cards */}
                                            <div className="phases-grid">
                                                {MIGRATION_PHASES.map((phase, index) => {
                                                    const Icon = phase.icon;
                                                    const status = getPhaseStatus(phase.key);
                                                    const isCompleted = status === 'COMPLETED';
                                                    const isRunning = status === 'RUNNING';
                                                    const canExecute = index === 0 || getPhaseStatus(MIGRATION_PHASES[index - 1].key) === 'COMPLETED';

                                                    return (
                                                        <Card key={phase.key} className={`phase-card ${status.toLowerCase()}`}>
                                                            <div className="phase-header">
                                                                <div className="phase-icon">
                                                                    <Icon size={24} />
                                                                </div>
                                                                <div className="phase-info">
                                                                    <h4>{phase.label}</h4>
                                                                    <p>{phase.description}</p>
                                                                </div>
                                                                {getStatusBadge(status)}
                                                            </div>
                                                            <div className="phase-actions">
                                                                <Button
                                                                    variant={isCompleted ? 'outline' : 'primary'}
                                                                    size="sm"
                                                                    onClick={() => executePhase(phase.key)}
                                                                    disabled={loading || isRunning || !canExecute || selectedRun.status === 'ROLLED_BACK'}
                                                                >
                                                                    {isRunning ? (
                                                                        <><Loader2 size={16} className="animate-spin" /> Running...</>
                                                                    ) : isCompleted ? (
                                                                        <><RefreshCw size={16} /> Re-run</>
                                                                    ) : (
                                                                        <><Play size={16} /> Execute</>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </Card>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Year Batches Panel */}
                                    {runDetailTab === 'years' && (
                                        <div className="years-panel">
                                            <div className="years-grid">
                                                {yearBatches.map((batch) => (
                                                    <Card key={batch.id} className="year-card">
                                                        <div className="year-header">
                                                            <h4>{batch.academic_year_name}</h4>
                                                            {getStatusBadge(batch.status)}
                                                        </div>
                                                        <div className="year-stats">
                                                            <span>Total: {batch.total_records}</span>
                                                            <span>Success: {batch.successful_records}</span>
                                                            <span>Failed: {batch.failed_records}</span>
                                                        </div>
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{ width: `${batch.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                        <div className="year-actions">
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => rollbackMigration(batch.academic_year_code)}
                                                                disabled={loading || batch.status !== 'COMPLETED'}
                                                            >
                                                                <RotateCcw size={14} /> Rollback
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                ))}
                                                {yearBatches.length === 0 && (
                                                    <div className="empty-state">
                                                        <Calendar size={48} />
                                                        <p>No academic year batches yet</p>
                                                        <p className="hint">Run the Academic Years phase to create batches</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Crosswalk Panel */}
                                    {runDetailTab === 'crosswalk' && (
                                        <div className="crosswalk-panel">
                                            <div className="panel-toolbar">
                                                <Select
                                                    value={crosswalkFilter}
                                                    onChange={(val: string) => setCrosswalkFilter(val)}
                                                    options={[
                                                        { value: '', label: 'All Entity Types' },
                                                        ...entityScopes.map(scope => ({
                                                            value: scope.entity_type,
                                                            label: scope.entity_type_display
                                                        }))
                                                    ]}
                                                />
                                                <Button variant="ghost" size="sm" onClick={() => loadRunDetails(selectedRun.id)}>
                                                    <RefreshCw size={16} />
                                                </Button>
                                            </div>
                                            <div className="crosswalk-table">
                                                <div className="table-header">
                                                    <span>Entity Type</span>
                                                    <span>Source ID</span>
                                                    <span>Target ID</span>
                                                    <span>Year</span>
                                                    <span>Status</span>
                                                </div>
                                                {crosswalkEntries.map((entry) => (
                                                    <div key={entry.id} className="table-row">
                                                        <span>{entry.entity_type_display}</span>
                                                        <span className="mono">{entry.source_id}</span>
                                                        <span className="mono">{entry.target_id || '-'}</span>
                                                        <span>{entry.academic_year_code || '-'}</span>
                                                        <span>{getStatusBadge(entry.status)}</span>
                                                    </div>
                                                ))}
                                                {crosswalkEntries.length === 0 && (
                                                    <div className="empty-state">
                                                        <Layers size={48} />
                                                        <p>No crosswalk entries yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Errors Panel */}
                                    {runDetailTab === 'errors' && (
                                        <div className="errors-panel">
                                            <div className="errors-table">
                                                <div className="table-header">
                                                    <span>Phase</span>
                                                    <span>Entity</span>
                                                    <span>Source ID</span>
                                                    <span>Error</span>
                                                    <span>Status</span>
                                                </div>
                                                {migrationErrors.map((err) => (
                                                    <div key={err.id} className="table-row">
                                                        <span>{err.phase_display}</span>
                                                        <span>{err.entity_type_display}</span>
                                                        <span className="mono">{err.source_id}</span>
                                                        <span className="error-msg">{err.error_message}</span>
                                                        <span>
                                                            {err.is_resolved ? (
                                                                <Badge variant="success"><CheckCircle size={14} /> Resolved</Badge>
                                                            ) : (
                                                                <Badge variant="danger"><XCircle size={14} /> Open</Badge>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                                {migrationErrors.length === 0 && (
                                                    <div className="empty-state success">
                                                        <CheckCircle size={48} />
                                                        <p>No errors recorded</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quarantine Panel */}
                                    {runDetailTab === 'quarantine' && (
                                        <div className="quarantine-panel">
                                            <div className="quarantine-table">
                                                <div className="table-header">
                                                    <span>Entity Type</span>
                                                    <span>Source ID</span>
                                                    <span>Reason</span>
                                                    <span>Status</span>
                                                    <span>Created</span>
                                                </div>
                                                {quarantineRecords.map((record) => (
                                                    <div key={record.id} className="table-row">
                                                        <span>{record.entity_type_display}</span>
                                                        <span className="mono">{record.source_id}</span>
                                                        <span className="reason">{record.reason}</span>
                                                        <span>{getStatusBadge(record.status)}</span>
                                                        <span>{formatDate(record.created_at)}</span>
                                                    </div>
                                                ))}
                                                {quarantineRecords.length === 0 && (
                                                    <div className="empty-state success">
                                                        <CheckCircle size={48} />
                                                        <p>No quarantined records</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <Database size={64} />
                                    <h3>Select a Migration Run</h3>
                                    <p>Choose a migration run from the list to view details and execute phases</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
                <div className="create-tab">
                    <Card className="create-card">
                        <h3>Create New Migration Run</h3>
                        <p>Start a new 10-year data migration from a legacy system</p>

                        <div className="form-group">
                            <label>Description *</label>
                            <Input
                                value={newRunDescription}
                                onChange={(e) => setNewRunDescription(e.target.value)}
                                placeholder="e.g., Migration from Legacy ERP System - Phase 1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Source System Name *</label>
                            <Input
                                value={sourceSystem}
                                onChange={(e) => setSourceSystem(e.target.value)}
                                placeholder="e.g., SchoolPro Legacy, Excel Sheets, etc."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Academic Year</label>
                                <Input
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                    placeholder="e.g., 2014-2015"
                                />
                            </div>
                            <div className="form-group">
                                <label>End Academic Year</label>
                                <Input
                                    value={endYear}
                                    onChange={(e) => setEndYear(e.target.value)}
                                    placeholder="e.g., 2023-2024"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button
                                variant="primary"
                                onClick={createMigrationRun}
                                disabled={isCreating || !newRunDescription || !sourceSystem}
                            >
                                {isCreating ? (
                                    <><Loader2 size={18} className="animate-spin" /> Creating...</>
                                ) : (
                                    <><Play size={18} /> Create Migration Run</>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Migration Order Reference */}
                    <Card className="order-reference-card">
                        <h3>Migration Order Reference</h3>
                        <p>Follow this strict order when migrating data:</p>
                        <ol className="order-list">
                            <li>Tenants/Campuses</li>
                            <li>Reference data (subjects, grades, fee heads)</li>
                            <li>People (students, guardians, staff)</li>
                            <li>AcademicYear + Term</li>
                            <li>Class/Section instances per year</li>
                            <li>Enrollments</li>
                            <li>Timetables</li>
                            <li>Attendance</li>
                            <li>Exams + Marks + Reports</li>
                            <li>Fees + Payments</li>
                            <li>Transport/Hostel allocations</li>
                            <li>Communications/logs (optional)</li>
                        </ol>
                    </Card>
                </div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'config' && (
                <div className="config-tab">
                    <Card className="entity-scopes-card">
                        <h3>Entity Scope Configuration</h3>
                        <p>How each entity type is scoped and migrated</p>

                        <div className="scopes-table">
                            <div className="table-header">
                                <span>Entity Type</span>
                                <span>Scope</span>
                                <span>Model</span>
                                <span>Order</span>
                            </div>
                            {entityScopes.map((scope) => (
                                <div key={scope.entity_type} className="table-row">
                                    <span className="entity-type">{scope.entity_type_display}</span>
                                    <span>
                                        <Badge variant={
                                            scope.data_scope === 'GLOBAL' ? 'info' :
                                                scope.data_scope === 'ACADEMIC_YEAR' ? 'warning' :
                                                    scope.data_scope === 'TERM' ? 'success' : 'neutral'
                                        }>
                                            {scope.scope_display}
                                        </Badge>
                                    </span>
                                    <span className="mono">{scope.model_path}</span>
                                    <span>{scope.migration_order}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="notes-card">
                        <h3>Key Design Decisions</h3>
                        <ul>
                            <li><strong>Crosswalk Tables:</strong> Every record maps source_id → target_id for idempotency</li>
                            <li><strong>Per-Year Rollback:</strong> Each academic year can be rolled back independently</li>
                            <li><strong>Continue on Error:</strong> Failed records are quarantined, migration continues</li>
                            <li><strong>Reconciliation:</strong> Automatic count validation and spot checks</li>
                            <li><strong>Audit Trail:</strong> Full tracking of all migration activities</li>
                        </ul>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default TenYearMigration;
