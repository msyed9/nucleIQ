import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

// Dashboard Screens
import DashboardScreen from '../../screens/dashboard/DashboardScreen';
import NotificationsScreen from '../../screens/dashboard/NotificationsScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';

export type DashboardStackParamList = {
    Dashboard: undefined;
    Notifications: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

const DashboardStack: React.FC = () => {
    const theme = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        >
            <Stack.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ title: 'NucleiQ' }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: 'Notifications' }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'My Profile' }}
            />
        </Stack.Navigator>
    );
};

export default DashboardStack;
