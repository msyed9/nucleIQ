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
    }, [data]);

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
        { id: 'categories', label: t('fees.categories'), icon: <Layers size={18} /> },
        { id: 'structures', label: t('fees.structures'), icon: <Settings size={18} /> },
        { id: 'allocations', label: t('fees.allocations'), icon: <UserPlus size={18} /> },
        { id: 'discounts', label: t('fees.discounts'), icon: <Percent size={18} /> },
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
                        <RefreshCw size={16} /> {t('common.refresh')}
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
                        <div className="empty-state py-12">
                            <UserPlus size={48} className="text-muted mb-4" />
                            <h3>{t('fees.allocationRefactoringInProgress', 'Allocations refactoring in progress')}</h3>
                            <p className="text-muted">{t('fees.allocationsDescription', 'Manage student-specific fee allocations and variations')}</p>
                        </div>
                    )}

                    {activeTab === 'discounts' && (
                        <div className="empty-state py-12">
                            <Percent size={48} className="text-muted mb-4" />
                            <h3>{t('fees.discountRefactoringInProgress', 'Discounts refactoring in progress')}</h3>
                            <p className="text-muted">{t('fees.discountsDescription', 'Configure sibling discounts and scholarship rules')}</p>
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
