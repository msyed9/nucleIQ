/**
 * Custom Hooks Unit Tests
 * Tests for reusable React hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
    useApi,
    usePaginatedApi,
    useDebounce,
    useLocalStorage,
    useModal,
    useForm,
    useConfirmDialog,
    useCopyToClipboard,
    useWindowSize,
} from '../../hooks';
import { mockLocalStorage } from '../testUtils';

// MSW Server Setup
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
});
afterAll(() => server.close());

// ============================================
// useApi Tests
// ============================================

describe('useApi', () => {
    it('should start with loading false when immediate is false', () => {
        const { result } = renderHook(() =>
            useApi({
                url: '/api/test',
                immediate: false,
            })
        );

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
    });

    it('should fetch data when execute is called', async () => {
        server.use(
            rest.get('/api/test', (req, res, ctx) => {
                return res(ctx.json({ message: 'success' }));
            })
        );

        const { result } = renderHook(() =>
            useApi<{ message: string }>({
                url: '/api/test',
                immediate: false,
            })
        );

        await act(async () => {
            await result.current.execute();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual({ message: 'success' });
        });
    });

    it('should handle errors', async () => {
        server.use(
            rest.get('/api/test', (req, res, ctx) => {
                return res(ctx.status(400), ctx.json({ detail: 'Bad request' }));
            })
        );

        const onError = jest.fn();
        const { result } = renderHook(() =>
            useApi({
                url: '/api/test',
                immediate: false,
                onError,
            })
        );

        await act(async () => {
            await result.current.execute();
        });

        await waitFor(() => {
            expect(result.current.error).not.toBe(null);
            expect(onError).toHaveBeenCalled();
        });
    });

    it('should transform response when transformResponse is provided', async () => {
        server.use(
            rest.get('/api/test', (req, res, ctx) => {
                return res(ctx.json({ items: [1, 2, 3] }));
            })
        );

        const { result } = renderHook(() =>
            useApi<number[]>({
                url: '/api/test',
                immediate: false,
                transformResponse: (data) => data.items,
            })
        );

        await act(async () => {
            await result.current.execute();
        });

        await waitFor(() => {
            expect(result.current.data).toEqual([1, 2, 3]);
        });
    });

    it('should reset state when reset is called', async () => {
        server.use(
            rest.get('/api/test', (req, res, ctx) => {
                return res(ctx.json({ data: 'test' }));
            })
        );

        const { result } = renderHook(() =>
            useApi({
                url: '/api/test',
                immediate: false,
            })
        );

        await act(async () => {
            await result.current.execute();
        });

        await waitFor(() => {
            expect(result.current.data).not.toBe(null);
        });

        act(() => {
            result.current.reset();
        });

        expect(result.current.data).toBe(null);
        expect(result.current.error).toBe(null);
    });
});

// ============================================
// usePaginatedApi Tests
// ============================================

describe('usePaginatedApi', () => {
    it('should fetch first page on mount when immediate is true', async () => {
        server.use(
            rest.get('/api/items', (req, res, ctx) => {
                return res(
                    ctx.json({
                        count: 100,
                        next: '/api/items?page=2',
                        previous: null,
                        results: [{ id: 1 }, { id: 2 }],
                    })
                );
            })
        );

        const { result } = renderHook(() =>
            usePaginatedApi<{ id: number }>({
                url: '/api/items',
                immediate: true,
            })
        );

        await waitFor(() => {
            expect(result.current.data).toHaveLength(2);
            expect(result.current.totalCount).toBe(100);
        });
    });

    it('should navigate to next page', async () => {
        let page = 1;
        server.use(
            rest.get('/api/items', (req, res, ctx) => {
                const currentPage = parseInt(req.url.searchParams.get('page') || '1');
                return res(
                    ctx.json({
                        count: 40,
                        next: currentPage < 2 ? '/api/items?page=2' : null,
                        previous: currentPage > 1 ? '/api/items?page=1' : null,
                        results: [{ id: currentPage * 10 }],
                    })
                );
            })
        );

        const { result } = renderHook(() =>
            usePaginatedApi<{ id: number }>({
                url: '/api/items',
                immediate: true,
            })
        );

        await waitFor(() => {
            expect(result.current.currentPage).toBe(1);
        });

        await act(async () => {
            await result.current.nextPage();
        });

        await waitFor(() => {
            expect(result.current.currentPage).toBe(2);
        });
    });

    it('should calculate pagination info correctly', async () => {
        server.use(
            rest.get('/api/items', (req, res, ctx) => {
                return res(
                    ctx.json({
                        count: 45,
                        next: '/api/items?page=2',
                        previous: null,
                        results: Array(20).fill({ id: 1 }),
                    })
                );
            })
        );

        const { result } = renderHook(() =>
            usePaginatedApi<{ id: number }>({
                url: '/api/items',
                pageSize: 20,
                immediate: true,
            })
        );

        await waitFor(() => {
            expect(result.current.totalPages).toBe(3);
            expect(result.current.hasNext).toBe(true);
            expect(result.current.hasPrevious).toBe(false);
        });
    });
});

// ============================================
// useDebounce Tests
// ============================================

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'initial' } }
        );

        rerender({ value: 'updated' });
        expect(result.current).toBe('initial');

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });

    it('should cancel previous debounce on new update', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'first' } }
        );

        rerender({ value: 'second' });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        rerender({ value: 'third' });
        act(() => {
            jest.advanceTimersByTime(300);
        });

        // Should still be 'first' because timer was reset
        expect(result.current).toBe('first');

        act(() => {
            jest.advanceTimersByTime(200);
        });

        expect(result.current).toBe('third');
    });
});

// ============================================
// useLocalStorage Tests
// ============================================

describe('useLocalStorage', () => {
    const localStorageMock = mockLocalStorage();

    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        });
        localStorageMock.clear();
    });

    it('should return initial value when no stored value exists', () => {
        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'defaultValue')
        );
        expect(result.current[0]).toBe('defaultValue');
    });

    it('should return stored value when it exists', () => {
        localStorageMock.setItem('testKey', JSON.stringify('storedValue'));

        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'defaultValue')
        );
        expect(result.current[0]).toBe('storedValue');
    });

    it('should update stored value', () => {
        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'initial')
        );

        act(() => {
            result.current[1]('updated');
        });

        expect(result.current[0]).toBe('updated');
        expect(JSON.parse(localStorageMock.getItem('testKey')!)).toBe('updated');
    });

    it('should remove stored value', () => {
        localStorageMock.setItem('testKey', JSON.stringify('value'));

        const { result } = renderHook(() =>
            useLocalStorage('testKey', 'default')
        );

        act(() => {
            result.current[2](); // removeValue
        });

        expect(result.current[0]).toBe('default');
        expect(localStorageMock.getItem('testKey')).toBe(null);
    });
});

// ============================================
// useModal Tests
// ============================================

describe('useModal', () => {
    it('should start closed by default', () => {
        const { result } = renderHook(() => useModal());
        expect(result.current.isOpen).toBe(false);
        expect(result.current.data).toBe(null);
    });

    it('should start open when initialOpen is true', () => {
        const { result } = renderHook(() => useModal(true));
        expect(result.current.isOpen).toBe(true);
    });

    it('should open modal with data', () => {
        const { result } = renderHook(() => useModal<{ id: number }>());

        act(() => {
            result.current.open({ id: 123 });
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.data).toEqual({ id: 123 });
    });

    it('should close modal and clear data', () => {
        const { result } = renderHook(() => useModal<{ id: number }>());

        act(() => {
            result.current.open({ id: 123 });
        });

        act(() => {
            result.current.close();
        });

        expect(result.current.isOpen).toBe(false);
        expect(result.current.data).toBe(null);
    });

    it('should toggle modal state', () => {
        const { result } = renderHook(() => useModal());

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(true);

        act(() => {
            result.current.toggle();
        });
        expect(result.current.isOpen).toBe(false);
    });
});

// ============================================
// useForm Tests
// ============================================

describe('useForm', () => {
    it('should initialize with initial values', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '', email: '' },
                onSubmit: jest.fn(),
            })
        );

        expect(result.current.values).toEqual({ name: '', email: '' });
    });

    it('should update field value on change', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '' },
                onSubmit: jest.fn(),
            })
        );

        act(() => {
            const event = {
                target: { value: 'John', type: 'text' },
            } as React.ChangeEvent<HTMLInputElement>;
            result.current.handleChange('name')(event);
        });

        expect(result.current.values.name).toBe('John');
    });

    it('should validate on blur', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { email: '' },
                validate: (values) => {
                    const errors: Partial<Record<'email', string>> = {};
                    if (!values.email) errors.email = 'Email is required';
                    return errors;
                },
                onSubmit: jest.fn(),
            })
        );

        act(() => {
            result.current.handleBlur('email')();
        });

        expect(result.current.touched.email).toBe(true);
        expect(result.current.errors.email).toBe('Email is required');
    });

    it('should call onSubmit when form is valid', async () => {
        const onSubmit = jest.fn();
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'John' },
                onSubmit,
            })
        );

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should not call onSubmit when form is invalid', async () => {
        const onSubmit = jest.fn();
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: '' },
                validate: (values) => {
                    const errors: Partial<Record<'name', string>> = {};
                    if (!values.name) errors.name = 'Name is required';
                    return errors;
                },
                onSubmit,
            })
        );

        await act(async () => {
            await result.current.handleSubmit();
        });

        expect(onSubmit).not.toHaveBeenCalled();
        expect(result.current.errors.name).toBe('Name is required');
    });

    it('should reset form to initial values', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'Initial' },
                onSubmit: jest.fn(),
            })
        );

        act(() => {
            result.current.setFieldValue('name', 'Changed');
        });

        expect(result.current.values.name).toBe('Changed');

        act(() => {
            result.current.resetForm();
        });

        expect(result.current.values.name).toBe('Initial');
    });

    it('should track dirty state', () => {
        const { result } = renderHook(() =>
            useForm({
                initialValues: { name: 'Initial' },
                onSubmit: jest.fn(),
            })
        );

        expect(result.current.isDirty).toBe(false);

        act(() => {
            result.current.setFieldValue('name', 'Changed');
        });

        expect(result.current.isDirty).toBe(true);
    });
});

// ============================================
// useConfirmDialog Tests
// ============================================

describe('useConfirmDialog', () => {
    it('should start closed', () => {
        const { result } = renderHook(() => useConfirmDialog());
        expect(result.current.isOpen).toBe(false);
    });

    it('should open with options', () => {
        const { result } = renderHook(() => useConfirmDialog());

        act(() => {
            result.current.confirm({
                title: 'Delete?',
                message: 'Are you sure?',
                onConfirm: jest.fn(),
            });
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.options?.title).toBe('Delete?');
    });

    it('should call onConfirm and close on confirm', async () => {
        const onConfirm = jest.fn();
        const { result } = renderHook(() => useConfirmDialog());

        act(() => {
            result.current.confirm({
                title: 'Confirm',
                message: 'Proceed?',
                onConfirm,
            });
        });

        await act(async () => {
            await result.current.handleConfirm();
        });

        expect(onConfirm).toHaveBeenCalled();
        expect(result.current.isOpen).toBe(false);
    });

    it('should call onCancel and close on cancel', () => {
        const onCancel = jest.fn();
        const { result } = renderHook(() => useConfirmDialog());

        act(() => {
            result.current.confirm({
                title: 'Confirm',
                message: 'Proceed?',
                onConfirm: jest.fn(),
                onCancel,
            });
        });

        act(() => {
            result.current.handleCancel();
        });

        expect(onCancel).toHaveBeenCalled();
        expect(result.current.isOpen).toBe(false);
    });
});

// ============================================
// useCopyToClipboard Tests
// ============================================

describe('useCopyToClipboard', () => {
    const originalClipboard = navigator.clipboard;

    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: jest.fn().mockResolvedValue(undefined),
            },
            writable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: originalClipboard,
        });
    });

    it('should copy text to clipboard', async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            const success = await result.current.copy('test text');
            expect(success).toBe(true);
        });

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
        expect(result.current.copied).toBe(true);
    });

    it('should reset copied state after delay', async () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useCopyToClipboard(1000));

        await act(async () => {
            await result.current.copy('test');
        });

        expect(result.current.copied).toBe(true);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(result.current.copied).toBe(false);
        jest.useRealTimers();
    });
});

// ============================================
// useWindowSize Tests
// ============================================

describe('useWindowSize', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            value: originalInnerWidth,
            writable: true,
        });
        Object.defineProperty(window, 'innerHeight', {
            value: originalInnerHeight,
            writable: true,
        });
    });

    it('should return current window size', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

        const { result } = renderHook(() => useWindowSize());

        expect(result.current.width).toBe(1024);
        expect(result.current.height).toBe(768);
    });

    it('should detect mobile viewport', () => {
        Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

        const { result } = renderHook(() => useWindowSize());

        expect(result.current.isMobile).toBe(true);
        expect(result.current.isTablet).toBe(false);
        expect(result.current.isDesktop).toBe(false);
    });

    it('should detect tablet viewport', () => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });

        const { result } = renderHook(() => useWindowSize());

        expect(result.current.isMobile).toBe(false);
        expect(result.current.isTablet).toBe(true);
        expect(result.current.isDesktop).toBe(false);
    });

    it('should update on window resize', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });

        const { result } = renderHook(() => useWindowSize());

        expect(result.current.isDesktop).toBe(true);

        act(() => {
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            window.dispatchEvent(new Event('resize'));
        });

        expect(result.current.isMobile).toBe(true);
    });
});
