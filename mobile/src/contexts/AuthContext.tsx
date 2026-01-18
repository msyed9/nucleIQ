import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../services/api';

export interface Role {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
}

export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    tenant?: string;
    tenant_name?: string;
    is_platform_admin: boolean;
    is_parent?: boolean;
    roles: Role[];
    permissions: string[];
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthContextType {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    checkPermission: (resource: string, action: string) => boolean;
    hasPermission: (module: string, action: string) => boolean;
    isRole: (roleCode: string) => boolean;
    isSuperadmin: () => boolean;
}

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

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const storedTokens = await AsyncStorage.getItem('auth_tokens');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedTokens && storedUser) {
                const parsedTokens = JSON.parse(storedTokens);
                const parsedUser = JSON.parse(storedUser);

                setTokens(parsedTokens);
                setUser(parsedUser);

                // Fetch fresh user data
                try {
                    const freshUser = await userAPI.getProfile();
                    setUser(freshUser);
                    await AsyncStorage.setItem('user', JSON.stringify(freshUser));
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            }
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            await AsyncStorage.removeItem('auth_tokens');
            await AsyncStorage.removeItem('user');
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            const response = await authAPI.login(credentials);

            const authTokens: AuthTokens = {
                access: response.access,
                refresh: response.refresh,
            };

            setTokens(authTokens);
            setUser(response.user);

            await AsyncStorage.setItem('auth_tokens', JSON.stringify(authTokens));
            await AsyncStorage.setItem('user', JSON.stringify(response.user));
            await AsyncStorage.setItem('access_token', response.access);
            await AsyncStorage.setItem('refresh_token', response.refresh);

            if (response.user.tenant) {
                await AsyncStorage.setItem('current_tenant', response.user.tenant);
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
            await AsyncStorage.multiRemove([
                'auth_tokens',
                'user',
                'current_tenant',
                'access_token',
                'refresh_token',
            ]);
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
            await AsyncStorage.setItem('auth_tokens', JSON.stringify(newTokens));
            await AsyncStorage.setItem('access_token', response.access);
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
            throw error;
        }
    }, [tokens, logout]);

    const checkPermission = useCallback((resource: string, action: string): boolean => {
        if (!user) return false;
        if (user.is_platform_admin) return true;
        if (user.permissions.includes('*')) return true;
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

    const value: AuthContextType = {
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        logout,
        refreshToken,
        checkPermission,
        hasPermission,
        isRole,
        isSuperadmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
