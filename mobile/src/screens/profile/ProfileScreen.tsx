import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, useTheme, Card, List, Divider, Button } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen: React.FC = () => {
    const theme = useTheme();
    const { user, logout } = useAuth();

    const getInitials = () => {
        if (!user) return 'U';
        const name = user.full_name || user.first_name || 'User';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <Avatar.Text
                    size={100}
                    label={getInitials()}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{user?.full_name || 'User Name'}</Text>
                <Text style={styles.userRole}>{user?.roles?.[0]?.name || 'Staff'}</Text>
            </View>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <List.Item
                        title="Employee ID"
                        description={user?.username || 'N/A'}
                        left={props => <List.Icon {...props} icon="identifier" />}
                    />
                    <Divider />
                    <List.Item
                        title="Email Address"
                        description={user?.email || 'N/A'}
                        left={props => <List.Icon {...props} icon="email-outline" />}
                    />
                    <Divider />
                    <List.Item
                        title="Phone Number"
                        description={user?.phone || 'Not provided'}
                        left={props => <List.Icon {...props} icon="phone-outline" />}
                    />
                    <Divider />
                    <List.Item
                        title="Department"
                        description={user?.tenant_name || 'Main Campus'}
                        left={props => <List.Icon {...props} icon="office-building-outline" />}
                    />
                </Card>

                <Text style={styles.sectionTitle}>App Permissions</Text>
                <Card style={styles.card}>
                    <View style={styles.permissionsList}>
                        {user?.permissions?.slice(0, 5).map((perm, index) => (
                            <View key={index} style={styles.permissionItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={styles.permissionText}>{perm.replace(/_/g, ' ')}</Text>
                            </View>
                        )) || <Text style={styles.noPermissions}>No specific permissions listed</Text>}
                    </View>
                </Card>

                <Button
                    mode="outlined"
                    onPress={logout}
                    style={styles.logoutButton}
                    textColor="#EF4444"
                    icon="logout"
                >
                    Log Out
                </Button>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        alignItems: 'center',
        paddingVertical: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatar: {
        backgroundColor: '#FFFFFF66',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userRole: {
        fontSize: 14,
        color: '#FFFFFFCC',
        marginTop: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 15,
    },
    content: { padding: 15, marginTop: 10 },
    card: { borderRadius: 16, marginBottom: 20, elevation: 2, overflow: 'hidden' },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 10,
        marginLeft: 5,
    },
    permissionsList: { padding: 15 },
    permissionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    permissionText: { marginLeft: 10, fontSize: 14, color: '#4B5563', textTransform: 'capitalize' },
    noPermissions: { color: '#9CA3AF', fontStyle: 'italic' },
    logoutButton: {
        marginTop: 20,
        borderRadius: 12,
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
});

export default ProfileScreen;
