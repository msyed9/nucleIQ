/**
 * TypeScript type definitions for authentication and user management
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  short_name: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  is_2fa_enabled: boolean;
  is_platform_admin: boolean;
  tenant?: string;
  tenant_name?: string;
  tenant_branding?: TenantBranding;
  roles: Role[];
  permissions: string[];
  preference: UserPreference;
  last_login?: string;
  date_joined: string;
}

export interface UserPreference {
  theme_mode: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable';
  language: 'en' | 'hi' | 'ar' | 'ur';
  notification_channels: NotificationChannels;
  sidebar_collapsed: boolean;
  dashboard_widgets: DashboardWidget[];
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  is_rtl: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannels {
  email?: boolean;
  sms?: boolean;
  whatsapp?: boolean;
  push?: boolean;
}

export interface DashboardWidget {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible?: boolean;
}

export interface TenantBranding {
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  sidebar_color: string;
  font_family: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  permissions: Permission[];
  user_count?: number;
  tenant?: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import';
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ResetPasswordConfirmData {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreference>) => Promise<void>;
  checkPermission: (resource: string, action: string) => boolean;
  hasPermission: (module: string, action: string) => boolean;
  isRole: (roleCode: string) => boolean;
  isSuperadmin: () => boolean;
  getUserRoles: () => Role[];
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  branding: TenantBranding | null;
  language: string;
  isRTL: boolean;
  setLanguage: (lang: string) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
}
