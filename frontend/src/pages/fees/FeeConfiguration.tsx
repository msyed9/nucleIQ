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
    annual_amount?: string; // Total annual fee
    frequency: string;
    due_day: number;
    number_of_terms: number;
    term_months: Record<string, number[]>;
    installment_amounts?: Record<string, string>; // Custom amounts per installment
    is_mandatory: boolean;
    is_active: boolean;
}

// Month options for term configuration
const MONTH_OPTIONS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

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
    structure_amount: string;
    class_level_name?: string;
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
    sibling_count: number;
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
        amount: '', // Per-installment amount (auto-calculated or manually set)
        annual_amount: '', // Total annual fee
        frequency: 'YEARLY',
        due_day: 5,
        number_of_terms: 1,
        term_months: {} as Record<string, number[]>,
        installment_amounts: {} as Record<string, string>, // Custom amounts per installment
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
        sibling_count: 2,
        discount_percentage: '10',
        is_active: true
    });

    // Bulk Class Allocation
    const [showBulkAllocationModal, setShowBulkAllocationModal] = useState(false);
    const [bulkAllocationForm, setBulkAllocationForm] = useState({
        class_level: '',
        fee_structure: '',
        overwrite_existing: false
    });
    const [bulkAllocationLoading, setBulkAllocationLoading] = useState(false);

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
                const data = response.data;
                setCategories(Array.isArray(data) ? data : (data?.results || []));
            } else if (activeTab === 'structures') {
                // Fetch both categories and structures for the structures tab
                const [catResponse, structResponse] = await Promise.all([
                    api.get('/fees/categories/').catch(() => ({ data: [] })),
                    api.get('/fees/structures/').catch(() => ({ data: [] }))
                ]);
                const catData = catResponse.data;
                const structData = structResponse.data;
                setCategories(Array.isArray(catData) ? catData : (catData?.results || []));
                setStructures(Array.isArray(structData) ? structData : (structData?.results || []));
            } else if (activeTab === 'allocations') {
                // Fetch categories, structures, and allocations for the allocations tab
                const [catResponse, structResponse, allocResponse] = await Promise.all([
                    api.get('/fees/categories/').catch(() => ({ data: [] })),
                    api.get('/fees/structures/').catch(() => ({ data: [] })),
                    api.get('/fees/allocations/').catch(() => ({ data: [] }))
                ]);
                const catData = catResponse.data;
                const structData = structResponse.data;
                const allocData = allocResponse.data;
                setCategories(Array.isArray(catData) ? catData : (catData?.results || []));
                setStructures(Array.isArray(structData) ? structData : (structData?.results || []));
                setAllocations(Array.isArray(allocData) ? allocData : (allocData?.results || []));
            } else if (activeTab === 'discounts') {
                const response = await api.get('/fees/sibling-discounts/');
                const data = response.data;
                setSiblingDiscounts(Array.isArray(data) ? data : (data?.results || []));
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            // Ensure we have empty arrays on error to prevent crashes
            if (activeTab === 'categories') setCategories([]);
            if (activeTab === 'structures') { setCategories([]); setStructures([]); }
            if (activeTab === 'allocations') { setCategories([]); setStructures([]); setAllocations([]); }
            if (activeTab === 'discounts') setSiblingDiscounts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchGradeLevels = async () => {
        try {
            const response = await api.get('/tenants/grades/');
            const data = response.data;
            setGradeLevels(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error fetching grade levels:', error);
            setGradeLevels([]);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await api.get('/tenants/years/');
            const data = response.data;
            setAcademicYears(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error fetching academic years:', error);
            setAcademicYears([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            const data = response.data;
            setStudents(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
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
        } catch (error: any) {
            console.error('Error saving category:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save fee category';
            alert(errorMsg);
        }
    };

    // Helper function to get default number of terms based on frequency
    const getDefaultTermsForFrequency = (frequency: string): number => {
        switch (frequency) {
            case 'QUARTERLY': return 4;
            case 'HALF_YEARLY': return 2;
            case 'TERM': return 3;
            default: return 1;
        }
    };

    // Helper function to get default term months based on frequency
    const getDefaultTermMonths = (frequency: string, numberOfTerms: number): Record<string, number[]> => {
        const termMonths: Record<string, number[]> = {};

        if (frequency === 'QUARTERLY') {
            // April, July, October, January (Indian academic year)
            const defaultMonths = [4, 7, 10, 1];
            for (let i = 1; i <= numberOfTerms; i++) {
                termMonths[`term_${i}`] = [defaultMonths[i - 1] || i];
            }
        } else if (frequency === 'HALF_YEARLY') {
            // April and October (Indian academic year)
            const defaultMonths = [4, 10];
            for (let i = 1; i <= numberOfTerms; i++) {
                termMonths[`term_${i}`] = [defaultMonths[i - 1] || i];
            }
        } else if (frequency === 'TERM') {
            // Trimester defaults: April, August, December (Indian academic year)
            const defaultMonths = [4, 8, 12, 2]; // Supports up to 4 terms
            for (let i = 1; i <= numberOfTerms; i++) {
                termMonths[`term_${i}`] = [defaultMonths[i - 1] || i];
            }
        }

        return termMonths;
    };

    // Get number of installments based on frequency
    const getInstallmentCount = (frequency: string): number => {
        switch (frequency) {
            case 'MONTHLY': return 12;
            case 'QUARTERLY': return 4;
            case 'HALF_YEARLY': return 2;
            case 'YEARLY': return 1;
            case 'ONE_TIME': return 1;
            case 'TERM': return structureForm.number_of_terms || 3;
            default: return 1;
        }
    };

    // Calculate installment amounts based on annual fee
    const calculateInstallmentAmounts = (annualAmount: string, frequency: string, numberOfTerms?: number): Record<string, string> => {
        const annual = parseFloat(annualAmount);
        if (isNaN(annual) || annual <= 0) return {};

        const installmentCount = frequency === 'TERM'
            ? (numberOfTerms || getDefaultTermsForFrequency(frequency))
            : getInstallmentCount(frequency);

        if (installmentCount === 1) {
            return { installment_1: annualAmount };
        }

        const baseAmount = Math.floor((annual / installmentCount) * 100) / 100;
        const remainder = Math.round((annual - (baseAmount * installmentCount)) * 100) / 100;

        const amounts: Record<string, string> = {};
        for (let i = 1; i <= installmentCount; i++) {
            // Add remainder to the first installment
            const amount = i === 1 ? baseAmount + remainder : baseAmount;
            amounts[`installment_${i}`] = amount.toFixed(2);
        }
        return amounts;
    };

    // Get total of all installment amounts
    const getTotalInstallmentAmounts = (): number => {
        return Object.values(structureForm.installment_amounts).reduce((sum, val) => {
            const num = parseFloat(val);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    };

    // Handle frequency change to auto-set term defaults and calculate installments
    const handleFrequencyChange = (newFrequency: string) => {
        const isTermBased = ['QUARTERLY', 'HALF_YEARLY', 'TERM'].includes(newFrequency);
        const defaultTerms = getDefaultTermsForFrequency(newFrequency);
        const defaultMonths = isTermBased ? getDefaultTermMonths(newFrequency, defaultTerms) : {};

        // Calculate installment amounts based on annual fee
        const installmentAmounts = calculateInstallmentAmounts(
            structureForm.annual_amount,
            newFrequency,
            isTermBased ? defaultTerms : undefined
        );

        // For one-time fee, set amount directly
        if (newFrequency === 'ONE_TIME' || newFrequency === 'YEARLY') {
            setStructureForm({
                ...structureForm,
                frequency: newFrequency,
                amount: structureForm.annual_amount,
                number_of_terms: 1,
                term_months: {},
                installment_amounts: installmentAmounts
            });
        } else {
            // For recurring fees, calculate per-installment amount
            const count = newFrequency === 'TERM' ? defaultTerms : getInstallmentCount(newFrequency);
            const annual = parseFloat(structureForm.annual_amount) || 0;
            const perInstallment = count > 0 ? (annual / count).toFixed(2) : '';

            setStructureForm({
                ...structureForm,
                frequency: newFrequency,
                amount: perInstallment,
                number_of_terms: isTermBased ? defaultTerms : count,
                term_months: defaultMonths,
                installment_amounts: installmentAmounts
            });
        }
    };

    // Handle annual amount change - recalculate installments
    const handleAnnualAmountChange = (newAmount: string) => {
        const installmentAmounts = calculateInstallmentAmounts(
            newAmount,
            structureForm.frequency,
            structureForm.number_of_terms
        );

        // Update the per-installment amount for display
        const count = structureForm.frequency === 'TERM'
            ? structureForm.number_of_terms
            : getInstallmentCount(structureForm.frequency);
        const annual = parseFloat(newAmount) || 0;
        const perInstallment = count > 0 ? (annual / count).toFixed(2) : '';

        setStructureForm({
            ...structureForm,
            annual_amount: newAmount,
            amount: structureForm.frequency === 'ONE_TIME' || structureForm.frequency === 'YEARLY' ? newAmount : perInstallment,
            installment_amounts: installmentAmounts
        });
    };

    // Handle individual installment amount change
    const handleInstallmentAmountChange = (installmentKey: string, newAmount: string) => {
        const updatedAmounts = {
            ...structureForm.installment_amounts,
            [installmentKey]: newAmount
        };

        setStructureForm({
            ...structureForm,
            installment_amounts: updatedAmounts
        });
    };

    // Handle number of terms change
    const handleNumberOfTermsChange = (newTerms: number) => {
        const newTermMonths: Record<string, number[]> = {};

        // Preserve existing month selections and add new ones as needed
        for (let i = 1; i <= newTerms; i++) {
            const termKey = `term_${i}`;
            if (structureForm.term_months[termKey]) {
                newTermMonths[termKey] = structureForm.term_months[termKey];
            } else {
                // Set a default month for new terms
                newTermMonths[termKey] = [i <= 12 ? i : 1];
            }
        }

        // Recalculate installment amounts
        const installmentAmounts = calculateInstallmentAmounts(
            structureForm.annual_amount,
            structureForm.frequency,
            newTerms
        );

        const annual = parseFloat(structureForm.annual_amount) || 0;
        const perInstallment = newTerms > 0 ? (annual / newTerms).toFixed(2) : '';

        setStructureForm({
            ...structureForm,
            number_of_terms: newTerms,
            amount: perInstallment,
            term_months: newTermMonths,
            installment_amounts: installmentAmounts
        });
    };

    // Handle term month selection change
    const handleTermMonthChange = (termKey: string, month: number) => {
        setStructureForm({
            ...structureForm,
            term_months: {
                ...structureForm.term_months,
                [termKey]: [month]
            }
        });
    };

    // Check if a month is already used by another term
    const isMonthUsedByOtherTerm = (month: number, currentTermKey: string): boolean => {
        for (const [termKey, months] of Object.entries(structureForm.term_months)) {
            if (termKey !== currentTermKey && months.includes(month)) {
                return true;
            }
        }
        return false;
    };

    // Validate that total installments don't exceed annual fee
    const isInstallmentTotalValid = (): boolean => {
        const annual = parseFloat(structureForm.annual_amount) || 0;
        const total = getTotalInstallmentAmounts();
        return total <= annual || Math.abs(total - annual) < 0.01; // Allow small rounding differences
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
                annual_amount: structure.annual_amount || structure.amount,
                frequency: structure.frequency,
                due_day: structure.due_day,
                number_of_terms: structure.number_of_terms || 1,
                term_months: structure.term_months || {},
                installment_amounts: structure.installment_amounts || {},
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
                annual_amount: '',
                frequency: 'YEARLY',
                due_day: 5,
                number_of_terms: 1,
                term_months: {},
                installment_amounts: {},
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
        } catch (error: any) {
            console.error('Error saving structure:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save fee structure';
            alert(errorMsg);
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
        } catch (error: any) {
            console.error('Error saving allocation:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save fee allocation';
            alert(errorMsg);
        }
    };

    // Sibling Discount Functions
    const handleOpenDiscountModal = (discount?: SiblingDiscount) => {
        if (discount) {
            setEditingDiscount(discount);
            setDiscountForm({
                name: discount.name,
                sibling_count: discount.sibling_count,
                discount_percentage: discount.discount_percentage,
                is_active: discount.is_active
            });
        } else {
            setEditingDiscount(null);
            setDiscountForm({ name: '', sibling_count: 2, discount_percentage: '10', is_active: true });
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
        } catch (error: any) {
            console.error('Error saving discount:', error);
            console.error('Error response:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data?.detail || JSON.stringify(error.response?.data) || 'Failed to save sibling discount';
            alert(errorMsg);
        }
    };

    // Bulk allocate fee structure to all students in a class
    const handleBulkAllocateToClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkAllocationForm.class_level || !bulkAllocationForm.fee_structure) {
            alert(t('fees.select_class_and_structure', { defaultValue: 'Please select both class and fee structure' }));
            return;
        }

        setBulkAllocationLoading(true);
        try {
            // Get all students in the selected class
            const studentsResponse = await api.get(`/students/students/?class_level=${bulkAllocationForm.class_level}`);
            const classStudents = studentsResponse.data.results || studentsResponse.data;

            if (classStudents.length === 0) {
                alert(t('fees.no_students_in_class', { defaultValue: 'No students found in the selected class' }));
                setBulkAllocationLoading(false);
                return;
            }

            // Allocate fee structure to each student
            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;

            for (const student of classStudents) {
                try {
                    // Check if allocation already exists
                    const existingResponse = await api.get(
                        `/fees/allocations/?student=${student.id}&fee_structure=${bulkAllocationForm.fee_structure}`
                    );
                    const existingAllocations = existingResponse.data.results || existingResponse.data;

                    if (existingAllocations.length > 0 && !bulkAllocationForm.overwrite_existing) {
                        skipCount++;
                        continue;
                    }

                    // Create or update allocation
                    if (existingAllocations.length > 0 && bulkAllocationForm.overwrite_existing) {
                        await api.put(`/fees/allocations/${existingAllocations[0].id}/`, {
                            student: student.id,
                            fee_structure: bulkAllocationForm.fee_structure,
                            is_active: true
                        });
                    } else {
                        await api.post('/fees/allocations/', {
                            student: student.id,
                            fee_structure: bulkAllocationForm.fee_structure,
                            is_active: true
                        });
                    }
                    successCount++;
                } catch (err) {
                    console.error(`Error allocating for student ${student.id}:`, err);
                    errorCount++;
                }
            }

            alert(t('fees.bulk_allocation_complete', {
                defaultValue: `Bulk allocation complete!\nAllocated: ${successCount}\nSkipped (existing): ${skipCount}\nErrors: ${errorCount}`
            }));

            setShowBulkAllocationModal(false);
            setBulkAllocationForm({ class_level: '', fee_structure: '', overwrite_existing: false });
            fetchData();
        } catch (error) {
            console.error('Error in bulk allocation:', error);
            alert(t('fees.bulk_allocation_error', { defaultValue: 'Failed to perform bulk allocation' }));
        } finally {
            setBulkAllocationLoading(false);
        }
    };

    // Calculate discount percentage
    const calculateDiscountPercentage = (structureAmount: string, finalAmount: string): string => {
        const base = parseFloat(structureAmount);
        const final = parseFloat(finalAmount);
        if (isNaN(base) || isNaN(final) || base === 0 || base === final) {
            return '';
        }
        const discountPercent = ((base - final) / base) * 100;
        return discountPercent.toFixed(1);
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
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Button variant="outline" onClick={() => setShowBulkAllocationModal(true)}>
                                🎯 {t('fees.bulk_allocate_class', { defaultValue: 'Bulk Allocate to Class' })}
                            </Button>
                            <Button variant="primary" onClick={() => handleOpenAllocationModal()}>
                                ➕ {t('fees.add_allocation', { defaultValue: 'Allocate Fee' })}
                            </Button>
                        </div>
                    </div>

                    {/* Class-wise Summary Section */}
                    <div style={{ marginBottom: '20px', padding: '16px', background: '#f0f4ff', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#4338ca' }}>📊 {t('fees.class_summary', { defaultValue: 'Class-wise Allocation Summary' })}</h4>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {gradeLevels.map(grade => {
                                const gradeAllocations = allocations.filter(a => a.class_level_name === grade.name);
                                const count = gradeAllocations.length;
                                return count > 0 ? (
                                    <div key={grade.id} style={{
                                        background: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        border: '1px solid #c7d2fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{ fontWeight: '600', color: '#4338ca' }}>{grade.name}:</span>
                                        <span style={{
                                            background: '#4338ca',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem'
                                        }}>{count}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{t('fees.student', { defaultValue: 'Student' })}</th>
                                    <th>{t('fees.category', { defaultValue: 'Category' })}</th>
                                    <th>{t('fees.structure_amount', { defaultValue: 'Structure Amount' })}</th>
                                    <th>{t('fees.final_amount', { defaultValue: 'Final Amount' })}</th>
                                    <th>{t('fees.discount_percent', { defaultValue: 'Discount %' })}</th>
                                    <th>{t('fees.scholarship', { defaultValue: 'Scholarship' })}</th>
                                    <th>{t('fees.status', { defaultValue: 'Status' })}</th>
                                    <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocations.map((allocation) => {
                                    const discountPercent = calculateDiscountPercentage(
                                        allocation.structure_amount || '0',
                                        allocation.final_amount
                                    );
                                    const hasDiscount = discountPercent !== '' && parseFloat(discountPercent) > 0;

                                    return (
                                        <tr key={allocation.id}>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: '600' }}>{allocation.student_name}</span>
                                                    {allocation.class_level_name && (
                                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                            {allocation.class_level_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{allocation.category_name}</td>
                                            <td>₹{Number(allocation.structure_amount || 0).toLocaleString()}</td>
                                            <td className="font-bold">₹{Number(allocation.final_amount).toLocaleString()}</td>
                                            <td>
                                                {hasDiscount ? (
                                                    <span style={{
                                                        background: '#dcfce7',
                                                        color: '#166534',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontWeight: '600',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        🏷️ {discountPercent}% OFF
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#9ca3af' }}>-</span>
                                                )}
                                            </td>
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
                                    );
                                })}
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
                                        <td>{discount.sibling_count}</td>
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
                    <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
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
                                </div>

                                {/* Annual Fee & Frequency Section */}
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '16px'
                                }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        💰 {t('fees.annual_fee_config', { defaultValue: 'Annual Fee Configuration' })}
                                    </h4>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>{t('fees.total_annual_fee', { defaultValue: 'Total Annual Fee (Per Year)' })} *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="60000.00"
                                                value={structureForm.annual_amount}
                                                onChange={(e) => handleAnnualAmountChange(e.target.value)}
                                                required
                                                style={{ fontSize: '1.1rem', fontWeight: '600' }}
                                            />
                                            <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
                                                {t('fees.annual_fee_help', { defaultValue: 'Enter the total fee amount for the entire academic year' })}
                                            </small>
                                        </div>
                                        <div className="form-group">
                                            <label>{t('fees.frequency', { defaultValue: 'Payment Frequency' })} *</label>
                                            <select
                                                value={structureForm.frequency}
                                                onChange={(e) => handleFrequencyChange(e.target.value)}
                                                style={{ fontSize: '1rem' }}
                                            >
                                                <option value="YEARLY">📆 Yearly (Single Payment)</option>
                                                <option value="ONE_TIME">🔖 One-Time (Admission/Registration)</option>
                                                <option value="HALF_YEARLY">📅 Half-Yearly (2 Payments)</option>
                                                <option value="TERM">📝 Trimester (3 Payments)</option>
                                                <option value="QUARTERLY">📊 Quarterly (4 Payments)</option>
                                                <option value="MONTHLY">📆 Monthly (12 Payments)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Show calculated per-installment amount */}
                                    {structureForm.frequency !== 'YEARLY' && structureForm.frequency !== 'ONE_TIME' && structureForm.annual_amount && (
                                        <div style={{
                                            marginTop: '12px',
                                            padding: '12px',
                                            background: '#dcfce7',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ color: '#166534' }}>
                                                💡 {t('fees.per_installment', { defaultValue: 'Per Installment Amount' })}:
                                            </span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#15803d' }}>
                                                ₹{parseFloat(structureForm.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-row">
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

                                {/* Installment Amounts Configuration - Show for recurring frequencies */}
                                {structureForm.frequency !== 'YEARLY' && structureForm.frequency !== 'ONE_TIME' && Object.keys(structureForm.installment_amounts).length > 0 && (
                                    <div style={{
                                        background: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            ✏️ {t('fees.customize_installments', { defaultValue: 'Customize Installment Amounts' })}
                                        </h4>
                                        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#b45309' }}>
                                            {t('fees.customize_installments_help', { defaultValue: 'You can adjust individual installment amounts. Total must not exceed the annual fee.' })}
                                        </p>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '12px'
                                        }}>
                                            {Object.entries(structureForm.installment_amounts).map(([key, value], index) => {
                                                const installmentLabel = structureForm.frequency === 'MONTHLY'
                                                    ? MONTH_OPTIONS[index]?.label || `Month ${index + 1}`
                                                    : `${t('fees.installment', { defaultValue: 'Installment' })} ${index + 1}`;

                                                return (
                                                    <div key={key} style={{
                                                        background: 'white',
                                                        padding: '10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e5e7eb'
                                                    }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '4px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '500',
                                                            color: '#374151'
                                                        }}>
                                                            {installmentLabel}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={value}
                                                            onChange={(e) => handleInstallmentAmountChange(key, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '6px 8px',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Total Validation */}
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '12px',
                                            background: isInstallmentTotalValid() ? '#dcfce7' : '#fee2e2',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ color: isInstallmentTotalValid() ? '#166534' : '#991b1b' }}>
                                                {isInstallmentTotalValid() ? '✅' : '⚠️'} {t('fees.total_installments', { defaultValue: 'Total of all installments' })}:
                                            </span>
                                            <span style={{
                                                fontSize: '1.1rem',
                                                fontWeight: '700',
                                                color: isInstallmentTotalValid() ? '#15803d' : '#dc2626'
                                            }}>
                                                ₹{getTotalInstallmentAmounts().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                {' / '}
                                                ₹{parseFloat(structureForm.annual_amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        {!isInstallmentTotalValid() && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px 12px',
                                                background: '#fee2e2',
                                                border: '1px solid #fecaca',
                                                borderRadius: '6px',
                                                color: '#991b1b',
                                                fontSize: '0.85rem'
                                            }}>
                                                ⚠️ {t('fees.total_exceeds_annual', { defaultValue: 'Total installments cannot exceed the annual fee amount' })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Term Configuration Section - Only show for term-based frequencies */}
                                {['QUARTERLY', 'HALF_YEARLY', 'TERM'].includes(structureForm.frequency) && (
                                    <div style={{
                                        background: '#f0f4ff',
                                        border: '1px solid #c7d2fe',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginTop: '16px',
                                        marginBottom: '16px'
                                    }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            📅 {t('fees.term_configuration', { defaultValue: 'Term Configuration' })}
                                        </h4>
                                        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#6366f1' }}>
                                            {t('fees.term_config_help', { defaultValue: 'Define when each term fee should be collected during the academic year' })}
                                        </p>

                                        <div className="form-group" style={{ marginBottom: '16px' }}>
                                            <label>{t('fees.number_of_terms', { defaultValue: 'Number of Terms' })}</label>
                                            <select
                                                value={structureForm.number_of_terms}
                                                onChange={(e) => handleNumberOfTermsChange(parseInt(e.target.value))}
                                                style={{ maxWidth: '200px' }}
                                            >
                                                {structureForm.frequency === 'QUARTERLY' && (
                                                    <>
                                                        <option value={4}>4 Terms (Quarterly)</option>
                                                    </>
                                                )}
                                                {structureForm.frequency === 'HALF_YEARLY' && (
                                                    <>
                                                        <option value={2}>2 Terms (Half-Yearly)</option>
                                                    </>
                                                )}
                                                {structureForm.frequency === 'TERM' && (
                                                    <>
                                                        <option value={3}>3 Terms (Trimester)</option>
                                                        <option value={2}>2 Terms</option>
                                                        <option value={4}>4 Terms</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                            gap: '12px'
                                        }}>
                                            {Array.from({ length: structureForm.number_of_terms }, (_, index) => {
                                                const termNumber = index + 1;
                                                const termKey = `term_${termNumber}`;
                                                const selectedMonth = structureForm.term_months[termKey]?.[0] || termNumber;

                                                return (
                                                    <div key={termKey} style={{
                                                        background: 'white',
                                                        padding: '12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e5e7eb'
                                                    }}>
                                                        <label style={{
                                                            display: 'block',
                                                            marginBottom: '6px',
                                                            fontWeight: '600',
                                                            color: '#374151'
                                                        }}>
                                                            {t('fees.term_n_collection', { defaultValue: `Term ${termNumber} Collection Month` })}
                                                        </label>
                                                        <select
                                                            value={selectedMonth}
                                                            onChange={(e) => handleTermMonthChange(termKey, parseInt(e.target.value))}
                                                            style={{ width: '100%' }}
                                                        >
                                                            {MONTH_OPTIONS.map(month => {
                                                                const isUsed = isMonthUsedByOtherTerm(month.value, termKey);
                                                                return (
                                                                    <option
                                                                        key={month.value}
                                                                        value={month.value}
                                                                        disabled={isUsed}
                                                                    >
                                                                        {month.label} {isUsed ? '(Already Used)' : ''}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Validation Warning */}
                                        {Object.keys(structureForm.term_months).length < structureForm.number_of_terms && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '8px 12px',
                                                background: '#fef3c7',
                                                border: '1px solid #f59e0b',
                                                borderRadius: '6px',
                                                color: '#92400e',
                                                fontSize: '0.85rem'
                                            }}>
                                                ⚠️ {t('fees.term_config_incomplete', { defaultValue: 'Please ensure all terms have a month selected' })}
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                            value={discountForm.sibling_count}
                                            onChange={(e) => setDiscountForm({ ...discountForm, sibling_count: parseInt(e.target.value) })}
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

            {/* Bulk Allocation Modal */}
            {showBulkAllocationModal && (
                <div className="modal-overlay" onClick={() => setShowBulkAllocationModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎯 {t('fees.bulk_allocate_title', { defaultValue: 'Bulk Allocate Fee Structure to Class' })}</h2>
                            <button className="modal-close" onClick={() => setShowBulkAllocationModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleBulkAllocateToClass}>
                            <div className="modal-body">
                                <div style={{
                                    background: '#fef3c7',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    marginBottom: '20px'
                                }}>
                                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
                                        ⚠️ {t('fees.bulk_allocate_warning', {
                                            defaultValue: 'This will allocate the selected fee structure to ALL students in the chosen class.'
                                        })}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>{t('fees.select_class', { defaultValue: 'Select Class' })}</label>
                                    <select
                                        value={bulkAllocationForm.class_level}
                                        onChange={(e) => setBulkAllocationForm({ ...bulkAllocationForm, class_level: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('fees.choose_class', { defaultValue: '-- Choose a Class --' })}</option>
                                        {gradeLevels.map(grade => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('fees.select_fee_structure', { defaultValue: 'Select Fee Structure' })}</label>
                                    <select
                                        value={bulkAllocationForm.fee_structure}
                                        onChange={(e) => setBulkAllocationForm({ ...bulkAllocationForm, fee_structure: e.target.value })}
                                        required
                                    >
                                        <option value="">{t('fees.choose_structure', { defaultValue: '-- Choose a Fee Structure --' })}</option>
                                        {structures.filter(s => s.is_active).map(structure => (
                                            <option key={structure.id} value={structure.id}>
                                                {structure.category_name} - {gradeLevels.find(g => g.id === structure.class_level)?.name || structure.class_level} - ₹{Number(structure.amount).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <label className="checkbox-label" style={{ marginTop: '16px' }}>
                                    <input
                                        type="checkbox"
                                        checked={bulkAllocationForm.overwrite_existing}
                                        onChange={(e) => setBulkAllocationForm({ ...bulkAllocationForm, overwrite_existing: e.target.checked })}
                                    />
                                    {t('fees.overwrite_existing', { defaultValue: 'Overwrite existing allocations' })}
                                </label>
                            </div>
                            <div className="modal-footer">
                                <Button type="button" variant="outline" onClick={() => setShowBulkAllocationModal(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" variant="primary" disabled={bulkAllocationLoading}>
                                    {bulkAllocationLoading
                                        ? t('common.processing', { defaultValue: 'Processing...' })
                                        : t('fees.allocate_to_class', { defaultValue: 'Allocate to Class' })
                                    }
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
