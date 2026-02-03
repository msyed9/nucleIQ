/**
 * Fee Structure Components
 * Refactored sub-components for fee structure management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import {
    FeeStructure,
    FeeCategory,
    GradeLevel,
    AcademicYear,
    FeeStructureFormData,
    FeeStructureModalProps,
    FeeStructureTableProps,
    MONTH_OPTIONS,
    FREQUENCY_OPTIONS,
} from '../types';
import { useInstallmentCalculation } from '../hooks';
import '../Fees.css';
import '../../../components/common/Modal.css';

// ============================================
// Fee Structure Table Component
// ============================================

export const FeeStructureTable: React.FC<FeeStructureTableProps> = ({
    structures,
    loading,
    onEdit,
    onDelete,
    onAdd,
}) => {
    const { t } = useTranslation();

    const formatFrequency = (frequency: string): string => {
        const option = FREQUENCY_OPTIONS.find(f => f.value === frequency);
        return option?.label || frequency;
    };

    const formatAmount = (amount: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(num);
    };

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
                <h3>{t('fees.feeStructure')}</h3>
                <Button variant="primary" onClick={onAdd}>
                    + {t('fees.addStructure')}
                </Button>
            </div>

            {structures.length === 0 ? (
                <div className="empty-state">
                    <p>{t('fees.noStructuresFound')}</p>
                    <Button variant="primary" onClick={onAdd}>
                        {t('fees.createFirstStructure')}
                    </Button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('fees.category')}</th>
                                <th>{t('fees.class')}</th>
                                <th>{t('fees.academicYear')}</th>
                                <th>{t('fees.amount')}</th>
                                <th>{t('fees.frequency')}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {structures.map((structure) => (
                                <tr key={structure.id}>
                                    <td className="font-medium">{structure.category_name}</td>
                                    <td>{structure.class_level_name || '-'}</td>
                                    <td>{structure.academic_year_name || '-'}</td>
                                    <td className="text-amount">
                                        {formatAmount(structure.annual_amount || structure.amount)}
                                    </td>
                                    <td>
                                        <span className="frequency-badge">
                                            {formatFrequency(structure.frequency)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${structure.is_active ? 'status-active' : 'status-inactive'}`}>
                                            {structure.is_active ? t('common.active') : t('common.inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => onEdit(structure)}
                                                title={t('common.edit')}
                                            >
                                                ✏️
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="small"
                                                onClick={() => onDelete(structure.id)}
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
// Fee Structure Modal Component
// ============================================

export const FeeStructureModal: React.FC<FeeStructureModalProps> = ({
    isOpen,
    onClose,
    structure,
    categories,
    gradeLevels,
    academicYears,
    onSubmit,
    loading,
}) => {
    const { t } = useTranslation();
    const installment = useInstallmentCalculation();

    const [formData, setFormData] = useState<FeeStructureFormData>({
        category: '',
        class_level: '',
        academic_year: '',
        annual_amount: '',
        amount: '',
        frequency: 'ANNUAL',
        due_day: 1,
        number_of_terms: 1,
        term_months: { 'Term 1': [4] },
        installment_amounts: {},
        is_mandatory: true,
        is_active: true,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof FeeStructureFormData, string>>>({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            if (structure) {
                setFormData({
                    category: structure.category,
                    class_level: structure.class_level,
                    academic_year: structure.academic_year,
                    annual_amount: structure.annual_amount || structure.amount,
                    amount: structure.amount,
                    frequency: structure.frequency,
                    due_day: structure.due_day,
                    number_of_terms: structure.number_of_terms,
                    term_months: structure.term_months,
                    installment_amounts: structure.installment_amounts || {},
                    is_mandatory: structure.is_mandatory,
                    is_active: structure.is_active,
                });
                installment.reset({
                    annualAmount: structure.annual_amount || structure.amount,
                    frequency: structure.frequency,
                    numberOfTerms: structure.number_of_terms,
                    termMonths: structure.term_months,
                    installmentAmounts: structure.installment_amounts || {},
                });
            } else {
                setFormData({
                    category: '',
                    class_level: '',
                    academic_year: '',
                    annual_amount: '',
                    amount: '',
                    frequency: 'ANNUAL',
                    due_day: 1,
                    number_of_terms: 1,
                    term_months: { 'Term 1': [4] },
                    installment_amounts: {},
                    is_mandatory: true,
                    is_active: true,
                });
                installment.reset();
            }
            setErrors({});
        }
    }, [isOpen, structure, installment]);

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof FeeStructureFormData, string>> = {};

        if (!formData.category) {
            newErrors.category = t('validation.required', { field: t('fees.category') });
        }

        if (!formData.class_level) {
            newErrors.class_level = t('validation.required', { field: t('fees.class') });
        }

        if (!formData.academic_year) {
            newErrors.academic_year = t('validation.required', { field: t('fees.academicYear') });
        }

        if (!installment.annualAmount || parseFloat(installment.annualAmount) <= 0) {
            newErrors.annual_amount = t('validation.positiveNumber', { field: t('fees.amount') });
        }

        if (!installment.isInstallmentTotalValid) {
            newErrors.installment_amounts = t('fees.installmentTotalMismatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        const submitData: FeeStructureFormData = {
            ...formData,
            annual_amount: installment.annualAmount,
            amount: installment.annualAmount,
            number_of_terms: installment.numberOfTerms,
            term_months: installment.termMonths,
            installment_amounts: installment.installmentAmounts,
        };

        try {
            await onSubmit(submitData);
            onClose();
        } catch (error) {
            // Error is handled by parent
        }
    };

    const handleChange = (field: keyof FeeStructureFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{structure ? t('fees.editStructure') : t('fees.addStructure')}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid-3">
                            <div className="form-group">
                                <label htmlFor="structure-category" className="form-label required">
                                    {t('fees.category')}
                                </label>
                                <select
                                    id="structure-category"
                                    className={`form-select ${errors.category ? 'error' : ''}`}
                                    value={formData.category}
                                    onChange={handleChange('category')}
                                >
                                    <option value="">{t('common.select')}</option>
                                    {categories
                                        .filter(c => c.is_active)
                                        .map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                                {errors.category && <span className="form-error">{errors.category}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="structure-class" className="form-label required">
                                    {t('fees.class')}
                                </label>
                                <select
                                    id="structure-class"
                                    className={`form-select ${errors.class_level ? 'error' : ''}`}
                                    value={formData.class_level}
                                    onChange={handleChange('class_level')}
                                >
                                    <option value="">{t('common.select')}</option>
                                    {gradeLevels.map(level => (
                                        <option key={level.id} value={level.id}>
                                            {level.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.class_level && <span className="form-error">{errors.class_level}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="structure-year" className="form-label required">
                                    {t('fees.academicYear')}
                                </label>
                                <select
                                    id="structure-year"
                                    className={`form-select ${errors.academic_year ? 'error' : ''}`}
                                    value={formData.academic_year}
                                    onChange={handleChange('academic_year')}
                                >
                                    <option value="">{t('common.select')}</option>
                                    {academicYears
                                        .filter(y => y.is_active)
                                        .map(year => (
                                            <option key={year.id} value={year.id}>
                                                {year.name}
                                            </option>
                                        ))}
                                </select>
                                {errors.academic_year && <span className="form-error">{errors.academic_year}</span>}
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label htmlFor="structure-amount" className="form-label required">
                                    {t('fees.annualAmount')}
                                </label>
                                <input
                                    id="structure-amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={`form-input ${errors.annual_amount ? 'error' : ''}`}
                                    value={installment.annualAmount}
                                    onChange={(e) => installment.handleAnnualAmountChange(e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.annual_amount && <span className="form-error">{errors.annual_amount}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="structure-frequency" className="form-label required">
                                    {t('fees.frequency')}
                                </label>
                                <select
                                    id="structure-frequency"
                                    className="form-select"
                                    value={installment.frequency}
                                    onChange={(e) => installment.handleFrequencyChange(e.target.value)}
                                >
                                    {FREQUENCY_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Installment Configuration */}
                        {installment.numberOfTerms > 1 && (
                            <div className="installment-section">
                                <h4 className="section-title">{t('fees.installmentConfiguration')}</h4>

                                <div className="installment-grid">
                                    {Object.keys(installment.installmentAmounts).map((termKey, index) => (
                                        <div key={termKey} className="installment-item">
                                            <div className="installment-header">
                                                <span className="term-label">{termKey}</span>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('fees.amount')}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="form-input"
                                                    value={installment.installmentAmounts[termKey] || ''}
                                                    onChange={(e) => installment.handleInstallmentAmountChange(termKey, e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">{t('fees.dueMonth')}</label>
                                                <select
                                                    className="form-select"
                                                    value={installment.termMonths[termKey]?.[0] || ''}
                                                    onChange={(e) => installment.handleTermMonthChange(termKey, parseInt(e.target.value))}
                                                >
                                                    <option value="">{t('common.select')}</option>
                                                    {MONTH_OPTIONS.map(month => (
                                                        <option
                                                            key={month.value}
                                                            value={month.value}
                                                            disabled={installment.isMonthUsedByOtherTerm(month.value, termKey)}
                                                        >
                                                            {month.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="installment-summary">
                                    <span className="summary-label">{t('fees.totalInstallments')}:</span>
                                    <span className={`summary-value ${!installment.isInstallmentTotalValid ? 'error' : ''}`}>
                                        ₹{installment.totalInstallments.toFixed(2)}
                                    </span>
                                    {!installment.isInstallmentTotalValid && (
                                        <span className="summary-warning">
                                            ⚠️ {t('fees.totalDoesNotMatchAnnual')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_mandatory}
                                    onChange={handleChange('is_mandatory')}
                                />
                                <span>{t('fees.mandatory')}</span>
                            </label>

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
                            {structure ? t('common.update') : t('common.create')}
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
    FeeStructureTable,
    FeeStructureModal,
};
