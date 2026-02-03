/**
 * Recruiter Management Page
 * Manage company/recruiter database for placements
 */

import React, { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Search,
    Filter,
    MapPin,
    Globe,
    Mail,
    Phone,
    Briefcase,
    Users,
    Calendar,
    Star,
    StarOff,
    RefreshCw,
    ExternalLink,
    Download
} from 'lucide-react';
import api from '../../services/api';
import './Placement.css';

interface Recruiter {
    id: string;
    company_name: string;
    industry: string;
    website: string;
    description: string;
    logo: string | null;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    is_active: boolean;
    is_featured: boolean;
    drives_count?: number;
    hires_count?: number;
    created_at: string;
}

const industries = [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Government',
    'Non-Profit',
    'Other'
];

const RecruiterManagement: React.FC = () => {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [industryFilter, setIndustryFilter] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [formData, setFormData] = useState({
        company_name: '',
        industry: '',
        website: '',
        description: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        is_active: true,
        is_featured: false
    });

    useEffect(() => {
        fetchRecruiters();
    }, [industryFilter]);

    const fetchRecruiters = async () => {
        try {
            setLoading(true);
            const response = await api.get('/placement/recruiters/', {
                params: {
                    industry: industryFilter || undefined
                }
            });
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setRecruiters(data);
        } catch (error) {
            console.error('Error fetching recruiters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (recruiter?: Recruiter) => {
        if (recruiter) {
            setEditingRecruiter(recruiter);
            setFormData({
                company_name: recruiter.company_name,
                industry: recruiter.industry,
                website: recruiter.website,
                description: recruiter.description,
                contact_person: recruiter.contact_person,
                contact_email: recruiter.contact_email,
                contact_phone: recruiter.contact_phone,
                address: recruiter.address,
                city: recruiter.city,
                is_active: recruiter.is_active,
                is_featured: recruiter.is_featured
            });
        } else {
            setEditingRecruiter(null);
            setFormData({
                company_name: '',
                industry: '',
                website: '',
                description: '',
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                address: '',
                city: '',
                is_active: true,
                is_featured: false
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRecruiter(null);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.company_name.trim()) {
            alert('Company name is required');
            return;
        }

        setSaving(true);
        try {
            if (editingRecruiter) {
                await api.patch(`/placement/recruiters/${editingRecruiter.id}/`, formData);
            } else {
                await api.post('/placement/recruiters/', formData);
            }
            fetchRecruiters();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving recruiter:', error);
            alert('Failed to save recruiter');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this recruiter?')) return;
        try {
            await api.delete(`/placement/recruiters/${id}/`);
            fetchRecruiters();
        } catch (error) {
            console.error('Error deleting recruiter:', error);
            alert('Failed to delete recruiter');
        }
    };

    const toggleFeatured = async (recruiter: Recruiter) => {
        try {
            await api.patch(`/placement/recruiters/${recruiter.id}/`, {
                is_featured: !recruiter.is_featured
            });
            fetchRecruiters();
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    const filteredRecruiters = recruiters.filter(r => {
        const searchLower = searchQuery.toLowerCase();
        return (
            r.company_name.toLowerCase().includes(searchLower) ||
            r.industry.toLowerCase().includes(searchLower) ||
            r.city.toLowerCase().includes(searchLower)
        );
    });

    const getIndustryBadgeColor = (industry: string) => {
        const colors: { [key: string]: string } = {
            'Technology': '#3b82f6',
            'Finance & Banking': '#10b981',
            'Healthcare': '#ef4444',
            'Education': '#8b5cf6',
            'Manufacturing': '#f59e0b',
            'Retail': '#ec4899',
            'Consulting': '#06b6d4',
            'Government': '#6366f1',
            'Non-Profit': '#14b8a6'
        };
        return colors[industry] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="placement-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading recruiters...</p>
            </div>
        );
    }

    return (
        <div className="recruiter-management">
            <div className="page-header">
                <div>
                    <h1>🏢 Recruiter Management</h1>
                    <p>Manage company database for placement drives</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Download size={16} />
                        Export
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} />
                        Add Company
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <Building2 size={24} />
                    <div>
                        <span className="stat-value">{recruiters.length}</span>
                        <span className="stat-label">Total Companies</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Star size={24} />
                    <div>
                        <span className="stat-value">{recruiters.filter(r => r.is_featured).length}</span>
                        <span className="stat-label">Featured</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Briefcase size={24} />
                    <div>
                        <span className="stat-value">{recruiters.reduce((sum, r) => sum + (r.drives_count || 0), 0)}</span>
                        <span className="stat-label">Total Drives</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Users size={24} />
                    <div>
                        <span className="stat-value">{recruiters.reduce((sum, r) => sum + (r.hires_count || 0), 0)}</span>
                        <span className="stat-label">Total Hires</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={industryFilter}
                        onChange={e => setIndustryFilter(e.target.value)}
                    >
                        <option value="">All Industries</option>
                        {industries.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                        ))}
                    </select>
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </button>
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Recruiters Grid/List */}
            {filteredRecruiters.length === 0 ? (
                <div className="empty-state">
                    <Building2 size={48} />
                    <h3>No companies found</h3>
                    <p>Add companies to build your recruiter database</p>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} />
                        Add First Company
                    </button>
                </div>
            ) : (
                <div className={`recruiters-${viewMode}`}>
                    {filteredRecruiters.map(recruiter => (
                        <div
                            key={recruiter.id}
                            className={`recruiter-card ${!recruiter.is_active ? 'inactive' : ''}`}
                        >
                            <div className="card-header">
                                <div className="company-logo">
                                    {recruiter.logo ? (
                                        <img src={recruiter.logo} alt={recruiter.company_name} />
                                    ) : (
                                        <Building2 size={32} />
                                    )}
                                </div>
                                <div className="card-actions">
                                    <button
                                        className={`btn-star ${recruiter.is_featured ? 'featured' : ''}`}
                                        onClick={() => toggleFeatured(recruiter)}
                                        title={recruiter.is_featured ? 'Remove from featured' : 'Mark as featured'}
                                    >
                                        {recruiter.is_featured ? <Star size={16} /> : <StarOff size={16} />}
                                    </button>
                                    <button onClick={() => handleOpenModal(recruiter)}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="danger" onClick={() => handleDelete(recruiter.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="company-name">{recruiter.company_name}</h3>

                            <span
                                className="industry-badge"
                                style={{ backgroundColor: getIndustryBadgeColor(recruiter.industry) }}
                            >
                                {recruiter.industry || 'Other'}
                            </span>

                            <p className="company-description">
                                {recruiter.description || 'No description available'}
                            </p>

                            <div className="contact-info">
                                <div className="contact-item">
                                    <MapPin size={14} />
                                    <span>{recruiter.city || 'Location not specified'}</span>
                                </div>
                                {recruiter.website && (
                                    <div className="contact-item">
                                        <Globe size={14} />
                                        <a href={recruiter.website} target="_blank" rel="noopener noreferrer">
                                            Website <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                                <div className="contact-item">
                                    <Mail size={14} />
                                    <span>{recruiter.contact_email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="card-stats">
                                <div className="mini-stat">
                                    <Briefcase size={14} />
                                    <span>{recruiter.drives_count || 0} Drives</span>
                                </div>
                                <div className="mini-stat">
                                    <Users size={14} />
                                    <span>{recruiter.hires_count || 0} Hires</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingRecruiter ? 'Edit Company' : 'Add Company'}</h2>
                            <button className="btn-close" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-section">
                                    <h3>Company Information</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Company Name *</label>
                                            <input
                                                type="text"
                                                value={formData.company_name}
                                                onChange={e => handleChange('company_name', e.target.value)}
                                                placeholder="e.g., Tech Corp"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Industry</label>
                                            <select
                                                value={formData.industry}
                                                onChange={e => handleChange('industry', e.target.value)}
                                            >
                                                <option value="">Select Industry</option>
                                                {industries.map(ind => (
                                                    <option key={ind} value={ind}>{ind}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={e => handleChange('website', e.target.value)}
                                            placeholder="https://www.example.com"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => handleChange('description', e.target.value)}
                                            placeholder="Brief description of the company..."
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Contact Information</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Contact Person</label>
                                            <input
                                                type="text"
                                                value={formData.contact_person}
                                                onChange={e => handleChange('contact_person', e.target.value)}
                                                placeholder="HR Manager Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={formData.contact_email}
                                                onChange={e => handleChange('contact_email', e.target.value)}
                                                placeholder="hr@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.contact_phone}
                                                onChange={e => handleChange('contact_phone', e.target.value)}
                                                placeholder="+91 9876543210"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={e => handleChange('city', e.target.value)}
                                                placeholder="Mumbai"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => handleChange('address', e.target.value)}
                                            placeholder="Full address"
                                        />
                                    </div>
                                </div>

                                <div className="form-row checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={e => handleChange('is_active', e.target.checked)}
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={e => handleChange('is_featured', e.target.checked)}
                                        />
                                        <span>Featured Company</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <RefreshCw size={16} className="spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingRecruiter ? 'Update' : 'Create'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterManagement;
