/**
 * Website Editor Screen - Mobile
 * Edit website instance with section management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
    Dimensions,
} from 'react-native';
import { cmsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface Section {
    id?: string;
    component_type: string;
    title: string;
    content: any;
    order: number;
    is_visible: boolean;
    background_color?: string;
    text_color?: string;
}

interface Page {
    title: string;
    slug: string;
    page_type: string;
    sections: Section[];
}

interface WebsiteInstance {
    id: number;
    name: string;
    source_template_name: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    custom_structure: { pages: Page[] };
    effective_structure: { pages: Page[] };
    effective_theme: any;
    is_published: boolean;
    status: string;
}

interface SectionType {
    type: string;
    label: string;
    icon: string;
    description: string;
}

const WebsiteEditorScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
    const { instanceId } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [instance, setInstance] = useState<WebsiteInstance | null>(null);
    const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [selectedSection, setSelectedSection] = useState<number | null>(null);
    const [showAddSection, setShowAddSection] = useState(false);
    const [showEditSection, setShowEditSection] = useState(false);
    const [editContent, setEditContent] = useState<any>({});
    const [showThemeModal, setShowThemeModal] = useState(false);

    useEffect(() => {
        loadData();
    }, [instanceId]);

    const loadData = async () => {
        try {
            const [instanceRes, sectionTypesRes] = await Promise.all([
                cmsAPI.getInstanceById(instanceId),
                cmsAPI.getSectionTypes(),
            ]);
            setInstance(instanceRes);
            setSectionTypes(sectionTypesRes);
        } catch (error) {
            console.error('Failed to load instance:', error);
            Alert.alert('Error', 'Failed to load website');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPage = (): Page | null => {
        if (!instance) return null;
        const structure = instance.custom_structure || instance.effective_structure;
        return structure?.pages?.[currentPageIndex] || null;
    };

    const handleAddSection = async (sectionType: string) => {
        if (!instance) return;

        setSaving(true);
        try {
            const response = await cmsAPI.addSection(instance.id, {
                page_index: currentPageIndex,
                section_type: sectionType,
                title: `New ${sectionType} Section`,
                content: getDefaultContent(sectionType),
            });
            setInstance(response);
            setShowAddSection(false);
        } catch (error) {
            console.error('Failed to add section:', error);
            Alert.alert('Error', 'Failed to add section');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSection = async (sectionIndex: number) => {
        if (!instance) return;

        Alert.alert(
            'Delete Section',
            'Are you sure you want to delete this section?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setSaving(true);
                        try {
                            const response = await cmsAPI.deleteSection(
                                instance.id,
                                currentPageIndex,
                                sectionIndex
                            );
                            setInstance(response);
                            setSelectedSection(null);
                        } catch (error) {
                            console.error('Failed to delete section:', error);
                            Alert.alert('Error', 'Failed to delete section');
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const handleUpdateSection = async () => {
        if (!instance || selectedSection === null) return;

        setSaving(true);
        try {
            const response = await cmsAPI.updateSection(instance.id, {
                page_index: currentPageIndex,
                section_index: selectedSection,
                updates: { content: editContent },
            });
            setInstance(response);
            setShowEditSection(false);
            setSelectedSection(null);
        } catch (error) {
            console.error('Failed to update section:', error);
            Alert.alert('Error', 'Failed to update section');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVisibility = async (sectionIndex: number) => {
        if (!instance) return;
        const page = getCurrentPage();
        if (!page) return;

        const section = page.sections[sectionIndex];
        setSaving(true);
        try {
            const response = await cmsAPI.updateSection(instance.id, {
                page_index: currentPageIndex,
                section_index: sectionIndex,
                updates: { is_visible: !section.is_visible },
            });
            setInstance(response);
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!instance) return;

        setSaving(true);
        try {
            if (instance.is_published) {
                await cmsAPI.unpublishInstance(instance.id);
            } else {
                await cmsAPI.publishInstance(instance.id);
            }
            loadData();
        } catch (error) {
            console.error('Failed to toggle publish:', error);
            Alert.alert('Error', 'Failed to update publish status');
        } finally {
            setSaving(false);
        }
    };

    const getDefaultContent = (type: string) => {
        const defaults: Record<string, any> = {
            HERO: { heading: 'Welcome', subheading: 'Description', buttonText: 'Learn More', buttonLink: '/about' },
            PAGE_HEADER: { heading: 'Page Title', breadcrumb: 'Home > Page' },
            CONTACT: { address: 'Address', phone: 'Phone', email: 'email@example.com' },
            CTA: { heading: 'Call to Action', subheading: 'Subtitle', buttonText: 'Click Here' },
            FEATURES: { heading: 'Features', features: [{ icon: '⭐', title: 'Feature', description: 'Description' }] },
            STATS: { stats: [{ value: '100+', label: 'Label' }] },
        };
        return defaults[type] || {};
    };

    const openEditSection = (index: number) => {
        const page = getCurrentPage();
        if (page?.sections?.[index]) {
            setSelectedSection(index);
            setEditContent(page.sections[index].content || {});
            setShowEditSection(true);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading Editor...</Text>
            </View>
        );
    }

    const currentPage = getCurrentPage();
    const structure = instance?.custom_structure || instance?.effective_structure;
    const theme = instance?.effective_theme || {};

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Back</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{instance?.name}</Text>
                    {saving && <Text style={styles.savingText}>Saving...</Text>}
                </View>
                <TouchableOpacity
                    style={[styles.publishBtn, instance?.is_published && styles.unpublishBtn]}
                    onPress={handlePublish}
                >
                    <Text style={styles.publishBtnText}>
                        {instance?.is_published ? '📤' : '🚀'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Page Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pageTabs}>
                {structure?.pages?.map((page, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[styles.pageTab, idx === currentPageIndex && styles.pageTabActive]}
                        onPress={() => setCurrentPageIndex(idx)}
                    >
                        <Text style={[styles.pageTabText, idx === currentPageIndex && styles.pageTabTextActive]}>
                            {page.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Sections */}
            <ScrollView style={styles.sectionsContainer}>
                {currentPage?.sections?.map((section, idx) => (
                    <View key={section.id || idx} style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionBadge, { backgroundColor: theme.primary_color || '#2563eb' }]}>
                                <Text style={styles.sectionBadgeText}>{section.component_type}</Text>
                            </View>
                            <View style={styles.sectionActions}>
                                <TouchableOpacity onPress={() => handleToggleVisibility(idx)}>
                                    <Text style={styles.sectionActionIcon}>
                                        {section.is_visible !== false ? '👁️' : '🙈'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openEditSection(idx)}>
                                    <Text style={styles.sectionActionIcon}>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteSection(idx)}>
                                    <Text style={styles.sectionActionIcon}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <SectionPreview section={section} theme={theme} />
                    </View>
                ))}

                {/* Add Section Button */}
                <TouchableOpacity
                    style={styles.addSectionBtn}
                    onPress={() => setShowAddSection(true)}
                >
                    <Text style={styles.addSectionBtnText}>+ Add Section</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Theme Button */}
            <TouchableOpacity
                style={styles.themeBtn}
                onPress={() => setShowThemeModal(true)}
            >
                <Text style={styles.themeBtnText}>🎨</Text>
            </TouchableOpacity>

            {/* Add Section Modal */}
            <Modal
                visible={showAddSection}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddSection(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Section</Text>
                            <TouchableOpacity onPress={() => setShowAddSection(false)}>
                                <Text style={styles.modalClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.sectionTypesList}>
                            {sectionTypes.map(st => (
                                <TouchableOpacity
                                    key={st.type}
                                    style={styles.sectionTypeItem}
                                    onPress={() => handleAddSection(st.type)}
                                >
                                    <Text style={styles.sectionTypeIcon}>{st.icon}</Text>
                                    <View style={styles.sectionTypeInfo}>
                                        <Text style={styles.sectionTypeLabel}>{st.label}</Text>
                                        <Text style={styles.sectionTypeDesc}>{st.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Section Modal */}
            <Modal
                visible={showEditSection}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditSection(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Section</Text>
                            <TouchableOpacity onPress={() => setShowEditSection(false)}>
                                <Text style={styles.modalClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.editForm}>
                            {Object.keys(editContent).map(key => {
                                if (typeof editContent[key] === 'string') {
                                    return (
                                        <View key={key} style={styles.formField}>
                                            <Text style={styles.formLabel}>{key}</Text>
                                            <TextInput
                                                style={styles.formInput}
                                                value={editContent[key]}
                                                onChangeText={(text) =>
                                                    setEditContent({ ...editContent, [key]: text })
                                                }
                                                multiline={key.includes('heading') || key.includes('text')}
                                            />
                                        </View>
                                    );
                                }
                                return null;
                            })}
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleUpdateSection}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.saveBtnText}>💾 Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Theme Modal */}
            <Modal
                visible={showThemeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowThemeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Theme Settings</Text>
                            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                                <Text style={styles.modalClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.themePreview}>
                            <Text style={styles.themeLabel}>Current Colors:</Text>
                            <View style={styles.colorRow}>
                                <View style={[styles.colorBox, { backgroundColor: theme.primary_color || '#2563eb' }]}>
                                    <Text style={styles.colorBoxText}>Primary</Text>
                                </View>
                                <View style={[styles.colorBox, { backgroundColor: theme.secondary_color || '#1e40af' }]}>
                                    <Text style={styles.colorBoxText}>Secondary</Text>
                                </View>
                                <View style={[styles.colorBox, { backgroundColor: theme.accent_color || '#60a5fa' }]}>
                                    <Text style={styles.colorBoxText}>Accent</Text>
                                </View>
                            </View>
                            <Text style={styles.themeNote}>
                                💡 Use the web editor for full theme customization
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Section Preview Component
const SectionPreview: React.FC<{ section: Section; theme: any }> = ({ section, theme }) => {
    const { component_type, content, background_color, text_color } = section;

    const style = {
        backgroundColor: background_color || '#f8fafc',
        padding: 16,
        borderRadius: 8,
    };

    switch (component_type) {
        case 'HERO':
            return (
                <View style={style}>
                    <Text style={[styles.previewHeading, text_color ? { color: text_color } : {}]}>
                        {content.heading}
                    </Text>
                    <Text style={[styles.previewText, text_color ? { color: text_color } : {}]}>
                        {content.subheading}
                    </Text>
                    {content.buttonText && (
                        <View style={[styles.previewBtn, { backgroundColor: theme.accent_color || '#60a5fa' }]}>
                            <Text style={styles.previewBtnText}>{content.buttonText}</Text>
                        </View>
                    )}
                </View>
            );
        case 'PAGE_HEADER':
            return (
                <View style={style}>
                    <Text style={[styles.previewHeading, text_color ? { color: text_color } : {}]}>
                        {content.heading}
                    </Text>
                    <Text style={styles.previewBreadcrumb}>{content.breadcrumb}</Text>
                </View>
            );
        case 'CONTACT':
            return (
                <View style={style}>
                    <Text style={styles.previewText}>📍 {content.address}</Text>
                    <Text style={styles.previewText}>📞 {content.phone}</Text>
                    <Text style={styles.previewText}>✉️ {content.email}</Text>
                </View>
            );
        case 'CTA':
            return (
                <View style={style}>
                    <Text style={[styles.previewHeading, text_color ? { color: text_color } : {}]}>
                        {content.heading}
                    </Text>
                    <Text style={[styles.previewText, text_color ? { color: text_color } : {}]}>
                        {content.subheading}
                    </Text>
                </View>
            );
        case 'STATS':
            return (
                <View style={[style, styles.statsRow]}>
                    {content.stats?.slice(0, 3).map((s: any, i: number) => (
                        <View key={i} style={styles.statItem}>
                            <Text style={[styles.statValue, { color: theme.primary_color }]}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            );
        default:
            return (
                <View style={style}>
                    <Text style={styles.previewText}>{component_type} Section</Text>
                </View>
            );
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 48,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        color: '#2563eb',
        fontSize: 16,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    savingText: {
        fontSize: 12,
        color: '#f59e0b',
    },
    publishBtn: {
        backgroundColor: '#2563eb',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unpublishBtn: {
        backgroundColor: '#f59e0b',
    },
    publishBtnText: {
        fontSize: 18,
    },
    pageTabs: {
        backgroundColor: '#fff',
        maxHeight: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    pageTab: {
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    pageTabActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
    },
    pageTabText: {
        color: '#64748b',
        fontSize: 14,
    },
    pageTabTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    sectionsContainer: {
        flex: 1,
        padding: 16,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    sectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    sectionBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    sectionActions: {
        flexDirection: 'row',
        gap: 12,
    },
    sectionActionIcon: {
        fontSize: 18,
    },
    addSectionBtn: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    addSectionBtnText: {
        color: '#64748b',
        fontSize: 16,
    },
    themeBtn: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    themeBtnText: {
        fontSize: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    modalClose: {
        fontSize: 28,
        color: '#64748b',
    },
    sectionTypesList: {
        padding: 16,
    },
    sectionTypeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        marginBottom: 8,
    },
    sectionTypeIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    sectionTypeInfo: {
        flex: 1,
    },
    sectionTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    sectionTypeDesc: {
        fontSize: 12,
        color: '#64748b',
    },
    editForm: {
        padding: 20,
    },
    formField: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'capitalize',
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    saveBtn: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    themePreview: {
        padding: 20,
    },
    themeLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 12,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    colorBox: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    colorBoxText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    themeNote: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    previewHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    previewText: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    previewBreadcrumb: {
        fontSize: 12,
        color: '#94a3b8',
    },
    previewBtn: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    previewBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
    },
});

export default WebsiteEditorScreen;
