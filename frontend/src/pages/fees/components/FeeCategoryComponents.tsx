/**
 * Fee Category Components
 * Refactored sub-components for fee category management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import { FeeCategory, FeeCategoryFormData, FeeCategoryModalProps, FeeCategoryTableProps } from '../types';
import '../Fees.css';
import '../../../components/common/Modal.css';

// ============================================
// Fee Category Table Component
// ============================================

export const FeeCategoryTable: React.FC<FeeCategoryTableProps> = ({
    categories,
    loading,
    onEdit,
    onDelete,
    onAdd,
}) => {
    const { t } = useTranslation();

    if (loading) {
        return (
            <Card>
                <div className="loading-container">
                    <div className="spinner" />
                    <p>{t('common.loading')}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="card-header">
                <h3>{t('fees.categories')}</h3>
                <Button variant="primary" onClick={onAdd}>
                    + {t('fees.addCategory')}
                </Button>
            </div>

            {categories.length === 0 ? (
                <div className="empty-state">
                    <p>{t('fees.noCategoriesFound')}</p>
                    <Button variant="primary" onClick={onAdd}>
                        {t('fees.createFirstCategory')}
                    </Button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('common.name')}</th>
                                <th>{t('common.code')}</th>
                                <th>{t('common.description')}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td className="font-medium">{category.name}</td>
                                    <td>
                                        <code className="code-badge">{category.code}</code>
                                    </td>
                                    <td className="text-muted truncate max-w-xs">
                                        {category.description || '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${category.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {category.is_active ? t('common.active') : t('common.inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => onEdit(category)}
                                                title={t('common.edit')}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => onDelete(category.id)}
                                                title={t('common.delete')}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
};

// ============================================
// Fee Category Modal Component
// ============================================

export const FeeCategoryModal: React.FC<FeeCategoryModalProps> = ({
    isOpen,
    onClose,
    category,
    onSubmit,
    loading,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<FeeCategoryFormData>({
        name: '',
        code: '',
        description: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FeeCategoryFormData, string>>>({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (category) {
                setFormData({
                    name: category.name,
                    code: category.code,
                    description: category.description,
                    is_active: category.is_active,
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                    is_active: true,
                });
            }
            setErrors({});
        }
    }, [isOpen, category]);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FeeCategoryFormData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('validation.required', { field: t('common.name') });
        }

        if (!formData.code.trim()) {
            newErrors.code = t('validation.required', { field: t('common.code') });
        } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
            newErrors.code = t('validation.invalidCode');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            // Error is handled by parent
        }
    };

    const handleChange = (field: keyof FeeCategoryFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error on change
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Auto-uppercase code
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        setFormData(prev => ({ ...prev, code: value }));

        if (errors.code) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.code;
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-medium" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{category ? t('fees.editCategory') : t('fees.addCategory')}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="category-name" className="form-label required">
                                {t('common.name')}
                            </label>
                            <input
                                id="category-name"
                                type="text"
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                value={formData.name}
                                onChange={handleChange('name')}
                                placeholder={t('fees.categoryNamePlaceholder')}
                                autoFocus
                            />
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="category-code" className="form-label required">
                                {t('common.code')}
                            </label>
                            <input
                                id="category-code"
                                type="text"
                                className={`form-input ${errors.code ? 'error' : ''}`}
                                value={formData.code}
                                onChange={handleCodeChange}
                                placeholder="TUITION_FEE"
                                disabled={!!category}
                            />
                            {errors.code && <span className="form-error">{errors.code}</span>}
                            <span className="form-hint">{t('fees.codeHint')}</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="category-description" className="form-label">
                                {t('common.description')}
                            </label>
                            <textarea
                                id="category-description"
                                className="form-textarea"
                                value={formData.description}
                                onChange={handleChange('description')}
                                placeholder={t('fees.categoryDescriptionPlaceholder')}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={handleChange('is_active')}
                                />
                                <span>{t('common.active')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <Button variant="secondary" onClick={onClose} disabled={loading}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="primary" type="submit" loading={loading}>
                            {category ? t('common.update') : t('common.create')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================
// Default Exports
// ============================================

export default {
    FeeCategoryTable,
    FeeCategoryModal,
};
