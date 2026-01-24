import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Dimensions,
} from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
    const theme = useTheme();
    const { login } = useAuth();

    // Using 'username' to support both email and phone number
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

    const validateForm = () => {
        const newErrors: { username?: string; password?: string } = {};

        if (!username.trim()) {
            newErrors.username = 'Email or phone number is required';
        }
        // Allow both email format and phone number format
        // No strict email validation since phone numbers are also valid

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Use unified login with username (email or phone)
            await login({ email: username.trim(), password });
            Toast.show({
                type: 'success',
                text1: 'Welcome back!',
                text2: 'Login successful',
            });
        } catch (error: any) {
            const message = error.response?.data?.detail ||
                error.response?.data?.non_field_errors?.[0] ||
                'Login failed. Please check your credentials.';
            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1E3A5F', '#0D1B2A']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="school" size={60} color="#FFFFFF" />
                        </View>
                        <Text style={styles.appName}>NucleiQ</Text>
                        <Text style={styles.tagline}>School Management Made Simple</Text>
                    </View>

                    {/* Login Form */}
                    <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.welcomeText, { color: theme.colors.primary }]}>
                            Welcome Back
                        </Text>
                        <Text style={styles.signInText}>Sign in to continue</Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                label="Email or Mobile Number"
                                value={username}
                                onChangeText={(text) => {
                                    setUsername(text);
                                    if (errors.username) setErrors({ ...errors, username: undefined });
                                }}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                left={<TextInput.Icon icon="account" />}
                                error={!!errors.username}
                                style={styles.input}
                                outlineStyle={styles.inputOutline}
                                placeholder="Enter email or phone number"
                            />
                            {errors.username && (
                                <HelperText type="error" visible={!!errors.username}>
                                    {errors.username}
                                </HelperText>
                            )}

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errors.password) setErrors({ ...errors, password: undefined });
                                }}
                                mode="outlined"
                                secureTextEntry={!showPassword}
                                left={<TextInput.Icon icon="lock" />}
                                right={
                                    <TextInput.Icon
                                        icon={showPassword ? 'eye-off' : 'eye'}
                                        onPress={() => setShowPassword(!showPassword)}
                                    />
                                }
                                error={!!errors.password}
                                style={[styles.input, { marginTop: 10 }]}
                                outlineStyle={styles.inputOutline}
                            />
                            {errors.password && (
                                <HelperText type="error" visible={!!errors.password}>
                                    {errors.password}
                                </HelperText>
                            )}
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={isLoading}
                            style={styles.loginButton}
                            contentStyle={styles.loginButtonContent}
                            labelStyle={styles.loginButtonLabel}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>

                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Powered by NucleiQ</Text>
                        <Text style={styles.versionText}>Version 1.0.0</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    appName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 5,
    },
    formContainer: {
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    signInText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 25,
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: 'transparent',
    },
    inputOutline: {
        borderRadius: 12,
    },
    loginButton: {
        borderRadius: 12,
        marginTop: 10,
    },
    loginButtonContent: {
        height: 50,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    forgotPassword: {
        textAlign: 'center',
        marginTop: 20,
        color: '#6B7280',
        fontSize: 14,
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    versionText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        marginTop: 5,
    },
});

export default LoginScreen;
