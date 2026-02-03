/**
 * Frontend Test Utilities
 * Common utilities and setup for React component testing
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ============================================
// Mock Data Factories
// ============================================

export const createMockStudent = (overrides = {}) => ({
    id: 'student_1',
    admission_number: 'ADM-2024-001',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    date_of_birth: '2010-05-15',
    gender: 'MALE',
    email: 'john.doe@school.com',
    phone: '9876543210',
    current_class_name: 'Grade 10',
    section_name: 'A',
    roll_number: '15',
    is_active: true,
    status: 'ACTIVE',
    parent_phone: '9876543211',
    photo_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
});

export const createMockStaff = (overrides = {}) => ({
    id: 'staff_1',
    employee_id: 'EMP-001',
    first_name: 'Jane',
    last_name: 'Smith',
    full_name: 'Jane Smith',
    email: 'jane.smith@school.com',
    phone: '9876543212',
    department_name: 'Science',
    designation_name: 'Senior Teacher',
    is_active: true,
    is_teacher: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
});

export const createMockFeeInvoice = (overrides = {}) => ({
    id: 'inv_1',
    invoice_number: 'INV-2024-001',
    student: 'student_1',
    student_name: 'John Doe',
    admission_number: 'ADM-2024-001',
    class_name: 'Grade 10',
    total_amount: 50000,
    discount_amount: 0,
    paid_amount: 25000,
    balance_amount: 25000,
    due_date: '2024-03-31',
    status: 'PARTIAL',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
});

export const createMockPaymentGateway = (overrides = {}) => ({
    id: 'razorpay',
    name: 'Razorpay',
    type: 'Card/UPI/Netbanking',
    supports_qr: true,
    supports_payment_link: true,
    ...overrides,
});

export const createMockAttendanceRecord = (overrides = {}) => ({
    id: 'att_1',
    student: 'student_1',
    student_name: 'John Doe',
    date: '2024-01-15',
    status: 'PRESENT',
    session: 'FULL_DAY',
    remarks: null,
    marked_at: '2024-01-15T09:00:00Z',
    ...overrides,
});

export const createMockUser = (overrides = {}) => ({
    id: 'user_1',
    email: 'admin@school.com',
    first_name: 'Admin',
    last_name: 'User',
    full_name: 'Admin User',
    is_active: true,
    is_platform_admin: false,
    roles: [{ id: 'role_1', name: 'Admin', code: 'admin' }],
    permissions: ['students.view', 'students.edit', 'fees.view'],
    ...overrides,
});

// ============================================
// Mock API Responses
// ============================================

export const createMockPaginatedResponse = <T,>(
    results: T[],
    page = 1,
    pageSize = 20
) => ({
    count: results.length,
    next: results.length > page * pageSize ? `/api/resource?page=${page + 1}` : null,
    previous: page > 1 ? `/api/resource?page=${page - 1}` : null,
    results: results.slice((page - 1) * pageSize, page * pageSize),
});

export const createMockApiError = (
    message = 'An error occurred',
    status = 400
) => ({
    detail: message,
    message,
    status,
});

// ============================================
// Custom Render Function
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialRoute?: string;
    queryClient?: QueryClient;
}

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

const AllProviders: React.FC<{
    children: React.ReactNode;
    queryClient?: QueryClient;
}> = ({ children, queryClient }) => {
    const client = queryClient || createTestQueryClient();

    return (
        <QueryClientProvider client={client}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

export const customRender = (
    ui: ReactElement,
    options: CustomRenderOptions = {}
): RenderResult => {
    const { initialRoute = '/', queryClient, ...renderOptions } = options;

    window.history.pushState({}, 'Test page', initialRoute);

    return render(ui, {
        wrapper: ({ children }) => (
            <AllProviders queryClient={queryClient}>{children}</AllProviders>
        ),
        ...renderOptions,
    });
};

// ============================================
// Mock Functions
// ============================================

export const createMockNavigate = () => jest.fn();

export const createMockLocation = (overrides = {}) => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
    ...overrides,
});

// ============================================
// Wait Utilities
// ============================================

export const waitForLoadingToFinish = async () => {
    const loading = document.querySelector('[data-testid="loading"]');
    if (loading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
};

export const waitForElement = (selector: string, timeout = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            if (Date.now() - startTime > timeout) {
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                return;
            }

        requestAnimationFrame(checkElement);
        };

        checkElement();
    });
};

// ============================================
// Event Utilities
// ============================================

export const simulateApiDelay = (ms = 100) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const mockScrollTo = () => {
    window.scrollTo = jest.fn();
};

export const mockMatchMedia = () => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

export const mockResizeObserver = () => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
};

export const mockIntersectionObserver = () => {
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
};

// ============================================
// Storage Utilities
// ============================================

export const mockLocalStorage = () => {
    const storage: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => storage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            storage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete storage[key];
        }),
        clear: jest.fn(() => {
            Object.keys(storage).forEach((key) => delete storage[key]);
        }),
        key: jest.fn((index: number) => Object.keys(storage)[index] || null),
        get length() {
            return Object.keys(storage).length;
        },
    };
};

// ============================================
// Form Testing Utilities
// ============================================

export const fillInput = async (
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
) => {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
};

export const selectOption = async (
    selectElement: HTMLSelectElement,
    value: string
) => {
    selectElement.value = value;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
};

// ============================================
// Accessibility Testing
// ============================================

export const checkAccessibility = (element: Element) => {
    const issues: string[] = [];

    // Check for alt text on images
    element.querySelectorAll('img').forEach((img) => {
        if (!img.alt) {
            issues.push(`Image missing alt text: ${img.src}`);
        }
    });

    // Check for button labels
    element.querySelectorAll('button').forEach((button) => {
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
            issues.push('Button missing accessible label');
        }
    });

    // Check for form labels
    element.querySelectorAll('input, select, textarea').forEach((input) => {
        const id = input.id;
        if (id && !element.querySelector(`label[for="${id}"]`)) {
            if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
                issues.push(`Form field ${id} missing label`);
            }
        }
    });

    return issues;
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { customRender as render };
