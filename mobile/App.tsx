import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { customTheme, customDarkTheme } from './src/theme/paperTheme';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
        },
    },
});

function AppContent() {
    const { isDark } = useTheme();
    const paperTheme = isDark ? customDarkTheme : customTheme;

    return (
        <PaperProvider theme={paperTheme}>
            <NavigationContainer>
                <AuthProvider>
                    <RootNavigator />
                    <StatusBar style={isDark ? 'light' : 'dark'} />
                </AuthProvider>
            </NavigationContainer>
            <Toast />
        </PaperProvider>
    );
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
