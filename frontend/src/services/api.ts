import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_VERSION = 'v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Utility to get a versioned URL
 * @param path The endpoint path (e.g., '/students/')
 * @param version The version string (e.g., 'v1', 'v2')
 */
export const getVersionedUrl = (path: string, version: string = DEFAULT_VERSION) => {
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${version}/${cleanPath}`;
};

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Support both new 'access_token' and legacy 'token' keys for backward compatibility
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Add tenant header if available and user is NOT a platform admin.
        try {
            const isPlatformAdmin = localStorage.getItem('is_platform_admin') === 'true';
            if (!isPlatformAdmin) {
                const tenant = localStorage.getItem('current_tenant');
                if (tenant) {
                    config.headers['X-Tenant-ID'] = tenant;
                } else {
                    const userRaw = localStorage.getItem('user');
                    if (userRaw) {
                        const user = JSON.parse(userRaw);
                        if (user && user.tenant) {
                            config.headers['X-Tenant-ID'] = String(user.tenant);
                        }
                    }
                }
            } else {
                // ensure no tenant header is sent for platform admins
                if (config.headers && config.headers['X-Tenant-ID']) {
                    delete config.headers['X-Tenant-ID'];
                }
            }
        } catch (e) {
            // Ignore JSON parse errors and continue without tenant header
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('access_token', access);

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');

                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        // If 403 or other errors, don't redirect - just reject
        // This allows components to handle errors gracefully
        return Promise.reject(error);
    }
);

export default api;
