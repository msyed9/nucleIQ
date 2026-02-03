import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';
import { useIconSet } from '../../contexts/IconSetContext';
import { useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';
import {
    Paintbrush, Eye, Save, RefreshCw, Upload, Trash2,
    Image, Monitor, Smartphone, FileText, LayoutDashboard,
    LogIn, SidebarClose, Info, X, CheckCircle
} from 'lucide-react';
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

interface ImageAsset {
    field: string;
    label: string;
    description: string;
    recommendedSize: string;
    currentUrl: string | null;
    file: File | null;
    preview: string | null;
}

const TenantBranding: React.FC = () => {
    const { t } = useTranslation();
    const { branding, loading, refreshBranding, getSmallLogoUrl, getLargeLogoUrl, getLoginBannerUrl, getDashboardBannerUrl } = useTenantBranding();
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
    const [activePreview, setActivePreview] = useState<'sidebar' | 'login' | 'dashboard'>('sidebar');

    // Image assets state
    const [imageAssets, setImageAssets] = useState<ImageAsset[]>([
        {
            field: 'small_logo',
            label: 'Small Logo',
            description: 'For sidebar and top headers',
            recommendedSize: '160×40px',
            currentUrl: null,
            file: null,
            preview: null
        },
        {
            field: 'large_logo',
            label: 'Large Logo',
            description: 'For login screens, landing pages, and reports',
            recommendedSize: '400×100px or larger',
            currentUrl: null,
            file: null,
            preview: null
        },
        {
            field: 'square_logo',
            label: 'Square Logo',
            description: 'For favicons and profile placeholders',
            recommendedSize: '512×512px',
            currentUrl: null,
            file: null,
            preview: null
        },
        {
            field: 'login_banner',
            label: 'Login Banner',
            description: 'Hero image for the login page',
            recommendedSize: '1920×1080px',
            currentUrl: null,
            file: null,
            preview: null
        },
        {
            field: 'dashboard_banner',
            label: 'Dashboard Banner',
            description: 'Welcome banner for the dashboard',
            recommendedSize: '1200×300px',
            currentUrl: null,
            file: null,
            preview: null
        },
        {
            field: 'report_header',
            label: 'Report Header',
            description: 'Banner for PDFs and receipts',
            recommendedSize: '800×100px',
            currentUrl: null,
            file: null,
            preview: null
        }
    ]);

    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

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

            // Update image asset URLs from branding
            setImageAssets(prev => prev.map(asset => {
                const urlField = `${asset.field}_url` as keyof typeof branding;
                return {
                    ...asset,
                    currentUrl: (branding as any)[urlField] || null
                };
            }));
        }
    }, [branding]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileSelect = (field: string, file: File) => {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);

        setImageAssets(prev => prev.map(asset => {
            if (asset.field === field) {
                // Revoke old preview URL to prevent memory leaks
                if (asset.preview) {
                    URL.revokeObjectURL(asset.preview);
                }
                return {
                    ...asset,
                    file,
                    preview: previewUrl
                };
            }
            return asset;
        }));
    };

    const handleFileInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                error('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                error('File size must be less than 5MB');
                return;
            }
            handleFileSelect(field, file);
        }
    };

    const handleRemoveImage = async (field: string) => {
        const asset = imageAssets.find(a => a.field === field);
        if (!asset) return;

        // If there's a current URL, delete from server
        if (asset.currentUrl) {
            try {
                await api.delete(`/tenants/branding/delete-image/${field}/`);
                success(`${asset.label} removed successfully`);
            } catch (err: any) {
                error(`Failed to remove ${asset.label}`);
                console.error('Error removing image:', err);
            }
        }

        // Clear local state
        setImageAssets(prev => prev.map(a => {
            if (a.field === field) {
                if (a.preview) {
                    URL.revokeObjectURL(a.preview);
                }
                return {
                    ...a,
                    currentUrl: null,
                    file: null,
                    preview: null
                };
            }
            return a;
        }));

        await refreshBranding();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Create FormData for multipart upload
            const formDataToSend = new FormData();

            // Add text fields
            Object.entries(formData).forEach(([key, value]) => {
                formDataToSend.append(key, value);
            });
            formDataToSend.append('icon_set', iconSet);

            // Add image files
            let hasFiles = false;
            imageAssets.forEach(asset => {
                if (asset.file) {
                    formDataToSend.append(asset.field, asset.file);
                    hasFiles = true;
                }
            });

            // Use appropriate content type
            await api.patch('/tenants/branding/update/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            success('Branding updated successfully!');

            // Clear file states after successful upload
            setImageAssets(prev => prev.map(asset => ({
                ...asset,
                file: null,
                preview: null
            })));

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

            // Clear file uploads
            setImageAssets(prev => prev.map(asset => {
                if (asset.preview) {
                    URL.revokeObjectURL(asset.preview);
                }
                const urlField = `${asset.field}_url` as keyof typeof branding;
                return {
                    ...asset,
                    file: null,
                    preview: null,
                    currentUrl: (branding as any)[urlField] || null
                };
            }));
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

    const getAssetPreviewUrl = (asset: ImageAsset): string | null => {
        return asset.preview || asset.currentUrl;
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

                <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 400px' : '1fr', gap: '24px' }}>
                    {/* Branding Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Image Assets Section */}
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Image size={20} />
                                    Logo & Banner Assets
                                </h2>
                                <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Info size={14} />
                                    Max 5MB per image
                                </div>
                            </div>

                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {imageAssets.map(asset => {
                                    const previewUrl = getAssetPreviewUrl(asset);
                                    const hasChanges = asset.file !== null;

                                    return (
                                        <div
                                            key={asset.field}
                                            style={{
                                                border: '2px dashed #ddd',
                                                borderRadius: '12px',
                                                padding: '16px',
                                                backgroundColor: hasChanges ? '#f0fdf4' : '#fafafa',
                                                borderColor: hasChanges ? '#22c55e' : '#ddd',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                                                        {asset.label}
                                                        {hasChanges && (
                                                            <span style={{
                                                                marginLeft: '8px',
                                                                fontSize: '10px',
                                                                backgroundColor: '#22c55e',
                                                                color: 'white',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                NEW
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                                                        {asset.description}
                                                    </p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999' }}>
                                                        Recommended: {asset.recommendedSize}
                                                    </p>
                                                </div>
                                                {previewUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(asset.field)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            cursor: 'pointer',
                                                            padding: '4px'
                                                        }}
                                                        title={`Remove ${asset.label}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Preview */}
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '80px',
                                                    backgroundColor: '#fff',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: '12px',
                                                    border: '1px solid #e5e5e5',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {previewUrl ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt={asset.label}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            objectFit: 'contain'
                                                        }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div style={{ color: '#999', fontSize: '12px' }}>
                                                        No image uploaded
                                                    </div>
                                                )}
                                            </div>

                                            {/* Upload Button */}
                                            <input
                                                ref={el => fileInputRefs.current[asset.field] = el}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileInputChange(asset.field)}
                                                style={{ display: 'none' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRefs.current[asset.field]?.click()}
                                                className="btn btn-outline"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '8px 12px',
                                                    fontSize: '13px'
                                                }}
                                            >
                                                <Upload size={14} />
                                                {previewUrl ? 'Replace Image' : 'Upload Image'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Colors & Typography Section */}
                        <div className="card">
                            <div className="card-header">
                                <h2>Colors & Typography</h2>
                            </div>

                            <form onSubmit={handleSave} className="form" style={{ padding: '20px' }}>
                                {/* Legacy Logo URL */}
                                <div className="form-group">
                                    <label htmlFor="logo_url">Logo URL (Legacy)</label>
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
                                        Used as fallback if no logo is uploaded above
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
                    </div>

                    {/* Live Preview Panel */}
                    {showPreview && (
                        <div className="card" style={{ position: 'sticky', top: '20px', height: 'fit-content' }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Eye size={20} />
                                    Live Preview
                                </h2>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowPreview(false)}
                                    style={{ padding: '4px 8px' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preview Tabs */}
                            <div style={{
                                display: 'flex',
                                borderBottom: '1px solid #e5e5e5',
                                padding: '0 16px'
                            }}>
                                {[
                                    { id: 'sidebar', label: 'Sidebar', icon: SidebarClose },
                                    { id: 'login', label: 'Login', icon: LogIn },
                                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActivePreview(tab.id as any)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '12px 16px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: activePreview === tab.id ? 600 : 400,
                                            color: activePreview === tab.id ? formData.primary_color : '#666',
                                            borderBottom: activePreview === tab.id ? `2px solid ${formData.primary_color}` : '2px solid transparent',
                                            marginBottom: '-1px'
                                        }}
                                    >
                                        <tab.icon size={14} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '20px' }}>
                                {/* Sidebar Preview */}
                                {activePreview === 'sidebar' && (
                                    <div
                                        style={{
                                            backgroundColor: formData.sidebar_color,
                                            padding: '16px',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontFamily: formData.font_family
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                            {(() => {
                                                const smallLogoAsset = imageAssets.find(a => a.field === 'small_logo');
                                                const previewUrl = smallLogoAsset ? getAssetPreviewUrl(smallLogoAsset) : null;

                                                return previewUrl ? (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Logo Preview"
                                                        style={{ height: '32px', maxWidth: '100px', objectFit: 'contain' }}
                                                    />
                                                ) : formData.logo_url ? (
                                                    <img
                                                        src={formData.logo_url}
                                                        alt="Logo Preview"
                                                        style={{ height: '32px', maxWidth: '100px', objectFit: 'contain' }}
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
                                                );
                                            })()}
                                            <span style={{ fontSize: '16px', fontWeight: 600 }}>
                                                {branding?.tenant_name || 'School Name'}
                                            </span>
                                        </div>

                                        {/* Sample menu items */}
                                        {['Dashboard', 'Students', 'Staff', 'Fees'].map((item, i) => (
                                            <div
                                                key={item}
                                                style={{
                                                    padding: '10px 12px',
                                                    borderRadius: '6px',
                                                    backgroundColor: i === 0 ? `${formData.primary_color}20` : 'transparent',
                                                    marginBottom: '4px',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    backgroundColor: i === 0 ? formData.primary_color : 'rgba(255,255,255,0.3)',
                                                    borderRadius: '4px'
                                                }} />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Login Preview */}
                                {activePreview === 'login' && (
                                    <div
                                        style={{
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid #e5e5e5'
                                        }}
                                    >
                                        {/* Banner area */}
                                        <div
                                            style={{
                                                height: '100px',
                                                backgroundColor: formData.primary_color,
                                                backgroundImage: (() => {
                                                    const bannerAsset = imageAssets.find(a => a.field === 'login_banner');
                                                    const url = bannerAsset ? getAssetPreviewUrl(bannerAsset) : null;
                                                    return url ? `url(${url})` : 'none';
                                                })(),
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {(() => {
                                                const largeLogoAsset = imageAssets.find(a => a.field === 'large_logo');
                                                const previewUrl = largeLogoAsset ? getAssetPreviewUrl(largeLogoAsset) : null;

                                                return previewUrl && (
                                                    <img
                                                        src={previewUrl}
                                                        alt="Large Logo"
                                                        style={{
                                                            maxHeight: '60px',
                                                            maxWidth: '200px',
                                                            objectFit: 'contain',
                                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>

                                        {/* Login form preview */}
                                        <div style={{ padding: '20px', backgroundColor: 'white' }}>
                                            <h3 style={{
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                marginBottom: '16px',
                                                fontFamily: formData.font_family
                                            }}>
                                                Welcome to {branding?.tenant_name || 'School'}
                                            </h3>
                                            <div style={{
                                                height: '36px',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '6px',
                                                marginBottom: '12px'
                                            }} />
                                            <div style={{
                                                height: '36px',
                                                backgroundColor: '#f5f5f5',
                                                borderRadius: '6px',
                                                marginBottom: '16px'
                                            }} />
                                            <button
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: formData.primary_color,
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    fontFamily: formData.font_family,
                                                    fontWeight: 500
                                                }}
                                            >
                                                Sign In
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Dashboard Preview */}
                                {activePreview === 'dashboard' && (
                                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
                                        {/* Dashboard banner */}
                                        <div
                                            style={{
                                                height: '80px',
                                                background: (() => {
                                                    const bannerAsset = imageAssets.find(a => a.field === 'dashboard_banner');
                                                    const url = bannerAsset ? getAssetPreviewUrl(bannerAsset) : null;
                                                    return url
                                                        ? `url(${url}) center/cover no-repeat`
                                                        : `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`;
                                                })(),
                                                padding: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: 'white',
                                                fontFamily: formData.font_family
                                            }}
                                        >
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                                    Welcome back!
                                                </h3>
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
                                                    {branding?.tenant_name || 'School'} Dashboard
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats preview */}
                                        <div style={{ padding: '16px', backgroundColor: 'white' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                {['Students', 'Staff', 'Fees', 'Attendance'].map((stat, i) => (
                                                    <div
                                                        key={stat}
                                                        style={{
                                                            padding: '12px',
                                                            backgroundColor: '#f9fafb',
                                                            borderRadius: '8px',
                                                            borderLeft: `3px solid ${formData.primary_color}`
                                                        }}
                                                    >
                                                        <div style={{ fontSize: '11px', color: '#666' }}>{stat}</div>
                                                        <div style={{
                                                            fontSize: '18px',
                                                            fontWeight: 600,
                                                            color: formData.primary_color,
                                                            fontFamily: formData.font_family
                                                        }}>
                                                            {[1250, 85, '₹2.5L', '96%'][i]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Color Swatches */}
                                <div style={{ marginTop: '20px' }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>Color Palette</h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {[
                                            { color: formData.primary_color, label: 'Primary' },
                                            { color: formData.secondary_color, label: 'Secondary' },
                                            { color: formData.sidebar_color, label: 'Sidebar' }
                                        ].map(({ color, label }) => (
                                            <div key={label} style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    backgroundColor: color,
                                                    borderRadius: '8px',
                                                    border: '2px solid #e0e0e0'
                                                }} />
                                                <small style={{ fontSize: '10px', color: '#666', marginTop: '4px', display: 'block' }}>
                                                    {label}
                                                </small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Toggle Preview Button (when hidden) */}
                {!showPreview && (
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            backgroundColor: formData.primary_color,
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    >
                        <Eye size={18} />
                        Show Preview
                    </button>
                )}
            </div>
        </>
    );
};

export default TenantBranding;
