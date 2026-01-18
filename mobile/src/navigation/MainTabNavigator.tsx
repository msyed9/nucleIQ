import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Import Stack Navigators for each module
import DashboardStack from './stacks/DashboardStack';
import StudentsStack from './stacks/StudentsStack';
import AttendanceStack from './stacks/AttendanceStack';
import FeesStack from './stacks/FeesStack';
import MoreStack from './stacks/MoreStack';

// Custom Drawer Content
import CustomDrawerContent from '../components/navigation/CustomDrawerContent';

export type MainTabParamList = {
    DashboardTab: undefined;
    StudentsTab: undefined;
    AttendanceTab: undefined;
    FeesTab: undefined;
    MoreTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

const MainTabs: React.FC = () => {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: '#6B7280',
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.outline,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 65,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    switch (route.name) {
                        case 'DashboardTab':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'StudentsTab':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case 'AttendanceTab':
                            iconName = focused ? 'calendar' : 'calendar-outline';
                            break;
                        case 'FeesTab':
                            iconName = focused ? 'wallet' : 'wallet-outline';
                            break;
                        case 'MoreTab':
                            iconName = focused ? 'grid' : 'grid-outline';
                            break;
                    }

                    return <Ionicons name={iconName} size={24} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="DashboardTab"
                component={DashboardStack}
                options={{ tabBarLabel: 'Dashboard' }}
            />
            <Tab.Screen
                name="StudentsTab"
                component={StudentsStack}
                options={{ tabBarLabel: 'Students' }}
            />
            <Tab.Screen
                name="AttendanceTab"
                component={AttendanceStack}
                options={{ tabBarLabel: 'Attendance' }}
            />
            <Tab.Screen
                name="FeesTab"
                component={FeesStack}
                options={{ tabBarLabel: 'Fees' }}
            />
            <Tab.Screen
                name="MoreTab"
                component={MoreStack}
                options={{ tabBarLabel: 'More' }}
            />
        </Tab.Navigator>
    );
};

const MainTabNavigator: React.FC = () => {
    const theme = useTheme();

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    backgroundColor: theme.colors.surface,
                    width: 280,
                },
                drawerActiveTintColor: theme.colors.primary,
                drawerInactiveTintColor: theme.colors.onSurface,
            }}
        >
            <Drawer.Screen name="MainTabs" component={MainTabs} />
        </Drawer.Navigator>
    );
};

export default MainTabNavigator;
