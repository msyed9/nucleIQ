import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast, ToastContainer } from '@/design-system';
import './Settings.css';

interface AdmissionNumberSettings {
    auto_generate_admission_number: boolean;
    admission_number_format: string;
    admission_number_prefix: string;
    admission_number_sequence: number;
}

const AdmissionNumberConfig: React.FC = () => {
    const { t } = useTranslation();
    const { toasts, removeToast, success, error } = useToast();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<AdmissionNumberSettings>({
        auto_generate_admission_number: false,
        admission_number_format: 'ADM{YEAR}{SEQUENCE:04d}',
        admission_number_prefix: 'ADM',
        admission_number_sequence: 1
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/tenants/settings/');
            setSettings({
                auto_generate_admission_number: response.data.auto_generate_admission_number || false,
                admission_number_format: response.data.admission_number_format || 'ADM{YEAR}{SEQUENCE:04d}',
                admission_number_prefix: response.data.admission_number_prefix || 'ADM',
                admission_number_sequence: response.data.admission_number_sequence || 1
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
            error('Failed to load admission number settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.patch('/tenants/settings/update/', settings);
            success('Admission number settings saved successfully!');
        } catch (err: any) {
            console.error('Error saving settings:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to save settings';
            error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const generatePreview = () => {
        if (!settings.auto_generate_admission_number) return 'N/A (Auto-generation disabled)';

        let preview = settings.admission_number_format;
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        preview = preview.replace('{YEAR}', String(year));
        preview = preview.replace('{YY}', String(year).slice(2));
        preview = preview.replace('{MONTH}', month);
        preview = preview.replace('{PREFIX}', settings.admission_number_prefix || '');

        // Handle sequence formatting
        const sequenceMatch = preview.match(/\{SEQUENCE(?::(\d+)d)?\}/);
        if (sequenceMatch) {
            const padding = sequenceMatch[1] ? parseInt(sequenceMatch[1]) : 0;
            const sequenceStr = String(settings.admission_number_sequence).padStart(padding, '0');
            preview = preview.replace(sequenceMatch[0], sequenceStr);
        }

        return preview;
    };

    if (loading) {
        return (
            <Card>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading settings...</p>
                </div>
            </Card>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <Card>
                <div className="card-header">
                    <h3>📝 Admission Number Configuration</h3>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                        Configure how admission numbers are generated for new students
                    </p>
                </div>

                <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
                    {/* Auto-Generate Toggle */}
                    <div className="form-group">
                        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.auto_generate_admission_number}
                                onChange={(e) => setSettings({ ...settings, auto_generate_admission_number: e.target.checked })}
                                style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500 }}>Auto-Generate Admission Numbers</span>
                        </label>
                        <small style={{ display: 'block', marginLeft: '28px', color: '#666', fontSize: '13px' }}>
                            When enabled, admission numbers will be generated automatically based on the format below.
                            When disabled, manual entry is required.
                        </small>
                    </div>

                    {settings.auto_generate_admission_number && (
                        <>
                            {/* Format Template */}
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label htmlFor="format">
                                    Admission Number Format <span style={{ color: '#ff4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="format"
                                    value={settings.admission_number_format}
                                    onChange={(e) => setSettings({ ...settings, admission_number_format: e.target.value })}
                                    className="form-control"
                                    placeholder="ADM{YEAR}{SEQUENCE:04d}"
                                    required
                                />
                                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    <strong>Available placeholders:</strong>
                                    <br />
                                    • <code>{'{YEAR}'}</code> = Full year (2024)
                                    • <code>{'{YY}'}</code> = Short year (24)
                                    • <code>{'{MONTH}'}</code> = Month (01-12)
                                    <br />
                                    • <code>{'{SEQUENCE}'}</code> = Plain number (1, 2, 3...)
                                    • <code>{'{SEQUENCE:04d}'}</code> = Zero-padded (0001, 0002...)
                                    <br />
                                    • <code>{'{PREFIX}'}</code> = Uses prefix from below
                                    • <code>{'{ACADYEAR}'}</code> = Academic year (2024-25)
                                </small>
                            </div>

                            {/* Prefix */}
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                <div className="form-group">
                                    <label htmlFor="prefix">Prefix (Optional)</label>
                                    <input
                                        type="text"
                                        id="prefix"
                                        value={settings.admission_number_prefix}
                                        onChange={(e) => setSettings({ ...settings, admission_number_prefix: e.target.value })}
                                        className="form-control"
                                        placeholder="ADM"
                                        maxLength={20}
                                    />
                                    <small style={{ color: '#666', fontSize: '12px' }}>
                                        Used with {'{PREFIX}'} placeholder
                                    </small>
                                </div>

                                {/* Current Sequence */}
                                <div className="form-group">
                                    <label htmlFor="sequence">
                                        Current Sequence Number <span style={{ color: '#ff4444' }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="sequence"
                                        value={settings.admission_number_sequence}
                                        onChange={(e) => setSettings({ ...settings, admission_number_sequence: parseInt(e.target.value) || 1 })}
                                        className="form-control"
                                        min={1}
                                        required
                                    />
                                    <small style={{ color: '#666', fontSize: '12px' }}>
                                        Next student will get this number
                                    </small>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Preview (Next Admission Number)</label>
                                <div style={{
                                    background: '#f8f9fa',
                                    border: '2px dashed #dee2e6',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    textAlign: 'center'
                                }}>
                                    <code style={{
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: '#1976D2',
                                        fontFamily: 'monospace'
                                    }}>
                                        {generatePreview()}
                                    </code>
                                    <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                        This is what the next student's admission number will look like
                                    </p>
                                </div>
                            </div>

                            {/* Example Formats */}
                            <div style={{
                                marginTop: '20px',
                                background: '#e3f2fd',
                                border: '1px solid #90caf9',
                                borderRadius: '8px',
                                padding: '12px'
                            }}>
                                <strong style={{ fontSize: '13px', color: '#1565c0' }}>💡 Common Format Examples:</strong>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#333' }}>
                                    • <code>ADM{'{YEAR}{SEQUENCE:04d}'}</code> → ADM20240001
                                    <br />
                                    • <code>{'{YY}/{SEQUENCE:05d}'}</code> → 24/00001
                                    <br />
                                    • <code>STD-{'{MONTH}-{SEQUENCE}'}</code> → STD-01-1
                                    <br />
                                    • <code>{'{PREFIX}{ACADYEAR}{SEQUENCE:03d}'}</code> → ADM2024-25001
                                </div>
                            </div>
                        </>
                    )}

                    {/* Save Button */}
                    <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={fetchSettings}
                            disabled={saving}
                        >
                            🔄 Reset
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                        >
                            💾 {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
};

export default AdmissionNumberConfig;
