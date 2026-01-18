/**
 * API client utilities for authentication and user management
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
    LoginCredentials,
    LoginResponse,
    User,
    UserPreference,
    ChangePasswordData,
    ResetPasswordData,
    ResetPasswordConfirmData,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const tokens = localStorage.getItem('auth_tokens');
        if (tokens) {
            const { access } = JSON.parse(tokens);
            config.headers.Authorization = `Bearer ${access}`;
        }

        // Add tenant header if available and user is NOT a platform admin
        try {
            const isPlatformAdmin = localStorage.getItem('is_platform_admin') === 'true';
            if (!isPlatformAdmin) {
                const tenant = localStorage.getItem('current_tenant');
                if (tenant) {
                    config.headers['X-Tenant-ID'] = tenant;
                }
            } else {
                if (config.headers && config.headers['X-Tenant-ID']) {
                    delete config.headers['X-Tenant-ID'];
                }
            }
        } catch (e) {
            // ignore
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const tokens = localStorage.getItem('auth_tokens');
                if (tokens) {
                    const { refresh } = JSON.parse(tokens);
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                        refresh,
                    });

                    const newTokens = {
                        access: response.data.access,
                        refresh,
                    };

                    localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('auth_tokens');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
        return response.data;
    },

    logout: async (refreshToken: string): Promise<void> => {
        await apiClient.post('/auth/logout/', { refresh_token: refreshToken });
    },

    refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
        const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
        return response.data;
    },

    changePassword: async (data: ChangePasswordData): Promise<void> => {
        await apiClient.post('/auth/change-password/', data);
    },

    resetPassword: async (data: ResetPasswordData): Promise<void> => {
        await apiClient.post('/auth/reset-password/', data);
    },

    resetPasswordConfirm: async (data: ResetPasswordConfirmData): Promise<void> => {
        await apiClient.post('/auth/reset-password/confirm/', data);
    },
};

// User API
export const userAPI = {
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get<User>('/users/me/');
        return response.data;
    },

    updatePreferences: async (preferences: Partial<UserPreference>): Promise<UserPreference> => {
        const response = await apiClient.patch<UserPreference>('/users/preferences/', preferences);
        return response.data;
    },
};

export default apiClient;
