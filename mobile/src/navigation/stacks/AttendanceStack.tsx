import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

// Attendance Screens
import MarkAttendanceScreen from '../../screens/attendance/MarkAttendanceScreen';
import AttendanceReportsScreen from '../../screens/attendance/AttendanceReportsScreen';
import QRScannerScreen from '../../screens/attendance/QRScannerScreen';
import AttendanceHistoryScreen from '../../screens/attendance/AttendanceHistoryScreen';

export type AttendanceStackParamList = {
    MarkAttendance: undefined;
    AttendanceReports: undefined;
    QRScanner: undefined;
    AttendanceHistory: { studentId?: number; classId?: number };
};

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

const AttendanceStack: React.FC = () => {
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
                name="MarkAttendance"
                component={MarkAttendanceScreen}
                options={{ title: 'Mark Attendance' }}
            />
            <Stack.Screen
                name="AttendanceReports"
                component={AttendanceReportsScreen}
                options={{ title: 'Reports' }}
            />
            <Stack.Screen
                name="QRScanner"
                component={QRScannerScreen}
                options={{ title: 'QR Scanner' }}
            />
            <Stack.Screen
                name="AttendanceHistory"
                component={AttendanceHistoryScreen}
                options={{ title: 'Attendance History' }}
            />
        </Stack.Navigator>
    );
};

export default AttendanceStack;
