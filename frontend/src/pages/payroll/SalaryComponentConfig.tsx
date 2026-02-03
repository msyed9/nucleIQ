/**
 * Salary Component Configuration Page
 * Manage salary components for payroll
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    DollarSign,
    Percent,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import './Payroll.css';

interface SalaryComponent {
    id: string;
    name: string;
    code: string;
    component_type: 'EARNING' | 'DEDUCTION';
    calculation_type: 'FIXED' | 'PERCENTAGE';
    default_value: number;
    is_taxable: boolean;
    is_active: boolean;
    description: string;
}

const SalaryComponentConfig: React.FC = () => {
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'EARNING' | 'DEDUCTION' | 'ALL'>('ALL');
    const [formData, setFormData] = useState<Partial<SalaryComponent>>({
        name: '',
        code: '',
        component_type: 'EARNING',
        calculation_type: 'FIXED',
        default_value: 0,
        is_taxable: true,
        is_active: true,
        description: ''
    });

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/payroll/components/');
            const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
            setComponents(data);
        } catch (error) {
            console.error('Error fetching salary components:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (component?: SalaryComponent) => {
        if (component) {
            setEditingComponent(component);
            setFormData(component);
        } else {
            setEditingComponent(null);
            setFormData({
                name: '',
                code: '',
                component_type: 'EARNING',
                calculation_type: 'FIXED',
                default_value: 0,
                is_taxable: true,
                is_active: true,
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingComponent(null);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingComponent) {
                await api.patch(`/payroll/components/${editingComponent.id}/`, formData);
            } else {
                await api.post('/payroll/components/', formData);
            }
            fetchComponents();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving salary component:', error);
            alert('Failed to save salary component');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this salary component?')) return;

        try {
            await api.delete(`/payroll/components/${id}/`);
            fetchComponents();
        } catch (error) {
            console.error('Error deleting salary component:', error);
            alert('Failed to delete salary component');
        }
    };

    const toggleActive = async (component: SalaryComponent) => {
        try {
            await api.patch(`/payroll/components/${component.id}/`, {
                is_active: !component.is_active
            });
            fetchComponents();
        } catch (error) {
            console.error('Error toggling component status:', error);
        }
    };

    const filteredComponents = activeTab === 'ALL'
        ? components
        : components.filter(c => c.component_type === activeTab);

    const earnings = components.filter(c => c.component_type === 'EARNING');
    const deductions = components.filter(c => c.component_type === 'DEDUCTION');

    if (loading) {
        return (
            <div className="payroll-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading salary components...</p>
            </div>
        );
    }

    return (
        <div className="payroll-page">
            <div className="payroll-header">
                <div>
                    <h1>💰 Salary Components</h1>
                    <p>Configure earnings and deduction components for salary structures</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    Add Component
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="summary-card earnings">
                    <TrendingUp size={24} />
                    <div>
                        <span className="summary-value">{earnings.length}</span>
                        <span className="summary-label">Earning Components</span>
                    </div>
                </div>
                <div className="summary-card deductions">
                    <TrendingDown size={24} />
                    <div>
                        <span className="summary-value">{deductions.length}</span>
                        <span className="summary-label">Deduction Components</span>
                    </div>
                </div>
                <div className="summary-card total">
                    <DollarSign size={24} />
                    <div>
                        <span className="summary-value">{components.length}</span>
                        <span className="summary-label">Total Components</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={activeTab === 'ALL' ? 'active' : ''}
                    onClick={() => setActiveTab('ALL')}
                >
                    All Components
                </button>
                <button
                    className={activeTab === 'EARNING' ? 'active' : ''}
                    onClick={() => setActiveTab('EARNING')}
                >
                    <TrendingUp size={16} />
                    Earnings
                </button>
                <button
                    className={activeTab === 'DEDUCTION' ? 'active' : ''}
                    onClick={() => setActiveTab('DEDUCTION')}
                >
                    <TrendingDown size={16} />
                    Deductions
                </button>
            </div>

            {/* Components Table */}
            <div className="components-table-container">
                <table className="components-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Calculation</th>
                            <th>Default Value</th>
                            <th>Taxable</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComponents.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-row">
                                    <AlertCircle size={24} />
                                    <span>No components found</span>
                                </td>
                            </tr>
                        ) : (
                            filteredComponents.map(component => (
                                <tr key={component.id} className={!component.is_active ? 'inactive' : ''}>
                                    <td>
                                        <span className="component-code">{component.code}</span>
                                    </td>
                                    <td>
                                        <div className="component-name">
                                            {component.name}
                                            {component.description && (
                                                <small>{component.description}</small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${component.component_type.toLowerCase()}`}>
                                            {component.component_type === 'EARNING' ? (
                                                <><TrendingUp size={14} /> Earning</>
                                            ) : (
                                                <><TrendingDown size={14} /> Deduction</>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="calc-type">
                                            {component.calculation_type === 'FIXED' ? (
                                                <><DollarSign size={14} /> Fixed</>
                                            ) : (
                                                <><Percent size={14} /> Percentage</>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <strong>
                                            {component.calculation_type === 'FIXED'
                                                ? `₹${component.default_value.toLocaleString()}`
                                                : `${component.default_value}%`
                                            }
                                        </strong>
                                    </td>
                                    <td>
                                        {component.is_taxable ? (
                                            <span className="tax-badge taxable">Yes</span>
                                        ) : (
                                            <span className="tax-badge non-taxable">No</span>
                                        )}
                                    </td>
                                    <td>
                                        <label className="toggle-switch small">
                                            <input
                                                type="checkbox"
                                                checked={component.is_active}
                                                onChange={() => toggleActive(component)}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleOpenModal(component)}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleDelete(component.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content component-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingComponent ? 'Edit Component' : 'Add Component'}</h2>
                            <button className="btn-close" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Component Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name || ''}
                                            onChange={e => handleChange('name', e.target.value)}
                                            placeholder="e.g., House Rent Allowance"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Code *</label>
                                        <input
                                            type="text"
                                            value={formData.code || ''}
                                            onChange={e => handleChange('code', e.target.value.toUpperCase())}
                                            placeholder="e.g., HRA"
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Component Type *</label>
                                        <select
                                            value={formData.component_type || 'EARNING'}
                                            onChange={e => handleChange('component_type', e.target.value)}
                                            required
                                        >
                                            <option value="EARNING">Earning</option>
                                            <option value="DEDUCTION">Deduction</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Calculation Type *</label>
                                        <select
                                            value={formData.calculation_type || 'FIXED'}
                                            onChange={e => handleChange('calculation_type', e.target.value)}
                                            required
                                        >
                                            <option value="FIXED">Fixed Amount</option>
                                            <option value="PERCENTAGE">Percentage of Base</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>
                                        Default Value *
                                        {formData.calculation_type === 'PERCENTAGE' ? ' (%)' : ' (₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.default_value || 0}
                                        onChange={e => handleChange('default_value', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description || ''}
                                        onChange={e => handleChange('description', e.target.value)}
                                        placeholder="Component description..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_taxable || false}
                                            onChange={e => handleChange('is_taxable', e.target.checked)}
                                        />
                                        <span>Taxable Component</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active || false}
                                            onChange={e => handleChange('is_active', e.target.checked)}
                                        />
                                        <span>Active</span>
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
                                            {editingComponent ? 'Update' : 'Create'}
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

export default SalaryComponentConfig;
