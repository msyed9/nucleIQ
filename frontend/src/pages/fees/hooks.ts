/**
 * Fee Configuration Hooks
 * Custom hooks for fee configuration logic
 */

import { useState, useCallback, useMemo } from 'react';
import api from '../../services/api';
import {
    FeeCategory,
    GradeLevel,
    AcademicYear,
    FeeStructure,
    Student,
    FeeAllocation,
    SiblingDiscount,
    FeeCategoryFormData,
    FeeStructureFormData,
    FeeAllocationFormData,
    SiblingDiscountFormData,
} from './types';

// ============================================
// Installment Calculation Hook
// ============================================

interface InstallmentState {
    annualAmount: string;
    frequency: string;
    numberOfTerms: number;
    termMonths: Record<string, number[]>;
    installmentAmounts: Record<string, string>;
}

export function useInstallmentCalculation() {
    const [state, setState] = useState<InstallmentState>({
        annualAmount: '',
        frequency: 'ANNUAL',
        numberOfTerms: 1,
        termMonths: { 'Term 1': [4] },
        installmentAmounts: {},
    });

    const getDefaultTermsForFrequency = useCallback((frequency: string): number => {
        switch (frequency) {
            case 'ANNUAL': return 1;
            case 'HALF_YEARLY': return 2;
            case 'QUARTERLY': return 4;
            case 'MONTHLY': return 12;
            default: return 1;
        }
    }, []);

    const getDefaultTermMonths = useCallback((frequency: string, numberOfTerms: number): Record<string, number[]> => {
        const termMonths: Record<string, number[]> = {};

        switch (frequency) {
            case 'ANNUAL':
                termMonths['Term 1'] = [4]; // April
                break;
            case 'HALF_YEARLY':
                termMonths['Term 1'] = [4]; // April
                termMonths['Term 2'] = [10]; // October
                break;
            case 'QUARTERLY':
                termMonths['Term 1'] = [4];
                termMonths['Term 2'] = [7];
                termMonths['Term 3'] = [10];
                termMonths['Term 4'] = [1];
                break;
            case 'MONTHLY':
                for (let i = 1; i <= 12; i++) {
                    termMonths[`Term ${i}`] = [(i + 3) % 12 || 12];
                }
                break;
            default:
                for (let i = 1; i <= numberOfTerms; i++) {
                    termMonths[`Term ${i}`] = [];
                }
        }

        return termMonths;
    }, []);

    const calculateInstallmentAmounts = useCallback((
        annualAmount: string,
        frequency: string,
        numberOfTerms?: number
    ): Record<string, string> => {
        const annual = parseFloat(annualAmount) || 0;
        const installments: Record<string, string> = {};

        const count = numberOfTerms || getDefaultTermsForFrequency(frequency);
        if (count <= 0 || annual <= 0) return installments;

        const baseAmount = Math.floor(annual / count);
        const remainder = annual - (baseAmount * count);

        for (let i = 1; i <= count; i++) {
            const key = `Term ${i}`;
            installments[key] = i === 1
                ? (baseAmount + remainder).toFixed(2)
                : baseAmount.toFixed(2);
        }

        return installments;
    }, [getDefaultTermsForFrequency]);

    const handleFrequencyChange = useCallback((newFrequency: string) => {
        const newTerms = getDefaultTermsForFrequency(newFrequency);
        const newTermMonths = getDefaultTermMonths(newFrequency, newTerms);
        const newInstallments = calculateInstallmentAmounts(
            state.annualAmount,
            newFrequency,
            newTerms
        );

        setState(prev => ({
            ...prev,
            frequency: newFrequency,
            numberOfTerms: newTerms,
            termMonths: newTermMonths,
            installmentAmounts: newInstallments,
        }));
    }, [state.annualAmount, getDefaultTermsForFrequency, getDefaultTermMonths, calculateInstallmentAmounts]);

    const handleAnnualAmountChange = useCallback((newAmount: string) => {
        const newInstallments = calculateInstallmentAmounts(
            newAmount,
            state.frequency,
            state.numberOfTerms
        );

        setState(prev => ({
            ...prev,
            annualAmount: newAmount,
            installmentAmounts: newInstallments,
        }));
    }, [state.frequency, state.numberOfTerms, calculateInstallmentAmounts]);

    const handleInstallmentAmountChange = useCallback((installmentKey: string, newAmount: string) => {
        setState(prev => ({
            ...prev,
            installmentAmounts: {
                ...prev.installmentAmounts,
                [installmentKey]: newAmount,
            },
        }));
    }, []);

    const handleNumberOfTermsChange = useCallback((newTerms: number) => {
        const currentKeys = Object.keys(state.termMonths);
        let newTermMonths: Record<string, number[]> = {};
        let newInstallments: Record<string, string> = {};

        if (newTerms > currentKeys.length) {
            newTermMonths = { ...state.termMonths };
            newInstallments = { ...state.installmentAmounts };
            for (let i = currentKeys.length + 1; i <= newTerms; i++) {
                newTermMonths[`Term ${i}`] = [];
                newInstallments[`Term ${i}`] = '0.00';
            }
        } else {
            for (let i = 1; i <= newTerms; i++) {
                const key = `Term ${i}`;
                newTermMonths[key] = state.termMonths[key] || [];
                newInstallments[key] = state.installmentAmounts[key] || '0.00';
            }
        }

        setState(prev => ({
            ...prev,
            numberOfTerms: newTerms,
            termMonths: newTermMonths,
            installmentAmounts: newInstallments,
        }));
    }, [state.termMonths, state.installmentAmounts]);

    const handleTermMonthChange = useCallback((termKey: string, month: number) => {
        setState(prev => ({
            ...prev,
            termMonths: {
                ...prev.termMonths,
                [termKey]: [month],
            },
        }));
    }, []);

    const isMonthUsedByOtherTerm = useCallback((month: number, currentTermKey: string): boolean => {
        return Object.entries(state.termMonths).some(
            ([key, months]) => key !== currentTermKey && months.includes(month)
        );
    }, [state.termMonths]);

    const totalInstallments = useMemo(() => {
        return Object.values(state.installmentAmounts).reduce(
            (sum, val) => sum + (parseFloat(val) || 0),
            0
        );
    }, [state.installmentAmounts]);

    const isInstallmentTotalValid = useMemo(() => {
        const annual = parseFloat(state.annualAmount) || 0;
        return Math.abs(totalInstallments - annual) < 1;
    }, [totalInstallments, state.annualAmount]);

    const reset = useCallback((initialState?: Partial<InstallmentState>) => {
        setState({
            annualAmount: initialState?.annualAmount || '',
            frequency: initialState?.frequency || 'ANNUAL',
            numberOfTerms: initialState?.numberOfTerms || 1,
            termMonths: initialState?.termMonths || { 'Term 1': [4] },
            installmentAmounts: initialState?.installmentAmounts || {},
        });
    }, []);

    return {
        ...state,
        totalInstallments,
        isInstallmentTotalValid,
        handleFrequencyChange,
        handleAnnualAmountChange,
        handleInstallmentAmountChange,
        handleNumberOfTermsChange,
        handleTermMonthChange,
        isMonthUsedByOtherTerm,
        reset,
    };
}

