import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
import { useIconSet } from '../../contexts/IconSetContext';
import { useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';
import { Paintbrush, Eye, Save, RefreshCw } from 'lucide-react';
import IconThemeSelector from '../../components/settings/IconThemeSelector';
import IconSetSelector from '../../components/settings/IconSetSelector';
import { applyIconTheme } from '../../config/iconThemes';
import { IconSetType } from '../../config/iconSets';
import './Settings.css';

interface BrandingForm {
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    sidebar_color: string;
    font_family: string;
    icon_theme: string;
    icon_set: IconSetType;
}

const TenantBranding: React.FC = () => {
    const { t } = useTranslation();
    const { branding, loading, refreshBranding } = useTenantBranding();
    const { iconSet, setIconSet } = useIconSet();
    const { toasts, removeToast, success, error } = useToast();
    const [formData, setFormData] = useState<BrandingForm>({
        logo_url: '',
        primary_color: '#1976D2',
        secondary_color: '#424242',
        sidebar_color: '#263238',
        font_family: 'Inter, sans-serif',
        icon_theme: 'modern_gradient',
        icon_set: 'lucide'
    });
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    useEffect(() => {
        if (branding) {
            setFormData({
                logo_url: branding.logo_url || '',
                primary_color: branding.primary_color || '#1976D2',
                secondary_color: branding.secondary_color || '#424242',
                sidebar_color: branding.sidebar_color || '#263238',
                font_family: branding.font_family || 'Inter, sans-serif',
                icon_theme: branding.icon_theme || 'modern_gradient',
                icon_set: (branding as any).icon_set || 'lucide'
            });
        }
    }, [branding]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.patch('/tenants/branding/update/', {
                ...formData,
                icon_set: iconSet
            });
            success('Branding updated successfully!');
            await refreshBranding();
        } catch (err: any) {
            console.error('Error updating branding:', err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update branding';
            error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (branding) {
            setFormData({
                logo_url: branding.logo_url || '',
                primary_color: branding.primary_color || '#1976D2',
                secondary_color: branding.secondary_color || '#424242',
                sidebar_color: branding.sidebar_color || '#263238',
                font_family: branding.font_family || 'Inter, sans-serif',
                icon_theme: branding.icon_theme || 'modern_gradient',
                icon_set: (branding as any).icon_set || 'lucide'
            });
            const brandingIconSet = (branding as any).icon_set || 'lucide';
            setIconSet(brandingIconSet);
        }
    };

    const handleThemeSelect = (themeId: string) => {
        setFormData(prev => ({
            ...prev,
            icon_theme: themeId
        }));
        // Apply theme immediately for preview
        applyIconTheme(themeId);
    };

    if (loading) {
        return (
            <>
                <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
                <div className="container">
                    <div className="card">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                            <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
                            <p>Loading branding settings...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="container">
                <div className="page-header">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Paintbrush size={28} />
                        Tenant Branding
                    </h1>
                    <p className="page-description">
                        Customize your school's appearance and identity across the platform
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: '24px' }}>
                    {/* Branding Form */}
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2>Branding Settings</h2>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setShowPreview(!showPreview)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Eye size={18} />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="form">
                            {/* Logo URL */}
                            <div className="form-group">
                                <label htmlFor="logo_url">Logo URL</label>
                                <input
                                    type="url"
                                    id="logo_url"
                                    name="logo_url"
                                    value={formData.logo_url}
                                    onChange={handleInputChange}
                                    placeholder="https://example.com/logo.png"
                                    className="form-control"
                                />
                                <small className="form-text" style={{ color: '#666', fontSize: '12px' }}>
                                    Enter a URL to your school logo (PNG, JPG, SVG recommended)
                                </small>
                            </div>

                            {/* Color Inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label htmlFor="primary_color">Primary Color</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            id="primary_color"
                                            name="primary_color"
                                            value={formData.primary_color}
                                            onChange={handleInputChange}
                                            style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                        <input
                                            type="text"
                                            value={formData.primary_color}
                                            onChange={handleInputChange}
                                            name="primary_color"
                                            className="form-control"
                                            placeholder="#1976D2"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="secondary_color">Secondary Color</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="color"
                                            id="secondary_color"
                                            name="secondary_color"
                                            value={formData.secondary_color}
                                            onChange={handleInputChange}
                                            style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                        <input
                                            type="text"
                                            value={formData.secondary_color}
                                            onChange={handleInputChange}
                                            name="secondary_color"
                                            className="form-control"
                                            placeholder="#424242"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="sidebar_color">Sidebar Background Color</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        id="sidebar_color"
                                        name="sidebar_color"
                                        value={formData.sidebar_color}
                                        onChange={handleInputChange}
                                        style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                    <input
                                        type="text"
                                        value={formData.sidebar_color}
                                        onChange={handleInputChange}
                                        name="sidebar_color"
                                        className="form-control"
                                        placeholder="#263238"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="font_family">Font Family</label>
                                <input
                                    type="text"
                                    id="font_family"
                                    name="font_family"
                                    value={formData.font_family}
                                    onChange={handleInputChange}
                                    placeholder="Inter, sans-serif"
                                    className="form-control"
                                />
                                <small className="form-text" style={{ color: '#666', fontSize: '12px' }}>
                                    e.g., Inter, Roboto, Arial, sans-serif
                                </small>
                            </div>

                            {/* Icon Theme Selector (styling) */}
                            <IconThemeSelector
                                selectedTheme={formData.icon_theme}
                                onSelect={handleThemeSelect}
                            />

                            {/* Icon Set Selector (different icon libraries) */}
                            <IconSetSelector
                                selectedIconSet={iconSet}
                                onSelect={(newIconSet) => setIconSet(newIconSet)}
                            />

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleReset}
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <RefreshCw size={18} />
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Save size={18} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Live Preview */}
                    {showPreview && (
                        <div className="card">
                            <div className="card-header">
                                <h2>Preview</h2>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Sidebar Preview */}
                                <div
                                    style={{
                                        backgroundColor: formData.sidebar_color,
                                        padding: '16px',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontFamily: formData.font_family
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {formData.logo_url ? (
                                            <img
                                                src={formData.logo_url}
                                                alt="Logo Preview"
                                                style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                backgroundColor: formData.primary_color,
                                                borderRadius: '4px'
                                            }} />
                                        )}
                                        <span style={{ fontSize: '18px', fontWeight: 600 }}>
                                            {branding?.tenant_name || 'School Name'}
                                        </span>
                                    </div>
                                </div>

                                {/* Color Swatches */}
                                <div>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Color Palette</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                backgroundColor: formData.primary_color,
                                                borderRadius: '8px',
                                                border: '2px solid #e0e0e0'
                                            }} />
                                            <small style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>Primary</small>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                backgroundColor: formData.secondary_color,
                                                borderRadius: '8px',
                                                border: '2px solid #e0e0e0'
                                            }} />
                                            <small style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>Secondary</small>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '60px',
                                                height: '60px',
                                                backgroundColor: formData.sidebar_color,
                                                borderRadius: '8px',
                                                border: '2px solid #e0e0e0'
                                            }} />
                                            <small style={{ fontSize: '11px', color: '#666', marginTop: '4px', display: 'block' }}>Sidebar</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Sample Button */}
                                <div>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Sample Element</h4>
                                    <button
                                        style={{
                                            backgroundColor: formData.primary_color,
                                            color: 'white',
                                            padding: '12px 24px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontFamily: formData.font_family,
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Sample Button
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default TenantBranding;
