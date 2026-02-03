import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { XCircle, CheckCircle, AlertTriangle, Upload, RefreshCw } from 'lucide-react';

const ImportPreview: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state: any = location.state || {};
    const file: File | null = state.file || null;
    const preview: any[] = state.preview || [];
    const duplicates: any[] = state.duplicates || [];
    const validationErrors: string[] = state.validationErrors || [];
    const module: string = state.module || '';

    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [selectedDupRows, setSelectedDupRows] = useState<Set<number>>(new Set());
    const [overriding, setOverriding] = useState(false);

    if (!file || !preview) {
        return (
            <div className="import-preview-page">
                <h2>No preview available</h2>
                <p>Go back to the import page and re-upload the file.</p>
                <button onClick={() => navigate(-1)}>Back</button>
            </div>
        );
    }

    const importNow = async () => {
        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', module);
        formData.append('skip_duplicates', skipDuplicates ? 'true' : 'false');
        // Ask server to confirm import (this will bypass duplicate preview when allowed)
        formData.append('confirm_import', 'true');
        formData.append('update_existing', 'false');

        try {
            const res = await api.post('/data-management/import/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
            // After successful import, navigate back to Data Management page and pass result
            navigate('/settings/data-management', { state: { uploadResult: res.data } });
        } catch (e: any) {
            setResult({ success: 0, failed: 1, errors: [e.response?.data?.error || 'Import failed'] });
        } finally {
            setImporting(false);
        }
    };

    const rowErrorMap = new Map<number, string[]>();
    if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((msg) => {
            const match = msg.match(/Row\s+(\d+)/i);
            if (match) {
                const rowNum = Number(match[1]);
                if (!rowErrorMap.has(rowNum)) {
                    rowErrorMap.set(rowNum, []);
                }
                rowErrorMap.get(rowNum)?.push(msg);
            }
        });
    }

    const duplicateRowSet = new Set<number>(duplicates.map((d: any) => d.row || d.row_number));

    const toggleSelect = (rowNum: number) => {
        const copy = new Set(selectedDupRows);
        if (copy.has(rowNum)) copy.delete(rowNum);
        else copy.add(rowNum);
        setSelectedDupRows(copy);
    };

    const overrideSelected = async () => {
        if (!module) return;
        const rowsToOverride = preview.filter((r: any) => {
            const rowNum = r.row || r.row_number;
            return selectedDupRows.has(rowNum);
        }).map((r: any) => r.data || r);

        if (!rowsToOverride.length) return;

        setOverriding(true);
        try {
            const res = await api.post('/data-management/override-duplicates/', {
                module,
                records: rowsToOverride
            });

            setResult((prev: any) => ({ ...(prev || {}), overrideResult: res.data }));

            // Update preview locally: mark overridden rows as OK
            const newPreview = preview.map((r: any) => {
                const rowNum = r.row || r.row_number;
                if (selectedDupRows.has(rowNum)) {
                    return { ...r, status: 'ok', errors: [], has_errors: false };
                }
                return r;
            });

            // replace navigation state with updated preview so UI refreshes
            navigate(location.pathname, { replace: true, state: { ...state, preview: newPreview } });
            setSelectedDupRows(new Set());
        } catch (e: any) {
            setResult((prev: any) => ({ ...(prev || {}), overrideResult: { success: false, error: e.response?.data?.error || 'Override failed' } }));
        } finally {
            setOverriding(false);
        }
    };

    return (
        <div className="import-preview-page">
            <div className="page-header">
                <h2>Import Preview - {module}</h2>
                <p>Review validation results before importing. Failed rows are highlighted in red.</p>
            </div>

            {validationErrors.length > 0 ? (
                <div className="validation-errors">
                    <h4>Errors found</h4>
                    <ul>
                        {validationErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="validation-success">
                    <h4>All records look good</h4>
                    <p>No validation errors detected. You can proceed to import.</p>
                </div>
            )}

            {duplicates.length > 0 && (
                <div className="duplicates-summary">
                    <h4>Duplicates detected ({duplicates.length})</h4>
                    <div className="duplicates-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Row</th>
                                    <th>Field</th>
                                    <th>Value</th>
                                    <th>Existing ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {duplicates.map((d: any, i: number) => (
                                    <tr key={i}>
                                        <td>{d.row || d.row_number}</td>
                                        <td>{d.field}</td>
                                        <td>{String(d.value ?? '')}</td>
                                        <td>{d.existing_id || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="preview-controls">
                <label>
                    <input type="checkbox" checked={skipDuplicates} onChange={() => setSkipDuplicates(!skipDuplicates)} />
                    Skip duplicates (default)
                </label>

                <div className="actions">
                    <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
                    <button onClick={importNow} className="btn-primary" disabled={importing}>
                        {importing ? (
                            <><RefreshCw size={16} className="spin" /> Importing...</>
                        ) : (
                            <><Upload size={16} /> Import Now</>
                        )}
                    </button>
                </div>
            </div>

            <div className="preview-table">
                <table>
                    <thead>
                        <tr>
                            {duplicateRowSet.size > 0 && <th>Select</th>}
                            <th>Row</th>
                            <th>Status</th>
                            <th>Data (sample)</th>
                            <th>Errors</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.map((r, idx) => {
                            const rowNum = r.row || r.row_number;
                            const hasErrors = r.status === 'failed' || r.has_errors || rowErrorMap.has(rowNum);
                            const isDuplicate = r.status === 'duplicate' || duplicateRowSet.has(rowNum);
                            const status = r.status || (hasErrors ? 'failed' : (isDuplicate ? 'duplicate' : 'ok'));
                            const rowErrors = r.errors || rowErrorMap.get(rowNum) || [];

                            return (
                                <tr key={idx} className={status === 'failed' ? 'row-failed' : (status === 'duplicate' ? 'row-duplicate' : '')}>
                                    {duplicateRowSet.size > 0 && (
                                        <td>
                                            {isDuplicate ? (
                                                <input type="checkbox" checked={selectedDupRows.has(rowNum)} onChange={() => toggleSelect(rowNum)} />
                                            ) : (<em>—</em>)}
                                        </td>
                                    )}
                                    <td>{rowNum}</td>
                                    <td>
                                        {status === 'ok' && <span className="status ok"><CheckCircle size={14} /> OK</span>}
                                        {status === 'duplicate' && <span className="status dup"><AlertTriangle size={14} /> Duplicate</span>}
                                        {status === 'failed' && <span className="status fail"><XCircle size={14} /> Failed</span>}
                                    </td>
                                    <td><pre>{JSON.stringify(r.data, null, 2)}</pre></td>
                                    <td>
                                        {rowErrors.length > 0 ? (
                                            <ul>
                                                {rowErrors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                            </ul>
                                        ) : (<em>—</em>)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {result && (
                <div className="import-result">
                    <h4>Import Result</h4>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}

            {duplicateRowSet.size > 0 && (
                <div className="duplicate-actions">
                    <button className="btn-secondary" onClick={() => setSelectedDupRows(new Set())}>Clear selection</button>
                    <button className="btn-primary" disabled={selectedDupRows.size === 0 || overriding} onClick={overrideSelected}>
                        {overriding ? 'Overriding...' : `Override selected (${selectedDupRows.size})`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImportPreview;
