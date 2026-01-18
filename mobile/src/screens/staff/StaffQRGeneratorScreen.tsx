import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, AppState, AppStateStatus } from 'react-native';
import { Text, useTheme, Button, Card, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { staffAttendanceAPI } from '../../services/api';

const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.65;
const TOKEN_EXPIRY_SECONDS = 90; // Must match backend TOKEN_EXPIRY_SECONDS

interface QRTokenData {
    token: string;
    expires_in: number;
    staff_name: string;
    employee_id: string;
    generated_at: string;
}

const StaffQRGeneratorScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [tokenData, setTokenData] = useState<QRTokenData | null>(null);
    const [countdown, setCountdown] = useState(TOKEN_EXPIRY_SECONDS);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const appStateRef = useRef(AppState.currentState);

    // Generate QR Token
    const generateToken = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await staffAttendanceAPI.generateQRToken();
            setTokenData(response);
            setCountdown(response.expires_in || TOKEN_EXPIRY_SECONDS);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Failed to generate QR code';
            setError(errorMessage);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Setup countdown timer
    useEffect(() => {
        if (tokenData && countdown > 0) {
            intervalRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [tokenData]);

    // Auto-refresh QR code when it expires
    useEffect(() => {
        if (countdown === 0 && tokenData) {
            // Token expired, auto-refresh
            generateToken();
        }
    }, [countdown, tokenData, generateToken]);

    // Setup auto-refresh every 60 seconds while screen is active
    useEffect(() => {
        if (tokenData) {
            refreshIntervalRef.current = setInterval(() => {
                generateToken();
            }, 60000); // Refresh every 60 seconds
        }

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [tokenData, generateToken]);

    // Handle app state changes (pause/resume)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App came to foreground, refresh token
                if (tokenData) {
                    generateToken();
                }
            }
            appStateRef.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [tokenData, generateToken]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // Format countdown time
    const formatCountdown = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get countdown color based on time remaining
    const getCountdownColor = (): string => {
        if (countdown <= 10) return theme.colors.error;
        if (countdown <= 30) return '#FF9800';
        return theme.colors.primary;
    };

    // Calculate progress for circular indicator
    const progress = tokenData ? countdown / (tokenData.expires_in || TOKEN_EXPIRY_SECONDS) : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <IconButton
                    icon="arrow-left"
                    size={24}
                    onPress={() => navigation.goBack()}
                    iconColor={theme.colors.onSurface}
                />
                <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                    My Attendance QR
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {!tokenData && !loading && !error && (
                    <View style={styles.startContainer}>
                        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Ionicons
                                name="qr-code-outline"
                                size={80}
                                color={theme.colors.primary}
                            />
                        </View>
                        <Text style={[styles.instructionTitle, { color: theme.colors.onSurface }]}>
                            Generate Your Attendance QR
                        </Text>
                        <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                            Tap the button below to generate a unique QR code for marking your attendance.
                            Show this QR to the school's scanner device.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={generateToken}
                            style={styles.generateButton}
                            contentStyle={styles.generateButtonContent}
                            labelStyle={styles.generateButtonLabel}
                            icon="qr-code"
                        >
                            Generate My QR
                        </Button>
                    </View>
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                            Generating secure QR code...
                        </Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.errorContainer}>
                        <Ionicons
                            name="alert-circle-outline"
                            size={60}
                            color={theme.colors.error}
                        />
                        <Text style={[styles.errorText, { color: theme.colors.error }]}>
                            {error}
                        </Text>
                        <Button
                            mode="contained"
                            onPress={generateToken}
                            style={styles.retryButton}
                        >
                            Try Again
                        </Button>
                    </View>
                )}

                {tokenData && !loading && (
                    <View style={styles.qrContainer}>
                        {/* Staff Info */}
                        <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]}>
                            <Card.Content style={styles.infoContent}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={40}
                                    color={theme.colors.primary}
                                />
                                <View style={styles.infoText}>
                                    <Text style={[styles.staffName, { color: theme.colors.onPrimaryContainer }]}>
                                        {tokenData.staff_name}
                                    </Text>
                                    <Text style={[styles.employeeId, { color: theme.colors.onPrimaryContainer }]}>
                                        ID: {tokenData.employee_id}
                                    </Text>
                                </View>
                            </Card.Content>
                        </Card>

                        {/* QR Code Card */}
                        <Card style={[styles.qrCard, { backgroundColor: '#FFFFFF' }]} elevation={4}>
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={tokenData.token}
                                    size={QR_SIZE}
                                    backgroundColor="#FFFFFF"
                                    color="#000000"
                                />
                            </View>
                        </Card>

                        {/* Countdown Timer */}
                        <View style={styles.countdownContainer}>
                            <View style={[styles.countdownCircle, { borderColor: getCountdownColor() }]}>
                                <Text style={[styles.countdownText, { color: getCountdownColor() }]}>
                                    {formatCountdown(countdown)}
                                </Text>
                            </View>
                            <Text style={[styles.countdownLabel, { color: theme.colors.onSurfaceVariant }]}>
                                {countdown <= 10
                                    ? 'Refreshing soon...'
                                    : 'Time until refresh'}
                            </Text>
                        </View>

                        {/* Info Text */}
                        <View style={styles.helpContainer}>
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                            />
                            <Text style={[styles.helpText, { color: theme.colors.onSurfaceVariant }]}>
                                This QR code auto-refreshes every minute for security.
                                Keep this screen active until scanned.
                            </Text>
                        </View>

                        {/* Manual Refresh Button */}
                        <Button
                            mode="outlined"
                            onPress={generateToken}
                            style={styles.refreshButton}
                            icon="refresh"
                        >
                            Refresh Now
                        </Button>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    startContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    instructionTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    instructionText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    generateButton: {
        borderRadius: 30,
        elevation: 3,
    },
    generateButtonContent: {
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    generateButtonLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        borderRadius: 25,
    },
    qrContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 10,
    },
    infoCard: {
        width: '100%',
        borderRadius: 16,
        marginBottom: 20,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: 12,
    },
    staffName: {
        fontSize: 18,
        fontWeight: '700',
    },
    employeeId: {
        fontSize: 14,
        marginTop: 2,
    },
    qrCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
    },
    qrWrapper: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    countdownCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    countdownText: {
        fontSize: 22,
        fontWeight: '700',
    },
    countdownLabel: {
        fontSize: 13,
    },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    helpText: {
        flex: 1,
        fontSize: 13,
        marginLeft: 8,
        lineHeight: 18,
    },
    refreshButton: {
        borderRadius: 25,
    },
});

export default StaffQRGeneratorScreen;
