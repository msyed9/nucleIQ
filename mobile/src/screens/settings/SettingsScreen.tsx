import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { Text, Card, List, useTheme, Divider, Button, IconButton, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

const SettingsScreen: React.FC = () => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useCustomTheme();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: logout, style: 'destructive' },
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* User Profile Summary */}
            <View style={[styles.profileSection, { backgroundColor: theme.colors.primary }]}>
                <Avatar.Text
                    size={80}
                    label={user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                    style={styles.avatar}
                />
                <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <View style={styles.roleChip}>
                    <Text style={styles.roleText}>{user?.roles?.[0]?.name || 'Staff'}</Text>
                </View>
            </View>

            <View style={styles.content}>
                {/* App Settings */}
                <Text style={styles.sectionTitle}>App Settings</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Dark Mode"
                        description="Toggle between light and dark themes"
                        left={props => <List.Icon {...props} icon="theme-light-dark" />}
                        right={() => (
                            <Switch value={isDark} onValueChange={toggleTheme} />
                        )}
                    />
                    <Divider />
                    <List.Item
                        title="Push Notifications"
                        description="Receive alerts and updates"
                        left={props => <List.Icon {...props} icon="notifications-outline" />}
                        right={() => (
                            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
                        )}
                    />
                </Card>

                {/* Account Settings */}
                <Text style={styles.sectionTitle}>Account</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Change Password"
                        left={props => <List.Icon {...props} icon="lock-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => { }}
                    />
                    <Divider />
                    <List.Item
                        title="Privacy Policy"
                        left={props => <List.Icon {...props} icon="shield-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => { }}
                    />
                    <Divider />
                    <List.Item
                        title="Terms of Service"
                        left={props => <List.Icon {...props} icon="document-text-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => { }}
                    />
                </Card>

                {/* About Section */}
                <Text style={styles.sectionTitle}>About</Text>
                <Card style={styles.card}>
                    <List.Item
                        title="Version"
                        description="1.0.0 (Build 124)"
                        left={props => <List.Icon {...props} icon="information-outline" />}
                    />
                    <Divider />
                    <List.Item
                        title="Check for Updates"
                        left={props => <List.Icon {...props} icon="refresh" />}
                        onPress={() => {
                            Toast.show({
                                type: 'info',
                                text1: 'App is up to date',
                                text2: 'You are using the latest version.',
                            });
                        }}
                    />
                </Card>

                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    textColor={theme.colors.error}
                    icon="logout"
                >
                    Logout
                </Button>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by NucleiQ</Text>
                </View>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        padding: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 4,
    },
    avatar: {
        backgroundColor: '#FFFFFF66',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    userEmail: {
        fontSize: 14,
        color: '#FFFFFFCC',
        marginTop: 4,
    },
    roleChip: {
        backgroundColor: '#FFFFFF33',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 12,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 15,
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 10,
        marginTop: 15,
        marginLeft: 5,
    },
    card: {
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
    },
    logoutButton: {
        marginTop: 30,
        borderColor: '#EF4444',
        borderRadius: 12,
        borderWidth: 1.5,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: '#9CA3AF',
        fontSize: 12,
    },
});

export default SettingsScreen;
