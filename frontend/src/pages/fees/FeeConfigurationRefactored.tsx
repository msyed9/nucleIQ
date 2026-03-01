/**
 * Fee Configuration - Refactored Main Component
 * Manages Fee Categories, Structures, Allocations, and Discounts
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings,
    Layers,
    UserPlus,
    Percent,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import {
    Tabs,
    PageHeader,
    LoadingSpinner,
} from '../../components/shared/SharedComponents';
import {
    FeeCategoryTable,
    FeeCategoryModal,
    FeeStructureTable,
    FeeStructureModal,
    useFeeData,
    useFeeCRUD,
} from './components';
import { FeeCategory, FeeStructure } from './types';

const FeeConfigurationRefactored: React.FC = () => {
    const { t } = useTranslation();
    const data = useFeeData();
    const crud = useFeeCRUD();

    // Tab State
    const [activeTab, setActiveTab] = useState('categories');

    // Category Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<FeeCategory | null>(null);

    // Structure Modal State
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        data.fetchAll();
    }, [data.fetchAll]);

    // Category Handlers
    const handleAddCategory = () => {
        setSelectedCategory(null);
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: FeeCategory) => {
        setSelectedCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleCategorySubmit = async (formData: any) => {
        try {
            if (selectedCategory) {
                await crud.updateCategory(selectedCategory.id, formData);
            } else {
                await crud.createCategory(formData);
            }
            await data.fetchCategories();
        } catch (error) {
            console.error('Category Submission Error:', error);
            throw error;
        }
    };

    const handleCategoryDelete = async (id: number) => {
        if (window.confirm(t('common.confirmDelete'))) {
            try {
                await crud.deleteCategory(id);
                await data.fetchCategories();
            } catch (error) {
                console.error('Delete Category Error:', error);
            }
        }
    };

    // Structure Handlers
    const handleAddStructure = () => {
        setSelectedStructure(null);
        setIsStructureModalOpen(true);
    };

    const handleEditStructure = (structure: FeeStructure) => {
        setSelectedStructure(structure);
        setIsStructureModalOpen(true);
    };

    const handleStructureSubmit = async (formData: any) => {
        try {
            if (selectedStructure) {
                await crud.updateStructure(selectedStructure.id, formData);
            } else {
                await crud.createStructure(formData);
            }
            await data.fetchStructures();
        } catch (error) {
            console.error('Structure Submission Error:', error);
            throw error;
        }
    };

    const handleStructureDelete = async (id: number) => {
        if (window.confirm(t('common.confirmDelete'))) {
            try {
                await crud.deleteStructure(id);
                await data.fetchStructures();
            } catch (error) {
                console.error('Delete Structure Error:', error);
            }
        }
    };

    // Tabs Configuration
    const tabs = [
        { id: 'categories', label: t('fees.categories', { defaultValue: 'Categories' }), icon: <Layers size={18} /> },
        { id: 'structures', label: t('fees.structures', { defaultValue: 'Structures' }), icon: <Settings size={18} /> },
        { id: 'allocations', label: t('fees.allocations', { defaultValue: 'Allocations' }), icon: <UserPlus size={18} /> },
        { id: 'discounts', label: t('fees.discounts', { defaultValue: 'Discounts' }), icon: <Percent size={18} /> },
    ];

    if (data.loading && data.categories.length === 0) {
        return <LoadingSpinner fullPage text={t('common.loading')} />;
    }

    return (
        <div className="page-container">
            <PageHeader
                title={t('fees.configurationTitle', 'Fee Configuration')}
                subtitle={t('fees.configurationSubtitle', 'Manage all fee components and rules')}
                icon={<Settings size={32} />}
                actions={[
                    <button key="refresh" className="btn btn-outline" onClick={() => data.fetchAll()}>
                        <RefreshCw size={16} /> {t('common.refresh', { defaultValue: 'Refresh' })}
                    </button>
                ]}
            />

            {data.error && (
                <div className="alert alert-danger mb-4 flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>{data.error}</span>
                </div>
            )}

            <div className="card mb-6">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    variant="underline"
                />

                <div className="p-6">
                    {activeTab === 'categories' && (
                        <FeeCategoryTable
                            categories={data.categories}
                            loading={data.loading}
                            onAdd={handleAddCategory}
                            onEdit={handleEditCategory}
                            onDelete={handleCategoryDelete}
                        />
                    )}

                    {activeTab === 'structures' && (
                        <FeeStructureTable
                            structures={data.structures}
                            loading={data.loading}
                            onAdd={handleAddStructure}
                            onEdit={handleEditStructure}
                            onDelete={handleStructureDelete}
                        />
                    )}

                    {activeTab === 'allocations' && (
                        <div>
                            {data.loading ? (
                                <LoadingSpinner text={t('common.loading', { defaultValue: 'Loading...' })} />
                            ) : data.allocations.length === 0 ? (
                                <div className="empty-state py-12">
                                    <UserPlus size={48} className="text-muted mb-4" />
                                    <h3>{t('fees.noAllocations', { defaultValue: 'No fee allocations found' })}</h3>
                                    <p className="text-muted">
                                        {t('fees.allocationsDescription', { defaultValue: 'Manage student-specific fee allocations and variations' })}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('fees.student', { defaultValue: 'Student' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('fees.category', { defaultValue: 'Category' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('fees.class', { defaultValue: 'Class' })}</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('fees.finalAmount', { defaultValue: 'Final Amount' })}</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('fees.discount', { defaultValue: 'Discount' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status', { defaultValue: 'Status' })}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.allocations.map((allocation) => (
                                                <tr key={allocation.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap">{allocation.student_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{allocation.category_name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{allocation.class_level_name || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">₹{Number(allocation.final_amount || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">₹{Number(allocation.discount_amount || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{allocation.is_active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'discounts' && (
                        <div>
                            {data.loading ? (
                                <LoadingSpinner text={t('common.loading', { defaultValue: 'Loading...' })} />
                            ) : data.discounts.length === 0 ? (
                                <div className="empty-state py-12">
                                    <Percent size={48} className="text-muted mb-4" />
                                    <h3>{t('fees.noDiscounts', { defaultValue: 'No sibling discounts found' })}</h3>
                                    <p className="text-muted">{t('fees.discountsDescription', { defaultValue: 'Configure sibling discounts and scholarship rules' })}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.name', { defaultValue: 'Name' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('fees.siblingCount', { defaultValue: 'Sibling Count' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('fees.discountPercentage', { defaultValue: 'Discount %' })}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status', { defaultValue: 'Status' })}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.discounts.map((discount) => (
                                                <tr key={discount.id}>
                                                    <td className="px-4 py-3 whitespace-nowrap">{discount.name}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{discount.sibling_count}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{discount.discount_percentage}%</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">{discount.is_active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <FeeCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                category={selectedCategory}
                onSubmit={handleCategorySubmit}
                loading={crud.loading}
            />

            <FeeStructureModal
                isOpen={isStructureModalOpen}
                onClose={() => setIsStructureModalOpen(false)}
                structure={selectedStructure}
                categories={data.categories}
                gradeLevels={data.gradeLevels}
                academicYears={data.academicYears}
                onSubmit={handleStructureSubmit}
                loading={crud.loading}
            />
        </div>
    );
};

export default FeeConfigurationRefactored;
