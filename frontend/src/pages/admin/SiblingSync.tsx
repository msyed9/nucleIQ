import React, { useState } from 'react';
import { Button, Card, useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Role codes treated as "Tenant Admin" - kept in sync with IsTenantAdmin.admin_role_codes
// on the backend (backend/core/permissions.py) and Sidebar.tsx's TENANT_ADMIN_ROLES.
const TENANT_ADMIN_ROLES = ['admin', 'super_admin', 'tenant_admin', 'school_admin', 'principal', 'administrator'];

interface SyncStats {
    processed: number;
    groups_found: number;
    linked: number;
    skipped_already_linked: number;
    standalone_assigned: number;
}

interface LastSync {
    timestamp: string;
    status: 'success' | 'error';
    stats?: SyncStats;
    message?: string;
}

const LAST_SYNC_STORAGE_KEY = 'nucleiq.sibling_sync.last_run';

const readLastSync = (): LastSync | null => {
    try {
        const raw = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const SiblingSync: React.FC = () => {
    const { user, isRole } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<LastSync | null>(() => readLastSync());
    const { toasts, removeToast, success, error: showError } = useToast();

    const isTenantAdmin = Boolean(user?.is_platform_admin) || TENANT_ADMIN_ROLES.some(isRole);

    const handleSync = async () => {
        if (!window.confirm(
            'Run a sibling sync now? This scans every active student and re-links families by shared parent phone number.'
        )) {
            return;
        }

        setSyncing(true);
        try {
            const response = await api.post('/students/students/sync_siblings/');
            const stats: SyncStats = response.data;
            const record: LastSync = {
                timestamp: new Date().toISOString(),
                status: 'success',
                stats,
            };
            setLastSync(record);
            localStorage.setItem(LAST_SYNC_STORAGE_KEY, JSON.stringify(record));
            success(
                `Sync complete: ${stats.linked} student(s) relinked across ${stats.groups_found} sibling group(s).`
            );
        } catch (err: any) {
            const message = err.response?.data?.detail || err.response?.data?.message || 'Failed to run sibling sync';
            const record: LastSync = {
                timestamp: new Date().toISOString(),
                status: 'error',
                message,
            };
            setLastSync(record);
            localStorage.setItem(LAST_SYNC_STORAGE_KEY, JSON.stringify(record));
            showError(message);
        } finally {
            setSyncing(false);
        }
    };

    if (!isTenantAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto">
                <Card>
                    <div className="p-6 text-center space-y-2">
                        <h1 className="text-xl font-semibold text-gray-900">Access Restricted</h1>
                        <p className="text-gray-600">
                            Sibling Sync is only available to Tenant Admins. Contact your school administrator if
                            you need this run.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Sibling Sync</h1>
                <p className="text-gray-600">
                    Manually re-scan all active students and group siblings by shared father/mother phone number.
                    Safe to re-run - students already correctly linked are left untouched.
                </p>
            </div>

            <Card>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        This runs for your entire school and may take a moment for large student rolls.
                        You'll see a summary of what changed once it finishes.
                    </p>
                    <div>
                        <Button onClick={handleSync} disabled={syncing} loading={syncing}>
                            {syncing ? 'Syncing...' : 'Trigger Sibling Sync'}
                        </Button>
                    </div>
                </div>
            </Card>

            {lastSync && (
                <Card>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Last Sync</h2>
                            <span
                                className={`text-sm font-medium ${
                                    lastSync.status === 'success' ? 'text-green-700' : 'text-red-700'
                                }`}
                            >
                                {lastSync.status === 'success' ? 'Succeeded' : 'Failed'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            {new Date(lastSync.timestamp).toLocaleString()}
                        </p>

                        {lastSync.status === 'success' && lastSync.stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-sm">
                                <div>
                                    <div className="text-gray-500">Students scanned</div>
                                    <div className="font-semibold text-gray-900">{lastSync.stats.processed}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Sibling groups found</div>
                                    <div className="font-semibold text-gray-900">{lastSync.stats.groups_found}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Students relinked</div>
                                    <div className="font-semibold text-gray-900">{lastSync.stats.linked}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Already up to date</div>
                                    <div className="font-semibold text-gray-900">{lastSync.stats.skipped_already_linked}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Standalone assigned</div>
                                    <div className="font-semibold text-gray-900">{lastSync.stats.standalone_assigned}</div>
                                </div>
                            </div>
                        )}

                        {lastSync.status === 'error' && lastSync.message && (
                            <p className="text-sm text-red-600">{lastSync.message}</p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SiblingSync;
