import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

// Student Screens
import StudentListScreen from '../../screens/students/StudentListScreen';
import StudentDetailScreen from '../../screens/students/StudentDetailScreen';
import AddStudentScreen from '../../screens/students/AddStudentScreen';
import EditStudentScreen from '../../screens/students/EditStudentScreen';
import StudentDocumentsScreen from '../../screens/students/StudentDocumentsScreen';
import StudentRemarksScreen from '../../screens/students/StudentRemarksScreen';

export type StudentsStackParamList = {
    StudentList: undefined;
    StudentDetail: { studentId: number };
    AddStudent: undefined;
    EditStudent: { studentId: number };
    StudentDocuments: { studentId: number };
    StudentRemarks: { studentId: number };
};

const Stack = createNativeStackNavigator<StudentsStackParamList>();

const StudentsStack: React.FC = () => {
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
                name="StudentList"
                component={StudentListScreen}
                options={{ title: 'Students' }}
            />
            <Stack.Screen
                name="StudentDetail"
                component={StudentDetailScreen}
                options={{ title: 'Student Details' }}
            />
            <Stack.Screen
                name="AddStudent"
                component={AddStudentScreen}
                options={{ title: 'Add Student' }}
            />
            <Stack.Screen
                name="EditStudent"
                component={EditStudentScreen}
                options={{ title: 'Edit Student' }}
            />
            <Stack.Screen
                name="StudentDocuments"
                component={StudentDocumentsScreen}
                options={{ title: 'Documents' }}
            />
            <Stack.Screen
                name="StudentRemarks"
                component={StudentRemarksScreen}
                options={{ title: 'Remarks' }}
            />
        </Stack.Navigator>
    );
};

export default StudentsStack;
