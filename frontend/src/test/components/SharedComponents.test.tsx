/**
 * Shared Components Unit Tests
 * Tests for reusable UI components
 */

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    render,
    createMockStudent,
    createMockFeeInvoice,
    mockMatchMedia,
    mockResizeObserver,
} from '../testUtils';
import {
    PageHeader,
    DataCard,
    EmptyState,
    LoadingSpinner,
    StatusBadge,
    ConfirmDialog,
    DataTable,
    Pagination,
    SearchInput,
    FilterDropdown,
    Tabs,
} from '../../components/shared/SharedComponents';

// Setup
beforeAll(() => {
    mockMatchMedia();
    mockResizeObserver();
});

// ============================================
// PageHeader Tests
// ============================================

describe('PageHeader', () => {
    it('renders title correctly', () => {
        render(<PageHeader title="Test Page" />);
        expect(screen.getByText('Test Page')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
        render(<PageHeader title="Test Page" subtitle="This is a subtitle" />);
        expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
    });

    it('renders breadcrumbs when provided', () => {
        const breadcrumbs = [
            { label: 'Home', href: '/' },
            { label: 'Students', href: '/students' },
            { label: 'Details' },
        ];
        render(<PageHeader title="Student Details" breadcrumbs={breadcrumbs} />);

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Students')).toBeInTheDocument();
        expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('renders action buttons when provided', () => {
        const actions = <button>Add New</button>;
        render(<PageHeader title="Test" actions={actions} />);
        expect(screen.getByText('Add New')).toBeInTheDocument();
    });
});

// ============================================
// DataCard Tests
// ============================================

describe('DataCard', () => {
    it('renders title and value', () => {
        render(<DataCard title="Total Students" value={500} />);
        expect(screen.getByText('Total Students')).toBeInTheDocument();
        expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('shows loading skeleton when loading', () => {
        const { container } = render(
            <DataCard title="Loading" value={0} loading />
        );
        expect(container.querySelector('.data-card-skeleton')).toBeInTheDocument();
    });

    it('displays trend indicator when provided', () => {
        render(
            <DataCard
                title="Revenue"
                value="₹50,000"
                trend={{ value: 15, direction: 'up', label: 'vs last month' }}
            />
        );
        expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('calls onClick when clickable', async () => {
        const handleClick = jest.fn();
        render(<DataCard title="Clickable" value={100} onClick={handleClick} />);

        await userEvent.click(screen.getByText('100'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});

// ============================================
// EmptyState Tests
// ============================================

describe('EmptyState', () => {
    it('renders title', () => {
        render(<EmptyState title="No data found" />);
        expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(
            <EmptyState
                title="No students"
                description="Add students to get started"
            />
        );
        expect(screen.getByText('Add students to get started')).toBeInTheDocument();
    });

    it('renders action button when provided', async () => {
        const handleAction = jest.fn();
        render(
            <EmptyState
                title="No data"
                action={{ label: 'Add Item', onClick: handleAction }}
            />
        );

        await userEvent.click(screen.getByText('Add Item'));
        expect(handleAction).toHaveBeenCalledTimes(1);
    });
});

// ============================================
// LoadingSpinner Tests
// ============================================

describe('LoadingSpinner', () => {
    it('renders spinner', () => {
        const { container } = render(<LoadingSpinner />);
        expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('renders with text', () => {
        render(<LoadingSpinner text="Loading data..." />);
        expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('applies size class correctly', () => {
        const { container } = render(<LoadingSpinner size="large" />);
        expect(container.querySelector('.loading-spinner-large')).toBeInTheDocument();
    });

    it('renders fullpage overlay when specified', () => {
        const { container } = render(<LoadingSpinner fullPage />);
        expect(container.querySelector('.loading-fullpage')).toBeInTheDocument();
    });
});

// ============================================
// StatusBadge Tests
// ============================================

describe('StatusBadge', () => {
    it('renders status text', () => {
        render(<StatusBadge status="ACTIVE" />);
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('replaces underscores with spaces', () => {
        render(<StatusBadge status="IN_PROGRESS" />);
        expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    });

    it('applies dot variant correctly', () => {
        const { container } = render(<StatusBadge status="Active" variant="dot" />);
        expect(container.querySelector('.status-dot')).toBeInTheDocument();
    });

    it('applies custom colors when provided', () => {
        const { container } = render(
            <StatusBadge
                status="Custom"
                customColors={{ background: '#ff0000', text: '#ffffff' }}
            />
        );
        const badge = container.querySelector('.status-badge');
        expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
    });
});

// ============================================
// ConfirmDialog Tests
// ============================================

describe('ConfirmDialog', () => {
    it('does not render when closed', () => {
        render(
            <ConfirmDialog
                isOpen={false}
                title="Confirm"
                message="Are you sure?"
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('renders when open', () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Delete Item"
                message="Are you sure you want to delete?"
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', async () => {
        const handleConfirm = jest.fn();
        render(
            <ConfirmDialog
                isOpen={true}
                title="Confirm"
                message="Proceed?"
                onConfirm={handleConfirm}
                onCancel={jest.fn()}
            />
        );

        await userEvent.click(screen.getByText('Confirm'));
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', async () => {
        const handleCancel = jest.fn();
        render(
            <ConfirmDialog
                isOpen={true}
                title="Confirm"
                message="Proceed?"
                onConfirm={jest.fn()}
                onCancel={handleCancel}
            />
        );

        await userEvent.click(screen.getByText('Cancel'));
        expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('shows loading state', () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Confirm"
                message="Processing..."
                isLoading={true}
                onConfirm={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(container.querySelector('.spinner')).toBeInTheDocument();
    });
});

// ============================================
// DataTable Tests
// ============================================

describe('DataTable', () => {
    const mockData = [
        createMockStudent({ id: '1', first_name: 'John', last_name: 'Doe' }),
        createMockStudent({ id: '2', first_name: 'Jane', last_name: 'Smith' }),
    ];

    const columns = [
        { key: 'first_name', header: 'First Name' },
        { key: 'last_name', header: 'Last Name' },
        { key: 'status', header: 'Status' },
    ];

    it('renders column headers', () => {
        render(<DataTable data={mockData} columns={columns} />);
        expect(screen.getByText('First Name')).toBeInTheDocument();
        expect(screen.getByText('Last Name')).toBeInTheDocument();
    });

    it('renders data rows', () => {
        render(<DataTable data={mockData} columns={columns} />);
        expect(screen.getByText('John')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
    });

    it('shows empty state when no data', () => {
        render(<DataTable data={[]} columns={columns} emptyMessage="No students" />);
        expect(screen.getByText('No students')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<DataTable data={[]} columns={columns} loading />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('handles row click', async () => {
        const handleRowClick = jest.fn();
        render(
            <DataTable
                data={mockData}
                columns={columns}
                onRowClick={handleRowClick}
            />
        );

        await userEvent.click(screen.getByText('John'));
        expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('handles row selection', async () => {
        const handleSelection = jest.fn();
        render(
            <DataTable
                data={mockData}
                columns={columns}
                selectable
                selectedIds={[]}
                onSelectionChange={handleSelection}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        await userEvent.click(checkboxes[1]); // First row checkbox
        expect(handleSelection).toHaveBeenCalled();
    });

    it('renders custom cell content', () => {
        const columnsWithRender = [
            ...columns,
            {
                key: 'actions',
                header: 'Actions',
                render: (item: any) => <button>Edit {item.first_name}</button>,
            },
        ];

        render(<DataTable data={mockData} columns={columnsWithRender} />);
        expect(screen.getByText('Edit John')).toBeInTheDocument();
    });
});

// ============================================
// Pagination Tests
// ============================================

describe('Pagination', () => {
    it('renders page numbers', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={jest.fn()}
            />
        );
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('disables previous on first page', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={jest.fn()}
            />
        );
        const prevButtons = screen.getAllByText('«');
        expect(prevButtons[0]).toBeDisabled();
    });

    it('disables next on last page', () => {
        render(
            <Pagination
                currentPage={5}
                totalPages={5}
                onPageChange={jest.fn()}
            />
        );
        const nextButtons = screen.getAllByText('»');
        expect(nextButtons[0]).toBeDisabled();
    });

    it('calls onPageChange with correct page', async () => {
        const handlePageChange = jest.fn();
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                onPageChange={handlePageChange}
            />
        );

        await userEvent.click(screen.getByText('3'));
        expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    it('shows page info when enabled', () => {
        render(
            <Pagination
                currentPage={1}
                totalPages={5}
                totalItems={100}
                pageSize={20}
                onPageChange={jest.fn()}
                showInfo
            />
        );
        expect(screen.getByText(/Showing 1 to 20 of 100/)).toBeInTheDocument();
    });
});

// ============================================
// SearchInput Tests
// ============================================

describe('SearchInput', () => {
    it('renders with placeholder', () => {
        render(
            <SearchInput
                value=""
                onChange={jest.fn()}
                placeholder="Search students..."
            />
        );
        expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument();
    });

    it('calls onChange with debounce', async () => {
        jest.useFakeTimers();
        const handleChange = jest.fn();

        render(
            <SearchInput
                value=""
                onChange={handleChange}
                debounceMs={300}
            />
        );

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });

        expect(handleChange).not.toHaveBeenCalled();

        jest.advanceTimersByTime(300);
        expect(handleChange).toHaveBeenCalledWith('test');

        jest.useRealTimers();
    });

    it('shows clear button when has value', () => {
        render(
            <SearchInput
                value="test"
                onChange={jest.fn()}
            />
        );
        expect(screen.getByText('✕')).toBeInTheDocument();
    });
});

// ============================================
// FilterDropdown Tests
// ============================================

describe('FilterDropdown', () => {
    const options = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    it('renders label and options', () => {
        render(
            <FilterDropdown
                label="Status"
                value=""
                options={options}
                onChange={jest.fn()}
            />
        );
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('calls onChange when option selected', async () => {
        const handleChange = jest.fn();
        render(
            <FilterDropdown
                label="Status"
                value=""
                options={options}
                onChange={handleChange}
            />
        );

        const select = screen.getByRole('combobox');
        await userEvent.selectOptions(select, 'active');
        expect(handleChange).toHaveBeenCalledWith('active');
    });
});

// ============================================
// Tabs Tests
// ============================================

describe('Tabs', () => {
    const tabs = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
        { id: 'tab3', label: 'Tab 3', disabled: true },
    ];

    it('renders all tabs', () => {
        render(<Tabs tabs={tabs} activeTab="tab1" onChange={jest.fn()} />);
        expect(screen.getByText('Tab 1')).toBeInTheDocument();
        expect(screen.getByText('Tab 2')).toBeInTheDocument();
        expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('highlights active tab', () => {
        render(<Tabs tabs={tabs} activeTab="tab1" onChange={jest.fn()} />);
        const activeTab = screen.getByText('Tab 1').closest('button');
        expect(activeTab).toHaveClass('active');
    });

    it('calls onChange when tab clicked', async () => {
        const handleChange = jest.fn();
        render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleChange} />);

        await userEvent.click(screen.getByText('Tab 2'));
        expect(handleChange).toHaveBeenCalledWith('tab2');
    });

    it('does not call onChange for disabled tabs', async () => {
        const handleChange = jest.fn();
        render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleChange} />);

        await userEvent.click(screen.getByText('Tab 3'));
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('renders badge when provided', () => {
        const tabsWithBadge = [
            { id: 'tab1', label: 'Notifications', badge: 5 },
        ];
        render(<Tabs tabs={tabsWithBadge} activeTab="tab1" onChange={jest.fn()} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });
});
