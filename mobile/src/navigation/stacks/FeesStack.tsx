import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

// Fees Screens
import CollectFeesScreen from '../../screens/fees/CollectFeesScreen';
import FeeHistoryScreen from '../../screens/fees/FeeHistoryScreen';
import FeeDefaultersScreen from '../../screens/fees/FeeDefaultersScreen';
import StudentLedgerScreen from '../../screens/fees/StudentLedgerScreen';
import PaymentReceiptScreen from '../../screens/fees/PaymentReceiptScreen';

export type FeesStackParamList = {
    CollectFees: undefined;
    FeeHistory: undefined;
    FeeDefaulters: undefined;
    StudentLedger: { studentId: number };
    PaymentReceipt: { paymentId: number };
};

const Stack = createNativeStackNavigator<FeesStackParamList>();

const FeesStack: React.FC = () => {
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
                name="CollectFees"
                component={CollectFeesScreen}
                options={{ title: 'Collect Fees' }}
            />
            <Stack.Screen
                name="FeeHistory"
                component={FeeHistoryScreen}
                options={{ title: 'Payment History' }}
            />
            <Stack.Screen
                name="FeeDefaulters"
                component={FeeDefaultersScreen}
                options={{ title: 'Fee Defaulters' }}
            />
            <Stack.Screen
                name="StudentLedger"
                component={StudentLedgerScreen}
                options={{ title: 'Student Ledger' }}
            />
            <Stack.Screen
                name="PaymentReceipt"
                component={PaymentReceiptScreen}
                options={{ title: 'Payment Receipt' }}
            />
        </Stack.Navigator>
    );
};

export default FeesStack;
