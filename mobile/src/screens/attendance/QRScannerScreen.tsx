import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Vibration } from 'react-native';
import { Text, useTheme, Button, IconButton, ActivityIndicator, Card, Avatar } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { attendanceAPI, idCardsAPI, staffAttendanceAPI } from '../../services/api';
import { AttendanceStackParamList } from '../../navigation/stacks/AttendanceStack';

type NavigationProp = NativeStackNavigationProp<AttendanceStackParamList>;

const { width } = Dimensions.get('window');

// Helper function to check if scanned data is a staff attendance token
const isStaffAttendanceToken = (data: string): boolean => {
    return typeof data === 'string' && data.startsWith('STAFF_ATT:');
};

interface StaffVerificationResult {
    success: boolean;
    message: string;
    action: 'check_in' | 'check_out';
    staff: {
        id: number;
        name: string;
        employee_id: string;
        designation: string;
        photo: string | null;
    };
    attendance: {
        date: string;
        status: string;
        check_in_time: string | null;
        check_out_time: string | null;
    };
}

const QRScannerScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [staffResult, setStaffResult] = useState<StaffVerificationResult | null>(null);
    const [showStaffResult, setShowStaffResult] = useState(false);

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        try {
            // Check if this is a staff attendance QR token
            if (isStaffAttendanceToken(data)) {
                // Handle staff attendance verification
                const result = await staffAttendanceAPI.verifyQRToken(data);

                // Vibrate for feedback
                Vibration.vibrate(200);

                if (result.success) {
                    setStaffResult(result);
                    setShowStaffResult(true);

                    Toast.show({
                        type: 'success',
                        text1: result.action === 'check_in' ? 'Check-In Successful' : 'Check-Out Successful',
                        text2: result.message,
                        visibilityTime: 4000,
                    });
                } else {
                    throw new Error(result.error || 'Verification failed');
                }
            } else {
                // Handle regular QR scans (student ID cards)
                const result = await idCardsAPI.verifyQR(data);

                if (result.valid) {
                    Vibration.vibrate(200);

                    Toast.show({
                        type: 'success',
                        text1: 'Verification Successful',
                        text2: `${result.name} - ${result.admission_number}`,
                    });

                    // Reset after 3 seconds for next scan
                    setTimeout(() => {
                        setScanned(false);
                        setLoading(false);
                    }, 3000);
                } else {
                    throw new Error('Invalid QR Code');
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || error.message || 'This QR code could not be verified.';

            Toast.show({
                type: 'error',
                text1: 'Scan Failed',
                text2: errorMessage,
            });

            setTimeout(() => {
                setScanned(false);
                setLoading(false);
            }, 3000);
        }
    };

    const handleScanAnother = () => {
        setStaffResult(null);
        setShowStaffResult(false);
        setScanned(false);
        setLoading(false);
    };

    if (!permission) {
        return <View style={styles.container}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Ionicons name="camera-outline" size={80} color={theme.colors.primary} />
                <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
                <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
                    Grant Permission
                </Button>
            </View>
        );
    }

    // Show staff verification result screen
    if (showStaffResult && staffResult) {
        return (
            <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
                <View style={styles.resultHeader}>
                    <IconButton
                        icon="close"
                        iconColor={theme.colors.onSurface}
                        size={28}
                        onPress={() => navigation.goBack()}
                    />
                </View>

                <View style={styles.resultContent}>
                    {/* Success Icon */}
                    <View style={[
                        styles.successIcon,
                        {
                            backgroundColor: staffResult.action === 'check_in'
                                ? theme.colors.primaryContainer
                                : theme.colors.secondaryContainer
                        }
                    ]}>
                        <Ionicons
                            name={staffResult.action === 'check_in' ? 'log-in-outline' : 'log-out-outline'}
                            size={60}
                            color={staffResult.action === 'check_in'
                                ? theme.colors.primary
                                : theme.colors.secondary
                            }
                        />
                    </View>

                    {/* Action Text */}
                    <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                        {staffResult.action === 'check_in' ? 'CHECK-IN' : 'CHECK-OUT'}
                    </Text>
                    <Text style={[styles.successText, { color: theme.colors.onSurface }]}>
                        Attendance Marked Successfully!
                    </Text>

                    {/* Staff Card */}
                    <Card style={[styles.staffCard, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
                        <Card.Content style={styles.staffCardContent}>
                            <Avatar.Icon
                                size={64}
                                icon="account"
                                style={{ backgroundColor: theme.colors.primary }}
                            />
                            <View style={styles.staffInfo}>
                                <Text style={[styles.staffName, { color: theme.colors.onSurface }]}>
                                    {staffResult.staff.name}
                                </Text>
                                <Text style={[styles.staffDetails, { color: theme.colors.onSurfaceVariant }]}>
                                    ID: {staffResult.staff.employee_id}
                                </Text>
                                <Text style={[styles.staffDetails, { color: theme.colors.onSurfaceVariant }]}>
                                    {staffResult.staff.designation}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Time Info */}
                    <View style={styles.timeContainer}>
                        <View style={styles.timeBlock}>
                            <Ionicons name="log-in" size={24} color={theme.colors.primary} />
                            <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Check-In
                            </Text>
                            <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                                {staffResult.attendance.check_in_time || '--:--'}
                            </Text>
                        </View>
                        <View style={[styles.timeDivider, { backgroundColor: theme.colors.outline }]} />
                        <View style={styles.timeBlock}>
                            <Ionicons name="log-out" size={24} color={theme.colors.secondary} />
                            <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Check-Out
                            </Text>
                            <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>
                                {staffResult.attendance.check_out_time || '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.resultActions}>
                    <Button
                        mode="contained"
                        onPress={handleScanAnother}
                        style={styles.scanAnotherButton}
                        contentStyle={styles.scanAnotherButtonContent}
                        icon="qrcode-scan"
                    >
                        Scan Another
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={() => navigation.goBack()}
                        style={styles.doneButton}
                    >
                        Done
                    </Button>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer}>
                        <View style={styles.scanTypeIndicator}>
                            <Ionicons name="scan-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.scanTypeText}>
                                Student ID or Staff Attendance
                            </Text>
                        </View>
                    </View>
                    <View style={styles.middleContainer}>
                        <View style={styles.unfocusedContainer}></View>
                        <View style={styles.focusedContainer}>
                            <View style={[styles.corner, styles.topLeftCorner, { borderColor: theme.colors.primary }]} />
                            <View style={[styles.corner, styles.topRightCorner, { borderColor: theme.colors.primary }]} />
                            <View style={[styles.corner, styles.bottomLeftCorner, { borderColor: theme.colors.primary }]} />
                            <View style={[styles.corner, styles.bottomRightCorner, { borderColor: theme.colors.primary }]} />
                            {loading && <ActivityIndicator color="#FFFFFF" size="large" />}
                        </View>
                        <View style={styles.unfocusedContainer}></View>
                    </View>
                    <View style={styles.unfocusedContainer}>
                        <Text style={styles.instructionText}>
                            {scanned ? 'Verifying...' : 'Position the QR code within the frame'}
                        </Text>
                    </View>
                </View>
            </CameraView>

            <View style={styles.bottomActions}>
                <IconButton
                    icon="close-circle"
                    iconColor="#FFFFFF"
                    size={40}
                    onPress={() => navigation.goBack()}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 40,
    },
    permissionButton: {
        borderRadius: 12,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    unfocusedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleContainer: {
        flexDirection: 'row',
        height: width * 0.7,
    },
    focusedContainer: {
        width: width * 0.7,
        height: width * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderWidth: 4,
    },
    topLeftCorner: { borderTopWidth: 4, borderLeftWidth: 4, top: 0, left: 0 },
    topRightCorner: { borderTopWidth: 4, borderRightWidth: 4, top: 0, right: 0 },
    bottomLeftCorner: { borderBottomWidth: 4, borderLeftWidth: 4, bottom: 0, left: 0 },
    bottomRightCorner: { borderBottomWidth: 4, borderRightWidth: 4, bottom: 0, right: 0 },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        overflow: 'hidden',
    },
    scanTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 20,
    },
    scanTypeText: {
        color: '#FFFFFF',
        fontSize: 13,
        marginLeft: 8,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
    },
    // Result screen styles
    resultContainer: {
        flex: 1,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
    },
    resultContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    successIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
    successText: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 24,
    },
    staffCard: {
        width: '100%',
        borderRadius: 16,
        marginBottom: 24,
    },
    staffCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    staffInfo: {
        marginLeft: 16,
        flex: 1,
    },
    staffName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    staffDetails: {
        fontSize: 14,
        marginTop: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
    },
    timeBlock: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    timeDivider: {
        width: 1,
        height: 60,
        marginHorizontal: 20,
    },
    timeLabel: {
        fontSize: 13,
        marginTop: 8,
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    resultActions: {
        paddingHorizontal: 24,
        paddingBottom: 30,
    },
    scanAnotherButton: {
        marginBottom: 12,
        borderRadius: 25,
    },
    scanAnotherButtonContent: {
        paddingVertical: 8,
    },
    doneButton: {
        borderRadius: 25,
    },
});

export default QRScannerScreen;
