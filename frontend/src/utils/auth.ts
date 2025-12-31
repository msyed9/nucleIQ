export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    tenant?: {
        id: string;
        name: string;
    };
    is_platform_admin: boolean;
    roles?: string[];
}

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh');
};

export const getUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

export const setAuthData = (token: string, refresh: string, user: User): void => {
    localStorage.setItem('token', token);
    localStorage.setItem('refresh', refresh);
    localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const logout = (): void => {
    clearAuthData();
    window.location.href = '/login';
};