// ============================================
// Fee Data Fetching Hook
// ============================================

interface UseFeeDataState {
    categories: FeeCategory[];
    structures: FeeStructure[];
    allocations: FeeAllocation[];
    discounts: SiblingDiscount[];
    gradeLevels: GradeLevel[];
    academicYears: AcademicYear[];
    students: Student[];
    loading: boolean;
    error: string | null;
}

export function useFeeData() {
    const [data, setData] = useState<UseFeeDataState>({
        categories: [],
        structures: [],
        allocations: [],
        discounts: [],
        gradeLevels: [],
        academicYears: [],
        students: [],
        loading: true,
        error: null,
    });

    const fetchCategories = useCallback(async () => {
        try {
            const response = await api.get('/fees/categories/');
            setData(prev => ({ ...prev, categories: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    }, []);

    const fetchStructures = useCallback(async () => {
        try {
            const response = await api.get('/fees/structures/');
            setData(prev => ({ ...prev, structures: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch structures:', error);
        }
    }, []);

    const fetchAllocations = useCallback(async () => {
        try {
            const response = await api.get('/fees/allocations/');
            setData(prev => ({ ...prev, allocations: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch allocations:', error);
        }
    }, []);

    const fetchDiscounts = useCallback(async () => {
        try {
            const response = await api.get('/fees/sibling-discounts/');
            setData(prev => ({ ...prev, discounts: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch discounts:', error);
        }
    }, []);

    const fetchGradeLevels = useCallback(async () => {
        try {
            const response = await api.get('/tenants/grades/');
            setData(prev => ({ ...prev, gradeLevels: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch grade levels:', error);
        }
    }, []);

    const fetchAcademicYears = useCallback(async () => {
        try {
            const response = await api.get('/tenants/years/');
            setData(prev => ({ ...prev, academicYears: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        try {
            const response = await api.get('/students/', { params: { page_size: 1000 } });
            setData(prev => ({ ...prev, students: response.data.results || response.data }));
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    }, []);

    const fetchAll = useCallback(async () => {
        setData(prev => ({ ...prev, loading: true, error: null }));

        try {
            await Promise.all([
                fetchCategories(),
                fetchStructures(),
                fetchAllocations(),
                fetchDiscounts(),
                fetchGradeLevels(),
                fetchAcademicYears(),
                fetchStudents(),
            ]);
        } catch (error: any) {
            setData(prev => ({ ...prev, error: error.message }));
        } finally {
            setData(prev => ({ ...prev, loading: false }));
        }
    }, [
        fetchCategories,
        fetchStructures,
        fetchAllocations,
        fetchDiscounts,
        fetchGradeLevels,
        fetchAcademicYears,
        fetchStudents,
    ]);

    return {
        ...data,
        fetchCategories,
        fetchStructures,
        fetchAllocations,
        fetchDiscounts,
        fetchGradeLevels,
        fetchAcademicYears,
        fetchStudents,
        fetchAll,
    };
}

// ============================================
// Fee CRUD Operations Hook
// ============================================

export function useFeeCRUD() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Category CRUD
    const createCategory = useCallback(async (data: FeeCategoryFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/fees/categories/', data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create category';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateCategory = useCallback(async (id: number, data: FeeCategoryFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/fees/categories/${id}/`, data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update category';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCategory = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/fees/categories/${id}/`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete category';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Structure CRUD
    const createStructure = useCallback(async (data: FeeStructureFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/fees/structures/', data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create structure';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateStructure = useCallback(async (id: number, data: FeeStructureFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/fees/structures/${id}/`, data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update structure';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteStructure = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/fees/structures/${id}/`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete structure';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Allocation CRUD
    const createAllocation = useCallback(async (data: FeeAllocationFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/fees/allocations/', data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create allocation';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAllocation = useCallback(async (id: number, data: FeeAllocationFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/fees/allocations/${id}/`, data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update allocation';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteAllocation = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/fees/allocations/${id}/`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete allocation';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Sibling Discount CRUD
    const createDiscount = useCallback(async (data: SiblingDiscountFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/fees/sibling-discounts/', data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to create discount';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateDiscount = useCallback(async (id: number, data: SiblingDiscountFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/fees/sibling-discounts/${id}/`, data);
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to update discount';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteDiscount = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/fees/sibling-discounts/${id}/`);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || 'Failed to delete discount';
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        // Categories
        createCategory,
        updateCategory,
        deleteCategory,
        // Structures
        createStructure,
        updateStructure,
        deleteStructure,
        // Allocations
        createAllocation,
        updateAllocation,
        deleteAllocation,
        // Discounts
        createDiscount,
        updateDiscount,
        deleteDiscount,
    };
}
