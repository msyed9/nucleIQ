# Language Preference Settings - Implementation Summary

## Overview
Added a comprehensive **Preferences** section to the Settings page that allows users to customize their experience with language, theme, and timezone settings.

## What Was Added

### Frontend Changes

#### Settings Component (`frontend/src/pages/settings/Settings.tsx`)

Added a new **Preferences** card section with the following fields:

1. **Language Selection**
   - English
   - Hindi (हिंदी)
   - Arabic (العربية)
   - Urdu (اردو)

2. **Theme Mode**
   - Light
   - Dark
   - System Default

3. **Timezone**
   - UTC
   - Asia/Kolkata (IST)
   - America/New_York (EST)
   - Europe/London (GMT)
   - Asia/Dubai (GST)

### Backend Support

The backend already has full support for user preferences through:

#### Model: `UserPreference` (`backend/users/models.py`)
- `language`: CharField with choices (en, hi, ar, ur)
- `theme_mode`: CharField with choices (light, dark, system)
- `timezone`: CharField for timezone
- `density`: UI density preference
- `notification_channels`: JSON field for notification preferences
- `sidebar_collapsed`: Boolean for sidebar state
- `dashboard_widgets`: JSON field for dashboard customization

#### API Endpoint
- **PATCH** `/api/users/preferences/` - Update current user preferences
- Located in `backend/users/views.py` (UserViewSet.preferences method)

## Next Steps - API Integration

To fully integrate the preferences with the backend, you need to:

### 1. Create an API Service

Create `frontend/src/services/userService.ts`:

```typescript
import api from './api';

export interface UserPreferences {
    language: string;
    theme_mode: string;
    timezone: string;
    density?: string;
    notification_channels?: Record<string, boolean>;
    sidebar_collapsed?: boolean;
    dashboard_widgets?: any[];
}

export const getUserPreferences = async (): Promise<UserPreferences> => {
    const response = await api.get('/users/me/');
    return response.data.preference;
};

export const updateUserPreferences = async (
    preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
    const response = await api.patch('/users/preferences/', preferences);
    return response.data;
};
```

### 2. Update Settings Component

Replace the current implementation with API calls:

```typescript
import { useEffect } from 'react';
import { getUserPreferences, updateUserPreferences } from '../../services/userService';

// Inside component:
useEffect(() => {
    // Load user preferences on mount
    const loadPreferences = async () => {
        try {
            const prefs = await getUserPreferences();
            setLanguage(prefs.language || 'en');
            setThemeMode(prefs.theme_mode || 'system');
            setTimezone(prefs.timezone || 'UTC');
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    };
    loadPreferences();
}, []);

const handlePreferencesSave = async () => {
    try {
        await updateUserPreferences({
            language,
            theme_mode: themeMode,
            timezone
        });
        alert('Preferences saved successfully!');
    } catch (error) {
        console.error('Failed to save preferences:', error);
        alert('Failed to save preferences. Please try again.');
    }
};
```

### 3. Implement Language Switching

To actually implement language switching across the app:

1. **Install i18n library**: `npm install react-i18next i18next`
2. **Configure i18next** with language files for each supported language
3. **Apply RTL layout** for Arabic and Urdu (the backend has an `is_rtl` property)
4. **Update the app** to use the selected language from user preferences

### 4. Implement Theme Switching

Apply the theme mode preference:

```typescript
// In App.tsx or a theme context
useEffect(() => {
    const applyTheme = (theme: string) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark-mode');
        } else {
            // System default
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark-mode', prefersDark);
        }
    };
    applyTheme(themeMode);
}, [themeMode]);
```

## Features Supported by Backend

The `UserPreference` model supports additional features that can be added to the UI:

- **UI Density**: Compact vs Comfortable spacing
- **Notification Channels**: Email, SMS, WhatsApp, Push notifications
- **Sidebar State**: Collapsed or expanded by default
- **Dashboard Widgets**: Customizable dashboard layout
- **Date Format**: Preferred date format (YYYY-MM-DD, etc.)
- **Time Format**: 12h or 24h

## Testing

1. Navigate to Settings page
2. Change language, theme, or timezone
3. Click "Save Preferences"
4. Verify the alert shows success
5. (After API integration) Refresh the page and verify preferences are persisted

## Notes

- The backend automatically creates a `UserPreference` record when a new user is created (via signals)
- RTL support is built-in for Arabic and Urdu languages
- All preferences are user-specific and stored per user account
