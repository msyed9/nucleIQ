/**
 * Authentication Context Provider
 * Manages user authentication state, tokens, and permissions
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
    User,
    AuthTokens,
    LoginCredentials,
    UserPreference,
    AuthContextType,
    Role,
} from '../types/auth';
import { authAPI, userAPI } from '../lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tokens, setTokens] = useState<AuthTokens | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedTokens = localStorage.getItem('auth_tokens');
                const storedUser = localStorage.getItem('user');

                if (storedTokens && storedUser) {
                    const parsedTokens = JSON.parse(storedTokens);
                    const parsedUser = JSON.parse(storedUser);

                    setTokens(parsedTokens);
                    setUser(parsedUser);

                    // Fetch fresh user data
                    try {
                        const freshUser = await userAPI.getProfile();
                        setUser(freshUser);
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    } catch (error) {
                        console.error('Failed to fetch user profile:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                localStorage.removeItem('auth_tokens');
                localStorage.removeItem('user');
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            const response = await authAPI.login(credentials);

            const authTokens: AuthTokens = {
                access: response.access,
                refresh: response.refresh,
            };

            setTokens(authTokens);
            setUser(response.user);

            localStorage.setItem('auth_tokens', JSON.stringify(authTokens));
            localStorage.setItem('user', JSON.stringify(response.user));

            // Store tenant if available
            if (response.user.tenant) {
                localStorage.setItem('current_tenant', response.user.tenant);
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (tokens?.refresh) {
                await authAPI.logout(tokens.refresh);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setTokens(null);
            localStorage.removeItem('auth_tokens');
            localStorage.removeItem('user');
            localStorage.removeItem('current_tenant');
        }
    }, [tokens]);

    const refreshToken = useCallback(async () => {
        try {
            if (!tokens?.refresh) {
                throw new Error('No refresh token available');
            }

            const response = await authAPI.refreshToken(tokens.refresh);

            const newTokens: AuthTokens = {
                access: response.access,
                refresh: tokens.refresh,
            };

            setTokens(newTokens);
            localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
            throw error;
        }
    }, [tokens, logout]);

    const updatePreferences = useCallback(async (preferences: Partial<UserPreference>) => {
        try {
            const updatedPreferences = await userAPI.updatePreferences(preferences);

            if (user) {
                const updatedUser = {
                    ...user,
                    preference: updatedPreferences,
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Failed to update preferences:', error);
            throw error;
        }
    }, [user]);

    const checkPermission = useCallback((resource: string, action: string): boolean => {
        if (!user) return false;

        // Platform admins and superusers have all permissions
        if (user.is_platform_admin) return true;

        // Check if user has wildcard permission
        if (user.permissions.includes('*')) return true;

        // Check specific permission
        const permissionCode = `${resource}.${action}`;
        return user.permissions.includes(permissionCode);
    }, [user]);

    const hasPermission = useCallback((module: string, action: string): boolean => {
        return checkPermission(module, action);
    }, [checkPermission]);

    const isRole = useCallback((roleCode: string): boolean => {
        if (!user) return false;
        return user.roles.some(role => role.code === roleCode && role.is_active);
    }, [user]);

    const isSuperadmin = useCallback((): boolean => {
        if (!user) return false;
        return user.is_platform_admin;
    }, [user]);

    const getUserRoles = useCallback((): Role[] => {
        if (!user) return [];
        return user.roles.filter(role => role.is_active);
    }, [user]);

    const value: AuthContextType = {
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        logout,
        refreshToken,
        updatePreferences,
        checkPermission,
        hasPermission,
        isRole,
        isSuperadmin,
        getUserRoles,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
