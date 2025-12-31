// Format date to readable string
export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Format date and time
export const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format currency (Indian Rupees)
export const formatCurrency = (amount: number | string): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(Number(amount));
};

// Format number with commas
export const formatNumber = (num: number | string): string => {
    return new Intl.NumberFormat('en-IN').format(Number(num));
};

// Truncate text
export const truncate = (text: string, length: number): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

// Get initials from name
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout as any);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Get status color
export const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
        active: '#10b981',
        inactive: '#6b7280',
        pending: '#f59e0b',
        approved: '#10b981',
        rejected: '#ef4444',
        paid: '#10b981',
        unpaid: '#ef4444',
        partial: '#f59e0b',
    };
    return statusColors[status.toLowerCase()] || '#6b7280';
};

// Download file
export const downloadFile = (blob: Blob, filename: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
