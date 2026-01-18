import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, useTheme, Menu, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface DropdownProps {
    label: string;
    value: any;
    options: { label: string; value: any }[];
    onChange: (value: any) => void;
    style?: object;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
    label,
    value,
    options,
    onChange,
    style,
    disabled = false,
}) => {
    const theme = useTheme();
    const [visible, setVisible] = React.useState(false);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayLabel = selectedOption?.label || label;

    return (
        <View style={[styles.container, style]}>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchor={
                    <TouchableOpacity
                        onPress={() => !disabled && setVisible(true)}
                        style={[
                            styles.button,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.outline,
                                opacity: disabled ? 0.5 : 1,
                            }
                        ]}
                    >
                        <Text
                            style={[
                                styles.buttonText,
                                { color: value ? theme.colors.onSurface : '#9CA3AF' }
                            ]}
                            numberOfLines={1}
                        >
                            {displayLabel}
                        </Text>
                        <Ionicons
                            name={visible ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>
                }
                contentStyle={styles.menuContent}
            >
                <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                    {options.map((option) => (
                        <Menu.Item
                            key={String(option.value)}
                            onPress={() => {
                                onChange(option.value);
                                setVisible(false);
                            }}
                            title={option.label}
                            titleStyle={[
                                styles.menuItem,
                                option.value === value && { color: theme.colors.primary, fontWeight: '600' }
                            ]}
                        />
                    ))}
                </ScrollView>
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    menuContent: {
        marginTop: 45,
        borderRadius: 12,
        maxHeight: 300,
    },
    menuScroll: {
        maxHeight: 280,
    },
    menuItem: {
        fontSize: 14,
    },
});

export default Dropdown;
