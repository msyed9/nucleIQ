import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import '../../components/common/Modal.css';
import './Fees.css';

interface FeeCategory {
    id: number;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
}

interface GradeLevel {
    id: number;
    name: string;
}

interface AcademicYear {
    id: number;
    name: string;
    is_active: boolean;
}

interface FeeStructure {
    id: number;
    category: number;
    category_name: string;
    class_level: number;
    academic_year: number;
    amount: string;
    frequency: string;
    due_day: number;
    is_mandatory: boolean;
    is_active: boolean;
}

interface Student {
    id: number;
    admission_number: string;
    full_name: string;
}

interface FeeAllocation {
    id: number;
    student: number;
    student_name: string;
    fee_structure: number;
    category_name: string;
    custom_amount: string | null;
    discount_amount: string | null;
    discount_reason: string;
    is_scholarship: boolean;
    scholarship_percentage: string | null;
    final_amount: string;
    is_active: boolean;
}

interface SiblingDiscount {
    id: number;
    name: string;
    number_of_siblings: number;
    discount_percentage: string;
    is_active: boolean;
}

const FeeConfiguration: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'categories' | 'structures' | 'allocations' | 'discounts'>('categories');
    const [loading, setLoading] = useState(true);

    // Categories
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FeeCategory | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        code: '',
        description: '',
        is_active: true
    });

    // Structures
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
    const [structureForm, setStructureForm] = useState({
        category: '',
        class_level: '',
        academic_year: '',
        amount: '',
        frequency: 'MONTHLY',
        due_day: 5,
        is_mandatory: true,
        is_active: true
    });

    // Allocations
    const [allocations, setAllocations] = useState<FeeAllocation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<FeeAllocation | null>(null);
    const [allocationForm, setAllocationForm] = useState({
        student: '',
        fee_structure: '',
        custom_amount: '',
        discount_amount: '',
        discount_reason: '',
        is_scholarship: false,
        scholarship_percentage: '',
        is_active: true
    });

    // Sibling Discounts
    const [siblingDiscounts, setSiblingDiscounts] = useState<SiblingDiscount[]>([]);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<SiblingDiscount | null>(null);
    const [discountForm, setDiscountForm] = useState({
        name: '',
        number_of_siblings: 2,
        discount_percentage: '10',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        fetchGradeLevels();
        fetchAcademicYears();
        fetchStudents();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'categories') {
                const response = await api.get('/fees/categories/');
                setCategories(response.data.results || response.data);
            } else if (activeTab === 'structures') {
                const response = await api.get('/fees/structures/');
                setStructures(response.data.results || response.data);
            } else if (activeTab === 'allocations') {
                const response = await api.get('/fees/allocations/');
                setAllocations(response.data.results || response.data);
            } else if (activeTab === 'discounts') {
                const response = await api.get('/fees/sibling-discounts/');
                setSiblingDiscounts(response.data.results || response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGradeLevels = async () => {
        try {
            const response = await api.get('/tenants/grades/');
            setGradeLevels(response.data);
        } catch (error) {
            console.error('Error fetching grade levels:', error);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await api.get('/tenants/years/');
            setAcademicYears(response.data);
        } catch (error) {
            console.error('Error fetching academic years:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            setStudents(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    // Category Functions
    const handleOpenCategoryModal = (category?: FeeCategory) => {
        if (category) {
            setEditingCategory(category);
            setCategoryForm({
                name: category.name,
                code: category.code,
                description: category.description,
                is_active: category.is_active
            });
        } else {
            setEditingCategory(null);
            setCategoryForm({ name: '', code: '', description: '', is_active: true });
        }
        setShowCategoryModal(true);
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/fees/categories/${editingCategory.id}/`, categoryForm);
                alert(t('fees.category_updated', { defaultValue: 'Fee category updated successfully!' }));
            } else {
                await api.post('/fees/categories/', categoryForm);
                alert(t('fees.category_created', { defaultValue: 'Fee category created successfully!' }));
            }
            setShowCategoryModal(false);
            setEditingCategory(null);
            setCategoryForm({ name: '', code: '', description: '', is_active: true });
            fetchData();
        } catch (error) {
            console.error('Error saving category:', error);
            alert(t('fees.category_error', { defaultValue: 'Failed to save fee category' }));
        }
    };

    // Structure Functions
    const handleOpenStructureModal = (structure?: FeeStructure) => {
        if (structure) {
            setEditingStructure(structure);
            setStructureForm({
                category: structure.category.toString(),
                class_level: structure.class_level.toString(),
                academic_year: structure.academic_year.toString(),
                amount: structure.amount,
                frequency: structure.frequency,
                due_day: structure.due_day,
                is_mandatory: structure.is_mandatory,
                is_active: structure.is_active
            });
        } else {
            setEditingStructure(null);
            setStructureForm({
                category: '',
                class_level: '',
                academic_year: '',
                amount: '',
                frequency: 'MONTHLY',
                due_day: 5,
                is_mandatory: true,
                is_active: true
            });
        }
        setShowStructureModal(true);
    };

    const handleCreateStructure = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStructure) {
                await api.put(`/fees/structures/${editingStructure.id}/`, structureForm);
                alert(t('fees.structure_updated', { defaultValue: 'Fee structure updated successfully!' }));
            } else {
                await api.post('/fees/structures/', structureForm);
                alert(t('fees.structure_created', { defaultValue: 'Fee structure created successfully!' }));
            }
            setShowStructureModal(false);
            setEditingStructure(null);
            fetchData();
        } catch (error) {
            console.error('Error saving structure:', error);
            alert(t('fees.structure_error', { defaultValue: 'Failed to save fee structure' }));
        }
    };

    // Allocation Functions
    const handleOpenAllocationModal = (allocation?: FeeAllocation) => {
        if (allocation) {
            setEditingAllocation(allocation);
            setAllocationForm({
                student: allocation.student.toString(),
                fee_structure: allocation.fee_structure.toString(),
                custom_amount: allocation.custom_amount || '',
                discount_amount: allocation.discount_amount || '',
                discount_reason: allocation.discount_reason,
                is_scholarship: allocation.is_scholarship,
                scholarship_percentage: allocation.scholarship_percentage || '',
                is_active: allocation.is_active
            });
        } else {
            setEditingAllocation(null);
            setAllocationForm({
                student: '',
                fee_structure: '',
                custom_amount: '',
                discount_amount: '',
                discount_reason: '',
                is_scholarship: false,
                scholarship_percentage: '',
                is_active: true
            });
        }
        setShowAllocationModal(true);
    };

    const handleCreateAllocation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAllocation) {
                await api.put(`/fees/allocations/${editingAllocation.id}/`, allocationForm);
                alert(t('fees.allocation_updated', { defaultValue: 'Fee allocation updated successfully!' }));
            } else {
                await api.post('/fees/allocations/', allocationForm);
                alert(t('fees.allocation_created', { defaultValue: 'Fee allocated successfully!' }));
            }
            setShowAllocationModal(false);
            setEditingAllocation(null);
            fetchData();
        } catch (error) {
            console.error('Error saving allocation:', error);
            alert(t('fees.allocation_error', { defaultValue: 'Failed to save fee allocation' }));
        }
    };

    // Sibling Discount Functions
    const handleOpenDiscountModal = (discount?: SiblingDiscount) => {
        if (discount) {
            setEditingDiscount(discount);
            setDiscountForm({
                name: discount.name,
                number_of_siblings: discount.number_of_siblings,
                discount_percentage: discount.discount_percentage,
                is_active: discount.is_active
            });
        } else {
            setEditingDiscount(null);
            setDiscountForm({ name: '', number_of_siblings: 2, discount_percentage: '10', is_active: true });
        }
        setShowDiscountModal(true);
    };

    const handleCreateDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDiscount) {
                await api.put(`/fees/sibling-discounts/${editingDiscount.id}/`, discountForm);
                alert(t('fees.discount_updated', { defaultValue: 'Sibling discount updated successfully!' }));
            } else {
                await api.post('/fees/sibling-discounts/', discountForm);
                alert(t('fees.discount_created', { defaultValue: 'Sibling discount created successfully!' }));
            }
            setShowDiscountModal(false);
            setEditingDiscount(null);
            fetchData();
        } catch (error) {
            console.error('Error saving discount:', error);
            alert(t('fees.discount_error', { defaultValue: 'Failed to save sibling discount' }));
        }
    };

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <div className="fee-config-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">💰 {t('fees.config_title', { defaultValue: 'Fee Configuration' })}</h1>
                    <p className="page-subtitle">{t('fees.config_subtitle', { defaultValue: 'Manage fee categories, structures, and allocations' })}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    📋 {t('fees.categories', { defaultValue: 'Categories' })}
                </button>
                <button
                    className={`tab ${activeTab === 'structures' ? 'active' : ''}`}
                    onClick={() => setActiveTab('structures')}
                >
                    🏗️ {t('fees.structures', { defaultValue: 'Structures' })}
                </button>
                <button
                    className={`tab ${activeTab === 'allocations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('allocations')}
                >
                    🎯 {t('fees.allocations', { defaultValue: 'Allocations' })}
                </button>
                <button
                    className={`tab ${activeTab === 'discounts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discounts')}
                >
                    🎁 {t('fees.sibling_discounts', { defaultValue: 'Sibling Discounts' })}
                </button>
            </div>

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <Card>
                    <div className="card-header-with-action">
                        <h3>{t('fees.categories_list', { defaultValue: 'Fee Categories' })}</h3>
                        <Button variant="primary" onClick={() => handleOpenCategoryModal()}>
                            ➕ {t('fees.add_category', { defaultValue: 'Add Category' })}
                        </Button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('fees.category_name', { defaultValue: 'Category Name' })}</th>
                                    <th>{t('fees.code', { defaultValue: 'Code' })}</th>
                                    <th>{t('fees.description', { defaultValue: 'Description' })}</th>
                                    <th>{t('fees.status', { defaultValue: 'Status' })}</th>
                                    <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td>{category.name}</td>
                                        <td><code>{category.code}</code></td>
                                        <td>{category.description || '-'}</td>
                                        <td>
                                            <span className={`status-badge status-${category.is_active ? 'active' : 'inactive'}`}>
                                                {category.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <Button size="small" variant="outline" onClick={() => handleOpenCategoryModal(category)}>
                                                ✏️ {t('common.edit')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Structures Tab */}
            {activeTab === 'structures' && (
                <Card>
                    <div className="card-header-with-action">
                        <h3>{t('fees.structures_list', { defaultValue: 'Fee Structures' })}</h3>
                        <Button variant="primary" onClick={() => handleOpenStructureModal()}>
                            ➕ {t('fees.add_structure', { defaultValue: 'Add Structure' })}
                        </Button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('fees.category', { defaultValue: 'Category' })}</th>
                                    <th>{t('fees.grade', { defaultValue: 'Grade' })}</th>
                                    <th>{t('fees.amount', { defaultValue: 'Amount' })}</th>
                                    <th>{t('fees.frequency', { defaultValue: 'Frequency' })}</th>
                                    <th>{t('fees.due_day', { defaultValue: 'Due Day' })}</th>
                                    <th>{t('fees.mandatory', { defaultValue: 'Mandatory' })}</th>
                                    <th>{t('fees.status', { defaultValue: 'Status' })}</th>
                                    <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {structures.map((structure) => (
                                    <tr key={structure.id}>
                                        <td>{structure.category_name}</td>
                                        <td>{gradeLevels.find(g => g.id === structure.class_level)?.name || structure.class_level}</td>
                                        <td>₹{Number(structure.amount).toLocaleString()}</td>
                                        <td>{structure.frequency}</td>
                                        <td>{structure.due_day}</td>
                                        <td>{structure.is_mandatory ? '✅ Yes' : '❌ No'}</td>
                                        <td>
                                            <span className={`status-badge status-${structure.is_active ? 'active' : 'inactive'}`}>
                                                {structure.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <Button size="small" variant="outline" onClick={() => handleOpenStructureModal(structure)}>
                                                ✏️ {t('common.edit')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Allocations Tab */}
            {activeTab === 'allocations' && (
                <Card>
                    <div className="card-header-with-action">
                        <h3>{t('fees.allocations_list', { defaultValue: 'Fee Allocations' })}</h3>
                        <Button variant="primary" onClick={() => handleOpenAllocationModal()}>
                            ➕ {t('fees.add_allocation', { defaultValue: 'Allocate Fee' })}
                        </Button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('fees.student', { defaultValue: 'Student' })}</th>
                                    <th>{t('fees.category', { defaultValue: 'Category' })}</th>
                                    <th>{t('fees.custom_amount', { defaultValue: 'Custom Amount' })}</th>
                                    <th>{t('fees.discount', { defaultValue: 'Discount' })}</th>
                                    <th>{t('fees.final_amount', { defaultValue: 'Final Amount' })}</th>
                                    <th>{t('fees.scholarship', { defaultValue: 'Scholarship' })}</th>
                                    <th>{t('fees.status', { defaultValue: 'Status' })}</th>
                                    <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocations.map((allocation) => (
                                    <tr key={allocation.id}>
                                        <td>{allocation.student_name}</td>
                                        <td>{allocation.category_name}</td>
                                        <td>{allocation.custom_amount ? `₹${Number(allocation.custom_amount).toLocaleString()}` : '-'}</td>
                                        <td>{allocation.discount_amount ? `₹${Number(allocation.discount_amount).toLocaleString()}` : '-'}</td>
                                        <td className="font-bold">₹{Number(allocation.final_amount).toLocaleString()}</td>
                                        <td>{allocation.is_scholarship ? `✅ ${allocation.scholarship_percentage}%` : '❌'}</td>
                                        <td>
                                            <span className={`status-badge status-${allocation.is_active ? 'active' : 'inactive'}`}>
                                                {allocation.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <Button size="small" variant="outline" onClick={() => handleOpenAllocationModal(allocation)}>
                                                ✏️ {t('common.edit')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Sibling Discounts Tab */}
            {activeTab === 'discounts' && (
                <Card>
                    <div className="card-header-with-action">
                        <h3>{t('fees.discounts_list', { defaultValue: 'Sibling Discounts' })}</h3>
                        <Button variant="primary" onClick={() => handleOpenDiscountModal()}>
                            ➕ {t('fees.add_discount', { defaultValue: 'Add Discount' })}
                        </Button>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('fees.discount_name', { defaultValue: 'Discount Name' })}</th>
                                    <th>{t('fees.siblings_count', { defaultValue: 'Number of Siblings' })}</th>
                                    <th>{t('fees.discount_percent', { defaultValue: 'Discount %' })}</th>
                                    <th>{t('fees.status', { defaultValue: 'Status' })}</th>
                                    <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {siblingDiscounts.map((discount) => (
                                    <tr key={discount.id}>
                                        <td>{discount.name}</td>
                                        <td>{discount.number_of_siblings}</td>
                                        <td>{discount.discount_percentage}%</td>
                                        <td>
                                            <span className={`status-badge status-${discount.is_active ? 'active' : 'inactive'}`}>
                                                {discount.is_active ? t('common.active') : t('common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <Button size="small" variant="outline" onClick={() => handleOpenDiscountModal(discount)}>
                                                ✏️ {t('common.edit')}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? t('fees.edit_category') : t('fees.add_category', { defaultValue: 'Add Fee Category' })}</h2>
                            <button className="modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateCategory}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('fees.category_name', { defaultValue: 'Category Name' })}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Tuition Fee"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('fees.code', { defaultValue: 'Code' })}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., TUITION"
                                        value={categoryForm.code}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('fees.description', { defaultValue: 'Description' })}</label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                    />
                                    {t('fees.is_active', { defaultValue: 'Active' })}
                                </label>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingCategory ? t('common.update') : t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Structure Modal */}
            {showStructureModal && (
                <div className="modal-overlay" onClick={() => setShowStructureModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingStructure ? t('fees.edit_structure') : t('fees.add_structure', { defaultValue: 'Add Fee Structure' })}</h2>
                            <button className="modal-close" onClick={() => setShowStructureModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateStructure}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.category', { defaultValue: 'Fee Category' })}</label>
                                        <select
                                            value={structureForm.category}
                                            onChange={(e) => setStructureForm({ ...structureForm, category: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('fees.select_category', { defaultValue: 'Select Category' })}</option>
                                            {categories.filter(c => c.is_active).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.grade', { defaultValue: 'Grade Level' })}</label>
                                        <select
                                            value={structureForm.class_level}
                                            onChange={(e) => setStructureForm({ ...structureForm, class_level: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('fees.select_grade', { defaultValue: 'Select Grade' })}</option>
                                            {gradeLevels.map(grade => (
                                                <option key={grade.id} value={grade.id}>{grade.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.academic_year', { defaultValue: 'Academic Year' })}</label>
                                        <select
                                            value={structureForm.academic_year}
                                            onChange={(e) => setStructureForm({ ...structureForm, academic_year: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('fees.select_year', { defaultValue: 'Select Year' })}</option>
                                            {academicYears.map(year => (
                                                <option key={year.id} value={year.id}>{year.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.amount', { defaultValue: 'Amount' })}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="5000.00"
                                            value={structureForm.amount}
                                            onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.frequency', { defaultValue: 'Frequency' })}</label>
                                        <select
                                            value={structureForm.frequency}
                                            onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })}
                                        >
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="QUARTERLY">Quarterly</option>
                                            <option value="HALF_YEARLY">Half Yearly</option>
                                            <option value="YEARLY">Yearly</option>
                                            <option value="ONE_TIME">One Time</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.due_day', { defaultValue: 'Due Day of Month' })}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={structureForm.due_day}
                                            onChange={(e) => setStructureForm({ ...structureForm, due_day: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={structureForm.is_mandatory}
                                            onChange={(e) => setStructureForm({ ...structureForm, is_mandatory: e.target.checked })}
                                        />
                                        {t('fees.is_mandatory', { defaultValue: 'Mandatory' })}
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={structureForm.is_active}
                                            onChange={(e) => setStructureForm({ ...structureForm, is_active: e.target.checked })}
                                        />
                                        {t('fees.is_active', { defaultValue: 'Active' })}
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowStructureModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingStructure ? t('common.update') : t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocation Modal */}
            {showAllocationModal && (
                <div className="modal-overlay" onClick={() => setShowAllocationModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAllocation ? t('fees.edit_allocation') : t('fees.add_allocation', { defaultValue: 'Allocate Fee' })}</h2>
                            <button className="modal-close" onClick={() => setShowAllocationModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateAllocation}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.student', { defaultValue: 'Student' })}</label>
                                        <select
                                            value={allocationForm.student}
                                            onChange={(e) => setAllocationForm({ ...allocationForm, student: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('fees.select_student', { defaultValue: 'Select Student' })}</option>
                                            {students.map(student => (
                                                <option key={student.id} value={student.id}>
                                                    {student.admission_number} - {student.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.structure', { defaultValue: 'Fee Structure' })}</label>
                                        <select
                                            value={allocationForm.fee_structure}
                                            onChange={(e) => setAllocationForm({ ...allocationForm, fee_structure: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('fees.select_structure', { defaultValue: 'Select Structure' })}</option>
                                            {structures.filter(s => s.is_active).map(structure => (
                                                <option key={structure.id} value={structure.id}>
                                                    {structure.category_name} - {gradeLevels.find(g => g.id === structure.class_level)?.name} - ₹{Number(structure.amount).toLocaleString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.custom_amount', { defaultValue: 'Custom Amount (Optional)' })}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Leave empty to use structure amount"
                                            value={allocationForm.custom_amount}
                                            onChange={(e) => setAllocationForm({ ...allocationForm, custom_amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.discount_amount', { defaultValue: 'Discount Amount' })}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={allocationForm.discount_amount}
                                            onChange={(e) => setAllocationForm({ ...allocationForm, discount_amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('fees.discount_reason', { defaultValue: 'Discount Reason' })}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Sibling discount, Merit scholarship"
                                        value={allocationForm.discount_reason}
                                        onChange={(e) => setAllocationForm({ ...allocationForm, discount_reason: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={allocationForm.is_scholarship}
                                            onChange={(e) => setAllocationForm({ ...allocationForm, is_scholarship: e.target.checked })}
                                        />
                                        {t('fees.is_scholarship', { defaultValue: 'Is Scholarship?' })}
                                    </label>
                                    {allocationForm.is_scholarship && (
                                        <div className="form-group">
                                            <label>{t('fees.scholarship_percentage', { defaultValue: 'Scholarship %' })}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={allocationForm.scholarship_percentage}
                                                onChange={(e) => setAllocationForm({ ...allocationForm, scholarship_percentage: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={allocationForm.is_active}
                                        onChange={(e) => setAllocationForm({ ...allocationForm, is_active: e.target.checked })}
                                    />
                                    {t('fees.is_active', { defaultValue: 'Active' })}
                                </label>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowAllocationModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingAllocation ? t('common.update') : t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Discount Modal */}
            {showDiscountModal && (
                <div className="modal-overlay" onClick={() => setShowDiscountModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingDiscount ? t('fees.edit_discount') : t('fees.add_discount', { defaultValue: 'Add Sibling Discount' })}</h2>
                            <button className="modal-close" onClick={() => setShowDiscountModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateDiscount}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>{t('fees.discount_name', { defaultValue: 'Discount Name' })}</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., 2 Siblings Discount"
                                        value={discountForm.name}
                                        onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('fees.siblings_count', { defaultValue: 'Number of Siblings' })}</label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={discountForm.number_of_siblings}
                                            onChange={(e) => setDiscountForm({ ...discountForm, number_of_siblings: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('fees.discount_percent', { defaultValue: 'Discount %' })}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={discountForm.discount_percentage}
                                            onChange={(e) => setDiscountForm({ ...discountForm, discount_percentage: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={discountForm.is_active}
                                        onChange={(e) => setDiscountForm({ ...discountForm, is_active: e.target.checked })}
                                    />
                                    {t('fees.is_active', { defaultValue: 'Active' })}
                                </label>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowDiscountModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingDiscount ? t('common.update') : t('common.create')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeConfiguration;
