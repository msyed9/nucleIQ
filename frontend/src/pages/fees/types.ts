/**
 * Fee Configuration Types
 * Shared types for fee configuration module
 */

// ============================================
// Base Types
// ============================================

export interface FeeCategory {
    id: number;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
}

export interface GradeLevel {
    id: number;
    name: string;
}

export interface AcademicYear {
    id: number;
    name: string;
    is_active: boolean;
}

export interface FeeStructure {
    id: number;
    category: number;
    category_name: string;
    class_level: number;
    class_level_name?: string;
    academic_year: number;
    academic_year_name?: string;
    amount: string;
    annual_amount?: string;
    frequency: string;
    due_day: number;
    number_of_terms: number;
    term_months: Record<string, number[]>;
    installment_amounts?: Record<string, string>;
    is_mandatory: boolean;
    is_active: boolean;
}

export interface Student {
    id: number;
    admission_number: string;
    full_name: string;
    current_class_name?: string;
}

export interface FeeAllocation {
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

export interface SiblingDiscount {
    id: number;
    name: string;
    sibling_count: number;
    discount_percentage: string;
    is_active: boolean;
}

// ============================================
// Form Types
// ============================================

export interface FeeCategoryFormData {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
}

export interface FeeStructureFormData {
    category: number | '';
    class_level: number | '';
    academic_year: number | '';
    annual_amount: string;
    amount: string;
    frequency: string;
    due_day: number;
    number_of_terms: number;
    term_months: Record<string, number[]>;
    installment_amounts: Record<string, string>;
    is_mandatory: boolean;
    is_active: boolean;
}

export interface FeeAllocationFormData {
    student: number | '';
    fee_structure: number | '';
    custom_amount: string;
    discount_amount: string;
    discount_reason: string;
    is_scholarship: boolean;
    scholarship_percentage: string;
    is_active: boolean;
}

export interface SiblingDiscountFormData {
    name: string;
    sibling_count: number;
    discount_percentage: string;
    is_active: boolean;
}

// ============================================
// Constants
// ============================================

export const MONTH_OPTIONS = [
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
    { value: 12, label: 'December' },
] as const;

export const FREQUENCY_OPTIONS = [
    { value: 'ANNUAL', label: 'Annual' },
    { value: 'HALF_YEARLY', label: 'Half Yearly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'MONTHLY', label: 'Monthly' },
] as const;

// ============================================
// Tab Types
// ============================================

export type FeeConfigTab = 'categories' | 'structure' | 'allocations' | 'sibling-discount';

// ============================================
// Props Types
// ============================================

export interface FeeCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: FeeCategory | null;
    onSubmit: (data: FeeCategoryFormData) => Promise<void>;
    loading: boolean;
}

export interface FeeStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    structure: FeeStructure | null;
    categories: FeeCategory[];
    gradeLevels: GradeLevel[];
    academicYears: AcademicYear[];
    onSubmit: (data: FeeStructureFormData) => Promise<void>;
    loading: boolean;
}

export interface FeeAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    allocation: FeeAllocation | null;
    students: Student[];
    structures: FeeStructure[];
    onSubmit: (data: FeeAllocationFormData) => Promise<void>;
    loading: boolean;
}

export interface SiblingDiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    discount: SiblingDiscount | null;
    onSubmit: (data: SiblingDiscountFormData) => Promise<void>;
    loading: boolean;
}

export interface FeeCategoryTableProps {
    categories: FeeCategory[];
    loading: boolean;
    onEdit: (category: FeeCategory) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export interface FeeStructureTableProps {
    structures: FeeStructure[];
    loading: boolean;
    onEdit: (structure: FeeStructure) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export interface FeeAllocationTableProps {
    allocations: FeeAllocation[];
    loading: boolean;
    onEdit: (allocation: FeeAllocation) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}

export interface SiblingDiscountTableProps {
    discounts: SiblingDiscount[];
    loading: boolean;
    onEdit: (discount: SiblingDiscount) => void;
    onDelete: (id: number) => void;
    onAdd: () => void;
}
