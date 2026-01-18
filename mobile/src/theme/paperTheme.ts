import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
    displayLarge: { fontFamily: 'System', fontSize: 57, fontWeight: '400' as const },
    displayMedium: { fontFamily: 'System', fontSize: 45, fontWeight: '400' as const },
    displaySmall: { fontFamily: 'System', fontSize: 36, fontWeight: '400' as const },
    headlineLarge: { fontFamily: 'System', fontSize: 32, fontWeight: '400' as const },
    headlineMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '400' as const },
    headlineSmall: { fontFamily: 'System', fontSize: 24, fontWeight: '400' as const },
    titleLarge: { fontFamily: 'System', fontSize: 22, fontWeight: '500' as const },
    titleMedium: { fontFamily: 'System', fontSize: 16, fontWeight: '500' as const },
    titleSmall: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const },
    labelLarge: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const },
    labelMedium: { fontFamily: 'System', fontSize: 12, fontWeight: '500' as const },
    labelSmall: { fontFamily: 'System', fontSize: 11, fontWeight: '500' as const },
    bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const },
    bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '400' as const },
    bodySmall: { fontFamily: 'System', fontSize: 12, fontWeight: '400' as const },
};

// NucleiQ Brand Colors
const colors = {
    primary: '#1E3A5F', // Deep Navy Blue
    secondary: '#2E7D32', // Forest Green
    tertiary: '#FF6B35', // Vibrant Orange
    accent: '#00BCD4', // Cyan
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',

    // Light theme surfaces
    lightBackground: '#F5F7FA',
    lightSurface: '#FFFFFF',
    lightSurfaceVariant: '#E8EDF2',

    // Dark theme surfaces
    darkBackground: '#0D1B2A',
    darkSurface: '#1B2838',
    darkSurfaceVariant: '#253449',
};

export const customTheme = {
    ...MD3LightTheme,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
        ...MD3LightTheme.colors,
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary,
        background: colors.lightBackground,
        surface: colors.lightSurface,
        surfaceVariant: colors.lightSurfaceVariant,
        error: colors.error,
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#1A1A1A',
        onSurface: '#1A1A1A',
        outline: '#C4C4C4',
        elevation: {
            level0: 'transparent',
            level1: colors.lightSurface,
            level2: colors.lightSurfaceVariant,
            level3: '#E0E5EB',
            level4: '#D8DFE6',
            level5: '#D0D8E0',
        },
    },
    roundness: 12,
};

export const customDarkTheme = {
    ...MD3DarkTheme,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#4A90D9', // Lighter blue for dark theme
        secondary: '#66BB6A',
        tertiary: '#FF8A65',
        background: colors.darkBackground,
        surface: colors.darkSurface,
        surfaceVariant: colors.darkSurfaceVariant,
        error: '#EF5350',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onBackground: '#E8E8E8',
        onSurface: '#E8E8E8',
        outline: '#4A5568',
        elevation: {
            level0: 'transparent',
            level1: colors.darkSurface,
            level2: colors.darkSurfaceVariant,
            level3: '#2D3E50',
            level4: '#354758',
            level5: '#3D5060',
        },
    },
    roundness: 12,
};

export { colors };
