/**
 * Fee Components Barrel Export
 * Re-exports all fee-related sub-components
 */

// Category Components
export { FeeCategoryTable, FeeCategoryModal } from './FeeCategoryComponents';

// Structure Components
export { FeeStructureTable, FeeStructureModal } from './FeeStructureComponents';

// Types (re-export for convenience)
export * from '../types';

// Hooks (re-export for convenience)
export { useInstallmentCalculation, useFeeData, useFeeCRUD } from '../hooks';
